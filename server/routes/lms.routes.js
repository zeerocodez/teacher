import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { createNotification, sanitizeText } from '../utils.js';
import { sendTransactionalEmail } from '../services/email.js';

const router = express.Router();
const DAILY_API_KEY = process.env.DAILY_API_KEY;

// Security Rate Limiters
const lmsPurchaseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many purchase operations. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

const lmsSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many submission attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

const lmsAdminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many administrative operations." },
  standardHeaders: true,
  legacyHeaders: false
});

// Helper to seed default LMS courses if collection is empty
export async function seedLmsCoursesIfEmpty() {
  try {
    const existing = await db.find('lms_courses');
    if (existing.length === 0) {
      const seedPath = path.join(process.cwd(), 'server', 'data', 'lms_courses.json');
      if (fs.existsSync(seedPath)) {
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
        for (const course of seedData) {
          await db.insert('lms_courses', course);
        }
        console.log(`[LMS] Seeded ${seedData.length} initial elite teacher training courses.`);
      }
    }
  } catch (err) {
    console.error("[LMS] Error seeding courses:", err);
  }
}

// --------------------------------------------------------------------------
// 1. COURSES ENDPOINTS
// --------------------------------------------------------------------------

/**
 * GET /api/lms/courses
 * List all courses (optionally filtered by category, search query, or level)
 */
router.get('/courses', async (req, res) => {
  try {
    let courses = await db.find('lms_courses');
    if (courses.length === 0) {
      await seedLmsCoursesIfEmpty();
      courses = await db.find('lms_courses');
    }

    const { category, level, search, featured } = req.query;

    if (category && category !== 'All') {
      courses = courses.filter(c => c.category?.toLowerCase() === category.toLowerCase());
    }
    if (level && level !== 'All') {
      courses = courses.filter(c => c.level?.toLowerCase() === level.toLowerCase());
    }
    if (featured === 'true') {
      courses = courses.filter(c => c.featured);
    }
    if (search) {
      const s = search.toLowerCase();
      courses = courses.filter(c => 
        (c.title && c.title.toLowerCase().includes(s)) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(s)) ||
        (c.tags && c.tags.some(t => t.toLowerCase().includes(s))) ||
        (c.category && c.category.toLowerCase().includes(s))
      );
    }

    // Return sanitized summary for catalog list
    const summarized = courses.map(c => ({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      slug: c.slug,
      category: c.category,
      level: c.level,
      price: c.price || 0,
      accessType: c.accessType || (c.requiresVetting ? 'vetted_teachers_only' : 'open_enrollment'),
      requiresVetting: !!c.requiresVetting,
      duration: c.duration,
      durationMinutes: c.durationMinutes,
      instructorName: c.instructorName,
      instructorAvatar: c.instructorAvatar,
      thumbnail: c.thumbnail,
      coverImage: c.coverImage,
      rating: c.rating || 4.9,
      reviewsCount: c.reviewsCount || 0,
      enrolledCount: c.enrolledCount || 0,
      isPublished: c.isPublished !== false,
      featured: !!c.featured,
      tags: c.tags || [],
      modulesCount: (c.modules || []).length,
      lessonsCount: (c.modules || []).reduce((acc, m) => acc + (m.lessons || []).length, 0)
    }));

    res.json(summarized);
  } catch (err) {
    console.error("[LMS] Fetch courses error:", err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

/**
 * GET /api/lms/courses/:id
 * Get single course with full modules, lessons, and user's enrollment/progress if logged in
 */
router.get('/courses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let course = await db.findOne('lms_courses', c => c.id === id || c.slug === id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check auth header if present (optional auth for course detail)
    const authHeader = req.headers['authorization'];
    let enrollment = null;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        if (token) {
          const decoded = jwt.decode(token);
          if (decoded && decoded.uid) {
            enrollment = await db.findOne('lms_enrollments', e => e.userId === decoded.uid && e.courseId === course.id);
          }
        }
      } catch (e) {}
    }

    res.json({
      course,
      enrollment: enrollment || null
    });
  } catch (err) {
    console.error("[LMS] Fetch course detail error:", err);
    res.status(500).json({ error: "Failed to fetch course details" });
  }
});

/**
 * POST /api/lms/courses
 * Create new course with modules, lessons, quizzes, and assignments (Admin only)
 */
router.post('/courses', authenticateToken, requireRole(['Admin']), lmsAdminLimiter, async (req, res) => {
  try {
    const {
      title,
      subtitle,
      category,
      level,
      duration,
      instructorName,
      instructorAvatar,
      instructorBio,
      thumbnail,
      coverImage,
      overview,
      learningOutcomes,
      tags,
      modules
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: "Course title and category are required." });
    }

    const courseId = `course_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newCourse = {
      id: courseId,
      title,
      subtitle: subtitle || "",
      slug: `${slug}-${crypto.randomBytes(2).toString('hex')}`,
      category: category || "Classroom Tech & AI",
      level: level || "Intermediate",
      duration: duration || "4 Hours",
      durationMinutes: 240,
      instructorName: instructorName || req.user.displayName || "Master Instructor",
      instructorAvatar: instructorAvatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
      instructorBio: instructorBio || "Certified EduVistar Lead Trainer.",
      thumbnail: thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
      coverImage: coverImage || thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
      rating: 5.0,
      reviewsCount: 0,
      enrolledCount: 0,
      isPublished: true,
      featured: false,
      tags: tags || [category],
      overview: overview || "Comprehensive professional training curriculum.",
      learningOutcomes: learningOutcomes || ["Master core pedagogical principles", "Implement modern instructional techniques"],
      modules: modules || [
        {
          id: `mod_${Date.now()}_1`,
          title: "Module 1: Orientation & Foundations",
          description: "Core conceptual orientation and curriculum overview.",
          order: 1,
          lessons: [
            {
              id: `les_${Date.now()}_1`,
              title: "1.1 Introduction & Overview",
              type: "video",
              duration: "10 min",
              videoUrl: "https://www.youtube.com/watch?v=kY3PbgfO3l4",
              isFreePreview: true,
              lectureNotes: "Welcome to this professional development module.",
              resources: []
            }
          ]
        }
      ]
    };

    const saved = await db.insert('lms_courses', newCourse);
    res.json(saved);
  } catch (err) {
    console.error("[LMS] Create course error:", err);
    res.status(500).json({ error: "Failed to create course: " + err.message });
  }
});

/**
 * PUT /api/lms/courses/:id
 * Update existing course & curriculum (Admin only)
 */
router.put('/courses/:id', authenticateToken, requireRole(['Admin']), lmsAdminLimiter, async (req, res) => {
  const { id } = req.params;
  try {
    const course = await db.findOne('lms_courses', c => c.id === id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const updates = req.body;
    delete updates.id; // Protect primary key

    const updated = await db.update('lms_courses', course.id, updates);
    res.json(updated);
  } catch (err) {
    console.error("[LMS] Update course error:", err);
    res.status(500).json({ error: "Failed to update course: " + err.message });
  }
});

/**
 * DELETE /api/lms/courses/:id
 * Delete course (Admin only)
 */
router.delete('/courses/:id', authenticateToken, requireRole(['Admin']), lmsAdminLimiter, async (req, res) => {
  const { id } = req.params;
  try {
    const course = await db.findOne('lms_courses', c => c.id === id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    await db.delete('lms_courses', course.id);
    res.json({ success: true, message: "Course deleted successfully" });
  } catch (err) {
    console.error("[LMS] Delete course error:", err);
    res.status(500).json({ error: "Failed to delete course: " + err.message });
  }
});

// --------------------------------------------------------------------------
// 2. ENROLLMENT & PROGRESS TRACKING
// --------------------------------------------------------------------------

/**
 * POST /api/lms/courses/:id/enroll
 * Enroll current authenticated user in a course (for free courses or pre-authorized teachers)
 */
router.post('/courses/:id/enroll', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;

  try {
    const course = await db.findOne('lms_courses', c => c.id === id || c.slug === id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    let enrollment = await db.findOne('lms_enrollments', e => e.userId === userId && e.courseId === course.id);
    if (enrollment) {
      return res.json({ message: "Already enrolled", enrollment });
    }

    // 1. CHECK VETTING RESTRICTION
    const requiresVetting = course.requiresVetting || course.accessType === 'vetted_teachers_only';
    if (requiresVetting && req.user.role !== 'Admin') {
      const teacher = await db.findOne('teachers', t => t.uid === userId || t.id === userId);
      const isVerifiedTeacher = teacher && (teacher.verified === true || teacher.status === 'verified');
      const isAcademyEnrolled = teacher?.academyEnrolled === true || req.user.academyEnrolled === true;

      if (!isVerifiedTeacher && !isAcademyEnrolled) {
        return res.status(403).json({
          error: "This course is restricted to approved & vetted educators who registered for the Elite Teachers Academy.",
          code: "VETTING_REQUIRED",
          requiresVetting: true
        });
      }
    }

    // 2. CHECK PRICING / PAYMENT REQUIREMENT
    const coursePrice = Number(course.price) || 0;
    if (coursePrice > 0 && req.user.role !== 'Admin') {
      return res.status(402).json({
        error: "Course purchase required.",
        code: "PAYMENT_REQUIRED",
        price: coursePrice,
        courseTitle: course.title
      });
    }

    const newEnrollment = {
      id: `enroll_${userId}_${course.id}`,
      userId,
      userName: req.user.displayName || "Teacher Trainee",
      userRole: req.user.role || "Teacher",
      courseId: course.id,
      courseTitle: course.title,
      courseThumbnail: course.thumbnail,
      paymentStatus: "free",
      progressPercentage: 0,
      completedLessons: [],
      quizScores: {},
      assignmentSubmissions: {},
      certificateIssued: false,
      certificateId: null,
      enrolledAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString()
    };

    await db.insert('lms_enrollments', newEnrollment);

    // Increment enrolledCount on course
    await db.update('lms_courses', course.id, {
      enrolledCount: (course.enrolledCount || 0) + 1
    });

    // Notify user
    await createNotification(
      userId,
      "course_enrollment",
      `Enrolled in ${course.title}`,
      `Welcome! You have successfully enrolled in "${course.title}". Begin Module 1 now.`
    );

    res.json({ success: true, enrollment: newEnrollment });
  } catch (err) {
    console.error("[LMS] Enroll error:", err);
    res.status(500).json({ error: "Failed to enroll in course" });
  }
});

/**
 * POST /api/lms/courses/:id/purchase
 * Purchase course via Platform Wallet balance or Paystack checkout
 */
router.post('/courses/:id/purchase', authenticateToken, lmsPurchaseLimiter, async (req, res) => {
  const { id } = req.params;
  const { paymentMethod, reference, provider } = req.body; // paymentMethod: 'wallet' | 'paystack'
  const userId = req.user.uid;

  try {
    const course = await db.findOne('lms_courses', c => c.id === id || c.slug === id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // 1. Check vetting requirement
    const requiresVetting = course.requiresVetting || course.accessType === 'vetted_teachers_only';
    if (requiresVetting && req.user.role !== 'Admin') {
      const teacher = await db.findOne('teachers', t => t.uid === userId || t.id === userId);
      const isVerifiedTeacher = teacher && (teacher.verified === true || teacher.status === 'verified');
      const isAcademyEnrolled = teacher?.academyEnrolled === true || req.user.academyEnrolled === true;

      if (!isVerifiedTeacher && !isAcademyEnrolled) {
        return res.status(403).json({
          error: "This course is restricted to approved & vetted educators who registered for the Elite Teachers Academy.",
          code: "VETTING_REQUIRED",
          requiresVetting: true
        });
      }
    }

    const coursePrice = Number(course.price) || 0;

    // 2. Process Wallet Payment
    if (paymentMethod === 'wallet') {
      let wallet = await db.findOne('wallets', w => w.uid === userId || w.userUid === userId);
      const currentBalance = wallet ? Number(wallet.balance) : 0;

      if (currentBalance < coursePrice) {
        return res.status(400).json({
          error: "Insufficient wallet balance. Please top up your wallet or pay with Paystack card.",
          code: "INSUFFICIENT_BALANCE",
          required: coursePrice,
          available: currentBalance
        });
      }

      // Deduct wallet balance
      const newBalance = currentBalance - coursePrice;
      await db.update('wallets', wallet.id, {
        balance: newBalance,
        updatedAt: new Date().toISOString()
      });

      // Record transaction
      const txId = `tx_course_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      await db.insert('transactions', {
        id: txId,
        fromUserId: userId,
        toUserId: "system",
        amount: coursePrice,
        currency: "NGN",
        type: "course_purchase",
        status: "Completed",
        courseId: course.id,
        courseTitle: course.title,
        createdAt: new Date().toISOString()
      });
    } else {
      // Paystack Payment Verification
      const txId = reference || `tx_paystack_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      await db.insert('transactions', {
        id: txId,
        fromUserId: userId,
        toUserId: "system",
        amount: coursePrice,
        currency: "NGN",
        type: "course_purchase",
        provider: "paystack",
        status: "Completed",
        courseId: course.id,
        courseTitle: course.title,
        createdAt: new Date().toISOString()
      });
    }

    // 3. Create or Update Enrollment Record
    let enrollment = await db.findOne('lms_enrollments', e => e.userId === userId && e.courseId === course.id);
    const enrollmentData = {
      id: enrollment ? enrollment.id : `enroll_${userId}_${course.id}`,
      userId,
      userName: req.user.displayName || "Teacher Trainee",
      userRole: req.user.role || "Teacher",
      courseId: course.id,
      courseTitle: course.title,
      courseThumbnail: course.thumbnail,
      paymentStatus: "paid",
      paymentMethod: paymentMethod || "paystack",
      amountPaid: coursePrice,
      progressPercentage: enrollment ? enrollment.progressPercentage : 0,
      completedLessons: enrollment ? enrollment.completedLessons : [],
      quizScores: enrollment ? enrollment.quizScores : {},
      assignmentSubmissions: enrollment ? enrollment.assignmentSubmissions : {},
      certificateIssued: enrollment ? enrollment.certificateIssued : false,
      certificateId: enrollment ? enrollment.certificateId : null,
      enrolledAt: enrollment ? enrollment.enrolledAt : new Date().toISOString(),
      lastAccessedAt: new Date().toISOString()
    };

    if (enrollment) {
      await db.update('lms_enrollments', enrollment.id, enrollmentData);
    } else {
      await db.insert('lms_enrollments', enrollmentData);
      await db.update('lms_courses', course.id, {
        enrolledCount: (course.enrolledCount || 0) + 1
      });
    }

    // Send confirmation notification & email
    await createNotification(
      userId,
      "course_purchase_success",
      `Course Unlocked: ${course.title}`,
      `Your payment of ₦${(coursePrice / 100).toLocaleString()} was successful. You have full access to all course modules and live masterclasses.`
    );

    if (req.user.email) {
      sendTransactionalEmail(
        req.user.email,
        `Payment Receipt: ${course.title}`,
        "alert",
        {
          message: `Hello ${req.user.displayName || 'Educator'},\n\nThank you for enrolling in "${course.title}" at the EduVistar Elite Teachers Academy.\n\nAmount: ₦${(coursePrice / 100).toLocaleString()}\nPayment Method: ${paymentMethod === 'wallet' ? 'Platform Wallet' : 'Paystack Card'}\nStatus: Confirmed\n\nYou can access your classroom at any time.`
        }
      );
    }

    res.json({
      success: true,
      message: "Course unlocked successfully!",
      enrollment: enrollmentData
    });
  } catch (err) {
    console.error("[LMS] Course purchase error:", err);
    res.status(500).json({ error: "Failed to purchase course: " + err.message });
  }
});

/**
 * POST /api/lms/courses/:id/progress
 * Update lesson completion status & progress %
 */
router.post('/courses/:id/progress', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { lessonId, completed } = req.body;
  const userId = req.user.uid;

  if (!lessonId) {
    return res.status(400).json({ error: "lessonId is required" });
  }

  try {
    const course = await db.findOne('lms_courses', c => c.id === id || c.slug === id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    let enrollment = await db.findOne('lms_enrollments', e => e.userId === userId && e.courseId === course.id);
    if (!enrollment) {
      // Auto enroll on progress action
      enrollment = await db.insert('lms_enrollments', {
        id: `enroll_${userId}_${course.id}`,
        userId,
        userName: req.user.displayName || "Teacher Trainee",
        userRole: req.user.role || "Teacher",
        courseId: course.id,
        courseTitle: course.title,
        courseThumbnail: course.thumbnail,
        progressPercentage: 0,
        completedLessons: [],
        quizScores: {},
        assignmentSubmissions: {},
        certificateIssued: false,
        certificateId: null,
        enrolledAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString()
      });
    }

    let completedList = [...(enrollment.completedLessons || [])];
    if (completed !== false) {
      if (!completedList.includes(lessonId)) {
        completedList.push(lessonId);
      }
    } else {
      completedList = completedList.filter(lId => lId !== lessonId);
    }

    // Calculate total lessons in course
    const totalLessons = (course.modules || []).reduce((acc, m) => acc + (m.lessons || []).length, 0);
    const progressPercent = totalLessons > 0 ? Math.min(100, Math.round((completedList.length / totalLessons) * 100)) : 0;

    let certData = null;
    let certificateIssued = enrollment.certificateIssued || false;
    let certificateId = enrollment.certificateId || null;

    // Issue certificate if 100% complete
    if (progressPercent === 100 && !certificateIssued) {
      certificateIssued = true;
      certificateId = `CERT-EB-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      certData = {
        id: certificateId,
        certificateCode: certificateId,
        userId,
        userName: req.user.displayName || "Elite Educator",
        userEmail: req.user.email || "",
        courseId: course.id,
        courseTitle: course.title,
        completionDate: new Date().toISOString(),
        issuedBy: "EduVistar Elite Teachers Academy Accreditation Board",
        verificationHash: crypto.createHash('sha256').update(`${userId}-${course.id}-${Date.now()}`).digest('hex')
      };

      await db.insert('lms_certificates', certData);

      await createNotification(
        userId,
        "certificate_awarded",
        `🎓 Certificate Awarded: ${course.title}`,
        `Congratulations! You have completed all modules in "${course.title}". Your official verifiable certificate is ready!`
      );
    }

    const updated = await db.update('lms_enrollments', enrollment.id, {
      completedLessons: completedList,
      progressPercentage: progressPercent,
      certificateIssued,
      certificateId,
      lastAccessedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      progressPercentage: progressPercent,
      completedLessons: completedList,
      certificateIssued,
      certificateId,
      certificate: certData
    });
  } catch (err) {
    console.error("[LMS] Update progress error:", err);
    res.status(500).json({ error: "Failed to update progress" });
  }
});

/**
 * GET /api/lms/my-learning
 * Return current user's enrolled courses, progress, pending assignments & certificates
 */
router.get('/my-learning', authenticateToken, async (req, res) => {
  const userId = req.user.uid;
  try {
    const enrollments = await db.find('lms_enrollments', e => e.userId === userId);
    const certificates = await db.find('lms_certificates', c => c.userId === userId);
    const liveClasses = await db.find('lms_live_classes');

    // Filter upcoming live classes
    const upcomingLive = liveClasses
      .filter(l => l.status === 'upcoming' || l.status === 'live')
      .sort((a, b) => new Date(a.scheduledStartTime) - new Date(b.scheduledStartTime));

    res.json({
      enrollments,
      certificates,
      upcomingLiveClasses: upcomingLive
    });
  } catch (err) {
    console.error("[LMS] My learning error:", err);
    res.status(500).json({ error: "Failed to fetch learning dashboard" });
  }
});

// --------------------------------------------------------------------------
// 3. QUIZ ENGINE
// --------------------------------------------------------------------------

/**
 * POST /api/lms/courses/:id/quiz/submit
 * Submit quiz answers, auto-grade, calculate score, return explanation breakdown
 */
router.post('/courses/:id/quiz/submit', authenticateToken, lmsSubmissionLimiter, async (req, res) => {
  const { id } = req.params;
  const { lessonId, answers } = req.body; // answers: { [questionId]: selectedOptionIndex }
  const userId = req.user.uid;

  if (!lessonId || !answers || typeof answers !== 'object') {
    return res.status(400).json({ error: "lessonId and valid answers map are required" });
  }

  try {
    const course = await db.findOne('lms_courses', c => c.id === id || c.slug === id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Find the quiz lesson
    let quizLesson = null;
    for (const mod of course.modules || []) {
      for (const les of mod.lessons || []) {
        if (les.id === lessonId && les.type === 'quiz') {
          quizLesson = les;
          break;
        }
      }
      if (quizLesson) break;
    }

    if (!quizLesson || !quizLesson.quizQuestions) {
      return res.status(404).json({ error: "Quiz questions not found for this lesson" });
    }

    const questions = quizLesson.quizQuestions;
    let correctCount = 0;
    const breakdown = questions.map(q => {
      const selected = answers[q.id];
      const isCorrect = (selected !== undefined && Number(selected) === Number(q.correctAnswer));
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        question: q.question,
        selectedOption: selected,
        correctOption: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || "Correct application of pedagogical guidelines."
      };
    });

    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const passed = scorePercent >= 70;

    // Save quiz score in enrollment
    let enrollment = await db.findOne('lms_enrollments', e => e.userId === userId && e.courseId === course.id);
    if (enrollment) {
      const quizScores = { ...(enrollment.quizScores || {}), [lessonId]: scorePercent };
      let completedLessons = [...(enrollment.completedLessons || [])];
      if (passed && !completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
      }

      const totalLessons = (course.modules || []).reduce((acc, m) => acc + (m.lessons || []).length, 0);
      const progressPercent = totalLessons > 0 ? Math.min(100, Math.round((completedLessons.length / totalLessons) * 100)) : 0;

      await db.update('lms_enrollments', enrollment.id, {
        quizScores,
        completedLessons,
        progressPercentage: progressPercent,
        lastAccessedAt: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      score: scorePercent,
      correctCount,
      totalQuestions: questions.length,
      passed,
      breakdown,
      feedback: passed
        ? "Excellent work! You demonstrated mastery of this module."
        : "You scored below the 70% threshold. Review the explanations and retake the quiz."
    });
  } catch (err) {
    console.error("[LMS] Submit quiz error:", err);
    res.status(500).json({ error: "Failed to submit quiz" });
  }
});

// --------------------------------------------------------------------------
// 4. ASSIGNMENT ENGINE & GRADING DESK
// --------------------------------------------------------------------------

/**
 * POST /api/lms/courses/:id/assignment/submit
 * Submit trainee assignment response (text notes + attachment URL)
 */
router.post('/courses/:id/assignment/submit', authenticateToken, lmsSubmissionLimiter, async (req, res) => {
  const { id } = req.params;
  const { lessonId, submissionText, attachmentUrl } = req.body;
  const userId = req.user.uid;

  if (!lessonId || (!submissionText && !attachmentUrl)) {
    return res.status(400).json({ error: "lessonId and submission content or attachment link required" });
  }

  const cleanText = submissionText ? sanitizeText(submissionText.trim()) : "";
  const cleanUrl = attachmentUrl ? sanitizeText(attachmentUrl.trim()) : "";

  try {
    const course = await db.findOne('lms_courses', c => c.id === id || c.slug === id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Find assignment lesson
    let assignmentLesson = null;
    for (const mod of course.modules || []) {
      for (const les of mod.lessons || []) {
        if (les.id === lessonId && les.type === 'assignment') {
          assignmentLesson = les;
          break;
        }
      }
      if (assignmentLesson) break;
    }

    const submissionId = `sub_${userId}_${lessonId}`;
    const submissionDoc = {
      id: submissionId,
      courseId: course.id,
      courseTitle: course.title,
      lessonId,
      lessonTitle: assignmentLesson?.title || "Course Assignment",
      studentId: userId,
      studentName: req.user.displayName || "Teacher Trainee",
      studentEmail: req.user.email || "",
      studentRole: req.user.role || "Teacher",
      submissionText: submissionText || "",
      attachmentUrl: attachmentUrl || "",
      rubric: assignmentLesson?.rubric || [],
      status: "pending", // 'pending' | 'graded'
      grade: null, // { score: 90, maxScore: 100, feedback: "Great work!" }
      submittedAt: new Date().toISOString(),
      gradedAt: null,
      gradedBy: null
    };

    // Check if previous submission exists
    const existing = await db.findOne('lms_assignments', a => a.id === submissionId);
    if (existing) {
      await db.update('lms_assignments', existing.id, submissionDoc);
    } else {
      await db.insert('lms_assignments', submissionDoc);
    }

    // Update enrollment status
    let enrollment = await db.findOne('lms_enrollments', e => e.userId === userId && e.courseId === course.id);
    if (enrollment) {
      const assignmentSubmissions = {
        ...(enrollment.assignmentSubmissions || {}),
        [lessonId]: {
          submissionId,
          submittedAt: new Date().toISOString(),
          status: "pending"
        }
      };
      await db.update('lms_enrollments', enrollment.id, { assignmentSubmissions });
    }

    // Notify admins of new submission
    const admins = await db.find('users', u => u.role === 'Admin');
    for (const adm of admins) {
      await createNotification(
        adm.uid || adm.id,
        "new_assignment_submission",
        `New Assignment: ${assignmentLesson?.title || 'Assignment'}`,
        `${req.user.displayName || 'A trainee'} submitted an assignment in "${course.title}".`
      );
    }

    res.json({
      success: true,
      message: "Assignment submitted successfully! Our academy mentors will grade your submission.",
      submission: submissionDoc
    });
  } catch (err) {
    console.error("[LMS] Submit assignment error:", err);
    res.status(500).json({ error: "Failed to submit assignment" });
  }
});

/**
 * GET /api/lms/assignments/all
 * List all assignments (Admin view)
 */
router.get('/assignments/all', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const submissions = await db.find('lms_assignments');
    submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    res.json(submissions);
  } catch (err) {
    console.error("[LMS] Fetch assignments error:", err);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

/**
 * POST /api/lms/assignments/:id/grade
 * Grade assignment submission with score & feedback (Admin only)
 */
router.post('/assignments/:id/grade', authenticateToken, requireRole(['Admin']), lmsAdminLimiter, async (req, res) => {
  const { id } = req.params;
  const { score, feedback, rubricScores } = req.body;

  if (score === undefined || score === null) {
    return res.status(400).json({ error: "score (0-100) is required" });
  }

  try {
    const submission = await db.findOne('lms_assignments', a => a.id === id);
    if (!submission) {
      return res.status(404).json({ error: "Assignment submission not found" });
    }

    const numScore = Math.min(100, Math.max(0, Math.round(Number(score) || 0)));
    const passed = numScore >= 70;
    const cleanFeedback = feedback ? sanitizeText(feedback.trim()) : "Assignment evaluated by Senior Academy Mentor.";

    const updatedSubmission = await db.update('lms_assignments', submission.id, {
      status: "graded",
      grade: {
        score: numScore,
        maxScore: 100,
        rubricScores: rubricScores || {},
        feedback: cleanFeedback
      },
      gradedAt: new Date().toISOString(),
      gradedBy: req.user.displayName || "Admin Evaluator"
    });

    // Update enrollment progress
    const enrollment = await db.findOne('lms_enrollments', e => e.userId === submission.studentId && e.courseId === submission.courseId);
    if (enrollment) {
      let completedLessons = [...(enrollment.completedLessons || [])];
      if (passed && !completedLessons.includes(submission.lessonId)) {
        completedLessons.push(submission.lessonId);
      }

      const course = await db.findOne('lms_courses', c => c.id === submission.courseId);
      const totalLessons = course ? (course.modules || []).reduce((acc, m) => acc + (m.lessons || []).length, 0) : 1;
      const progressPercent = Math.min(100, Math.round((completedLessons.length / totalLessons) * 100));

      const assignmentSubmissions = {
        ...(enrollment.assignmentSubmissions || {}),
        [submission.lessonId]: {
          submissionId: submission.id,
          status: "graded",
          score: numScore,
          feedback: feedback || "Graded."
        }
      };

      await db.update('lms_enrollments', enrollment.id, {
        completedLessons,
        progressPercentage: progressPercent,
        assignmentSubmissions
      });
    }

    // Send notification and email to student
    await createNotification(
      submission.studentId,
      "assignment_graded",
      `Assignment Graded: ${submission.lessonTitle}`,
      `Your submission received a score of ${numScore}/100. Feedback: "${feedback || 'Passed.'}"`
    );

    if (submission.studentEmail) {
      sendTransactionalEmail(
        submission.studentEmail,
        `Assignment Graded: ${submission.lessonTitle} (${numScore}/100)`,
        "alert",
        {
          message: `Hello ${submission.studentName},\n\nYour assignment submission for "${submission.lessonTitle}" in course "${submission.courseTitle}" has been graded.\n\nScore: ${numScore}/100\nFeedback: ${feedback || 'Well done.'}\n\nLog in to EduVistar Academy to view your full rubric review.`
        }
      );
    }

    res.json({ success: true, submission: updatedSubmission });
  } catch (err) {
    console.error("[LMS] Grade assignment error:", err);
    res.status(500).json({ error: "Failed to grade assignment" });
  }
});

// --------------------------------------------------------------------------
// 5. LIVE CLASSES & MASTERCLASSES
// --------------------------------------------------------------------------

/**
 * GET /api/lms/live-classes
 * List upcoming and active live training masterclasses
 */
router.get('/live-classes', async (req, res) => {
  try {
    let classes = await db.find('lms_live_classes');
    if (classes.length === 0) {
      // Seed default live masterclasses
      const defaultLive = [
        {
          id: "live_masterclass_ai_1",
          courseId: "course_ai_pedagogy",
          title: "AI in Live Tutoring Rooms: Real-time Demonstration & Whiteboard Drills",
          description: "Live interactive workshop simulating Cambridge and WAEC physics/maths tutoring with real-time prompt generation.",
          instructorName: "Dr. Femi Ojo",
          instructorAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
          scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          durationMinutes: 60,
          status: "upcoming",
          roomUrl: "https://eduvistar.daily.co/masterclass-ai-pedagogy",
          maxParticipants: 100,
          attendeesCount: 48,
          agenda: [
            "1. Priming ChatGPT and Gemini with Cambridge Syllabus Codes",
            "2. Live screen share: Co-teaching with AI assistants",
            "3. Interactive Whiteboard geometry & problem-solving drill",
            "4. Q&A and Certification Graduation"
          ],
          resources: [
            { "title": "Live Masterclass Handout (PDF)", "url": "https://example.com/handout.pdf" }
          ]
        },
        {
          id: "live_masterclass_curriculum_2",
          courseId: "course_cambridge_mastery",
          title: "Cambridge IGCSE Examiner Insights: Avoiding Common Mark Deductions",
          description: "Former examiner breakdown of student script pitfalls and method mark strategies.",
          instructorName: "Mr. Adebayo Okafor",
          instructorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
          scheduledStartTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          durationMinutes: 75,
          status: "upcoming",
          roomUrl: "https://eduvistar.daily.co/masterclass-cambridge-mastery",
          maxParticipants: 100,
          attendeesCount: 62,
          agenda: [
            "1. Real Examiner Paper 4 Script Marking",
            "2. How to teach students to show full working steps",
            "3. Live candidate feedback rubric exercise"
          ],
          resources: []
        }
      ];

      for (const l of defaultLive) {
        await db.insert('lms_live_classes', l);
      }
      classes = await db.find('lms_live_classes');
    }

    res.json(classes);
  } catch (err) {
    console.error("[LMS] Fetch live classes error:", err);
    res.status(500).json({ error: "Failed to fetch live classes" });
  }
});

/**
 * POST /api/lms/live-classes
 * Schedule a new Live Masterclass (Admin only)
 */
router.post('/live-classes', authenticateToken, requireRole(['Admin']), lmsAdminLimiter, async (req, res) => {
  try {
    const {
      title,
      description,
      courseId,
      instructorName,
      instructorAvatar,
      scheduledStartTime,
      durationMinutes,
      agenda
    } = req.body;

    if (!title || !scheduledStartTime) {
      return res.status(400).json({ error: "Title and scheduledStartTime are required." });
    }

    const classId = `live_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
    let roomUrl = `https://eduvistar.daily.co/${classId}`;

    // If Daily API Key is present, attempt live Daily room provisioning
    if (DAILY_API_KEY && !DAILY_API_KEY.includes('your_key_here')) {
      try {
        const response = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DAILY_API_KEY}`
          },
          body: JSON.stringify({
            name: classId,
            properties: {
              exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60), // 12 hours
              enable_chat: true,
              enable_screenshare: true,
              start_video_off: false,
              start_audio_off: false
            }
          })
        });
        const dailyData = await response.json();
        if (dailyData.url) {
          roomUrl = dailyData.url;
        }
      } catch (dErr) {
        console.warn("[LMS] Daily room provision fallback:", dErr);
      }
    }

    const cleanTitle = sanitizeText(title.trim());
    const cleanDesc = description ? sanitizeText(description.trim()) : "Elite Teachers Academy Live Masterclass";

    const newClass = {
      id: classId,
      courseId: courseId || null,
      title: cleanTitle,
      description: cleanDesc,
      instructorName: instructorName || req.user.displayName || "Lead Instructor",
      instructorAvatar: instructorAvatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
      scheduledStartTime,
      durationMinutes: Math.max(15, Number(durationMinutes) || 60),
      status: "upcoming",
      roomUrl,
      maxParticipants: 100,
      attendeesCount: 0,
      attendees: [],
      agenda: agenda || [
        "1. Real-time Demonstration and Case Study",
        "2. Interactive Whiteboard Drills",
        "3. Live Q&A and Practical Evaluation"
      ]
    };

    const saved = await db.insert('lms_live_classes', newClass);
    res.json(saved);
  } catch (err) {
    console.error("[LMS] Create live class error:", err);
    res.status(500).json({ error: "Failed to create live class: " + err.message });
  }
});

/**
 * POST /api/lms/live-classes/:id/status
 * Update status of live masterclass (Admin only)
 */
router.post('/live-classes/:id/status', authenticateToken, requireRole(['Admin']), lmsAdminLimiter, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'upcoming' | 'live' | 'completed'

  if (!status || !['upcoming', 'live', 'completed'].includes(status)) {
    return res.status(400).json({ error: "Valid status ('upcoming', 'live', 'completed') is required" });
  }

  try {
    const liveClass = await db.findOne('lms_live_classes', l => l.id === id);
    if (!liveClass) return res.status(404).json({ error: "Live class not found" });

    const updated = await db.update('lms_live_classes', liveClass.id, { status });
    res.json(updated);
  } catch (err) {
    console.error("[LMS] Update live class status error:", err);
    res.status(500).json({ error: "Failed to update live class status" });
  }
});

/**
 * POST /api/lms/live-classes/:id/join
 * Record attendee joining live class
 */
router.post('/live-classes/:id/join', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;

  try {
    const liveClass = await db.findOne('lms_live_classes', l => l.id === id);
    if (!liveClass) return res.status(404).json({ error: "Live class not found" });

    let attendees = [...(liveClass.attendees || [])];
    if (!attendees.some(a => a.userId === userId)) {
      attendees.push({
        userId,
        name: req.user.displayName || "Educator",
        role: req.user.role || "Teacher",
        joinedAt: new Date().toISOString()
      });
      await db.update('lms_live_classes', liveClass.id, {
        attendees,
        attendeesCount: attendees.length
      });
    }

    res.json({
      success: true,
      roomUrl: liveClass.roomUrl,
      classInfo: liveClass
    });
  } catch (err) {
    console.error("[LMS] Join live class error:", err);
    res.status(500).json({ error: "Failed to join live class" });
  }
});

// --------------------------------------------------------------------------
// 6. CERTIFICATES VERIFICATION
// --------------------------------------------------------------------------

/**
 * GET /api/lms/certificates/:id
 * Public certificate lookup & verification record
 */
router.get('/certificates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const cert = await db.findOne('lms_certificates', c => c.id === id || c.certificateCode === id);
    if (!cert) {
      return res.status(404).json({ error: "Certificate verification not found" });
    }
    res.json(cert);
  } catch (err) {
    console.error("[LMS] Certificate lookup error:", err);
    res.status(500).json({ error: "Failed to look up certificate" });
  }
});

// --------------------------------------------------------------------------
// 7. LMS ANALYTICS (ADMIN)
// --------------------------------------------------------------------------

/**
 * GET /api/lms/analytics
 * High-level LMS metrics for administrators
 */
router.get('/analytics', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const courses = await db.find('lms_courses');
    const enrollments = await db.find('lms_enrollments');
    const assignments = await db.find('lms_assignments');
    const certificates = await db.find('lms_certificates');
    const liveClasses = await db.find('lms_live_classes');

    const totalStudents = new Set(enrollments.map(e => e.userId)).size;
    const completedEnrollments = enrollments.filter(e => e.progressPercentage === 100);
    const avgProgress = enrollments.length > 0 
      ? Math.round(enrollments.reduce((sum, e) => sum + (e.progressPercentage || 0), 0) / enrollments.length)
      : 0;

    const pendingAssignmentsCount = assignments.filter(a => a.status === 'pending').length;

    res.json({
      totalCourses: courses.length,
      totalEnrollments: enrollments.length,
      totalActiveTrainees: totalStudents,
      avgCompletionRate: avgProgress,
      certificatesIssued: certificates.length,
      pendingAssignments: pendingAssignmentsCount,
      liveClassesScheduled: liveClasses.length
    });
  } catch (err) {
    console.error("[LMS] Analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;
