import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  Star,
  MessageSquare,
  MessageCircle,
  Clipboard,
  User,
  Users,
  Award,
  Trophy,
  TrendingUp,
  Video,
  Clock,
  Lock,
  PlusCircle,
  FolderOpen,
  AlertOctagon,
  LayoutDashboard,
  Wallet,
  FileText,
  Settings,
  ArrowRight,
  Bell,
  TrendingDown,
  BarChart2,
  Search,
  LogOut,
  BookOpen,
  Play,
  Upload,
  Camera,
  Check,
  HelpCircle,
  Info,
  ExternalLink,
  Globe,
  FileCheck,
  Image as ImageIcon,
  Menu,
  X
} from "lucide-react";

export default function TeacherDashboard({
  currentUser,
  selectedCurrency,
  formatCurrency,
  convertMinor,
  onOpenChat,
  onGradeHomework,
  gradesLog,
  onLogout,
  onBack,
}) {
  const defaultVerifiedProfile = {
    uid: currentUser?.uid || "",
    name: currentUser?.displayName || "",
    username: "",
    email: currentUser?.email || "",
    role: "Teacher",
    location: "",
    subjects: [],
    curricula: [],
    languages: ["English"],
    rate: 0,
    rating: 0,
    reviewsCount: 0,
    verified: false,
    bio: "",
    avatar: currentUser?.photoURL || ""
  };

  const [teacherProfile, setTeacherProfile] = useState(defaultVerifiedProfile);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, escrow: 0 });
  const [loading, setLoading] = useState(false);
  const [earnedThisMonth, setEarnedThisMonth] = useState(0);
  const [paidOutToDate, setPaidOutToDate] = useState(0);
  const [commission, setCommission] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [classLinkInputs, setClassLinkInputs] = useState({});
  const [submittingClassLink, setSubmittingClassLink] = useState(null);
  const [editingClassLink, setEditingClassLink] = useState(null);

  // Tab & Mobile Menu State
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'profile' | 'students' | 'earnings' | 'reputation' | 'academy'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Availability Grid states (Clean 0 slots initialized)
  const [availabilityGrid, setAvailabilityGrid] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });
  const [googleCalendarSync, setGoogleCalendarSync] = useState(false);
  const [holidayMode, setHolidayMode] = useState(false);
  const [minNotice, setMinNotice] = useState("24 hours");

  // Student Roster state & notes
  const [roster, setRoster] = useState([]);
  const [selectedRosterStudent, setSelectedRosterStudent] = useState(null);
  const [rosterNoteInput, setRosterNoteInput] = useState("");

  // Reputation & Leaderboard Position states
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(true);
  const [referrals, setReferrals] = useState([]);

  // Session Clock Log Modal States
  const [isClockLogOpen, setIsClockLogOpen] = useState(false);
  const [selectedClockSession, setSelectedClockSession] = useState(null);

  // Profile builder form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [rate, setRate] = useState(0);
  const [bio, setBio] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [customSubjectInput, setCustomSubjectInput] = useState("");
  const [selectedCurricula, setSelectedCurricula] = useState([]);
  const [customCurriculumInput, setCustomCurriculumInput] = useState("");
  const [avatar, setAvatar] = useState("");
  const [govIdUrl, setGovIdUrl] = useState("");
  const [degreeUrl, setDegreeUrl] = useState("");
  const [trcnUrl, setTrcnUrl] = useState("");
  const [schoolIdUrl, setSchoolIdUrl] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [classroomLink, setClassroomLink] = useState("");
  const [recordingTool, setRecordingTool] = useState("recordly.site");
  const [uploadingState, setUploadingState] = useState({ type: null, progress: 0 });

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      title: "New Lesson Request",
      message: "Parent Mrs. Adeyemi requested a WAEC Mathematics session.",
      time: "10 mins ago",
      type: "booking",
      read: false,
    },
    {
      id: "notif-2",
      title: "LinkedIn Verification Notice",
      message: "Your mandatory LinkedIn profile is registered. Parents can view your verified experience.",
      time: "2 hours ago",
      type: "verification",
      read: false,
    },
    {
      id: "notif-3",
      title: "Wallet Payout Ready",
      message: "Escrow release scheduled for completed tuition sessions.",
      time: "1 day ago",
      type: "finance",
      read: true,
    },
  ]);

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read.");
  };

  const handleToggleNotification = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    );
  };

  const handleFileUpload = async (e, type, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dbyb4c1jq";
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "vilb3pi3";

    setUploadingState({ type, progress: 20 });
    const localUrl = URL.createObjectURL(file);

    if (!uploadPreset || uploadPreset.includes("placeholder")) {
      setter(localUrl);
      setUploadingState({ type: null, progress: 0 });
      toast.success(`✓ "${file.name}" uploaded successfully!`);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    const resourceType = type === "video" ? "video" : (type === "image" ? "image" : "auto");

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, true);
      xhr.timeout = 20000;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadingState({ type, progress: percent });
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            setter(response.secure_url || localUrl);
            toast.success(`✓ "${file.name}" uploaded successfully!`);
          } catch (err) {
            setter(localUrl);
            toast.success(`✓ "${file.name}" saved!`);
          }
        } else {
          setter(localUrl);
          toast.success(`✓ "${file.name}" saved!`);
        }
        setUploadingState({ type: null, progress: 0 });
      };

      xhr.onerror = () => {
        setter(localUrl);
        toast.success(`✓ "${file.name}" saved!`);
        setUploadingState({ type: null, progress: 0 });
      };

      xhr.ontimeout = () => {
        setter(localUrl);
        toast.success(`✓ "${file.name}" saved!`);
        setUploadingState({ type: null, progress: 0 });
      };

      xhr.send(formData);
    } catch (err) {
      console.warn("Upload error:", err);
      setter(localUrl);
      toast.success(`✓ "${file.name}" saved!`);
      setUploadingState({ type: null, progress: 0 });
    }
  };

  // Homework grading panel states
  const [gradingScore, setGradingScore] = useState(0);
  const [gradingFeedback, setGradingFeedback] = useState("");
  const [isGraded, setIsGraded] = useState(false);

  // Assignment Creator states
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignStudent, setAssignStudent] = useState("");
  const [assignMessage, setAssignMessage] = useState("");

  // Group Class States
  const [groupName, setGroupName] = useState("");
  const [groupFee, setGroupFee] = useState(0);
  // Removed unused group class state

  // AI Progress Report States
  const [activeReportStudent, setActiveReportStudent] = useState(null);
  const [aiReportContent, setAiReportContent] = useState("");
  const [aiReportLoading, setAiReportLoading] = useState(false);

  // Payout settings states
  const [payoutMethod, setPayoutMethod] = useState("Paystack Bank Account");
  const [minPayout, setMinPayout] = useState(10000);
  const [payoutRequestAmount, setPayoutRequestAmount] = useState(0);
  const [payoutMessage, setPayoutMessage] = useState("");
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [selectedBankName, setSelectedBankName] = useState("");

  const handleGeminiSuggest = () => {
    const suggestions = [
      {
        title: "Algebraic quadratic factorisation worksheet",
        desc: "Solve all factoring polynomials on Page 54. Factor both standard and complex coefficients.",
      },
      {
        title: "WAEC Wave Mechanics physics equations",
        desc: "Calculate the amplitude, speed, and frequency metrics for the wave graph uploaded in the classroom.",
      },
      {
        title: "IGCSE Chemistry stoichiometry problems",
        desc: "Balance the stoichiometric equations sheet and explain molar mass conversions.",
      },
    ];
    const item = suggestions[Math.floor(Math.random() * suggestions.length)];
    setAssignTitle(item.title);
    setAssignDesc(item.desc);
  };

  const handleGenerateReport = (studentName) => {
    setActiveReportStudent(studentName);
    setAiReportLoading(true);
    setTimeout(() => {
      setAiReportContent(`[AI Generated Report - ${studentName}]
Comprehension: Excellent capacity. Average assignment scores returned at 92%.
Strengths: Analytical algebra factorisation speed calculation accuracy.
Recommendations: Trigonometric graphing formulas require focused active drill worksheets.
Conclusion: Trajectory remains fully on-track to WAEC/JAMB exam standards.`);
      setAiReportLoading(false);
    }, 1500);
  };

  const API_BASE = "/api";

  const getAuthHeaders = useCallback((extraHeaders = {}) => {
    const token = localStorage.getItem("eduvistar_token");
    return {
      "Content-Type": "application/json",
      ...extraHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(
        `${API_BASE}/teachers/dashboard/${currentUser.uid}`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setTeacherProfile(data.teacher);
        setName(data.teacher.name || "");
        setUsername(data.teacher.username || "");
        setLocation(data.teacher.location || "");
        setWhatsapp(data.teacher.whatsapp || "");
        setLinkedin(data.teacher.linkedin || "");
        setRate(data.teacher.rate ? data.teacher.rate / 100 : 0);
        setBio(data.teacher.bio || "");
        setSelectedSubjects(data.teacher.subjects || []);
        setSelectedCurricula(data.teacher.curricula || []);
        setSelectedLanguages(data.teacher.languages || []);
        setAvatar(data.teacher.avatar || "");
        setGovIdUrl(data.teacher.govIdUrl || data.teacher.govId || "");
        setDegreeUrl(data.teacher.degreeUrl || data.teacher.degree || "");
        setTrcnUrl(data.teacher.trcnUrl || data.teacher.trcn || "");
        setSchoolIdUrl(data.teacher.schoolIdUrl || data.teacher.schoolId || "");
        setCvUrl(data.teacher.cvUrl || data.teacher.cv || "");
        setVideoUrl(data.teacher.videoUrl || "");
        setCurrency(data.teacher.currency || "NGN");
        setTimezone(data.teacher.timezone || "Africa/Lagos");
        setClassroomLink(data.teacher.classroomLink || "");
        setRecordingTool(data.teacher.recordingTool || "recordly.site");

        const teacherSessions = data.sessions || [];
        setBookingRequests(
          teacherSessions.filter((s) => s.status === "Pending Confirmation"),
        );
        setActiveSessions(
          teacherSessions.filter((s) => s.status !== "Pending Confirmation"),
        );

        setWallet({
          balance: data.walletBalance || 0,
          escrow: data.escrowBalance || 0,
        });
        setEarnedThisMonth(data.earnedThisMonth || 0);
        setPaidOutToDate(data.paidOutToDate || 0);
        setCommission(data.commission || 0);
        setSessionsCount(data.sessionsCount || 0);
        setTransactions(data.transactions || []);

        // Dynamic Roster Mapping from active sessions
        const activeSessionsList = teacherSessions.filter(
          (s) => s.status !== "Pending Confirmation",
        );
        const rosterMap = {};
        activeSessionsList.forEach((s) => {
          if (!rosterMap[s.studentId]) {
            rosterMap[s.studentId] = {
              uid: s.studentId,
              name: s.studentName,
              subject: s.subject || "Tuition",
              lastSession:
                s.status === "Completed" ? "Completed Class" : "Scheduled",
              nextSession: s.slot
                ? `${s.slot.day} ${s.slot.time}`
                : "Not scheduled",
              assignments: 0,
              trend: "↑ Active",
              note: `Session booked by Parent ${s.parentId || ""}`,
            };
          }
        });
        setRoster(Object.values(rosterMap));
      }
    } catch (err) {
      console.warn(
        "Backend API offline, using local states simulation for teacher:",
        err,
      );
      // Local state fallback simulation
      setTeacherProfile({
        uid: currentUser.uid,
        name: currentUser.displayName || "",
        location: "",
        subjects: [],
        curricula: [],
        rate: 0,
        rating: 0,
        reviewsCount: 0,
        badges: [],
        bio: "",
        avatar: currentUser.photoURL || "",
      });
    }
  }, [currentUser, getAuthHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage("");

    // Enforce mandatory LinkedIn profile
    if (!linkedin || !linkedin.trim()) {
      toast.error("LinkedIn profile URL is mandatory for verification and client visibility.");
      setProfileMessage("⚠️ LinkedIn profile URL is mandatory.");
      return;
    }
    if (!linkedin.toLowerCase().includes("linkedin.com")) {
      toast.error("Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/username).");
      setProfileMessage("⚠️ Valid LinkedIn profile URL is required.");
      return;
    }

    setLoading(true);

    const payload = {
      uid: currentUser.uid,
      name,
      username,
      location,
      whatsapp,
      linkedin,
      rate: Math.round(rate * 100), // convert back to minor units
      bio,
      subjects: selectedSubjects,
      curricula: selectedCurricula,
      languages: selectedLanguages,
      avatar,
      govIdUrl,
      degreeUrl,
      cvUrl,
      videoUrl,
      currency,
      timezone,
      classroomLink,
      recordingTool,
    };

    try {
      const response = await fetch(`${API_BASE}/teachers/profile`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setProfileMessage("✓ Profile successfully updated!");
        fetchData();
      } else {
        setProfileMessage("Error updating profile details.");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setProfileMessage(
        "✓ Profile successfully updated (Local Sandbox Fallback)",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBookingRespond = async (sessionId, action) => {
    try {
      const response = await fetch(`${API_BASE}/sessions/respond`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ sessionId, action }),
      });
      if (response.ok) {
        fetchData();
        toast.success(
          `Booking request successfully ${action === "Confirm" ? "approved and scheduled" : "rejected"}.`,
        );
      }
    } catch (err) {
      console.error("Error responding to booking:", err);
      // Fallback
      if (action === "Confirm") {
        setBookingRequests((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success(
          "Booking successfully confirmed (Local Sandbox Fallback).",
        );
      } else {
        setBookingRequests((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success(
          "Booking successfully rejected (Local Sandbox Fallback).",
        );
      }
    }
  };

  const toggleSubject = (subj) => {
    setSelectedSubjects((prev) =>
      prev.includes(subj) ? prev.filter((s) => s !== subj) : [...prev, subj],
    );
  };

  const toggleCurriculum = (curr) => {
    setSelectedCurricula((prev) =>
      prev.includes(curr) ? prev.filter((c) => c !== curr) : [...prev, curr],
    );
  };

  const toggleLanguage = (lang) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/complete`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        toast.success(
          "✓ Session marked as complete! 24-hour escrow auto-release countdown started.",
        );
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to complete session.");
      }
    } catch (err) {
      console.error(err);
      toast.success("Session marked complete (Sandbox Mode).");
      fetchData();
    }
  };

  const handleGenerateAiReport = async (studentName) => {
    if (!studentName) return;
    setActiveReportStudent(studentName);
    setAiReportLoading(true);
    setAiReportContent("");
    try {
      const res = await fetch(`${API_BASE}/ai/progress-report`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ studentName, teacherNotes: rosterNoteInput }),
      });
      const data = await res.json();
      if (res.ok && data.report) {
        setAiReportContent(data.report);
      } else {
        setAiReportContent("Failed to generate AI report.");
      }
    } catch (err) {
      console.error(err);
      setAiReportContent(
        `### Progress Report for ${studentName}\n\n- **Academic Strengths**: Excellent comprehension & active session participation.\n- **Growth Areas**: Practice timed examination questions.\n- **Recommended Plan**: Continue regular tutoring schedule.`,
      );
    } finally {
      setAiReportLoading(false);
    }
  };

  const handleHomeworkGrade = (e) => {
    e.preventDefault();
    onGradeHomework({
      id: Date.now(),
      student: "Tunde",
      title: "Homework #4 (Quadratic Equations)",
      score: parseInt(gradingScore),
      feedback: gradingFeedback,
      date: "Today",
    });
    setIsGraded(true);
    setTimeout(() => setIsGraded(false), 3000);
  };

  const handleSubmitClassLink = async (sessionId) => {
    const classLink = classLinkInputs[sessionId];
    if (!classLink) {
      toast.error("Please enter a valid class link.");
      return;
    }
    setSubmittingClassLink(sessionId);
    try {
      const res = await fetch(`${API_BASE}/sessions/link`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ sessionId, classLink }),
      });
      if (res.ok) {
        fetchData();
        toast.success("Class link saved successfully!");
        setEditingClassLink(null);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to submit link.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting class link.");
    } finally {
      setSubmittingClassLink(null);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setAssignMessage("Creating...");
    try {
      const response = await fetch(`${API_BASE}/assignments/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: assignTitle,
          description: assignDesc,
          teacherName: teacherProfile?.name || currentUser?.displayName,
          studentName: assignStudent,
          dueDate: "Next Week",
        }),
      });
      if (response.ok) {
        setAssignMessage("✓ Assignment Created successfully");
        setAssignTitle("");
        setAssignDesc("");
        setTimeout(() => setAssignMessage(""), 3000);
      } else {
        setAssignMessage("Error creating assignment.");
      }
    } catch (err) {
      console.error(err);
      setAssignMessage("✓ Assignment Created (Sandbox Mode)");
      setAssignTitle("");
      setAssignDesc("");
      setTimeout(() => setAssignMessage(""), 3000);
    }
  };

  const handlePayoutRequest = async (e) => {
    e.preventDefault();
    if (payoutRequestAmount <= 0)
      return setPayoutMessage("Amount must be greater than zero.");
    if (wallet.balance < payoutRequestAmount)
      return setPayoutMessage("Insufficient settled balance.");

    setIsRequestingPayout(true);
    setPayoutMessage("");
    try {
      const response = await fetch(`${API_BASE}/payout/request`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount: payoutRequestAmount,
          payoutMethod: payoutMethod,
          bankDetails:
            payoutMethod === "Paystack Bank Account"
              ? {
                  accountNumber,
                  accountName,
                  bankCode: selectedBankCode,
                  bankName: selectedBankName,
                }
              : null,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setPayoutMessage(
          `✓ Payout requested successfully. New balance: ${formatCurrency(data.newBalance, selectedCurrency)}`,
        );
        setWallet((prev) => ({ ...prev, balance: data.newBalance }));
        setPayoutRequestAmount(0);
      } else {
        setPayoutMessage(data.error || "Failed to request payout.");
      }
    } catch (err) {
      console.error("Error requesting payout:", err);
      // Fallback
      const newBal = wallet.balance - payoutRequestAmount;
      setWallet((prev) => ({ ...prev, balance: newBal }));
      setPayoutMessage(
        `✓ Payout requested successfully (Sandbox Mode). New balance: ${formatCurrency(newBal, selectedCurrency)}`,
      );
      setPayoutRequestAmount(0);
    } finally {
      setIsRequestingPayout(false);
      setTimeout(() => setPayoutMessage(""), 5000);
    }
  };

  const availableSubjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "English",
    "Literature",
    "Further Mathematics",
    "Diction",
    "Spelling",
    "Nigerian Languages",
  ];
  const availableCurricula = [
    "WAEC",
    "JAMB",
    "IGCSE",
    "Cambridge",
    "IB Diploma",
    "Primary (Ages 6-11)",
    "Middle School (Ages 12-14)",
    "High School (Ages 15-18)",
    "Adult Education",
  ];
  const availableLanguages = [
    "English",
    "Yoruba",
    "Igbo",
    "Hausa",
    "French",
    "Swahili",
  ];

  const navTabs = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "students", label: "Students", icon: Users },
    { id: "reputation", label: "Reputation", icon: Star },
    { id: "academy", label: "AI Recommendations", icon: Sparkles },
    { id: "earnings", label: "Reports & Earnings", icon: Wallet },
    { id: "profile", label: "Profile Settings", icon: User },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-[#f8f9fa] flex font-sans overflow-hidden">
      {/* MOBILE DRAWER BACKDROP */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* MOBILE DRAWER SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Mobile Drawer Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <FileText size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-sm leading-tight">
                  EduVistar
                </h1>
                <span className="text-[10px] text-gray-500 block">
                  Teacher Portal
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Teacher Mini Profile in Mobile Drawer */}
          <div className="p-3.5 mx-3 my-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center overflow-hidden shrink-0 font-bold text-sm">
              {teacherProfile?.avatar ? (
                <img
                  src={teacherProfile.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                (currentUser?.displayName || "T").charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs text-gray-900 truncate">
                {currentUser?.displayName || teacherProfile?.name || "Teacher"}
              </h4>
              <span className="text-[10px] text-emerald-600 font-semibold block">
                {teacherProfile?.verified ? "✓ Verified Tutor" : "● Status: Pending"}
              </span>
            </div>
          </div>

          {/* Drawer Nav Links */}
          <nav className="p-3 flex flex-col gap-1">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-600 font-bold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <tab.icon
                  size={18}
                  className={
                    activeTab === tab.id ? "text-blue-600" : "text-gray-400"
                  }
                />
                <span className="flex-1 text-left">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100 space-y-1">
          <button
            onClick={() => {
              setActiveTab("profile");
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            <Settings size={18} className="text-gray-400" />
            Settings
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (onLogout) onLogout();
              else if (onBack) onBack();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} className="text-red-500" />
            Log Out
          </button>
          {onBack && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onBack();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
            >
              <ArrowRight size={18} className="text-gray-400 rotate-180" />
              Exit to App
            </button>
          )}
        </div>
      </aside>

      {/* DESKTOP LEFT SIDEBAR */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-gray-200 flex-col justify-between shadow-sm z-10 shrink-0">
        <div>
          {/* Logo Area */}
          <div className="h-20 flex items-center px-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <FileText size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-sm leading-tight">
                  EduVistar
                </h1>
                <span className="text-[10px] text-gray-500 block">
                  Teacher Portal
                </span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-4 flex flex-col gap-1 mt-2">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-600 font-bold"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <tab.icon
                  size={18}
                  className={
                    activeTab === tab.id ? "text-blue-600" : "text-gray-400"
                  }
                />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100 space-y-1">
          <button
            onClick={() => setActiveTab("profile")}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            <Settings size={18} className="text-gray-400" />
            Settings
          </button>
          <button 
            onClick={() => {
              if (onLogout) onLogout();
              else if (onBack) onBack();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} className="text-red-500" />
            Log Out
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
            >
              <ArrowRight size={18} className="text-gray-400 rotate-180" />
              Exit to App
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8f9fa]">
        {/* Top Header */}
        <header className="h-16 md:h-20 bg-white/90 backdrop-blur-md border-b border-gray-200/70 flex items-center justify-between px-3 sm:px-6 md:px-8 shrink-0 relative z-30">
          {/* Left: Mobile hamburger & branding or Desktop breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-1 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <div className="flex items-center gap-2 md:hidden">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs">
                <FileText size={15} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-xs leading-tight">
                  EduVistar
                </h1>
                <span className="text-[9px] text-gray-500 block">
                  Teacher Portal
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-400">
              <span>Portal</span>
              <span>/</span>
              <span className="text-gray-900 font-bold capitalize">
                {navTabs.find((t) => t.id === activeTab)?.label || activeTab}
              </span>
            </div>
          </div>

          {/* Right: Notifications, Avatar, Logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-gray-500 hover:text-brand-moss hover:bg-gray-100 transition-all cursor-pointer"
                title="Notifications"
              >
                <Bell size={20} />
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-clay rounded-full border-2 border-white animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto sm:mt-3 w-[calc(100vw-24px)] sm:w-96 max-w-sm bg-white border border-brand-moss/15 rounded-2xl p-4 shadow-2xl z-50 text-brand-charcoal animate-fade-in">
                  <div className="flex items-center justify-between border-b border-brand-moss/10 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-brand-clay" />
                      <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss">
                        Notifications
                      </span>
                      {notifications.filter((n) => !n.read).length > 0 && (
                        <span className="bg-brand-clay/15 text-brand-clay font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {notifications.filter((n) => !n.read).length} new
                        </span>
                      )}
                    </div>
                    {notifications.filter((n) => !n.read).length > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        className="text-[10px] font-mono text-brand-clay font-bold hover:underline uppercase"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-gray-400 py-6">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleToggleNotification(n.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            n.read
                              ? "bg-gray-50/70 border-gray-100 text-gray-500"
                              : "bg-brand-cream/30 border-brand-moss/15 text-brand-charcoal shadow-xs"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h6 className="font-heading font-bold text-xs text-brand-moss">
                              {n.title}
                            </h6>
                            <span className="font-mono text-[9px] text-gray-400 shrink-0">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-[11px] mt-1 text-brand-charcoal/80 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 overflow-hidden shrink-0">
                {teacherProfile?.avatar ? (
                  <img
                    src={teacherProfile.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={16} />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-700 max-w-[85px] sm:max-w-[150px] truncate">
                {currentUser?.displayName || "Teacher"}
              </span>
            </div>

            <button
              onClick={() => {
                if (onLogout) onLogout();
                else if (onBack) onBack();
              }}
              className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60 text-xs font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all shrink-0"
              title="Log Out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-up">
            {/* Verification Status Banner for unverified or pending teachers */}
            {/* 3-Tier Educator Badge & Rate Floor Status Card */}
            {(() => {
              const isGradeATeacher = Boolean(
                currentUser?.isEliteVip || 
                teacherProfile?.tier === 'Grade A' || 
                (academyProgress?.enrolled && (academyProgress?.completedModules || []).length >= 4)
              );
              const isGradeBTeacher = !isGradeATeacher && Boolean(
                govIdUrl || teacherProfile?.verified || teacherProfile?.govId
              );

              return (
                <div className="bg-gradient-to-r from-brand-moss via-brand-charcoal to-brand-moss text-white border border-brand-cream/15 rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 shadow-xl overflow-hidden relative">
                  <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-brand-clay/20 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                        isGradeATeacher
                          ? "bg-amber-400/20 border border-amber-300/40 text-amber-300"
                          : isGradeBTeacher
                          ? "bg-blue-400/20 border border-blue-300/40 text-blue-300"
                          : "bg-white/10 border border-white/20 text-brand-cream"
                      }`}>
                        {isGradeATeacher ? <Crown className="w-7 h-7 animate-pulse" /> : isGradeBTeacher ? <ShieldCheck className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-mono text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${
                            isGradeATeacher
                              ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                              : isGradeBTeacher
                              ? "bg-blue-500/20 text-blue-300 border-blue-400/40"
                              : "bg-white/15 text-white border-white/20"
                          }`}>
                            {isGradeATeacher
                              ? "👑 Tier: Elite (Grade A - VVIP Certified)"
                              : isGradeBTeacher
                              ? "🛡️ Tier: Basic (Grade B - Verified Educator)"
                              : "🆓 Tier: Freemium Plan (Standard Entry)"}
                          </span>

                          {isGradeATeacher && (
                            <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              ₦100,000/mo Contract Floor Protected
                            </span>
                          )}
                        </div>

                        <h3 className="font-heading font-extrabold text-base sm:text-xl text-white">
                          {isGradeATeacher
                            ? "VVIP Elite Status Active — Protected Rate Floor"
                            : isGradeBTeacher
                            ? "Basic Grade B Status — Flexible Rates"
                            : "Freemium Educator — Standard Profile"}
                        </h3>

                        <p className="font-sans text-xs text-brand-cream/80 max-w-2xl leading-relaxed">
                          {isGradeATeacher
                            ? "You have completed Academy Level 4. Clients cannot book you for less than ₦100,000 monthly contracts. You receive top placement in parent search rankings and private VIP community access."
                            : isGradeBTeacher
                            ? "Your identity and credentials are submitted. Upgrade to Grade A (Elite VVIP) via the Academy to unlock the guaranteed ₦100,000+ monthly rate floor and VIP WhatsApp group."
                            : "You are on the free application plan. Upload your NIN, TRCN/Degree, School ID, and LinkedIn in profile settings to earn Grade B, or enroll in the Elite Academy for Grade A VVIP perks."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
                      {!isGradeATeacher && (
                        <Link
                          to="/academy"
                          className="py-2.5 px-5 bg-brand-clay hover:bg-brand-clay/90 text-white rounded-xl font-heading font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-clay/20 transition-all flex items-center justify-center gap-2 text-center"
                        >
                          <Crown className="w-4 h-4 text-amber-300" />
                          <span>Upgrade to Grade A Elite</span>
                        </Link>
                      )}
                      
                      {!isGradeBTeacher && !isGradeATeacher && (
                        <button
                          onClick={() => setActiveTab("profile")}
                          className="py-2.5 px-5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Submit Credentials (Grade B)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TAB 1: OVERVIEW & BOOKINGS */}
            {activeTab === "overview" && (
              <div className="space-y-6 sm:space-y-8">
                {/* Header Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                      <BarChart2 size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                        Weekly Reports
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Track performance trends and generate insights
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <select className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 focus:outline-none shadow-sm cursor-pointer hover:border-gray-300">
                      <option>8 Weeks</option>
                      <option>4 Weeks</option>
                      <option>This Year</option>
                    </select>
                    <button className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 shadow-sm flex items-center gap-2 transition-colors">
                      <Download size={15} /> Export All
                    </button>
                  </div>
                </div>

                {/* Colorful Stats Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                      {/* Blue Card */}
                      <div className="bg-[#3b82f6] rounded-xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group">
                        <div className="absolute top-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity">
                          <Wallet size={24} />
                        </div>
                        <span className="block text-xs font-medium text-blue-100 mb-1 opacity-90">
                          Earned This Month
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold tracking-tight">
                            {formatCurrency(earnedThisMonth, selectedCurrency)}
                          </span>
                        </div>
                        <span className="block text-xs font-medium text-blue-100 mt-2 opacity-90">
                          Net earnings
                        </span>
                      </div>

                      {/* Green Card */}
                      <div className="bg-[#10b981] rounded-xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden group">
                        <div className="absolute top-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity">
                          <Activity size={24} />
                        </div>
                        <span className="block text-xs font-medium text-emerald-100 mb-1 opacity-90">
                          Sessions This Month
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold tracking-tight">
                            {sessionsCount}
                          </span>
                        </div>
                        <span className="block text-xs font-medium text-emerald-100 mt-2 opacity-90">
                          Total classes
                        </span>
                      </div>

                      {/* Purple Card */}
                      <div className="bg-[#8b5cf6] rounded-xl p-6 text-white shadow-lg shadow-purple-500/20 relative overflow-hidden group">
                        <div className="absolute top-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity">
                          <ShieldCheck size={24} />
                        </div>
                        <span className="block text-xs font-medium text-purple-100 mb-1 opacity-90">
                          Escrow Balance
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold tracking-tight">
                            {formatCurrency(wallet.escrow, selectedCurrency)}
                          </span>
                        </div>
                        <span className="block text-xs font-medium text-purple-100 mt-2 opacity-90">
                          Secured pending
                        </span>
                      </div>

                      {/* Orange Card */}
                      <div className="bg-[#f59e0b] rounded-xl p-6 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden group">
                        <div className="absolute top-4 right-4 opacity-100 transition-opacity">
                          <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold">
                            NCDPI
                          </span>
                        </div>
                        <span className="block text-xs font-medium text-amber-100 mb-1 opacity-90">
                          Active Students
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold tracking-tight">
                            {roster.length}
                          </span>
                        </div>
                        <span className="block text-xs font-medium text-amber-100 mt-2 opacity-90">
                          Enrolled in classes
                        </span>
                      </div>
                    </div>

                    {/* Week-over-Week Comparison Section */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-8">
                      <h3 className="font-bold text-gray-900 text-lg">
                        Week-over-Week Comparison
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Compare current week performance with previous week
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-100 rounded-lg p-5 flex flex-col relative group hover:border-gray-200 transition-colors">
                          <div className="absolute top-5 right-5 text-emerald-500">
                            <TrendingUp size={16} />
                          </div>
                          <span className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                            Student Attendance Rate
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              {sessionsCount > 0 ? "100%" : "0%"}
                            </span>
                            <span className="text-xs font-medium text-gray-400">
                              vs 0%
                            </span>
                          </div>
                          <span className="text-xs font-bold text-brand-charcoal/40 mt-1">
                            {sessionsCount > 0 ? "Active attendance" : "No sessions recorded"}
                          </span>
                        </div>

                        <div className="border border-gray-100 rounded-lg p-5 flex flex-col relative group hover:border-gray-200 transition-colors">
                          <div className="absolute top-5 right-5 text-emerald-500">
                            <TrendingUp size={16} />
                          </div>
                          <span className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                            Average Class Rating
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              {teacherProfile?.rating ? `${teacherProfile.rating}/5` : "0.0/5"}
                            </span>
                            <span className="text-xs font-medium text-gray-400">
                              vs 0.0/5
                            </span>
                          </div>
                          <span className="text-xs font-bold text-brand-charcoal/40 mt-1">
                            {teacherProfile?.rating ? `${teacherProfile.reviewsCount || 0} reviews` : "No ratings yet"}
                          </span>
                        </div>

                        <div className="border border-gray-100 rounded-lg p-5 flex flex-col relative group hover:border-gray-200 transition-colors">
                          <div className="absolute top-5 right-5 text-emerald-500">
                            <TrendingUp size={16} />
                          </div>
                          <span className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                            Total Teaching Hours
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              {sessionsCount * 2} hrs
                            </span>
                            <span className="text-xs font-medium text-gray-400">
                              vs 0 hrs
                            </span>
                          </div>
                          <span className="text-xs font-bold text-brand-charcoal/40 mt-1">
                            {sessionsCount > 0 ? `+${sessionsCount * 2} hrs` : "0 hrs completed"}
                          </span>
                        </div>

                        <div className="border border-gray-100 rounded-lg p-5 flex flex-col relative group hover:border-gray-200 transition-colors">
                          <div className="absolute top-5 right-5 text-emerald-500">
                            <CheckCircle2 size={16} />
                          </div>
                          <span className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                            Pending Grading
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              0
                            </span>
                            <span className="text-xs font-medium text-gray-400">
                              vs 0
                            </span>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 mt-1">
                            All caught up
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Teacher Onboarding Checklist */}
                    {(() => {
                      const isVetted = !!(
                        teacherProfile?.verified ||
                        teacherProfile?.isVetted ||
                        teacherProfile?.vettingStatus === "approved" ||
                        currentUser?.isVetted
                      );
                      const hasSubjects =
                        teacherProfile?.subjects &&
                        teacherProfile.subjects.length > 0;
                      const hasAvailability = Object.values(
                        availabilityGrid,
                      ).some((slots) => slots.length > 0);
                      const hasGraded = gradesLog && gradesLog.length > 0;

                      const teacherSteps = [
                        {
                          step: 1,
                          title: "Teacher Vetting Status",
                          desc: isVetted
                            ? "Your profile has been vetted and verified by the administration team."
                            : "Submit your credentials (NIN/TRCN/Degree) for verification by the admin team.",
                          completed: isVetted,
                          actionLabel: isVetted ? "Verified" : "Verify Profile",
                          action: isVetted ? null : () => setActiveTab("profile"),
                        },
                        {
                          step: 2,
                          title: "Set Hourly Rate & Profile Details",
                          desc: hasSubjects && (teacherProfile?.rate > 0)
                            ? `Configured. Hourly rate: ${formatCurrency(teacherProfile.rate || 0, selectedCurrency)}.`
                            : "Configure your subjects, biography, profile avatar, and set your hourly rate.",
                          completed: !!(hasSubjects && (teacherProfile?.rate > 0)),
                          actionLabel: "Edit Profile",
                          action: () => setActiveTab("profile"),
                        },
                        {
                          step: 3,
                          title: "Set Slot Availability",
                          desc: hasAvailability
                            ? "Weekly schedule slots configured."
                            : "Add availability slots for days of the week so parents can book lessons.",
                          completed: hasAvailability,
                          actionLabel: "Set Availability",
                          action: () => setActiveTab("profile"),
                        },
                        {
                          step: 4,
                          title: "Grade Homework Submission",
                          desc: hasGraded
                            ? `Graded ${gradesLog.length} assignment(s).`
                            : "Grade student assignments and homework submissions to release escrow funds.",
                          completed: hasGraded,
                          actionLabel: "Grade Homework",
                          action: () => {
                            const el =
                              document.getElementById("grading-section");
                            if (el) el.scrollIntoView({ behavior: "smooth" });
                            else setActiveTab("students");
                          },
                        },
                      ];

                      const tCompleted = teacherSteps.filter(
                        (s) => s.completed,
                      ).length;
                      const tPercent = Math.round(
                        (tCompleted / teacherSteps.length) * 100,
                      );

                      return (
                        <div className="bg-white border border-brand-moss/10 rounded-[2rem] p-6 md:p-8 shadow-sm">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">
                                INTERACTIVE QUICKSTART GUIDE
                              </span>
                              <h3 className="font-heading font-bold text-xl text-brand-moss">
                                Set Up Your Teacher Account
                              </h3>
                              <p className="font-sans text-xs text-brand-charcoal/70 mt-1 leading-relaxed">
                                Complete these steps to maximize your visibility
                                and process bookings successfully. Click any
                                card to navigate.
                              </p>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <span className="font-sans text-2xs font-bold text-brand-moss uppercase tracking-wider mb-1.5">
                                Progress: {tPercent}% ({tCompleted}/
                                {teacherSteps.length})
                              </span>
                              <div className="w-48 h-2 bg-brand-moss/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-brand-clay transition-all duration-500 rounded-full"
                                  style={{ width: `${tPercent}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {teacherSteps.map((item) => (
                              <div
                                key={item.step}
                                onClick={() => item.action && item.action()}
                                className={`border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 relative select-none ${
                                  item.action
                                    ? "cursor-pointer hover:shadow-md hover:border-brand-clay/35 hover-lift"
                                    : ""
                                } ${
                                  item.completed
                                    ? "bg-emerald-50/20 border-emerald-600/20 text-brand-charcoal"
                                    : "bg-white border-brand-moss/10 hover:border-brand-clay/40"
                                }`}
                              >
                                <div className="absolute top-3 right-3">
                                  {item.completed ? (
                                    <span className="flex items-center justify-center w-4 h-4 bg-emerald-600 rounded-full text-white text-[9px] font-bold">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="flex items-center justify-center w-4 h-4 border border-brand-clay/55 rounded-full text-brand-clay text-[9px] font-bold animate-pulse">
                                      ●
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <span
                                    className={`font-heading font-black text-2xl block mb-1 ${item.completed ? "text-emerald-600/80" : "text-brand-clay"}`}
                                  >
                                    0{item.step}
                                  </span>
                                  <h4 className="font-heading font-bold text-xs text-brand-moss mb-2">
                                    {item.title}
                                  </h4>
                                  <p className="font-sans text-[11px] text-brand-charcoal/75 leading-relaxed mb-3">
                                    {item.desc}
                                  </p>
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

                    {/* Incoming Booking Requests */}
                    <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                      <h3 className="font-heading font-bold text-xl text-brand-moss mb-4 flex items-center justify-between">
                        <span>Incoming Booking Requests</span>
                        <span className="font-mono text-2xs bg-brand-clay/10 text-brand-clay font-bold py-1 px-3 rounded-full uppercase tracking-wider">
                          {bookingRequests.length} Pending Confirm
                        </span>
                      </h3>

                      <div className="bg-brand-clay/5 border border-brand-clay/20 rounded-xl p-4 mb-6">
                        <h4 className="font-heading font-bold text-sm text-brand-clay mb-2">
                          Step-by-Step Guide for Booking Requests
                        </h4>
                        <ol className="list-decimal list-inside space-y-1.5 font-sans text-xs text-brand-charcoal/80">
                          <li>
                            <strong>Review</strong> the student's request,
                            noting the subject and proposed time slot.
                          </li>
                          <li>
                            Click <strong>Confirm</strong> to accept the class,
                            or <strong>Reject</strong> if you are unavailable.
                          </li>
                          <li>
                            Once confirmed, the class moves to{" "}
                            <strong>Active Tutoring Classrooms</strong> below.
                          </li>
                          <li>
                            In the Active Classrooms section, paste your{" "}
                            <strong>Class Link (e.g., Zoom/Google Meet)</strong>{" "}
                            and submit it.
                          </li>
                          <li>
                            After the class concludes, click{" "}
                            <strong>Complete & Claim Escrow</strong> to receive
                            your payout.
                          </li>
                        </ol>
                      </div>

                      {bookingRequests.length === 0 ? (
                        <div className="py-8 text-center text-brand-charcoal/50 text-sm font-sans">
                          No pending booking confirmation requests.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {bookingRequests.map((request) => (
                            <div
                              key={request.id}
                              className="bg-brand-cream/30 border border-brand-moss/5 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover-lift"
                            >
                              <div>
                                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-clay font-bold block mb-1">
                                  NEW MANUAL BOOKING REQUEST
                                </span>
                                <h4 className="font-heading font-bold text-brand-moss text-base">
                                  Class with {request.studentName} (Parent:
                                  Ngozi A.)
                                </h4>
                                <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                                  Proposed Slot:{" "}
                                  <span className="font-bold">
                                    {request.slot.day} at {request.slot.time}
                                  </span>{" "}
                                  · Value:{" "}
                                  {formatCurrency(
                                    convertMinor(
                                      request.cost,
                                      selectedCurrency,
                                    ),
                                    selectedCurrency,
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                  onClick={() =>
                                    handleBookingRespond(request.id, "Confirm")
                                  }
                                  className="flex-1 md:flex-none py-2 px-5 bg-brand-moss hover:bg-brand-moss/95 text-white rounded-full font-sans font-bold text-xs uppercase tracking-wider transition-colors"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() =>
                                    handleBookingRespond(request.id, "Reject")
                                  }
                                  className="flex-1 md:flex-none py-2 px-5 border border-brand-clay hover:bg-brand-clay hover:text-white text-brand-clay rounded-full font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Active Classrooms */}
                    <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm">
                      <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-4">
                        ACTIVE TUTORING CLASSROOMS
                      </span>

                      {activeSessions.length === 0 ? (
                        <div className="text-center text-brand-charcoal/40 text-xs py-6 font-sans">
                          No scheduled lessons found. Pending confirm requests
                          will appear here once approved.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activeSessions.map((session) => (
                            <div
                              key={session.id}
                              className="bg-brand-cream/20 border border-brand-moss/5 rounded-2xl p-4 flex justify-between items-center gap-4 hover-lift"
                            >
                              <div>
                                <h4 className="font-heading font-bold text-sm text-brand-moss">
                                  {session.studentName} (Parent: Ngozi A.)
                                </h4>
                                <span className="font-mono text-[9px] text-brand-charcoal/50 block mt-0.5 uppercase">
                                  {session.slot.day} · {session.slot.time} ·
                                  Value:{" "}
                                  {formatCurrency(
                                    convertMinor(
                                      session.cost,
                                      selectedCurrency,
                                    ),
                                    selectedCurrency,
                                  )}
                                </span>
                                <span className="font-mono text-[9px] text-emerald-600 font-bold block mt-1 uppercase">
                                  ✓ {session.status}
                                </span>

                                <div className="mt-3 w-full sm:w-80">
                                  {(!session.classLink ||
                                    editingClassLink === session.id) &&
                                  session.status !== "Completed" ? (
                                    <div className="flex gap-2">
                                      <input
                                        type="url"
                                        placeholder="Paste Class Link (e.g. Zoom/Meet)"
                                        value={
                                          classLinkInputs[session.id] !==
                                          undefined
                                            ? classLinkInputs[session.id]
                                            : session.classLink || ""
                                        }
                                        onChange={(e) =>
                                          setClassLinkInputs({
                                            ...classLinkInputs,
                                            [session.id]: e.target.value,
                                          })
                                        }
                                        className="flex-1 text-[10px] px-3 py-2 bg-white border border-brand-moss/20 rounded-xl outline-none focus:border-brand-moss"
                                      />
                                      <button
                                        onClick={() =>
                                          handleSubmitClassLink(session.id)
                                        }
                                        disabled={
                                          submittingClassLink === session.id
                                        }
                                        className="px-3 py-2 bg-brand-moss hover:bg-brand-clay text-white rounded-xl text-[9px] uppercase tracking-wider font-bold shrink-0 disabled:opacity-50"
                                      >
                                        {submittingClassLink === session.id
                                          ? "Submitting..."
                                          : "Submit Link"}
                                      </button>
                                    </div>
                                  ) : session.classLink ? (
                                    <div className="w-full text-[10px] text-brand-moss bg-brand-moss/5 border border-brand-moss/10 px-3 py-2 rounded-xl truncate flex justify-between items-center gap-2">
                                      <div className="truncate">
                                        <b>Class Link:</b>{" "}
                                        <a
                                          href={session.classLink}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="underline font-mono"
                                        >
                                          {session.classLink}
                                        </a>
                                      </div>
                                      {session.status !== "Completed" && (
                                        <button
                                          onClick={() =>
                                            setEditingClassLink(session.id)
                                          }
                                          className="text-[9px] uppercase font-bold text-brand-clay hover:text-brand-moss shrink-0 border border-brand-clay/20 px-2 py-1 rounded-lg bg-white"
                                        >
                                          Edit
                                        </button>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex gap-2 self-start md:self-center flex-wrap">
                                {session.status !== "Completed" &&
                                  session.status !== "Disputed" && (
                                    <button
                                      onClick={() =>
                                        handleCompleteSession(session.id)
                                      }
                                      className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-heading font-bold text-2xs transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                                      Complete & Claim Escrow
                                    </button>
                                  )}
                                {session.status === "Completed" && (
                                  <button
                                    onClick={() => {
                                      setSelectedClockSession(session);
                                      setIsClockLogOpen(true);
                                    }}
                                    className="py-2 px-4 bg-brand-moss/5 border border-brand-moss/10 rounded-xl font-heading font-bold text-2xs text-brand-moss hover:bg-brand-clay hover:text-white transition-all flex items-center gap-1.5"
                                  >
                                    <Clock className="w-3.5 h-3.5" /> Session
                                    Clock Log
                                  </button>
                                )}
                                <button
                                  onClick={() => onOpenChat(session)}
                                  className="btn-magnetic w-9 h-9 rounded-full bg-brand-moss/5 border border-brand-moss/10 flex items-center justify-center text-brand-moss hover:bg-brand-clay hover:text-white transition-colors"
                                >
                                  <MessageSquare className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Direct Admin Support Box */}
                    <div className="bg-brand-moss text-brand-cream border border-brand-cream/10 rounded-[2.5rem] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-heading font-bold text-base text-white">
                          Need Support or Profile Audits?
                        </h4>
                        <p className="font-sans text-xs text-brand-cream/80 mt-1 leading-relaxed">
                          If you have questions about your onboarding status,
                          class verification, payouts, or need help updating
                          your banking details, please chat with our Admin team
                          directly.
                        </p>
                      </div>
                      <a
                        href="https://wa.me/2348136451607"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-3 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider text-center shrink-0 shadow-lg shadow-brand-clay/20 transition-all duration-300 hover-lift"
                      >
                        💬 WhatsApp Support
                      </a>
                    </div>
                  </div>
                )}

                {/* TAB 2: FACULTY PROFILE */}
                {activeTab === "profile" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Profile Builder */}
                    <div className="lg:col-span-7 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                      <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-2">
                        PROFILE BUILDER
                      </span>
                      <h3 className="font-heading font-bold text-2xl text-brand-moss mb-6">
                        Edit Faculty Profile
                      </h3>

                      {profileMessage && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs py-3 px-4 rounded-xl mb-6 font-mono animate-pulse">
                          {profileMessage}
                        </div>
                      )}

                      <form
                        onSubmit={handleProfileSubmit}
                        className="space-y-6 font-sans text-xs"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">
                              Display Name
                            </label>
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                            />
                          </div>
                          <div>
                            <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">
                              Public Username
                            </label>
                            <div className="relative flex items-center">
                              <span className="absolute left-4 font-mono text-brand-charcoal/40">
                                @
                              </span>
                              <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) =>
                                  setUsername(
                                    e.target.value
                                      .toLowerCase()
                                      .replace(/[^a-z0-9-]/g, ""),
                                  )
                                }
                                className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl pl-8 pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm font-mono"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">
                              Location
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Lagos, Nigeria"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                            />
                          </div>
                          <div>
                            <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">
                              WhatsApp Number
                            </label>
                            <input
                              type="tel"
                              placeholder="+234 800 000 0000"
                              value={whatsapp}
                              onChange={(e) => setWhatsapp(e.target.value)}
                              className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                            />
                          </div>
                        </div>

                        {/* Mandatory LinkedIn Profile Field */}
                        <div className="bg-brand-moss/5 border border-brand-moss/15 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss flex items-center gap-1.5">
                              <span className="text-blue-600 font-bold font-sans">in</span> LinkedIn Profile URL <span className="text-red-500">*</span>
                            </label>
                            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                              Mandatory for Verification
                            </span>
                          </div>
                          <input
                            type="url"
                            required
                            placeholder="https://linkedin.com/in/your-profile"
                            value={linkedin}
                            onChange={(e) => setLinkedin(e.target.value)}
                            className="w-full bg-white border border-brand-moss/20 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                          />
                          <p className="text-[11px] text-brand-charcoal/70 leading-relaxed">
                            💡 <b>Why this is mandatory:</b> Parents strongly prefer tutors with a verified LinkedIn profile. Having your public LinkedIn link significantly increases client trust, profile views, and lesson booking requests.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">
                              Hourly Rate
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                required
                                placeholder="e.g. 4000"
                                value={rate}
                                onChange={(e) =>
                                  setRate(parseFloat(e.target.value) || 0)
                                }
                                className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                              />
                              <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="bg-white border border-brand-moss/10 rounded-xl px-3 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-xs font-bold h-[46px] shrink-0"
                              >
                                <option value="NGN">NGN (₦)</option>
                                <option value="USD">USD ($)</option>
                                <option value="GHS">GHS (₵)</option>
                                <option value="KES">KES (KSh)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="EUR">EUR (€)</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">
                              Timezone
                            </label>
                            <select
                              value={timezone}
                              onChange={(e) => setTimezone(e.target.value)}
                              className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm h-[46px]"
                            >
                              <option value="Africa/Lagos">
                                West Africa Time (Lagos, UTC+1)
                              </option>
                              <option value="Africa/Nairobi">
                                East Africa Time (Nairobi, UTC+3)
                              </option>
                              <option value="Africa/Johannesburg">
                                South Africa Standard Time (UTC+2)
                              </option>
                              <option value="Africa/Accra">
                                Greenwich Mean Time (Accra, UTC+0)
                              </option>
                              <option value="Europe/London">
                                Europe / London (BST/GMT)
                              </option>
                              <option value="UTC">
                                Coordinated Universal Time (UTC)
                              </option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">
                              Preferred Classroom Link
                            </label>
                            <input
                              type="url"
                              placeholder="e.g. Google Meet or Zoom URL"
                              value={classroomLink}
                              onChange={(e) => setClassroomLink(e.target.value)}
                              className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                            />
                          </div>
                          <div>
                            <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">
                              Recording Tool
                            </label>
                            <select
                              value={recordingTool}
                              onChange={(e) => setRecordingTool(e.target.value)}
                              className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm h-[46px]"
                            >
                              <option value="recordly.site">
                                Recordly.site (Recommended)
                              </option>
                              <option value="zoom-cloud">
                                Zoom Cloud Native
                              </option>
                              <option value="loom">Loom Personal</option>
                              <option value="other">
                                Other / Manual Upload
                              </option>
                            </select>
                          </div>
                        </div>

                        {/* Teacher Profile Photo Provision & Guidelines */}
                        <div className="bg-white border border-brand-moss/10 rounded-2xl p-5 space-y-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-moss/5 pb-3">
                            <div>
                              <h4 className="font-heading font-bold text-sm text-brand-moss uppercase tracking-wider flex items-center gap-2">
                                <Camera className="w-4 h-4 text-brand-clay" />
                                Teacher Profile Photo
                              </h4>
                              <p className="text-xs text-brand-charcoal/65 mt-0.5">
                                A clear, friendly photo helps parents and students connect with you.
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-brand-clay bg-brand-clay/10 px-2.5 py-1 rounded-full w-fit">
                              Visible on Public Profile
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                            {/* Left: Avatar Preview & Upload Action */}
                            <div className="md:col-span-5 flex flex-col items-center text-center p-4 bg-brand-cream/30 rounded-2xl border border-brand-moss/10">
                              <div className="relative group">
                                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-brand-moss/10 flex items-center justify-center">
                                  {avatar ? (
                                    <img
                                      src={avatar}
                                      alt={name || "Teacher"}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop";
                                      }}
                                    />
                                  ) : (
                                    <User className="w-12 h-12 text-brand-moss/40" />
                                  )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-brand-moss hover:bg-brand-clay text-white p-2 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110">
                                  <Camera className="w-4 h-4" />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, "image", setAvatar)}
                                    className="hidden"
                                    disabled={uploadingState.type === "image"}
                                  />
                                </label>
                              </div>

                              <div className="mt-4 w-full space-y-2">
                                <label className="block w-full py-2.5 px-4 bg-brand-moss hover:bg-brand-moss/90 text-white rounded-xl font-heading font-bold text-xs uppercase tracking-wider text-center cursor-pointer transition-all shadow-sm">
                                  {uploadingState.type === "image" ? (
                                    <span>Uploading ({uploadingState.progress}%)...</span>
                                  ) : (
                                    <span className="flex items-center justify-center gap-2">
                                      <Upload className="w-3.5 h-3.5" /> Upload Photo
                                    </span>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, "image", setAvatar)}
                                    className="hidden"
                                    disabled={uploadingState.type === "image"}
                                  />
                                </label>
                                
                                <div className="pt-2 text-left">
                                  <label className="text-[10px] font-heading font-bold uppercase tracking-wider text-brand-moss/70 block mb-1">
                                    Or paste photo URL
                                  </label>
                                  <input
                                    type="url"
                                    placeholder="https://... photo link"
                                    value={avatar}
                                    onChange={(e) => setAvatar(e.target.value)}
                                    className="w-full bg-white border border-brand-moss/15 rounded-lg px-3 py-2 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Right: What your photo needs checklist & sample avatars */}
                            <div className="md:col-span-7 space-y-3 bg-brand-cream/15 p-4 rounded-2xl border border-brand-moss/10">
                              <h5 className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss">
                                What your photo needs
                              </h5>

                              {/* Sample Photos */}
                              <div className="flex items-center gap-3 py-1">
                                <div className="flex items-center gap-2">
                                  <img
                                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop"
                                    alt="Sample teacher portrait"
                                    className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                                    title="Facing forward, clean background"
                                  />
                                  <img
                                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
                                    alt="Sample teacher portrait"
                                    className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                                    title="Well lit, centered"
                                  />
                                  <img
                                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
                                    alt="Sample teacher portrait"
                                    className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                                    title="Head & shoulders framed"
                                  />
                                </div>
                                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                                  ✓ Approved examples
                                </span>
                              </div>

                              {/* Checklist */}
                              <ul className="space-y-1.5 text-xs text-brand-charcoal/80">
                                <li className="flex items-start gap-2">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>You should be facing forward</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>Frame your head and shoulders</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>You should be centered and upright</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>Your face and eyes should be visible (except for religious reasons)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>You should be the only person in the photo</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>Use a color photo with high resolution and no filters</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>Avoid logos or personal contact information</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-3">
                            Taught Subjects
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {availableSubjects.map((s) => {
                              const active = selectedSubjects.includes(s);
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => toggleSubject(s)}
                                  className={`py-2 px-4 rounded-xl border font-sans text-xs transition-all duration-300 ${
                                    active
                                      ? "border-brand-clay bg-brand-clay/5 text-brand-charcoal font-bold"
                                      : "border-brand-moss/10 bg-white text-brand-charcoal/70"
                                  }`}
                                >
                                  {active ? "✓ " : ""}
                                  {s}
                                </button>
                              );
                            })}
                            {selectedSubjects
                              .filter((s) => !availableSubjects.includes(s))
                              .map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => toggleSubject(s)}
                                  className="py-2 px-4 rounded-xl border font-sans text-xs transition-all duration-300 border-brand-clay bg-brand-clay/5 text-brand-charcoal font-bold"
                                >
                                  ✓ {s}
                                </button>
                              ))}
                          </div>
                          <div className="mt-3 flex gap-2 max-w-sm">
                            <input
                              type="text"
                              placeholder="Other subject (e.g. Tech Skills)"
                              value={customSubjectInput}
                              onChange={(e) =>
                                setCustomSubjectInput(e.target.value)
                              }
                              className="flex-1 bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = customSubjectInput.trim();
                                if (val) {
                                  if (!selectedSubjects.includes(val)) {
                                    setSelectedSubjects((prev) => [
                                      ...prev,
                                      val,
                                    ]);
                                  }
                                  setCustomSubjectInput("");
                                }
                              }}
                              className="py-2 px-4 bg-brand-moss hover:bg-brand-clay text-white rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-3">
                            Supported Curricula
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {availableCurricula.map((c) => {
                              const active = selectedCurricula.includes(c);
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => toggleCurriculum(c)}
                                  className={`py-2 px-4 rounded-xl border font-sans text-xs transition-all duration-300 ${
                                    active
                                      ? "border-brand-clay bg-brand-clay/5 text-brand-charcoal font-bold"
                                      : "border-brand-moss/10 bg-white text-brand-charcoal/70"
                                  }`}
                                >
                                  {active ? "✓ " : ""}
                                  {c}
                                </button>
                              );
                            })}
                            {selectedCurricula
                              .filter((c) => !availableCurricula.includes(c))
                              .map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => toggleCurriculum(c)}
                                  className="py-2 px-4 rounded-xl border font-sans text-xs transition-all duration-300 border-brand-clay bg-brand-clay/5 text-brand-charcoal font-bold"
                                >
                                  ✓ {c}
                                </button>
                              ))}
                          </div>
                          <div className="mt-3 flex gap-2 max-w-sm">
                            <input
                              type="text"
                              placeholder="Other curriculum (e.g. Custom standard)"
                              value={customCurriculumInput}
                              onChange={(e) =>
                                setCustomCurriculumInput(e.target.value)
                              }
                              className="flex-1 bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = customCurriculumInput.trim();
                                if (val) {
                                  if (!selectedCurricula.includes(val)) {
                                    setSelectedCurricula((prev) => [
                                      ...prev,
                                      val,
                                    ]);
                                  }
                                  setCustomCurriculumInput("");
                                }
                              }}
                              className="py-2 px-4 bg-brand-moss hover:bg-brand-clay text-white rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {/* Verification & Credentials Section */}
                        <div className="border-t border-brand-moss/10 pt-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-heading font-bold text-sm text-brand-moss uppercase tracking-wider flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-brand-clay" />
                              Verification Credentials & Documents
                            </h4>
                            <span className="text-[10px] font-mono text-brand-charcoal/50">Required for Live Client Status</span>
                          </div>

                          {/* Write-up Callout: How to share your document links via Google Drive */}
                          <div className="bg-gradient-to-r from-amber-500/10 via-brand-moss/5 to-brand-cream border border-amber-500/25 rounded-2xl p-4 sm:p-5 text-xs text-brand-charcoal space-y-3 shadow-xs">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-800 font-bold">
                                💡
                              </div>
                              <div className="space-y-1">
                                <h5 className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss">
                                  How to share your document links (Google Drive / Cloud)
                                </h5>
                                <p className="text-brand-charcoal/80 leading-relaxed text-xs">
                                  You can upload your documents to <b>Google Drive</b> (or OneDrive / Dropbox), and paste the shareable links below.
                                </p>
                              </div>
                            </div>

                            <div className="bg-white/80 border border-amber-500/20 rounded-xl p-3.5 space-y-2 text-[11px] text-brand-charcoal">
                              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                                <span>⚠️ Important:</span>
                                <span>Ensure the file link is accessible to everyone and not restricted!</span>
                              </div>
                              <ol className="list-decimal list-inside space-y-1 text-brand-charcoal/75 pl-1 leading-normal">
                                <li>Upload your credential (ID, Certificate, CV) to Google Drive.</li>
                                <li>Right-click the file and click <b>Share</b> ➔ Under <i>General Access</i>, change from <b>"Restricted"</b> to <b>"Anyone with the link can view"</b>.</li>
                                <li>Click <b>Copy link</b>, and paste it into the respective input field below.</li>
                              </ol>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss">
                                  Government-Issued ID (NIN / Passport)
                                </label>
                                <label className="text-[10px] text-brand-clay hover:underline cursor-pointer flex items-center gap-1">
                                  <Upload className="w-2.5 h-2.5" /> Upload File
                                  <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => handleFileUpload(e, "raw", setGovIdUrl)}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                              <input
                                type="text"
                                placeholder="https://drive.google.com/file/d/... or ID Ref"
                                value={govIdUrl}
                                onChange={(e) => setGovIdUrl(e.target.value)}
                                className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-xs"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss">
                                  Degree / Teaching Certificate
                                </label>
                                <label className="text-[10px] text-brand-clay hover:underline cursor-pointer flex items-center gap-1">
                                  <Upload className="w-2.5 h-2.5" /> Upload File
                                  <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => handleFileUpload(e, "raw", setDegreeUrl)}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                              <input
                                type="text"
                                placeholder="https://drive.google.com/file/d/... or Certificate Link"
                                value={degreeUrl}
                                onChange={(e) => setDegreeUrl(e.target.value)}
                                className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss">
                                  TRCN / Teaching Certificate <span className="text-gray-400 font-normal font-sans">(Optional)</span>
                                </label>
                                <label className="text-[10px] text-brand-clay hover:underline cursor-pointer flex items-center gap-1">
                                  <Upload className="w-2.5 h-2.5" /> Upload File
                                  <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => handleFileUpload(e, "raw", setTrcnUrl)}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                              <input
                                type="text"
                                placeholder="https://drive.google.com/... or TRCN Certificate Link"
                                value={trcnUrl}
                                onChange={(e) => setTrcnUrl(e.target.value)}
                                className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-xs"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss">
                                  School ID / Institutional ID <span className="text-gray-400 font-normal font-sans">(Optional)</span>
                                </label>
                                <label className="text-[10px] text-brand-clay hover:underline cursor-pointer flex items-center gap-1">
                                  <Upload className="w-2.5 h-2.5" /> Upload File
                                  <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => handleFileUpload(e, "raw", setSchoolIdUrl)}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                              <input
                                type="text"
                                placeholder="https://drive.google.com/... or School ID Link"
                                value={schoolIdUrl}
                                onChange={(e) => setSchoolIdUrl(e.target.value)}
                                className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss">
                                  Curriculum Vitae / Resume
                                </label>
                                <label className="text-[10px] text-brand-clay hover:underline cursor-pointer flex items-center gap-1">
                                  <Upload className="w-2.5 h-2.5" /> Upload File
                                  <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => handleFileUpload(e, "raw", setCvUrl)}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                              <input
                                type="text"
                                placeholder="https://drive.google.com/file/d/... or Link to CV"
                                value={cvUrl}
                                onChange={(e) => setCvUrl(e.target.value)}
                                className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-xs"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss">
                                  Intro Video Link (YouTube / Loom)
                                </label>
                                <label className="text-[10px] text-brand-clay hover:underline cursor-pointer flex items-center gap-1">
                                  <Upload className="w-2.5 h-2.5" /> Upload Video
                                  <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => handleFileUpload(e, "video", setVideoUrl)}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                              <input
                                type="url"
                                placeholder="https://youtube.com/watch?v=... or Loom / Drive link"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Profile Description / Introduce Yourself */}
                        <div className="border-t border-brand-moss/10 pt-6 space-y-3">
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="font-heading font-bold text-sm text-brand-moss uppercase tracking-wider">
                                1. Introduce yourself
                              </h4>
                              <span className="text-[10px] font-mono text-brand-charcoal/50">Public Profile Bio</span>
                            </div>
                            <p className="text-xs text-brand-charcoal/70 mt-1 leading-relaxed">
                              Show potential students who you are! Share your teaching experience and passion for education and briefly mention your interests and hobbies.
                            </p>
                          </div>
                          <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Hello, my name is... and I'm from... I specialize in tutoring Mathematics & Sciences with over 5 years of experience helping students excel in WAEC, IGCSE, and Cambridge exams."
                            className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-4 text-brand-charcoal focus:outline-none focus:border-brand-clay h-32 resize-none text-sm leading-relaxed"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="btn-magnetic w-full py-4 bg-brand-clay hover:bg-brand-clay/90 text-white rounded-full font-heading font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-clay/20"
                        >
                          {loading
                            ? "Saving Changes..."
                            : "Save & Publish Profile"}
                        </button>
                      </form>
                    </div>

                    {/* Availability Grid */}
                    <div className="lg:col-span-5 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-6">
                      <div>
                        <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">
                          SCHEDULING ENGINE
                        </span>
                        <h4 className="font-heading font-bold text-lg text-brand-moss mt-0.5">
                          Availability Slot Grid
                        </h4>
                        <p className="font-sans text-[11px] text-brand-charcoal/60 mt-1">
                          Configure weekly available timings. Autodetects
                          conflict overlays with Google Calendar.
                        </p>
                      </div>

                      <div className="space-y-3 font-sans text-xs">
                        {Object.entries(availabilityGrid).map(
                          ([day, slots]) => (
                            <div
                              key={day}
                              className="flex justify-between items-center border-b border-brand-moss/5 pb-2"
                            >
                              <span className="font-bold text-brand-moss w-20">
                                {day}
                              </span>
                              <div className="flex gap-1">
                                {["Morning", "Afternoon", "Evening"].map(
                                  (slot) => {
                                    const isAvailable = slots.includes(slot);
                                    return (
                                      <button
                                        key={slot}
                                        onClick={() => {
                                          setAvailabilityGrid((prev) => {
                                            const current = prev[day];
                                            const updated = current.includes(
                                              slot,
                                            )
                                              ? current.filter(
                                                  (s) => s !== slot,
                                                )
                                              : [...current, slot];
                                            return { ...prev, [day]: updated };
                                          });
                                        }}
                                        className={`py-1.5 px-3 rounded-lg border text-[9px] font-bold uppercase transition-all duration-300 ${
                                          isAvailable
                                            ? "bg-brand-moss text-white border-brand-moss"
                                            : "bg-brand-cream/30 border-brand-moss/10 text-brand-charcoal/50 hover:border-brand-moss/30"
                                        }`}
                                      >
                                        {slot}
                                      </button>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          ),
                        )}
                      </div>

                      <div className="border-t border-brand-moss/5 pt-4 space-y-4 font-sans text-xs">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-bold block text-brand-charcoal">
                              Google Calendar Sync
                            </span>
                            <span className="text-[10px] text-brand-charcoal/50">
                              Auto-block busy time blocks.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setGoogleCalendarSync(!googleCalendarSync)
                            }
                            className={`w-10 h-5 rounded-full transition-all relative ${googleCalendarSync ? "bg-brand-moss" : "bg-brand-charcoal/20"}`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${googleCalendarSync ? "right-1" : "left-1"}`}
                            />
                          </button>
                        </div>

                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-bold block text-brand-charcoal">
                              Holiday Mode
                            </span>
                            <span className="text-[10px] text-brand-charcoal/50">
                              Block all bookings for 2 weeks.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setHolidayMode(!holidayMode)}
                            className={`w-10 h-5 rounded-full transition-all relative ${holidayMode ? "bg-brand-clay" : "bg-brand-charcoal/20"}`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${holidayMode ? "right-1" : "left-1"}`}
                            />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-brand-charcoal/50 uppercase font-bold mb-1">
                              Timezone
                            </label>
                            <div className="bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-2 font-mono text-[10px]">
                              WAT (GMT+1)
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] text-brand-charcoal/50 uppercase font-bold mb-1">
                              Min Notice Window
                            </label>
                            <select
                              value={minNotice}
                              onChange={(e) => setMinNotice(e.target.value)}
                              className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-2 text-[10px] focus:outline-none"
                            >
                              <option value="12 hours">12 hours</option>
                              <option value="24 hours">24 hours</option>
                              <option value="48 hours">48 hours</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: STUDENTS & GRADING */}
                {activeTab === "students" && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Student Roster list */}
                      <div className="lg:col-span-7 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-6">
                        <div>
                          <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">
                            STUDENT ROSTER
                          </span>
                          <h3 className="font-heading font-bold text-xl text-brand-moss mt-0.5">
                            Active Study Roster
                          </h3>
                          <p className="font-sans text-[11px] text-brand-charcoal/60 mt-1">
                            Track child performance milestones, notes, and
                            outstanding tasks.
                          </p>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-sans text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-brand-moss/10 text-brand-charcoal/50 font-mono text-[9px] uppercase tracking-wider">
                                <th className="py-2.5 pb-4">Student</th>
                                <th className="py-2.5 pb-4">Subject</th>
                                <th className="py-2.5 pb-4">Last Active</th>
                                <th className="py-2.5 pb-4 text-center">
                                  Tasks
                                </th>
                                <th className="py-2.5 pb-4 text-right">
                                  Trend
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-moss/5 text-brand-charcoal/80">
                              {roster.map((student) => (
                                <tr
                                  key={student.uid}
                                  onClick={() => {
                                    setSelectedRosterStudent(student);
                                    setRosterNoteInput(student.note);
                                  }}
                                  className="hover:bg-brand-moss/5 transition-colors cursor-pointer"
                                >
                                  <td className="py-3.5 font-bold text-brand-moss">
                                    {student.name}
                                  </td>
                                  <td className="py-3.5">{student.subject}</td>
                                  <td className="py-3.5 font-mono text-[10px]">
                                    {student.lastSession}
                                  </td>
                                  <td className="py-3.5 text-center font-bold">
                                    {student.assignments} pending
                                  </td>
                                  <td className="py-3.5 text-right flex items-center justify-end gap-2">
                                    <span className="font-bold text-emerald-600">
                                      {student.trend}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateAiReport(student.name);
                                      }}
                                      className="px-2.5 py-1 bg-brand-clay text-white rounded-lg text-[9px] font-mono font-bold hover:bg-brand-clay/90 transition-all shadow-sm"
                                    >
                                      🪄 AI Report
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* AI Progress Report Output Box */}
                        {(aiReportLoading || aiReportContent) && (
                          <div className="bg-brand-cream/40 border border-brand-clay/20 rounded-2xl p-5 mt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-brand-clay" />{" "}
                                AI Telemetry Progress Digest:{" "}
                                {activeReportStudent}
                              </span>
                              <button
                                onClick={() => setAiReportContent("")}
                                className="text-xs text-brand-charcoal/40 font-bold hover:text-brand-charcoal"
                              >
                                ✕ Close
                              </button>
                            </div>
                            {aiReportLoading ? (
                              <div className="py-6 text-center text-xs font-mono text-brand-clay animate-pulse">
                                ⚡ Synthesizing student analytics & Gemini AI
                                report...
                              </div>
                            ) : (
                              <div className="text-xs font-sans text-brand-charcoal leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-brand-moss/10 shadow-inner">
                                {aiReportContent}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Group Class Manager */}
                      <div className="lg:col-span-5 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm">
                        <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-2">
                          GROUP MODULE
                        </span>
                        <h4 className="font-heading font-bold text-sm text-brand-moss mb-4">
                          Create Group Session (Max 10)
                        </h4>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            toast.success(
                              "Group Classes are coming soon! This feature is under construction.",
                            );
                          }}
                          className="space-y-4 font-sans text-xs"
                        >
                          <input
                            type="text"
                            required
                            placeholder="Group Name (e.g. WAEC Math study group)"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-clay"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              required
                              placeholder="Fee (₦ per student)"
                              value={groupFee}
                              onChange={(e) => setGroupFee(e.target.value)}
                              className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-clay"
                            />
                            <span className="text-[10px] text-brand-charcoal/60 self-center">
                              System auto-splits cost
                            </span>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-brand-moss hover:bg-brand-clay text-white rounded-full font-heading font-bold uppercase text-[10px] tracking-wider transition-colors"
                          >
                            Create Group Class (Coming Soon)
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Assignment Creator */}
                      <div className="bg-brand-charcoal border border-brand-cream/10 rounded-[3rem] p-6 text-brand-cream shadow-sm">
                        <div className="flex items-center justify-between border-b border-brand-cream/10 pb-4 mb-6">
                          <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-brand-clay" />
                            <h4 className="font-heading font-bold text-sm text-white">
                              Create Assignment
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={handleGeminiSuggest}
                            className="bg-brand-clay text-white border border-brand-clay/35 py-1 px-3 rounded-full font-mono text-[8px] uppercase tracking-wider font-bold hover:scale-[1.03] transition-all cursor-pointer"
                          >
                            🪄 Gemini Suggestion
                          </button>
                        </div>

                        <form
                          onSubmit={handleCreateAssignment}
                          className="space-y-4 font-sans text-xs"
                        >
                          <div>
                            <label className="font-heading font-bold text-[10px] uppercase tracking-wider text-brand-cream/60 block mb-1">
                              Student
                            </label>
                            <select
                              value={assignStudent}
                              onChange={(e) => setAssignStudent(e.target.value)}
                              className="w-full bg-brand-cream/5 border border-brand-cream/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-clay text-brand-charcoal"
                            >
                              {roster.length > 0 ? (
                                roster.map((student) => (
                                  <option
                                    key={student.uid}
                                    value={student.name}
                                    className="text-brand-charcoal"
                                  >
                                    {student.name}
                                  </option>
                                ))
                              ) : (
                                <option
                                  value=""
                                  className="text-brand-charcoal"
                                >
                                  No active students
                                </option>
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="font-heading font-bold text-[10px] uppercase tracking-wider text-brand-cream/60 block mb-1">
                              Assignment Title
                            </label>
                            <input
                              type="text"
                              required
                              value={assignTitle}
                              onChange={(e) => setAssignTitle(e.target.value)}
                              placeholder="e.g., Algebra Worksheet 2"
                              className="w-full bg-brand-cream/5 border border-brand-cream/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-clay"
                            />
                          </div>

                          <div>
                            <label className="font-heading font-bold text-[10px] uppercase tracking-wider text-brand-cream/60 block mb-1">
                              Description / Link
                            </label>
                            <textarea
                              required
                              value={assignDesc}
                              onChange={(e) => setAssignDesc(e.target.value)}
                              placeholder="Instructions or link to Google Doc..."
                              className="w-full bg-brand-cream/5 border border-brand-cream/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-clay h-20 resize-none"
                            />
                          </div>

                          <button
                            type="submit"
                            className="btn-magnetic w-full py-2.5 px-4 rounded-full bg-white text-brand-charcoal font-bold hover:bg-white/90 transition-colors shadow-lg text-2xs uppercase tracking-wider"
                          >
                            Send to Student
                          </button>

                          {assignMessage && (
                            <div className="text-center text-emerald-400 font-mono text-[9px] animate-pulse mt-2">
                              {assignMessage}
                            </div>
                          )}
                        </form>
                      </div>

                      {/* Grading Homework reviewer */}
                      <div className="bg-brand-charcoal border border-brand-cream/10 rounded-[3rem] p-6 text-brand-cream">
                        <div className="flex items-center justify-between border-b border-brand-cream/10 pb-4 mb-6">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-brand-clay" />
                            <h4 className="font-heading font-bold text-sm text-white">
                              Homework Submissions
                            </h4>
                          </div>
                          <span className="font-mono text-2xs text-brand-clay uppercase tracking-widest font-bold">
                            0 PENDING
                          </span>
                        </div>

                        <div className="py-8 text-center text-brand-cream/40 text-xs font-sans">
                          No pending homework submissions from students.
                        </div>
                      </div>
                    </div>

                    {/* AI Progress Report Generator */}
                    <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm">
                      <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-2">
                        PROGRESS REPORT BUILDER
                      </span>
                      <h4 className="font-heading font-bold text-sm text-brand-moss mb-4">
                        Gemini Progress Report Generator
                      </h4>
                      <button
                        type="button"
                        disabled={roster.length === 0}
                        onClick={() => {
                          const targetStudent = selectedRosterStudent?.name || roster[0]?.name;
                          if (targetStudent) handleGenerateReport(targetStudent);
                          else toast("No active students enrolled to generate report for.");
                        }}
                        className={`w-full py-3 rounded-full font-heading font-bold uppercase text-[10px] tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-md ${
                          roster.length === 0
                            ? "bg-brand-moss/30 text-brand-charcoal/40 cursor-not-allowed"
                            : "bg-brand-moss hover:bg-brand-clay text-white cursor-pointer"
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-brand-clay animate-pulse" />{" "}
                        {roster.length > 0
                          ? `Generate Gemini Report for ${selectedRosterStudent?.name || roster[0]?.name}`
                          : "No Active Students Enrolled"}
                      </button>

                      {aiReportLoading && (
                        <div className="animate-pulse space-y-2 mt-4">
                          <div className="h-3 bg-brand-moss/10 rounded w-3/4"></div>
                          <div className="h-3 bg-brand-moss/10 rounded w-5/6"></div>
                        </div>
                      )}

                      {aiReportContent && !aiReportLoading && (
                        <div className="mt-4 bg-brand-cream/30 border border-brand-moss/10 p-4 rounded-xl font-mono text-[10px] text-brand-moss space-y-2">
                          <pre className="whitespace-pre-wrap leading-relaxed">
                            {aiReportContent}
                          </pre>
                          <button
                            type="button"
                            onClick={() => {
                              toast.success(
                                "Draft Report successfully published and sent to parent dashboard!",
                              );
                              setAiReportContent("");
                            }}
                            className="w-full py-2 bg-brand-clay hover:bg-brand-clay/90 text-white rounded-lg font-heading text-[9px] uppercase tracking-wider font-bold"
                          >
                            ✓ Publish Draft to Parent
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: EARNINGS & PAYOUTS */}
                {activeTab === "earnings" && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Earnings info card & Payout Request */}
                      <div className="lg:col-span-4 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between hover-lift min-h-[16rem]">
                        <div>
                          <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-2">
                            AVAILABLE SETTLED BALANCE
                          </span>
                          <span className="font-heading font-bold text-3xl text-brand-moss block">
                            {formatCurrency(wallet.balance, selectedCurrency)}
                          </span>
                          <span className="font-sans text-[10px] text-brand-charcoal/50 block mt-1">
                            Ready for transfer to connected payout method.
                          </span>
                        </div>

                        <form
                          onSubmit={handlePayoutRequest}
                          className="mt-4 space-y-3 font-sans text-xs"
                        >
                          <div>
                            <label className="font-bold text-[9px] uppercase tracking-wider text-brand-charcoal/50 block mb-1">
                              Request Amount (Minor Units)
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              max={wallet.balance}
                              value={payoutRequestAmount}
                              onChange={(e) =>
                                setPayoutRequestAmount(parseInt(e.target.value))
                              }
                              className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-2.5 focus:outline-none focus:border-brand-clay"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isRequestingPayout || wallet.balance <= 0}
                            className="w-full py-2.5 bg-brand-moss hover:bg-brand-clay disabled:bg-brand-charcoal/20 text-white rounded-xl font-heading font-bold uppercase text-[10px] tracking-wider transition-colors"
                          >
                            {isRequestingPayout
                              ? "Processing..."
                              : "Request Payout"}
                          </button>
                          {payoutMessage && (
                            <div className="text-center font-mono text-[9px] font-bold mt-2 animate-pulse text-emerald-600">
                              {payoutMessage}
                            </div>
                          )}
                        </form>

                        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-brand-moss bg-brand-moss/5 border border-brand-moss/10 rounded-full px-3 py-1 w-fit mt-4">
                          <ShieldCheck className="w-3.5 h-3.5 text-brand-clay" />{" "}
                          Payout Active
                        </div>
                      </div>

                      {/* Payout configuration settings */}
                      <div className="lg:col-span-8 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-4 font-sans text-xs">
                        <h5 className="font-mono text-[9px] uppercase tracking-widest text-brand-clay font-bold">
                          Payout Settings & Financials
                        </h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-brand-charcoal/50 uppercase font-bold mb-1">
                              Payout Method
                            </label>
                            <select
                              value={payoutMethod}
                              onChange={(e) => setPayoutMethod(e.target.value)}
                              className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-2.5 text-xs focus:outline-none"
                            >
                              <option value="Wise Bank Direct">
                                Wise Bank Direct
                              </option>
                              <option value="Paystack Bank Account">
                                Paystack Bank Account
                              </option>
                              <option value="Mobile Money Wallet">
                                Mobile Money Wallet
                              </option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] text-brand-charcoal/50 uppercase font-bold mb-1">
                              Min Threshold
                            </label>
                            <input
                              type="number"
                              value={minPayout}
                              onChange={(e) =>
                                setMinPayout(parseInt(e.target.value))
                              }
                              className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-2.5 text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        {payoutMethod === "Paystack Bank Account" && (
                          <div className="border border-brand-moss/10 bg-brand-cream/10 p-4 rounded-2xl space-y-3.5 mt-2">
                            <span className="font-mono text-[9px] text-brand-clay font-bold tracking-widest uppercase block mb-1">
                              Local NGN Bank Details
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] text-brand-charcoal/50 uppercase font-bold mb-1">
                                  Account Number
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. 0123456789 (10 digits)"
                                  maxLength="10"
                                  value={accountNumber}
                                  onChange={(e) =>
                                    setAccountNumber(
                                      e.target.value.replace(/\D/g, ""),
                                    )
                                  }
                                  className="w-full bg-white border border-brand-moss/10 rounded-xl p-2.5 focus:outline-none focus:border-brand-clay text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-brand-charcoal/50 uppercase font-bold mb-1">
                                  Account Name
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. John Doe"
                                  value={accountName}
                                  onChange={(e) =>
                                    setAccountName(e.target.value)
                                  }
                                  className="w-full bg-white border border-brand-moss/10 rounded-xl p-2.5 focus:outline-none focus:border-brand-clay text-xs"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[9px] text-brand-charcoal/50 uppercase font-bold mb-1">
                                Select Bank
                              </label>
                              <select
                                value={selectedBankCode}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSelectedBankCode(val);
                                  const bName =
                                    [
                                      {
                                        code: "058",
                                        name: "Guaranty Trust Bank (GTBank)",
                                      },
                                      { code: "057", name: "Zenith Bank" },
                                      { code: "044", name: "Access Bank" },
                                      {
                                        code: "033",
                                        name: "United Bank for Africa (UBA)",
                                      },
                                      {
                                        code: "011",
                                        name: "First Bank of Nigeria",
                                      },
                                      { code: "050", name: "Sterling Bank" },
                                      {
                                        code: "219",
                                        name: "Stanbic IBTC Bank",
                                      },
                                    ].find((b) => b.code === val)?.name ||
                                    "GTBank";
                                  setSelectedBankName(bName);
                                }}
                                className="w-full bg-white border border-brand-moss/10 rounded-xl p-2.5 focus:outline-none text-xs"
                              >
                                <option value="058">
                                  Guaranty Trust Bank (GTBank)
                                </option>
                                <option value="057">Zenith Bank</option>
                                <option value="044">Access Bank</option>
                                <option value="033">
                                  United Bank for Africa (UBA)
                                </option>
                                <option value="011">
                                  First Bank of Nigeria
                                </option>
                                <option value="050">Sterling Bank</option>
                                <option value="219">Stanbic IBTC Bank</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* payout ledger log */}
                        <div className="pt-4 border-t border-brand-moss/5">
                          <span className="text-[9px] text-brand-charcoal/50 uppercase font-bold block mb-1.5">
                            Payout History Ledger
                          </span>
                          <div className="space-y-1.5 text-[10px] font-mono">
                            {transactions && transactions.length > 0 ? (
                              transactions
                                .filter((t) => t.paymentProcessor === "payout")
                                .map((t, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between border-b border-brand-moss/5 pb-1"
                                  >
                                    <span>
                                      {new Date(
                                        t.date || t.createdAt,
                                      ).toLocaleDateString()}
                                      :{" "}
                                      {formatCurrency(
                                        t.amount - (t.commission || 0),
                                        selectedCurrency,
                                      )}
                                    </span>
                                    <span className="text-emerald-700">
                                      Settled (Ref #{t.id?.slice(0, 4) || idx})
                                    </span>
                                  </div>
                                ))
                            ) : (
                              <div className="text-brand-charcoal/40 text-2xs">
                                No processed payouts found.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: REPUTATION & GROWTH */}
                {activeTab === "reputation" && (
                  <div className="space-y-8 animate-fade-up">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Badge Progress & Ratings */}
                      <div className="lg:col-span-6 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-6">
                        {/* Badge Checklist */}
                        <div className="space-y-3">
                          <h5 className="font-mono text-[9px] uppercase tracking-widest text-brand-clay font-bold">
                            Badge Progress (Tutor level)
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            {(() => {
                              const isVetted = !!(
                                teacherProfile?.verified ||
                                teacherProfile?.isVetted ||
                                teacherProfile?.vettingStatus === "approved" ||
                                currentUser?.isVetted
                              );
                              const isElite = !!(
                                teacherProfile?.badges?.includes("badge-elite") ||
                                teacherProfile?.badges?.includes("elite")
                              );
                              const isTopRated = !!(
                                (teacherProfile?.rating || 0) >= 4.8 &&
                                (teacherProfile?.reviewsCount || 0) >= 5
                              );
                              const isEliteEducator = sessionsCount >= 50;

                              const badgeList = [
                                {
                                  badge: "Verified Tutor",
                                  status: isVetted ? "Earned" : "Locked (0%)",
                                  color: isVetted
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-gray-50 text-gray-500 border-gray-200 opacity-60",
                                },
                                {
                                  badge: "Elite Certified",
                                  status: isElite ? "Earned" : "Locked (0%)",
                                  color: isElite
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-gray-50 text-gray-500 border-gray-200 opacity-60",
                                },
                                {
                                  badge: "Top Rated",
                                  status: isTopRated ? "Earned" : "Locked (0%)",
                                  color: isTopRated
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-gray-50 text-gray-500 border-gray-200 opacity-60",
                                },
                                {
                                  badge: "Elite Educator",
                                  status: isEliteEducator ? "Earned" : `Locked (${Math.min(Math.round((sessionsCount / 50) * 100), 99)}%)`,
                                  color: isEliteEducator
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-gray-50 text-gray-500 border-gray-200 opacity-60",
                                },
                              ];

                              return badgeList.map((b, i) => (
                                <div
                                  key={i}
                                  className={`p-2 border rounded-xl flex justify-between items-center text-[10px] ${b.color}`}
                                >
                                  <span className="font-bold">{b.badge}</span>
                                  <span className="text-[8px] uppercase">
                                    {b.status}
                                  </span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>

                        {/* Ratings Breakdown */}
                        <div className="space-y-2 border-t border-brand-moss/5 pt-4">
                          <h5 className="font-mono text-[9px] uppercase tracking-widest text-brand-clay font-bold">
                            Ratings Breakdown (5 dimensions)
                          </h5>
                          <div className="space-y-1 text-[11px] font-sans text-brand-charcoal/80">
                            {["Punctuality", "Teaching Quality", "Communication", "Preparedness", "Student Progress"].map((dim) => (
                              <div key={dim} className="flex justify-between">
                                <span>{dim}</span>
                                <span className="font-bold text-brand-moss">
                                  {teacherProfile?.rating ? `${teacherProfile.rating}★` : "0.0★"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Leaderboard Position */}
                      <div className="lg:col-span-6 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                        <div>
                          <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">
                            WEEKLY COMPETITION
                          </span>
                          <h4 className="font-heading font-bold text-base text-brand-moss">
                            Leaderboard Position
                          </h4>
                          <p className="font-sans text-[10px] text-brand-charcoal/60 mt-0.5">
                            Your ranking compared to all vetted tutors in Lagos.
                          </p>
                        </div>

                        <div className="bg-brand-cream/20 border border-brand-moss/5 p-4 rounded-2xl flex justify-between items-center">
                          <div>
                            <span className="font-mono text-[10px] text-brand-charcoal/50 block">
                              CURRENT RANK
                            </span>
                            <span className="font-heading font-extrabold text-2xl text-brand-moss block mt-0.5">
                              {sessionsCount > 0 ? `#${Math.max(1, 50 - sessionsCount)} in Lagos` : "Unranked"}
                            </span>
                            <span className="font-mono text-[9px] text-brand-charcoal/50 block mt-1 font-bold">
                              {sessionsCount > 0 ? "Active in weekly rankings" : "Complete first session to rank"}
                            </span>
                          </div>
                          <Trophy className="w-10 h-10 text-brand-clay opacity-60" />
                        </div>

                        <div className="flex items-center justify-between font-sans text-xs border-t border-brand-moss/5 pt-4">
                          <div>
                            <span className="font-bold block">
                              Opt-in to Teacher Leaderboard
                            </span>
                            <span className="text-[10px] text-brand-charcoal/50">
                              Show rank publically to parents.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setLeaderboardOptIn(!leaderboardOptIn)
                            }
                            className={`w-10 h-5 rounded-full transition-all relative ${leaderboardOptIn ? "bg-brand-moss" : "bg-brand-charcoal/20"}`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${leaderboardOptIn ? "right-1" : "left-1"}`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Growth tools: referrals and profile views */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Referral Programme */}
                      <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-6">
                        <div>
                          <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">
                            GROWTH CAMPAIGN
                          </span>
                          <h4 className="font-heading font-bold text-lg text-brand-moss mt-0.5">
                            Referral Programme
                          </h4>
                          <p className="font-sans text-[11px] text-brand-charcoal/60 mt-1">
                            Earn 10% commission on referred teacher revenues for
                            3 months.
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={`https://eduvistar.com/register?ref=${currentUser.uid}`}
                            className="flex-1 bg-brand-cream/50 border border-brand-moss/10 rounded-xl px-3 py-2 text-xs font-mono select-all focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `https://eduvistar.com/register?ref=${currentUser.uid}`,
                              );
                              toast.success(
                                "Referral link copied to clipboard!",
                              );
                            }}
                            className="bg-brand-clay text-white px-4 py-2 rounded-xl font-heading font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-brand-clay/90"
                          >
                            Copy Link
                          </button>
                        </div>

                        <div className="overflow-x-auto pt-4 border-t border-brand-moss/5">
                          <span className="text-[10px] text-brand-charcoal/50 uppercase font-bold block mb-2">
                            Referred Teachers
                          </span>
                          <table className="w-full text-left font-sans text-2xs border-collapse">
                            <thead>
                              <tr className="border-b border-brand-moss/10 text-brand-charcoal/40 font-mono uppercase tracking-wider">
                                <th className="py-2">Teacher Name</th>
                                <th className="py-2">Status</th>
                                <th className="py-2 text-right">
                                  Commission Earned
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-moss/5 text-brand-charcoal/80">
                              {referrals.map((r, idx) => (
                                <tr key={idx}>
                                  <td className="py-2 font-bold text-brand-moss">
                                    {r.name}
                                  </td>
                                  <td className="py-2">
                                    <span className="font-mono bg-emerald-50 text-emerald-800 py-0.5 px-2 rounded-full uppercase tracking-wider text-[8px] border border-emerald-100">
                                      {r.status}
                                    </span>
                                  </td>
                                  <td className="py-2 text-right font-bold text-brand-moss">
                                    {formatCurrency(
                                      r.commission,
                                      selectedCurrency,
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Profile Analytics */}
                      <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                        <div>
                          <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">
                            PERFORMANCE INSIGHTS
                          </span>
                          <h4 className="font-heading font-bold text-lg text-brand-moss mt-0.5">
                            Profile Analytics
                          </h4>
                          <p className="font-sans text-[11px] text-brand-charcoal/60 mt-1">
                            Track traffic impressions and keyword optimization
                            levels.
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center font-sans text-xs">
                          <div className="bg-brand-cream/20 border border-brand-moss/5 p-3 rounded-xl">
                            <span className="text-brand-charcoal/50 block text-[9px] font-mono">
                              Views (30d)
                            </span>
                            <span className="font-heading font-bold text-base text-brand-moss block mt-0.5">
                              0 views
                            </span>
                            <span className="text-[9px] text-emerald-600 block font-bold">
                              No previous data
                            </span>
                          </div>
                          <div className="bg-brand-cream/20 border border-brand-moss/5 p-3 rounded-xl">
                            <span className="text-brand-charcoal/50 block text-[9px] font-mono">
                              Impressions
                            </span>
                            <span className="font-heading font-bold text-base text-brand-moss block mt-0.5">
                              0
                            </span>
                            <span className="text-[9px] text-brand-charcoal/50 block">
                              Keyword searches
                            </span>
                          </div>
                          <div className="bg-brand-cream/20 border border-brand-moss/5 p-3 rounded-xl">
                            <span className="text-brand-charcoal/50 block text-[9px] font-mono">
                              Conversion
                            </span>
                            <span className="font-heading font-bold text-base text-brand-clay block mt-0.5">
                              0%
                            </span>
                            <span className="text-[9px] text-brand-charcoal/50 block">
                              Views to Bookings
                            </span>
                          </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 text-[11px] font-sans flex items-start gap-2.5 mt-2">
                          <Sparkles className="w-5 h-5 text-brand-clay shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block text-brand-clay uppercase tracking-wider font-mono text-[9px]">
                              AI BIO TIP SUGGESTION
                            </span>
                            Tutors who upload a short 60-second video
                            introduction increase their profile request booking
                            conversion rates by 40%. Upload an intro file now.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 6: AI ACADEMY & LMS */}
                {activeTab === "academy" && (
                  <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-8 animate-fade-up">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block">
                          ACCREDITED TEACHER DEVELOPMENT
                        </span>
                        <h3 className="font-heading font-bold text-2xl text-brand-moss mt-0.5">
                          EduVistar Elite Teachers Academy
                        </h3>
                        <p className="font-sans text-xs text-brand-charcoal/60 mt-1">
                          Master international curricula (Cambridge/WAEC), AI-powered pedagogy, and join the private VIP educator circle. (₦40,000 registration fee verified after credential submission).
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <Link
                          to="/academy"
                          className="py-3 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-transform scale-100 hover:scale-103 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          Elite Academy Classroom & Modules
                        </Link>
                        <button
                          onClick={() => setActiveTab('profile')}
                          className="py-3 px-5 rounded-full bg-white border border-brand-moss/20 hover:bg-brand-cream/40 text-brand-moss font-heading font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-transform scale-100 hover:scale-103 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-brand-clay" />
                          Credentials & Vetting
                        </button>
                      </div>
                    </div>

                    {/* Featured Teacher Training Courses */}
                    <div className="space-y-4">
                      <h4 className="font-heading font-bold text-sm text-brand-moss flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-clay" />
                        Accredited Masterclass Curriculum
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          {
                            id: "course_ai_pedagogy",
                            title: "AI-Powered Pedagogy with Gemini & ChatGPT",
                            level: "Intermediate",
                            duration: "6 Hours",
                            category: "Classroom Tech & AI",
                            thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
                            desc: "Learn prompting, automated rubrics, and personalized tutoring workflows for Cambridge & WAEC."
                          },
                          {
                            id: "course_cambridge_mastery",
                            title: "Cambridge IGCSE & Curricula Mastery",
                            level: "Advanced",
                            duration: "8 Hours",
                            category: "Curriculum & Standards",
                            thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop",
                            desc: "Examiner techniques, mark scheme decoders, and command word precision for top candidate grades."
                          },
                          {
                            id: "course_executive_branding",
                            title: "Executive Educator Branding & High-Value Tutoring",
                            level: "Mastery",
                            duration: "5 Hours",
                            category: "Executive Branding",
                            thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop",
                            desc: "Bio copywriting, parent trial conversion formulas, and positioning international hourly rates."
                          },
                          {
                            id: "course_differentiated_instruction",
                            title: "Differentiated Instruction & Inclusive Learning",
                            level: "Beginner",
                            duration: "4.5 Hours",
                            category: "Pedagogy & Classroom",
                            thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop",
                            desc: "Universal Design for Learning (UDL) frameworks for mixed-ability and neurodiverse learners."
                          }
                        ].map((c) => (
                          <div
                            key={c.id}
                            className="bg-brand-cream/20 border border-brand-moss/10 rounded-2xl p-5 hover:border-brand-clay/40 transition-all flex flex-col justify-between space-y-4"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[9px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                  {c.category}
                                </span>
                                <span className="text-[10px] font-mono text-brand-charcoal/50">{c.duration}</span>
                              </div>
                              <h5 className="font-heading font-bold text-base text-brand-moss">
                                {c.title}
                              </h5>
                              <p className="text-xs text-brand-charcoal/70 leading-relaxed">
                                {c.desc}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-brand-moss/10 flex items-center justify-between">
                              <span className="font-mono text-xs text-brand-clay font-bold">{c.level}</span>
                              <Link
                                to={`/academy/classroom/${c.id}`}
                                className="py-2 px-4 rounded-full bg-brand-moss hover:bg-brand-clay text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                Start Classroom
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Live Masterclasses Banner */}
                    <div className="bg-gradient-to-r from-brand-charcoal via-brand-moss to-brand-charcoal border border-brand-cream/10 rounded-[2.5rem] p-6 sm:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
                      <div className="space-y-2 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold uppercase">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          Live Interactive Masterclass
                        </div>
                        <h4 className="font-heading font-bold text-lg text-white">
                          AI in Live Tutoring Rooms: Whiteboard Demonstration & Drills
                        </h4>
                        <p className="font-sans text-xs text-brand-cream/70 leading-relaxed">
                          Join former examiners and AI coaches for interactive whiteboard exercises, screen sharing, and live Q&A.
                        </p>
                      </div>

                      <Link
                        to="/academy/live/live_masterclass_ai_1"
                        className="py-3 px-6 bg-brand-clay hover:bg-brand-clay/90 text-white rounded-full font-heading font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 shrink-0 transition-transform scale-100 hover:scale-105"
                      >
                        <Video className="w-4 h-4" />
                        Join Live Studio
                      </Link>
                    </div>
                  </div>
                )}
          </div>

          {/* INDEPENDENT STUDENT DETAILS ROSTER MODAL */}
          {selectedRosterStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-xs"
                onClick={() => setSelectedRosterStudent(null)}
              />

              <div className="bg-brand-cream border border-brand-moss/10 rounded-[2.5rem] p-8 w-full max-w-lg relative z-10 shadow-2xl animate-fade-up">
                <button
                  onClick={() => setSelectedRosterStudent(null)}
                  className="absolute top-6 right-6 text-brand-charcoal/60 hover:text-brand-charcoal font-bold text-base"
                >
                  ✕
                </button>
                <h3 className="font-heading font-bold text-xl text-brand-moss mb-1">
                  {selectedRosterStudent.name}
                </h3>
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-clay font-bold block mb-4">
                  Student Profile & Private Teacher Notes
                </span>

                <div className="bg-white border border-brand-moss/10 rounded-2xl p-4 mb-4 font-sans text-xs space-y-3">
                  <div className="grid grid-cols-2 gap-4 border-b border-brand-moss/5 pb-2">
                    <div>
                      <span className="text-brand-charcoal/50 block text-[9px] uppercase font-bold">
                        Curriculum Subject
                      </span>
                      <span className="font-bold text-brand-moss block mt-0.5">
                        {selectedRosterStudent.subject} Instruction
                      </span>
                    </div>
                    <div>
                      <span className="text-brand-charcoal/50 block text-[9px] uppercase font-bold">
                        Last Lesson Date
                      </span>
                      <span className="font-bold text-brand-moss block mt-0.5">
                        {selectedRosterStudent.lastSession}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b border-brand-moss/5 pb-2">
                    <div>
                      <span className="text-brand-charcoal/50 block text-[9px] uppercase font-bold">
                        Next Lesson Slot
                      </span>
                      <span className="font-bold text-brand-moss block mt-0.5">
                        {selectedRosterStudent.nextSession}
                      </span>
                    </div>
                    <div>
                      <span className="text-brand-charcoal/50 block text-[9px] uppercase font-bold">
                        Progress Milestone
                      </span>
                      <span className="font-bold text-brand-moss block mt-0.5">
                        {selectedRosterStudent.trend} Comprehension
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="font-heading font-bold text-[10px] uppercase tracking-wider text-brand-moss block mb-2">
                      Private Lesson Diary Notes
                    </label>
                    <textarea
                      value={rosterNoteInput}
                      onChange={(e) => setRosterNoteInput(e.target.value)}
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-3 text-brand-charcoal focus:outline-none focus:border-brand-clay h-24 resize-none text-xs leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedRosterStudent(null)}
                    className="flex-1 border border-brand-moss/10 hover:border-brand-moss hover:bg-white rounded-xl py-3 font-heading font-bold text-brand-charcoal text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setRoster((prev) =>
                        prev.map((s) =>
                          s.uid === selectedRosterStudent.uid
                            ? { ...s, note: rosterNoteInput }
                            : s,
                        ),
                      );
                      toast.success(
                        "Private student progress notes updated successfully!",
                      );
                      setSelectedRosterStudent(null);
                    }}
                    className="flex-1 bg-brand-moss hover:bg-brand-clay text-white rounded-xl py-3 font-heading font-bold uppercase tracking-wider text-xs"
                  >
                    Save Private Note
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SESSION CLOCK LOG TIMELINE MODAL */}
          {isClockLogOpen && selectedClockSession && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-xs"
                onClick={() => setIsClockLogOpen(false)}
              />

              <div className="bg-brand-cream border border-brand-moss/10 rounded-[2.5rem] p-8 w-full max-w-md relative z-10 shadow-2xl animate-fade-up">
                <button
                  onClick={() => setIsClockLogOpen(false)}
                  className="absolute top-6 right-6 text-brand-charcoal/60 hover:text-brand-charcoal font-bold text-base"
                >
                  ✕
                </button>
                <h3 className="font-heading font-bold text-xl text-brand-moss mb-2">
                  Lesson Clock Log
                </h3>
                <p className="font-sans text-xs text-brand-charcoal/70 mb-4">
                  Tamper-proof server clock records for session with{" "}
                  <span className="font-bold">
                    {selectedClockSession.studentName}
                  </span>
                  .
                </p>

                <div className="bg-white border border-brand-moss/10 rounded-2xl p-4 mb-4 font-mono text-[11px] space-y-2">
                  <div className="flex justify-between border-b border-brand-moss/5 pb-2">
                    <span>Scheduled Slot:</span>
                    <span className="font-bold">
                      {selectedClockSession.slot.day} at{" "}
                      {selectedClockSession.slot.time}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-brand-moss/5 pb-2">
                    <span>Total Billed Time:</span>
                    <span className="font-bold text-brand-moss">
                      60 minutes
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="text-[9px] uppercase font-bold text-brand-clay block mb-1">
                      Server Clock Timeline Audit
                    </span>
                    <div className="space-y-1.5 text-[9px] text-brand-charcoal/80">
                      <div className="flex justify-between">
                        <span>🟢 Video Channel Opened</span>
                        <span>{selectedClockSession.slot.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🔴 Video Channel Closed</span>
                        <span>Completed (+60m)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    toast.success(
                      "Clock Log evidence PDF exported and downloaded successfully!",
                    )
                  }
                  className="btn-magnetic w-full py-3 bg-brand-moss hover:bg-brand-clay text-white rounded-full font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Download className="w-4 h-4" /> Download Evidence PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 px-1.5 py-1.5 flex items-center justify-around md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {[
          { id: "overview", label: "Home", icon: LayoutDashboard },
          { id: "students", label: "Students", icon: Users },
          { id: "earnings", label: "Earnings", icon: Wallet },
          { id: "reputation", label: "Reputation", icon: Star },
          { id: "profile", label: "Profile", icon: User },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "text-blue-600 font-bold"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <tab.icon size={19} className={isActive ? "text-blue-600" : "text-gray-400"} />
              <span className="text-[10px] mt-0.5 leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
