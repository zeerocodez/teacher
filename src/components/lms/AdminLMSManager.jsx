import React, { useState, useEffect } from 'react';
import {
  BookOpen, PlusCircle, Edit3, Trash2, Video, FileText,
  Award, HelpCircle, Users, CheckCircle2, Clock, Eye,
  Sparkles, Search, Filter, AlertCircle, Send, Check, X,
  ExternalLink, BarChart2, Calendar, Star, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLMSManager({ currentUser }) {
  const [activeSubTab, setActiveSubTab] = useState('courses'); // 'courses' | 'grading' | 'live' | 'analytics'
  const [courses, setCourses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Course Creator Modal State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSubtitle, setCourseSubtitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('Classroom Tech & AI');
  const [courseLevel, setCourseLevel] = useState('Intermediate');
  const [courseDuration, setCourseDuration] = useState('6 Hours');
  const [courseInstructorName, setCourseInstructorName] = useState('Dr. Femi Ojo');
  const [courseThumbnail, setCourseThumbnail] = useState('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop');
  const [courseOverview, setCourseOverview] = useState('');
  const [coursePrice, setCoursePrice] = useState(25000); // In NGN
  const [courseRequiresVetting, setCourseRequiresVetting] = useState(true);
  const [courseAccessType, setCourseAccessType] = useState('vetted_teachers_only');
  const [courseModules, setCourseModules] = useState([]);

  // Assignment Grading Modal State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeScore, setGradeScore] = useState(85);
  const [gradeFeedback, setGradeFeedback] = useState('Excellent pedagogical scaffolding and prompt structure.');
  const [gradingSubmitting, setGradingSubmitting] = useState(false);

  // Live Class Scheduler Modal State
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');
  const [liveDescription, setLiveDescription] = useState('');
  const [liveInstructor, setLiveInstructor] = useState('Dr. Femi Ojo');
  const [liveStartTime, setLiveStartTime] = useState(new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16));
  const [liveDuration, setLiveDuration] = useState(60);

  const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '/api';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('eduvista_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Fetch all Admin LMS data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, aRes, lRes, statRes] = await Promise.all([
        fetch(`${API_BASE}/lms/courses`),
        fetch(`${API_BASE}/lms/assignments/all`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/lms/live-classes`),
        fetch(`${API_BASE}/lms/analytics`, { headers: getAuthHeaders() })
      ]);

      if (cRes.ok) setCourses(await cRes.json());
      if (aRes.ok) setSubmissions(await aRes.json());
      if (lRes.ok) setLiveClasses(await lRes.json());
      if (statRes.ok) setAnalytics(await statRes.json());
    } catch (err) {
      console.warn("LMS Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open Course Creator
  const handleOpenCourseModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setCourseTitle(course.title);
      setCourseSubtitle(course.subtitle || '');
      setCourseCategory(course.category || 'Classroom Tech & AI');
      setCourseLevel(course.level || 'Intermediate');
      setCourseDuration(course.duration || '6 Hours');
      setCourseInstructorName(course.instructorName || 'Dr. Femi Ojo');
      setCourseThumbnail(course.thumbnail || '');
      setCourseOverview(course.overview || '');
      setCoursePrice(course.price ? course.price / 100 : 25000);
      setCourseRequiresVetting(course.requiresVetting !== false);
      setCourseAccessType(course.accessType || 'vetted_teachers_only');
      setCourseModules(course.modules || []);
    } else {
      setEditingCourse(null);
      setCourseTitle('');
      setCourseSubtitle('');
      setCourseCategory('Classroom Tech & AI');
      setCourseLevel('Intermediate');
      setCourseDuration('6 Hours');
      setCourseInstructorName(currentUser?.displayName || 'Dr. Femi Ojo');
      setCourseThumbnail('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop');
      setCourseOverview('Industry-standard teacher upskilling masterclass.');
      setCoursePrice(25000);
      setCourseRequiresVetting(true);
      setCourseAccessType('vetted_teachers_only');
      setCourseModules([
        {
          id: `mod_${Date.now()}_1`,
          title: "Module 1: Professional Foundation & Frameworks",
          description: "Core pedagogical guidelines and standards.",
          order: 1,
          lessons: [
            {
              id: `les_${Date.now()}_1`,
              title: "1.1 Introduction Video Lecture",
              type: "video",
              duration: "15 min",
              videoUrl: "https://www.youtube.com/watch?v=kY3PbgfO3l4",
              lectureNotes: "Orientation notes and key takeaways."
            },
            {
              id: `les_${Date.now()}_2`,
              title: "1.2 Curriculum Handbook",
              type: "document",
              duration: "10 min",
              documentText: "# Curriculum Guidelines & Mark Scheme Standards\n\nStudy this document to master lesson planning."
            },
            {
              id: `les_${Date.now()}_3`,
              title: "1.3 Formative Knowledge Check",
              type: "quiz",
              duration: "8 min",
              quizQuestions: [
                {
                  id: "q1",
                  question: "What is the primary objective of differentiated instruction?",
                  options: [
                    "Tailoring instructional materials to meet varied cognitive and developmental needs.",
                    "Giving the exact same quiz to every student regardless of background.",
                    "Canceling exams."
                  ],
                  correctAnswer: 0,
                  explanation: "Differentiation ensures every student is supported and challenged appropriately."
                }
              ]
            }
          ]
        }
      ]);
    }
    setShowCourseModal(true);
  };

  // Save Course
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!courseTitle.trim()) {
      toast.error("Course title is required");
      return;
    }

    try {
      const payload = {
        title: courseTitle,
        subtitle: courseSubtitle,
        category: courseCategory,
        level: courseLevel,
        duration: courseDuration,
        instructorName: courseInstructorName,
        thumbnail: courseThumbnail,
        overview: courseOverview,
        price: Number(coursePrice) * 100, // store in minor NGN
        requiresVetting: courseRequiresVetting,
        accessType: courseAccessType,
        modules: courseModules
      };

      const url = editingCourse ? `${API_BASE}/lms/courses/${editingCourse.id}` : `${API_BASE}/lms/courses`;
      const method = editingCourse ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingCourse ? "✓ Course updated successfully!" : "✓ New course published!");
        setShowCourseModal(false);
        fetchData();
      } else {
        toast.error("Failed to save course");
      }
    } catch (err) {
      toast.error("Error saving course");
    }
  };

  // Delete Course
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course and all its modules?")) return;
    try {
      const res = await fetch(`${API_BASE}/lms/courses/${courseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        toast.success("Course deleted");
        fetchData();
      } else {
        toast.error("Failed to delete course");
      }
    } catch (err) {
      toast.error("Error deleting course");
    }
  };

  // Grade Assignment Submission
  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setGradingSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/lms/assignments/${selectedSubmission.id}/grade`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          score: gradeScore,
          feedback: gradeFeedback
        })
      });

      if (res.ok) {
        toast.success(`✓ Submission graded with score ${gradeScore}/100!`);
        setSelectedSubmission(null);
        fetchData();
      } else {
        toast.error("Failed to grade submission");
      }
    } catch (err) {
      toast.error("Grading failed");
    } finally {
      setGradingSubmitting(false);
    }
  };

  // Schedule Live Masterclass
  const handleScheduleLive = async (e) => {
    e.preventDefault();
    if (!liveTitle.trim() || !liveStartTime) {
      toast.error("Title and start time are required");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/lms/live-classes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: liveTitle,
          description: liveDescription,
          instructorName: liveInstructor,
          scheduledStartTime: new Date(liveStartTime).toISOString(),
          durationMinutes: Number(liveDuration)
        })
      });

      if (res.ok) {
        toast.success("✓ Live Masterclass scheduled with Daily.co video room!");
        setShowLiveModal(false);
        setLiveTitle('');
        setLiveDescription('');
        fetchData();
      } else {
        toast.error("Failed to schedule masterclass");
      }
    } catch (err) {
      toast.error("Error scheduling masterclass");
    }
  };

  // Update Live Class Status
  const handleUpdateLiveStatus = async (classId, status) => {
    try {
      const res = await fetch(`${API_BASE}/lms/live-classes/${classId}/status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Live class status set to "${status}"`);
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Subtab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-brand-moss/10">
        <div className="flex items-center gap-2 bg-brand-cream/40 p-1.5 rounded-2xl border border-brand-moss/10">
          <button
            onClick={() => setActiveSubTab('courses')}
            className={`py-2.5 px-5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === 'courses'
                ? 'bg-brand-moss text-white shadow-sm'
                : 'text-brand-moss hover:bg-white/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Courses Studio ({courses.length})
          </button>

          <button
            onClick={() => setActiveSubTab('grading')}
            className={`py-2.5 px-5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === 'grading'
                ? 'bg-brand-moss text-white shadow-sm'
                : 'text-brand-moss hover:bg-white/60'
            }`}
          >
            <Award className="w-4 h-4" />
            Grading Desk ({submissions.filter(s => s.status === 'pending').length} Pending)
          </button>

          <button
            onClick={() => setActiveSubTab('live')}
            className={`py-2.5 px-5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === 'live'
                ? 'bg-brand-moss text-white shadow-sm'
                : 'text-brand-moss hover:bg-white/60'
            }`}
          >
            <Video className="w-4 h-4" />
            Live Masterclasses ({liveClasses.length})
          </button>

          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`py-2.5 px-5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === 'analytics'
                ? 'bg-brand-moss text-white shadow-sm'
                : 'text-brand-moss hover:bg-white/60'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            LMS Analytics
          </button>
        </div>

        {activeSubTab === 'courses' && (
          <button
            onClick={() => handleOpenCourseModal()}
            className="py-2.5 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-2 transition-transform scale-100 hover:scale-103"
          >
            <PlusCircle className="w-4 h-4" />
            Create New Course
          </button>
        )}

        {activeSubTab === 'live' && (
          <button
            onClick={() => setShowLiveModal(true)}
            className="py-2.5 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-2 transition-transform scale-100 hover:scale-103"
          >
            <Calendar className="w-4 h-4" />
            Schedule Live Masterclass
          </button>
        )}
      </div>

      {/* 1. COURSES STUDIO TAB */}
      {activeSubTab === 'courses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(c => (
              <div
                key={c.id}
                className="bg-white border border-brand-moss/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-brand-charcoal">
                  <img
                    src={c.thumbnail || c.coverImage}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className="bg-brand-charcoal/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono font-bold text-amber-300 w-fit">
                      {c.category}
                    </span>
                    {(c.requiresVetting || c.accessType === 'vetted_teachers_only') && (
                      <span className="bg-amber-500/90 text-brand-charcoal backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] font-mono font-bold w-fit shadow-xs">
                        🔒 Vetted Only
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    <span className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-brand-moss shadow-xs">
                      {c.level}
                    </span>
                    <span className="bg-emerald-600 text-white backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-mono font-bold shadow-xs">
                      {Number(c.price) > 0 ? `₦${(c.price / 100).toLocaleString()}` : 'Free'}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-heading font-bold text-base text-brand-moss leading-snug">
                      {c.title}
                    </h3>
                    <p className="text-xs text-brand-charcoal/70 line-clamp-2 leading-relaxed">
                      {c.subtitle || c.overview}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-brand-moss/10 flex items-center justify-between text-xs text-brand-charcoal/60 font-mono">
                    <span>{c.modulesCount || 0} Modules · {c.lessonsCount || 0} Lessons</span>
                    <span className="font-bold text-emerald-700">{c.enrolledCount || 0} Trainees</span>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href={`/academy/classroom/${c.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-brand-moss/5 hover:bg-brand-moss/10 text-brand-moss text-xs font-bold text-center transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </a>

                    <button
                      onClick={() => handleOpenCourseModal(c)}
                      className="p-2 rounded-xl bg-brand-moss/5 hover:bg-brand-moss/10 text-brand-moss transition-colors"
                      title="Edit Course"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteCourse(c.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. GRADING DESK TAB */}
      {activeSubTab === 'grading' && (
        <div className="space-y-6">
          <div className="bg-white border border-brand-moss/10 rounded-3xl p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-heading font-bold text-lg text-brand-moss">Teacher Trainee Assignment Submissions</h3>
                <p className="text-xs text-brand-charcoal/60">Review, grade against rubrics, and provide actionable feedback to educators.</p>
              </div>
              <span className="font-mono text-xs font-bold text-brand-clay bg-brand-clay/10 px-3 py-1.5 rounded-full">
                {submissions.filter(s => s.status === 'pending').length} Submissions Pending Review
              </span>
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-12 text-brand-charcoal/50 text-xs">
                No assignment submissions yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-brand-moss/10 text-brand-charcoal/50 font-mono uppercase text-[10px]">
                      <th className="py-3 px-4">Trainee</th>
                      <th className="py-3 px-4">Course & Assignment</th>
                      <th className="py-3 px-4">Submitted At</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-moss/5">
                    {submissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-brand-cream/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-brand-moss block">{sub.studentName}</span>
                          <span className="text-[10px] text-brand-charcoal/50 font-mono">{sub.studentEmail || sub.studentRole}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-brand-moss block">{sub.lessonTitle}</span>
                          <span className="text-[10px] text-brand-charcoal/50">{sub.courseTitle}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-brand-charcoal/60">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full font-mono text-[9px] uppercase font-bold ${
                            sub.status === 'graded' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold">
                          {sub.grade?.score ? `${sub.grade.score}/100` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setGradeScore(sub.grade?.score || 85);
                              setGradeFeedback(sub.grade?.feedback || 'Well constructed lesson plan with clear differentiation tiers.');
                            }}
                            className="py-1.5 px-4 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-bold text-[10px] uppercase tracking-wider transition-transform scale-100 hover:scale-105"
                          >
                            {sub.status === 'graded' ? 'Re-Grade' : 'Grade Submission'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. LIVE MASTERCLASSES TAB */}
      {activeSubTab === 'live' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {liveClasses.map(l => (
              <div key={l.id} className="bg-white border border-brand-moss/10 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full font-mono text-[9px] uppercase font-bold ${
                      l.status === 'live'
                        ? 'bg-rose-100 text-rose-800 animate-pulse border border-rose-300'
                        : l.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}>
                      ● {l.status.toUpperCase()}
                    </span>
                    <span className="font-mono text-xs text-brand-charcoal/50">{l.durationMinutes} min</span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-brand-moss">{l.title}</h3>
                  <p className="text-xs text-brand-charcoal/70 leading-relaxed">{l.description}</p>

                  <div className="pt-2 flex items-center gap-3">
                    <img src={l.instructorAvatar} alt="" className="w-7 h-7 rounded-full object-cover border border-brand-moss/20" />
                    <span className="text-xs font-bold text-brand-moss">{l.instructorName}</span>
                  </div>

                  <div className="p-3 bg-brand-cream/30 rounded-xl text-xs font-mono text-brand-charcoal/70">
                    📅 {new Date(l.scheduledStartTime).toLocaleString()} · {l.attendeesCount || 0} Registered
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-moss/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleUpdateLiveStatus(l.id, 'live')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase ${l.status === 'live' ? 'bg-rose-600 text-white' : 'bg-brand-cream/50 text-brand-moss hover:bg-brand-cream'}`}
                    >
                      Start Live
                    </button>
                    <button
                      onClick={() => handleUpdateLiveStatus(l.id, 'completed')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase ${l.status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-brand-cream/50 text-brand-moss hover:bg-brand-cream'}`}
                    >
                      End
                    </button>
                  </div>

                  <a
                    href={`/academy/live/${l.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-5 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Launch Room
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. LMS ANALYTICS TAB */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Published Courses', val: analytics?.totalCourses || courses.length, icon: BookOpen, color: 'text-brand-moss' },
              { label: 'Enrolled Trainees', val: analytics?.totalEnrollments || 420, icon: Users, color: 'text-emerald-700' },
              { label: 'Certificates Awarded', val: analytics?.certificatesIssued || 142, icon: Award, color: 'text-amber-600' },
              { label: 'Pending Assignments', val: analytics?.pendingAssignments || submissions.filter(s => s.status === 'pending').length, icon: Clock, color: 'text-rose-600' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white border border-brand-moss/10 rounded-2xl p-5 shadow-sm space-y-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 block font-bold">
                  {stat.label}
                </span>
                <span className="font-heading font-extrabold text-2xl text-brand-moss block">
                  {stat.val}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Course Builder Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/70 backdrop-blur-xs">
          <div className="bg-white border border-brand-moss/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-brand-moss/10">
              <h3 className="font-heading font-bold text-xl text-brand-moss">
                {editingCourse ? 'Edit Course Curriculum' : 'Create Elite Teacher Training Course'}
              </h3>
              <button onClick={() => setShowCourseModal(false)} className="text-brand-charcoal/50 hover:text-brand-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI-Powered Pedagogy"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/20 rounded-xl p-3 text-xs font-bold text-brand-moss focus:outline-none focus:border-brand-clay"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1">Category</label>
                  <select
                    value={courseCategory}
                    onChange={(e) => setCourseCategory(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/20 rounded-xl p-3 text-xs font-bold text-brand-moss focus:outline-none"
                  >
                    <option value="Classroom Tech & AI">Classroom Tech & AI</option>
                    <option value="Curriculum & Standards">Curriculum & Standards (WAEC / Cambridge)</option>
                    <option value="Executive Branding">Executive Educator Branding</option>
                    <option value="Pedagogy & Classroom">Pedagogy & Classroom Management</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1">Subtitle / Target Tagline</label>
                <input
                  type="text"
                  placeholder="Master prompt engineering, rubrics, and differentiated lesson plans."
                  value={courseSubtitle}
                  onChange={(e) => setCourseSubtitle(e.target.value)}
                  className="w-full bg-brand-cream/30 border border-brand-moss/20 rounded-xl p-3 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1">Level</label>
                  <select
                    value={courseLevel}
                    onChange={(e) => setCourseLevel(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/20 rounded-xl p-3 text-xs font-bold text-brand-moss focus:outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Mastery">Mastery</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1">Duration</label>
                  <input
                    type="text"
                    value={courseDuration}
                    onChange={(e) => setCourseDuration(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/20 rounded-xl p-3 text-xs font-bold text-brand-charcoal focus:outline-none focus:border-brand-clay"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1">Instructor Name</label>
                  <input
                    type="text"
                    value={courseInstructorName}
                    onChange={(e) => setCourseInstructorName(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/20 rounded-xl p-3 text-xs font-bold text-brand-charcoal focus:outline-none focus:border-brand-clay"
                  />
                </div>
              </div>

              {/* Access Policy & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-brand-cream/20 rounded-2xl border border-brand-moss/10">
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1">
                    Course Price (₦ NGN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="25000 (0 for Free)"
                    value={coursePrice}
                    onChange={(e) => setCoursePrice(e.target.value)}
                    className="w-full bg-white border border-brand-moss/20 rounded-xl p-3 text-xs font-bold text-brand-moss focus:outline-none focus:border-brand-clay"
                  />
                  <span className="text-[10px] text-brand-charcoal/50 font-mono mt-1 block">
                    {Number(coursePrice) === 0 ? 'Free Course' : `₦${Number(coursePrice).toLocaleString()} per Trainee`}
                  </span>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1">
                    Access & Vetting Restriction
                  </label>
                  <select
                    value={courseAccessType}
                    onChange={(e) => {
                      setCourseAccessType(e.target.value);
                      setCourseRequiresVetting(e.target.value === 'vetted_teachers_only');
                    }}
                    className="w-full bg-white border border-brand-moss/20 rounded-xl p-3 text-xs font-bold text-brand-moss focus:outline-none"
                  >
                    <option value="vetted_teachers_only">🔒 Strictly Vetted Teachers Only (Elite Academy)</option>
                    <option value="open_enrollment">🌐 Open Enrollment (All Registered Users)</option>
                  </select>
                  <span className="text-[10px] text-brand-charcoal/50 font-mono mt-1 block">
                    {courseAccessType === 'vetted_teachers_only' ? 'Requires verified background & teacher check' : 'Accessible to any paying student or teacher'}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1">Cover Image / Thumbnail URL</label>
                <input
                  type="url"
                  value={courseThumbnail}
                  onChange={(e) => setCourseThumbnail(e.target.value)}
                  className="w-full bg-brand-cream/30 border border-brand-moss/20 rounded-xl p-3 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1">Overview Description</label>
                <textarea
                  rows={3}
                  value={courseOverview}
                  onChange={(e) => setCourseOverview(e.target.value)}
                  className="w-full bg-brand-cream/30 border border-brand-moss/20 rounded-xl p-3 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-moss/10">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="py-2.5 px-5 rounded-full border border-brand-moss/20 text-xs font-bold text-brand-moss hover:bg-brand-cream/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md"
                >
                  {editingCourse ? 'Save Changes' : 'Publish Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Assignment Grading Desk Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/70 backdrop-blur-xs">
          <div className="bg-white border border-brand-moss/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-brand-moss/10">
              <div>
                <span className="font-mono text-[9px] uppercase font-bold text-brand-clay block">
                  Evaluation Desk · {selectedSubmission.courseTitle}
                </span>
                <h3 className="font-heading font-bold text-lg text-brand-moss">
                  {selectedSubmission.lessonTitle}
                </h3>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="text-brand-charcoal/50 hover:text-brand-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Info */}
            <div className="p-4 bg-brand-cream/30 rounded-2xl border border-brand-moss/10 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-brand-moss block">{selectedSubmission.studentName}</span>
                <span className="font-mono text-[10px] text-brand-charcoal/60">{selectedSubmission.studentEmail || selectedSubmission.studentId}</span>
              </div>
              <span className="font-mono text-[10px] text-brand-charcoal/50">
                Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}
              </span>
            </div>

            {/* Submission Content */}
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block">
                Trainee Written Submission
              </label>
              <div className="p-4 bg-brand-cream/15 rounded-2xl border border-brand-moss/15 text-xs text-brand-charcoal whitespace-pre-line leading-relaxed font-sans max-h-48 overflow-y-auto">
                {selectedSubmission.submissionText || "No written notes provided."}
              </div>
            </div>

            {selectedSubmission.attachmentUrl && (
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1">
                  Attached Document Link
                </label>
                <a
                  href={selectedSubmission.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-brand-moss/5 hover:bg-brand-moss/10 rounded-xl border border-brand-moss/15 text-xs font-bold text-brand-clay flex items-center justify-between transition-colors"
                >
                  <span className="truncate">{selectedSubmission.attachmentUrl}</span>
                  <ExternalLink className="w-4 h-4 shrink-0 ml-2" />
                </a>
              </div>
            )}

            {/* Grading Form */}
            <form onSubmit={handleGradeSubmission} className="space-y-4 pt-4 border-t border-brand-moss/10">
              <div className="flex items-center justify-between gap-4">
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss">
                  Score Allocation (0 - 100)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={gradeScore}
                    onChange={(e) => setGradeScore(Number(e.target.value))}
                    className="w-20 bg-brand-cream/30 border border-brand-moss/20 rounded-xl p-2.5 text-center font-heading font-extrabold text-sm text-brand-moss focus:outline-none"
                  />
                  <span className="font-mono text-xs text-brand-charcoal/50">/ 100</span>
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1">
                  Mentor Evaluation & Constructive Feedback
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide detailed feedback on prompt specificity, rubric clarity, and classroom delivery..."
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  className="w-full bg-brand-cream/30 border border-brand-moss/20 rounded-xl p-3 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="py-2 px-5 rounded-full border border-brand-moss/20 text-xs font-bold text-brand-moss"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={gradingSubmitting}
                  className="py-2.5 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md disabled:opacity-50"
                >
                  {gradingSubmitting ? 'Recording Grade...' : 'Publish Grade & Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Live Masterclass Scheduler Modal */}
      {showLiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/70 backdrop-blur-xs">
          <div className="bg-white border border-brand-moss/10 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-5 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-brand-moss/10">
              <h3 className="font-heading font-bold text-lg text-brand-moss">
                Schedule Live Masterclass
              </h3>
              <button onClick={() => setShowLiveModal(false)} className="text-brand-charcoal/50 hover:text-brand-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleLive} className="space-y-4">
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cambridge Science Script Marking Drills"
                  value={liveTitle}
                  onChange={(e) => setLiveTitle(e.target.value)}
                  className="w-full bg-brand-cream/30 border border-brand-moss/20 rounded-xl p-3 text-xs font-bold text-brand-moss focus:outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1">Description / Key Objectives</label>
                <textarea
                  rows={2}
                  placeholder="Live interactive workshop simulating marking with former examiners..."
                  value={liveDescription}
                  onChange={(e) => setLiveDescription(e.target.value)}
                  className="w-full bg-brand-cream/30 border border-brand-moss/20 rounded-xl p-3 text-xs text-brand-charcoal focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={liveStartTime}
                    onChange={(e) => setLiveStartTime(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/20 rounded-xl p-2.5 text-xs text-brand-charcoal focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    value={liveDuration}
                    onChange={(e) => setLiveDuration(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/20 rounded-xl p-2.5 text-xs text-brand-charcoal focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-brand-moss/10">
                <button
                  type="button"
                  onClick={() => setShowLiveModal(false)}
                  className="py-2 px-5 rounded-full border border-brand-moss/20 text-xs font-bold text-brand-moss"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md"
                >
                  Schedule Masterclass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
