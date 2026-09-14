import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Target,
  AlertTriangle,
  User,
  Star,
  Printer,
  Share2,
  ShieldCheck,
  Crown,
  HelpCircle,
  TrendingUp,
  Brain,
  Layers,
  GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = '/api';

export default function DiagnosticAssessment({
  currentUser,
  selectedCurrency = 'NGN',
  formatCurrency,
  convertMinor,
  onBack,
  onBookTutor
}) {
  const navigate = useNavigate();

  // Wizard States: 'config' | 'quiz' | 'evaluating' | 'report'
  const [step, setStep] = useState('config');

  // Config State
  const [studentName, setStudentName] = useState(currentUser?.displayName || 'Tunde O.');
  const [selectedCurriculum, setSelectedCurriculum] = useState('Cambridge IGCSE');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedGradeBand, setSelectedGradeBand] = useState('Grade 7-9 (KS3/Lower IGCSE)');

  // Available options
  const [curricula, setCurricula] = useState([
    'Cambridge IGCSE',
    'WAEC / NECO',
    'British National Curriculum',
    'American SAT / AP',
    'Edexcel International'
  ]);
  const [subjects, setSubjects] = useState([
    'Mathematics',
    'English & Language Arts',
    'Sciences (Physics/Chemistry/Biology)',
    'Computational Logic & Tech'
  ]);
  const [gradeBands, setGradeBands] = useState([
    'Grade 4-6 (Primary/Lower Middle)',
    'Grade 7-9 (KS3/Lower IGCSE)',
    'Grade 10-12 (SS1-SS3/WAEC/SAT)'
  ]);

  // Quiz State
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionId]: selectedIndex }
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0); // in seconds
  const [timerActive, setTimerActive] = useState(false);

  // Report State
  const [report, setReport] = useState(null);

  // Fetch Curricula metadata
  useEffect(() => {
    fetch(`${API_BASE}/diagnostic/curricula-subjects`)
      .then(res => res.json())
      .then(data => {
        if (data.curricula) setCurricula(data.curricula);
        if (data.subjects) setSubjects(data.subjects);
        if (data.gradeBands) setGradeBands(data.gradeBands);
      })
      .catch(err => console.warn("Failed to fetch diagnostic curricula:", err));
  }, []);

  // Timer Tick
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // Format seconds to MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Assessment
  const handleStartQuiz = async () => {
    if (!studentName.trim()) {
      toast.error("Please enter the student's name.");
      return;
    }

    setLoadingQuiz(true);
    try {
      const url = `${API_BASE}/diagnostic/quiz?curriculum=${encodeURIComponent(selectedCurriculum)}&subject=${encodeURIComponent(selectedSubject)}&gradeBand=${encodeURIComponent(selectedGradeBand)}&limit=8`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setUserAnswers({});
          setCurrentIndex(0);
          setTimeSpent(0);
          setTimerActive(true);
          setStep('quiz');
        } else {
          toast.error("No questions found for this combination. Loading standard assessment...");
        }
      } else {
        toast.error("Failed to load diagnostic quiz.");
      }
    } catch (e) {
      toast.error("Connection error loading assessment.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Select Option
  const handleSelectOption = (questionId, optionIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // Submit and Evaluate
  const handleSubmitQuiz = async () => {
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < questions.length) {
      if (!window.confirm(`You have answered ${answeredCount} of ${questions.length} questions. Do you still wish to submit?`)) {
        return;
      }
    }

    setTimerActive(false);
    setStep('evaluating');

    try {
      const answersPayload = questions.map(q => ({
        questionId: q.id,
        selectedIndex: userAnswers[q.id] !== undefined ? userAnswers[q.id] : -1,
        timeSpentSeconds: Math.round(timeSpent / questions.length)
      }));

      const payload = {
        studentId: currentUser?.uid || 'guest_student',
        studentName: studentName.trim(),
        parentId: currentUser?.role === 'Parent' ? currentUser.uid : null,
        parentEmail: currentUser?.email || null,
        curriculum: selectedCurriculum,
        subject: selectedSubject,
        gradeBand: selectedGradeBand,
        answers: answersPayload
      };

      const token = localStorage.getItem('eduvistar_token');
      const res = await fetch(`${API_BASE}/diagnostic/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
        setStep('report');
        toast.success("Diagnostic Report generated successfully! +150 XP awarded.");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to generate report.");
        setStep('quiz');
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection error generating report.");
      setStep('quiz');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-brand-cream/30 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Top Breadcrumb & Return */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (onBack) onBack();
              else navigate(-1);
            }}
            className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal/70 hover:text-brand-moss transition-colors"
          >
            ← Return to Dashboard
          </button>

          <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold bg-brand-clay/10 py-1 px-3 rounded-full flex items-center gap-1">
            <Brain className="w-3 h-3 text-brand-clay" /> EduVistar Diagnostic Engine v2.4
          </span>
        </div>

        {/* ------------------- STEP 1: CONFIGURATION ------------------- */}
        {step === 'config' && (
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 sm:p-10 shadow-sm space-y-8 animate-fade-up">
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-moss/5 text-brand-moss border border-brand-moss/10 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-brand-clay" /> Free Academic Placement & Diagnostic Check
              </div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-brand-moss tracking-tight">
                Student Diagnostic Assessment & Placement Quiz
              </h1>
              <p className="font-sans text-xs sm:text-sm text-brand-charcoal/75 mt-2 max-w-2xl leading-relaxed">
                Identify your child's baseline strengths, uncover hidden syllabus gaps across international standards, and unlock a customized 8-week structured learning roadmap with matched educators.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
              {/* Student Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold font-heading text-brand-moss">
                  Student Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-brand-charcoal/40" />
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Tunde Okafor"
                    className="w-full bg-brand-cream/20 border border-brand-moss/15 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium text-brand-charcoal focus:outline-none focus:border-brand-moss"
                  />
                </div>
              </div>

              {/* Target Curriculum */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold font-heading text-brand-moss">
                  Target Curriculum Standard
                </label>
                <select
                  value={selectedCurriculum}
                  onChange={(e) => setSelectedCurriculum(e.target.value)}
                  className="w-full bg-brand-cream/20 border border-brand-moss/15 rounded-2xl py-2.5 px-4 text-xs font-medium text-brand-charcoal focus:outline-none focus:border-brand-moss cursor-pointer"
                >
                  {curricula.map((curr) => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold font-heading text-brand-moss">
                  Assessment Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-brand-cream/20 border border-brand-moss/15 rounded-2xl py-2.5 px-4 text-xs font-medium text-brand-charcoal focus:outline-none focus:border-brand-moss cursor-pointer"
                >
                  {subjects.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {/* Grade Band */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold font-heading text-brand-moss">
                  Grade / Age Level Band
                </label>
                <select
                  value={selectedGradeBand}
                  onChange={(e) => setSelectedGradeBand(e.target.value)}
                  className="w-full bg-brand-cream/20 border border-brand-moss/15 rounded-2xl py-2.5 px-4 text-xs font-medium text-brand-charcoal focus:outline-none focus:border-brand-moss cursor-pointer"
                >
                  {gradeBands.map((gb) => (
                    <option key={gb} value={gb}>{gb}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Diagnostic Highlights Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-brand-moss/5">
              <div className="p-4 rounded-2xl bg-brand-cream/40 border border-brand-moss/10 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-moss/10 flex items-center justify-center text-brand-moss shrink-0 font-bold">
                  8
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs text-brand-moss">Targeted Questions</h4>
                  <p className="text-[11px] text-brand-charcoal/70 mt-0.5 leading-tight">Adaptive testing covering linear algebra, geometry & problem sets.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-brand-cream/40 border border-brand-moss/10 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-clay/10 flex items-center justify-center text-brand-clay shrink-0 font-bold">
                  ⏱
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs text-brand-moss">~10 Mins Duration</h4>
                  <p className="text-[11px] text-brand-charcoal/70 mt-0.5 leading-tight">Self-paced diagnostic timing with auto-scoring analytics.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-brand-cream/40 border border-brand-moss/10 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 font-bold">
                  🎯
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs text-brand-moss">8-Week Roadmap</h4>
                  <p className="text-[11px] text-brand-charcoal/70 mt-0.5 leading-tight">Remediation milestones matched to certified tutors.</p>
                </div>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="font-mono text-[10px] text-brand-charcoal/60">
                ⭐ Completing this diagnostic earns <b>+150 Student XP</b> and activates placement badges.
              </span>

              <button
                type="button"
                onClick={handleStartQuiz}
                disabled={loadingQuiz}
                className="w-full sm:w-auto py-3.5 px-8 bg-brand-moss hover:bg-brand-moss/90 text-white font-heading font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all duration-300 flex items-center justify-center gap-2 hover-lift disabled:opacity-50"
              >
                {loadingQuiz ? (
                  <>Loading Quiz...</>
                ) : (
                  <>
                    <span>Start Diagnostic Assessment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ------------------- STEP 2: QUIZ RUNNER ------------------- */}
        {step === 'quiz' && questions.length > 0 && (
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 sm:p-10 shadow-sm space-y-6 animate-fade-up">
            
            {/* Header: Progress, Timer, and Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-moss/5 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xs uppercase tracking-wider text-brand-clay font-bold">
                    {selectedCurriculum} · {selectedSubject}
                  </span>
                  <span className="bg-brand-moss/10 text-brand-moss font-mono text-[9px] uppercase px-2 py-0.5 rounded font-bold">
                    {questions[currentIndex]?.subSkill || questions[currentIndex]?.topic}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-lg text-brand-moss mt-0.5">
                  Question {currentIndex + 1} of {questions.length}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-brand-cream px-3 py-1.5 rounded-xl border border-brand-moss/10 font-mono text-xs font-bold text-brand-moss">
                  <Clock className="w-3.5 h-3.5 text-brand-clay" />
                  <span>{formatTimer(timeSpent)}</span>
                </div>

                <div className="font-mono text-xs text-brand-charcoal/60 font-bold">
                  {Math.round(((currentIndex + 1) / questions.length) * 100)}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-brand-moss/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-brand-moss to-brand-clay transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question Text Box */}
            <div className="bg-brand-cream/20 border border-brand-moss/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between text-2xs font-mono uppercase text-brand-charcoal/50 font-bold">
                <span>Topic: {questions[currentIndex]?.topic}</span>
                <span className={`px-2 py-0.5 rounded ${
                  questions[currentIndex]?.difficulty === 'hard' 
                    ? 'bg-rose-100 text-rose-800' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {questions[currentIndex]?.difficulty || 'Medium'} Difficulty
                </span>
              </div>

              <h4 className="font-heading font-bold text-base sm:text-lg text-brand-moss leading-relaxed whitespace-pre-line">
                {questions[currentIndex]?.question}
              </h4>
            </div>

            {/* Answer Options Radio Cards */}
            <div className="space-y-3 font-sans">
              {questions[currentIndex]?.options.map((opt, optIdx) => {
                const isSelected = userAnswers[questions[currentIndex].id] === optIdx;

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(questions[currentIndex].id, optIdx)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-brand-moss/5 border-brand-moss ring-2 ring-brand-moss/20 shadow-xs'
                        : 'bg-white border-brand-moss/10 hover:border-brand-moss/30 hover:bg-brand-cream/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-xl font-mono text-xs font-bold flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-brand-moss text-white'
                          : 'bg-brand-cream border border-brand-moss/10 text-brand-charcoal'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="font-medium text-xs sm:text-sm text-brand-charcoal">
                        {opt}
                      </span>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-brand-moss bg-brand-moss' : 'border-brand-moss/30'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions Navigation */}
            <div className="pt-4 border-t border-brand-moss/5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="py-2.5 px-5 bg-brand-cream/60 hover:bg-brand-cream text-brand-moss border border-brand-moss/10 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="py-2.5 px-6 bg-brand-moss hover:bg-brand-moss/90 text-white rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    className="py-2.5 px-6 bg-brand-clay hover:bg-brand-clay/90 text-white rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 hover-lift"
                  >
                    <span>Submit & Generate Report</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------- STEP 3: EVALUATING ------------------- */}
        {step === 'evaluating' && (
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-12 text-center shadow-sm space-y-4 animate-fade-up">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-3 border-dashed border-brand-clay rounded-full animate-spin" />
              <Brain className="w-8 h-8 text-brand-moss animate-pulse" />
            </div>
            <h3 className="font-heading font-bold text-xl text-brand-moss">
              Synthesizing Diagnostic Performance...
            </h3>
            <p className="font-sans text-xs text-brand-charcoal/70 max-w-md mx-auto leading-relaxed">
              Evaluating sub-skill mastery, isolating prerequisite knowledge gaps, and tailoring your 8-week customized learning roadmap.
            </p>
          </div>
        )}

        {/* ------------------- STEP 4: DIAGNOSTIC REPORT CARD ------------------- */}
        {step === 'report' && report && (
          <div className="space-y-6 animate-fade-up print:m-0">
            
            {/* Top Overview & Placement Tier Hero */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 sm:p-10 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-moss/5 pb-6">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">
                    OFFICIAL DIAGNOSTIC REPORT CARD
                  </span>
                  <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-brand-moss">
                    {report.studentName}'s Academic Placement
                  </h2>
                  <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                    {report.curriculum} · {report.subject} · {report.gradeBand} · Evaluated on {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto print:hidden">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="py-2 px-3.5 bg-brand-cream/60 hover:bg-brand-cream border border-brand-moss/10 rounded-xl font-mono text-[10px] font-bold text-brand-moss flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('config');
                      setQuestions([]);
                      setUserAnswers({});
                    }}
                    className="py-2 px-3.5 bg-brand-moss hover:bg-brand-moss/90 text-white rounded-xl font-mono text-[10px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Quiz</span>
                  </button>
                </div>
              </div>

              {/* Placement Tier Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-moss via-brand-moss/95 to-brand-moss/90 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
                <div className="space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-0.5 rounded-full text-2xs font-mono uppercase tracking-wider font-bold text-amber-300">
                    <Crown className="w-3 h-3" /> {report.placementLevel}
                  </div>
                  <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
                    {report.placementTitle}
                  </h3>
                  <p className="font-sans text-xs text-white/80 max-w-xl leading-relaxed">
                    {report.placementSummary}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/10 border border-white/15 min-w-[140px] shrink-0 text-center">
                  <span className="font-heading font-black text-4xl text-amber-300">
                    {report.scorePercent}%
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/80 mt-0.5">
                    {report.correctCount} / {report.totalQuestions} Correct
                  </span>
                </div>
              </div>

              {/* Sub-Skill Competency Breakdown */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-heading font-bold text-sm text-brand-moss flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-brand-clay" /> Sub-Skill Competency Matrix
                  </h4>
                  <span className="font-mono text-2xs text-brand-charcoal/50">
                    Domain Mastery Percentages
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {report.subSkillBreakdown.map((skill, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-2xl bg-brand-cream/15 border border-brand-moss/10 flex flex-col justify-between space-y-2 font-sans text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-brand-moss block">{skill.subSkill}</span>
                          <span className="text-[10px] text-brand-charcoal/60">{skill.topic}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold ${
                          skill.status === 'Mastered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : skill.status === 'Developing'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {skill.status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-brand-charcoal/60">
                          <span>Accuracy</span>
                          <span className="font-bold text-brand-moss">{skill.percentage}% ({skill.correct}/{skill.total})</span>
                        </div>
                        <div className="w-full h-1.5 bg-brand-moss/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              skill.percentage >= 80 ? 'bg-emerald-600' : skill.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${skill.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Identified Knowledge Gaps & Remediation Insights */}
            {report.knowledgeGaps && report.knowledgeGaps.length > 0 && (
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div>
                    <h4 className="font-heading font-bold text-base text-brand-moss">
                      Identified Knowledge Gaps & Remediation Guide
                    </h4>
                    <p className="font-sans text-xs text-brand-charcoal/70">
                      Targeted pedagogical guidance on concepts that require immediate focus.
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {report.knowledgeGaps.map((gap, gIdx) => (
                    <div 
                      key={gIdx}
                      className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-2 font-sans text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-brand-moss font-heading">{gap.subSkill} ({gap.topic})</span>
                        <span className="font-mono text-[9px] text-amber-800 uppercase bg-amber-100 px-2 py-0.5 rounded font-bold">
                          Concept Gap
                        </span>
                      </div>

                      <p className="text-brand-charcoal/80 font-medium leading-relaxed">
                        <b>Question:</b> {gap.question}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="p-2.5 rounded-xl bg-white border border-rose-200 text-rose-800">
                          <span className="font-bold block text-[9px] uppercase font-mono">Your Answer</span>
                          {gap.studentChoice}
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-800">
                          <span className="font-bold block text-[9px] uppercase font-mono">Correct Answer</span>
                          {gap.correctChoice}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-brand-moss/10 text-brand-charcoal/80 leading-relaxed text-[11px]">
                        <span className="font-bold text-brand-moss block mb-0.5">💡 Remediation Step:</span>
                        {gap.remediation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom 8-Week Personalized Learning Roadmap */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">
                  STRUCTURED REMEDIATION PLAN
                </span>
                <h4 className="font-heading font-bold text-lg text-brand-moss">
                  Personalized 8-Week Learning Roadmap
                </h4>
                <p className="font-sans text-xs text-brand-charcoal/70 mt-0.5">
                  Designed specifically to elevate {report.studentName} from {report.placementLevel.split('//')[0].trim()} to top distinction readiness.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(report.learningRoadmap || []).map((phase, pIdx) => (
                  <div 
                    key={pIdx}
                    className="p-4 rounded-2xl border border-brand-moss/10 bg-brand-cream/15 flex flex-col justify-between space-y-3 font-sans text-xs"
                  >
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-brand-clay font-bold block mb-1">
                        {phase.phase}
                      </span>
                      <h5 className="font-heading font-bold text-xs text-brand-moss">
                        {phase.title}
                      </h5>
                      <p className="text-[11px] text-brand-charcoal/75 mt-1.5 leading-relaxed">
                        {phase.focus}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-brand-moss/5 space-y-1">
                      <span className="font-mono text-[8px] uppercase tracking-wider text-brand-charcoal/50 font-bold block">
                        Milestone Deliverables:
                      </span>
                      <ul className="space-y-1 text-[10px] text-brand-charcoal/80">
                        {phase.deliverables.map((del, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-1">
                            <span className="text-brand-clay font-bold">•</span>
                            <span>{del}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Matched Tutors Recommended for this Diagnostic */}
            {report.matchedTutors && report.matchedTutors.length > 0 && (
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6 print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">
                      RECOMMENDED VETTED EDUCATORS
                    </span>
                    <h4 className="font-heading font-bold text-lg text-brand-moss">
                      Match with Top Tutors for {report.subject}
                    </h4>
                    <p className="font-sans text-xs text-brand-charcoal/70 mt-0.5">
                      Educators certified in {report.curriculum} who can guide your 8-week roadmap.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {report.matchedTutors.map((tutor) => (
                    <div 
                      key={tutor.uid}
                      className="p-5 rounded-2xl border border-brand-moss/15 bg-gradient-to-br from-white to-brand-cream/20 flex flex-col justify-between space-y-4 hover-lift"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={tutor.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"} 
                          alt={tutor.name} 
                          className="w-12 h-12 rounded-full object-cover border border-brand-moss/20"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-heading font-bold text-xs text-brand-moss">{tutor.name}</h5>
                            {tutor.tier === 'Grade A' && (
                              <Crown className="w-3 h-3 text-amber-600" title="Grade A Elite VVIP" />
                            )}
                          </div>
                          <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/60 block mt-0.5">
                            {tutor.tier} Educator · ⭐ {tutor.rating}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-brand-moss/5 flex items-center justify-between">
                        <span className="font-heading font-extrabold text-sm text-brand-moss">
                          {formatCurrency ? formatCurrency(convertMinor ? convertMinor(tutor.rate, selectedCurrency) : tutor.rate / 100, selectedCurrency) : `₦${((tutor.rate || 1000000) / 100).toLocaleString()}/hr`}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            if (onBookTutor) {
                              onBookTutor(tutor);
                            } else {
                              navigate('/marketplace');
                            }
                          }}
                          className="py-1.5 px-3.5 bg-brand-moss hover:bg-brand-clay text-white rounded-xl font-heading font-bold text-2xs uppercase tracking-wider transition-colors shadow-sm"
                        >
                          Book Trial
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
