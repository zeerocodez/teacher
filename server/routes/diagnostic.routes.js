import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db.js';
import { createNotification, sanitizeText } from '../utils.js';
import { publicActionRateLimiter } from '../middleware/limiters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Load diagnostic bank from disk
function loadDiagnosticBank() {
  try {
    const filePath = path.join(__dirname, '..', 'data', 'diagnostic_bank.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Failed to read diagnostic_bank.json, falling back:", err);
  }
  return [];
}

const CURRICULA_OPTIONS = [
  "Cambridge IGCSE",
  "WAEC / NECO",
  "British National Curriculum",
  "American SAT / AP",
  "Edexcel International"
];

const SUBJECTS_OPTIONS = [
  "Mathematics",
  "English & Language Arts",
  "Sciences (Physics/Chemistry/Biology)",
  "Computational Logic & Tech"
];

const GRADE_BANDS = [
  "Grade 4-6 (Primary/Lower Middle)",
  "Grade 7-9 (KS3/Lower IGCSE)",
  "Grade 10-12 (SS1-SS3/WAEC/SAT)"
];

/**
 * GET /api/diagnostic/curricula-subjects
 */
router.get('/curricula-subjects', publicActionRateLimiter, (req, res) => {
  res.json({
    curricula: CURRICULA_OPTIONS,
    subjects: SUBJECTS_OPTIONS,
    gradeBands: GRADE_BANDS
  });
});

/**
 * GET /api/diagnostic/quiz
 * Retrieve randomized/curated diagnostic questions (excluding answers)
 */
router.get('/quiz', publicActionRateLimiter, (req, res) => {
  try {
    const { curriculum, subject, gradeBand, limit = 8 } = req.query;
    const bank = loadDiagnosticBank();

    let filtered = bank;
    if (curriculum) {
      filtered = filtered.filter(q => q.curriculum.toLowerCase().includes(curriculum.toLowerCase()) || curriculum.toLowerCase().includes(q.curriculum.toLowerCase()));
    }
    if (subject) {
      filtered = filtered.filter(q => q.subject.toLowerCase().includes(subject.toLowerCase()) || subject.toLowerCase().includes(q.subject.toLowerCase()));
    }
    if (gradeBand) {
      filtered = filtered.filter(q => q.gradeBand.toLowerCase().includes(gradeBand.toLowerCase()) || gradeBand.toLowerCase().includes(q.gradeBand.toLowerCase()));
    }

    // If filter is too restrictive, provide all questions from the same subject or bank
    if (filtered.length < 3) {
      filtered = subject ? bank.filter(q => q.subject.toLowerCase().includes(subject.toLowerCase())) : bank;
    }
    if (filtered.length === 0) {
      filtered = bank;
    }

    // Shuffle and limit
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, parseInt(limit, 10) || 8);

    // Strip answers and explanations for anti-cheat
    const safeQuestions = selected.map(q => ({
      id: q.id,
      curriculum: q.curriculum,
      subject: q.subject,
      gradeBand: q.gradeBand,
      topic: q.topic,
      subSkill: q.subSkill,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options
    }));

    return res.json({
      success: true,
      count: safeQuestions.length,
      curriculum: curriculum || "General Diagnostic",
      subject: subject || "Comprehensive",
      gradeBand: gradeBand || "Standard",
      questions: safeQuestions
    });
  } catch (err) {
    console.error("Diagnostic quiz generation error:", err);
    return res.status(500).json({ error: "Failed to load diagnostic quiz." });
  }
});

/**
 * POST /api/diagnostic/evaluate
 * Grade quiz submission, evaluate sub-skill mastery, generate placement and roadmap
 */
router.post('/evaluate', publicActionRateLimiter, async (req, res) => {
  try {
    const {
      studentId = 'guest_student',
      studentName = 'Student',
      parentId = null,
      parentEmail = null,
      curriculum = 'Cambridge IGCSE',
      subject = 'Mathematics',
      gradeBand = 'Grade 7-9 (KS3/Lower IGCSE)',
      answers = [] // [{ questionId, selectedIndex, timeSpentSeconds }]
    } = req.body;

    const safeStudentName = sanitizeText(studentName || 'Student');
    const safeCurriculum = sanitizeText(curriculum || 'Cambridge IGCSE');
    const safeSubject = sanitizeText(subject || 'Mathematics');
    const safeGradeBand = sanitizeText(gradeBand || 'Standard');

    const bank = loadDiagnosticBank();
    const bankMap = new Map(bank.map(q => [q.id, q]));

    let correctCount = 0;
    const subSkillStats = {};
    const knowledgeGaps = [];
    const detailedResults = [];

    answers.forEach((ans) => {
      const q = bankMap.get(ans.questionId);
      if (!q) return;

      const isCorrect = ans.selectedIndex === q.correctIndex;
      if (isCorrect) correctCount++;

      // Track sub-skill stats
      const skillName = q.subSkill || q.topic || 'General Problem Solving';
      if (!subSkillStats[skillName]) {
        subSkillStats[skillName] = { correct: 0, total: 0, topic: q.topic };
      }
      subSkillStats[skillName].total++;
      if (isCorrect) subSkillStats[skillName].correct++;

      // Identify Knowledge Gaps
      if (!isCorrect) {
        knowledgeGaps.push({
          questionId: q.id,
          topic: q.topic,
          subSkill: q.subSkill,
          question: q.question,
          studentChoice: q.options[ans.selectedIndex] || 'Skipped',
          correctChoice: q.options[q.correctIndex],
          explanation: q.explanation,
          remediation: q.gapRemediation || `Review foundational theory for ${q.subSkill}.`
        });
      }

      detailedResults.push({
        questionId: q.id,
        isCorrect,
        topic: q.topic,
        subSkill: q.subSkill,
        explanation: q.explanation
      });
    });

    const totalQuestions = answers.length || 1;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);

    // Compute Sub-Skill Mastery Breakdown
    const subSkillBreakdown = Object.entries(subSkillStats).map(([skill, stat]) => {
      const pct = Math.round((stat.correct / stat.total) * 100);
      let status = 'Mastered';
      if (pct < 50) status = 'Needs Attention';
      else if (pct < 80) status = 'Developing';

      return {
        subSkill: skill,
        topic: stat.topic,
        correct: stat.correct,
        total: stat.total,
        percentage: pct,
        status
      };
    });

    // Determine Placement Tier
    let placementLevel = '';
    let placementTitle = '';
    let placementSummary = '';

    if (scorePercent >= 85) {
      placementLevel = 'Level 4 // Exam-Mastery Elite';
      placementTitle = 'Olympiad & Distinction Readiness';
      placementSummary = `Exceptional mastery across ${curriculum} benchmarks. Ready for accelerated advanced problem sets, past-paper timed drills, and distinction-grade enrichment.`;
    } else if (scorePercent >= 70) {
      placementLevel = 'Level 3 // Advanced Scholar';
      placementTitle = 'Solid Foundation & Higher Application Candidate';
      placementSummary = `Strong conceptual grasp of core syllabus topics. Ready to convert solid working knowledge into top A*/A grades with structured mock drills.`;
    } else if (scorePercent >= 50) {
      placementLevel = 'Level 2 // Core Competence';
      placementTitle = 'Targeted Reinforcement Candidate';
      placementSummary = `Grasps foundational rules but shows specific sub-skill gaps in complex problem transposition and multi-step questions. Recommend targeted weekly tutoring.`;
    } else {
      placementLevel = 'Level 1 // Foundational Catch-up';
      placementTitle = 'Intensive Prerequisite Scaffolding Required';
      placementSummary = `Significant gaps detected in prerequisite baseline concepts. Immediate 1-on-1 tutoring recommended to rebuild syllabus confidence before advancing.`;
    }

    // Generate Dynamic 8-Week Personalized Learning Roadmap
    const primaryGaps = knowledgeGaps.map(g => g.subSkill).slice(0, 3);
    const gapTopicsText = primaryGaps.length > 0 ? primaryGaps.join(', ') : 'Advanced Concept Synthesis';

    const learningRoadmap = [
      {
        phase: 'Weeks 1-2',
        title: 'Diagnostic Remediation & Prerequisite Scaffolding',
        focus: `Repair identified gaps in: ${gapTopicsText}.`,
        deliverables: ['Baseline score calibration', '1-on-1 step-by-step concept drills', 'Mini-formative diagnostic check']
      },
      {
        phase: 'Weeks 3-4',
        title: 'Core Syllabus Mastery & Fluency Drills',
        focus: `Deepen procedural accuracy in ${subject} with targeted practice problem sets.`,
        deliverables: ['Mid-term formative quiz', 'Homework review log', 'Bi-weekly progress report to parents']
      },
      {
        phase: 'Weeks 5-6',
        title: 'Higher-Order Application & Timed Drills',
        focus: `Transition into multi-step examination questions, past papers, and speed strategies.`,
        deliverables: ['WAEC/Cambridge past paper questions', 'Error analysis log', 'Speed & accuracy drills']
      },
      {
        phase: 'Weeks 7-8',
        title: 'Exam Simulation & Mastery Re-Evaluation',
        focus: `Full timed mock exam and comprehensive progress reassessment.`,
        deliverables: ['Full diagnostic re-assessment test', 'Term progress report card', 'Escrow milestone sign-off']
      }
    ];

    // Find recommended tutors matching subject & curriculum
    const allTeachers = await db.find('teachers');
    const matchedTutors = allTeachers
      .filter(t => {
        const matchesSubject = (t.subjects || []).some(s => s.toLowerCase().includes(subject.toLowerCase()) || subject.toLowerCase().includes(s.toLowerCase()));
        return matchesSubject || (t.rating && t.rating >= 4.8);
      })
      .slice(0, 3)
      .map(t => ({
        uid: t.uid || t.id,
        name: t.name,
        avatar: t.avatar,
        rate: t.rate,
        tier: t.tier || (t.isEliteVip ? 'Grade A' : 'Grade B'),
        rating: t.rating || 5.0,
        reviewsCount: t.reviewsCount || 10,
        subjects: t.subjects || [subject]
      }));

    // Create report record
    const reportId = `diag_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const reportData = {
      id: reportId,
      studentId: sanitizeText(studentId || 'guest_student'),
      studentName: safeStudentName,
      parentId: parentId ? sanitizeText(parentId) : null,
      parentEmail: parentEmail ? sanitizeText(parentEmail) : null,
      curriculum: safeCurriculum,
      subject: safeSubject,
      gradeBand: safeGradeBand,
      totalQuestions,
      correctCount,
      scorePercent,
      placementLevel,
      placementTitle,
      placementSummary,
      subSkillBreakdown,
      knowledgeGaps,
      detailedResults,
      learningRoadmap,
      matchedTutors,
      createdAt: new Date().toISOString()
    };

    await db.insert('diagnostic_reports', reportData);

    // Award XP to student if registered
    if (studentId && studentId !== 'guest_student') {
      const student = await db.findOne('students', s => s.uid === studentId || s.id === studentId);
      if (student) {
        await db.update('students', student.id || student.uid, {
          xp: (student.xp || 1450) + 150,
          lastDiagnosticDate: new Date().toISOString()
        });
      }

      // Send in-app notification to parent / student
      if (parentId) {
        await createNotification(
          parentId,
          `📊 Diagnostic Placement Completed: ${studentName}`,
          `${studentName} scored ${scorePercent}% on ${subject} (${placementLevel}). View their 8-week learning roadmap.`,
          "diagnostic"
        );
      }
    }

    return res.json({
      success: true,
      report: reportData
    });
  } catch (err) {
    console.error("Diagnostic evaluation error:", err);
    return res.status(500).json({ error: "Failed to evaluate diagnostic quiz." });
  }
});

/**
 * GET /api/diagnostic/reports/:studentId
 * Fetch diagnostic reports for a student or parent
 */
router.get('/reports/:studentId', publicActionRateLimiter, async (req, res) => {
  try {
    const { studentId } = req.params;
    const reports = await db.find('diagnostic_reports', r => r.studentId === studentId || r.parentId === studentId);
    return res.json({
      success: true,
      reports: reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (err) {
    console.error("Fetch diagnostic reports error:", err);
    return res.status(500).json({ error: "Failed to fetch diagnostic reports." });
  }
});

/**
 * GET /api/diagnostic/report/:reportId
 */
router.get('/report/:reportId', publicActionRateLimiter, async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await db.findOne('diagnostic_reports', r => r.id === reportId);
    if (!report) {
      return res.status(404).json({ error: "Diagnostic report not found." });
    }
    return res.json({ success: true, report });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve report." });
  }
});

export default router;

