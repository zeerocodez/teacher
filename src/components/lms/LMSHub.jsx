import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Sparkles, Video, Award, Users, CheckCircle2,
  Clock, ArrowRight, Search, Filter, Play, Star, ChevronRight,
  TrendingUp, ShieldCheck, Download, Calendar, ExternalLink, RefreshCw,
  Lock, Wallet, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import CourseCheckoutModal from './CourseCheckoutModal';

export default function LMSHub({ currentUser, selectedCurrency = 'NGN', formatCurrency, convertMinor }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'my-learning' | 'live' | 'certificates'
  const [courses, setCourses] = useState([]);
  const [myLearning, setMyLearning] = useState(null);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');

  const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '/api';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('eduvista_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Fetch Courses & My Learning
  const fetchLmsData = async () => {
    setLoading(true);
    try {
      const [cRes, lRes] = await Promise.all([
        fetch(`${API_BASE}/lms/courses`),
        fetch(`${API_BASE}/lms/live-classes`)
      ]);

      if (cRes.ok) setCourses(await cRes.json());
      if (lRes.ok) setLiveClasses(await lRes.json());

      if (currentUser) {
        const mlRes = await fetch(`${API_BASE}/lms/my-learning`, {
          headers: getAuthHeaders()
        });
        if (mlRes.ok) {
          setMyLearning(await mlRes.json());
        }
      }
    } catch (err) {
      console.warn("LMS fetch fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLmsData();
  }, [currentUser]);

  // Handle Enrollment
  const handleEnroll = async (course) => {
    if (!currentUser) {
      toast("Please log in or sign up to enroll in academy courses.");
      return;
    }

    const coursePrice = Number(course.price) || 0;
    const isVettedOnly = course.requiresVetting || course.accessType === 'vetted_teachers_only';

    // If course requires payment or vetting checks, open the checkout/vetting modal
    if (coursePrice > 0 || isVettedOnly) {
      setSelectedCourseForCheckout(course);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/lms/courses/${course.id}/enroll`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("✓ Enrolled successfully! Entering classroom...");
        navigate(`/academy/classroom/${course.id}`);
      } else {
        if (data.code === 'VETTING_REQUIRED' || data.code === 'PAYMENT_REQUIRED') {
          setSelectedCourseForCheckout(course);
        } else {
          toast.error(data.error || "Failed to enroll");
        }
      }
    } catch (err) {
      navigate(`/academy/classroom/${course.id}`);
    }
  };

  // Filtered courses
  const filteredCourses = courses.filter(c => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesLevel = selectedLevel === 'All' || c.level === selectedLevel;
    const matchesSearch = !searchQuery || (
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.tags && c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
    );
    return matchesCategory && matchesLevel && matchesSearch;
  });

  const categories = [
    'All',
    'Classroom Tech & AI',
    'Curriculum & Standards',
    'Executive Branding',
    'Pedagogy & Classroom'
  ];

  return (
    <div className="min-h-screen bg-brand-cream/20 text-brand-charcoal py-8 px-4 sm:px-6 lg:px-8">
      {/* Hero Banner */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="relative rounded-[2.5rem] bg-gradient-to-r from-brand-charcoal via-brand-moss to-brand-charcoal text-white p-8 sm:p-12 md:p-16 overflow-hidden shadow-2xl">
          {/* Subtle background glow */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-clay/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 animate-pulse" />
              EduBridge Elite Teachers Academy
            </div>

            <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
              World-Class Pedagogy, AI Tools & International Curricula Training.
            </h1>

            <p className="text-xs sm:text-sm text-brand-cream/80 leading-relaxed font-sans max-w-2xl">
              Elevate your teaching career with accredited masterclasses in Cambridge IGCSE, AI-powered lesson design, rubric evaluation, and high-yield educator branding.
            </p>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
              <div>
                <span className="font-heading font-bold text-xl sm:text-2xl text-white block">4.96 ★</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-cream/60">Trainee Rating</span>
              </div>
              <div>
                <span className="font-heading font-bold text-xl sm:text-2xl text-amber-300 block">600+</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-cream/60">Certified Teachers</span>
              </div>
              <div>
                <span className="font-heading font-bold text-xl sm:text-2xl text-white block">100%</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-cream/60">Verified Credentials</span>
              </div>
              <div>
                <span className="font-heading font-bold text-xl sm:text-2xl text-emerald-400 block">Live</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-cream/60">Weekly Masterclasses</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-brand-moss/10">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-brand-moss/10 shadow-xs">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`py-2.5 px-6 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'catalog'
                  ? 'bg-brand-moss text-white shadow-sm'
                  : 'text-brand-moss hover:bg-brand-cream/40'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Course Catalog ({courses.length})
            </button>

            <button
              onClick={() => setActiveTab('my-learning')}
              className={`py-2.5 px-6 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'my-learning'
                  ? 'bg-brand-moss text-white shadow-sm'
                  : 'text-brand-moss hover:bg-brand-cream/40'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              My Learning ({myLearning?.enrollments?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('live')}
              className={`py-2.5 px-6 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'live'
                  ? 'bg-brand-moss text-white shadow-sm'
                  : 'text-brand-moss hover:bg-brand-cream/40'
              }`}
            >
              <Video className="w-4 h-4 text-rose-500 animate-pulse" />
              Live Masterclasses ({liveClasses.length})
            </button>

            <button
              onClick={() => setActiveTab('certificates')}
              className={`py-2.5 px-6 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'certificates'
                  ? 'bg-brand-moss text-white shadow-sm'
                  : 'text-brand-moss hover:bg-brand-cream/40'
              }`}
            >
              <Award className="w-4 h-4 text-amber-500" />
              Certifications ({myLearning?.certificates?.length || 0})
            </button>
          </div>

          {/* Search bar */}
          {activeTab === 'catalog' && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses, topics, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-brand-moss/15 rounded-full pl-10 pr-4 py-2.5 text-xs text-brand-charcoal placeholder:text-brand-charcoal/40 focus:outline-none focus:border-brand-clay shadow-xs"
              />
            </div>
          )}
        </div>

        {/* Category Filter Pills (For Catalog) */}
        {activeTab === 'catalog' && (
          <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-2 px-4 rounded-full text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-brand-clay text-white shadow-xs'
                    : 'bg-white border border-brand-moss/10 text-brand-charcoal/70 hover:text-brand-moss hover:border-brand-moss/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 1. COURSE CATALOG TAB */}
        {activeTab === 'catalog' && (
          <div>
            {filteredCourses.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-brand-moss/10 p-8 space-y-3">
                <BookOpen className="w-12 h-12 text-brand-moss/30 mx-auto" />
                <h3 className="font-heading font-bold text-lg text-brand-moss">No Courses Match Your Filter</h3>
                <p className="text-xs text-brand-charcoal/60">Try clearing the search query or selecting a different category.</p>
                <button
                  onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                  className="py-2 px-5 rounded-full bg-brand-moss text-white text-xs font-bold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map(course => {
                  const enrollment = myLearning?.enrollments?.find(e => e.courseId === course.id);
                  const isEnrolled = !!enrollment;
                  const progress = enrollment?.progressPercentage || 0;

                  return (
                    <div
                      key={course.id}
                      className="bg-white border border-brand-moss/10 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                    >
                      {/* Course Image Header */}
                      <div className="relative aspect-video w-full overflow-hidden bg-brand-charcoal">
                        <img
                          src={course.thumbnail || course.coverImage}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          <span className="bg-brand-charcoal/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono font-bold text-amber-300 border border-amber-400/20 w-fit">
                            {course.category}
                          </span>
                          {(course.requiresVetting || course.accessType === 'vetted_teachers_only') && (
                            <span className="bg-amber-500/90 text-brand-charcoal backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center gap-1 w-fit shadow-xs">
                              <Lock className="w-2.5 h-2.5" />
                              Vetted Only
                            </span>
                          )}
                        </div>

                        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                          <span className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-brand-moss shadow-xs">
                            {course.level}
                          </span>
                          <span className="bg-emerald-600 text-white backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-xs">
                            {Number(course.price) > 0 
                              ? (formatCurrency ? formatCurrency(convertMinor ? convertMinor(course.price, 'NGN', selectedCurrency) : course.price, selectedCurrency) : `₦${(course.price / 100).toLocaleString()}`)
                              : 'Free'}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-mono">
                          <span className="flex items-center gap-1 font-bold text-amber-300">
                            ★ {course.rating || 4.9} ({course.reviewsCount || 100}+ reviews)
                          </span>
                          <span>{course.duration}</span>
                        </div>
                      </div>

                      {/* Course Body */}
                      <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h3 className="font-heading font-extrabold text-base sm:text-lg text-brand-moss leading-snug group-hover:text-brand-clay transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-xs text-brand-charcoal/70 line-clamp-2 leading-relaxed">
                            {course.subtitle || course.overview}
                          </p>
                        </div>

                        {/* Modules & Lessons Count */}
                        <div className="pt-3 border-t border-brand-moss/10 flex items-center justify-between text-xs text-brand-charcoal/60 font-mono">
                          <span>{course.modulesCount || 4} Modules · {course.lessonsCount || 12} Lessons</span>
                          <span className="font-bold text-emerald-700">{course.enrolledCount || 0} Enrolled</span>
                        </div>

                        {/* Progress bar if enrolled */}
                        {isEnrolled && (
                          <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between items-center text-[10px] font-mono font-bold text-brand-moss">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-brand-moss/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-brand-clay to-emerald-500 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Instructor & CTA */}
                        <div className="pt-4 border-t border-brand-moss/10 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={course.instructorAvatar}
                              alt={course.instructorName}
                              className="w-7 h-7 rounded-full object-cover border border-brand-moss/20"
                            />
                            <span className="text-xs font-bold text-brand-moss truncate max-w-[120px]">
                              {course.instructorName}
                            </span>
                          </div>

                          {isEnrolled ? (
                            <Link
                              to={`/academy/classroom/${course.id}`}
                              className="py-2.5 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 transition-transform scale-100 hover:scale-105"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Continue ({progress}%)
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleEnroll(course)}
                              className="py-2.5 px-5 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 transition-transform scale-100 hover:scale-105"
                            >
                              {Number(course.price) > 0 ? (
                                <>
                                  <Wallet className="w-3.5 h-3.5" />
                                  Enroll Now
                                </>
                              ) : (
                                <>
                                  Start Course
                                  <ChevronRight className="w-4 h-4" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. MY LEARNING TAB */}
        {activeTab === 'my-learning' && (
          <div className="space-y-8">
            {!currentUser ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-brand-moss/10 p-8 space-y-4">
                <Users className="w-12 h-12 text-brand-moss/40 mx-auto" />
                <h3 className="font-heading font-bold text-lg text-brand-moss">Log In to View Your Learning Hub</h3>
                <p className="text-xs text-brand-charcoal/60">Track your course progression, quizzes, and earned certifications.</p>
              </div>
            ) : myLearning?.enrollments?.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-brand-moss/10 p-8 space-y-4">
                <BookOpen className="w-12 h-12 text-brand-moss/40 mx-auto" />
                <h3 className="font-heading font-bold text-lg text-brand-moss">You Have Not Enrolled in Any Courses Yet</h3>
                <p className="text-xs text-brand-charcoal/60">Explore our accredited masterclasses to accelerate your teaching practice.</p>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="py-2.5 px-6 rounded-full bg-brand-clay text-white font-bold text-xs uppercase tracking-wider"
                >
                  Browse Course Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myLearning.enrollments.map(enr => (
                  <div key={enr.id} className="bg-white border border-brand-moss/10 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-brand-clay bg-brand-clay/10 px-2.5 py-0.5 rounded-full">
                          Enrolled
                        </span>
                        <span className="font-mono text-xs font-bold text-brand-moss">
                          {enr.progressPercentage}% Completed
                        </span>
                      </div>

                      <h3 className="font-heading font-bold text-lg text-brand-moss">
                        {enr.courseTitle}
                      </h3>

                      <div className="w-full h-2.5 bg-brand-moss/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-clay to-emerald-500 rounded-full"
                          style={{ width: `${enr.progressPercentage}%` }}
                        />
                      </div>

                      <div className="text-xs text-brand-charcoal/60 font-mono">
                        {enr.completedLessons?.length || 0} Lessons Finished
                      </div>
                    </div>

                    <div className="pt-4 border-t border-brand-moss/10 flex items-center justify-between">
                      {enr.certificateIssued ? (
                        <Link
                          to={`/academy/certificate/${enr.certificateId}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 font-mono"
                        >
                          <Award className="w-4 h-4" />
                          View Certificate
                        </Link>
                      ) : (
                        <span className="text-[11px] text-brand-charcoal/50 italic">
                          Certificate unlocks at 100%
                        </span>
                      )}

                      <Link
                        to={`/academy/classroom/${enr.courseId}`}
                        className="py-2.5 px-6 rounded-full bg-brand-moss hover:bg-brand-clay text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                      >
                        Enter Classroom
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. LIVE MASTERCLASSES TAB */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {liveClasses.map(live => (
                <div key={live.id} className="bg-white border border-brand-moss/10 rounded-[2rem] p-8 shadow-sm space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full font-mono text-[9px] uppercase font-bold ${
                        live.status === 'live'
                          ? 'bg-rose-100 text-rose-800 animate-pulse border border-rose-300'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        ● {live.status.toUpperCase()}
                      </span>
                      <span className="font-mono text-xs text-brand-charcoal/50">{live.durationMinutes} Minutes</span>
                    </div>

                    <h3 className="font-heading font-extrabold text-xl text-brand-moss leading-snug">
                      {live.title}
                    </h3>

                    <p className="text-xs text-brand-charcoal/80 leading-relaxed font-sans">
                      {live.description}
                    </p>

                    <div className="p-4 bg-brand-cream/30 rounded-2xl border border-brand-moss/10 flex items-center gap-3">
                      <img src={live.instructorAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-brand-moss/20" />
                      <div>
                        <span className="font-heading font-bold text-xs text-brand-moss block">{live.instructorName}</span>
                        <span className="text-[10px] text-brand-charcoal/60 font-mono">Senior Lead Trainer · EduBridge Academy</span>
                      </div>
                    </div>

                    <div className="text-xs font-mono text-brand-charcoal/70 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand-clay" />
                      <span>{new Date(live.scheduledStartTime).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-brand-moss/10 flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-700 font-bold">
                      {live.attendeesCount || 48} Educators Attending
                    </span>

                    <Link
                      to={`/academy/live/${live.id}`}
                      className="py-3 px-8 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition-transform scale-100 hover:scale-105"
                    >
                      <Video className="w-4 h-4" />
                      Join Live Studio
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. CERTIFICATES TAB */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            {!currentUser ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-brand-moss/10 p-8 space-y-3">
                <Award className="w-12 h-12 text-brand-moss/40 mx-auto" />
                <h3 className="font-heading font-bold text-lg text-brand-moss">Log In to View Your Certifications</h3>
              </div>
            ) : myLearning?.certificates?.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-brand-moss/10 p-8 space-y-4">
                <Award className="w-12 h-12 text-amber-500/40 mx-auto" />
                <h3 className="font-heading font-bold text-lg text-brand-moss">No Certificates Awarded Yet</h3>
                <p className="text-xs text-brand-charcoal/60 max-w-md mx-auto">
                  Complete 100% of any masterclass course modules and pass the practical assignment to earn your accredited digital certificate.
                </p>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="py-2.5 px-6 rounded-full bg-brand-clay text-white font-bold text-xs uppercase tracking-wider"
                >
                  Start an Accredited Course
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myLearning.certificates.map(cert => (
                  <div key={cert.id} className="bg-white border-2 border-amber-400/40 rounded-[2rem] p-6 shadow-md space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                          Verified Accreditation
                        </span>
                        <span className="font-mono text-[10px] text-brand-charcoal/50">
                          {new Date(cert.completionDate).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-heading font-bold text-lg text-brand-moss">
                        {cert.courseTitle}
                      </h3>

                      <span className="font-mono text-[10px] text-brand-clay font-bold block">
                        ID: {cert.certificateCode || cert.id}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-brand-moss/10 flex items-center justify-between">
                      <Link
                        to={`/academy/certificate/${cert.certificateCode || cert.id}`}
                        className="py-2.5 px-6 rounded-full bg-brand-moss hover:bg-brand-clay text-white text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        View & Download PDF
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Course Checkout & Access Modal */}
      {selectedCourseForCheckout && (
        <CourseCheckoutModal
          isOpen={!!selectedCourseForCheckout}
          course={selectedCourseForCheckout}
          currentUser={currentUser}
          selectedCurrency={selectedCurrency}
          formatCurrency={formatCurrency}
          convertMinor={convertMinor}
          onClose={() => setSelectedCourseForCheckout(null)}
          onSuccess={(enrollment) => {
            const courseId = selectedCourseForCheckout.id;
            setSelectedCourseForCheckout(null);
            fetchLmsData();
            navigate(`/academy/classroom/${courseId}`);
          }}
        />
      )}
    </div>
  );
}
