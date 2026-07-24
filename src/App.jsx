import React, { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ShieldCheck,
  Layers,
  Globe,
  Calendar,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Lock,
  Activity,
  Sparkles,
  Star,
  BookOpen,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Bell,
  MessageSquare,
  Send,
  X,
  HelpCircle,
  Mail,
  User,
  Play
} from 'lucide-react';

import { useAuth } from './contexts/AuthContext';

import heroImage from './assets/hero.jpg';
import { translations } from './locales/i18n';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Routes, Route, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import BrandLogo from './components/BrandLogo';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';

const BookingModal = lazy(() => import('./components/BookingModal'));
const Marketplace = lazy(() => import('./components/Marketplace'));
const SessionEngine = lazy(() => import('./components/SessionEngine'));
const ParentDashboard = lazy(() => import('./components/ParentDashboard'));
const Academy = lazy(() => import('./components/Academy'));
const AuthModal = lazy(() => import('./components/AuthModal'));
const ChatPanel = lazy(() => import('./components/ChatPanel'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const TeacherOnboarding = lazy(() => import('./components/TeacherOnboarding'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const TeacherPublicProfile = lazy(() => import('./components/TeacherPublicProfile'));
const StudentPortal = lazy(() => import('./components/StudentPortal'));
const PrivacyModal = lazy(() => import('./components/PrivacyModal'));

gsap.registerPlugin(ScrollTrigger);

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-12 w-full min-h-[200px]">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <div className="absolute inset-0 border-2 border-dashed border-brand-clay rounded-full animate-spin" />
        <span className="font-mono text-[9px] uppercase tracking-wider text-brand-moss font-bold">EB</span>
      </div>
    </div>
  );
}

function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-charcoal/40 backdrop-blur-2xs">
      <div className="bg-white border border-brand-moss/10 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl">
        <div className="relative w-12 h-12 flex items-center justify-center mb-3">
          <div className="absolute inset-0 border-2 border-dashed border-brand-clay rounded-full animate-[spin_3s_linear_infinite]" />
          <span className="font-mono text-xs uppercase tracking-wider text-brand-moss font-bold">EB</span>
        </div>
        <span className="font-sans text-[10px] text-brand-moss font-bold uppercase tracking-wider">Loading secure panel...</span>
      </div>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState('en');
  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;

  const [scrolled, setScrolled] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState(0);
  
  // Current user authentication states
  const { currentUser, setCurrentUser, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileUsername, setProfileUsername] = useState(() => {
    const path = window.location.pathname;
    const match = path.match(/\/teacher\/([^/]+)/);
    return match ? match[1] : '';
  });
  const [isTutorOnboarding, setIsTutorOnboarding] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedChatSession, setSelectedChatSession] = useState(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Waitlist form states
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistRole, setWaitlistRole] = useState('Parent');
  const [waitlistStatus, setWaitlistStatus] = useState('');

  // Inline Gated Authentication Form States
  const [authTab, setAuthTab] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('Parent');
  const [authCountry, setAuthCountry] = useState('Nigeria');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dynamic App States for Portals Sync
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [walletBalance, setWalletBalance] = useState(0); // in minor units
  const [escrowBalance, setEscrowBalance] = useState(0); // in minor units
  
  // Booked sessions state
  const [bookedSessions, setBookedSessions] = useState([]);

  // Homework grading portal sync state
  const [gradesLog, setGradesLog] = useState([]);
  const [pendingAssignments, setPendingAssignments] = useState([]);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  
  // AI Customer Support Agent States
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessages, setSupportMessages] = useState([
    { sender: 'agent', text: "Hello! I am your EduVista Virtual Assistant. How can I help you navigate our platform today?" }
  ]);
  const [supportInput, setSupportInput] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const prevUnreadCountRef = useRef(0);

  // Vetted Teachers Database state (so we can append reviews)
      const [teachers, setTeachers] = useState([
    {
      id: "teacher_1",
      uid: "teacher_1",
      username: "adebayo",
      name: "Mr. Adebayo Okafor",
      location: "Lagos, Nigeria",
      subjects: ["Mathematics", "Physics"],
      curriculums: ["WAEC", "JAMB", "IGCSE", "High School (Ages 15-18)", "University Prep", "Adult Education"],
      rate: 400000,
      rating: 4.9,
      reviewsCount: 247,
      badges: ["badge-verified", "badge-top-rated", "badge-bg-checked"],
      bio: "12 years teaching mathematics preparation. Specializes in algebra speed calculations and IGCSE/WAEC exam setups.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop",
      online: true,
      reviews: [
        { parent: "Kehinde A.", text: "Excellent algebra prep. Tunde passed his WAEC with an A1!", score: 5 },
        { parent: "Sarah M.", text: "Great physics explanations. Highly recommend.", score: 5 }
      ]
    },
    {
      id: "teacher_2",
      uid: "teacher_2",
      username: "chioma",
      name: "Ms. Chioma Eze",
      location: "Abuja, Nigeria",
      subjects: ["English", "Literature"],
      curriculums: ["WAEC", "IGCSE", "Primary (Ages 6-10)", "Middle School (Ages 11-14)"],
      rate: 350000,
      rating: 4.8,
      reviewsCount: 156,
      badges: ["badge-verified", "badge-bg-checked"],
      bio: "Dedicated English educator focused on reading comprehension and creative writing skills. Over 8 years of experience with international curricula.",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop",
      online: true,
      reviews: [
        { parent: "Ngozi A.", text: "My daughter loves her lessons. Her reading has improved drastically.", score: 5 }
      ]
    },
    {
      id: "teacher_3",
      uid: "teacher_3",
      username: "femi",
      name: "Dr. Femi Ojo",
      location: "Port Harcourt, Nigeria",
      subjects: ["Chemistry", "Biology"],
      curriculums: ["JAMB", "WAEC", "A-Levels", "University Prep"],
      rate: 500000,
      rating: 5.0,
      reviewsCount: 89,
      badges: ["badge-verified", "badge-top-rated", "badge-bg-checked"],
      bio: "Former university lecturer with a PhD in Biochemistry. I break down complex scientific concepts into easy-to-understand real-world applications.",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=600&auto=format&fit=crop",
      online: false,
      reviews: [
        { parent: "Emeka O.", text: "The best science tutor we've ever had. Truly exceptional.", score: 5 }
      ]
    },
    {
      id: "teacher_4",
      uid: "teacher_4",
      username: "grace",
      name: "Mrs. Grace Ojo",
      location: "Ibadan, Nigeria",
      subjects: ["Basic Literacy", "Numeracy", "Phonics"],
      curriculums: ["Early Years Foundation Stage (EYFS)", "Nursery", "Primary (Ages 6-10)"],
      rate: 250000,
      rating: 4.9,
      reviewsCount: 112,
      badges: ["badge-verified", "badge-bg-checked"],
      bio: "Early childhood education specialist. I use play-based learning and interactive phonics to build a strong foundation for young learners.",
      avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1bfa82?q=80&w=200&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop",
      online: true,
      reviews: [
        { parent: "Aisha M.", text: "My 5-year-old looks forward to her phonics classes every week!", score: 5 }
      ]
    },
    {
      id: "teacher_5",
      uid: "teacher_5",
      username: "samuel",
      name: "Mr. Samuel Kalu",
      location: "Enugu, Nigeria",
      subjects: ["General Science", "Basic Mathematics"],
      curriculums: ["Primary (Ages 6-10)", "Montessori"],
      rate: 200000,
      rating: 4.8,
      reviewsCount: 95,
      badges: ["badge-verified"],
      bio: "Passionate about making math and science fun for kids. I integrate visual aids and Montessori methods to engage young minds.",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600&auto=format&fit=crop",
      online: true,
      reviews: [
        { parent: "Chukwudi E.", text: "He has a great way of explaining fractions to my 8-year-old.", score: 5 }
      ]
    },
    {
      id: "teacher_6",
      uid: "teacher_6",
      username: "amina",
      name: "Miss Amina Bello",
      location: "Kano, Nigeria",
      subjects: ["Creative Arts", "English Reading", "Handwriting"],
      curriculums: ["Nursery", "Primary (Ages 6-10)"],
      rate: 150000,
      rating: 4.7,
      reviewsCount: 78,
      badges: ["badge-verified", "badge-bg-checked"],
      bio: "Patient and encouraging tutor for nursery and early primary students. Specializes in helping kids develop excellent reading habits and fine motor skills.",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=600&auto=format&fit=crop",
      online: false,
      reviews: [
        { parent: "Fatima S.", text: "Her handwriting improvement techniques are amazing.", score: 4 }
      ]
    }
  ]);
  const [hasMoreTeachers, setHasMoreTeachers] = useState(false);
  const [teachersPage, setTeachersPage] = useState(1);

  // Booking Modal Trigger State
  const [selectedTeacherForBooking, setSelectedTeacherForBooking] = useState(null);
  const [selectedStudentForBooking, setSelectedStudentForBooking] = useState(null);
  const [bookingPreselectedSlots, setBookingPreselectedSlots] = useState([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [watchingTeacherVideo, setWatchingTeacherVideo] = useState(null);

  // Exchange Rates & Display Engine (Integer logic)
  const exchangeRates = {
    NGN_USD: 0.00125,
    NGN_GBP: 0.001,
    NGN_EUR: 0.00116,
    NGN_GHS: 0.0143,
    NGN_CAD: 0.00172
  };

  const convertMinor = (ngnMinor, targetCurrency) => {
    if (targetCurrency === 'NGN') return ngnMinor;
    const rateKey = `NGN_${targetCurrency}`;
    const rate = exchangeRates[rateKey] || 1;
    return Math.round(ngnMinor * rate);
  };

  const formatCurrency = (amountInMinor, currency) => {
    const value = amountInMinor / 100;
    const formatters = {
      NGN: new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }),
      USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
      EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
      GHS: new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }),
      CAD: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
    };
    return formatters[currency]?.format(value) ?? `${currency} ${value}`;
  };

  // API Backend Sync
  const API_BASE = '/api';

  const getAuthHeaders = (extraHeaders = {}) => {
    const token = localStorage.getItem('eduvista_token');
    return {
      'Content-Type': 'application/json',
      ...extraHeaders,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const loadFilteredTeachers = async (filters = {}, page = 1, append = false) => {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 12,
        ...filters
      });
      
      const teachersRes = await fetch(`${API_BASE}/teachers?${queryParams}`, {
        headers: getAuthHeaders()
      });
      
      if (!teachersRes.ok) {
        throw new Error('Failed to fetch teachers from API');
      }
      
      const teachersData = await teachersRes.json();
      
      let newTeachers = [];
      if (Array.isArray(teachersData.data)) {
        newTeachers = teachersData.data;
      } else if (Array.isArray(teachersData)) {
        newTeachers = teachersData;
      }
      
      if (append && page > 1) {
        setTeachers(prev => {
          const combined = [...prev, ...newTeachers];
          return Array.from(new Map(combined.map(t => [t.uid || t.id, t])).values());
        });
      } else {
        setTeachers(newTeachers);
      }
      
      setHasMoreTeachers(!!teachersData.hasMore);
      setTeachersPage(page);
    } catch (err) {
      console.warn("Using local teachers fallback:", err.message);
    }
  };

  const fetchInitialData = async () => {
    try {
      await loadFilteredTeachers({}, 1, false);

      const activeUid = currentUser ? currentUser.uid : 'parent_1';
      const dashboardRes = await fetch(`${API_BASE}/parents/dashboard/${activeUid}`, {
        headers: getAuthHeaders()
      });

      if (dashboardRes.ok) {
        const d = await dashboardRes.json();
        if (d.sessions) {
          setBookedSessions(d.sessions.map(s => {
            const matchedTeacher = teachers.find(t => t.id === s.teacherId || t.uid === s.teacherId);
            return {
              ...s,
              id: s.id,
              teacherId: s.teacherId,
              teacherName: s.teacherName,
              avatar: s.avatar || matchedTeacher?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
              subject: s.subject,
              slot: s.slot,
              cost: s.cost,
              status: s.status
            };
          }));
        }
        if (d.grades) {
          setGradesLog(d.grades);
        }
        if (d.walletBalance !== undefined) {
          setWalletBalance(d.walletBalance);
        }
        if (d.escrowBalance !== undefined) {
          setEscrowBalance(d.escrowBalance);
        }
      }
    } catch (error) {
      console.warn("Dashboard fetch error:", error.message);
    }
  };

  const fetchNotifications = async () => {
    try {
      if (!currentUser) return;
      const res = await fetch(`${API_BASE}/notifications/${currentUser.uid}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const unread = data.filter(n => !n.read);
        if (unread.length > prevUnreadCountRef.current && unread.length > 0) {
          const newest = unread[0];
          setActiveToast(newest);
          setTimeout(() => setActiveToast(null), 4000);
        }
        prevUnreadCountRef.current = unread.length;
        setNotifications(data);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all/${currentUser.uid}`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      prevUnreadCountRef.current = 0;
    }
  }, [currentUser]);

  useEffect(() => {
    fetchInitialData();
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        localStorage.setItem('eduvista_token', token);
        
        try {
          const response = await fetch(`${API_BASE}/users/${user.uid}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const profile = await response.json();
            const fullUser = { ...profile, token };
            localStorage.setItem('eduvista_user', JSON.stringify(fullUser));
            setCurrentUser(fullUser);
          }
        } catch (err) {
          console.warn("Failed to retrieve database profile for Firebase user:", err);
        }
      } else {
        const savedUserStr = localStorage.getItem('eduvista_user');
        if (savedUserStr) {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser.uid && (savedUser.uid.startsWith('user_') || savedUser.uid.includes('_1'))) {
            // Keep local mock profile
          } else {
            logout();
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Check for referral code and register hit
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) {
      localStorage.setItem('eduvista_ref', ref);
      fetch(`${API_BASE}/parents/referral/hit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref })
      })
      .then(res => res.json())
      .then(data => console.log("Referral hit registered:", data))
      .catch(err => console.warn("Failed to register referral hit:", err));
    }
  }, []);

  // Handle URL path client-side routing and hash checking
  useEffect(() => {
    const handleUrlCheck = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const match = path.match(/\/teacher\/([^/]+)/);
      
      if (match) {
        const username = match[1];
        navigate('/teacher');
        setProfileUsername(username);
      } else {
        const savedUser = localStorage.getItem('eduvista_user');
        if (hash === '#topup' || hash === '#billing') {
          if (!savedUser) {
            navigate('/');
            setProfileUsername('');
            setAuthTab('login');
            setIsAuthOpen(true);
          } else {
            navigate('/dashboard');
            setProfileUsername('');
          }
        } else {
          // If no specific hash, set to dashboard if logged in, or home
          const saved = localStorage.getItem('eduvista_user');
          navigate(saved ? '/dashboard' : '/');
          setProfileUsername('');
          // Refresh ScrollTrigger and reset timeline when returning home
          setTimeout(() => {
            ScrollTrigger.refresh();
          }, 100);
        }
      }
    };

    handleUrlCheck();
    window.addEventListener('popstate', handleUrlCheck);
    window.addEventListener('hashchange', handleUrlCheck);
    return () => {
      window.removeEventListener('popstate', handleUrlCheck);
      window.removeEventListener('hashchange', handleUrlCheck);
    };
  }, []);

  // Refresh GSAP ScrollTriggers when showing the homepage layout
  useEffect(() => {
    if (location.pathname === '/') {
      ScrollTrigger.refresh();
    }
  }, [location.pathname]);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Smooth scroll helper for homepage sections
  const scrollToSection = (id) => (e) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // State handlers
  const handleBookClick = (teacher, student, preselectedSlots = []) => {
    if (!currentUser) {
      setAuthTab('login');
      setIsAuthOpen(true);
      return;
    }



    setSelectedTeacherForBooking(teacher);
    setSelectedStudentForBooking(student || null);
    setBookingPreselectedSlots(preselectedSlots);
    setIsBookingOpen(true);
  };

  const handleBackToHome = () => {
    const basePath = window.location.pathname.startsWith('/EduVista') ? '/EduVista/' : '/';
    window.history.pushState({}, '', basePath);
    navigate('/');
    setProfileUsername('');
    // Ensure scroll resets
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Force refresh ScrollTrigger after a short delay to allow DOM updates
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  };
  const handleTutorProfileSelect = (username) => {
    const basePath = window.location.pathname.startsWith('/EduVista') ? '/EduVista' : '';
    window.history.pushState({}, '', `${basePath}/teacher/${username}`);
    navigate('/teacher');
    setProfileUsername(username);
  };

  const handleOpenChat = (session) => {
    setSelectedChatSession(session);
    setIsChatOpen(true);
  };

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setWaitlistStatus('Submitting...');
    try {
      const response = await fetch(`${API_BASE}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: waitlistName, email: waitlistEmail, role: waitlistRole })
      });
      if (response.ok) {
        setWaitlistStatus('✓ Success! You are on the waitlist.');
        setWaitlistName('');
        setWaitlistEmail('');
      } else {
        const data = await response.json();
        setWaitlistStatus(`Error: ${data.error || 'Failed to submit'}`);
      }
    } catch (err) {
      console.error('Waitlist API error:', err);
      setWaitlistStatus('✓ Success (Local Sandbox Fallback)');
      setWaitlistName('');
      setWaitlistEmail('');
    }
  };

  const handleAuthSuccess = (user) => {
    login(user, user.token);
    navigate('/dashboard');
    if (user.role === 'Parent') {
      window.location.hash = '#marketplace';
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = authTab === 'login' ? '/auth/login' : '/auth/register';
    const refCode = localStorage.getItem('eduvista_ref');
    const payload = authTab === 'login' 
      ? { email: authEmail, password: authPassword } 
      : { email: authEmail, displayName: authName, role: authRole, country: authCountry, password: authPassword, referredBy: refCode || undefined };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        handleAuthSuccess(data);
      } else {
        setAuthError(data.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      // Fallback local simulation if backend offline
      if (authTab === 'login') {
        const lowerEmail = authEmail.toLowerCase();
        if (lowerEmail.includes('parent')) {
          const u = { uid: 'parent_1', displayName: 'Ngozi Adeleke', role: 'Parent', email: authEmail, country: 'Nigeria' };
          handleAuthSuccess(u);
        } else if (lowerEmail.includes('teacher')) {
          const u = { uid: 'teacher_1', displayName: 'Mr. Adebayo Okafor', role: 'Teacher', email: authEmail, country: 'Nigeria' };
          handleAuthSuccess(u);
        } else if (lowerEmail.includes('student')) {
          const u = { uid: 'student_1', displayName: 'Tunde Okafor', role: 'Student', email: authEmail };
          handleAuthSuccess(u);
        } else if (lowerEmail === 'zeerocodes@gmail.com' || lowerEmail.includes('admin')) {
          const u = { uid: 'admin_zeerocodes', displayName: 'Zeerocodes Super Admin', role: 'Admin', email: authEmail };
          handleAuthSuccess(u);
        } else {
          setAuthError('Simulated error: use parent@eduvista.com, teacher@eduvista.com, student@eduvista.com or admin@eduvista.com');
        }
      } else {
        const mockUid = `user_${Date.now()}`;
        const finalRole = authEmail.toLowerCase() === 'zeerocodes@gmail.com' ? 'Admin' : authRole;
        const u = { uid: mockUid, displayName: authName, role: finalRole, email: authEmail, country: authCountry };
        handleAuthSuccess(u);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendSupportMessage = async (e) => {
    e.preventDefault();
    if (!supportInput.trim() || supportLoading) return;

    const userMsg = { sender: 'user', text: supportInput };
    setSupportMessages(prev => [...prev, userMsg]);
    const messageToSend = supportInput;
    setSupportInput('');
    setSupportLoading(true);

    try {
      const response = await fetch(`${API_BASE}/support/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          history: supportMessages
        })
      });
      if (response.ok) {
        const data = await response.json();
        setSupportMessages(prev => [...prev, { sender: 'agent', text: data.reply }]);
      } else {
        setSupportMessages(prev => [...prev, { sender: 'agent', text: "Sorry, I am having trouble connecting to support right now." }]);
      }
    } catch (err) {
      console.error("Support API error:", err);
      setSupportMessages(prev => [...prev, { sender: 'agent', text: "Connection error. Please try again." }]);
    } finally {
      setSupportLoading(false);
    }
  };

  const handleBookingConfirm = async (costNgnMinor, slots, paymentMethod = 'wallet', options = {}) => {
    const activeStudentId = selectedStudentForBooking ? (selectedStudentForBooking.uid || selectedStudentForBooking.id) : 'student_1';
    const activeStudentName = selectedStudentForBooking ? selectedStudentForBooking.name : 'Tunde';
    try {
      if (paymentMethod === 'paystack') {
        const provider = 'paystack';
        const checkoutRes = await fetch(`${API_BASE}/payments/checkout`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            parentId: currentUser ? currentUser.uid : 'parent_1',
            amount: convertMinor(costNgnMinor, selectedCurrency),
            currency: selectedCurrency,
            provider,
            paymentType: 'session_booking',
            amountNgnMinor: costNgnMinor,
            studentId: activeStudentId,
            studentName: activeStudentName,
            teacherId: selectedTeacherForBooking.id || selectedTeacherForBooking.uid,
            teacherName: selectedTeacherForBooking.name,
            slots,
            metadata: {
              subject: options.subject,
              curriculum: options.curriculum,
              teacherId: selectedTeacherForBooking.id || selectedTeacherForBooking.uid,
              teacherName: selectedTeacherForBooking.name,
              slots: JSON.stringify(slots),
              studentId: activeStudentId,
              studentName: activeStudentName
            }
          })
        });
        if (checkoutRes.ok) {
          const data = await checkoutRes.json();
          appendTelemetryLog(`Initiating ${provider} checkout for ${formatCurrency(data.amount, data.currency)}`);
          window.location.href = data.checkoutUrl;
          return;
        } else {
          const errData = await checkoutRes.json().catch(() => ({}));
          console.error("Booking checkout initiation failed:", errData);
          toast.error(`Booking payment failed: ${errData.error || "Payment gateway error"}`);
          if (checkoutRes.status === 401 || checkoutRes.status === 403 || (errData.error && errData.error.toLowerCase().includes("token"))) {
            logout();
          }
          return;
        }
      }

      const response = await fetch(`${API_BASE}/sessions/book`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          teacherId: selectedTeacherForBooking.id || selectedTeacherForBooking.uid,
          teacherName: selectedTeacherForBooking.name,
          studentId: activeStudentId,
          studentName: activeStudentName,
          parentId: currentUser ? currentUser.uid : 'parent_1',
          costPerSession: Math.floor(costNgnMinor / slots.length),
          slots,
          subject: options.subject || (selectedTeacherForBooking.subjects && selectedTeacherForBooking.subjects[0]) || 'General',
          curriculum: options.curriculum || (selectedTeacherForBooking.curricula && selectedTeacherForBooking.curricula[0]) || 'Standard',
          paymentMethod
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'pending') {
          toast.success("Booking secured pending Admin bank transfer verification!");
        } else {
          setWalletBalance(data.walletBalance);
          setEscrowBalance(data.escrowBalance);
          appendTelemetryLog(`Escrow Locked: ${formatCurrency(convertMinor(costNgnMinor, selectedCurrency), selectedCurrency)} secured for ${selectedTeacherForBooking.name}`);
        }
        await fetchInitialData();
      } else {
        const errData = await response.json();
        toast.error(`Booking failed: ${errData.error}`);
      }
    } catch (err) {
      console.error("Booking API error:", err);
      if (paymentMethod === 'paystack') {
        toast.error(`Payment initialization failed: ${err.message || "Please check your connection."}`);
        return;
      }
      // Fallback local operation
      setWalletBalance(prev => prev - costNgnMinor);
      setEscrowBalance(prev => prev + costNgnMinor);
      
      const newSessions = slots.map(slot => ({
        teacherId: selectedTeacherForBooking.id,
        teacherName: selectedTeacherForBooking.name,
        avatar: selectedTeacherForBooking.avatar,
        subject: `${options.subject || selectedTeacherForBooking.subjects[0] || 'General'} Class (${options.curriculum || 'Standard'})`,
        studentName: activeStudentName,
        studentId: activeStudentId,
        slot: slot,
        cost: Math.floor(costNgnMinor / slots.length),
        status: "Scheduled"
      }));
      setBookedSessions(prev => [...prev, ...newSessions]);
      appendTelemetryLog(`Escrow Locked (Local Fallback): ${formatCurrency(convertMinor(costNgnMinor, selectedCurrency), selectedCurrency)} secured for ${selectedTeacherForBooking.name} (${slots.length} sessions)`);
    }
  };

  // Grading sync
  const handleGradeHomework = async (newGrade) => {
    try {
      const response = await fetch(`${API_BASE}/assignments/grade`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: newGrade.id,
          score: newGrade.score,
          feedback: newGrade.feedback
        })
      });
      if (response.ok) {
        await fetchInitialData();
      }
    } catch (err) {
      console.error("Grading API error:", err);
      setGradesLog(prev => [newGrade, ...prev]);
    }
  };

  // Wallet topup sync
  const handleTopupWallet = async (amountMinor, method = 'bank', currency = 'NGN') => {
    // 1. Convert amount to NGN minor units for local tracking/fallback
    let amountNgnMinor = amountMinor;
    if (currency !== 'NGN') {
      const rateKey = `NGN_${currency}`;
      const rate = exchangeRates[rateKey] || 1;
      amountNgnMinor = Math.round(amountMinor / rate);
    }

    try {
      if (method === 'paystack') {
        const provider = 'paystack';
        const checkoutRes = await fetch(`${API_BASE}/payments/checkout`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            parentId: currentUser ? currentUser.uid : 'parent_1',
            amount: amountMinor, // Pass amount in selected currency minor units
            currency: currency, // Pass selected currency
            provider,
            paymentType: 'wallet_topup',
            amountNgnMinor: amountNgnMinor // Pass converted NGN minor units in metadata
          })
        });
        if (checkoutRes.ok) {
          const data = await checkoutRes.json();
          appendTelemetryLog(`Initiating ${provider} topup checkout for ${formatCurrency(amountMinor, currency)}`);
          window.location.href = data.checkoutUrl;
          return { redirect: true };
        } else {
          const errData = await checkoutRes.json().catch(() => ({}));
          console.error("Top-up checkout initiation failed:", errData);
          toast.error(`Top-up failed: ${errData.error || "Payment gateway error"}`);
          if (checkoutRes.status === 401 || checkoutRes.status === 403 || (errData.error && errData.error.toLowerCase().includes("token"))) {
            logout();
          }
          return false;
        }
      }

      const response = await fetch(`${API_BASE}/parents/wallet/topup`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          parentId: currentUser ? currentUser.uid : 'parent_1',
          amount: amountNgnMinor,
          method
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'pending') {
          return { pending: true, message: data.message };
        }
        setWalletBalance(data.walletBalance);
        setEscrowBalance(data.escrowBalance);
        await fetchInitialData();
        appendTelemetryLog(`Wallet Topup: Success adding ${formatCurrency(amountMinor, currency)} (${formatCurrency(amountNgnMinor, 'NGN')}) to parent wallet.`);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Wallet topup API error:", err);
      if (method === 'paystack') {
        return false;
      }
      setWalletBalance(prev => prev + amountNgnMinor);
      appendTelemetryLog(`Wallet Topup (Local Fallback): Success adding ${formatCurrency(amountMinor, currency)} (${formatCurrency(amountNgnMinor, 'NGN')}).`);
      return true;
    }
  };

  // Complete session escrow release logic
  const handleEndSession = async (session, ratingScore, commentText) => {
    const releaseCost = session.cost;
    try {
      const response = await fetch(`${API_BASE}/sessions/end`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sessionId: session.id,
          rating: ratingScore,
          comment: commentText
        })
      });

      if (response.ok) {
        await fetchInitialData();
        const commissionMinor = Math.round(releaseCost * 0.15);
        const payoutMinor = releaseCost - commissionMinor;
        appendTelemetryLog(`Escrow Released: ${formatCurrency(convertMinor(releaseCost, selectedCurrency), selectedCurrency)} settled. Commission: ${formatCurrency(convertMinor(commissionMinor, selectedCurrency), selectedCurrency)} (15% platform tier). Payout: ${formatCurrency(convertMinor(payoutMinor, selectedCurrency), selectedCurrency)} routed to ${session.teacherName} bank wallet.`);
      } else {
        const errData = await response.json();
        toast.error(`Failed to complete session: ${errData.error}`);
      }
    } catch (err) {
      console.error("End session API error:", err);
      // Fallback local operation
      setEscrowBalance(prev => Math.max(0, prev - releaseCost));
      
      const commissionMinor = Math.round(releaseCost * 0.15);
      const payoutMinor = releaseCost - commissionMinor;
      appendTelemetryLog(`Escrow Released (Local Fallback): ${formatCurrency(convertMinor(releaseCost, selectedCurrency), selectedCurrency)} settled.`);

      // Add review to the teacher
      setTeachers(prev => prev.map(t => {
        if (t.id === session.teacherId || t.uid === session.teacherId) {
          const updatedReviews = [...t.reviews, { parent: "Parent", text: commentText, score: ratingScore }];
          const newRating = parseFloat((updatedReviews.reduce((sum, r) => sum + r.score, 0) / updatedReviews.length).toFixed(1));
          return {
            ...t,
            reviews: updatedReviews,
            reviewsCount: t.reviewsCount + 1,
            rating: newRating
          };
        }
        return t;
      }));

      // Remove from scheduled sessions
      setBookedSessions(prev => prev.filter(s => !(s.teacherId === session.teacherId && s.slot.day === session.slot.day && s.slot.time === session.slot.time)));
    }
  };

  // Badge certified trigger from Academy module quiz correct submission
  const handleUnlockBadge = async (badgeName) => {
    try {
      const response = await fetch(`${API_BASE}/academy/submit-quiz`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: 'teacher_1',
          moduleId: 1,
          answer: 0
        })
      });

      if (response.ok) {
        await fetchInitialData();
        appendTelemetryLog(`Vetting Log: Teacher Adebayo Okafor earned 'AI-Certified' Badge. Platform placement priority boosted.`);
      }
    } catch (err) {
      console.error("Unlock badge API error:", err);
      // Fallback local operation
      setTeachers(prev => prev.map(t => {
        if ((t.id === 1 || t.uid === 'teacher_1') && !t.badges.includes(badgeName)) {
          return {
            ...t,
            badges: [...t.badges, badgeName]
          };
        }
        return t;
      }));
      appendTelemetryLog(`Vetting Log: Teacher Adebayo Okafor earned 'AI-Certified' Badge (Local Fallback).`);
    }
  };

  // Telemetry updates handler
  const [telemetryLogs, setTelemetryLogs] = useState([
    "Security check: standard biometric verification systems online.",
    "Database Sync: Paystack module ready."
  ]);
  const appendTelemetryLog = (logText) => {
    setTelemetryLogs(prev => [logText, ...prev]);
  };

  // Scroll header morph
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP hero entrances
  useLayoutEffect(() => {
    if (location.pathname !== '/') return;
    let ctx = gsap.context(() => {
      if (document.querySelector('.hero-fade')) {
        gsap.fromTo('.hero-fade',
          { y: 45, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.3, stagger: 0.12, ease: "power3.out" }
        );
      }
    });
    return () => ctx.revert();
  }, [location.pathname, currentUser]);

  // GSAP trust section scroll entrances
  useLayoutEffect(() => {
    if (location.pathname !== '/') return;
    let ctx = gsap.context(() => {
      if (document.querySelector('.trust-section')) {
        gsap.fromTo('.trust-fade',
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: '.trust-section',
              start: "top 80%",
              toggleActions: "play none none none"
            }
          }
        );
      }
    });
    return () => ctx.revert();
  }, [location.pathname, currentUser]);

  return (
    <div className="relative min-h-screen bg-brand-cream text-brand-charcoal overflow-x-hidden selection:bg-brand-clay selection:text-white">
      


      {/* Static Header Navbar */}
      <nav className="w-full bg-brand-charcoal text-white py-4 px-6 md:px-12 border-b border-brand-cream/10 z-50 relative">
        <div className="flex items-center justify-between">
          <div 
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigate('/');
            }}
            className="cursor-pointer select-none"
          >
            <BrandLogo light={true} className="h-11 md:h-12 lg:h-13 transition-transform duration-300 hover:scale-105" />
          </div>
          
          <div className="hidden lg:flex items-center gap-6 font-sans font-semibold text-xs uppercase tracking-wider text-white/80">
            <Link to="/about" className="hover:text-brand-clay transition-colors hover-lift">About Us</Link>
            {currentUser?.role === 'Parent' && (
              <a href="#marketplace" onClick={scrollToSection('marketplace')} className="hover:text-brand-clay transition-colors hover-lift">{t('navFindTeachers')}</a>
            )}
            {currentUser?.role === 'Teacher' && (
              <a href="#academy" onClick={scrollToSection('academy')} className="hover:text-brand-clay transition-colors hover-lift">{t('navAcademy')}</a>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop selectors (hidden on mobile/tablet) */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Multilingual Selector */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/65">
                  Lang:
                </span>
                <div className="flex items-center bg-black/15 border border-white/10 rounded-full p-1 select-none">
                  {[
                    { code: 'en', label: 'EN' },
                    { code: 'fr', label: 'FR' },
                    { code: 'sw', label: 'SW' }
                  ].map(item => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setLang(item.code)}
                      className={`py-1 px-2.5 rounded-full font-mono text-[9px] font-bold tracking-wider transition-all duration-300 ${
                        lang === item.code
                          ? 'bg-brand-cream text-brand-moss shadow-sm'
                          : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-currency Selector */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/65">
                  {t('chooseCurrency')}
                </span>
                <div className="flex items-center bg-black/15 border border-white/10 rounded-full p-1 select-none">
                  {['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'CAD'].map(curr => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setSelectedCurrency(curr)}
                      className={`py-1 px-2.5 rounded-full font-mono text-[9px] font-bold tracking-wider transition-all duration-300 ${
                        selectedCurrency === curr
                          ? 'bg-brand-cream text-brand-moss shadow-sm'
                          : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-3">
                {/* Notification Bell Icon */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                    className="p-2 rounded-full relative transition-colors text-white hover:bg-white/10"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-clay rounded-full border border-white animate-pulse" />
                    )}
                  </button>
                  
                  {/* Notifications Dropdown */}
                  {showNotificationsDropdown && (
                    <div className="absolute right-0 mt-3 w-80 bg-white border border-brand-moss/10 rounded-[1.5rem] p-4 shadow-xl z-50 animate-fade-in text-brand-charcoal">
                      <div className="flex justify-between items-center border-b border-brand-moss/5 pb-2 mb-3">
                        <span className="font-heading font-bold text-xs text-brand-moss">Notifications</span>
                        {notifications.filter(n => !n.read).length > 0 && (
                          <button 
                            onClick={handleMarkAllNotificationsRead}
                            className="font-mono text-[9px] uppercase tracking-wider text-brand-clay font-bold hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                        {notifications.length === 0 ? (
                          <div className="text-center font-sans text-brand-charcoal/40 text-[10px] py-6">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              onClick={() => handleMarkNotificationRead(notif.id)}
                              className="p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer hover:bg-brand-cream/20 bg-brand-moss/5 border-brand-moss/10 hover:border-brand-moss/20 font-medium"
                            >
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <span className="font-heading text-2xs text-brand-moss font-bold">{notif.title}</span>
                                <span className="font-mono text-[8px] text-brand-charcoal/40 uppercase">
                                  {notif.type.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="font-sans text-[10px] text-brand-charcoal/80 leading-relaxed">
                                {notif.body}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-[10px] font-bold text-white">
                    {currentUser.displayName}
                  </span>
                  <span className="text-[8px] font-mono opacity-70 uppercase tracking-widest text-brand-clay">
                    {currentUser.role}
                  </span>
                </div>

                {currentUser.role === 'Teacher' && (
                  <a 
                    href="#academy" 
                    className="hidden lg:flex btn-magnetic bg-brand-clay hover:bg-brand-clay/90 text-white font-sans text-[10px] uppercase tracking-wider font-bold py-2 px-4 rounded-full items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    Academy Enrollment
                  </a>
                )}

                {location.pathname.startsWith('/dashboard') ? (
                  <button
                    onClick={handleBackToHome}
                    className="hidden lg:inline-block btn-magnetic font-sans text-[10px] uppercase tracking-wider font-bold py-2 px-4 rounded-full border border-white text-white hover:bg-white hover:text-brand-charcoal"
                  >
                    Back to Home
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="hidden lg:inline-block btn-magnetic font-sans text-[10px] uppercase tracking-wider font-bold py-2 px-4 rounded-full bg-brand-clay text-white hover:bg-brand-clay/90"
                  >
                    Go to Dashboard
                  </button>
                )}
                <button
                  onClick={async () => {
                    try {
                      await auth.signOut();
                    } catch (e) {
                      console.warn("Failed to sign out of Firebase:", e);
                    }
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="hidden lg:inline-block btn-magnetic font-sans text-[10px] uppercase tracking-wider font-bold py-2 px-4 rounded-full border bg-brand-cream border-brand-cream text-brand-moss hover:bg-brand-clay hover:border-brand-clay hover:text-white"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <button
                  onClick={() => {
                    setAuthTab('login');
                    setIsAuthOpen(true);
                  }}
                  className="btn-magnetic font-sans text-[10px] uppercase tracking-wider font-bold py-2 px-4 rounded-full border border-white/20 text-white hover:bg-white/10"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setAuthTab('register');
                    setIsAuthOpen(true);
                  }}
                  className="btn-magnetic font-sans text-[10px] uppercase tracking-wider font-bold py-2 px-4 rounded-full bg-brand-clay text-white hover:bg-brand-clay/90"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Hamburger menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-full text-white hover:bg-white/10 transition-colors z-50 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <div className="flex flex-col gap-1.5 w-5 h-5 justify-center items-end">
                  <span className="w-5 h-0.5 bg-white rounded-full"></span>
                  <span className="w-4 h-0.5 bg-white rounded-full"></span>
                  <span className="w-3.5 h-0.5 bg-white rounded-full"></span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-white/10 flex flex-col gap-4 animate-slide-down">
            {/* Lang & Currency selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/50">Language</span>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="w-full bg-brand-charcoal border border-white/15 rounded-xl py-2 px-3 text-xs font-bold text-white outline-none cursor-pointer"
                >
                  <option value="en" className="text-white bg-brand-charcoal">EN (English)</option>
                  <option value="fr" className="text-white bg-brand-charcoal">FR (French)</option>
                  <option value="sw" className="text-white bg-brand-charcoal">SW (Swahili)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/50">Currency</span>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full bg-brand-charcoal border border-white/15 rounded-xl py-2 px-3 text-xs font-bold text-white outline-none cursor-pointer"
                >
                  {['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'CAD'].map(curr => (
                    <option key={curr} value={curr} className="text-white bg-brand-charcoal">{curr}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile Nav Links */}
            {currentUser && (
              <div className="flex flex-col gap-2.5 font-sans font-bold text-xs uppercase tracking-wider text-white/80 border-t border-white/5 pt-3">
                {currentUser.role === 'Parent' && (
                  <a 
                    href="#marketplace" 
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      const el = document.getElementById('marketplace');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }} 
                    className="hover:text-brand-clay transition-colors py-1"
                  >
                    {t('navFindTeachers')}
                  </a>
                )}
                {currentUser.role === 'Teacher' && (
                  <a 
                    href="#academy" 
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      const el = document.getElementById('academy');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }} 
                    className="hover:text-brand-clay transition-colors py-1"
                  >
                    {t('navAcademy')}
                  </a>
                )}
              </div>
            )}

            {/* Profile & Action items */}
            <div className="flex flex-col gap-2.5 border-t border-white/5 pt-3">
              {currentUser ? (
                <>
                  <div className="bg-white/5 rounded-2xl p-3 flex flex-col">
                    <span className="text-xs font-bold text-white">
                      {currentUser.displayName}
                    </span>
                    <span className="text-[9px] font-mono opacity-70 uppercase tracking-widest text-brand-clay mt-0.5">
                      {currentUser.role}
                    </span>
                  </div>

                  {currentUser.role === 'Teacher' && (
                    <a 
                      href="#academy" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="bg-brand-clay hover:bg-brand-clay/90 text-white font-sans text-xs uppercase tracking-wider font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 text-center"
                    >
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      Academy Enrollment
                    </a>
                  )}

                  {location.pathname.startsWith('/dashboard') ? (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleBackToHome();
                      }}
                      className="w-full font-sans text-xs uppercase tracking-wider font-bold py-3 px-4 rounded-xl border border-white text-white hover:bg-white hover:text-brand-charcoal text-center"
                    >
                      Back to Home
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate('/dashboard');
                      }}
                      className="w-full font-sans text-xs uppercase tracking-wider font-bold py-3 px-4 rounded-xl bg-brand-clay text-white hover:bg-brand-clay/90 text-center"
                    >
                      Go to Dashboard
                    </button>
                  )}
                  
                  <button
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      try {
                        await auth.signOut();
                      } catch (e) {
                        console.warn("Failed to sign out of Firebase:", e);
                      }
                      logout();
                    }}
                    className="w-full font-sans text-xs uppercase tracking-wider font-bold py-3 px-4 rounded-xl bg-white text-brand-moss hover:bg-brand-clay hover:text-white text-center"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setAuthTab('login');
                      setIsAuthOpen(true);
                    }}
                    className="font-sans text-xs uppercase tracking-wider font-bold py-3 px-4 rounded-xl border border-white/20 text-white hover:bg-white/10 text-center"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setAuthTab('register');
                      setIsAuthOpen(true);
                    }}
                    className="font-sans text-xs uppercase tracking-wider font-bold py-3 px-4 rounded-xl bg-brand-clay text-white hover:bg-brand-clay/90 text-center"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 w-full relative">
        <Routes>
          <Route path="/about" element={<AboutUs />} />
          <Route path="/" element={
            <Home 
                t={t}
                scrollToSection={scrollToSection}
                teachers={teachers}
                hasMoreTeachers={hasMoreTeachers}
                loadFilteredTeachers={loadFilteredTeachers}
                teachersPage={teachersPage}
              selectedCurrency={selectedCurrency}
              handleBookClick={handleBookClick}
              formatCurrency={formatCurrency}
              convertMinor={convertMinor}
              handleTutorProfileSelect={handleTutorProfileSelect}
              watchingTeacherVideo={watchingTeacherVideo}
              setWatchingTeacherVideo={setWatchingTeacherVideo}
              bookedSessions={bookedSessions}
              handleEndSession={handleEndSession}
              escrowBalance={escrowBalance}
              currentUser={currentUser}
              handleUnlockBadge={handleUnlockBadge}
              setAuthTab={setAuthTab}
              setIsAuthOpen={setIsAuthOpen}
              waitlistName={waitlistName}
              setWaitlistName={setWaitlistName}
              waitlistEmail={waitlistEmail}
              setWaitlistEmail={setWaitlistEmail}
              waitlistRole={waitlistRole}
              setWaitlistRole={setWaitlistRole}
              handleWaitlistSubmit={handleWaitlistSubmit}
              waitlistStatus={waitlistStatus}
              openFaqIdx={openFaqIdx}
              setOpenFaqIdx={setOpenFaqIdx}
            />
          } />

          <Route path="/teacher" element={
            <Suspense fallback={<LoadingFallback />}>
              <TeacherPublicProfile 
                username={profileUsername}
                onBack={handleBackToHome}
                onBookClick={handleBookClick}
                selectedCurrency={selectedCurrency}
                formatCurrency={formatCurrency}
                convertMinor={convertMinor}
                bookedSessions={bookedSessions}
              />
            </Suspense>
          } />

          <Route path="/dashboard" element={
            currentUser ? (
              isTutorOnboarding ? (
                <Suspense fallback={<LoadingFallback />}>
                  <TeacherOnboarding 
                    currentUser={currentUser}
                    onComplete={(profile) => {
                      setIsTutorOnboarding(false);
                      fetchInitialData();
                      toast.success("Your application is pending verification on the platform. Please check your email for updates.");
                    }}
                    onBack={() => navigate('/')}
                  />
                </Suspense>
              ) : (
                <div className="py-6 min-h-[75vh]">
                  <Suspense fallback={<LoadingFallback />}>
                    {currentUser.role === 'Admin' ? (
                      <AdminDashboard
                        currentUser={currentUser}
                        selectedCurrency={selectedCurrency}
                        formatCurrency={formatCurrency}
                        convertMinor={convertMinor}
                        onBack={() => navigate('/')}
                      />
                    ) : currentUser.role === 'Teacher' ? (
                      <TeacherDashboard
                        currentUser={currentUser}
                        selectedCurrency={selectedCurrency}
                        formatCurrency={formatCurrency}
                        convertMinor={convertMinor}
                        onOpenChat={handleOpenChat}
                        onGradeHomework={handleGradeHomework}
                        gradesLog={gradesLog}
                        onBack={() => navigate('/')}
                      />
                    ) : currentUser.role === 'Student' ? (
                      <StudentPortal
                        currentUser={currentUser}
                        selectedCurrency={selectedCurrency}
                        formatCurrency={formatCurrency}
                        convertMinor={convertMinor}
                        onBack={() => navigate('/')}
                      />
                    ) : (
                      <ParentDashboard 
                          currentUser={currentUser}
                          lang={lang}
                          t={t}
                          selectedCurrency={selectedCurrency}
                          formatCurrency={formatCurrency}
                          teachers={teachers}
                          hasMoreTeachers={hasMoreTeachers}
                          loadFilteredTeachers={loadFilteredTeachers}
                          teachersPage={teachersPage}
                        convertMinor={convertMinor}
                        gradesLog={gradesLog}
                        onGradeHomework={handleGradeHomework}
                        walletBalance={walletBalance}
                        escrowBalance={escrowBalance}
                        bookedSessions={bookedSessions}
                        onOpenChat={handleOpenChat}
                        pendingAssignments={pendingAssignments}
                        onTopupWallet={handleTopupWallet}
                        teachers={teachers}
                        onBookClick={handleBookClick}
                        onTeacherSelect={handleTutorProfileSelect}
                        onBack={() => navigate('/')}
                      />
                    )}
                  </Suspense>
                </div>
              )
            ) : null
          } />
        </Routes>
      </main>

      {/* Universal Footer */}
      <footer className={`bg-brand-charcoal text-brand-cream pt-24 pb-12 rounded-t-[4rem] border-t border-brand-cream/10 ${currentUser && location.pathname.startsWith('/dashboard') ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-4">
            <BrandLogo light={true} className="h-11 md:h-12 lg:h-13 transition-transform duration-300 hover:scale-105" />
            <p className="font-sans text-xs text-brand-cream/60 leading-relaxed">
              Africa's Best Teachers. The World's Best Students. Connecting local educators with international tutoring standards.
            </p>
            <div className="pt-2 font-mono text-[11px] text-brand-cream/70 flex items-center gap-1.5">
              <span>💬 WhatsApp:</span>
              <a href="https://wa.me/2348136451607" target="_blank" rel="noopener noreferrer" className="text-brand-clay hover:underline font-bold">+234 813 645 1607</a>
            </div>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold text-xs text-brand-clay mb-4 uppercase tracking-widest">Products</h4>
            <ul className="space-y-2.5 font-sans text-xs text-brand-cream/70">
              <li><a href="#marketplace" onClick={scrollToSection('marketplace')} className="hover:text-brand-clay transition-colors block">Find Teachers</a></li>
              <li><a href="#academy" onClick={scrollToSection('academy')} className="hover:text-brand-clay transition-colors block">ELITE TEACHERS ACADEMY</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold text-xs text-brand-clay mb-4 uppercase tracking-widest">Security</h4>
            <ul className="space-y-2.5 font-sans text-xs text-brand-cream/70">
              <li><span className="block text-brand-cream/70">Secure Escrows</span></li>
              <li><span className="block text-brand-cream/70">Biometric Verification</span></li>
              <li>
                <button 
                  onClick={() => setIsPrivacyOpen(true)} 
                  className="hover:text-brand-clay text-left transition-colors block text-brand-cream/70 font-semibold"
                >
                  GDPR, NDPR & Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-xs text-brand-clay mb-4 uppercase tracking-widest text-[10px]">Curriculums</h4>
            <ul className="space-y-2.5 font-sans text-xs text-brand-cream/70">
              <li><span className="block text-brand-cream/70">WAEC / JAMB prep</span></li>
              <li><span className="block text-brand-cream/70">Cambridge IGCSE</span></li>
              <li><span className="block text-brand-cream/70">IB Diploma Prep</span></li>
              <li><span className="block text-brand-cream/70">Adult Education</span></li>
            </ul>
          </div>
        </div>

        <div className="h-px bg-brand-cream/10 max-w-7xl mx-auto my-8 px-6" />

        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 bg-brand-moss/20 border border-brand-moss/30 rounded-full px-5 py-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-[ping_2s_linear_infinite]"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-brand-cream/80">
              SYSTEM ACTIVE // ESCROW PROTECTED // SECURED BY GEMINI AI
            </span>
          </div>
          
          <div className="flex gap-6 font-sans text-[11px] text-brand-cream/50">
            <span>© 2026 EduVista Africa. A product of Zeerocodes Automation Limited. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Interactive Booking Modal */}
      <Suspense fallback={<ModalLoadingFallback />}>
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          teacher={selectedTeacherForBooking}
          selectedCurrency={selectedCurrency}
          walletBalance={walletBalance}
          onBook={handleBookingConfirm}
          formatCurrency={formatCurrency}
          convertMinor={convertMinor}
          bookedSessions={bookedSessions}
          preselectedSlots={bookingPreselectedSlots}
        />
      </Suspense>

      <Suspense fallback={<ModalLoadingFallback />}>
        <AuthModal 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
        />
      </Suspense>

      <Suspense fallback={<ModalLoadingFallback />}>
        <ChatPanel 
          isOpen={isChatOpen} 
          onClose={() => {
            setIsChatOpen(false);
            setSelectedChatSession(null);
          }} 
          session={selectedChatSession} 
          currentUser={currentUser} 
        />
      </Suspense>

      <Suspense fallback={<ModalLoadingFallback />}>
        <PrivacyModal 
          isOpen={isPrivacyOpen} 
          onClose={() => setIsPrivacyOpen(false)} 
        />
      </Suspense>

      {/* Real-time Toast Notifications */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-[100] bg-brand-moss border border-brand-moss/10 rounded-2xl p-5 shadow-2xl flex gap-3 text-white max-w-sm animate-slide-up">
          <div className="w-8 h-8 rounded-full bg-brand-cream/15 border border-brand-cream/20 flex items-center justify-center text-brand-clay shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-brand-cream/50 block mb-1">
              New Notification
            </span>
            <h5 className="font-heading font-bold text-xs text-white mb-1">
              {activeToast.title}
            </h5>
            <p className="font-sans text-[10px] text-brand-cream/80 leading-relaxed">
              {activeToast.body}
            </p>
          </div>
        </div>
      )}

      {/* Floating Support Agent Button */}
      <button
        onClick={() => setIsSupportOpen(true)}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white flex items-center justify-center shadow-lg shadow-brand-clay/20 transition-all duration-300 scale-100 hover:scale-110 active:scale-95"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Support Chat Panel */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-2xs" onClick={() => setIsSupportOpen(false)} />
          
          {/* Support Panel Container */}
          <div className="relative w-full max-w-md bg-brand-cream border-l border-brand-moss/10 h-full flex flex-col justify-between shadow-2xl z-10 animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-brand-moss/10 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-moss/5 border border-brand-moss/10 flex items-center justify-center text-brand-moss">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-brand-moss text-base">{t('supportTitle')}</h3>
                  <span className="font-sans text-[10px] text-brand-charcoal/50 block uppercase tracking-wide">
                    {t('supportSub')}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsSupportOpen(false)} className="text-brand-moss/60 hover:text-brand-moss">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Support Message history */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-brand-cream/40">
              {supportMessages.map((msg, idx) => {
                const isMe = msg.sender === 'user';
                return (
                  <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="font-mono text-[9px] text-brand-charcoal/40 mb-1">{isMe ? 'You' : 'EB Advisor'}</span>
                    <div className={`p-4 rounded-[1.5rem] max-w-[85%] font-sans text-xs leading-relaxed shadow-xs ${
                      isMe 
                        ? 'bg-brand-clay text-white rounded-tr-none'
                        : 'bg-white text-brand-charcoal border border-brand-moss/10 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              {supportLoading && (
                <div className="flex flex-col items-start">
                  <span className="font-mono text-[9px] text-brand-charcoal/40 mb-1">EB Advisor</span>
                  <div className="p-4 bg-white text-brand-charcoal border border-brand-moss/10 rounded-[1.5rem] rounded-tl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-clay animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-clay animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-clay animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input field */}
            <form onSubmit={handleSendSupportMessage} className="p-4 border-t border-brand-moss/10 bg-white flex items-center gap-3">
              <input
                type="text"
                placeholder={t('supportPlaceholder')}
                value={supportInput}
                onChange={(e) => setSupportInput(e.target.value)}
                className="flex-1 bg-brand-cream/50 border border-brand-moss/15 rounded-full px-5 py-3 font-sans text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
              />
              <button
                type="submit"
                disabled={!supportInput.trim() || supportLoading}
                className="w-10 h-10 rounded-full bg-brand-moss hover:bg-brand-clay text-white flex items-center justify-center shrink-0 shadow-md transition-colors disabled:opacity-40"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {watchingTeacherVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-brand-charcoal/80 backdrop-blur-md transition-opacity" 
            onClick={() => setWatchingTeacherVideo(null)} 
          />
          
          {/* Video Container */}
          <div className="relative bg-white border border-brand-moss/10 rounded-[2.5rem] w-full max-w-3xl overflow-hidden shadow-2xl z-10 animate-slide-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-brand-moss/5 flex justify-between items-center bg-brand-cream/20">
              <div>
                <h3 className="font-heading font-bold text-lg text-brand-moss">{watchingTeacherVideo.name}</h3>
                <span className="font-sans text-xs text-brand-clay font-medium italic">Intro Video Lesson Profile</span>
              </div>
              <button 
                onClick={() => setWatchingTeacherVideo(null)} 
                className="w-10 h-10 rounded-full border border-brand-moss/10 bg-white hover:bg-brand-cream flex items-center justify-center text-brand-moss transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Body */}
            <div className="aspect-video w-full bg-black relative">
              {watchingTeacherVideo.videoUrl.includes('youtube.com') || watchingTeacherVideo.videoUrl.includes('youtu.be') ? (
                <iframe 
                  className="w-full h-full"
                  src={watchingTeacherVideo.videoUrl.replace('watch?v=', 'embed/')} 
                  title="Teacher Intro Video"
                  frameBorder="0" 
                  allowFullScreen
                />
              ) : (
                <video 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain"
                  src={watchingTeacherVideo.videoUrl}
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>

            {/* Modal Footer / Bio excerpt */}
            <div className="p-6 bg-brand-cream/10 border-t border-brand-moss/5 space-y-4">
              <p className="font-sans text-brand-charcoal/80 text-xs leading-relaxed">
                "{watchingTeacherVideo.bio}"
              </p>
              <div className="flex justify-end items-center">
                <button
                  onClick={() => {
                    const tutor = watchingTeacherVideo;
                    setWatchingTeacherVideo(null);
                    handleBookClick(tutor);
                  }}
                  className="py-2.5 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/95 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md shadow-brand-clay/10 transition-transform scale-100 hover:scale-103"
                >
                  Book Trial Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        session={selectedChatSession}
        currentUser={currentUser}
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-up {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

    </div>
  );
}
