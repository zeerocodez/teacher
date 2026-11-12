import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  Clock, 
  Calendar, 
  X, 
  RotateCcw, 
  Video, 
  LayoutGrid,
  List,
  BookOpen,
  Briefcase
} from 'lucide-react';
import { getTeacherAvatar, handleAvatarError } from '../utils/avatar';

/**
 * Normalizes and extracts experience level from teacher record.
 */
function getTutorExperience(tutor) {
  if (!tutor) return { label: 'Certified Tutor', level: 'intermediate', tier: 'Verified' };

  if (tutor.yearsExperience) {
    const yrs = parseInt(tutor.yearsExperience, 10);
    if (yrs >= 5) return { label: `${yrs}+ Years Experience`, level: 'senior', tier: 'Senior / Master' };
    if (yrs >= 3) return { label: `${yrs} Years Experience`, level: 'intermediate', tier: 'Senior Educator' };
    return { label: `${yrs} Year Experience`, level: 'foundation', tier: 'Foundation Tutor' };
  }

  if (tutor.experience) {
    const expStr = String(tutor.experience).toLowerCase();
    if (expStr.includes('5+') || expStr.includes('senior') || expStr.includes('master') || expStr.includes('10+')) {
      return { label: '5+ Years Experience', level: 'senior', tier: 'Senior / Master' };
    }
    if (expStr.includes('3') || expStr.includes('4') || expStr.includes('mid')) {
      return { label: '3-5 Years Experience', level: 'intermediate', tier: 'Senior Educator' };
    }
    if (expStr.includes('1') || expStr.includes('2') || expStr.includes('junior')) {
      return { label: '1-2 Years Experience', level: 'foundation', tier: 'Foundation Tutor' };
    }
  }

  // Scan biography for experience duration
  if (tutor.bio) {
    const match = tutor.bio.match(/(\d+)\+?\s*years?/i);
    if (match) {
      const yrs = parseInt(match[1], 10);
      if (yrs >= 5) return { label: `${yrs}+ Years Experience`, level: 'senior', tier: 'Senior / Master' };
      if (yrs >= 3) return { label: `${yrs} Years Experience`, level: 'intermediate', tier: 'Senior Educator' };
      if (yrs >= 1) return { label: `${yrs} Year Experience`, level: 'foundation', tier: 'Foundation Tutor' };
    }
  }

  // Fallback based on tier or verification accreditation
  if (tutor.tier === 'Grade A' || (tutor.rating >= 4.9 && (tutor.reviewsCount || 0) > 10)) {
    return { label: '5+ Years Experience (Grade A)', level: 'senior', tier: 'Senior / Master' };
  }
  if (tutor.tier === 'Grade B' || tutor.verified) {
    return { label: '3-5 Years Experience (Grade B)', level: 'intermediate', tier: 'Senior Educator' };
  }
  return { label: '1-2 Years Experience', level: 'foundation', tier: 'Foundation Tutor' };
}

export default function TutorDirectory({
  teachers: initialTeachers = [],
  selectedCurrency = 'NGN',
  onBookClick,
  formatCurrency,
  convertMinor,
  onTeacherSelect,
  onWatchVideo,
  isNested = false
}) {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedExperience, setSelectedExperience] = useState('All');
  const [rateFilterTier, setRateFilterTier] = useState('All'); // 'All' | 'under_3500' | '3500_5000' | 'above_5000' | 'custom'
  const [maxHourlyRate, setMaxHourlyRate] = useState(15000); // in standard NGN units
  const [sortBy, setSortBy] = useState('recommended'); // 'recommended' | 'rate_asc' | 'rate_desc' | 'rating' | 'experience'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Fallback currency formatters if not passed via props
  const safeConvertMinor = (ngnMinor, curr) => {
    if (convertMinor) return convertMinor(ngnMinor, curr);
    return ngnMinor;
  };

  const safeFormatCurrency = (amountInMinor, curr = selectedCurrency) => {
    if (formatCurrency) return formatCurrency(amountInMinor, curr);
    const val = amountInMinor / 100;
    return `₦${val.toLocaleString()}`;
  };

  // Fetch live tutors from database API
  const fetchTutors = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/teachers?all=true');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Filter to verified / active or onboarding educators with valid profile
          const normalized = data.map(t => ({
            ...t,
            id: t.uid || t.id,
            subjects: (t.subjects && t.subjects.length > 0) ? t.subjects : ['General Tutoring'],
            curricula: (t.curricula && t.curricula.length > 0) ? t.curricula : ['Primary & Secondary', 'WAEC'],
            rate: t.rate || 350000,
            rating: t.rating || 5.0,
            reviewsCount: t.reviewsCount || 0
          }));
          setTeachers(normalized);
        }
      } else {
        throw new Error('Failed to load tutors from database');
      }
    } catch (err) {
      console.warn('TutorDirectory database fetch notice, using fallback:', err);
      setFetchError('Unable to refresh live tutor list. Displaying cached records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  // Distinct list of subjects dynamically extracted from loaded teachers
  const availableSubjects = useMemo(() => {
    const defaultList = [
      'Mathematics',
      'English & Literature',
      'Physics',
      'Chemistry',
      'Biology',
      'Coding & Robotics',
      'French',
      'Economics',
      'General Tutoring'
    ];
    const extracted = new Set(defaultList);
    (teachers || []).forEach(t => {
      if (Array.isArray(t.subjects)) {
        t.subjects.forEach(s => {
          if (s && s.trim()) extracted.add(s.trim());
        });
      }
    });
    return ['All', ...Array.from(extracted)];
  }, [teachers]);

  // Filtering and Sorting Pipeline
  const filteredAndSortedTutors = useMemo(() => {
    let list = [...(teachers || [])];

    // 1. Text Search across name, bio, subjects, curricula, location
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(t => {
        const nameMatch = (t.name || '').toLowerCase().includes(q);
        const userMatch = (t.username || '').toLowerCase().includes(q);
        const bioMatch = (t.bio || '').toLowerCase().includes(q);
        const locationMatch = (t.location || '').toLowerCase().includes(q);
        const subjectMatch = Array.isArray(t.subjects) && t.subjects.some(s => s.toLowerCase().includes(q));
        const currMatch = Array.isArray(t.curricula) && t.curricula.some(c => c.toLowerCase().includes(q));
        return nameMatch || userMatch || bioMatch || locationMatch || subjectMatch || currMatch;
      });
    }

    // 2. Filter by Subject
    if (selectedSubject !== 'All') {
      list = list.filter(t => {
        if (!Array.isArray(t.subjects)) return false;
        return t.subjects.some(s => s.toLowerCase() === selectedSubject.toLowerCase());
      });
    }

    // 3. Filter by Experience Level
    if (selectedExperience !== 'All') {
      list = list.filter(t => {
        const exp = getTutorExperience(t);
        if (selectedExperience === 'senior') return exp.level === 'senior';
        if (selectedExperience === 'intermediate') return exp.level === 'intermediate';
        if (selectedExperience === 'foundation') return exp.level === 'foundation';
        return true;
      });
    }

    // 4. Filter by Hourly Rate
    if (rateFilterTier !== 'All') {
      list = list.filter(t => {
        const rateInNaira = (t.rate || 350000) / 100;
        if (rateFilterTier === 'under_3500') return rateInNaira <= 3500;
        if (rateFilterTier === '3500_5000') return rateInNaira > 3500 && rateInNaira <= 5000;
        if (rateFilterTier === 'above_5000') return rateInNaira > 5000;
        if (rateFilterTier === 'custom') return rateInNaira <= maxHourlyRate;
        return true;
      });
    } else if (maxHourlyRate < 15000) {
      list = list.filter(t => {
        const rateInNaira = (t.rate || 350000) / 100;
        return rateInNaira <= maxHourlyRate;
      });
    }

    // 5. Sorting
    list.sort((a, b) => {
      if (sortBy === 'rate_asc') {
        return (a.rate || 0) - (b.rate || 0);
      }
      if (sortBy === 'rate_desc') {
        return (b.rate || 0) - (a.rate || 0);
      }
      if (sortBy === 'rating') {
        return (b.rating || 5) - (a.rating || 5);
      }
      if (sortBy === 'experience') {
        const expA = getTutorExperience(a);
        const expB = getTutorExperience(b);
        const weight = { senior: 3, intermediate: 2, foundation: 1 };
        return (weight[expB.level] || 1) - (weight[expA.level] || 1);
      }
      // 'recommended': prioritize verified status, then rating, then reviews count
      const scoreA = (a.verified ? 100 : 0) + (a.rating || 5) * 10 + (a.reviewsCount || 0);
      const scoreB = (b.verified ? 100 : 0) + (b.rating || 5) * 10 + (b.reviewsCount || 0);
      return scoreB - scoreA;
    });

    return list;
  }, [teachers, searchQuery, selectedSubject, selectedExperience, rateFilterTier, maxHourlyRate, sortBy]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSubject('All');
    setSelectedExperience('All');
    setRateFilterTier('All');
    setMaxHourlyRate(15000);
    setSortBy('recommended');
  };

  const isFiltered = searchQuery !== '' || selectedSubject !== 'All' || selectedExperience !== 'All' || rateFilterTier !== 'All' || maxHourlyRate < 15000;

  return (
    <section id="directory" className={`${isNested ? 'pt-4 pb-16' : 'py-20'} px-4 sm:px-8 md:px-16 lg:px-24 bg-brand-cream max-w-7xl mx-auto`}>
      
      {/* Directory Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-brand-moss/10">
        <div>
          <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-2">
            DATABASE REGISTRY
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-brand-moss tracking-tight">
            Verified Tutor Directory
          </h2>
          <p className="font-sans text-xs sm:text-sm text-brand-charcoal/70 mt-1 max-w-xl leading-relaxed">
            Discover background-checked African educators for 1-on-1 online and home lessons. 100% escrow payment protection guaranteed.
          </p>
        </div>

        {/* View Toggle & Count Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center bg-white border border-brand-moss/10 rounded-xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-brand-moss text-white shadow-xs' 
                  : 'text-brand-charcoal/60 hover:text-brand-moss hover:bg-brand-moss/5'
              }`}
              title="Grid view"
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-brand-moss text-white shadow-xs' 
                  : 'text-brand-charcoal/60 hover:text-brand-moss hover:bg-brand-moss/5'
              }`}
              title="List view"
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={fetchTutors}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-brand-moss/10 rounded-xl text-xs font-mono font-medium text-brand-moss hover:border-brand-clay/50 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-brand-clay ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Database Fetch Warning Notice if any */}
      {fetchError && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs flex items-center justify-between">
          <span>{fetchError}</span>
          <button 
            type="button" 
            onClick={fetchTutors} 
            className="font-bold underline ml-3 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Control Strip: Search Bar, Filters & Sort */}
      <div className="bg-white border border-brand-moss/10 rounded-[2rem] p-5 sm:p-6 mb-8 shadow-sm space-y-5">
        
        {/* Top Search & Toggle Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4.5 h-4.5 text-brand-moss/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tutor name, subject (e.g. Mathematics, WAEC), or keyword..."
              className="w-full bg-brand-cream/30 border border-brand-moss/15 rounded-xl pl-11 pr-10 py-3 text-xs sm:text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 focus:outline-none focus:border-brand-clay transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-charcoal/40 hover:text-brand-charcoal"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-2xs uppercase tracking-wider text-brand-charcoal/50 font-bold hidden md:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-brand-cream/40 border border-brand-moss/15 rounded-xl px-3 py-3 text-xs font-sans text-brand-moss focus:outline-none focus:border-brand-clay cursor-pointer"
            >
              <option value="recommended">Recommended & Verified</option>
              <option value="rate_asc">Rate: Low to High</option>
              <option value="rate_desc">Rate: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="experience">Most Experienced</option>
            </select>

            {/* Mobile filters drawer toggle */}
            <button
              type="button"
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className={`sm:hidden p-3 rounded-xl border flex items-center justify-center transition-colors ${
                isFiltered || showFiltersMobile ? 'bg-brand-clay text-white border-brand-clay' : 'bg-brand-cream/40 border-brand-moss/15 text-brand-moss'
              }`}
              aria-label="Toggle filters"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Controls Row (Responsive Grid) */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-brand-moss/5 ${showFiltersMobile ? 'block' : 'hidden sm:grid'}`}>
          
          {/* 1. Filter by Subject */}
          <div className="space-y-1.5">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-brand-moss font-bold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand-clay" /> Subject Track
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-brand-cream/30 border border-brand-moss/15 rounded-xl px-3 py-2.5 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay cursor-pointer"
            >
              {availableSubjects.map(sub => (
                <option key={sub} value={sub}>
                  {sub === 'All' ? 'All Specialized Subjects' : sub}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Filter by Experience Level */}
          <div className="space-y-1.5">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-brand-moss font-bold flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-brand-clay" /> Experience Tier
            </label>
            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
              className="w-full bg-brand-cream/30 border border-brand-moss/15 rounded-xl px-3 py-2.5 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay cursor-pointer"
            >
              <option value="All">All Experience Levels</option>
              <option value="senior">Master / Senior (5+ Years / Grade A)</option>
              <option value="intermediate">Senior Educator (3-5 Years / Grade B)</option>
              <option value="foundation">Foundation Tutor (1-2 Years)</option>
            </select>
          </div>

          {/* 3. Filter by Hourly Rate Tier */}
          <div className="space-y-1.5">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-brand-moss font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-clay" /> Hourly Rate Budget
            </label>
            <select
              value={rateFilterTier}
              onChange={(e) => setRateFilterTier(e.target.value)}
              className="w-full bg-brand-cream/30 border border-brand-moss/15 rounded-xl px-3 py-2.5 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay cursor-pointer"
            >
              <option value="All">Any Hourly Rate</option>
              <option value="under_3500">Under ₦3,500 / hr</option>
              <option value="3500_5000">₦3,500 – ₦5,000 / hr</option>
              <option value="above_5000">₦5,000+ / hr (Master Tier)</option>
              <option value="custom">Custom Maximum Slider</option>
            </select>
          </div>
        </div>

        {/* Custom Rate Slider Drawer when "custom" is picked */}
        {rateFilterTier === 'custom' && (
          <div className="p-4 bg-brand-cream/30 border border-brand-moss/10 rounded-2xl animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-2/3 space-y-1">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-brand-charcoal/70">Max Budget Limit:</span>
                <span className="font-heading font-extrabold text-brand-moss">
                  {safeFormatCurrency(safeConvertMinor(maxHourlyRate * 100, selectedCurrency))} / hour
                </span>
              </div>
              <input
                type="range"
                min="2000"
                max="15000"
                step="500"
                value={maxHourlyRate}
                onChange={(e) => setMaxHourlyRate(parseInt(e.target.value, 10))}
                className="w-full accent-brand-clay cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-brand-charcoal/40">
                <span>₦2,000/hr</span>
                <span>₦8,500/hr</span>
                <span>₦15,000/hr</span>
              </div>
            </div>
            <span className="text-2xs font-sans text-brand-charcoal/60 sm:text-right max-w-xs">
              Filtering educators matching up to {safeFormatCurrency(safeConvertMinor(maxHourlyRate * 100, selectedCurrency))} per hour.
            </span>
          </div>
        )}

        {/* Active Filter Chips Bar & Results Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-brand-moss/5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-sans text-xs text-brand-charcoal/60">
              Showing <b className="text-brand-moss font-bold">{filteredAndSortedTutors.length}</b> available {filteredAndSortedTutors.length === 1 ? 'tutor' : 'tutors'}
            </span>

            {isFiltered && (
              <>
                <span className="text-brand-charcoal/30">·</span>
                {selectedSubject !== 'All' && (
                  <span className="bg-brand-moss/10 text-brand-moss text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    Subject: {selectedSubject}
                    <button type="button" onClick={() => setSelectedSubject('All')} className="hover:text-brand-clay">×</button>
                  </span>
                )}
                {selectedExperience !== 'All' && (
                  <span className="bg-brand-moss/10 text-brand-moss text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    Exp: {selectedExperience}
                    <button type="button" onClick={() => setSelectedExperience('All')} className="hover:text-brand-clay">×</button>
                  </span>
                )}
                {rateFilterTier !== 'All' && (
                  <span className="bg-brand-moss/10 text-brand-moss text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    Rate: {rateFilterTier.replace('_', ' ')}
                    <button type="button" onClick={() => setRateFilterTier('All')} className="hover:text-brand-clay">×</button>
                  </span>
                )}
              </>
            )}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-brand-clay hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>

      </div>

      {/* Tutor Cards Display View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="bg-white border border-brand-moss/10 rounded-[2rem] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-brand-moss/10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-brand-moss/10 rounded w-2/3" />
                  <div className="h-3 bg-brand-moss/10 rounded w-1/3" />
                </div>
              </div>
              <div className="h-3 bg-brand-moss/10 rounded w-full" />
              <div className="h-3 bg-brand-moss/10 rounded w-4/5" />
              <div className="h-10 bg-brand-moss/10 rounded-xl w-full mt-4" />
            </div>
          ))}
        </div>
      ) : filteredAndSortedTutors.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-10 md:p-14 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-brand-clay/10 text-brand-clay flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="font-heading font-bold text-xl text-brand-moss mb-2">No Matching Tutors Found</h3>
          <p className="font-sans text-xs text-brand-charcoal/70 mb-6 leading-relaxed">
            We couldn't find any verified tutors matching your selected subject, experience level, or budget parameters. Try clearing your filters or broadening your search terms.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn-magnetic py-3 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up">
          {filteredAndSortedTutors.map((tutor) => {
            const exp = getTutorExperience(tutor);
            const tutorId = tutor.username || tutor.uid || tutor.id;
            const convertedRate = safeConvertMinor(tutor.rate || 350000, selectedCurrency);

            return (
              <div
                key={tutor.id || tutor.uid}
                className="bg-white border border-brand-moss/10 hover:border-brand-clay/40 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Header: Avatar, Name, Trust Badge & Hourly Rate */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={getTeacherAvatar(tutor.avatar, tutor.name)}
                          alt={tutor.name || 'Tutor'}
                          className="w-14 h-14 rounded-full object-cover border-2 border-brand-cream/80 shadow-xs group-hover:scale-105 transition-transform"
                          onError={handleAvatarError(tutor.name)}
                        />
                        {tutor.online !== false && (
                          <span 
                            className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-xs" 
                            title="Online & Available" 
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 
                            onClick={() => onTeacherSelect && onTeacherSelect(tutorId)}
                            className="font-heading font-bold text-base text-brand-moss group-hover:text-brand-clay transition-colors truncate cursor-pointer"
                          >
                            {tutor.name}
                          </h4>
                          {tutor.verified && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" title="Identity Verified & Vetted" />
                          )}
                        </div>
                        <p className="font-mono text-2xs text-brand-charcoal/50 truncate">
                          @{tutor.username || (tutor.name ? tutor.name.toLowerCase().replace(/\s+/g, '') : 'tutor')}
                        </p>
                      </div>
                    </div>

                    {/* Hourly Rate Display */}
                    <div className="text-right shrink-0">
                      <span className="font-heading font-extrabold text-lg sm:text-xl text-brand-moss block leading-none">
                        {safeFormatCurrency(convertedRate, selectedCurrency)}
                      </span>
                      <span className="font-mono text-[9px] text-brand-charcoal/50 uppercase">/ hour</span>
                    </div>
                  </div>

                  {/* Clean Metadata Line (Anti-Pill Discipline) */}
                  <div className="flex items-center gap-2 text-xs text-brand-charcoal/60 mb-3 font-sans">
                    <span className="flex items-center gap-1 text-amber-700 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {(tutor.rating || 5.0).toFixed(1)}
                    </span>
                    <span aria-hidden="true" className="text-brand-charcoal/30">·</span>
                    <span>{tutor.reviewsCount ? `${tutor.reviewsCount} reviews` : 'New Educator'}</span>
                    <span aria-hidden="true" className="text-brand-charcoal/30">·</span>
                    <span className="font-medium text-brand-moss">{exp.label}</span>
                  </div>

                  {/* Biography Snippet */}
                  <p className="font-sans text-xs text-brand-charcoal/75 leading-relaxed line-clamp-2 mb-4">
                    {tutor.bio || `${tutor.name} is a vetted educator on EduVista specializing in student comprehension, exam confidence, and mastery.`}
                  </p>

                  {/* Specialized Subjects List */}
                  <div className="mb-4">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/40 font-bold block mb-1.5">
                      SPECIALIZATIONS
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(tutor.subjects || ['General Tutoring']).slice(0, 3).map((sub, i) => (
                        <span 
                          key={i} 
                          className="font-sans text-[11px] font-medium px-2 py-0.5 rounded-lg bg-brand-cream/60 border border-brand-moss/10 text-brand-moss"
                        >
                          {sub}
                        </span>
                      ))}
                      {(tutor.subjects || []).length > 3 && (
                        <span className="font-mono text-[10px] text-brand-charcoal/40 self-center">
                          +{tutor.subjects.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Curricula Line */}
                  <div className="text-2xs font-sans text-brand-charcoal/60 mb-5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-brand-clay shrink-0" />
                    <span className="truncate">
                      Curriculum: {Array.isArray(tutor.curricula) ? tutor.curricula.slice(0, 2).join(', ') : 'WAEC, Cambridge'}
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 border-t border-brand-moss/5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onBookClick && onBookClick(tutor)}
                    className="btn-magnetic flex-1 py-2.5 px-4 rounded-xl bg-brand-clay hover:bg-brand-clay/95 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-sm transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Book Lesson
                  </button>

                  <button
                    type="button"
                    onClick={() => onTeacherSelect && onTeacherSelect(tutorId)}
                    className="py-2.5 px-3.5 rounded-xl border border-brand-moss/15 hover:border-brand-moss/40 hover:bg-brand-moss/5 text-brand-moss font-heading font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    title="View Full Public Profile"
                  >
                    Profile
                  </button>

                  {tutor.videoUrl && (
                    <button
                      type="button"
                      onClick={() => onWatchVideo ? onWatchVideo(tutor) : onTeacherSelect && onTeacherSelect(tutorId)}
                      className="p-2.5 rounded-xl border border-brand-moss/15 hover:border-brand-clay hover:text-brand-clay text-brand-moss transition-colors cursor-pointer"
                      title="Watch Introduction Video"
                      aria-label="Watch Introduction Video"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-4 animate-fade-up">
          {filteredAndSortedTutors.map((tutor) => {
            const exp = getTutorExperience(tutor);
            const tutorId = tutor.username || tutor.uid || tutor.id;
            const convertedRate = safeConvertMinor(tutor.rate || 350000, selectedCurrency);

            return (
              <div
                key={tutor.id || tutor.uid}
                className="bg-white border border-brand-moss/10 hover:border-brand-clay/40 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 group"
              >
                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={getTeacherAvatar(tutor.avatar, tutor.name)}
                      alt={tutor.name || 'Tutor'}
                      className="w-16 h-16 rounded-full object-cover border-2 border-brand-cream/80 group-hover:scale-105 transition-transform"
                      onError={handleAvatarError(tutor.name)}
                    />
                    {tutor.online !== false && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-xs" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 
                        onClick={() => onTeacherSelect && onTeacherSelect(tutorId)}
                        className="font-heading font-bold text-lg text-brand-moss group-hover:text-brand-clay transition-colors truncate cursor-pointer"
                      >
                        {tutor.name}
                      </h4>
                      {tutor.verified && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" title="Identity Verified & Vetted" />
                      )}
                      <span className="font-mono text-2xs text-brand-charcoal/40 hidden sm:inline">
                        @{tutor.username || 'tutor'}
                      </span>
                    </div>

                    {/* Metadata line */}
                    <div className="flex items-center gap-2 text-xs text-brand-charcoal/60 mb-2 font-sans flex-wrap">
                      <span className="flex items-center gap-1 text-amber-700 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {(tutor.rating || 5.0).toFixed(1)}
                      </span>
                      <span aria-hidden="true" className="text-brand-charcoal/30">·</span>
                      <span>{tutor.reviewsCount ? `${tutor.reviewsCount} reviews` : 'New Educator'}</span>
                      <span aria-hidden="true" className="text-brand-charcoal/30">·</span>
                      <span className="font-medium text-brand-moss">{exp.label}</span>
                      <span aria-hidden="true" className="text-brand-charcoal/30">·</span>
                      <span className="text-brand-charcoal/60 truncate">{tutor.location || 'Nigeria'}</span>
                    </div>

                    {/* Bio snippet */}
                    <p className="font-sans text-xs text-brand-charcoal/70 line-clamp-1 mb-2 max-w-2xl">
                      {tutor.bio || `${tutor.name} is a verified educator on EduVista specializing in personalized student instruction.`}
                    </p>

                    {/* Subjects */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {(tutor.subjects || ['General Tutoring']).map((sub, i) => (
                        <span 
                          key={i} 
                          className="font-sans text-[10px] font-medium px-2 py-0.5 rounded-md bg-brand-cream/60 border border-brand-moss/10 text-brand-moss"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Rate & CTAs */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-brand-moss/5">
                  <div className="text-left md:text-right">
                    <span className="font-heading font-extrabold text-xl sm:text-2xl text-brand-moss block leading-none">
                      {safeFormatCurrency(convertedRate, selectedCurrency)}
                    </span>
                    <span className="font-mono text-[9px] text-brand-charcoal/50 uppercase">/ hour</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onBookClick && onBookClick(tutor)}
                      className="btn-magnetic py-2 px-4 rounded-xl bg-brand-clay hover:bg-brand-clay/95 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Book
                    </button>
                    <button
                      type="button"
                      onClick={() => onTeacherSelect && onTeacherSelect(tutorId)}
                      className="py-2 px-3.5 rounded-xl border border-brand-moss/15 hover:border-brand-moss/40 hover:bg-brand-moss/5 text-brand-moss font-heading font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Profile
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Escrow Trust Assurance Footer Banner */}
      <div className="mt-14 bg-brand-moss text-brand-cream rounded-[2.5rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 text-brand-clay">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-base text-white">
              100% Escrow Payment Protection
            </h4>
            <p className="font-sans text-xs text-brand-cream/80 mt-0.5 max-w-xl leading-relaxed">
              Lesson funds are safely held in escrow until the lesson completes. If a tutor cancels or experiences connection loss, your credits are refunded immediately.
            </p>
          </div>
        </div>

        <a
          href="#how-it-works"
          className="shrink-0 font-heading font-bold text-xs uppercase tracking-wider text-white border border-white/20 hover:border-white px-5 py-2.5 rounded-full transition-all"
        >
          How It Works →
        </a>
      </div>

    </section>
  );
}
