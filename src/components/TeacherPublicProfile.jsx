import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Star, ShieldCheck, Video, Calendar, ArrowLeft, Heart, Languages, MapPin, Award, CheckCircle2, Zap, ChevronLeft, ChevronRight, ExternalLink, Crown, Sparkles, Play, BookOpen, Clock, Sliders, Check, Share2, Copy } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function TeacherPublicProfile({ 
  username, 
  onBack, 
  onBookClick, 
  selectedCurrency, 
  formatCurrency, 
  convertMinor,
  bookedSessions = []
}) {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);

  // Booking & Custom Plan states
  const [bookingPlanTab, setBookingPlanTab] = useState('slots'); // 'slots' | 'custom'
  const [customSessionsCount, setCustomSessionsCount] = useState(8);
  const [customAvailabilityPref, setCustomAvailabilityPref] = useState('Flexible');
  const [customFrequency, setCustomFrequency] = useState('2x / week');

  // Availability calendar states
  const [calendarMonth, setCalendarMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]); // Array of { day, time, dateString }

  const getDaysInMonth = (d) => {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  };

  const getStartDayOfMonth = (d) => {
    return new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  };

  const isTeacherAvailableOnDate = (d) => {
    if (!teacher || !teacher.availability) return false;
    
    // Past dates are not available
    const today = new Date();
    today.setHours(0,0,0,0);
    const checkDate = new Date(d);
    checkDate.setHours(0,0,0,0);
    if (checkDate < today) return false;

    // Check weekday name in availability
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[d.getDay()];
    
    // Check if tomorrow matches 'Tomorrow'
    const oneDayMs = 24 * 60 * 60 * 1000;
    const isTomorrow = checkDate.getTime() - today.getTime() === oneDayMs;

    if (isTomorrow && (teacher.availability['Tomorrow'] || teacher.availability['tomorrow'])) {
      return true;
    }
    
    // Match weekday case-insensitively
    const availableDays = Object.keys(teacher.availability).map(k => k.toLowerCase());
    return availableDays.includes(dayOfWeek.toLowerCase());
  };

  const getSlotsForDate = (d) => {
    if (!teacher || !teacher.availability) return [];
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[d.getDay()];
    
    // Check tomorrow first
    const today = new Date();
    today.setHours(0,0,0,0);
    const checkDate = new Date(d);
    checkDate.setHours(0,0,0,0);
    const oneDayMs = 24 * 60 * 60 * 1000;
    const isTomorrow = checkDate.getTime() - today.getTime() === oneDayMs;

    if (isTomorrow && (teacher.availability['Tomorrow'] || teacher.availability['tomorrow'])) {
      return teacher.availability['Tomorrow'] || teacher.availability['tomorrow'] || [];
    }

    // Match weekday
    const matchedKey = Object.keys(teacher.availability).find(k => k.toLowerCase() === dayOfWeek.toLowerCase());
    if (matchedKey) {
      return teacher.availability[matchedKey] || [];
    }
    return [];
  };

  const handleSlotToggle = (time) => {
    if (!selectedDate) return;
    const dateString = selectedDate.toISOString().split('T')[0];
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const isSelected = selectedSlots.some(s => s.dateString === dateString && s.time === time);
    
    if (isSelected) {
      setSelectedSlots(prev => prev.filter(s => !(s.dateString === dateString && s.time === time)));
    } else {
      setSelectedSlots(prev => [...prev, { day: dayName, time, dateString }]);
    }
  };

  const isSlotSelected = (time) => {
    if (!selectedDate) return false;
    const dateString = selectedDate.toISOString().split('T')[0];
    return selectedSlots.some(s => s.dateString === dateString && s.time === time);
  };

  const isCalendarSlotBooked = (dateString, time) => {
    return (bookedSessions || []).some(session => 
      (session.teacherId === teacher?.id || session.teacherId === teacher?.uid) &&
      session.status !== 'Cancelled' &&
      session.slot &&
      (session.slot.dateString === dateString || session.slot.day === dateString || (session.slot.day && session.slot.day.includes(dateString))) &&
      session.slot.time === time
    );
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE}/teachers/by-username/${username}`);
        if (response.ok) {
          const data = await response.json();
          setTeacher(data);
          
          // SEO Metadata optimization on mount
          document.title = `${data.name || 'Tutor'} | Online Home Tutoring & Lessons | EduVistar`;
          
          // Update or insert SEO meta description tag
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          const subjects = Array.isArray(data.subjects) ? data.subjects.join(', ') : 'subjects';
          metaDesc.setAttribute('content', `Book premium online home tutoring and private lessons with ${data.name || 'this tutor'} on EduVistar. Specializes in ${subjects}. Vetted credentials, secure escrow payment protection.`);
        } else {
          const errData = await response.json().catch(() => ({}));
          setError(errData.error || 'Tutor public profile page not found.');
        }
      } catch (err) {
        console.warn("Error fetching teacher profile:", err);
        setError('Tutor public profile page not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (!teacher) return;
    const teacherId = teacher.uid || teacher.id;
    fetch(`${API_BASE}/teachers/${teacherId}/reviews`)
      .then(res => res.json())
      .then(data => {
        if (data.reviews && data.reviews.length > 0) {
          setReviews(data.reviews.map(r => ({
            parent: r.parentName || 'Verified Parent',
            text: r.comment || 'Great session!',
            score: r.rating || 5,
            date: r.date
          })));
        } else if (teacher.reviews && teacher.reviews.length > 0) {
          setReviews(teacher.reviews);
        }
      })
      .catch(err => {
        console.warn("Failed to fetch live reviews:", err);
        if (teacher.reviews) setReviews(teacher.reviews);
      });
  }, [teacher]);

  // Clean up SEO tags when unmounting
  useEffect(() => {
    return () => {
      document.title = 'EduVistar | Premium 1-on-1 Online Home Tutoring & Private Lessons';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', 'Connect with certified, background-checked private tutors for online home tutoring and personalized academic lessons.');
      }
    };
  }, [username]);

  useEffect(() => {
    if (teacher && (teacher.uid || teacher.id)) {
      fetch(`${API_BASE}/teachers/${teacher.uid || teacher.id}/reviews`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setReviews(data);
          } else {
            setReviews(teacher.reviews || []);
          }
        })
        .catch(err => {
          console.error(err);
          setReviews(teacher.reviews || []);
        });
    }
  }, [teacher]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center font-mono text-xs">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-brand-clay border-t-transparent animate-spin mx-auto" />
          <span>Synchronizing Tutor SEO Profile Registry...</span>
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-heading font-bold text-2xl text-brand-moss mb-2">Profile Not Found</h2>
        <p className="font-sans text-xs text-brand-charcoal/70 max-w-sm mb-6">{error || 'This public tutor page is suspended, unverified, or does not exist.'}</p>
        <button onClick={onBack} className="py-2.5 px-6 rounded-full bg-brand-moss text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Return to Homepage
        </button>
      </div>
    );
  }

  const isGradeA = teacher?.tier === 'Grade A' || teacher?.isEliteVip || teacher?.isVipTeacher || (teacher?.badges || []).includes('badge-ai-cert');
  const isGradeB = !isGradeA && (teacher?.tier === 'Grade B' || teacher?.verified === true || teacher?.status === 'verified' || (teacher?.badges || []).includes('badge-verified'));

  return (
    <>
      <Helmet>
        <title>{teacher?.name ? `${teacher.name} | Online Home Tutoring & Lessons | EduVistar` : 'Tutor | EduVistar'}</title>
        <meta name="description" content={`Book premium online home tutoring and private lessons with ${teacher?.name || 'this tutor'} on EduVistar. Specializes in ${teacher?.subjects ? (Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : teacher.subjects) : 'various subjects'}. Vetted credentials, secure escrow payment protection.`} />
        <meta property="og:title" content={`${teacher?.name || 'Tutor'} | EduVistar`} />
      </Helmet>
      <article className="bg-brand-cream min-h-screen pb-24 text-brand-charcoal">
      
      {/* Cover Image Banner */}
      <div className="h-56 sm:h-72 md:h-80 w-full relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${teacher.coverImage || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-cream via-brand-moss/30 to-black/20" />
        
        {/* Back navigation button */}
        <button 
          onClick={onBack} 
          className="absolute top-4 left-4 sm:top-6 sm:left-12 py-2 px-4 sm:py-2.5 sm:px-5 bg-white/90 hover:bg-white backdrop-blur-md text-brand-moss font-sans font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-2 border border-brand-moss/10 shadow-md transition-all z-20"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 -mt-14 sm:-mt-24 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Tutor Dossier */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main header block card */}
          <div className="bg-white border border-brand-moss/10 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-6 md:p-10 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <img 
                src={teacher.avatar} 
                alt={teacher.name} 
                className="w-18 h-18 sm:w-28 sm:h-28 rounded-2xl sm:rounded-[2rem] object-cover border-2 border-white shadow-md shrink-0"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="font-heading font-bold text-xl sm:text-3xl text-brand-moss leading-tight tracking-tight">
                    {teacher.name}
                  </h1>
                  {isGradeA ? (
                    <Crown className="w-6 h-6 text-amber-600" title="Grade A Elite VVIP Tutor" />
                  ) : (
                    <Award className="w-5 h-5 text-brand-clay" title="Verified Tutor Profile" />
                  )}
                </div>
                <p className="font-drama italic text-sm text-brand-clay font-medium">
                  Professional Instructor in {Array.isArray(teacher.subjects) ? teacher.subjects.join(' & ') : ''}
                </p>
                <div className="flex items-center gap-1.5 mt-2 font-mono text-[9px] uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-brand-charcoal/40" />
                  <span>{teacher.location}</span>
                  <span className="text-brand-charcoal/20">|</span>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-current text-brand-clay" />
                    <span className="font-bold text-brand-moss">{teacher.rating || 5.0}</span>
                    <span className="text-brand-charcoal/50">({teacher.reviewsCount || 0} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges checklist & Tier status */}
            <div className="flex gap-2 flex-wrap items-center">
              {isGradeA ? (
                <span className="bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 font-mono text-[9px] uppercase tracking-wider font-bold py-1 px-3 rounded-full border border-amber-300 shadow-xs flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-700" /> Grade A Elite VVIP
                </span>
              ) : isGradeB ? (
                <span className="bg-blue-50 text-blue-800 font-mono text-[9px] uppercase tracking-wider font-bold py-1 px-3 rounded-full border border-blue-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-600" /> Grade B Verified
                </span>
              ) : (
                <span className="bg-brand-moss/10 text-brand-moss font-mono text-[9px] uppercase tracking-wider font-bold py-1 px-3 rounded-full">
                  Standard Educator
                </span>
              )}

              {teacher.linkedin && (
                <a
                  href={teacher.linkedin.startsWith('http') ? teacher.linkedin : `https://${teacher.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[9px] uppercase tracking-wider font-bold py-1 px-3 rounded-full border bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800 flex items-center gap-1.5 transition-all shadow-xs"
                  title="View Teacher's verified LinkedIn profile"
                >
                  <span className="font-bold">in</span>
                  <span>Verified LinkedIn</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              )}
              {(teacher.badges || []).filter(Boolean).map(badge => (
                  <span key={badge} className={`font-mono text-[9px] uppercase tracking-wider font-bold py-1 px-3 rounded-full border ${
                    badge === 'badge-bg-checked'
                      ? 'bg-amber-50 border-brand-clay/30 text-brand-clay'
                      : badge === 'badge-verified'
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : badge === 'badge-ai-cert'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]'
                  }`}>
                    {badge ? String(badge).replace('badge-', '').replace('-', ' ') : ''}
                  </span>
                )
              )}
            </div>
          </div>

          {/* About / Pedagogical Dossier & Video Intro Row */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-8">
            {/* Dynamic Biography Narrative */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-xl text-brand-moss flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand-clay" /> About {teacher.name}
                </h3>
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
                  ✓ Verified Educator Dossier
                </span>
              </div>
              <p className="font-sans text-brand-charcoal/80 text-sm leading-relaxed whitespace-pre-line bg-brand-cream/15 p-5 rounded-2xl border border-brand-moss/5">
                {teacher.bio || `${teacher.name} is a verified, background-checked educator on EduVistar specializing in personalized instruction, high-impact exam preparation, and holistic academic acceleration.`}
              </p>
            </div>

            {/* Subject Proficiencies Breakdown (Stating proficiency in subjects selected) */}
            <div className="border-t border-brand-moss/5 pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h4 className="font-heading font-bold text-base text-brand-moss flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-brand-clay" /> Subject Proficiencies & Pedagogical Focus
                  </h4>
                  <p className="font-sans text-xs text-brand-charcoal/60 mt-0.5">
                    Proficiency ratings submitted by the instructor and validated by EduVistar academy standards.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-brand-charcoal/50">
                  {Array.isArray(teacher.subjects) ? teacher.subjects.length : 0} Subjects Mastered
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(teacher.subjects || []).map((sub) => {
                  const statedProficiency = teacher.subjectProficiencies?.[sub] || (isGradeA ? 'Mastery (WAEC & IGCSE Specialist)' : 'Advanced (Senior Secondary Specialist)');
                  
                  // Compute proficiency percentage for visual meter
                  const meterPercent = statedProficiency.includes('Mastery') ? 98 :
                                       statedProficiency.includes('Advanced') ? 92 :
                                       statedProficiency.includes('University') ? 95 :
                                       statedProficiency.includes('Specialist') ? 88 : 84;

                  return (
                    <div key={sub} className="bg-brand-cream/25 border border-brand-moss/10 rounded-2xl p-4 space-y-2.5 shadow-xs hover:border-brand-clay/30 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-heading font-bold text-sm text-brand-moss">{sub}</h5>
                          <span className="font-sans text-[11px] font-semibold text-brand-clay block mt-0.5">
                            {statedProficiency}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-brand-moss bg-white px-2 py-0.5 rounded-md border border-brand-moss/10 shadow-2xs">
                          {meterPercent}%
                        </span>
                      </div>

                      {/* Visual Proficiency Meter */}
                      <div className="w-full bg-brand-moss/10 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-brand-moss via-brand-clay to-amber-500 transition-all duration-700" 
                          style={{ width: `${meterPercent}%` }} 
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-brand-charcoal/60 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Syllabus Aligned
                        </span>
                        <span>1-on-1 Mastery Focus</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Supported Curricula & Exam Boards */}
            {(teacher.curricula && teacher.curricula.length > 0) && (
              <div className="border-t border-brand-moss/5 pt-6 space-y-2.5">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss">
                  Supported Curriculums & Exam Syllabuses
                </h4>
                <div className="flex flex-wrap gap-2">
                  {teacher.curricula.map((curr) => (
                    <span key={curr} className="bg-brand-clay/10 text-brand-clay border border-brand-clay/20 font-sans font-bold text-xs px-3 py-1 rounded-full shadow-2xs">
                      ✓ {curr}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Video Intro Section with Embedded Player & Direct Links */}
            <div className="border-t border-brand-moss/5 pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading font-bold text-lg text-brand-moss flex items-center gap-2">
                    <Video className="w-5 h-5 text-brand-clay" /> Video Introduction
                  </h3>
                  <p className="font-sans text-xs text-brand-charcoal/60 mt-0.5">
                    Watch the instructor present their teaching philosophy, accent, and classroom approach.
                  </p>
                </div>

                {teacher.videoUrl && (
                  <div className="flex items-center gap-2">
                    <a 
                      href={teacher.videoUrl.startsWith('http') ? teacher.videoUrl : `https://${teacher.videoUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-magnetic py-2 px-3.5 rounded-full bg-brand-moss hover:bg-brand-clay text-white font-sans text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Video Link
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(teacher.videoUrl);
                        toast.success("Intro video link copied to clipboard!");
                      }}
                      className="p-2 rounded-full border border-brand-moss/15 bg-white hover:bg-brand-cream/50 text-brand-moss transition-colors shadow-2xs"
                      title="Copy video URL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {teacher.videoUrl ? (
                <div className="aspect-video w-full rounded-[2rem] overflow-hidden bg-brand-charcoal border border-brand-moss/10 shadow-lg relative group">
                  {teacher.videoUrl.includes('youtube.com') || teacher.videoUrl.includes('youtu.be') ? (
                    <iframe 
                      className="w-full h-full"
                      src={teacher.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                      title={`${teacher.name} Video Introduction`}
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video controls className="w-full h-full object-cover">
                      <source src={teacher.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              ) : (
                <div className="bg-brand-cream/30 border border-dashed border-brand-moss/20 rounded-2xl p-6 text-center space-y-2">
                  <Video className="w-8 h-8 text-brand-clay/60 mx-auto" />
                  <h5 className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss">
                    Live Video Assessment On File
                  </h5>
                  <p className="font-sans text-xs text-brand-charcoal/70 max-w-md mx-auto">
                    {teacher.name} has completed internal video assessment and accreditation with the EduVistar Pedagogical Review Board. Direct video upload will be public shortly.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Trophy Cabinet */}
          {teacher.badges && teacher.badges.length > 0 && (
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
              <h3 className="font-heading font-bold text-lg text-brand-moss mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-clay" /> Trophy Cabinet
              </h3>
              <div className="flex gap-3 flex-wrap">
                {(teacher.badges || []).filter(Boolean).map(badge => (
                  <div key={badge} className="flex flex-col items-center justify-center p-4 border border-brand-moss/10 rounded-2xl bg-brand-cream/30 min-w-[100px]">
                    {badge === 'badge-top-rated' && <Star className="w-8 h-8 text-[#92400E] mb-2 fill-current" />}
                    {badge === 'badge-ai-cert' && <Zap className="w-8 h-8 text-emerald-600 mb-2 fill-current" />}
                    {badge === 'badge-verified' && <ShieldCheck className="w-8 h-8 text-blue-600 mb-2" />}
                    {badge === 'badge-bg-checked' && <ShieldCheck className="w-8 h-8 text-brand-clay mb-2 fill-brand-clay/10 animate-pulse" />}
                    <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-brand-charcoal text-center">
                      {badge ? String(badge).replace('badge-', '').replace('-', ' ') : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews list */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
            <h3 className="font-heading font-bold text-lg text-brand-moss mb-6">Parent Assessment Reviews</h3>
            
            {(!reviews || reviews.length === 0) ? (
              <div className="py-6 text-center font-sans text-brand-charcoal/50 text-xs">
                No reviews logged yet. Active reviews display once classroom trials conclude.
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((rev, index) => (
                  <div key={rev.id || index} className="bg-brand-cream/15 border border-brand-moss/5 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-heading font-bold text-brand-moss text-sm">{rev.parentName || rev.parent || 'Verified Parent'}</h4>
                        <div className="flex gap-0.5 text-brand-clay mt-1">
                          {Array.from({ length: Math.max(0, Math.min(5, Math.round(Number(rev.overallRating || rev.score || 5)) || 5)) }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      <span className="font-mono text-[9px] text-brand-charcoal/40 uppercase">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : rev.date || 'Recent'}
                      </span>
                    </div>

                    {/* 5 Dimensions */}
                    {rev.dimensions && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-brand-moss/5">
                        {Object.entries(rev.dimensions).map(([dim, score]) => (
                          <div key={dim}>
                            <div className="flex justify-between font-mono text-[9px] text-brand-charcoal/60 uppercase mb-1">
                              <span>{dim}</span>
                              <span>{score}/5</span>
                            </div>
                            <div className="w-full bg-brand-moss/10 rounded-full h-1.5">
                              <div className="bg-brand-clay h-1.5 rounded-full" style={{ width: `${(score / 5) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="font-sans text-xs text-brand-charcoal/80 leading-relaxed italic bg-white p-3 rounded-xl border border-brand-moss/5 shadow-sm">
                      "{rev.comment || rev.text}"
                    </p>

                    {rev.reply && (
                      <div className="bg-brand-moss/5 border border-brand-moss/10 rounded-xl p-3 ml-6 mt-2 relative">
                        <div className="absolute -left-3 top-4 w-3 h-px bg-brand-moss/20" />
                        <h5 className="font-heading font-bold text-[10px] text-brand-moss uppercase tracking-wider mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tutor Reply
                        </h5>
                        <p className="font-sans text-xs text-brand-charcoal/70 leading-relaxed">{rev.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Rate Card & Slot booking */}
        <div className="lg:col-span-4 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-lg space-y-6 lg:sticky lg:top-28">
          
          {/* Rate Header Card */}
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-brand-charcoal/50 block mb-0.5">HOURLY RATE</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="font-heading text-xl sm:text-2xl font-extrabold text-brand-moss">
                    {formatCurrency(convertMinor(teacher.rate || 400000, selectedCurrency), selectedCurrency)}
                  </span>
                  <span className="font-mono text-[10px] text-brand-charcoal/50">/ hr</span>
                </div>
              </div>

              {isGradeA ? (
                <div className="text-right">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-amber-800 font-bold block mb-0.5 flex items-center justify-end gap-1">
                    <Crown className="w-3 h-3 text-amber-700 inline" /> MONTHLY FLOOR
                  </span>
                  <span className="font-heading text-base font-extrabold text-amber-900">
                    ₦100,000 / mo
                  </span>
                </div>
              ) : (
                <div className="text-right">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-brand-charcoal/50 block mb-0.5">MONTHLY CONTRACT</span>
                  <span className="font-heading text-xs font-bold text-brand-moss">Flexible rates</span>
                </div>
              )}
            </div>

            {isGradeA && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-[11px] font-sans text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Crown className="w-3.5 h-3.5 text-amber-700" />
                  <span>Grade A Elite VVIP Guarantee</span>
                </div>
                <p className="text-[10px] opacity-85 leading-relaxed">
                  Certified via Elite Teachers Academy (Module 4+). Monthly client contracts are protected at a minimum of ₦100,000/month.
                </p>
              </div>
            )}
          </div>

          <div className="h-px bg-brand-moss/5" />

          {/* Availability details summary */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-brand-moss text-xs uppercase tracking-wider">Available Classes</h4>
            <div className="space-y-2 font-sans text-xs">
              <div className="flex justify-between text-brand-charcoal/70">
                <span>Spoken Languages:</span>
                <span className="font-bold flex items-center gap-1"><Languages className="w-3.5 h-3.5 text-brand-clay" /> {Array.isArray(teacher.languages) ? teacher.languages.join(', ') : (typeof teacher.languages === 'string' ? teacher.languages : 'English')}</span>
              </div>
              <div className="flex justify-between text-brand-charcoal/70">
                <span>Vetting Status:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Verified Profile</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-brand-moss/5" />

          {/* Plan Booking Mode Switcher: Single/Slots vs Custom Plan */}
          <div className="bg-brand-cream/80 p-1.5 rounded-2xl border border-brand-moss/10 flex gap-1">
            <button
              type="button"
              onClick={() => setBookingPlanTab('slots')}
              className={`flex-1 py-2 px-2.5 rounded-xl font-sans text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                bookingPlanTab === 'slots'
                  ? 'bg-brand-moss text-white shadow-sm'
                  : 'text-brand-charcoal/70 hover:text-brand-moss hover:bg-white/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar Slots</span>
            </button>
            <button
              type="button"
              onClick={() => setBookingPlanTab('custom')}
              className={`flex-1 py-2 px-2.5 rounded-xl font-sans text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                bookingPlanTab === 'custom'
                  ? 'bg-brand-clay text-white shadow-sm'
                  : 'text-brand-charcoal/70 hover:text-brand-clay hover:bg-white/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Custom Plan</span>
            </button>
          </div>

          {bookingPlanTab === 'custom' ? (
            /* Custom Pricing Plan Builder */
            <div className="space-y-5 animate-fade-up">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-brand-clay" /> Custom Plan Builder
                  </span>
                  <span className="text-[9px] font-mono bg-brand-clay/10 text-brand-clay px-2 py-0.5 rounded-full font-bold">
                    Tailored Tutoring
                  </span>
                </div>
                <p className="text-[11px] text-brand-charcoal/75 leading-relaxed">
                  Design your own custom learning pack with {teacher.name}. Choose your number of sessions and preferred availability schedule.
                </p>
              </div>

              {/* Number of Sessions Stepper & Quick Pills */}
              <div className="space-y-2.5">
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block">
                  1. Number of Sessions
                </label>
                <div className="flex items-center justify-between bg-brand-cream/30 border border-brand-moss/10 rounded-2xl p-2">
                  <button
                    type="button"
                    onClick={() => setCustomSessionsCount(prev => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-white hover:bg-brand-cream border border-brand-moss/10 flex items-center justify-center font-bold text-lg text-brand-moss shadow-xs"
                  >
                    -
                  </button>
                  <div className="text-center">
                    <span className="font-heading font-extrabold text-2xl text-brand-moss block">
                      {customSessionsCount}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50">
                      {customSessionsCount === 1 ? 'Private Session' : 'Private Sessions'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomSessionsCount(prev => Math.min(32, prev + 1))}
                    className="w-10 h-10 rounded-xl bg-white hover:bg-brand-cream border border-brand-moss/10 flex items-center justify-center font-bold text-lg text-brand-moss shadow-xs"
                  >
                    +
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[4, 8, 12, 16].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCustomSessionsCount(num)}
                      className={`py-1.5 rounded-xl font-mono text-[10px] font-bold border transition-all ${
                        customSessionsCount === num
                          ? 'bg-brand-clay text-white border-brand-clay shadow-xs'
                          : 'bg-white text-brand-charcoal/70 border-brand-moss/10 hover:border-brand-moss/30'
                      }`}
                    >
                      {num} Sessions
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Availability Preferences */}
              <div className="space-y-2">
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block">
                  2. Preferred Schedule / Availability
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Flexible', label: 'Flexible (Anytime)' },
                    { id: 'Weekdays', label: 'Weekdays (Mon-Fri)' },
                    { id: 'Weekends', label: 'Weekends (Sat-Sun)' },
                    { id: 'Evenings', label: 'Evenings (4pm - 8pm)' },
                  ].map(slot => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setCustomAvailabilityPref(slot.id)}
                      className={`py-2 px-2.5 rounded-xl text-left border text-xs font-sans transition-all ${
                        customAvailabilityPref === slot.id
                          ? 'bg-brand-moss text-white font-bold border-brand-moss shadow-xs'
                          : 'bg-white text-brand-charcoal/80 border-brand-moss/10 hover:border-brand-moss/30'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Frequency */}
              <div className="space-y-2">
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block">
                  3. Weekly Frequency
                </label>
                <div className="flex gap-2">
                  {['1x / week', '2x / week', '3x / week', '4x / week'].map(freq => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setCustomFrequency(freq)}
                      className={`flex-1 py-1.5 rounded-xl text-center border font-mono text-[10px] font-bold transition-all ${
                        customFrequency === freq
                          ? 'bg-brand-clay text-white border-brand-clay shadow-xs'
                          : 'bg-white text-brand-charcoal/70 border-brand-moss/10 hover:border-brand-moss/30'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimated Total Card */}
              {(() => {
                const tutorRate = teacher.rate || 350000;
                const totalCostMinor = customSessionsCount * tutorRate;
                const convertedTotal = convertMinor(totalCostMinor, selectedCurrency);
                const formattedTotal = formatCurrency(convertedTotal, selectedCurrency);
                return (
                  <div className="bg-brand-moss text-white rounded-2xl p-4 space-y-2 shadow-md">
                    <div className="flex justify-between items-baseline">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-brand-cream/60">
                        Custom Plan Total ({customSessionsCount} Sessions)
                      </span>
                      <span className="font-heading text-xl font-bold text-white">
                        {formattedTotal}
                      </span>
                    </div>
                    <div className="text-[10px] text-brand-cream/70 flex items-center justify-between border-t border-brand-cream/10 pt-2">
                      <span>Rate: {formatCurrency(convertMinor(tutorRate, selectedCurrency), selectedCurrency)}/session</span>
                      <span className="text-emerald-300 font-bold">✓ Escrow Protected</span>
                    </div>
                  </div>
                );
              })()}

              {/* Book Custom Plan CTA Button */}
              <button
                type="button"
                onClick={() => onBookClick(teacher, null, selectedSlots, {
                  bookingMode: 'custom',
                  customSessionsCount,
                  customAvailabilityPref,
                  customFrequency
                })}
                className="btn-magnetic w-full py-4 bg-brand-clay hover:bg-brand-clay/90 text-white rounded-full font-heading font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-clay/20 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4.5 h-4.5" /> Book Custom Plan ({customSessionsCount} Sessions)
              </button>
            </div>
          ) : (
            /* Standard Interactive Availability Calendar */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-heading font-bold text-brand-moss text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-brand-clay" /> Availability
                </h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                    className="p-1 rounded-full hover:bg-brand-moss/5 text-brand-moss"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-[10px] font-bold text-brand-moss min-w-[90px] text-center">
                    {calendarMonth.toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                    className="p-1 rounded-full hover:bg-brand-moss/5 text-brand-moss"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="border border-brand-moss/10 rounded-2xl p-3 bg-brand-cream/10">
                {/* Day Labels */}
                <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] text-brand-charcoal/40 font-bold mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((l, idx) => (
                    <span key={idx}>{l}</span>
                  ))}
                </div>

                {/* Days Numbers */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Blank lead offsets */}
                  {Array.from({ length: getStartDayOfMonth(calendarMonth) }).map((_, i) => (
                    <div key={`blank-${i}`} />
                  ))}

                  {/* Day Cells */}
                  {(() => {
                    const daysInMonth = getDaysInMonth(calendarMonth);
                    const cells = [];
                    for (let day = 1; day <= daysInMonth; day++) {
                      const cellDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                      const available = isTeacherAvailableOnDate(cellDate);
                      const isSelected = selectedDate && 
                                         selectedDate.getDate() === day && 
                                         selectedDate.getMonth() === calendarMonth.getMonth() && 
                                         selectedDate.getFullYear() === calendarMonth.getFullYear();
                      
                      cells.push(
                        <button
                          key={day}
                          disabled={!available}
                          onClick={() => {
                            setSelectedDate(cellDate);
                            setSelectedSlots([]);
                          }}
                          className={`h-7 w-7 rounded-full text-[9px] font-mono flex items-center justify-center mx-auto transition-all ${
                            isSelected
                              ? 'bg-brand-moss text-white font-bold shadow-sm'
                              : available
                              ? 'bg-emerald-50 border border-emerald-250 text-emerald-800 hover:bg-emerald-100 font-bold'
                              : 'text-brand-charcoal/20 cursor-not-allowed'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    }
                    return cells;
                  })()}
                </div>
              </div>

              {/* Slots Panel */}
              {selectedDate && (
                <div className="bg-brand-cream/35 border border-brand-moss/5 p-3 rounded-xl animate-fade-up space-y-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-brand-moss block">
                    Time Slots ({selectedDate.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}):
                  </span>
                  {getSlotsForDate(selectedDate).length === 0 ? (
                    <span className="text-[10px] text-brand-charcoal/50 italic block">No slots set.</span>
                  ) : (
                    <div className="flex gap-1.5 flex-wrap">
                      {getSlotsForDate(selectedDate).map(time => {
                        const dateString = selectedDate.toISOString().split('T')[0];
                        const booked = isCalendarSlotBooked(dateString, time);
                        const activeSelected = isSlotSelected(time);
                        return (
                          <button
                            key={time}
                            disabled={booked}
                            onClick={() => handleSlotToggle(time)}
                            className={`py-1 px-2.5 rounded-lg border font-mono text-[9px] transition-all ${
                              booked
                                ? 'border-gray-200 bg-gray-150 text-gray-400 cursor-not-allowed opacity-50 line-through'
                                : activeSelected
                                ? 'bg-brand-clay border-brand-clay text-white font-bold'
                                : 'border-brand-moss/10 bg-white hover:border-brand-clay hover:text-brand-clay text-brand-charcoal'
                            }`}
                          >
                            {time} {booked && "(Booked)"}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Sessions Summary Basket */}
              {selectedSlots.length > 0 && (
                <div className="bg-brand-moss/5 border border-brand-moss/10 rounded-2xl p-4 space-y-2 font-sans text-xs">
                  <span className="font-heading font-bold text-brand-moss uppercase text-[10px] tracking-wider block">
                    Selected Sessions ({selectedSlots.length}):
                  </span>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                    {selectedSlots.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white border border-brand-moss/5 rounded-xl px-3 py-1.5 shadow-sm">
                        <span>{s.day} at <strong className="text-brand-moss">{s.time}</strong></span>
                        <button 
                          type="button"
                          onClick={() => setSelectedSlots(prev => prev.filter((_, i) => i !== idx))} 
                          className="text-red-500 hover:text-red-700 font-bold ml-2 text-[10px] uppercase tracking-wider"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct CTA button to check booking triggers */}
              <button
                onClick={() => onBookClick(teacher, null, selectedSlots)}
                disabled={selectedSlots.length === 0}
                className={`btn-magnetic w-full py-4 font-heading font-bold text-xs uppercase tracking-wider rounded-full shadow-lg flex items-center justify-center gap-2 ${
                  selectedSlots.length === 0
                    ? 'bg-brand-moss/20 text-brand-moss/45 cursor-not-allowed shadow-none'
                    : 'bg-brand-clay hover:bg-brand-clay/95 text-white shadow-brand-clay/20'
                }`}
              >
                <CheckCircle2 className="w-4.5 h-4.5" /> 
                {selectedSlots.length > 0 
                  ? `Book Selected Sessions (${selectedSlots.length})` 
                  : 'Select slots in calendar'
                }
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Sticky Booking Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-moss/10 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 block">Rate</span>
          <span className="font-heading font-extrabold text-sm text-brand-moss block">
            {formatCurrency(convertMinor(teacher.rate || 400000, selectedCurrency), selectedCurrency)}/hr
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onBookClick(teacher, null, selectedSlots)}
            className="btn-magnetic py-2.5 px-5 bg-brand-clay hover:bg-brand-clay/90 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" /> Book Lesson
          </button>
        </div>
      </div>

      </article>
    </>
  );
}
