import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { MessageCircle, Crown, Cpu, Award, BookOpen, Star, CheckCircle, ChevronRight, HelpCircle, Lock, Play, ShieldAlert, Sparkles, Send, MessageSquare, Loader, Download, Users, PlusCircle, CreditCard, Clock, Globe, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import EliteAcademySignupModal from './EliteAcademySignupModal';

export default function Academy({ 
  currentUser, 
  selectedCurrency, 
  formatCurrency, 
  convertMinor,
  onUnlockBadge,
  onRegisterClick
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('modules'); // 'modules', 'roleplay', 'forum', 'certificate'
  const [enrolled, setEnrolled] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [level4Completed, setLevel4Completed] = useState(false);
  const [isVipTeacher, setIsVipTeacher] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  
  // Paywall states
  const [billingPlan, setBillingPlan] = useState('onboarding'); // 'onboarding'
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paymentStep, setPaymentStep] = useState('idle'); // 'idle', 'processing', 'otp', 'success'
  const [paymentError, setPaymentError] = useState('');

  // Onboarding Form States
  const [onboardingStep, setOnboardingStep] = useState('form'); // 'form' or 'payment'
  const [academyWhatsapp, setAcademyWhatsapp] = useState('');
  const [academySubjects, setAcademySubjects] = useState('');
  const [academyExperience, setAcademyExperience] = useState('WAEC');
  const [academyMotivation, setAcademyMotivation] = useState('');
  
  // Progress states
  const [activeModule, setActiveModule] = useState(1);
  const [completedModules, setCompletedModules] = useState([]);
  const [xp, setXp] = useState(0);
  
  // Video Simulator states
  const [watchingVideo, setWatchingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoWatched, setVideoWatched] = useState({}); // moduleId -> boolean
  
  // Quiz states
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  
  // Roleplay simulator states
  const [selectedScenario, setSelectedScenario] = useState('classroom_distraction');
  const [roleplayMessages, setRoleplayMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Forum states
  const [forumThreads, setForumThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [forumLoading, setForumLoading] = useState(false);

  const API_BASE = '/api';
  const chatEndRef = useRef(null);

  // Elite Academy training curriculum modules
  const modules = [
    { 
      id: 1, 
      level: "L1",
      title: "Professional Foundation", 
      subtitle: "Build the Teacher",
      desc: "Establish the bedrock of your professional identity. This foundational level develops the mindset, ethics, emotional intelligence, and habits that distinguish exceptional teachers from average ones.",
      outcomes: [
        "Develop a clear professional identity and teaching philosophy",
        "Master communication strategies for students, parents, and colleagues",
        "Build emotional intelligence and resilience frameworks",
        "Establish productivity systems that sustain long-term excellence"
      ],
      modulesCount: "9 Modules",
      question: "What is the primary benefit of linking Notion databases directly with Google Classroom assignments?",
      options: [
        "Ensures parents and students have a single source of truth for syllabi, live lesson links, and grades.",
        "Speeds up internet latency during live Zoom video conferencing sessions.",
        "Automatically deletes old student messages from public servers after 24 hours."
      ]
    },
    { 
      id: 2, 
      level: "L2",
      title: "Instructional Mastery", 
      subtitle: "Build the Classroom",
      desc: "Transform your teaching practice through evidence-based instructional design, modern assessment strategies, and technology integration. Build classrooms where every student thrives.",
      outcomes: [
        "Design engaging, differentiated lessons backed by learning science",
        "Implement formative and summative assessment with precision",
        "Integrate AI tools ethically and effectively into your classroom",
        "Create inclusive environments where every learner succeeds"
      ],
      modulesCount: "7 Modules",
      question: "Which technique yields the best lesson planning templates using ChatGPT or Gemini?",
      options: [
        "Supplying specific curriculum criteria (like WAEC codes), student grade levels, and structured grading rubrics.",
        "Asking the AI to generate a random 10-week schedule without subject details.",
        "Injecting multiple unrelated questions in a single prompt to save processing time."
      ]
    },
    { 
      id: 3, 
      level: "L3",
      title: "Innovation & Creativity", 
      subtitle: "Build the Future",
      desc: "Step into the frontier of educational innovation. Learn to think like a designer, create compelling educational content, explore emerging technologies, and launch educational entrepreneurship ventures.",
      outcomes: [
        "Apply design thinking to transform learning experiences",
        "Build and monetize educational content across digital platforms",
        "Lead innovation initiatives in your school or organization",
        "Launch an educational product, program, or service"
      ],
      modulesCount: "6 Modules",
      question: "When record-syncing classroom lessons via Loom or HeyGen, what is the best pedagogical setup?",
      options: [
        "Keeping lectures under 5 minutes, focusing on single core concepts, and attaching interactive pre-tests.",
        "Recording uninterrupted 2-hour long lectures to increase video views.",
        "Using dynamic filters and background noise to look informal."
      ]
    },
    { 
      id: 4, 
      level: "L4",
      title: "Leadership & Influence", 
      subtitle: "Build the Leader",
      desc: "Develop the executive presence, mentorship skills, and leadership capacity to influence education at the school, district, and systemic level. Become the teacher other teachers look to.",
      outcomes: [
        "Lead instructional improvement initiatives with confidence",
        "Build and sustain a powerful professional brand",
        "Navigate conflict and policy with strategic intelligence",
        "Develop public speaking skills for stages, panels, and media"
      ],
      modulesCount: "7 Modules",
      question: "To maintain professional online communication with parents, what standard is recommended?",
      options: [
        "Sending structured weekly summaries, maintaining good video lighting/eye-contact, and resolving disputes calmly.",
        "Discussing student performance issues on public social media groups.",
        "Ignoring emails for more than 5 business days to establish demand limits."
      ]
    },
    { 
      id: 5, 
      level: "L5",
      title: "Global Educator Pathway", 
      subtitle: "Build Global Influence",
      desc: "Take your expertise to the world stage. Conduct research, publish your ideas, access international opportunities, and build the professional visibility that positions you as a globally respected educator.",
      outcomes: [
        "Conduct and publish original educational research",
        "Access international teaching and speaking opportunities",
        "Build a global professional network and online presence",
        "Position yourself as a thought leader in global education"
      ],
      modulesCount: "7 Modules",
      question: "Which factor is most critical when positioning your tutoring rates globally?",
      options: [
        "Aligning rates with high-status certifications, highlighting specialized curriculum expertise, and displaying verified parent reviews.",
        "Undercutting every other educator to trigger a price war.",
        "Refusing to list rates publicly and negotiating custom pricing with each client."
      ]
    },
    { 
      id: 6, 
      level: "L6",
      title: "Legacy & Systems Building", 
      subtitle: "Build the Future Beyond Yourself",
      desc: "The pinnacle of the transformation journey. Design systems, build communities, launch consultancies, and create the institutional legacy that outlives any single classroom — a future shaped by your influence.",
      outcomes: [
        "Design educational systems and frameworks that scale",
        "Launch an educational consultancy or training organization",
        "Create social impact through community-centered programs",
        "Build a lasting legacy in the education ecosystem"
      ],
      modulesCount: "6 Modules",
      question: "What is the most sustainable way to grow your student base on the platform?",
      options: [
        "Optimising profile SEO keywords, sharing copyable parent referral links, and building high-trust verified reviews.",
        "Creating multiple fake accounts to post self-reviews.",
        "Placing large advertising banners on unrelated websites."
      ]
    }
  ];

  const getAuthHeaders = () => {
    const token = localStorage.getItem('eduvistar_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  
  // Check Level 4 completion
  useEffect(() => {
    const hasL4 = [1, 2, 3, 4].every(m => completedModules.includes(m));
    if (hasL4 && !level4Completed) {
      setLevel4Completed(true);
      fetch(`${API_BASE}/academy/complete-level4`, {
        method: 'POST',
        headers: getAuthHeaders()
      }).catch(() => {});
    }
  }, [completedModules, level4Completed]);

  // Fetch Academy enrollment & progress status
  const fetchStatus = async () => {
    if (!currentUser || currentUser.role !== 'Teacher') {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/academy/status/${currentUser.uid}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setEnrolled(data.enrolled);
        setCompletedModules(data.completedModules || []);
        setXp(data.xp || 0);
      }
    } catch (err) {
      console.warn("API offline, utilizing local simulation for academy status:", err);
      // Fallback local persistence load
      const savedProgress = localStorage.getItem(`academy_progress_${currentUser.uid}`);
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        setEnrolled(parsed.enrolled);
        setCompletedModules(parsed.completedModules || []);
        setXp(parsed.xp || 0);
      } else {
        // Seed some progress for Adebayo Okafor
        if (currentUser.uid === 'teacher_1') {
          setEnrolled(true);
          setCompletedModules([1, 2, 3]);
          setXp(600);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [currentUser]);

  // Fetch Forum threads
  const fetchForum = async () => {
    setForumLoading(true);
    try {
      const res = await fetch(`${API_BASE}/academy/forum`);
      if (res.ok) {
        const data = await res.json();
        setForumThreads(data);
      }
    } catch (err) {
      console.warn("Forum API offline, using local storage cache:", err);
      const cached = localStorage.getItem('academy_forum_posts');
      if (cached) {
        setForumThreads(JSON.parse(cached));
      } else {
        const initialForum = [
          {
            id: "thread_1",
            title: "Tips for WAEC Biology syllabus preparation",
            content: "Has anyone integrated Notion dashboards to track student drawings of the nervous system? Students struggle with cell division structures.",
            authorName: "Mr. Adebayo Okafor",
            authorRole: "Teacher",
            createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
            likes: 4,
            comments: [
              { id: "c_1", authorName: "Ms. Aminata Diallo", content: "Yes, I created a Notion table where students drop their sketches. Highly recommended!", createdAt: new Date().toISOString() }
            ]
          },
          {
            id: "thread_2",
            title: "Best practices for pricing IGCSE math coaching",
            content: "Should I structure my rates differently for weekend intense study groups vs standard weekly homework reviews? What are parents expecting?",
            authorName: "Mr. Kofi Mensah",
            authorRole: "Teacher",
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
            likes: 6,
            comments: []
          }
        ];
        setForumThreads(initialForum);
        localStorage.setItem('academy_forum_posts', JSON.stringify(initialForum));
      }
    } finally {
      setForumLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'forum') {
      fetchForum();
    }
  }, [activeTab]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roleplayMessages]);

  // Handle proof of payment upload
  const handleProofUpload = async (e) => {
    e.preventDefault();
    setPaymentError("");
    setPaymentStep('processing');
    
    // Simulate upload delay and verification
    setTimeout(() => {
      setEnrolled(true);
      setPaymentStep('success');
      toast.success("Proof of payment uploaded successfully!");
      
      const localCache = localStorage.getItem(`academy_progress_${currentUser.uid}`) || '{}';
      const updated = { ...JSON.parse(localCache), enrolled: true, completedModules: [], xp: 0 };
      localStorage.setItem(`academy_progress_${currentUser.uid}`, JSON.stringify(updated));
      
      // Redirect to the Elite Teachers Academy LMS
      navigate('/academy');
    }, 1500);
  };

  const handleVerifyOtp = () => {
    setPaymentStep('processing');
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/academy/enroll`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            userId: currentUser.uid,
            plan: billingPlan,
            cardDetails: { name: cardName, number: cardNumber.slice(-4) }
          })
        });

        if (res.ok) {
          setEnrolled(true);
          setPaymentStep('success');
          // Update profile in local storage
          const localCache = localStorage.getItem(`academy_progress_${currentUser.uid}`) || '{}';
          const updated = { ...JSON.parse(localCache), enrolled: true, completedModules: [], xp: 0 };
          localStorage.setItem(`academy_progress_${currentUser.uid}`, JSON.stringify(updated));
        } else {
          setPaymentError("Payment was rejected by bank issuer. Check card balance.");
          setPaymentStep('idle');
        }
      } catch (err) {
        // Local simulation success
        setEnrolled(true);
        setPaymentStep('success');
        const localCache = localStorage.getItem(`academy_progress_${currentUser.uid}`) || '{}';
        const updated = { ...JSON.parse(localCache), enrolled: true, completedModules: [], xp: 0 };
        localStorage.setItem(`academy_progress_${currentUser.uid}`, JSON.stringify(updated));
      }
    }, 2000);
  };

  // Simulate Video player course watching
  const startVideoWatch = () => {
    setWatchingVideo(true);
    setVideoProgress(0);
    
    const interval = setInterval(() => {
      setVideoProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setWatchingVideo(false);
          setVideoWatched(v => ({ ...v, [activeModule]: true }));
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  // Submit Quiz answer
  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    if (quizAnswer === null) return;
    setQuizSubmitted(true);

    const isCorrect = (quizAnswer === 0);
    setQuizResult(isCorrect);

    if (isCorrect) {
      try {
        const res = await fetch(`${API_BASE}/academy/submit-quiz`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            userId: currentUser.uid,
            moduleId: activeModule,
            answer: quizAnswer
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (!completedModules.includes(activeModule)) {
            setCompletedModules(prev => [...prev, activeModule]);
            setXp(prev => prev + 200);
          }
          if (data.completedCount >= 6 || completedModules.length + 1 >= 6) {
            onUnlockBadge('badge-ai-cert');
          }
        }
      } catch (err) {
        // Fallback local
        if (!completedModules.includes(activeModule)) {
          setCompletedModules(prev => [...prev, activeModule]);
          setXp(prev => prev + 200);
        }
        if (completedModules.length + 1 >= 6) {
          onUnlockBadge('badge-ai-cert');
        }
        // Save locally
        const localCache = localStorage.getItem(`academy_progress_${currentUser.uid}`) || '{}';
        const parsed = JSON.parse(localCache);
        const updated = {
          enrolled: true,
          completedModules: [...new Set([...(parsed.completedModules || []), activeModule])],
          xp: (parsed.xp || 0) + (parsed.completedModules?.includes(activeModule) ? 0 : 200)
        };
        localStorage.setItem(`academy_progress_${currentUser.uid}`, JSON.stringify(updated));
      }
    }
  };

  const handleNextModule = () => {
    setQuizAnswer(null);
    setQuizSubmitted(false);
    setQuizResult(null);
    setActiveModule(prev => Math.min(prev + 1, 6));
  };

  // Submit chat message to Roleplay API
  const handleSendRoleplay = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = { sender: 'user', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setRoleplayMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/academy/roleplay`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          scenario: selectedScenario,
          message: userMsg.text,
          history: roleplayMessages
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRoleplayMessages(prev => [...prev, {
          sender: 'assistant',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (err) {
      console.error("Roleplay API connection failed, simulating reply", err);
      // Fallback simulation
      setTimeout(() => {
        let text = "Alright. Show me how that works next class.";
        if (selectedScenario === 'classroom_distraction') {
          text = "[Student Chidi]: Look, teacher, I get it. I'll focus now. Just help me out on this fraction part first, please.";
        } else if (selectedScenario === 'parent_conflict') {
          text = "[Parent Mrs. Bello]: I see. A weekly performance summary is a step in the right direction. I'll monitor her study patterns at home.";
        } else if (selectedScenario === 'syllabus_alignment') {
          text = "[Principal Mensah]: Very well. Your outline references are satisfactory. I expect a copy of the monthly audit report.";
        }
        setRoleplayMessages(prev => [...prev, {
          sender: 'assistant',
          text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 1000);
    } finally {
      setChatLoading(false);
    }
  };

  // Clear roleplay history when scenario changes
  useEffect(() => {
    setRoleplayMessages([
      {
        sender: 'assistant',
        text: selectedScenario === 'classroom_distraction' 
          ? "Hi, I am Chidi. *Looks down at phone screen, clicking rapidly.* Yeah? Did you say something about algebra?"
          : selectedScenario === 'parent_conflict'
          ? "Hello. I am Mrs. Bello, Ngozi's mother. I want to talk about why her scores dropped on this last assessment. I am paying for results."
          : "Good afternoon. I am Principal Mensah. I am auditing your pedagogical syllabus files today. Let's start with your Lesson Setup outlines.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [selectedScenario]);

  // Create forum thread
  const handleCreateForumPost = async (e) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/academy/forum`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent
        })
      });
      if (res.ok) {
        setNewPostTitle('');
        setNewPostContent('');
        fetchForum();
      }
    } catch (err) {
      // Local fallback
      const newThread = {
        id: `thread_${Date.now()}`,
        title: newPostTitle,
        content: newPostContent,
        authorName: currentUser.displayName || "Elite Tutor",
        authorRole: "Teacher",
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: []
      };
      const updated = [newThread, ...forumThreads];
      setForumThreads(updated);
      localStorage.setItem('academy_forum_posts', JSON.stringify(updated));
      setNewPostTitle('');
      setNewPostContent('');
    }
  };

  // Create comment on forum thread
  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!newCommentContent.trim() || !activeThread) return;

    try {
      const res = await fetch(`${API_BASE}/academy/forum`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          parentId: activeThread.id,
          content: newCommentContent
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveThread(data.post);
        setNewCommentContent('');
        fetchForum();
      }
    } catch (err) {
      // Local fallback
      const updatedComments = [
        ...(activeThread.comments || []),
        {
          id: `comment_${Date.now()}`,
          authorName: currentUser.displayName || "Elite Tutor",
          content: newCommentContent,
          createdAt: new Date().toISOString()
        }
      ];
      const updatedThread = { ...activeThread, comments: updatedComments };
      setActiveThread(updatedThread);
      const updatedThreads = forumThreads.map(t => t.id === activeThread.id ? updatedThread : t);
      setForumThreads(updatedThreads);
      localStorage.setItem('academy_forum_posts', JSON.stringify(updatedThreads));
      setNewCommentContent('');
    }
  };

  // Convert NGN price to selected currency
  const getSubscriptionPrice = (period) => {
    const rawNgn = period === 'annual' ? 12000000 : 1500000; // NGN kobo
    const converted = convertMinor(rawNgn, selectedCurrency);
    return formatCurrency(converted, selectedCurrency);
  };

  const getAcademyFee = () => {
    const rawNgn = 2000000; // 20,000 NGN in kobo
    const converted = convertMinor(rawNgn, selectedCurrency);
    return formatCurrency(converted, selectedCurrency);
  };

  const hasCompletedCredentials = Boolean(
    currentUser?.verified ||
    currentUser?.isVetted ||
    currentUser?.vettingStatus === 'approved' ||
    currentUser?.govIdUrl ||
    currentUser?.degreeUrl ||
    (currentUser?.subjects && currentUser.subjects.length > 0 && currentUser?.rate > 0)
  );

  // General guest page showing program syllabus and subscription info
  if (!currentUser || currentUser.role !== 'Teacher') {
    return (
      <section id="academy" className="py-24 px-6 md:px-16 lg:px-24 bg-brand-charcoal text-brand-cream border-t border-brand-cream/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider mb-4">
              <Crown className="w-4 h-4 text-amber-300" />
              Elite Teachers Academy · VVIP Pathway
            </div>
            <h2 className="font-heading font-bold text-3xl sm:text-5xl tracking-tight text-white uppercase">
              The Transformation Pathway
            </h2>
            <div className="h-[2px] w-24 bg-brand-clay mx-auto my-6" />
            <p className="font-sans text-brand-cream/70 max-w-xl mx-auto text-sm leading-relaxed">
              Progress through distinct levels of mastery. Complete the on-platform verification exercise and curriculum modules to unlock official <strong>VVIP Elite Educator Access</strong>.
            </p>
          </div>

          {/* Curriculum grid overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {modules.map(mod => (
              <div key={mod.id} className="bg-brand-charcoal/50 border border-brand-cream/10 rounded-[2rem] p-6 hover:border-brand-clay/35 transition-colors relative flex flex-col">
                <div className="mb-2">
                  <span className="font-mono text-2xs text-brand-clay font-bold block">{mod.level}: {mod.title}</span>
                  <span className="font-heading font-bold text-lg text-white">{mod.subtitle}</span>
                </div>
                <p className="font-sans text-2xs text-brand-cream/60 leading-relaxed mb-4 flex-grow">{mod.desc}</p>
                
                <div className="mb-4">
                  <span className="font-mono text-[9px] text-brand-cream/40 uppercase block mb-2">KEY OUTCOMES:</span>
                  <ul className="space-y-1.5">
                    {mod.outcomes?.map((outcome, idx) => (
                      <li key={idx} className="font-sans text-[10px] text-brand-cream/80 flex items-start gap-1.5">
                        <span className="text-brand-clay mt-0.5">•</span>
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-brand-cream/5 border border-brand-cream/10 rounded-xl px-3 py-2 mt-auto flex justify-between items-center">
                  <span className="font-sans text-xs text-white font-medium">{mod.modulesCount}</span>
                  <button 
                    onClick={() => setIsSignupModalOpen(true)}
                    className="font-mono text-[9px] text-brand-clay uppercase cursor-pointer hover:underline font-bold"
                  >
                    Apply Now →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Registration CTA underneath grid */}
          <div className="text-center mb-16">
            <button 
              onClick={() => setIsSignupModalOpen(true)}
              className="inline-flex items-center gap-2.5 btn-magnetic py-4 px-10 bg-brand-clay hover:bg-brand-clay/90 rounded-full text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-brand-clay/20 transition-transform hover:scale-105 cursor-pointer"
            >
              <Crown className="w-5 h-5 text-amber-300" />
              Apply for Elite Teachers Academy (VVIP Access)
            </button>
          </div>

          {/* Why become an elite teacher */}
          <div className="mb-16 max-w-4xl mx-auto">
            <h3 className="font-heading font-bold text-2xl text-white text-center mb-8">Why Become an Elite VVIP Educator?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-brand-cream/5 border border-amber-400/20 rounded-[2.5rem] p-8 relative overflow-hidden">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-300/30 text-[10px] font-mono font-bold uppercase tracking-wider mb-4">
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  Elite (Grade A) · VVIP Teachers
                </div>
                <p className="font-sans text-xs text-brand-cream/80 leading-relaxed mb-4">
                  Verified credentials + completed Elite Academy masterclasses. <strong>Guaranteed rate floor of ₦100,000+ monthly tuition contracts per client.</strong>
                </p>
                <ul className="space-y-2 text-xs font-sans text-brand-cream/90">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Top-ranked placement on parent searches</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Official Elite Certified Accreditation badge</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Priority booking requests & VIP student matching</span>
                  </li>
                </ul>
              </div>

              <div className="bg-brand-cream/5 border border-brand-cream/10 rounded-[2.5rem] p-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-cream/70 border border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider mb-4">
                  <UserCheck className="w-3.5 h-3.5" />
                  Standard (Grade B) Teachers
                </div>
                <p className="font-sans text-xs text-brand-cream/70 leading-relaxed mb-4">
                  Standard document verification (NIN, School ID, LinkedIn profile). Standard marketplace listing with baseline rates.
                </p>
                <p className="font-sans text-xs text-brand-cream/50 leading-relaxed">
                  Teachers can upgrade to Grade A (VVIP) at any time by completing the Elite Teachers Academy modules and accreditation exercise.
                </p>
              </div>
            </div>

            {/* Seamless 4-step Onboarding Card */}
            <div className="bg-gradient-to-r from-brand-moss/30 via-brand-moss/10 to-brand-moss/30 border border-brand-cream/15 rounded-[2.5rem] p-8 md:p-10 space-y-6 text-center">
              <Sparkles className="w-8 h-8 text-amber-300 mx-auto" />
              <h3 className="font-heading font-bold text-xl text-white">How the Seamless Admission Works</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-left">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="font-mono text-[9px] text-amber-300 font-extrabold uppercase block mb-1">01. SIGN UP</span>
                  <h5 className="font-heading font-bold text-xs text-white">Academy Application</h5>
                  <p className="font-sans text-[11px] text-brand-cream/70 mt-1">Create your teacher portal profile in under 2 minutes.</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="font-mono text-[9px] text-amber-300 font-extrabold uppercase block mb-1">02. VERIFY ID</span>
                  <h5 className="font-heading font-bold text-xs text-white">Submit Credentials</h5>
                  <p className="font-sans text-[11px] text-brand-cream/70 mt-1">Upload ID & qualifications in your dashboard (Exercise 1).</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="font-mono text-[9px] text-amber-300 font-extrabold uppercase block mb-1">03. COURSEWORK</span>
                  <h5 className="font-heading font-bold text-xs text-white">Master Pedagogy</h5>
                  <p className="font-sans text-[11px] text-brand-cream/70 mt-1">Complete interactive modules, AI simulators & quizzes.</p>
                </div>

                <div className="bg-white/5 border border-amber-400/30 rounded-2xl p-4 bg-amber-400/5">
                  <span className="font-mono text-[9px] text-amber-300 font-extrabold uppercase block mb-1">04. VVIP ACCESS</span>
                  <h5 className="font-heading font-bold text-xs text-amber-300">Earn VVIP Badge</h5>
                  <p className="font-sans text-[11px] text-brand-cream/80 mt-1">Unlocked for top search placement & premium ₦100k+ contracts.</p>
                </div>
              </div>

              <button
                onClick={() => setIsSignupModalOpen(true)}
                className="inline-flex items-center gap-2 btn-magnetic py-3.5 px-8 bg-brand-clay hover:bg-brand-clay/90 rounded-full text-white font-bold uppercase tracking-wider text-xs shadow-lg shadow-brand-clay/20 transition-transform hover:scale-105 cursor-pointer"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal */}
        <EliteAcademySignupModal
          isOpen={isSignupModalOpen}
          onClose={() => setIsSignupModalOpen(false)}
          onOpenLogin={onRegisterClick}
        />
      </section>
    );
  }

  // Active Loading screen
  if (loading) {
    return (
      <section id="academy" className="py-24 bg-brand-charcoal text-brand-cream border-t border-brand-cream/10 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-brand-clay animate-spin" />
          <span className="font-mono text-2xs text-brand-cream/40 uppercase">Loading Academy Profile...</span>
        </div>
      </section>
    );
  }

  return (
    <section id="academy" className="py-24 px-6 md:px-16 lg:px-24 bg-brand-charcoal text-brand-cream border-t border-brand-cream/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        
        {/* Tab Header / Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16 border-b border-brand-cream/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
              <Crown className="w-3.5 h-3.5" />
              VVIP Professional Pathway
            </div>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white tracking-tight uppercase">ELITE TEACHERS ACADEMY</h2>
            <p className="font-sans text-2xs text-brand-cream/60 mt-1">
              Accredited pedagogy, AI lesson frameworks, international curricula, and verified VVIP certification.
            </p>
          </div>

          {enrolled && (
            <div className="flex items-center gap-2 bg-brand-cream/5 border border-brand-cream/10 rounded-full px-2.5 py-1.5 self-end md:self-auto overflow-x-auto whitespace-nowrap max-w-full scrollbar-none">
              {['modules', 'roleplay', 'forum', 'certificate'].map(tab => {
                const isCertLocked = tab === 'certificate' && completedModules.length < 6;
                return (
                  <button
                    key={tab}
                    disabled={isCertLocked}
                    onClick={() => setActiveTab(tab)}
                    className={`py-1.5 px-4 rounded-full font-mono text-[9px] uppercase tracking-wider font-bold shrink-0 transition-all duration-300 flex items-center gap-1 cursor-pointer ${
                      isCertLocked 
                        ? 'opacity-40 cursor-not-allowed text-brand-cream/30' 
                        : activeTab === tab
                        ? 'bg-brand-clay text-white'
                        : 'hover:bg-brand-cream/5 text-brand-cream/70'
                    }`}
                  >
                    {tab === 'certificate' && isCertLocked && <Lock className="w-2.5 h-2.5 mr-0.5" />}
                    {tab}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* --- STATE 1: CREDENTIALS VERIFICATION GATEWAY & ENROLLMENT --- */}
        {!enrolled ? (
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Step Progression Bar */}
            <div className="bg-brand-moss/20 border border-brand-cream/10 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-amber-300 font-bold block">
                    ELITE ACADEMY ONBOARDING STATUS
                  </span>
                  <h4 className="font-heading font-bold text-sm text-white mt-0.5">
                    {hasCompletedCredentials ? "Credentials Verified · Ready for Coursework" : "Step 2 Verification Exercise: Submit Dashboard Credentials"}
                  </h4>
                </div>
                <span className="font-mono text-xs px-3 py-1 rounded-full bg-white/10 text-white font-bold">
                  {hasCompletedCredentials ? "Stage 2 of 3 (Complete)" : "Stage 2 of 3 (In Progress)"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-heading font-bold text-xs text-white block">Step 1: Sign Up</span>
                    <span className="font-sans text-[10px] text-emerald-300">Account Active</span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-3 ${hasCompletedCredentials ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30 animate-pulse"}`}>
                  {hasCompletedCredentials ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-heading font-bold text-xs text-white block">Step 2: Submit Credentials</span>
                    <span className={`font-sans text-[10px] ${hasCompletedCredentials ? "text-emerald-300" : "text-amber-300 font-bold"}`}>
                      {hasCompletedCredentials ? "Credentials Submitted" : "Action Required in Dashboard"}
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                  <Crown className="w-5 h-5 text-brand-cream/40 shrink-0" />
                  <div>
                    <span className="font-heading font-bold text-xs text-white block">Step 3: VVIP Certification</span>
                    <span className="font-sans text-[10px] text-brand-cream/50">Unlocked upon course completion</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-6">
                <span className="font-mono text-[10px] text-brand-clay font-bold tracking-widest uppercase block">
                  VVIP ACCREDITATION PATHWAY
                </span>
                <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-white leading-tight">
                  Unlock The Gold "Elite Certified" Status & Direct ₦100,000+ Monthly Contracts
                </h3>
                
                <p className="font-sans text-xs text-brand-cream/70 leading-relaxed">
                  Parents and private institutions prioritize vetted educators with verified credentials. Completing the Academy training certifies you in Cambridge IGCSE, AI lesson design, and dispute management while giving you direct top search placement.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-heading font-bold text-white text-xs block">6 Curriculum Alignment Modules</span>
                      <span className="font-sans text-2xs text-brand-cream/50">Master Google Classroom, Notion setups, and AI lesson frameworks.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-heading font-bold text-white text-xs block">Gemini Roleplay Classroom Simulator</span>
                      <span className="font-sans text-2xs text-brand-cream/50">Practice parent communication, discipline, and engagement.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-heading font-bold text-white text-xs block">Verified Digital Certificate & VVIP Profile Badge</span>
                      <span className="font-sans text-2xs text-brand-cream/50">Embed a QR-verified badge directly on your public marketplace profile.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Column */}
              <div className="lg:col-span-5 bg-brand-charcoal border border-brand-cream/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl flex flex-col justify-center items-center text-center space-y-5">
                {!hasCompletedCredentials ? (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
                      <ShieldAlert className="w-7 h-7 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-lg text-white">First Verification Exercise Required</h4>
                      <p className="font-sans text-xs text-brand-cream/70 max-w-sm mt-2 leading-relaxed">
                        To maintain elite quality standards, teachers must upload their Government ID, qualification certificates (Degree/TRCN), and hourly rates in the dashboard before starting coursework.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/teacher')}
                      className="btn-magnetic w-full py-3.5 bg-brand-clay hover:bg-brand-clay/90 text-white rounded-full font-bold uppercase tracking-wider text-xs shadow-lg shadow-brand-clay/20 text-center flex items-center justify-center gap-2 transition-transform hover:scale-102 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Go to Dashboard Credentials</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                      <Crown className="w-7 h-7 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-lg text-white">Credentials Submitted!</h4>
                      <p className="font-sans text-xs text-brand-cream/80 max-w-sm mt-2 leading-relaxed">
                        You have completed your profile credentials. Click below to begin your Elite Academy coursework and unlock your official <strong>VVIP Access</strong>.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEnrolled(true);
                        toast.success("🎓 Welcome to Elite Teachers Academy! Beginning Module 1.");
                        const localCache = localStorage.getItem(`academy_progress_${currentUser.uid}`) || '{}';
                        const updated = { ...JSON.parse(localCache), enrolled: true, completedModules: [], xp: 0 };
                        localStorage.setItem(`academy_progress_${currentUser.uid}`, JSON.stringify(updated));
                      }}
                      className="btn-magnetic w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold uppercase tracking-wider text-xs shadow-lg shadow-emerald-600/20 text-center flex items-center justify-center gap-2 transition-transform hover:scale-102 cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      <span>Begin Academy Coursework</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* --- STATE 2: ENROLLED ACADEMY DASHBOARD --- */
          <div className="max-w-7xl mx-auto">
            
            {/* TABS CONTROLLER */}
            {activeTab === 'modules' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Modules list (Left side column) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Status header progress */}
                  <div className="flex justify-between items-center bg-brand-moss/10 border border-brand-cream/10 rounded-2xl p-4">
                    <span className="font-mono text-2xs uppercase text-brand-cream/60">ACADEMY PROGRESSION</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-brand-clay font-bold">{xp} XP</span>
                      <span className="text-brand-cream/20">|</span>
                      <span className="font-mono text-xs text-brand-cream/60">{completedModules.length}/6 Completed</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {modules.map(mod => {
                      const isActive = activeModule === mod.id;
                      const isDone = completedModules.includes(mod.id);
                      return (
                        <button
                          key={mod.id}
                          onClick={() => {
                            setActiveModule(mod.id);
                            setQuizAnswer(null);
                            setQuizSubmitted(false);
                            setQuizResult(null);
                          }}
                          className={`w-full py-4 px-5 rounded-2xl border text-left font-sans transition-all duration-300 flex justify-between items-center ${
                            isActive
                              ? 'border-brand-clay bg-brand-clay/5 ring-1 ring-brand-clay'
                              : 'border-brand-cream/10 bg-brand-charcoal/50 hover:border-brand-cream/20'
                          }`}
                        >
                          <div className="space-y-1">
                            <span className="font-mono text-[9px] uppercase tracking-wider text-brand-cream/40">Module 0{mod.id}</span>
                            <span className="font-heading font-bold text-sm text-white block">{mod.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isDone && (
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-[9px] font-bold">
                                ✓
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-brand-cream/30" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Workspace area (Right side active simulator panel) */}
                <div className="lg:col-span-7 bg-brand-charcoal border border-brand-cream/10 rounded-[2.5rem] p-6 shadow-xl space-y-6">
                  
                  {/* Module details */}
                  <div className="space-y-2 border-b border-brand-cream/10 pb-4">
                    <span className="font-mono text-[9px] text-brand-clay tracking-widest block uppercase">MODULE 0{activeModule} // WORKSPACE</span>
                    <h4 className="font-heading font-bold text-xl text-white">{modules[activeModule - 1].title}</h4>
                    <p className="font-sans text-xs text-brand-cream/70 leading-relaxed">
                      {modules[activeModule - 1].desc}
                    </p>
                  </div>

                  {/* Video buff module simulator */}
                  {!videoWatched[activeModule] && !completedModules.includes(activeModule) ? (
                    <div className="bg-brand-cream/5 border border-brand-cream/10 rounded-3xl p-8 text-center space-y-5">
                      <Play className="w-10 h-10 text-brand-clay mx-auto fill-brand-clay/10" />
                      <h4 className="font-heading font-bold text-sm text-white">Pedagogical Training Video Session</h4>
                      <p className="font-sans text-2xs text-brand-cream/60 max-w-md mx-auto">
                        To unlock the validation exam quiz for this module, you must watch the interactive instructional video covering: <span className="font-bold text-white">{modules[activeModule - 1].title}</span>.
                      </p>
                      
                      {watchingVideo ? (
                        <div className="space-y-3 max-w-xs mx-auto">
                          <div className="w-full bg-brand-cream/10 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-brand-clay h-full transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                          </div>
                          <span className="font-mono text-[9px] text-brand-cream/40 uppercase block">
                            Streaming training byte // {videoProgress}% buffered
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={startVideoWatch}
                          className="btn-magnetic py-2.5 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/95 text-white font-bold text-[10px] uppercase tracking-wider"
                        >
                          Watch Course Video (Simulated 5s)
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Quiz Question view */
                    <div className="space-y-4 animate-fade-up">
                      <div className="flex justify-between items-center text-[10px] text-brand-cream/40 font-mono">
                        <span className="flex items-center gap-1.5 text-white font-bold">
                          <HelpCircle className="w-4 h-4 text-brand-clay" /> ACTIVE MODULE VALIDATION EXAM
                        </span>
                        <span className="text-emerald-400">✓ COURSE VIDEO COMPLETED</span>
                      </div>

                      <div className="bg-brand-cream/5 border border-brand-cream/10 p-4 rounded-2xl">
                        <p className="font-sans text-xs text-white leading-relaxed font-semibold">
                          {modules[activeModule - 1].question}
                        </p>
                      </div>

                      <form onSubmit={handleQuizSubmit} className="space-y-3 font-sans text-xs">
                        {modules[activeModule - 1].options.map((opt, idx) => {
                          const isSelected = quizAnswer === idx;
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={quizSubmitted}
                              onClick={() => setQuizAnswer(idx)}
                              className={`w-full p-4 rounded-xl border text-left leading-normal transition-all duration-300 ${
                                isSelected
                                  ? 'border-brand-clay bg-brand-clay/10 text-white font-semibold'
                                  : 'border-brand-cream/10 bg-brand-cream/5 text-brand-cream/80 hover:border-brand-cream/20'
                              }`}
                            >
                              <span className="font-bold block text-[10px] mb-1">OPTION 0{idx + 1}</span>
                              {opt}
                            </button>
                          );
                        })}

                        {/* Submit actions */}
                        {!quizSubmitted ? (
                          <button
                            type="submit"
                            disabled={quizAnswer === null}
                            className={`btn-magnetic w-full py-3 rounded-full font-bold uppercase tracking-wider text-xs text-white ${
                              quizAnswer === null
                                ? 'bg-brand-moss/45 cursor-not-allowed shadow-none'
                                : 'bg-brand-clay hover:bg-brand-clay/90'
                            }`}
                          >
                            Submit Answer
                          </button>
                        ) : (
                          <div className="space-y-4 pt-2">
                            {quizResult ? (
                              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-center font-mono text-[10px] font-bold">
                                🎉 Correct! You solved the validation question. +200 XP earned.
                              </div>
                            ) : (
                              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-center font-mono text-[10px] font-bold">
                                ❌ Incorrect answer. Review the module outline and tools list, then retry.
                              </div>
                            )}
                            
                            <div className="flex gap-3">
                              {quizResult ? (
                                <button
                                  type="button"
                                  onClick={handleNextModule}
                                  className="flex-1 py-3 bg-brand-moss hover:bg-brand-moss/80 font-bold uppercase tracking-wider text-xs text-brand-cream rounded-full"
                                >
                                  {activeModule < 6 ? "Proceed to Next Module" : "View Certification"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => { setQuizSubmitted(false); setQuizAnswer(null); setQuizResult(null); }}
                                  className="flex-1 py-3 bg-brand-clay/10 border border-brand-clay/30 hover:bg-brand-clay/15 text-brand-clay font-bold uppercase tracking-wider text-xs rounded-full"
                                >
                                  Try Assessment Quiz Again
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- TAB 2: ROLEPLAY SIMULATOR --- */}
            {activeTab === 'roleplay' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Scenario selection column (Left) */}
                <div className="lg:col-span-4 space-y-4">
                  <span className="font-mono text-2xs text-brand-clay font-bold tracking-wider uppercase block">SELECT AUDITING SCENARIO</span>
                  
                  {[
                    { id: 'classroom_distraction', title: "Distracted Student Chidi", role: "Classroom Engagement", desc: "A 14-year-old high school student distracted by gaming on his smartphone." },
                    { id: 'parent_conflict', title: "Parent Mrs. Bello", role: "Confrontation Support", desc: "Angry mother demands explanations for a score drop from 92% to 68%." },
                    { id: 'syllabus_alignment', title: "Principal Mensah Audit", role: "Syllabus Vetting", desc: "Strict academic principal audits your Cambridge/WAEC lesson plans." }
                  ].map(sc => (
                    <button
                      key={sc.id}
                      onClick={() => setSelectedScenario(sc.id)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 block ${
                        selectedScenario === sc.id
                          ? 'border-brand-clay bg-brand-clay/5'
                          : 'border-brand-cream/10 bg-brand-charcoal/30 hover:border-brand-cream/20'
                      }`}
                    >
                      <span className="font-mono text-[9px] uppercase text-brand-cream/40 block mb-1">{sc.role}</span>
                      <span className="font-heading font-bold text-sm text-white block mb-1">{sc.title}</span>
                      <span className="font-sans text-2xs text-brand-cream/60 leading-normal block">{sc.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Chat workspace column (Right) */}
                <div className="lg:col-span-8 bg-brand-charcoal border border-brand-cream/10 rounded-[2.5rem] p-6 shadow-2xl flex flex-col h-[580px] justify-between">
                  {/* Chat header info */}
                  <div className="border-b border-brand-cream/10 pb-4 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-brand-clay" />
                      <div>
                        <h4 className="font-heading font-bold text-sm text-white">Gemini Dialogue Trainer</h4>
                        <span className="font-sans text-2xs text-brand-cream/50">
                          {selectedScenario === 'classroom_distraction' ? "Practicing student engagement strategies" : selectedScenario === 'parent_conflict' ? "Practicing parent crisis resolution" : "Vetting lesson outlines against curriculum codes"}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[8px] bg-brand-clay/10 text-brand-clay font-bold py-1 px-3 rounded-full border border-brand-clay/20 uppercase tracking-widest animate-pulse">
                      Live Simulation
                    </span>
                  </div>

                  {/* Messages container */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[380px] scrollbar-thin scrollbar-thumb-brand-cream/10">
                    {roleplayMessages.map((msg, i) => {
                      const isUser = msg.sender === 'user';
                      return (
                        <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-up`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                            isUser 
                              ? 'bg-brand-clay text-white rounded-tr-none' 
                              : 'bg-brand-cream/5 border border-brand-cream/10 text-brand-cream rounded-tl-none'
                          }`}>
                            <span className="font-mono text-[8px] opacity-40 uppercase block mb-1">
                              {isUser ? "You (Tutor)" : selectedScenario === 'classroom_distraction' ? "Student Chidi" : selectedScenario === 'parent_conflict' ? "Mrs. Bello" : "Principal Mensah"} · {msg.time}
                            </span>
                            <p className="font-sans text-brand-cream/90">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-brand-cream/5 border border-brand-cream/10 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                          <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-brand-clay rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-brand-clay rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-brand-clay rounded-full animate-bounce [animation-delay:0.4s]" />
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat input block */}
                  <form onSubmit={handleSendRoleplay} className="mt-4 border-t border-brand-cream/10 pt-4 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={chatLoading ? "Awaiting simulation partner..." : "Type your dialogue response here..."}
                      disabled={chatLoading}
                      className="flex-1 bg-brand-cream/5 border border-brand-cream/10 rounded-full px-5 py-3 text-white focus:outline-none focus:border-brand-clay text-xs"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading || !chatInput.trim()}
                      className="w-11 h-11 rounded-full bg-brand-clay text-white flex items-center justify-center hover:bg-brand-clay/90 transition-transform hover:scale-[1.05]"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* --- TAB 3: DISCUSSION FORUM --- */}
            {activeTab === 'forum' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Forum list sidebar (Left) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-2xs text-brand-clay font-bold tracking-wider uppercase block">PEER DISCUSSION FORUM</span>
                    <button
                      onClick={() => setActiveThread(null)}
                      className="text-brand-clay font-mono text-[9px] uppercase tracking-wider font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Start Thread
                    </button>
                  </div>

                  {forumLoading ? (
                    <div className="text-center py-12 text-brand-cream/30 text-xs">Loading forum...</div>
                  ) : forumThreads.length === 0 ? (
                    <div className="text-center py-12 text-brand-cream/30 text-xs">No active threads. Start the first topic!</div>
                  ) : (
                    <div className="space-y-2">
                      {forumThreads.map(th => {
                        const isSelected = activeThread?.id === th.id;
                        return (
                          <button
                            key={th.id}
                            onClick={() => setActiveThread(th)}
                            className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 block ${
                              isSelected
                                ? 'border-brand-clay bg-brand-clay/5'
                                : 'border-brand-cream/10 bg-brand-charcoal/30 hover:border-brand-cream/20'
                            }`}
                          >
                            <h4 className="font-heading font-bold text-xs text-white block mb-1.5">{th.title}</h4>
                            <div className="flex justify-between items-center text-[8px] font-mono text-brand-cream/40">
                              <span>By {th.authorName} ({th.authorRole})</span>
                              <span>{th.comments?.length || 0} Replies</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Forum Workspace area (Right) */}
                <div className="lg:col-span-7 bg-brand-charcoal border border-brand-cream/10 rounded-[2.5rem] p-6 shadow-2xl min-h-[500px] flex flex-col justify-between">
                  {activeThread ? (
                    /* Thread detail and comment list */
                    <div className="space-y-6 flex flex-col justify-between h-full">
                      <div className="space-y-4">
                        <button
                          onClick={() => setActiveThread(null)}
                          className="font-mono text-[9px] text-brand-clay uppercase font-bold hover:underline mb-2 block"
                        >
                          ← Back to Thread Creation
                        </button>
                        
                        <div className="border-b border-brand-cream/10 pb-4">
                          <h3 className="font-heading font-bold text-base text-white">{activeThread.title}</h3>
                          <p className="font-sans text-xs text-brand-cream/70 leading-relaxed mt-2">
                            {activeThread.content}
                          </p>
                          <span className="font-mono text-[8px] text-brand-cream/40 uppercase block mt-3">
                            Created by {activeThread.authorName} · {new Date(activeThread.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Comments loop */}
                        <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-2">
                          <span className="font-mono text-[9px] text-brand-clay uppercase tracking-widest font-bold block mb-1">COMMENTS & INPUTS ({activeThread.comments?.length || 0})</span>
                          {(!activeThread.comments || activeThread.comments.length === 0) ? (
                            <p className="font-sans text-2xs text-brand-cream/40 italic">No replies posted yet. Add your comment below.</p>
                          ) : (
                            activeThread.comments.map(c => (
                              <div key={c.id} className="bg-brand-cream/5 border border-brand-cream/5 rounded-xl p-3">
                                <span className="font-mono text-[8px] text-brand-cream/40 block mb-1">
                                  {c.authorName} · {new Date(c.createdAt).toLocaleDateString()}
                                </span>
                                <p className="font-sans text-2xs text-brand-cream/80">{c.content}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Comment Submit Box */}
                      <form onSubmit={handleCreateComment} className="border-t border-brand-cream/10 pt-4 flex gap-2">
                        <input
                          type="text"
                          required
                          value={newCommentContent}
                          onChange={(e) => setNewCommentContent(e.target.value)}
                          placeholder="Write a pedagogical advice reply..."
                          className="flex-1 bg-brand-cream/5 border border-brand-cream/10 rounded-full px-4 py-2.5 text-white focus:outline-none focus:border-brand-clay text-2xs"
                        />
                        <button
                          type="submit"
                          className="py-2.5 px-5 bg-brand-clay hover:bg-brand-clay/95 rounded-full text-white font-mono text-[9px] uppercase tracking-wider font-bold"
                        >
                          Send
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* Thread creator form */
                    <div className="space-y-6 h-full flex flex-col justify-between">
                      <div className="space-y-4">
                        <span className="font-mono text-2xs text-brand-clay font-bold tracking-wider uppercase block">CREATE DISCUSSION TOPIC</span>
                        <h3 className="font-heading font-bold text-lg text-white">Start a new thread thread</h3>
                        <p className="font-sans text-2xs text-brand-cream/60 leading-relaxed">
                          Share classroom setups, discuss rate positions, or ask for advice on optimizing student growth with fellow tutors.
                        </p>
                      </div>

                      <form onSubmit={handleCreateForumPost} className="space-y-4 font-sans text-xs">
                        <div>
                          <label className="font-heading font-bold text-[10px] uppercase text-brand-cream/60 block mb-2">Topic / Question Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Help with Notion digital template syllabus alignment"
                            value={newPostTitle}
                            onChange={(e) => setNewPostTitle(e.target.value)}
                            className="w-full bg-brand-cream/5 border border-brand-cream/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-clay"
                          />
                        </div>

                        <div>
                          <label className="font-heading font-bold text-[10px] uppercase text-brand-cream/60 block mb-2">Detailed Description</label>
                          <textarea
                            required
                            placeholder="Detail your question or tips here..."
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            className="w-full bg-brand-cream/5 border border-brand-cream/10 rounded-xl p-4 text-white focus:outline-none focus:border-brand-clay h-28 resize-none text-2xs"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 bg-brand-clay hover:bg-brand-clay/90 text-white rounded-full font-bold uppercase tracking-wider text-2xs"
                        >
                          Publish Post Thread
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- TAB 4: CERTIFICATE VIEW --- */}
            {activeTab === 'certificate' && completedModules.length >= 6 && (
              <div className="max-w-3xl mx-auto space-y-8 animate-fade-up">
                
                {/* Visual Certificate Card */}
                <div className="bg-[#FAF8F5] text-brand-charcoal border-8 border-brand-clay rounded-[2.5rem] p-10 md:p-14 shadow-2xl relative border-double flex flex-col justify-between min-h-[500px]">
                  
                  {/* Decorative background vectors */}
                  <div className="absolute top-8 left-8 right-8 bottom-8 border border-brand-moss/10 pointer-events-none" />
                  
                  <div className="text-center space-y-6 relative z-10">
                    <span className="font-mono text-2xs tracking-widest text-brand-clay font-bold block uppercase">
                      ELITE CERTIFIED INSTRUCTOR
                    </span>
                    <h3 className="font-heading font-extrabold text-2xl md:text-3xl text-brand-moss tracking-tight uppercase leading-snug">
                      ELITE TEACHERS ACADEMY
                    </h3>
                    <p className="font-sans text-xs italic text-brand-charcoal/60">
                      This certificate of pedagogical excellence is proudly awarded to
                    </p>
                    
                    <div className="py-2 border-b-2 border-brand-clay/40 max-w-md mx-auto">
                      <h4 className="font-heading font-bold text-2xl md:text-3xl text-brand-moss tracking-tight">
                        {currentUser.displayName || "Adebayo Okafor"}
                      </h4>
                    </div>

                    <p className="font-sans text-[11px] text-brand-charcoal/80 leading-relaxed max-w-lg mx-auto">
                      For successfully completing the 6-module curriculum including digital classroom setups, AI lesson configurations, online video presence pacing, global positioning billing structures, and search optimization referrals.
                    </p>
                  </div>

                  {/* Certificate Footer seals and QR code */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t border-brand-moss/10 relative z-10 text-left">
                    <div className="space-y-1.5 font-mono text-[9px] text-brand-charcoal/50">
                      <div>VALIDATION ID: <span className="font-bold text-brand-charcoal">ETA-2026-{currentUser.uid.substring(0,6).toUpperCase()}</span></div>
                      <div>DATE CERTIFIED: <span className="font-bold text-brand-charcoal">{new Date().toLocaleDateString()}</span></div>
                      <div>STATUS: <span className="font-bold text-emerald-600">VERIFIED ACTIVE</span></div>
                    </div>

                    {/* SVG generated QR Code */}
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 border border-brand-moss/10 rounded-xl">
                        <svg className="w-16 h-16 text-brand-moss" viewBox="0 0 100 100" fill="currentColor">
                          {/* Outer border & alignment blocks */}
                          <rect x="0" y="0" width="25" height="25" />
                          <rect x="2" y="2" width="21" height="21" fill="white" />
                          <rect x="6" y="6" width="13" height="13" />

                          <rect x="75" y="0" width="25" height="25" />
                          <rect x="77" y="2" width="21" height="21" fill="white" />
                          <rect x="81" y="6" width="13" height="13" />

                          <rect x="0" y="75" width="25" height="25" />
                          <rect x="2" y="77" width="21" height="21" fill="white" />
                          <rect x="6" y="81" width="13" height="13" />

                          {/* Dummy QR Noise bits */}
                          <rect x="35" y="5" width="8" height="8" />
                          <rect x="50" y="10" width="12" height="6" />
                          <rect x="35" y="25" width="6" height="10" />
                          <rect x="60" y="30" width="10" height="12" />
                          <rect x="45" y="45" width="15" height="8" />
                          <rect x="10" y="45" width="12" height="10" />
                          <rect x="40" y="70" width="10" height="15" />
                          <rect x="65" y="65" width="12" height="12" />
                          <rect x="85" y="45" width="8" height="16" />
                          <rect x="30" y="85" width="15" height="6" />
                          <rect x="80" y="80" width="10" height="10" />
                        </svg>
                      </div>
                      <div className="font-mono text-[8px] text-brand-charcoal/50 leading-relaxed max-w-[100px]">
                        Scan to verify educator status on EduVistar live directory.
                      </div>
                    </div>
                  </div>

                </div>

                {/* Print/Download button */}
                <div className="text-center">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex btn-magnetic py-3 px-8 bg-brand-clay hover:bg-brand-clay/95 rounded-full text-white font-bold uppercase tracking-wider text-xs shadow-lg shadow-brand-clay/10 items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Printable Certificate PDF
                  </button>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
}
