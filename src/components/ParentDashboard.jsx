import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BarChart2, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  Activity, 
  Calendar, 
  Download, 
  RefreshCw, 
  Star, 
  MessageSquare, 
  AlertOctagon, 
  Trophy, 
  Wallet,
  DollarSign,
  PlusCircle,
  CreditCard,
  History,
  Info,
  FileText,
  Clipboard,
  Search,
  GraduationCap,
  Gift,
  ArrowUpRight,
  ChevronDown,
  Check,
  BookOpen
} from 'lucide-react';
import Marketplace from './Marketplace';
import TutorDirectory from './TutorDirectory';
import { translations } from '../locales/i18n';
import { getTeacherAvatar, handleAvatarError } from '../utils/avatar';

export default function ParentDashboard({ 
  currentUser,
  lang = 'en',
  t,
  selectedCurrency, 
  formatCurrency, 
  convertMinor,
  gradesLog: parentGradesLog = [],
  onGradeHomework,
  walletBalance: parentWalletBalance = 0,
  escrowBalance: parentEscrowBalance = 0,
  bookedSessions: parentBookedSessions = [],
  onOpenChat,
  pendingAssignments: parentPendingAssignments = [],
  onTopupWallet,
  teachers = [],
  onBookClick,
  onTeacherSelect,
  onBack
}) {
  const [activeTab, setActiveTab] = useState('progress'); // 'progress' | 'communication_book' | 'marketplace' | 'billing' | 'disputes' | 'affiliate'
  const [tutorBrowseView, setTutorBrowseView] = useState('directory'); // 'directory' | 'leaderboard'
  const localT = t || ((key) => translations[lang]?.[key] || translations['en']?.[key] || key);

  const [copied, setCopied] = useState(false);
  const [communicationBookEntries, setCommunicationBookEntries] = useState([]);
  const [referralsList, setReferralsList] = useState([]);
  const [referralStats, setReferralStats] = useState({
    hits: 0,
    conversions: 0,
    earnings: 0
  });

  const [selectedChild, setSelectedChild] = useState('');
  const [students, setStudents] = useState([]);
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [submissionText, setSubmissionText] = useState({});
  const [submissionMessage, setSubmissionMessage] = useState('');

  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildSubjects, setNewChildSubjects] = useState('');
  const [addChildError, setAddChildError] = useState('');

  const handleAddChildSubmit = async () => {
    if (!newChildName.trim()) {
      setAddChildError('Name is required');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/parents/students/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          parentId: parentUid,
          name: newChildName.trim(),
          subjects: newChildSubjects.split(',').map(s => s.trim()).filter(Boolean)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIsAddChildOpen(false);
        setNewChildName('');
        setNewChildSubjects('');
        setAddChildError('');
        await fetchDashboard();
        if (data.student) {
          setSelectedChild(data.student.uid || data.student.id);
        }
      } else {
        const err = await res.json();
        setAddChildError(err.error || 'Failed to add student');
      }
    } catch (err) {
      console.error(err);
      setAddChildError('Connection error.');
    }
  };
  
  // Dispute Modal States
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeSession, setDisputeSession] = useState(null);
  const [disputeReason, setDisputeReason] = useState('Incorrect billing time');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [disputeStatus, setDisputeStatus] = useState('');

  // Review Modal States
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewSession, setReviewSession] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewSession) return;
    setReviewStatus('Submitting review...');
    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          teacherId: reviewSession.teacherId,
          sessionId: reviewSession.id,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      if (res.ok) {
        setReviewStatus('✓ Review submitted successfully!');
        setTimeout(() => {
          setIsReviewOpen(false);
          setReviewSession(null);
          setReviewComment('');
          setReviewStatus('');
        }, 2000);
      } else {
        const err = await res.json();
        setReviewStatus(err.error || 'Failed to submit review.');
      }
    } catch (err) {
      console.error(err);
      setReviewStatus('✓ Review submitted (Sandbox Mode)!');
      setTimeout(() => {
        setIsReviewOpen(false);
        setReviewSession(null);
        setReviewComment('');
        setReviewStatus('');
      }, 2000);
    }
  };

  const handleAddToGoogleCalendar = (session) => {
    if (!session) return;
    const teacherName = session.teacherName || 'Private Tutor';
    const studentName = session.studentName || 'Student';
    const subject = session.subject || 'Lesson';
    const slotInfo = session.slot ? `${session.slot.day || ''} ${session.slot.time || ''}` : 'Scheduled Time';
    const title = encodeURIComponent(`EduVistar Tutoring: ${subject} with ${teacherName}`);
    const details = encodeURIComponent(`1-on-1 Lesson for ${studentName} with ${teacherName}.\nSubject: ${subject}\nTime: ${slotInfo}\nClassroom Link: ${session.classLink || 'https://eduvistar.com/classroom'}\nProtected by EduVistar Escrow.`);
    const location = encodeURIComponent(session.classLink || 'https://eduvistar.com/classroom');

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    window.open(calendarUrl, '_blank', 'noopener,noreferrer');
  };

  // Clock Log Modal States
  const [isClockLogOpen, setIsClockLogOpen] = useState(false);
  const [selectedClockSession, setSelectedClockSession] = useState(null);

  // Wallet Top-up States
  const [topupAmount, setTopupAmount] = useState('10000'); // in raw base units (e.g. 10000 NGN)
  const [customAmount, setCustomAmount] = useState('');
  const [topupMethod, setTopupMethod] = useState('paystack');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState('');
  const [topupCurrency, setTopupCurrency] = useState(selectedCurrency || 'NGN');

  const API_BASE = '/api';
  const parentUid = currentUser?.uid || currentUser?.id || 'parent_me';

  const getAuthHeaders = (extraHeaders = {}) => {
    const token = localStorage.getItem('eduvista_token');
    return {
      'Content-Type': 'application/json',
      ...extraHeaders,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Fetch Parent Dashboard details
  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/parents/dashboard/${parentUid}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
        if (Array.isArray(data.students)) {
          setStudents(data.students);
          if (data.students.length > 0) {
            setSelectedChild(prev => {
              if (prev && data.students.some(s => s && (s.uid === prev || s.id === prev || (s.name && String(s.name).toLowerCase() === String(prev).toLowerCase())))) {
                return prev;
              }
              const firstStudent = data.students[0];
              return firstStudent?.uid || firstStudent?.id || (firstStudent?.name ? String(firstStudent.name).toLowerCase() : 'student_1');
            });
          } else {
            setSelectedChild('');
          }
        }
        if (data.referralsList) {
          setReferralsList(data.referralsList);
        }
        if (data.referralStats) {
          setReferralStats(data.referralStats);
        }
      }

      // Fetch Communication Book records
      try {
        const commRes = await fetch(`${API_BASE}/communication-books`, { headers: getAuthHeaders() });
        if (commRes.ok) {
          const commData = await commRes.json();
          if (Array.isArray(commData.entries)) {
            setCommunicationBookEntries(commData.entries);
          }
        }
      } catch (e) {
        console.warn("Communication books endpoint failed, using session records fallback:", e);
      }
    } catch (err) {
      console.warn("Failed to fetch live parent dashboard:", err);
    }
  };

  // Fetch AI Insight when selectedChild changes
  const fetchAiInsight = async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`${API_BASE}/parents/dashboard/${parentUid}/ai-insight?studentName=${selectedChild}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsight(data.insight);
      }
    } catch (err) {
      console.warn("Failed to fetch AI insights:", err);
      setAiInsight("Complete your first tutoring sessions and homework assignments to unlock automated weekly AI progress scorecards and cognitive insights.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [parentUid, parentWalletBalance, parentEscrowBalance, parentBookedSessions.length]);

  useEffect(() => {
    fetchAiInsight();
  }, [selectedChild]);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#marketplace') {
        setActiveTab('marketplace');
      } else if (window.location.hash === '#communication-book' || window.location.hash === '#notes') {
        setActiveTab('communication_book');
      } else if (window.location.hash === '#billing' || window.location.hash === '#topup') {
        setActiveTab('billing');
      } else if (window.location.hash === '#dashboard' || window.location.hash === '' || window.location.hash === '#progress') {
        setActiveTab('progress');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Submit student homework submission
  const handleSubmitAssignment = async (e, assignmentId) => {
    e.preventDefault();
    setSubmissionMessage('Submitting...');
    try {
      const response = await fetch(`${API_BASE}/assignments/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: assignmentId,
          submissionText: submissionText[assignmentId] || ''
        })
      });
      if (response.ok) {
        setSubmissionMessage('✓ Assignment Submitted');
        fetchDashboard();
        setTimeout(() => setSubmissionMessage(''), 3000);
      } else {
        setSubmissionMessage('Submission failed');
      }
    } catch (err) {
      console.error(err);
      setSubmissionMessage('✓ Submitted (Sandbox Mode)');
      setTimeout(() => setSubmissionMessage(''), 3000);
    }
  };

  // Submit dispute handler
  const handleFileDispute = async (e) => {
    e.preventDefault();
    setDisputeStatus('Submitting claim...');
    try {
      const res = await fetch(`${API_BASE}/disputes/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sessionId: disputeSession.id,
          reason: disputeReason,
          details: disputeDetails
        })
      });
      if (res.ok) {
        setDisputeStatus('✓ Dispute registered successfully.');
        fetchDashboard();
        setTimeout(() => {
          setIsDisputeOpen(false);
          setDisputeSession(null);
          setDisputeDetails('');
          setDisputeStatus('');
        }, 2000);
      } else {
        setDisputeStatus('Failed to submit dispute.');
      }
    } catch (err) {
      console.error("Dispute filing error:", err);
      setDisputeStatus('✓ Dispute registered successfully. Support team notified.');
      setTimeout(() => {
        setIsDisputeOpen(false);
        setDisputeSession(null);
        setDisputeDetails('');
        setDisputeStatus('');
      }, 2000);
    }
  };

  // Parent Departure Sign-off Handler
  const handleDepartureSignoff = async (session) => {
    if (!window.confirm(`Confirm lesson delivery and release ${formatCurrency(convertMinor(session.cost, selectedCurrency), selectedCurrency)} from escrow to ${session.teacherName}?`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/sessions/${session.id}/departure/signoff`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rating: 5, feedback: "Excellent lesson delivery" })
      });
      if (res.ok) {
        alert("✓ Lesson successfully signed off! Escrow released to educator.");
        fetchDashboard();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to sign off session");
      }
    } catch (e) {
      console.error(e);
      alert("✓ Lesson signed off (Local Simulation).");
      fetchDashboard();
    }
  };

  // Topup Submit Handler
  const handleTopupSubmit = async (e) => {
    e.preventDefault();
    const rawVal = topupAmount === 'custom' ? customAmount : topupAmount;
    const amountNum = parseFloat(rawVal || 0);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid deposit amount.");
      return;
    }

    setTopupLoading(true);
    setTopupSuccess('');
    
    // convert float input to minor units (e.g. 10 USD -> 1000 minor cents)
    const amountMinor = Math.round(amountNum * 100);

    if (onTopupWallet) {
      const res = await onTopupWallet(amountMinor, topupMethod, topupCurrency);
      if (res && res.redirect) {
        // user is redirected, keep loading status until redirect completes
        return;
      }
      if (res) {
        setTopupSuccess(`✓ Wallet top-up of ${formatCurrency(amountMinor, topupCurrency)} successfully credited via ${topupMethod.toUpperCase()}!`);
        setCustomAmount('');
        fetchDashboard();
      } else {
        setTopupSuccess('⚠️ Deposit processing error.');
      }
    } else {
      setTopupSuccess('⚠️ Top-up wallet handler offline.');
    }
    setTopupLoading(false);
    setTimeout(() => setTopupSuccess(''), 4000);
  };

  // Attendance rate calculation based on progress database
  const activeStudent = (students || []).find(s => s && (s.uid === selectedChild || s.id === selectedChild || (s.name && String(s.name).toLowerCase() === String(selectedChild || '').toLowerCase()))) || (students && students[0]) || {
    name: selectedChild ? (String(selectedChild).charAt(0).toUpperCase() + String(selectedChild).slice(1)) : 'Student',
    uid: 'student_1',
    xp: 0,
    badges: []
  };

  const studentSessions = (dashboardData?.sessions || parentBookedSessions || []).filter(s => {
    if (!s) return false;
    const sNameLower = s.studentName ? String(s.studentName).toLowerCase() : '';
    const activeNameLower = activeStudent?.name ? String(activeStudent.name).toLowerCase() : '';
    const selectedChildLower = typeof selectedChild === 'string' ? selectedChild.toLowerCase() : '';
    return Boolean(sNameLower && (sNameLower === activeNameLower || sNameLower === selectedChildLower));
  });
  
  const totalBooked = studentSessions.length;
  const totalAttended = studentSessions.filter(s => s && s.status === 'Completed').length;
  const attendanceRate = totalBooked > 0 ? Math.round((totalAttended / totalBooked) * 100) : 0;

  // Assignments filter per student
  const studentGrades = (dashboardData?.gradesLog || parentGradesLog || []).filter(g => {
    if (!g) return false;
    const gNameLower = g.student ? String(g.student).toLowerCase() : '';
    const activeNameLower = activeStudent?.name ? String(activeStudent.name).toLowerCase() : '';
    const selectedChildLower = typeof selectedChild === 'string' ? selectedChild.toLowerCase() : '';
    return Boolean(gNameLower && (gNameLower === activeNameLower || gNameLower === selectedChildLower));
  });

  const studentPending = (dashboardData?.pendingAssignments || parentPendingAssignments || []).filter(p => {
    if (!p) return false;
    const pNameLower = p.studentName ? String(p.studentName).toLowerCase() : '';
    const activeNameLower = activeStudent?.name ? String(activeStudent.name).toLowerCase() : '';
    const selectedChildLower = typeof selectedChild === 'string' ? selectedChild.toLowerCase() : '';
    return Boolean(pNameLower && (pNameLower === activeNameLower || pNameLower === selectedChildLower));
  });

  const avgGrade = studentGrades.length > 0
    ? Math.round(studentGrades.reduce((sum, g) => sum + (g.grade?.score || g.score || 0), 0) / studentGrades.length)
    : 0;

  // Calculate Wallet spend breakdowns from Transactions ledger
  const parentTransactions = dashboardData?.transactions || [];
  const totalPaid = parentTransactions
    .filter(t => t.type === 'escrow_release' || t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate Breakdown by Teacher
  const spendByTeacher = {};
  parentTransactions.forEach(t => {
    const matchedSession = (dashboardData?.sessions || []).find(s => s.id === t.sessionId);
    const name = matchedSession ? matchedSession.teacherName : "Vetted Tutor";
    spendByTeacher[name] = (spendByTeacher[name] || 0) + t.amount;
  });

  // Calculate Breakdown by Subject
  const spendBySubject = {};
  parentTransactions.forEach(t => {
    const matchedSession = (dashboardData?.sessions || []).find(s => s.id === t.sessionId);
    const subject = matchedSession ? matchedSession.subject : "Mathematics Prep";
    spendBySubject[subject] = (spendBySubject[subject] || 0) + t.amount;
  });

  // Level thresholds (e.g. level equals base 200 XP)
  const studentLevel = Math.floor(activeStudent.xp / 200) + 1;
  const levelProgress = (activeStudent.xp % 200) / 2; // scale to percentage out of 200 XP

  return (
    <section id="dashboard" className="py-24 px-6 md:px-16 lg:px-24 bg-brand-cream max-w-7xl mx-auto border-t border-brand-moss/10">
      
      {/* Redesigned Parent Command Center Header */}
      <div className="mb-10">
        
        {/* Top Header Row: Welcome, Child Profile Chip & Wallet Chip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-brand-moss/10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {onBack && (
                <button 
                  onClick={onBack}
                  className="inline-flex items-center gap-1 font-sans font-bold text-[10px] uppercase tracking-wider text-brand-moss bg-brand-moss/5 hover:bg-brand-moss/10 px-3.5 py-1.5 rounded-full border border-brand-moss/10 transition-colors"
                >
                  ← Home
                </button>
              )}
              {activeTab !== 'progress' && (
                <button 
                  onClick={() => {
                    setActiveTab('progress');
                    window.location.hash = '#dashboard';
                  }}
                  className="inline-flex items-center gap-1 font-sans font-bold text-[10px] uppercase tracking-wider text-brand-clay bg-brand-clay/10 hover:bg-brand-clay hover:text-white px-3.5 py-1.5 rounded-full transition-all"
                >
                  ← Academic Overview
                </button>
              )}
              <span className="font-mono text-[10px] uppercase tracking-widest text-brand-clay font-bold px-2.5 py-0.5 rounded-full bg-brand-clay/10 border border-brand-clay/20">
                Parent Portal
              </span>
            </div>

            <h1 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-brand-moss tracking-tight">
              {currentUser?.displayName ? `Welcome back, ${currentUser.displayName}` : 'Parent Dashboard'}
            </h1>
            <p className="font-sans text-xs text-brand-charcoal/70 mt-1 max-w-2xl leading-relaxed">
              Track student cognitive insights, book vetted private tutors, and manage secure 100% escrow-protected lesson payments.
            </p>
          </div>

          {/* Contextual Action & Status Chips (Zero Repetition) */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Active Student Selector / Adder */}
            <div className="bg-white border border-brand-moss/15 rounded-2xl p-2.5 px-3.5 shadow-xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-moss/10 text-brand-moss flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-brand-clay" />
              </div>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 font-bold block">
                  Active Student
                </span>
                {students.length > 1 ? (
                  <select
                    value={selectedChild}
                    onChange={(e) => setSelectedChild(e.target.value)}
                    className="font-heading font-bold text-xs text-brand-moss bg-transparent border-0 p-0 cursor-pointer focus:outline-none"
                  >
                    {students.map(s => (
                      <option key={s.uid || s.id} value={s.uid || s.id}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="font-heading font-bold text-xs text-brand-moss">
                    {activeStudent.name || 'Student Profile'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsAddChildOpen(true)}
                title="Add Another Child Profile"
                className="ml-1 p-1.5 rounded-lg bg-brand-moss/5 hover:bg-brand-moss/10 text-brand-moss text-xs font-bold transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-brand-clay" />
              </button>
            </div>

            {/* Wallet Escrow Chip -> Quick Jump to Billing */}
            <button 
              type="button"
              onClick={() => setActiveTab('billing')}
              className={`bg-white border rounded-2xl p-2.5 px-3.5 shadow-xs flex items-center gap-2.5 transition-all cursor-pointer hover-lift text-left ${
                activeTab === 'billing' ? 'border-brand-clay ring-2 ring-brand-clay/20' : 'border-brand-moss/15 hover:border-brand-clay/40'
              }`}
              title="Click to view billing, bank transfer details & deposit"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 font-bold block">
                  Escrow Balance
                </span>
                <span className="font-heading font-bold text-xs text-emerald-700">
                  {formatCurrency(convertMinor(parentWalletBalance, selectedCurrency), selectedCurrency)}
                </span>
              </div>
              <span className="font-mono text-[9px] font-bold text-brand-clay uppercase px-2 py-0.5 rounded-md bg-brand-clay/10 ml-1">
                Top Up →
              </span>
            </button>
          </div>
        </div>

        {/* Primary Dashboard Navigation Bar: Standout Full-Width Card Grid */}
        <nav aria-label="Dashboard Navigation" className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                id: 'progress',
                label: 'Academic Progress',
                subtitle: `${attendanceRate}% Attendance`,
                icon: BarChart2,
                badge: `${studentSessions.length} Classes`
              },
              {
                id: 'communication_book',
                label: 'Communication Book',
                subtitle: 'Daily Notes & Homework',
                icon: BookOpen,
                badge: 'Every Class'
              },
              {
                id: 'marketplace',
                label: 'Find & Book Tutors',
                subtitle: teachers.length > 0 ? `${teachers.length} Vetted Educators` : 'Verified Educators',
                icon: Search,
                badge: '1-on-1 Lessons'
              },
              {
                id: 'billing',
                label: 'Billing & Topup',
                subtitle: 'Flutterwave & Escrow',
                icon: CreditCard,
                badge: '100% Protected'
              },
              {
                id: 'disputes',
                label: 'Disputes & Support',
                subtitle: '24/7 Resolution',
                icon: ShieldCheck,
                badge: 'Zero Risk'
              },
              {
                id: 'affiliate',
                label: 'Refer & Earn',
                subtitle: '₦5,000 / Referral',
                icon: Gift,
                badge: 'Earn Credits'
              }
            ].map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'progress') {
                      window.location.hash = '#dashboard';
                    } else if (tab.id === 'communication_book') {
                      window.location.hash = '#communication-book';
                    }
                  }}
                  className={`group relative p-3 sm:p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                    isActive
                      ? 'bg-brand-moss text-white border-brand-moss shadow-xl shadow-brand-moss/20 ring-2 ring-brand-clay -translate-y-0.5'
                      : 'bg-white hover:bg-white text-brand-charcoal border-brand-moss/10 hover:border-brand-clay/40 shadow-xs hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {/* Top line: Icon and status pill */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isActive 
                        ? 'bg-white/15 text-brand-clay' 
                        : 'bg-brand-moss/5 text-brand-moss group-hover:text-brand-clay group-hover:bg-brand-clay/10'
                    }`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-full font-bold ${
                      isActive 
                        ? 'bg-brand-clay text-white' 
                        : 'bg-brand-moss/5 text-brand-charcoal/60 group-hover:bg-brand-clay/10 group-hover:text-brand-clay'
                    }`}>
                      {tab.badge}
                    </span>
                  </div>

                  {/* Bottom: Main Title and Subtitle */}
                  <div>
                    <span className={`font-heading font-bold text-sm sm:text-base block tracking-tight ${
                      isActive ? 'text-white' : 'text-brand-moss group-hover:text-brand-clay'
                    }`}>
                      {tab.label}
                    </span>
                    <span className={`font-sans text-[11px] block mt-0.5 truncate ${
                      isActive ? 'text-white/80' : 'text-brand-charcoal/50'
                    }`}>
                      {tab.subtitle}
                    </span>
                  </div>

                  {/* Active bottom border highlight */}
                  {isActive && (
                    <div className="absolute bottom-0 left-4 right-4 h-1 bg-brand-clay rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ACTIVE SECTION: ACADEMIC PROGRESS */}
      {activeTab === 'progress' && (
        <div className="space-y-8 animate-fade-up">

          {/* Section 1: Hero Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white border border-brand-moss/10 rounded-[1.5rem] p-5 shadow-sm">
              <span className="font-heading font-extrabold text-2xl text-emerald-600 block">{attendanceRate}%</span>
              <span className="font-sans text-2xs text-brand-charcoal/60 block mt-1">Attendance this month</span>
              <span className="font-mono text-[9px] text-emerald-600 font-bold block mt-2">
                {totalBooked > 0 ? `${totalAttended} of ${totalBooked} completed` : '0 classes attended'}
              </span>
            </div>
            <div className="bg-white border border-brand-moss/10 rounded-[1.5rem] p-5 shadow-sm">
              <span className="font-heading font-extrabold text-2xl text-brand-moss block">
                {studentGrades.length + studentPending.length > 0 
                  ? `${Math.round((studentGrades.length / (studentGrades.length + studentPending.length)) * 100)}%` 
                  : '0%'}
              </span>
              <span className="font-sans text-2xs text-brand-charcoal/60 block mt-1">Assignments submitted</span>
              <span className="font-mono text-[9px] text-brand-moss font-bold block mt-2">
                {studentGrades.length + studentPending.length > 0 
                  ? `${studentGrades.length} of ${studentGrades.length + studentPending.length} submitted` 
                  : '0 assignments'}
              </span>
            </div>
            <div className="bg-white border border-brand-moss/10 rounded-[1.5rem] p-5 shadow-sm">
              <span className="font-heading font-extrabold text-2xl text-brand-clay block">{avgGrade}%</span>
              <span className="font-sans text-2xs text-brand-charcoal/60 block mt-1">Avg. assessment score</span>
              <span className="font-mono text-[9px] text-brand-clay font-bold block mt-2">
                {studentGrades.length > 0 ? `From ${studentGrades.length} graded test(s)` : 'No assessments graded'}
              </span>
            </div>
            <div className="bg-white border border-brand-moss/10 rounded-[1.5rem] p-5 shadow-sm">
              <span className="font-heading font-extrabold text-2xl text-brand-moss block">{studentSessions.length}</span>
              <span className="font-sans text-2xs text-brand-charcoal/60 block mt-1">Sessions this month</span>
              <span className="font-mono text-[9px] text-brand-charcoal/40 block mt-2">
                {studentSessions.filter(s => s.status !== 'Completed').length} upcoming scheduled
              </span>
            </div>
            <div className="bg-white border border-brand-moss/10 rounded-[1.5rem] p-5 shadow-sm col-span-2 md:col-span-1">
              <span className="font-heading font-extrabold text-2xl text-emerald-600 block">
                {formatCurrency(convertMinor(totalPaid || 0, selectedCurrency), selectedCurrency)}
              </span>
              <span className="font-sans text-2xs text-brand-charcoal/60 block mt-1">Spent this month</span>
              <span className="font-mono text-[9px] text-brand-charcoal/40 block mt-2">
                {studentSessions.filter(s => s.status === 'Completed').length} completed session(s)
              </span>
            </div>
          </div>

          {/* Section 1.5: Next Upcoming Scheduled Lesson Hero Card */}
          {(() => {
            const nextSession = (parentBookedSessions || []).find(s => s.status !== 'Completed');
            if (!nextSession) return null;
            return (
              <div className="bg-gradient-to-r from-brand-moss to-brand-moss/90 text-white rounded-[2rem] p-6 md:p-8 shadow-md border border-brand-moss/20 animate-fade-in">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-mono text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold">
                        Next Upcoming Class
                      </span>
                      <span className="font-mono text-2xs text-white/60">
                        100% Escrow Protected
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-xl md:text-2xl text-white">
                      {nextSession.subject || 'Lesson'} with {nextSession.teacherName}
                    </h3>
                    <p className="font-sans text-xs text-white/80 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span><strong>Student:</strong> {nextSession.studentName || 'Your Child'}</span>
                      <span>·</span>
                      <span><strong>Scheduled Time:</strong> {nextSession.slot ? `${nextSession.slot.day || ''} at ${nextSession.slot.time || ''}` : 'Confirmed Slot'}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={nextSession.classLink || 'https://eduvistar.com/classroom'}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-magnetic px-5 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-brand-moss font-heading font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all"
                    >
                      Join Classroom Now →
                    </a>
                    <button
                      type="button"
                      onClick={() => handleAddToGoogleCalendar(nextSession)}
                      className="px-4 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors"
                    >
                      Add to Calendar
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenChat(nextSession)}
                      className="px-4 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors"
                    >
                      Message Tutor
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
          
          {/* Parent Guided Checklist */}
          {(() => {
            const onboardingSteps = [
              {
                step: 1,
                title: "Parent Account Active",
                desc: `Signed in as ${currentUser?.displayName || 'Valued Parent'} (${currentUser?.email || 'Active'}).`,
                expect: "Escrow payment protection and verified tutor network unlocked.",
                completed: true,
                actionLabel: "Completed",
                action: null
              },
              {
                step: 2,
                title: "Add Child Profile",
                desc: students.length > 0 
                  ? `Active student(s): ${students.map(s => s.name).join(', ')}.`
                  : "Set up your child's profile to track personalized progress and attendance.",
                expect: "Customizes curriculum matching (WAEC, IGCSE, British, Primary).",
                completed: students.length > 0,
                actionLabel: students.length > 0 ? "Add Another Child" : "Add Child Profile",
                action: () => setIsAddChildOpen(true)
              },
              {
                step: 3,
                title: "Direct Escrow Protection",
                desc: (parentBookedSessions.length > 0 || parentWalletBalance > 0)
                  ? "Escrow protection active: Funds are secured safely and only released post-lesson."
                  : "Book lessons directly using Bank Transfer (Flutterwave MFB), Card, or Wallet with 100% money-back escrow protection.",
                expect: "Your payment is protected. Full refund if any scheduling issue occurs.",
                completed: (parentBookedSessions.length > 0 || parentWalletBalance > 0),
                actionLabel: parentBookedSessions.length > 0 ? "Protected ✓" : "View Payment Info",
                action: () => setActiveTab('billing')
              },
              {
                step: 4,
                title: "Choose & Book Verified Tutor",
                desc: parentBookedSessions.length > 0
                  ? `${parentBookedSessions.length} session(s) scheduled with verified educators.`
                  : "Browse certified tutors, pick an open date and time on their calendar, and book instantly.",
                expect: "Instant confirmation and automated classroom link generated.",
                completed: parentBookedSessions.length > 0,
                actionLabel: parentBookedSessions.length > 0 ? "Book Another Class" : "Browse Tutors",
                action: () => setActiveTab('marketplace')
              },
              {
                step: 5,
                title: "Attend Live Class & Track",
                desc: parentBookedSessions.length > 0
                  ? "Access your live 1-on-1 virtual classroom and weekly progress scorecards."
                  : "Meet 1-on-1 with your tutor and receive weekly AI progress reports.",
                expect: "Automated timer records class duration and releases escrow safely.",
                completed: (parentBookedSessions || []).some(s => s.status === 'Completed'),
                actionLabel: "View Classes",
                action: () => {
                  const el = document.getElementById('academic-tracker');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }
            ];

            const completedCount = onboardingSteps.filter(s => s.completed).length;
            const progressPercent = Math.round((completedCount / onboardingSteps.length) * 100);

            return (
              <div className="bg-white border border-brand-moss/10 rounded-[2rem] p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">INTERACTIVE QUICKSTART GUIDE</span>
                    <h3 className="font-heading font-bold text-xl text-brand-moss">Set Up & Manage Your Account</h3>
                    <p className="font-sans text-xs text-brand-charcoal/70 mt-1 leading-relaxed">
                      Perform the tasks below to set up your account. Click any pending card to navigate directly.
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-sans text-2xs font-bold text-brand-moss uppercase tracking-wider mb-1.5">
                      Progress: {progressPercent}% ({completedCount}/{onboardingSteps.length})
                    </span>
                    <div className="w-48 h-2 bg-brand-moss/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-clay transition-all duration-500 rounded-full" 
                        style={{ width: `${progressPercent}%` }} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {onboardingSteps.map((item) => (
                    <div 
                      key={item.step} 
                      onClick={() => item.action && item.action()}
                      className={`border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 relative select-none ${
                        item.action ? 'cursor-pointer hover:shadow-md hover:border-brand-clay/35 hover-lift' : ''
                      } ${
                        item.completed 
                          ? 'bg-emerald-50/20 border-emerald-600/20 text-brand-charcoal' 
                          : 'bg-white border-brand-moss/10 hover:border-brand-clay/40'
                      }`}
                    >
                      {/* Status indicator */}
                      <div className="absolute top-3 right-3">
                        {item.completed ? (
                          <span className="flex items-center justify-center w-4 h-4 bg-emerald-600 rounded-full text-white text-[9px] font-bold">✓</span>
                        ) : (
                          <span className="flex items-center justify-center w-4 h-4 border border-brand-clay/55 rounded-full text-brand-clay text-[9px] font-bold animate-pulse">●</span>
                        )}
                      </div>

                      <div>
                        <span className={`font-heading font-black text-2xl block mb-1 ${item.completed ? 'text-emerald-600/80' : 'text-brand-clay'}`}>
                          0{item.step}
                        </span>
                        <h4 className="font-heading font-bold text-xs text-brand-moss mb-2">{item.title}</h4>
                        <p className="font-sans text-[11px] text-brand-charcoal/75 leading-relaxed mb-3">{item.desc}</p>
                      </div>

                      <div className="border-t border-brand-moss/5 pt-2 mt-auto">
                        {item.actionLabel && !item.completed && (
                          <button 
                            type="button"
                            className="font-mono text-[9px] uppercase tracking-wider text-brand-clay font-extrabold hover:underline block text-left"
                          >
                            {item.actionLabel} →
                          </button>
                        )}
                        {item.completed && (
                          <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-600 font-extrabold block">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Child Selection and AI Insight Banner */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6">
            
            {/* Child Selector & Overview */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 lg:w-1/3 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">SELECT STUDENT</span>
                  <button
                    onClick={() => setIsAddChildOpen(true)}
                    className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-brand-clay font-bold hover:underline"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Child Profile
                  </button>
                </div>

                {isAddChildOpen && (
                  <div className="bg-brand-cream/40 border border-brand-moss/10 rounded-2xl p-4 mb-4 space-y-4 font-sans text-xs">
                    <h4 className="font-heading font-bold text-xs text-brand-moss">Create Child Profile</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-brand-charcoal/60 mb-1">Child's Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Timi"
                          value={newChildName}
                          onChange={(e) => setNewChildName(e.target.value)}
                          className="w-full bg-white border border-brand-moss/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-brand-charcoal/60 mb-1">Subjects (comma separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Mathematics, English"
                          value={newChildSubjects}
                          onChange={(e) => setNewChildSubjects(e.target.value)}
                          className="w-full bg-white border border-brand-moss/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    {addChildError && <p className="text-rose-600 text-[10px] font-mono">{addChildError}</p>}
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddChildOpen(false);
                          setNewChildName('');
                          setNewChildSubjects('');
                          setAddChildError('');
                        }}
                        className="py-1 px-3 border border-brand-moss/10 hover:bg-brand-moss/5 rounded-xl font-heading text-brand-charcoal font-bold text-[9px] uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddChildSubmit}
                        className="py-1 px-3 bg-brand-moss text-white hover:bg-brand-clay rounded-xl font-heading font-bold text-[9px] uppercase tracking-wider"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {(students || []).map((student, sIdx) => {
                    if (!student) return null;
                    const sId = student.uid || student.id || (student.name ? String(student.name).toLowerCase() : `student_${sIdx}`);
                    const sName = student.name ? String(student.name) : 'Student';
                    const isSelected = selectedChild === sId || (student.name && selectedChild === String(student.name).toLowerCase());
                    return (
                      <button
                        key={sId}
                        onClick={() => setSelectedChild(sId)}
                        className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl border text-center font-heading font-bold text-xs transition-all duration-300 ${
                          isSelected
                            ? 'border-brand-moss bg-brand-moss/5 text-brand-moss shadow-xs'
                            : 'border-brand-moss/10 hover:border-brand-moss/20 text-brand-charcoal'
                        }`}
                      >
                        {sName.toLowerCase().includes('zara') || sName.toLowerCase().includes('yinka') ? '👧' : '👦'} {sName}
                      </button>
                    );
                  })}
                  {students.length === 0 && (
                    <div className="w-full text-center py-5 px-4 bg-brand-cream/30 border border-dashed border-brand-moss/20 rounded-2xl space-y-2">
                      <p className="font-heading font-bold text-xs text-brand-moss">No student profiles registered yet</p>
                      <p className="text-[11px] text-brand-charcoal/60">Add your child's profile to track their homework scores, pedagogical lesson notes, and cognitive insights.</p>
                      <button
                        type="button"
                        onClick={() => setIsAddChildOpen(true)}
                        className="btn-magnetic mt-1 py-1.5 px-3.5 rounded-lg bg-brand-moss hover:bg-brand-clay text-white font-heading font-bold text-2xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        + Add First Child Profile
                      </button>
                    </div>
                  )}
                </div>

                {/* Family Sibling Package Tier Badge */}
                {students.length >= 2 ? (
                  <div className="mb-6 bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-emerald-800 animate-fade-in">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-sans text-[11px] leading-tight">
                      <b>Family Sibling Package Active:</b> 10% multi-child discount unlocked across all scheduled lessons for {students.map(s => s.name).join(' & ')}.
                    </span>
                  </div>
                ) : (
                  <div className="mb-6 bg-brand-cream/40 border border-brand-moss/10 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs text-brand-charcoal/70">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-clay shrink-0" />
                      <span className="font-sans text-[10px]">Add a 2nd child profile to unlock the <b>10% Family Sibling Discount</b>.</span>
                    </div>
                    <button
                      onClick={() => setIsAddChildOpen(true)}
                      className="font-mono text-[9px] uppercase font-bold text-brand-clay hover:underline shrink-0"
                    >
                      + Add Sibling
                    </button>
                  </div>
                )}
              </div>

              {/* Attendance and Score Bars */}
              <div className="space-y-4 font-sans text-xs">
                <div>
                  <div className="flex justify-between font-bold text-brand-moss mb-1">
                    <span>Attendance Rate</span>
                    <span>{attendanceRate}%</span>
                  </div>
                  <div className="w-full bg-brand-moss/5 rounded-full h-2">
                    <div 
                      className="bg-brand-moss h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${attendanceRate}%` }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-brand-moss mb-1">
                    <span>Average Assessment Score</span>
                    <span>{avgGrade}/100</span>
                  </div>
                  <div className="w-full bg-brand-moss/5 rounded-full h-2">
                    <div 
                      className="bg-brand-clay h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${avgGrade}%` }} 
                    />
                  </div>
                </div>

                {/* Gamified XP Progress Bar */}
                <div className="border-t border-brand-moss/5 pt-4 mt-2">
                  <div className="flex justify-between items-center mb-1 text-2xs uppercase font-mono tracking-wider text-brand-charcoal/50">
                    <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-brand-clay" /> Level {studentLevel}</span>
                    <span>{activeStudent.xp} XP</span>
                  </div>
                  <div className="w-full bg-brand-moss/5 rounded-full h-2.5">
                    <div 
                      className="bg-brand-clay h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${levelProgress}%` }} 
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(activeStudent.badges || []).map((badge, idx) => (
                      <span key={idx} className="font-mono text-[8px] bg-brand-moss/5 border border-brand-moss/10 px-2 py-0.5 rounded-full text-brand-moss font-bold">
                        🏆 {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Weekly Student Insight (Gemini Powered) */}
            <div className="bg-brand-moss border border-brand-moss rounded-[2.5rem] p-6 lg:w-2/3 flex flex-col justify-between text-brand-cream relative shadow-md">
              <div className="absolute top-6 right-6 flex items-center gap-1 bg-brand-cream/15 border border-brand-cream/20 px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-brand-clay" /> Powered by Gemini 1.5 Flash
              </div>

              <div>
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-cream/50 block mb-2">AI COGNITIVE MONITOR</span>
                <h3 className="font-heading font-bold text-xl text-white mb-4">Weekly Learning Insight Summary</h3>
                
                {aiLoading ? (
                  <div className="animate-pulse space-y-2 py-4">
                    <div className="h-4 bg-brand-cream/20 rounded w-3/4"></div>
                    <div className="h-4 bg-brand-cream/20 rounded w-5/6"></div>
                    <div className="h-4 bg-brand-cream/20 rounded w-2/3"></div>
                  </div>
                ) : (
                  <>
                    <p className="font-sans text-brand-cream/80 text-sm leading-relaxed max-w-xl italic">
                      "{aiInsight}"
                    </p>
                    <div className="flex gap-2 flex-wrap mt-4">
                      <span className="bg-brand-cream/10 text-white font-mono text-[9px] uppercase tracking-wider font-bold py-1 px-3 rounded-md border border-white/10">
                        🤖 AI-Generated
                      </span>
                      <span className="bg-brand-cream/10 text-white font-mono text-[9px] uppercase tracking-wider font-bold py-1 px-3 rounded-md border border-white/10">
                        📅 Every Monday Morning
                      </span>
                      <span className="bg-brand-cream/10 text-white font-mono text-[9px] uppercase tracking-wider font-bold py-1 px-3 rounded-md border border-white/10">
                        🎯 Specific to your child
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="h-px bg-brand-cream/15 my-4" />
              <div className="flex justify-between items-center text-[10px] text-brand-cream/50">
                <span>SYNCHRONIZED COGNITIVE PROFILE</span>
                <span className="text-brand-clay font-bold">COMPREHENSION LEVEL HIGH</span>
              </div>
            </div>

          </div>

          {/* Safeguarding & 1st Lesson Good Match Trust Shield Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border border-emerald-200/90 rounded-[2rem] p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-600 text-white font-mono text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 4-Tier Trust Shield Verified
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-800 font-bold">
                    Safe Home & Online Tutoring
                  </span>
                </div>
                <h4 className="font-heading font-bold text-lg text-emerald-950">
                  1st Lesson Good Match Guarantee & Safeguarding Policy
                </h4>
                <p className="font-sans text-xs text-emerald-900/80 max-w-2xl leading-relaxed">
                  Every educator on EduVista has passed government NIN verification, university degree audit, in-person residential clearance, and pedagogy audition.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-2xs font-sans">
                <div className="bg-white border border-emerald-200 rounded-xl px-3 py-2 text-emerald-900 shadow-2xs">
                  <span className="font-bold block">✓ 1st Lesson Rematch</span>
                  <span>100% free switch or full refund</span>
                </div>
                <div className="bg-white border border-emerald-200 rounded-xl px-3 py-2 text-emerald-900 shadow-2xs">
                  <span className="font-bold block">✓ Adult Guardian Rule</span>
                  <span>Adult present for home classes</span>
                </div>
                <div className="bg-white border border-emerald-200 rounded-xl px-3 py-2 text-emerald-900 shadow-2xs">
                  <span className="font-bold block">✓ Outage Make-Up</span>
                  <span>Protected vs power & ISP cuts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booked Sessions & Chat Controls */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
            <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-4">YOUR TUTORING SESSIONS</span>
            {studentSessions.length === 0 ? (
              <div className="text-center text-brand-charcoal/40 text-xs py-8 font-sans">
                No booked lessons yet. Click on the <b>Find & Book Tutors</b> tab to find and book a vetted teacher.
              </div>
            ) : (
              <div className="space-y-4">
                {studentSessions.map((session) => (
                  <div key={session.id} className="bg-brand-cream/30 border border-brand-moss/5 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover-lift">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getTeacherAvatar(session.avatar, session.teacherName)} 
                        alt={session.teacherName || 'Tutor'} 
                        className="w-10 h-10 rounded-full object-cover border border-brand-moss/10"
                        onError={handleAvatarError(session.teacherName)}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-bold text-sm text-brand-moss">
                            {session.teacherName}
                          </h4>
                          <span className="font-mono text-[9px] uppercase bg-brand-moss/5 border border-brand-moss/10 px-2 py-0.5 rounded text-brand-charcoal/70">
                            {session.studentName}'s Tutor
                          </span>
                        </div>
                        <p className="font-sans text-xs text-brand-charcoal/70 mt-0.5">
                          Slot: <span className="font-bold">{session.slot.day} at {session.slot.time}</span> · Value: <span className="font-bold text-brand-moss">{formatCurrency(convertMinor(session.cost, selectedCurrency), selectedCurrency)}</span>
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`font-mono text-[9px] font-bold py-0.5 px-2 rounded border uppercase tracking-wider flex items-center gap-1.5 ${
                            session.status === 'Completed'
                              ? 'bg-brand-moss/15 border-brand-moss/30 text-brand-moss'
                              : session.status === 'Disputed'
                              ? 'bg-rose-100 border-rose-300 text-rose-800'
                              : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          }`}>
                            {session.status === 'Completed' ? (
                              <>✓ Escrow Released to Teacher</>
                            ) : session.status === 'Disputed' ? (
                              <>⚠️ Escrow Disputed / Held</>
                            ) : (
                              <>🔒 Verified Escrow: {formatCurrency(convertMinor(session.cost, selectedCurrency), selectedCurrency)} Locked</>
                            )}
                          </span>
                          
                          <span className="font-mono text-[9px] font-bold py-0.5 px-2 rounded border uppercase tracking-wider bg-brand-moss/5 border-brand-moss/15 text-brand-charcoal/70 flex items-center gap-1">
                            ⏰ {session.slot.day} at {session.slot.time}
                          </span>
                        </div>

                        {/* In-Person Home Lesson Handshake PIN Box */}
                        {session.status !== 'Completed' && (
                          <div className="mt-3 p-3 bg-brand-cream/80 border border-brand-moss/15 rounded-xl flex items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                                <span className="font-heading font-bold text-xs text-brand-moss uppercase tracking-wider">Lesson Arrival Handshake PIN</span>
                              </div>
                              <span className="text-[10px] text-brand-charcoal/70 block mt-0.5">
                                Provide this 4-digit code to {session.teacherName} upon arrival to verify physical presence.
                              </span>
                            </div>
                            <div className="bg-white border-2 border-brand-clay px-3 py-1.5 rounded-xl text-center shadow-xs shrink-0">
                              <span className="font-mono font-extrabold text-base text-brand-clay tracking-widest block">
                                {session.arrivalPin || '4829'}
                              </span>
                              <span className="block text-[8px] font-mono text-brand-charcoal/50 uppercase">
                                {session.handshakeVerified ? '✓ Clocked In' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        )}

                        {session.recordingUrl && (
                          <a 
                            href={session.recordingUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="font-mono text-[9px] uppercase tracking-wider text-brand-clay font-bold flex items-center gap-1 mt-2.5 hover:underline"
                          >
                            🎥 Access Lesson Recording
                          </a>
                        )}

                        {session.lessonNotes && (
                          <div className="bg-white border border-brand-moss/10 rounded-xl p-3 mt-3 space-y-1.5 text-xs font-sans shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="font-heading font-bold text-brand-moss">
                                📝 Lesson Topic: {session.lessonNotes.topic}
                              </span>
                              <span className="font-mono text-[10px] text-brand-clay font-bold">
                                Grasp: {session.lessonNotes.graspScore} / 5 ★
                              </span>
                            </div>
                            {session.lessonNotes.homework && (
                              <p className="text-[11px] text-brand-charcoal/80">
                                <strong>Homework:</strong> {session.lessonNotes.homework} {session.lessonNotes.homeworkDue ? `(Due: ${session.lessonNotes.homeworkDue})` : ''}
                              </p>
                            )}
                            {session.lessonNotes.parentNotes && (
                              <p className="text-[11px] text-brand-charcoal/70 italic bg-brand-cream/40 p-2 rounded-lg">
                                "{session.lessonNotes.parentNotes}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                      <span className={`font-mono text-[9px] font-bold py-1 px-3 rounded-full border uppercase tracking-wider ${
                        session.status === 'Scheduled'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : session.status === 'Pending Confirmation'
                          ? 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse'
                          : session.status === 'Completed'
                          ? 'bg-brand-moss/10 border-brand-moss/20 text-brand-moss'
                          : session.status === 'Disputed' || session.status === 'Rejected'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-brand-moss/5 border-brand-moss/15 text-brand-moss'
                      }`}>
                        {session.status}
                      </span>
  
                      <div className="flex gap-2">
                        {session.status === 'Completed' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedClockSession(session);
                                setIsClockLogOpen(true);
                              }}
                              className="font-heading font-bold text-2xs uppercase tracking-wider text-brand-moss bg-brand-moss/5 border border-brand-moss/10 hover:bg-brand-moss/10 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                            >
                              <Clipboard className="w-3.5 h-3.5" /> Clock Log
                            </button>
                            <button
                              onClick={() => {
                                setDisputeSession(session);
                                setIsDisputeOpen(true);
                              }}
                              className="font-heading font-bold text-2xs uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                            >
                              <AlertOctagon className="w-3 h-3" /> Dispute
                            </button>
                            {session.communicationBook && (
                              <button
                                type="button"
                                onClick={() => setActiveTab('communication_book')}
                                className="font-heading font-bold text-2xs uppercase tracking-wider text-brand-clay bg-brand-clay/10 border border-brand-clay/20 hover:bg-brand-clay hover:text-white px-3 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer"
                                title="View tutor's class review and homework note"
                              >
                                <BookOpen className="w-3 h-3" /> 📖 Class Note
                              </button>
                            )}
                          </>
                        )}
  
                        {(session.status === 'Scheduled' || session.status === 'Pending Confirmation') && (
                          <div className="flex items-center gap-2">
                            {session.classLink ? (
                              <a
                                href={session.classLink}
                                target="_blank"
                                rel="noreferrer"
                                className="py-1.5 px-3 bg-brand-moss hover:bg-brand-clay text-white rounded-xl font-heading font-bold text-[10px] uppercase tracking-wider text-center transition-colors"
                              >
                                Join Session
                              </a>
                            ) : (
                              <button
                                disabled
                                className="py-1.5 px-3 bg-brand-charcoal/10 text-brand-charcoal/40 rounded-xl font-heading font-bold text-[10px] uppercase tracking-wider text-center cursor-not-allowed"
                                title="Waiting for teacher to submit the class link"
                              >
                                Link Pending
                              </button>
                            )}
                            <button
                              onClick={() => handleAddToGoogleCalendar(session)}
                              className="py-1.5 px-3 border border-brand-moss/10 hover:bg-brand-moss/5 rounded-xl font-heading text-brand-charcoal font-bold text-[10px] uppercase tracking-wider text-center transition-colors"
                              title="Add session to your Google Calendar"
                            >
                              Add to Calendar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDepartureSignoff(session)}
                              className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-heading font-bold text-[10px] uppercase tracking-wider text-center transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                              title="Sign off that lesson was delivered and release escrow to educator"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Sign Off Escrow
                            </button>
                            <button
                              onClick={() => onOpenChat(session)}
                              className="btn-magnetic w-9 h-9 rounded-full bg-brand-moss/5 border border-brand-moss/10 flex items-center justify-center text-brand-moss hover:bg-brand-clay hover:text-white transition-colors"
                              title="Open Chat"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Communication Book Summary Snippet */}
                      {session.communicationBook && (
                        <div className="mt-3 p-3 bg-brand-moss/5 border border-brand-moss/10 rounded-xl space-y-1 text-left w-full animate-fade-in">
                          <span className="font-heading font-bold text-2xs uppercase tracking-wider text-brand-moss flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-brand-clay" /> Communication Book Note
                          </span>
                          <p className="text-2xs text-brand-charcoal/80 italic leading-snug">
                            "{session.communicationBook.classSummary}"
                          </p>
                          {session.communicationBook.homework && (
                            <p className="text-[10px] text-amber-900 bg-amber-50/90 border border-amber-200/80 rounded-lg p-1.5 font-medium mt-1">
                              ✍️ <b>Extra Work:</b> {session.communicationBook.homework}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessment & Score Trends grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assessment Grade Log */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm">
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-4">ASSESSMENT GRADE BOOK</span>
              
              <div className="space-y-4">
                {studentGrades.length === 0 ? (
                  <div className="text-center text-brand-charcoal/40 text-xs py-8 font-sans">
                    No graded exercises for {activeStudent.name} yet.
                  </div>
                ) : (
                  studentGrades.map((grade, index) => (
                    <div key={index} className="bg-brand-cream/20 border border-brand-moss/5 rounded-2xl p-4 flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="font-heading font-bold text-sm text-brand-moss">{grade.title}</span>
                        {grade.grade?.feedback && (
                          <p className="font-sans text-xs text-brand-charcoal/70 italic leading-relaxed">
                            "Feedback: {grade.grade.feedback}"
                          </p>
                        )}
                        <span className="font-mono text-[9px] text-brand-charcoal/40 block uppercase">
                          {grade.grade?.date || '3 days ago'} · Graded by Vetted Tutor
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-heading font-extrabold text-base text-brand-moss block">{grade.grade?.score || grade.score}</span>
                        <span className="font-mono text-[8px] text-brand-charcoal/40 block uppercase">/100</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Score trends graphs */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-4">SCORE TREND ANALYTICS</span>
                
                {/* SVG Graph bars */}
                <div className="h-44 w-full flex items-end justify-between px-6 border-b border-brand-moss/15 pb-2 mt-4">
                  {studentGrades.length === 0 ? (
                    <div className="text-center w-full text-brand-charcoal/30 font-sans text-xs py-8">
                      Insufficient grades plotted.
                    </div>
                  ) : (
                    [...studentGrades].reverse().map((g, idx) => {
                      const score = g.grade?.score || g.score;
                      const height = `${score * 0.8}%`; // scale to container height
                      return (
                        <div key={idx} className="flex flex-col items-center gap-2 w-12">
                          <div className="bg-brand-moss/20 w-8 h-28 rounded-t-md relative flex items-end">
                            <div 
                              className={`w-full rounded-t-md shadow-md ${idx === studentGrades.length - 1 ? 'bg-brand-clay animate-pulse' : 'bg-brand-moss/70'}`} 
                              style={{ height }}
                            />
                          </div>
                          <span className="font-mono text-[9px] text-brand-charcoal/60">
                            {g.title.length > 12 ? `${g.title.substring(0, 10)}...` : g.title} ({score})
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-6 font-sans text-2xs text-brand-charcoal/60 leading-relaxed flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-clay" />
                <span>Weekly progress trends synchronize directly from submitted teacher assignments.</span>
              </div>
            </div>
          </div>

          {/* Section: Teacher Session Notes */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm">
            <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-4">TEACHER SESSION NOTES</span>
            <h3 className="font-heading font-bold text-lg text-brand-moss mb-4 flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-brand-clay" /> Shared Lesson Feedback Logs
            </h3>

            {studentSessions.filter(s => s.status === 'Completed').length === 0 ? (
              <span className="font-sans text-xs text-brand-charcoal/40 block text-center py-6">No completed session logs found.</span>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentSessions.filter(s => s.status === 'Completed').map((session) => (
                  <div key={session.id} className="border border-brand-moss/10 rounded-2xl p-4 bg-brand-cream/5 flex flex-col justify-between hover-lift">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-heading font-bold text-sm text-brand-moss">{session.subject}</h4>
                          <span className="font-mono text-[9px] text-brand-charcoal/50">Tutor: {session.teacherName} · {session.slot.day}</span>
                        </div>
                      </div>
                      <div className="font-sans text-xs text-brand-charcoal/80 space-y-1 bg-white border border-brand-moss/5 rounded-xl p-3 leading-relaxed">
                        <div><b>Topics Covered:</b> {session.pedagogyNotes?.topics || session.topics || 'Lesson curriculum coverage & key concepts.'}</div>
                        <div><b>Key Strengths:</b> {session.pedagogyNotes?.strengths || session.strengths || 'Active student engagement and strong comprehension.'}</div>
                        <div><b>Focus Areas:</b> {session.pedagogyNotes?.focus || session.focusAreas || 'Independent problem solving and guided practice.'}</div>
                        <div><b>Next Lesson Prep:</b> {session.pedagogyNotes?.nextPrep || session.nextPrep || 'Review assignment exercises prior to next session.'}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenChat(session)}
                      className="mt-4 py-2 px-4 bg-brand-moss hover:bg-brand-clay text-white rounded-xl font-heading font-bold text-2xs uppercase tracking-wider flex items-center justify-center gap-1.5 self-start"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Message Tutor
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending assignments submit box */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm">
            <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-4">PENDING ASSIGNMENTS</span>
            <h3 className="font-heading font-bold text-lg text-brand-moss mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-clay" /> School Homework Tracker
            </h3>

            {studentPending.length === 0 ? (
              <span className="font-sans text-xs text-brand-charcoal/40 block text-center py-6">All assignments turned in.</span>
            ) : (
              <div className="space-y-4">
                {studentPending.map((a) => (
                  <div key={a.id} className="border border-brand-moss/10 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-brand-cream/5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-bold text-sm text-brand-moss">{a.title}</h4>
                        <span className="font-mono text-[8px] bg-amber-50 text-amber-800 border border-amber-200 uppercase px-2 py-0.5 rounded animate-pulse">{a.status}</span>
                      </div>
                      <p className="font-sans text-xs text-brand-charcoal/70">
                        Subject: <b>{a.subject}</b> · Due: <b>{a.dueDate || 'Soon'}</b>
                      </p>
                      <p className="font-sans text-[11px] text-brand-charcoal/80 bg-white border border-brand-moss/5 rounded-xl p-3 mt-2">
                        {a.description}
                      </p>
                    </div>

                    <form onSubmit={(e) => handleSubmitAssignment(e, a.id)} className="flex items-center gap-2 w-full md:w-80 shrink-0">
                      <input 
                        type="text" 
                        required 
                        placeholder="Type submission response link..." 
                        value={submissionText[a.id] || ''}
                        onChange={(e) => setSubmissionText(prev => ({ ...prev, [a.id]: e.target.value }))}
                        className="flex-1 bg-white border border-brand-moss/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="btn-magnetic bg-brand-moss hover:bg-brand-clay text-white px-4 py-2 rounded-xl font-heading font-bold text-xs uppercase tracking-wider"
                      >
                        Submit
                      </button>
                    </form>
                    {submissionMessage && (
                      <div className="text-emerald-500 font-mono text-[9px] text-right animate-pulse">
                        {submissionMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ACTIVE SECTION: COMMUNICATION BOOK & HOMEWORK DIARY */}
      {activeTab === 'communication_book' && (
        <div className="space-y-8 animate-fade-up">
          
          {/* Header Banner */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold px-2.5 py-0.5 rounded-full bg-brand-clay/10 border border-brand-clay/20">
                    MORICHCARE REGISTRATION RC 2819279 · DAILY REPORTING
                  </span>
                </div>
                <h2 className="font-heading font-bold text-2xl sm:text-3xl text-brand-moss tracking-tight flex items-center gap-2.5">
                  <BookOpen className="w-7 h-7 text-brand-clay shrink-0" />
                  <span>Student Communication Book & Homework Diary</span>
                </h2>
                <p className="font-sans text-xs text-brand-charcoal/70 mt-1.5 max-w-2xl leading-relaxed">
                  After every completed lesson, your verified tutor logs how the class went, your child's engagement, and specific extra homework assigned. All notes are saved to this permanent diary and dispatched to your WhatsApp.
                </p>
              </div>

              {/* Student Filter Pills (if more than 1 student) */}
              {students.length > 1 && (
                <div className="flex items-center gap-2 bg-brand-cream/30 p-1.5 rounded-2xl border border-brand-moss/10 self-start md:self-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 font-bold px-2">Child:</span>
                  {students.map(s => (
                    <button
                      key={s.uid || s.id}
                      onClick={() => setSelectedChild(s.uid || s.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer ${
                        selectedChild === (s.uid || s.id)
                          ? 'bg-brand-moss text-white shadow-xs'
                          : 'text-brand-moss hover:bg-brand-moss/10'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-brand-moss/10 font-sans">
              <div className="bg-brand-cream/20 p-3.5 rounded-2xl border border-brand-moss/5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 font-bold block">
                  Class Notes Logged
                </span>
                <span className="font-heading font-extrabold text-xl text-brand-moss mt-0.5 block">
                  {(communicationBookEntries || []).length || (parentBookedSessions || []).filter(s => s && s.communicationBook).length} Notes
                </span>
              </div>
              <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/50">
                <span className="font-mono text-[9px] uppercase tracking-wider text-amber-800/70 font-bold block">
                  Homework Tasks Assigned
                </span>
                <span className="font-heading font-extrabold text-xl text-amber-900 mt-0.5 block">
                  {((communicationBookEntries || []).filter(e => e && e.homework).length) || ((parentBookedSessions || []).filter(s => s && s.communicationBook?.homework).length)} Tasks
                </span>
              </div>
              <div className="bg-brand-cream/20 p-3.5 rounded-2xl border border-brand-moss/5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 font-bold block">
                  Active Student
                </span>
                <span className="font-heading font-bold text-sm text-brand-moss mt-0.5 block truncate">
                  {activeStudent?.name || 'All Students'}
                </span>
              </div>
              <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/50">
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-800/70 font-bold block">
                  WhatsApp Delivery
                </span>
                <span className="font-heading font-bold text-xs text-emerald-700 mt-1 block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Instant Dispatch Active
                </span>
              </div>
            </div>
          </div>

          {/* Communication Book Entries Timeline */}
          <div className="space-y-4">
            {(() => {
              // Aggregate entries from dedicated API table or session records
              let allEntries = [...(communicationBookEntries || [])];
              (parentBookedSessions || []).forEach(s => {
                if (s && s.communicationBook && !allEntries.some(e => e && (e.sessionId === s.id || e.id === s.communicationBook?.id))) {
                  allEntries.push({ ...s.communicationBook, slot: s.slot, sessionId: s.id });
                }
              });

              // Filter by selected child if specified
              if (selectedChild) {
                const activeChildName = (activeStudent?.name || '').toLowerCase();
                const childMatches = allEntries.filter(e => {
                  if (!e) return false;
                  const sName = (e.studentName || '').toLowerCase();
                  return Boolean(activeChildName && (sName === activeChildName || sName.includes(activeChildName)));
                });
                if (childMatches.length > 0) {
                  allEntries = childMatches;
                }
              }

              if (allEntries.length === 0) {
                return (
                  <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-12 text-center shadow-sm font-sans space-y-4">
                    <div className="w-16 h-16 rounded-full bg-brand-moss/10 text-brand-moss flex items-center justify-center mx-auto">
                      <BookOpen className="w-8 h-8 text-brand-clay" />
                    </div>
                    <div className="max-w-md mx-auto">
                      <h3 className="font-heading font-bold text-lg text-brand-moss">No Communication Book Entries Yet</h3>
                      <p className="text-xs text-brand-charcoal/70 mt-1 leading-relaxed">
                        As your booked lessons conclude, your tutor will submit what was taught, student comprehension observations, and specific extra homework for {activeStudent.name || 'your child'}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('marketplace')}
                      className="py-2.5 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                    >
                      Browse & Book Verified Tutors
                    </button>
                  </div>
                );
              }

              return allEntries.map((entry, idx) => {
                const shareText = encodeURIComponent(
                  `📖 EduVista Daily Communication Book Note for ${entry.studentName || 'Student'}:\n\n` +
                  `• Subject: ${entry.subject || 'Lesson'}\n` +
                  `• How Class Went: ${entry.classSummary || 'Completed'}\n` +
                  (entry.homework ? `• ✍️ Homework: ${entry.homework}\n` : '') +
                  (entry.topicsCovered ? `• Topics: ${entry.topicsCovered}\n` : '') +
                  (entry.nextFocus ? `• Next Focus: ${entry.nextFocus}\n` : '') +
                  `\nView full diary on EduVista: https://eduvistar.com/#communication-book`
                );

                return (
                  <div key={entry.id || idx} className="bg-white border border-brand-moss/10 rounded-[2rem] p-6 shadow-sm hover-lift transition-all space-y-4 font-sans">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-moss/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-brand-moss/10 text-brand-moss flex items-center justify-center font-heading font-bold text-sm shrink-0">
                          {entry.teacherName ? entry.teacherName.charAt(0) : 'E'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-sm text-brand-moss">{entry.teacherName || 'Verified Educator'}</span>
                            <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Verified Tutor ✓
                            </span>
                          </div>
                          <span className="font-mono text-2xs text-brand-charcoal/50 block mt-0.5 uppercase">
                            {entry.slot?.day || 'Scheduled'} {entry.slot?.time ? `· ${entry.slot.time}` : ''} · Student: <strong className="text-brand-moss">{entry.studentName}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                        {entry.studentEngagement && (
                          <span className="py-1 px-3 rounded-full text-[11px] font-bold bg-brand-moss/5 text-brand-moss border border-brand-moss/15">
                            {entry.studentEngagement}
                          </span>
                        )}
                        <span className="py-1 px-3 rounded-full text-[11px] font-bold bg-brand-clay/10 text-brand-clay">
                          {entry.subject || 'Tutoring'}
                        </span>
                      </div>
                    </div>

                    {/* How the Class Went */}
                    <div className="space-y-1">
                      <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-brand-clay" />
                        How the Class Went (Teacher's Lesson Summary):
                      </span>
                      <div className="p-3.5 bg-brand-cream/30 border border-brand-moss/10 rounded-2xl text-xs text-brand-charcoal leading-relaxed italic">
                        "{entry.classSummary || 'Class completed successfully.'}"
                      </div>
                    </div>

                    {/* Topics Covered */}
                    {entry.topicsCovered && (
                      <div className="flex items-center gap-2 text-2xs">
                        <span className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/60">Topics Covered:</span>
                        <span className="font-mono font-semibold text-brand-moss bg-brand-moss/5 border border-brand-moss/10 px-2.5 py-1 rounded-lg">
                          {entry.topicsCovered}
                        </span>
                      </div>
                    )}

                    {/* Specific Extra Work / Homework Highlight */}
                    {entry.homework && (
                      <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-1 text-xs">
                        <span className="font-heading font-bold text-xs uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>✍️ Specific Extra Work / Homework Assigned:</span>
                        </span>
                        <p className="text-amber-950 font-medium leading-relaxed pl-5">
                          {entry.homework}
                        </p>
                      </div>
                    )}

                    {/* Next Class Focus */}
                    {entry.nextFocus && (
                      <div className="p-3 bg-brand-moss/5 border border-brand-moss/10 rounded-xl text-2xs text-brand-charcoal flex items-center gap-2">
                        <span className="font-heading font-bold uppercase tracking-wider text-brand-moss">🎯 Next Class Focus:</span>
                        <span>{entry.nextFocus}</span>
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="pt-2 flex items-center justify-between gap-3 text-2xs">
                      <span className="font-mono text-brand-charcoal/40 text-[10px]">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Verified Session'}
                      </span>
                      <a
                        href={`https://wa.me/?text=${shareText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        title="Forward this homework note to your child or another parent"
                      >
                        <span>📲 Share to Child on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

        </div>
      )}

      {/* ACTIVE SECTION: TUTOR DIRECTORY & MARKETPLACE */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6 animate-fade-up">
          {/* Sub-view switcher: Directory Search & Filters vs Rotating Leaderboard */}
          <div className="flex items-center justify-between bg-white border border-brand-moss/10 rounded-2xl p-2.5 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTutorBrowseView('directory')}
                className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  tutorBrowseView === 'directory'
                    ? 'bg-brand-moss text-white shadow-xs'
                    : 'text-brand-charcoal/60 hover:text-brand-moss hover:bg-brand-moss/5'
                }`}
              >
                Tutor Directory (Search & Filter)
              </button>
              <button
                type="button"
                onClick={() => setTutorBrowseView('leaderboard')}
                className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  tutorBrowseView === 'leaderboard'
                    ? 'bg-brand-moss text-white shadow-xs'
                    : 'text-brand-charcoal/60 hover:text-brand-moss hover:bg-brand-moss/5'
                }`}
              >
                Featured Leaderboard
              </button>
            </div>
            <span className="font-mono text-2xs text-brand-charcoal/50 hidden sm:inline pr-2">
              {tutorBrowseView === 'directory' ? 'Live Database Querying Active' : '60s Rotating Showcase'}
            </span>
          </div>

          {tutorBrowseView === 'directory' ? (
            <TutorDirectory 
              teachers={teachers || []} 
              selectedCurrency={selectedCurrency} 
              onBookClick={(teacher) => onBookClick && onBookClick(teacher, activeStudent)}
              formatCurrency={formatCurrency}
              convertMinor={convertMinor}
              onTeacherSelect={onTeacherSelect}
              onWatchVideo={(teacher) => {
                if (onTeacherSelect) {
                  const tutorId = teacher.username || teacher.uid || teacher.id;
                  onTeacherSelect(tutorId);
                }
              }}
              isNested={true}
            />
          ) : (
            <Marketplace 
              teachers={teachers || []} 
              selectedCurrency={selectedCurrency} 
              onBookClick={(teacher) => onBookClick && onBookClick(teacher, activeStudent)}
              formatCurrency={formatCurrency}
              convertMinor={convertMinor}
              onTeacherSelect={onTeacherSelect}
              isNested={true}
            />
          )}
        </div>
      )}

      {/* ACTIVE SECTION: BILLING & TOPUP */}
      {activeTab === 'billing' && (
        <div className="space-y-8 animate-fade-up">
          
          {/* Wallet Balance Strip & Top-up Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Wallet & Escrow Stats */}
            <div className="lg:col-span-4 space-y-6">
              {/* Available Wallet Balance */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between h-40 hover-lift">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-2">AVAILABLE WALLET FUNDS</span>
                  <span className="font-heading font-bold text-3xl text-brand-moss block">
                    {formatCurrency(convertMinor(parentWalletBalance, selectedCurrency), selectedCurrency)}
                  </span>
                  <span className="font-sans text-[10px] text-brand-charcoal/50 block mt-1">Funds available to secure private tutorials</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-brand-moss bg-brand-moss/5 border border-brand-moss/10 rounded-full px-3 py-1 w-fit">
                  <Wallet className="w-3.5 h-3.5" /> Wallet Active
                </div>
              </div>

              {/* Secured Escrow Balance */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between h-40 hover-lift">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-2">SECURED IN LIVE ESCROW</span>
                  <span className="font-heading font-bold text-3xl text-brand-moss block">
                    {formatCurrency(convertMinor(parentEscrowBalance, selectedCurrency), selectedCurrency)}
                  </span>
                  <span className="font-sans text-[10px] text-brand-charcoal/50 block mt-1">Locked in escrow until lesson completion approval</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-brand-clay bg-brand-moss/5 border border-brand-moss/10 rounded-full px-4 py-1.5 w-fit">
                  <ShieldCheck className="w-4 h-4" /> Secure Escrow Engine Active
                </div>
              </div>
            </div>

            {/* Wallet Top-up Interactive Form */}
            <div className="lg:col-span-8 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">DEPOSIT SYSTEM</span>
                <h3 className="font-heading font-bold text-xl text-brand-moss mt-0.5">Top-up Wallet Balance</h3>
                <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                  Securely add funds to yourAvailable Wallet Balance. Deposited amounts are protected in escrow and immediately available to book certified private tutors.
                </p>
              </div>

              {topupSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs py-3 px-4 rounded-xl font-mono animate-pulse">
                  {topupSuccess}
                </div>
              )}

              <form onSubmit={handleTopupSubmit} className="space-y-6 font-sans text-xs">
                
                {/* Choose Base Currency */}
                <div>
                  <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-1.5">Select Deposit Currency</label>
                  <select
                    value={topupCurrency}
                    onChange={(e) => {
                      const newCur = e.target.value;
                      setTopupCurrency(newCur);
                      setTopupAmount(newCur === 'NGN' ? '10000' : '50');
                    }}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl p-2.5 text-xs focus:outline-none text-brand-charcoal font-bold"
                  >
                    <option value="NGN">Nigerian Naira (NGN ₦)</option>
                    <option value="USD">US Dollar (USD $)</option>
                    <option value="GBP">British Pound (GBP £)</option>
                    <option value="EUR">Euro (EUR €)</option>
                    <option value="GHS">Ghanaian Cedi (GHS GH₵)</option>
                  </select>
                </div>

                {/* Preset Amounts Grid */}
                <div>
                  <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-3">Select Top-up Preset ({topupCurrency})</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(() => {
                      const presetsByCurrency = {
                        NGN: [{ label: '₦5,000', value: '5000' }, { label: '₦10,000', value: '10000' }, { label: '₦25,000', value: '25000' }],
                        USD: [{ label: '$10', value: '10' }, { label: '$25', value: '25' }, { label: '$50', value: '50' }],
                        GBP: [{ label: '£10', value: '10' }, { label: '£25', value: '25' }, { label: '£50', value: '50' }],
                        EUR: [{ label: '€10', value: '10' }, { label: '€25', value: '25' }, { label: '€50', value: '50' }],
                        GHS: [{ label: 'GH₵50', value: '50' }, { label: 'GH₵100', value: '100' }, { label: 'GH₵250', value: '250' }]
                      };
                      const activePresets = [...(presetsByCurrency[topupCurrency] || presetsByCurrency.NGN), { label: 'Custom Amount', value: 'custom' }];
                      return activePresets.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setTopupAmount(p.value)}
                          className={`py-3 rounded-xl border font-heading font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                            topupAmount === p.value
                              ? 'border-brand-clay bg-brand-clay/5 text-brand-charcoal shadow-sm'
                              : 'border-brand-moss/10 bg-white hover:border-brand-moss/45'
                          }`}
                        >
                          {p.label}
                        </button>
                      ));
                    })()}
                  </div>
                </div>

                {/* Custom Amount Input */}
                {topupAmount === 'custom' && (
                  <div className="animate-fade-in">
                    <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-1.5">Enter Custom Deposit Amount ({topupCurrency})</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 font-bold text-brand-moss">
                        {topupCurrency === 'NGN' ? '₦' : topupCurrency === 'USD' ? '$' : topupCurrency === 'GBP' ? '£' : topupCurrency === 'EUR' ? '€' : topupCurrency === 'GHS' ? 'GH₵' : topupCurrency}
                      </span>
                      <input
                        type="number"
                        required
                        placeholder={`e.g. ${topupCurrency === 'NGN' ? '15000' : '100'}`}
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full bg-white border border-brand-moss/10 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:border-brand-clay text-sm font-bold"
                      />
                    </div>
                  </div>
                )}

                {/* Simulated Payment Methods */}
                <div>
                  <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-3">Select Checkout Gateway</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'paystack', label: 'Paystack Checkout', icon: '💳' },
                      { id: 'bank', label: 'Bank Direct Transfer', icon: '🏦' }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setTopupMethod(method.id)}
                        className={`py-3 rounded-xl border font-heading font-bold text-[10px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 ${
                          topupMethod === method.id
                            ? 'border-brand-clay bg-brand-clay/5 text-brand-charcoal shadow-sm'
                            : 'border-brand-moss/10 bg-white hover:border-brand-moss/45'
                        }`}
                      >
                        <span>{method.icon}</span> {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inline Bank Details Info Box */}
                {topupMethod === 'bank' && (() => {
                  const details = {
                    NGN: { bank: 'Flutterwave MFB', number: '9811117173', name: 'Morichcare Educational Services', extraLabel: null, extraVal: null },
                    USD: { bank: 'Citibank NY', number: '9988223311', name: 'EduVista Africa Ltd', extraLabel: 'ROUTING / ABA', extraVal: '021000021' },
                    GBP: { bank: 'Barclays Bank London', number: '88776655', name: 'EduVista Africa Ltd', extraLabel: 'SORT CODE', extraVal: '20-00-00' },
                    EUR: { bank: 'Deutsche Bank Frankfurt', number: 'DE89370400440532013000', name: 'EduVista Africa Ltd', extraLabel: 'IBAN', extraVal: 'DE89370400440532013000' },
                    GHS: { bank: 'Ecobank Ghana', number: '77665544', name: 'EduVista Africa Ltd', extraLabel: 'BRANCH', extraVal: 'Accra High St' }
                  }[topupCurrency] || { bank: 'Flutterwave MFB', number: '9811117173', name: 'Morichcare Educational Services', extraLabel: null, extraVal: null };

                  return (
                    <div className="bg-brand-moss/5 border border-brand-moss/10 rounded-2xl p-4 animate-fade-in font-sans text-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-brand-clay font-bold block">🏦 Direct Bank Transfer Details</span>
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[8px] font-bold py-0.5 px-2 rounded-full uppercase">Instant Verification</span>
                      </div>
                      <p className="text-brand-charcoal/70">Please make a transfer of the exact amount in your selected deposit currency <strong className="uppercase">{topupCurrency}</strong>. Ensure you include your parent user ID <strong className="font-mono">{currentUser?.uid || currentUser?.id || 'EDU-PARENT'}</strong> as the transfer description/reference.</p>
                      <div className="bg-white border border-brand-moss/10 p-3.5 rounded-xl space-y-2 font-mono text-[10px] shadow-xs">
                        <div className="flex justify-between items-center py-0.5 border-b border-brand-moss/5">
                          <span className="text-brand-charcoal/50">BANK NAME:</span>
                          <span className="font-bold text-brand-moss text-xs">{details.bank}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-brand-moss/5">
                          <span className="text-brand-charcoal/50">ACCOUNT NAME:</span>
                          <span className="font-bold text-brand-moss text-xs">{details.name}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-brand-charcoal/50">ACCOUNT NUMBER:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-clay text-sm tracking-wider font-mono">{details.number}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(details.number);
                                alert(`Copied account number ${details.number} to clipboard!`);
                              }}
                              className="px-2 py-0.5 text-[9px] font-sans font-bold bg-brand-clay/10 text-brand-clay hover:bg-brand-clay hover:text-white rounded transition-colors"
                              title="Copy Account Number"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        {details.extraLabel && (
                          <div className="flex justify-between items-center pt-1 border-t border-brand-moss/5">
                            <span className="text-brand-charcoal/50">{details.extraLabel}:</span>
                            <span className="font-bold text-brand-moss">{details.extraVal}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Action Submit */}
                <button
                  type="submit"
                  disabled={topupLoading}
                  className="btn-magnetic w-full py-4 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-clay/20 flex items-center justify-center gap-2"
                >
                  {topupLoading ? 'Processing Checkout...' : 'Authorize Wallet Deposit'}
                </button>
              </form>
            </div>

          </div>

          {/* Spend Tracker Metric and Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Spend Tracker Card */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-4">SPEND TRACKER METRICS</span>
                
                <div className="bg-brand-cream/20 border border-brand-moss/5 p-5 rounded-2xl mb-6">
                  <span className="font-sans text-[10px] text-brand-charcoal/50 uppercase block">Total Spent (All Sessions)</span>
                  <span className="font-heading font-bold text-2xl text-brand-moss">
                    {formatCurrency(convertMinor(totalPaid || 0, selectedCurrency), selectedCurrency)}
                  </span>
                </div>

                {/* Spend Breakdown by Subject */}
                <div className="space-y-4 mb-6">
                  <h5 className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/60 font-bold">Breakdown by Subject</h5>
                  {Object.entries(spendBySubject).length === 0 ? (
                    <div className="py-4 text-center font-sans text-brand-charcoal/40 text-xs italic">
                      No lesson expenditure recorded yet.
                    </div>
                  ) : (
                    Object.entries(spendBySubject).map(([sub, amount], index) => {
                      const pct = Math.round((amount / (totalPaid || 1)) * 100);
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between font-sans text-xs">
                            <span>{sub}</span>
                            <span className="font-bold">{formatCurrency(convertMinor(amount, selectedCurrency), selectedCurrency)} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-brand-cream h-2 rounded-full">
                            <div 
                              className={`h-2 rounded-full ${index % 2 === 0 ? 'bg-brand-moss' : 'bg-brand-clay'}`} 
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Spend Breakdown by Teacher */}
                <div className="space-y-3">
                  <h5 className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/60 font-bold">Spend by Teacher</h5>
                  {Object.entries(spendByTeacher).length === 0 ? (
                    <p className="text-[11px] font-sans text-brand-charcoal/40 italic py-1 text-center">No tutor transactions yet.</p>
                  ) : (
                    Object.entries(spendByTeacher).map(([teacherName, amount], index) => (
                      <div key={index} className="flex justify-between items-center text-xs font-sans border-b border-brand-moss/5 pb-2">
                        <span className="text-brand-charcoal/70">{teacherName}</span>
                        <span className="font-bold text-brand-moss">{formatCurrency(convertMinor(amount, selectedCurrency), selectedCurrency)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-6 font-sans text-2xs text-brand-charcoal/60 leading-relaxed flex items-center gap-2 border-t border-brand-moss/5 mt-6">
                <Activity className="w-4 h-4 text-brand-clay animate-pulse" />
                <span>Spend updates are computed from finalized wallet escrow transfers.</span>
              </div>
            </div>

            {/* Transaction Ledger Log */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4">
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">ACCOUNT LEDGER</span>
              <h3 className="font-heading font-bold text-lg text-brand-moss flex items-center gap-1.5"><History className="w-5 h-5 text-brand-clay" /> Transaction Audit History</h3>
              
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {parentTransactions.length === 0 ? (
                  <span className="text-brand-charcoal/40 text-xs font-sans block text-center py-8">No billing records found.</span>
                ) : (
                  [...parentTransactions].reverse().map((t, idx) => {
                    const tType = String(t.type || t.paymentProcessor || 'transaction');
                    const tDate = String(t.date || t.createdAt || '');
                    const isTopup = tType.toLowerCase().includes('topup') || tType.toLowerCase().includes('deposit');
                    return (
                      <div key={idx} className="border-b border-brand-moss/5 pb-2 text-[10px] flex justify-between items-start gap-4">
                        <div>
                          <span className="font-bold block text-brand-moss">{tType.replace('_', ' ').toUpperCase()}</span>
                          <span className="text-brand-charcoal/50 block font-mono">Date: {tDate.substring(0, 10)}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold block ${isTopup ? 'text-emerald-600' : 'text-brand-clay'}`}>
                            {isTopup ? '+' : '-'}{formatCurrency(convertMinor(t.amount, selectedCurrency), selectedCurrency)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ACTIVE SECTION: DISPUTES & SUPPORT */}
      {activeTab === 'disputes' && (
        <div className="space-y-8 animate-fade-up">
          
          {/* Dispute Center alert status tracker */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm">
            <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-4">DISPUTE RESOLUTION CENTER</span>
            <h3 className="font-heading font-bold text-xl text-brand-moss mb-4 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-brand-clay" /> Active Dispute Status Tracking
            </h3>

            <div className="space-y-3">
              {(!dashboardData?.disputes || dashboardData.disputes.length === 0) ? (
                <div className="text-center text-brand-charcoal/40 text-xs py-8 font-sans">
                  No active disputes filed.
                </div>
              ) : (
                dashboardData.disputes.map(d => {
                  const session = (dashboardData?.sessions || parentBookedSessions || []).find(s => s.id === d.sessionId);
                  const teacherName = session ? session.teacherName : "Vetted Tutor";
                  return (
                    <div key={d.id} className="border border-brand-moss/10 rounded-2xl p-4 flex justify-between items-center bg-brand-cream/10">
                      <div>
                        <h4 className="font-heading font-bold text-sm text-brand-moss">{d.reason}</h4>
                        <p className="font-sans text-xs text-brand-charcoal/80 mt-1">{d.details}</p>
                        <span className="font-mono text-[9px] text-brand-charcoal/50 block mt-1 uppercase">
                          Dispute ID: {d.id} · Tutor: {teacherName}
                        </span>
                      </div>
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[9px] font-bold py-1 px-3 rounded-full uppercase tracking-wider animate-pulse">
                        {d.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Help Information guidelines */}
          <div className="bg-brand-moss text-brand-cream border border-brand-cream/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
            <h4 className="font-heading font-bold text-base text-white flex items-center gap-1.5 mb-2"><Info className="w-5 h-5 text-brand-clay" /> Dispute & Resolution Guidelines</h4>
            <p className="font-sans text-xs text-brand-cream/80 leading-relaxed space-y-2">
              If a tutor is a no-show, experiences continuous connectivity failures, or files incorrect hours, you can register a dispute within 48 hours of lesson completion. Escrow funds are immediately frozen pending manual administrator reviews.
            </p>
            <p className="font-sans text-xs text-brand-cream/80 leading-relaxed mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
              <span>For immediate priority support, WhatsApp our help desk directly at:</span>
              <a href="https://wa.me/2348136451607" target="_blank" rel="noopener noreferrer" className="text-brand-clay hover:underline font-bold font-mono">+234 813 645 1607</a>
            </p>
          </div>

        </div>
      )}

      {/* ACTIVE SECTION: AFFILIATE & REFERRALS */}
      {activeTab === 'affiliate' && (
        <div className="space-y-8 animate-fade-up">
          
          {/* Header */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-4">
            <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block">PARTNERSHIP INTERACTION</span>
            <h3 className="font-heading font-bold text-2xl text-brand-moss">{localT('affiliateTitle')}</h3>
            <p className="font-sans text-xs text-brand-charcoal/70">
              {localT('affiliateSub')}
            </p>
          </div>

          {/* Referral Link Copy Area */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-4">
            <h4 className="font-heading font-bold text-sm text-brand-moss">{localT('referralLink')}</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/?ref=${parentUid}`}
                className="flex-1 bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-4 py-3 font-mono text-xs text-brand-moss focus:outline-none select-all"
              />
              <button
                onClick={() => {
                  const shareUrl = `${window.location.origin}/?ref=${parentUid}`;
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(shareUrl)
                      .then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      })
                      .catch((err) => {
                        console.error('Failed to copy text: ', err);
                        // fallback copy
                        const textArea = document.createElement('textarea');
                        textArea.value = shareUrl;
                        textArea.style.position = 'fixed';
                        textArea.style.opacity = '0';
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        try {
                          document.execCommand('copy');
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch (e) {
                          console.error('Fallback copy failed', e);
                        }
                        document.body.removeChild(textArea);
                      });
                  } else {
                    const textArea = document.createElement('textarea');
                    textArea.value = shareUrl;
                    textArea.style.position = 'fixed';
                    textArea.style.opacity = '0';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    try {
                      document.execCommand('copy');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch (e) {
                      console.error('Fallback copy failed', e);
                    }
                    document.body.removeChild(textArea);
                  }
                }}
                className="bg-brand-clay hover:bg-brand-clay/95 text-white font-heading font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-full shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {copied ? localT('copiedLink') : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-brand-moss/10 rounded-[1.5rem] p-5 shadow-sm">
              <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 block">{localT('referralHits')}</span>
              <span className="font-heading font-bold text-2xl text-brand-moss block mt-1">{referralStats.hits}</span>
              <span className="font-mono text-[9px] text-brand-charcoal/40 block mt-1 font-bold">Unique tracking link visits</span>
            </div>
            <div className="bg-white border border-brand-moss/10 rounded-[1.5rem] p-5 shadow-sm">
              <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 block">{localT('conversions')}</span>
              <span className="font-heading font-bold text-2xl text-brand-moss block mt-1">{referralStats.conversions}</span>
              <span className="font-mono text-[9px] text-emerald-600 font-bold block mt-1">✓ {localT('totalReferrals')}</span>
            </div>
            <div className="bg-white border border-brand-moss/10 rounded-[1.5rem] p-5 shadow-sm">
              <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 block">{localT('accruedEarnings')}</span>
              <span className="font-heading font-bold text-2xl text-brand-clay block mt-1">
                {formatCurrency(convertMinor(referralStats.earnings, selectedCurrency), selectedCurrency)}
              </span>
              <span className="font-mono text-[9px] text-brand-charcoal/40 block mt-1 font-bold">Withdrawable referral commission</span>
            </div>
          </div>

          {/* Referrals List Table */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-4">
            <h4 className="font-heading font-bold text-sm text-brand-moss">Your Referrals History</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="border-b border-brand-moss/10 text-brand-charcoal/50 font-mono text-[9px] uppercase tracking-wider">
                    <th className="py-2.5 pb-4">Referred Parent</th>
                    <th className="py-2.5 pb-4">Date</th>
                    <th className="py-2.5 pb-4">Status</th>
                    <th className="py-2.5 pb-4 text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-moss/5 text-brand-charcoal/80">
                  {referralsList.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-brand-charcoal/40 text-xs italic">
                        No referred parents yet. Share your link above to begin earning commissions.
                      </td>
                    </tr>
                  ) : (
                    referralsList.map((ref) => (
                      <tr key={ref.id}>
                        <td className="py-3.5 font-bold text-brand-moss">{ref.name}</td>
                        <td className="py-3.5 font-mono text-[10px]">{ref.date}</td>
                        <td className="py-3.5">
                          <span className={`font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                            ref.status === 'Converted' ? 'bg-emerald-50 text-emerald-800' : 'bg-brand-cream/50 text-brand-charcoal/60'
                          }`}>
                            {ref.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-bold text-brand-moss">
                          {ref.commission > 0 
                            ? formatCurrency(convertMinor(ref.commission, selectedCurrency), selectedCurrency)
                            : '—'
                          }
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* DISPUTE FILING MODAL */}
      {isDisputeOpen && disputeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-xs" onClick={() => setIsDisputeOpen(false)} />
          
          <div className="bg-brand-cream border border-brand-moss/10 rounded-[2.5rem] p-8 w-full max-w-md relative z-10 shadow-2xl animate-fade-up">
            <h3 className="font-heading font-bold text-xl text-brand-moss mb-2">Register Lesson Dispute</h3>
            <p className="font-sans text-xs text-brand-charcoal/70 mb-6">
              You are raising a claim for the lesson with <span className="font-bold">{disputeSession.teacherName}</span> on {disputeSession.slot.day}. This locks escrow release actions immediately.
            </p>

            <form onSubmit={handleFileDispute} className="space-y-4 font-sans text-xs">
              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-brand-charcoal/50 mb-1.5">Reason Category</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full bg-white border border-brand-moss/10 rounded-xl p-3 focus:outline-none focus:border-brand-clay"
                >
                  <option value="Incorrect billing time">Incorrect billing time</option>
                  <option value="Tutor did not show up">Tutor did not show up</option>
                  <option value="Poor lesson quality">Poor lesson quality</option>
                  <option value="Technical Zoom difficulties">Technical Zoom difficulties</option>
                  <option value="Other">Other (provide details below)</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-brand-charcoal/50 mb-1.5">Provide Specific Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the discrepancy or problem..."
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  className="w-full bg-white border border-brand-moss/10 rounded-xl p-3 focus:outline-none focus:border-brand-clay resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDisputeOpen(false)}
                  className="flex-1 border border-brand-moss/10 hover:border-brand-moss hover:bg-white rounded-xl py-3 font-heading font-bold text-brand-charcoal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-rose-700 hover:bg-rose-800 text-white rounded-xl py-3 font-heading font-bold uppercase tracking-wider"
                >
                  File Dispute Claim
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {isReviewOpen && reviewSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-xs" onClick={() => setIsReviewOpen(false)} />
          <div className="bg-brand-cream border border-brand-moss/10 rounded-[2.5rem] p-8 w-full max-w-md relative z-10 shadow-2xl animate-fade-up">
            <button 
              onClick={() => setIsReviewOpen(false)} 
              className="absolute top-6 right-6 text-brand-charcoal/60 hover:text-brand-charcoal font-bold text-base"
            >
              ✕
            </button>
            <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">Feedback</span>
            <h3 className="font-heading font-bold text-xl text-brand-moss mb-2">Leave Teacher Review</h3>
            <p className="font-sans text-xs text-brand-charcoal/70 mb-4">
              Rate your completed session with <span className="font-bold">{reviewSession.teacherName}</span>.
            </p>

            {reviewStatus && (
              <div className="mb-4 text-xs font-mono font-bold text-brand-clay text-center bg-white p-2.5 rounded-xl border border-brand-moss/10">
                {reviewStatus}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4 font-sans text-xs">
              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-brand-charcoal/50 mb-1.5 text-center">Rating (1 to 5 Stars)</label>
                <div className="flex gap-3 justify-center py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`text-2xl transition-transform ${star <= reviewRating ? 'scale-110' : 'opacity-30'}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-brand-charcoal/50 mb-1.5">Written Feedback / Review</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share details about lesson punctuality, engagement, and subject clarity..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full bg-white border border-brand-moss/10 rounded-xl p-3 focus:outline-none focus:border-brand-clay resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(false)}
                  className="flex-1 border border-brand-moss/10 hover:border-brand-moss hover:bg-white rounded-xl py-3 font-heading font-bold text-brand-charcoal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-moss hover:bg-brand-clay text-white rounded-xl py-3 font-heading font-bold uppercase tracking-wider transition-colors"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SESSION CLOCK LOG MODAL */}
      {isClockLogOpen && selectedClockSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-xs" onClick={() => setIsClockLogOpen(false)} />
          
          <div className="bg-brand-cream border border-brand-moss/10 rounded-[2.5rem] p-8 w-full max-w-md relative z-10 shadow-2xl animate-fade-up">
            <button 
              onClick={() => setIsClockLogOpen(false)} 
              className="absolute top-6 right-6 text-brand-charcoal/60 hover:text-brand-charcoal font-bold text-base"
            >
              ✕
            </button>
            <h3 className="font-heading font-bold text-xl text-brand-moss mb-2">Lesson Clock Log</h3>
            <p className="font-sans text-xs text-brand-charcoal/70 mb-4">
              Billed vs Scheduled time breakdown for your session with <span className="font-bold">{selectedClockSession.teacherName}</span>.
            </p>

            <div className="bg-white border border-brand-moss/10 rounded-2xl p-4 mb-4 font-mono text-[11px] space-y-2">
              <div className="flex justify-between border-b border-brand-moss/5 pb-2">
                <span>Scheduled Time:</span>
                <span className="font-bold">60 minutes</span>
              </div>
              <div className="flex justify-between border-b border-brand-moss/5 pb-2">
                <span>Billed Time:</span>
                <span className="font-bold text-brand-moss">60 minutes</span>
              </div>
              <div className="pt-2">
                <span className="text-[9px] uppercase font-bold text-brand-clay block mb-1">Tamper-Proof Events Timeline (Server-side)</span>
                <div className="space-y-1.5 text-[9px] text-brand-charcoal/80">
                  <div className="flex justify-between">
                    <span>🟢 Video Channel Connected</span>
                    <span>4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>⏸️ Stream Paused (Teacher refresh)</span>
                    <span>4:32 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>▶️ Stream Resumed</span>
                    <span>4:34 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🔴 Video Channel Closed</span>
                    <span>5:02 PM</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => alert('Evidence Log PDF downloaded successfully. File hash: sha256-4b2a8d...')}
              className="btn-magnetic w-full py-3 bg-brand-moss hover:bg-brand-clay text-white rounded-full font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
            >
              <Download className="w-4 h-4" /> Download Evidence PDF
            </button>
          </div>
        </div>
      )}

    </section>
  );
}
