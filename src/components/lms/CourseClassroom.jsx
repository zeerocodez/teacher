import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play, FileText, CheckCircle2, Circle, HelpCircle,
  Award, Video, Download, ArrowLeft, ArrowRight, BookOpen,
  Check, Lock, Sparkles, ChevronDown, ChevronRight, Share2,
  ExternalLink, Calendar, AlertCircle, Clock, Send, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import CourseCheckoutModal from './CourseCheckoutModal';

export default function CourseClassroom({ currentUser, selectedCurrency = 'NGN', formatCurrency, convertMinor }) {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [playbackRate, setPlaybackRate] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Quiz interactive state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Assignment submission state
  const [assignmentText, setAssignmentText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '/api';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('eduvista_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Fetch course & enrollment details
  const fetchCourseData = async () => {
    try {
      const res = await fetch(`${API_BASE}/lms/courses/${courseId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setCourse(data.course);
        setEnrollment(data.enrollment);

        // Auto-select first lesson if none selected
        if (!activeLesson && data.course?.modules?.length > 0) {
          const firstMod = data.course.modules[0];
          if (firstMod.lessons?.length > 0) {
            setActiveLesson(firstMod.lessons[0]);
          }
          // Expand all modules by default
          const exp = {};
          data.course.modules.forEach(m => { exp[m.id] = true; });
          setExpandedModules(exp);
        }
      } else {
        toast.error("Failed to load course");
      }
    } catch (err) {
      console.warn("Course detail offline fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  // Reset quiz/assignment state when active lesson changes
  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
    setAssignmentText('');
    setAttachmentUrl('');
  }, [activeLesson?.id]);

  // Toggle Module Accordion
  const toggleModule = (modId) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  // Mark Lesson Progress
  const handleMarkProgress = async (lessonId, isCompleted = true) => {
    try {
      const res = await fetch(`${API_BASE}/lms/courses/${course.id}/progress`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ lessonId, completed: isCompleted })
      });
      if (res.ok) {
        const data = await res.json();
        setEnrollment(prev => ({
          ...(prev || {}),
          completedLessons: data.completedLessons,
          progressPercentage: data.progressPercentage,
          certificateIssued: data.certificateIssued,
          certificateId: data.certificateId
        }));
        if (isCompleted) {
          toast.success("✓ Lesson completed!");
          if (data.certificateIssued) {
            toast.success("🎓 Congratulations! You completed this course and earned your Certificate!");
          }
        }
      }
    } catch (err) {
      console.warn("Progress update simulation:", err);
    }
  };

  // Handle Quiz Submission
  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    if (!activeLesson || !activeLesson.quizQuestions) return;

    setSubmittingQuiz(true);
    try {
      const res = await fetch(`${API_BASE}/lms/courses/${course.id}/quiz/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          lessonId: activeLesson.id,
          answers: quizAnswers
        })
      });
      const data = await res.json();
      setQuizResult(data);
      setQuizSubmitted(true);
      if (data.passed) {
        toast.success(`🎉 Passed with score: ${data.score}%!`);
        handleMarkProgress(activeLesson.id, true);
      } else {
        toast.error(`Score: ${data.score}%. Retake to pass.`);
      }
    } catch (err) {
      toast.error("Failed to submit quiz.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Handle Assignment Submission
  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!assignmentText.trim() && !attachmentUrl.trim()) {
      toast.error("Please provide assignment text notes or an attachment URL.");
      return;
    }

    setSubmittingAssignment(true);
    try {
      const res = await fetch(`${API_BASE}/lms/courses/${course.id}/assignment/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          lessonId: activeLesson.id,
          submissionText: assignmentText,
          attachmentUrl
        })
      });
      if (res.ok) {
        toast.success("✓ Assignment submitted for mentor evaluation!");
        fetchCourseData();
      } else {
        toast.error("Failed to submit assignment.");
      }
    } catch (err) {
      toast.error("Submission failed.");
    } finally {
      setSubmittingAssignment(false);
    }
  };

  // Flattened Lessons for Next/Prev Navigation
  const allLessons = [];
  if (course?.modules) {
    course.modules.forEach(m => {
      (m.lessons || []).forEach(l => {
        allLessons.push({ ...l, moduleId: m.id, moduleTitle: m.title });
      });
    });
  }

  const currentLessonIndex = allLessons.findIndex(l => l.id === activeLesson?.id);
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const isLessonCompleted = (lessonId) => {
    return enrollment?.completedLessons?.includes(lessonId);
  };

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-brand-cream/30 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-clay border-t-transparent rounded-full animate-spin" />
          <span className="font-heading font-bold text-xs text-brand-moss uppercase tracking-wider">Loading Interactive Classroom...</span>
        </div>
      </div>
    );
  }

  const progress = enrollment?.progressPercentage || 0;

  return (
    <div className="min-h-screen bg-brand-cream/30 flex flex-col text-brand-charcoal">
      {/* Classroom Top Bar */}
      <header className="h-16 bg-white border-b border-brand-moss/10 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/academy')}
            className="p-2 rounded-full hover:bg-brand-cream/60 text-brand-moss transition-colors"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-brand-clay font-bold">
                {course.category}
              </span>
              <span className="text-[10px] text-brand-charcoal/40 hidden sm:inline">· {course.level}</span>
            </div>
            <h1 className="font-heading font-bold text-xs sm:text-sm text-brand-moss truncate max-w-xs sm:max-w-md md:max-w-lg">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Progress bar & Certificate shortcut */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-brand-moss">
                {progress}% Complete
              </span>
              {enrollment?.certificateIssued && (
                <Link
                  to={`/academy/certificate/${enrollment.certificateId}`}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full hover:bg-amber-100 transition-colors"
                >
                  <Award className="w-3 h-3 text-amber-500" />
                  View Certificate
                </Link>
              )}
            </div>
            <div className="w-36 h-2 bg-brand-moss/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-clay to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl border border-brand-moss/10 hover:bg-brand-cream/50 text-xs font-bold font-mono text-brand-moss flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-brand-clay" />
            <span className="hidden md:inline">{sidebarOpen ? 'Hide Syllabus' : 'Show Syllabus'}</span>
          </button>
        </div>
      </header>

      {/* Main Classroom Grid */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left: Collapsible Curriculum Drawer */}
        {sidebarOpen && (
          <aside className="w-full md:w-80 lg:w-96 bg-white border-r border-brand-moss/10 flex flex-col h-[calc(100vh-4rem)] shrink-0 overflow-hidden shadow-sm z-20">
            <div className="p-4 border-b border-brand-moss/10 bg-brand-cream/20 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-brand-moss">
                Course Syllabus ({allLessons.length} Lessons)
              </span>
              <span className="text-xs font-bold text-brand-clay">
                {enrollment?.completedLessons?.length || 0} / {allLessons.length} Done
              </span>
            </div>

            {/* Modules List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {(course.modules || []).map((mod, modIdx) => (
                <div key={mod.id} className="border border-brand-moss/10 rounded-2xl overflow-hidden bg-white">
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full p-3.5 bg-brand-cream/30 hover:bg-brand-cream/50 flex items-center justify-between text-left transition-colors"
                  >
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 font-bold block">
                        Module {modIdx + 1}
                      </span>
                      <h3 className="font-heading font-bold text-xs text-brand-moss">
                        {mod.title}
                      </h3>
                    </div>
                    {expandedModules[mod.id] ? (
                      <ChevronDown className="w-4 h-4 text-brand-moss/60 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-brand-moss/60 shrink-0" />
                    )}
                  </button>

                  {/* Lessons list */}
                  {expandedModules[mod.id] && (
                    <div className="p-1 space-y-1">
                      {(mod.lessons || []).map((lesson, lesIdx) => {
                        const isCurrent = activeLesson?.id === lesson.id;
                        const completed = isLessonCompleted(lesson.id);

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setActiveLesson(lesson)}
                            className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
                              isCurrent
                                ? 'bg-brand-moss text-white shadow-sm'
                                : 'hover:bg-brand-cream/40 text-brand-charcoal'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {completed ? (
                                <CheckCircle2 className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-emerald-300' : 'text-emerald-600'}`} />
                              ) : (
                                <Circle className={`w-4 h-4 shrink-0 opacity-40 ${isCurrent ? 'text-white' : 'text-brand-moss'}`} />
                              )}

                              <div className="truncate">
                                <span className={`text-xs font-semibold block truncate ${isCurrent ? 'text-white' : 'text-brand-moss'}`}>
                                  {lesson.title}
                                </span>
                                <span className={`text-[9px] font-mono block ${isCurrent ? 'text-brand-cream/70' : 'text-brand-charcoal/50'}`}>
                                  {lesson.type.toUpperCase()} · {lesson.duration}
                                </span>
                              </div>
                            </div>

                            {lesson.type === 'video' && <Play className={`w-3.5 h-3.5 shrink-0 ml-2 ${isCurrent ? 'text-brand-clay' : 'text-brand-charcoal/40'}`} />}
                            {lesson.type === 'document' && <FileText className={`w-3.5 h-3.5 shrink-0 ml-2 ${isCurrent ? 'text-brand-clay' : 'text-brand-charcoal/40'}`} />}
                            {lesson.type === 'quiz' && <HelpCircle className={`w-3.5 h-3.5 shrink-0 ml-2 ${isCurrent ? 'text-amber-300' : 'text-amber-600'}`} />}
                            {lesson.type === 'assignment' && <Award className={`w-3.5 h-3.5 shrink-0 ml-2 ${isCurrent ? 'text-brand-clay' : 'text-brand-clay'}`} />}
                            {lesson.type === 'live_class' && <Video className={`w-3.5 h-3.5 shrink-0 ml-2 animate-pulse text-rose-500`} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Instructor Footer */}
            <div className="p-4 border-t border-brand-moss/10 bg-brand-cream/10 flex items-center gap-3">
              <img
                src={course.instructorAvatar}
                alt={course.instructorName}
                className="w-9 h-9 rounded-full object-cover border border-brand-moss/20"
              />
              <div>
                <span className="font-heading font-bold text-xs text-brand-moss block">{course.instructorName}</span>
                <span className="text-[10px] text-brand-charcoal/60 block">Academy Lead Instructor</span>
              </div>
            </div>
          </aside>
        )}

        {/* Right: Interactive Lesson Viewport */}
        <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto bg-brand-cream/15 p-4 sm:p-8">
          {activeLesson ? (
            <div className="max-w-4xl mx-auto w-full space-y-6">
              {/* Lesson Title & Completion Toggle */}
              <div className="bg-white border border-brand-moss/10 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-moss/10 text-brand-moss font-mono text-[9px] uppercase tracking-wider font-bold">
                      {activeLesson.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-brand-charcoal/50 font-mono">
                      {activeLesson.duration}
                    </span>
                  </div>
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-brand-moss">
                    {activeLesson.title}
                  </h2>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleMarkProgress(activeLesson.id, !isLessonCompleted(activeLesson.id))}
                    className={`py-2.5 px-5 rounded-full text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm ${
                      isLessonCompleted(activeLesson.id)
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-white border border-brand-moss/20 hover:border-brand-clay text-brand-moss hover:text-brand-clay'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isLessonCompleted(activeLesson.id) ? 'Completed' : 'Mark Complete'}</span>
                  </button>
                </div>
              </div>

              {/* Check if lesson is locked (not enrolled & not free preview) */}
              {!enrollment && !activeLesson.isFreePreview && (Number(course.price) > 0 || course.requiresVetting || course.accessType === 'vetted_teachers_only') ? (
                <div className="bg-white border border-brand-moss/10 rounded-3xl p-8 sm:p-12 text-center shadow-sm space-y-6 animate-fade-in">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                    <Lock className="w-8 h-8 text-amber-600" />
                  </div>
                  <div className="space-y-2 max-w-md mx-auto">
                    <h3 className="font-heading font-bold text-xl text-brand-moss">Course Enrollment Required</h3>
                    <p className="text-xs text-brand-charcoal/70 leading-relaxed font-sans">
                      {course.requiresVetting || course.accessType === 'vetted_teachers_only'
                        ? "This lesson is part of an accredited masterclass restricted to vetted educators registered for the Elite Teachers Academy."
                        : "Unlock this full masterclass to access all module lessons, quizzes, instructor assignments, and earn your verifiable digital certificate."}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCheckoutModal(true)}
                    className="py-3.5 px-8 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-lg inline-flex items-center gap-2 transition-transform scale-100 hover:scale-105"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Enroll / Unlock Full Course</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Dynamic Viewport by Content Type */}

                  {/* 1. VIDEO LESSON */}
                  {activeLesson.type === 'video' && (
                    <div className="bg-white border border-brand-moss/10 rounded-3xl overflow-hidden shadow-sm space-y-6 p-6">
                      {/* Video Embed */}
                      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black relative shadow-inner">
                        {activeLesson.videoUrl?.includes('youtube.com') || activeLesson.videoUrl?.includes('youtu.be') ? (
                          <iframe
                            className="w-full h-full"
                            src={activeLesson.videoUrl.replace('watch?v=', 'embed/')}
                            title={activeLesson.title}
                            allowFullScreen
                          />
                        ) : (
                      <video
                        controls
                        className="w-full h-full object-contain"
                        src={activeLesson.videoUrl}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>

                  {/* Lecture Notes */}
                  {activeLesson.lectureNotes && (
                    <div className="p-6 bg-brand-cream/30 rounded-2xl border border-brand-moss/10 space-y-3">
                      <h4 className="font-heading font-bold text-sm text-brand-moss flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-clay" />
                        Lecture Summary & Key Concepts
                      </h4>
                      <div className="font-sans text-xs text-brand-charcoal/80 whitespace-pre-line leading-relaxed">
                        {activeLesson.lectureNotes}
                      </div>
                    </div>
                  )}

                  {/* Resources */}
                  {activeLesson.resources?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-brand-clay">Downloadable Materials</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeLesson.resources.map((res, idx) => (
                          <a
                            key={idx}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3.5 bg-brand-moss/5 hover:bg-brand-moss/10 rounded-xl border border-brand-moss/10 text-xs font-bold text-brand-moss transition-colors"
                          >
                            <span className="truncate">{res.title}</span>
                            <Download className="w-4 h-4 text-brand-clay shrink-0 ml-2" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. DOCUMENT / READING LESSON */}
              {activeLesson.type === 'document' && (
                <div className="bg-white border border-brand-moss/10 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
                  <div className="prose max-w-none text-xs sm:text-sm text-brand-charcoal leading-relaxed font-sans space-y-4">
                    <div className="p-6 bg-brand-moss/5 rounded-2xl border-l-4 border-brand-clay text-xs leading-relaxed text-brand-moss">
                      💡 <strong>Reading Guidance:</strong> Study the frameworks outlined below to prepare for the practical module assignment and capstone accreditation.
                    </div>

                    <div className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-brand-charcoal/90">
                      {activeLesson.documentText}
                    </div>
                  </div>

                  {activeLesson.resources?.length > 0 && (
                    <div className="pt-6 border-t border-brand-moss/10 space-y-2">
                      <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-brand-clay">Attached References</h4>
                      {activeLesson.resources.map((res, idx) => (
                        <a
                          key={idx}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3.5 bg-brand-cream/30 hover:bg-brand-cream/60 rounded-xl border border-brand-moss/10 text-xs font-bold text-brand-moss transition-colors"
                        >
                          <span>{res.title}</span>
                          <Download className="w-4 h-4 text-brand-clay" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. INTERACTIVE QUIZ LESSON */}
              {activeLesson.type === 'quiz' && (
                <div className="bg-white border border-brand-moss/10 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-brand-moss">
                      Module Assessment: {(activeLesson.quizQuestions || []).length} Questions
                    </h3>
                    <p className="text-xs text-brand-charcoal/60 mt-1">
                      Score at least 70% to pass and qualify for certificate release.
                    </p>
                  </div>

                  {/* Quiz Form */}
                  <form onSubmit={handleQuizSubmit} className="space-y-6">
                    {(activeLesson.quizQuestions || []).map((q, qIdx) => (
                      <div key={q.id} className="p-6 bg-brand-cream/20 rounded-2xl border border-brand-moss/10 space-y-4">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-brand-moss text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                            {qIdx + 1}
                          </span>
                          <h4 className="font-heading font-bold text-sm text-brand-moss leading-snug">
                            {q.question}
                          </h4>
                        </div>

                        {/* Options */}
                        <div className="space-y-2.5 pl-9">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = quizAnswers[q.id] === optIdx;
                            return (
                              <label
                                key={optIdx}
                                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-brand-clay/10 border-brand-clay text-brand-clay font-bold shadow-xs'
                                    : 'bg-white border-brand-moss/10 hover:border-brand-moss/30 text-brand-charcoal'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question_${q.id}`}
                                  checked={isSelected}
                                  onChange={() => setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                                  className="mt-0.5 text-brand-clay focus:ring-brand-clay"
                                />
                                <span className="text-xs leading-relaxed">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end items-center gap-4 pt-4 border-t border-brand-moss/10">
                      <button
                        type="submit"
                        disabled={submittingQuiz || Object.keys(quizAnswers).length < (activeLesson.quizQuestions || []).length}
                        className="py-3 px-8 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-lg disabled:opacity-50 transition-all"
                      >
                        {submittingQuiz ? 'Evaluating Answers...' : 'Submit Assessment'}
                      </button>
                    </div>
                  </form>

                  {/* Quiz Results Card */}
                  {quizSubmitted && quizResult && (
                    <div className={`p-6 rounded-2xl border space-y-4 animate-fade-in ${
                      quizResult.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {quizResult.passed ? (
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-8 h-8 text-rose-600" />
                          )}
                          <div>
                            <h4 className="font-heading font-bold text-base text-brand-moss">
                              {quizResult.passed ? 'Assessment Passed!' : 'Assessment Not Passed'}
                            </h4>
                            <span className="text-xs font-mono font-bold text-brand-charcoal/70">
                              Score: {quizResult.score}% ({quizResult.correctCount}/{quizResult.totalQuestions} Correct)
                            </span>
                          </div>
                        </div>

                        {!quizResult.passed && (
                          <button
                            onClick={() => { setQuizSubmitted(false); setQuizResult(null); }}
                            className="py-2 px-4 rounded-full bg-white border border-rose-300 text-rose-700 text-xs font-bold uppercase tracking-wider hover:bg-rose-100"
                          >
                            Retake Quiz
                          </button>
                        )}
                      </div>

                      {/* Explanation Breakdown */}
                      <div className="space-y-3 pt-3 border-t border-brand-moss/10">
                        {quizResult.breakdown?.map((b, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-white text-xs space-y-1.5 shadow-xs">
                            <span className="font-bold text-brand-moss block">
                              Question {idx + 1}: {b.question}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                b.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {b.isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                              </span>
                            </div>
                            <p className="text-[11px] text-brand-charcoal/70 italic bg-brand-cream/30 p-2 rounded-lg">
                              💡 {b.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. ASSIGNMENT LESSON */}
              {activeLesson.type === 'assignment' && (
                <div className="bg-white border border-brand-moss/10 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-brand-moss">
                      Capstone Practical Assignment
                    </h3>
                    <p className="text-xs text-brand-charcoal/60 mt-1">
                      Complete the assignment requirements and submit your response for mentor grading.
                    </p>
                  </div>

                  {/* Assignment Prompt */}
                  <div className="p-6 bg-brand-moss/5 rounded-2xl border border-brand-moss/10 space-y-3">
                    <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-brand-clay">
                      Assignment Instructions
                    </h4>
                    <p className="text-xs sm:text-sm text-brand-charcoal/90 leading-relaxed font-sans whitespace-pre-line">
                      {activeLesson.assignmentPrompt}
                    </p>
                  </div>

                  {/* Rubric Criteria */}
                  {activeLesson.rubric?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss">
                        Evaluation Rubric
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeLesson.rubric.map((r, idx) => (
                          <div key={idx} className="p-4 bg-brand-cream/30 rounded-xl border border-brand-moss/10 text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold text-brand-moss">
                              <span>{r.criterion}</span>
                              <span className="font-mono text-brand-clay">{r.maxScore} pts</span>
                            </div>
                            <p className="text-[11px] text-brand-charcoal/60">{r.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submission Form */}
                  <form onSubmit={handleAssignmentSubmit} className="space-y-4 pt-4 border-t border-brand-moss/10">
                    <h4 className="font-heading font-bold text-sm text-brand-moss">
                      Your Response
                    </h4>

                    <div>
                      <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1.5">
                        Written Submission / Notes
                      </label>
                      <textarea
                        rows={6}
                        placeholder="Type or paste your lesson outline, prompt transcript, or rationale here..."
                        value={assignmentText}
                        onChange={(e) => setAssignmentText(e.target.value)}
                        className="w-full bg-brand-cream/20 border border-brand-moss/20 rounded-2xl p-4 text-xs font-sans text-brand-charcoal focus:outline-none focus:border-brand-clay"
                      />
                    </div>

                    <div>
                      <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1.5">
                        Shared Document Link (Google Docs, Canva, PDF URL)
                      </label>
                      <input
                        type="url"
                        placeholder="https://docs.google.com/document/d/..."
                        value={attachmentUrl}
                        onChange={(e) => setAttachmentUrl(e.target.value)}
                        className="w-full bg-brand-cream/20 border border-brand-moss/20 rounded-2xl p-3.5 text-xs font-sans text-brand-charcoal focus:outline-none focus:border-brand-clay"
                      />
                    </div>

                    <div className="flex justify-end items-center gap-3">
                      <button
                        type="submit"
                        disabled={submittingAssignment || (!assignmentText.trim() && !attachmentUrl.trim())}
                        className="py-3 px-8 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-lg disabled:opacity-50 transition-all"
                      >
                        {submittingAssignment ? 'Submitting to Mentors...' : 'Submit Assignment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 5. LIVE MASTERCLASS LESSON */}
              {activeLesson.type === 'live_class' && (
                <div className="bg-gradient-to-tr from-brand-charcoal via-brand-moss to-brand-charcoal rounded-3xl p-8 sm:p-12 text-white shadow-xl space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Live Masterclass Event
                    </span>
                    <span className="text-xs text-brand-cream/60 font-mono">
                      {activeLesson.duration}
                    </span>
                  </div>

                  <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-white leading-tight">
                    {activeLesson.title}
                  </h3>

                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                    <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-amber-300">
                      Masterclass Agenda & Objectives
                    </h4>
                    <p className="text-xs text-brand-cream/80 font-sans leading-relaxed whitespace-pre-line">
                      {activeLesson.liveSchedule?.agenda || "Join our lead instructors for a live demonstration, interactive drills, and Q&A."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-4">
                    <Link
                      to={`/academy/live/${activeLesson.liveSchedule?.meetingLink?.split('/').pop() || 'live_masterclass_ai_1'}`}
                      className="py-3.5 px-8 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-xl flex items-center gap-2 transition-transform scale-100 hover:scale-105 active:scale-95"
                    >
                      <Video className="w-4 h-4" />
                      Enter Live Studio Room
                    </Link>

                    <button
                      onClick={() => handleMarkProgress(activeLesson.id, true)}
                      className="py-3.5 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-sans text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Mark Attended
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Next/Prev Lesson Navigation Bar */}
              <div className="flex items-center justify-between pt-6 border-t border-brand-moss/10">
                {prevLesson ? (
                  <button
                    onClick={() => setActiveLesson(prevLesson)}
                    className="flex items-center gap-2 py-3 px-6 rounded-full bg-white hover:bg-brand-cream/50 border border-brand-moss/15 text-xs font-bold text-brand-moss transition-colors shadow-xs"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous: {prevLesson.title.slice(0, 24)}...</span>
                  </button>
                ) : <div />}

                {nextLesson ? (
                  <button
                    onClick={() => {
                      handleMarkProgress(activeLesson.id, true);
                      setActiveLesson(nextLesson);
                    }}
                    className="flex items-center gap-2 py-3 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-xs font-bold text-white transition-all shadow-md"
                  >
                    <span>Next: {nextLesson.title.slice(0, 24)}...</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : enrollment?.certificateIssued ? (
                  <Link
                    to={`/academy/certificate/${enrollment.certificateId}`}
                    className="flex items-center gap-2 py-3 px-8 rounded-full bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white uppercase tracking-wider transition-all shadow-lg"
                  >
                    <Award className="w-4 h-4" />
                    <span>Graduation: View Certificate</span>
                  </Link>
                ) : <div />}
              </div>
            </>
          )}
        </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-center">
              <div className="max-w-md space-y-3">
                <BookOpen className="w-12 h-12 text-brand-moss/40 mx-auto" />
                <h3 className="font-heading font-bold text-lg text-brand-moss">Select a Lesson</h3>
                <p className="text-xs text-brand-charcoal/60">Choose any module from the left syllabus drawer to begin learning.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Course Checkout Modal for Gated Classroom */}
      {showCheckoutModal && course && (
        <CourseCheckoutModal
          isOpen={showCheckoutModal}
          course={course}
          currentUser={currentUser}
          selectedCurrency={selectedCurrency}
          formatCurrency={formatCurrency}
          convertMinor={convertMinor}
          onClose={() => setShowCheckoutModal(false)}
          onSuccess={(newEnrollment) => {
            setShowCheckoutModal(false);
            setEnrollment(newEnrollment);
            fetchCourseData();
          }}
        />
      )}
    </div>
  );
}
