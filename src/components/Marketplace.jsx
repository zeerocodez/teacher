import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Crown, Search, Star, ShieldCheck, CheckCircle2, Award, Zap, HelpCircle, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Marketplace({ 
  teachers = [], 
  hasMoreTeachers,
  loadFilteredTeachers,
  teachersPage,
  selectedCurrency, 
  onBookClick, 
  formatCurrency, 
  convertMinor,
  onTeacherSelect,
  onWatchVideo,
  isNested = false
}) {
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [curriculumFilter, setCurriculumFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All'); // 'All' | 'Grade A' | 'Grade B' | 'Freemium'
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);

  // Tier helpers
  const isTeacherGradeA = (t) => t?.tier === 'Grade A' || t?.isEliteVip || t?.isVipTeacher || (t?.badges || []).includes('badge-ai-cert');
  const isTeacherGradeB = (t) => !isTeacherGradeA(t) && (t?.tier === 'Grade B' || t?.verified === true || t?.status === 'verified' || (t?.badges || []).includes('badge-verified'));

  const displayTeachers = React.useMemo(() => {
    let list = teachers || [];
    
    // Only verified or active teachers
    list = list.filter(t => t.status !== 'suspended' && t.status !== 'rejected');

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(t => 
        (t.name && t.name.toLowerCase().includes(q)) || 
        (t.bio && t.bio.toLowerCase().includes(q)) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.subjects && Array.isArray(t.subjects) && t.subjects.some(s => s && String(s).toLowerCase().includes(q))) ||
        (t.curricula && Array.isArray(t.curricula) && t.curricula.some(c => c && String(c).toLowerCase().includes(q)))
      );
    }

    if (tierFilter && tierFilter !== 'All') {
      if (tierFilter === 'Grade A') {
        list = list.filter(isTeacherGradeA);
      } else if (tierFilter === 'Grade B') {
        list = list.filter(isTeacherGradeB);
      } else if (tierFilter === 'Freemium') {
        list = list.filter(t => !isTeacherGradeA(t) && !isTeacherGradeB(t));
      }
    }

    if (subjectFilter && subjectFilter !== 'All') {
      const sLower = subjectFilter.toLowerCase().trim();
      list = list.filter(t => 
        t.subjects && Array.isArray(t.subjects) && t.subjects.some(s => {
          if (!s) return false;
          const str = String(s).toLowerCase().trim();
          return str === sLower || str.includes(sLower) || sLower.includes(str);
        })
      );
    }

    if (curriculumFilter && curriculumFilter !== 'All') {
      const cLower = curriculumFilter.toLowerCase().trim();
      list = list.filter(t => 
        t.curricula && Array.isArray(t.curricula) && t.curricula.some(c => {
          if (!c) return false;
          const str = String(c).toLowerCase().trim();
          return str === cLower || str.includes(cLower) || cLower.includes(str);
        })
      );
    }

    return list;
  }, [teachers, searchQuery, tierFilter, subjectFilter, curriculumFilter]);

  React.useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => setLeaderboard(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

    // Fetch from backend when filters change
  React.useEffect(() => {
    if (loadFilteredTeachers) {
      // Use a small timeout for debounce on search
      const delay = setTimeout(() => {
        loadFilteredTeachers({
          subject: subjectFilter,
          curriculum: curriculumFilter,
          search: searchQuery
        }, 1, false);
      }, 300);
      return () => clearTimeout(delay);
    }
  }, [subjectFilter, curriculumFilter, searchQuery]);

  return (
    <section id="marketplace" className={`${isNested ? 'pt-6 pb-20' : 'py-16 sm:py-24'} px-4 sm:px-8 md:px-16 lg:px-24 bg-brand-cream max-w-7xl mx-auto`}>
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-3">EduVistar Marketplace</span>
        <h2 className="font-heading font-bold text-3xl sm:text-5xl text-brand-moss tracking-tight">
          Find Your Perfect Verified Instructor
        </h2>
        <p className="font-sans text-sm text-brand-charcoal/70 mt-3 max-w-xl mx-auto">
          Every teacher is biometrically verified, Elite-Academy certified, and rated by parents. Top 5% of African pedagogy.
        </p>
      </div>

      {/* Leaderboard Section */}
      {leaderboard.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading font-bold text-2xl text-brand-moss flex items-center gap-2">
                <Award className="w-6 h-6 text-brand-clay" /> Featured Elite Tutors
              </h3>
              <p className="font-sans text-xs text-brand-charcoal/60 mt-1">This week's top-rated educators by parent reviews and platform achievements.</p>
            </div>
            <span className="bg-[#FEF3C7] text-[#92400E] font-mono text-[10px] uppercase tracking-wider font-bold py-1.5 px-3 rounded-full border border-[#FDE68A]">
              Top 3 Global
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {leaderboard.map((teacher, idx) => {
              const teacherId = teacher.username || teacher.uid || teacher.id;
              return (
                <div 
                  key={teacher.id || teacher.uid || idx}
                  onClick={() => onTeacherSelect && onTeacherSelect(teacherId)}
                  className="bg-brand-charcoal text-brand-cream border border-brand-cream/10 rounded-3xl p-5 flex items-center gap-4 cursor-pointer hover:border-brand-clay/50 transition-colors shadow-lg shadow-brand-charcoal/20 relative overflow-hidden"
                >
                  <div className="absolute -right-6 -top-6 text-brand-cream/5 font-heading font-bold text-9xl pointer-events-none">
                    {idx + 1}
                  </div>
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-clay bg-brand-moss z-10">
                    <img src={teacher.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop'} alt={teacher.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="z-10">
                    <h4 className="font-heading font-bold text-lg text-white flex items-center gap-1.5">
                      {teacher.name || 'Elite Tutor'}
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </h4>
                    <div className="flex items-center text-brand-clay mt-1">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-heading font-bold text-xs ml-1 text-white">{teacher.rating || '5.0'}</span>
                      <span className="text-xs text-brand-cream/50 ml-1">({teacher.reviewsCount || 0})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Filters panel */}
      <div className="bg-white border border-brand-moss/10 rounded-3xl p-6 mb-12 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4.5 h-4.5 text-brand-moss/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, expertise, bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border border-brand-moss/10 bg-brand-cream/10 focus:outline-none focus:border-brand-moss focus:ring-1 focus:ring-brand-moss text-sm"
            />
          </div>

          <div className="text-xs text-brand-charcoal/50 font-mono">
            SHOWING {displayTeachers.length} {displayTeachers.length === 1 ? 'EDUCATOR' : 'EDUCATORS'}
          </div>
        </div>

        {/* Filter categories */}
        <div className="space-y-6 pt-4 border-t border-brand-moss/5">
          {/* Educator Tier / Certification Filter */}
          <div>
            <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-3 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-brand-clay" /> Educator Classification & Verification Tier
            </span>
            <div className="flex overflow-x-auto whitespace-nowrap pb-2 gap-2 scrollbar-none">
              {[
                { id: 'All', label: 'All Educators' },
                { id: 'Grade A', label: '👑 Grade A Elite VVIP (₦100k/mo Min Floor)' },
                { id: 'Grade B', label: '🛡️ Grade B (Basic Verified)' },
                { id: 'Freemium', label: '🆓 Freemium (Standard)' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTierFilter(t.id)}
                  className={`py-1.5 px-4 rounded-full border font-sans text-xs font-semibold shrink-0 transition-all duration-300 ${
                    tierFilter === t.id
                      ? 'bg-brand-clay border-brand-clay text-white shadow-sm'
                      : 'bg-brand-cream/30 border-brand-moss/10 hover:border-brand-clay/40 text-brand-moss'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subject Filter */}
            <div>
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-3">Subjects</span>
              <div className="flex overflow-x-auto md:flex-wrap whitespace-nowrap pb-2 md:pb-0 gap-2 scrollbar-none">
                {[
                  'All', 
                  'Mathematics', 
                  'Further Mathematics',
                  'Physics', 
                  'Chemistry', 
                  'English', 
                  'Literature', 
                  'Diction',
                  'Spelling',
                  'Nigerian Languages',
                  'French', 
                  'Spanish', 
                  'Coding & Robotics', 
                  'Data Science',
                  'Others'
                ].map(subj => (
                  <button
                    key={subj}
                    onClick={() => setSubjectFilter(subj)}
                    className={`py-1.5 px-4 rounded-full border font-sans text-xs font-semibold shrink-0 transition-all duration-300 ${
                      subjectFilter === subj
                        ? 'bg-brand-moss border-brand-moss text-white shadow-sm'
                        : 'bg-brand-cream/20 border-brand-moss/10 hover:border-brand-moss/30 text-brand-moss/80'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            {/* Curriculum Filter */}
            <div>
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-3">Curriculum Standard</span>
              <div className="flex overflow-x-auto md:flex-wrap whitespace-nowrap pb-2 md:pb-0 gap-2 scrollbar-none">
                {[
                  'All', 
                  'Nursery (Ages 2-5)', 
                  'Primary (Ages 6-11)', 
                  'Middle School (Ages 12-14)', 
                  'High School (Ages 15-18)', 
                  'University Prep', 
                  'Adult Education',
                  'WAEC', 
                  'JAMB', 
                  'IGCSE', 
                  'Cambridge', 
                  'IB Diploma', 
                  'SAT',
                  'Professional Certs',
                  'Vocational & Technical',
                  'Others (Professional)'
                ].map(curr => (
                  <button
                    key={curr}
                    onClick={() => setCurriculumFilter(curr)}
                    className={`py-1.5 px-4 rounded-full border font-sans text-xs font-semibold shrink-0 transition-all duration-300 ${
                      curriculumFilter === curr
                        ? 'bg-brand-moss border-brand-moss text-white shadow-sm'
                        : 'bg-brand-cream/20 border-brand-moss/10 hover:border-brand-moss/30 text-brand-moss/80'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid listing */}
      {displayTeachers.length === 0 ? (
        <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-12 text-center max-w-xl mx-auto space-y-4 my-8 shadow-sm">
          <div className="w-16 h-16 bg-brand-cream/50 rounded-full flex items-center justify-center mx-auto border border-brand-moss/5">
            <Search className="w-8 h-8 text-brand-clay animate-pulse" />
          </div>
          <h3 className="font-heading font-bold text-xl text-brand-moss">No Educators Found</h3>
          <p className="font-sans text-xs text-brand-charcoal/70 leading-relaxed">
            Try adjusting your search query, subject, or tier filters to find available instructors.
          </p>
        </div>
      ) : (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[...displayTeachers].sort((a, b) => {
          const aGradeA = isTeacherGradeA(a);
          const bGradeA = isTeacherGradeA(b);
          if (aGradeA && !bGradeA) return -1;
          if (!aGradeA && bGradeA) return 1;
          const aGradeB = isTeacherGradeB(a);
          const bGradeB = isTeacherGradeB(b);
          if (aGradeB && !bGradeB) return -1;
          if (!aGradeB && bGradeB) return 1;
          return 0;
        }).map(teacher => {
          const isGradeA = isTeacherGradeA(teacher);
          const isGradeB = isTeacherGradeB(teacher);
          const rateValue = 350000; // ₦3,500 across board for trial class
          const convertedRate = convertMinor(rateValue, selectedCurrency);
          const formattedRate = formatCurrency(convertedRate, selectedCurrency);
          const standardRateVal = teacher.rate || 400000;
          const convertedStandardRate = convertMinor(standardRateVal, selectedCurrency);
          const formattedStandardRate = formatCurrency(convertedStandardRate, selectedCurrency);
          const teacherId = teacher.username || teacher.uid || teacher.id;
          
          return (
            <div 
              key={teacher.id || teacher.uid} 
              className={`bg-white border rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 flex flex-col justify-between custom-card-shadow hover-lift relative overflow-hidden transition-all ${
                isGradeA 
                  ? 'border-amber-300 ring-1 ring-amber-200/60 shadow-amber-500/5' 
                  : 'border-brand-moss/10'
              }`}
            >
              <div>
                {/* Intro video simulated screen */}
                <div 
                  onClick={() => onTeacherSelect && onTeacherSelect(teacherId)}
                  className="relative h-44 bg-brand-charcoal rounded-2xl overflow-hidden mb-6 group cursor-pointer border border-brand-moss/10"
                >
                  {(() => {
                    const fallbackCovers = [
                      'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600&auto=format&fit=crop', // Classroom / educator
                      'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600&auto=format&fit=crop', // Math / teaching board
                      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop', // Lecture / learning
                      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop', // Books & notes
                    ];
                    const seed = String(teacher.id || teacher.uid || teacher.name || '0').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const coverSrc = teacher.coverImage || fallbackCovers[seed % fallbackCovers.length];
                    return (
                      <img 
                        src={coverSrc} 
                        alt={teacher.name} 
                        className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700" 
                      />
                    );
                  })()}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-brand-charcoal/20 to-transparent opacity-80" />
                  
                  {/* Glassmorphic Play Button Overlay / Link to Intro Video */}
                  {teacher.videoUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onWatchVideo) onWatchVideo(teacher);
                      }}
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-brand-clay/90 hover:bg-brand-clay backdrop-blur-md border border-white/40 flex items-center justify-center text-white scale-100 hover:scale-110 active:scale-95 transition-all duration-300 shadow-2xl z-20"
                      title="Watch Teacher's Intro Video"
                    >
                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                    </button>
                  )}
                  
                  {/* Status Indicator */}
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-brand-charcoal/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                    <span className={`w-1.5 h-1.5 rounded-full ${teacher.online ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="font-mono text-[8px] tracking-wider text-white uppercase">
                      {teacher.online ? 'LIVE // ONLINE' : 'OFFLINE'}
                    </span>
                  </div>

                  {/* Intro video pill tag */}
                  {teacher.videoUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onWatchVideo) onWatchVideo(teacher);
                      }}
                      className="absolute top-4 right-4 bg-brand-clay/90 hover:bg-brand-clay text-white px-2.5 py-1 rounded-full font-mono text-[8px] uppercase tracking-wider font-bold flex items-center gap-1 shadow-sm backdrop-blur-xs transition-all z-20"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" /> Watch Intro
                    </button>
                  )}

                  {/* Vetting standard display */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="flex gap-1.5 flex-wrap">
                      {isGradeA ? (
                        <span key="badge-grade-a" className="bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 font-mono text-[8px] uppercase tracking-wider font-bold py-0.5 px-2 rounded-full border border-amber-300 shadow-sm flex items-center gap-1 whitespace-nowrap">
                          <Crown className="w-2.5 h-2.5 text-amber-700 inline" />
                          <span>Grade A Elite VVIP</span>
                        </span>
                      ) : isGradeB ? (
                        <span key="badge-grade-b" className="bg-blue-50 text-blue-800 font-mono text-[8px] uppercase tracking-wider font-bold py-0.5 px-2 rounded-full border border-blue-200 shadow-sm flex items-center gap-1 whitespace-nowrap">
                          <ShieldCheck className="w-2.5 h-2.5" /> Grade B Verified
                        </span>
                      ) : (
                        <span key="badge-freemium" className="bg-brand-cream/80 text-brand-charcoal/80 font-mono text-[8px] uppercase tracking-wider font-bold py-0.5 px-2 rounded-full border border-brand-moss/10 whitespace-nowrap">
                          Standard Educator
                        </span>
                      )}

                      {(teacher.badges || []).map(badge => {
                        if (badge === 'badge-top-rated') {
                          return (
                            <span key={badge} className="bg-[#FEF3C7] text-[#92400E] font-mono text-[8px] uppercase tracking-wider font-bold py-0.5 px-2 rounded-full border border-[#FDE68A] shadow-sm whitespace-nowrap">
                              ★ TOP RATED
                            </span>
                          );
                        }
                        if (badge === 'badge-bg-checked') {
                          return (
                            <span key={badge} className="bg-amber-50/80 border border-brand-clay/30 text-brand-clay font-mono text-[8px] uppercase tracking-wider font-bold py-0.5 px-2 rounded-full shadow-sm flex items-center gap-1 whitespace-nowrap">
                              <ShieldCheck className="w-2.5 h-2.5 text-brand-clay fill-brand-clay/10" /> BG CHECKED
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>

                {/* Avatar and Info */}
                <div className="flex gap-4 items-start mb-4">
                  <div 
                    onClick={() => onTeacherSelect && onTeacherSelect(teacherId)}
                    className="w-14 h-14 rounded-full overflow-hidden border-2 border-brand-moss/10 bg-brand-moss/5 cursor-pointer shrink-0 shadow-sm"
                  >
                    <img 
                      src={teacher.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop'} 
                      alt={teacher.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop';
                      }}
                    />
                  </div>
                  <div>
                    <h3 
                      onClick={() => onTeacherSelect && onTeacherSelect(teacherId)}
                      className="font-heading font-bold text-lg text-brand-moss flex items-center gap-1.5 cursor-pointer hover:underline"
                    >
                      {teacher.name || 'Verified Educator'}
                      {isGradeA ? (
                        <Crown className="w-4 h-4 text-amber-600" title="Grade A Elite VVIP Teacher" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center text-brand-clay">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-heading font-bold text-xs ml-1 text-brand-moss">{teacher.rating || '5.0'}</span>
                      </div>
                      <span className="text-xs text-brand-charcoal/50">({teacher.reviewsCount || 0} sessions)</span>
                    </div>
                  </div>
                </div>

                {/* Location and Subject tags with Proficiencies */}
                <div className="font-sans text-xs text-brand-charcoal/70 mb-4 space-y-1.5 border-b border-brand-moss/5 pb-4">
                  <div>📍 {teacher.location || 'Africa'} · <span className="font-medium text-brand-moss">Teaches Globally</span></div>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {(teacher.subjects || []).map(s => {
                      const proficiency = teacher.subjectProficiencies?.[s];
                      const shortProficiency = proficiency ? (
                        proficiency.includes('Mastery') ? 'Mastery' :
                        proficiency.includes('Advanced') ? 'Advanced' :
                        proficiency.includes('Specialist') ? 'Specialist' :
                        proficiency.includes('Foundational') ? 'Foundational' : 'Proficient'
                      ) : null;
                      return (
                        <span key={s} className="bg-brand-moss/5 text-brand-moss font-medium text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-brand-moss/10">
                          <span>{s}</span>
                          {shortProficiency && (
                            <span className="bg-brand-clay/10 text-brand-clay font-mono font-bold text-[8px] px-1 rounded">
                              {shortProficiency}
                            </span>
                          )}
                        </span>
                      );
                    })}
                    {(teacher.curricula || teacher.curriculums || []).map(c => (
                      <span key={c} className="bg-brand-clay/10 text-brand-clay font-medium text-[10px] px-2.5 py-0.5 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dynamic Bio text excerpt */}
                <p className="font-sans text-xs text-brand-charcoal/80 leading-relaxed mb-6 line-clamp-2 italic">
                  "{teacher.bio || `${teacher.name || 'Verified educator'} specializes in ${Array.isArray(teacher.subjects) && teacher.subjects.length > 0 ? teacher.subjects.join(' & ') : 'academic tutoring'} with proven mastery and individual student acceleration.`}"
                </p>
              </div>

              {/* Hourly Rate & Monthly Contract indicator & CTA buttons */}
              <div>
                <div className="flex flex-col gap-1.5 mb-4 border-t border-brand-moss/5 pt-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand-charcoal/50 font-mono text-[10px] uppercase tracking-wider">Hourly Rate:</span>
                    <span className="font-heading font-bold text-brand-moss">{formattedStandardRate}/hr</span>
                  </div>
                  {isGradeA ? (
                    <div className="flex justify-between items-center text-[11px] bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-xl">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-amber-900 font-bold flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-700" /> Monthly Floor:
                      </span>
                      <span className="font-heading font-extrabold text-amber-900">₦100,000 / mo</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-[10px] text-brand-charcoal/60 px-1">
                      <span className="font-mono uppercase tracking-wider">Custom Availability:</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        ✓ Flexible Plans
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    onClick={() => onBookClick(teacher)}
                    className="btn-magnetic bg-brand-clay hover:bg-brand-clay/90 text-white font-bold py-3 px-3 sm:px-4 rounded-full text-xs uppercase tracking-wider text-center shadow-md shadow-brand-clay/10 min-h-[44px]"
                  >
                    Book Class
                  </button>
                  <button
                    onClick={() => onTeacherSelect && onTeacherSelect(teacherId)}
                    className="btn-magnetic border border-brand-moss/20 text-brand-moss font-bold py-3 px-3 sm:px-4 rounded-full text-xs uppercase tracking-wider text-center hover:bg-brand-moss/5 min-h-[44px]"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
      )}

      {hasMoreTeachers && (
        <div className="mt-12 flex justify-center">
          <button 
            onClick={() => loadFilteredTeachers({
              subject: subjectFilter,
              curriculum: curriculumFilter,
              search: searchQuery
            }, teachersPage + 1, true)}
            className="btn-magnetic bg-brand-moss hover:bg-brand-moss/90 text-brand-cream font-bold py-3.5 px-8 rounded-full text-sm uppercase tracking-widest shadow-lg shadow-brand-moss/20"
          >
            Load More Educators
          </button>
        </div>
      )}
    </section>
  );
}
