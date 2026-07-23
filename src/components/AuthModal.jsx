import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, Mail, User, Shield, Lock, Phone, Link2, Clock, Video, FileText, Camera, Globe, DollarSign, CheckCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import BrandLogo from './BrandLogo';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Linkedin = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function AuthModal({ isOpen, onClose }) {
  const { currentUser, pendingOnboarding, setPendingOnboarding } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && isOpen) {
      onClose();
      if (currentUser.role === 'Parent') {
        window.location.hash = '#marketplace';
      }
    }
  }, [currentUser, isOpen, onClose]);

  const handleSuccess = (user) => {
    login(user, user.token);
    navigate('/dashboard');
    if (user.role === 'Parent') {
      window.location.hash = '#marketplace';
    }
  };
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('Parent'); // 'Parent' or 'Teacher'
  const [country, setCountry] = useState('Nigeria');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleUserForSetup, setGoogleUserForSetup] = useState(null);
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [eliteCertificate, setEliteCertificate] = useState('');

  // Teacher Onboarding signup states
  const [signupStep, setSignupStep] = useState(1);
  const [whatsapp, setWhatsapp] = useState('');
  const [nin, setNin] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop');
  const [govIdUrl, setGovIdUrl] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [degreeUrl, setDegreeUrl] = useState('');
  const [rate, setRate] = useState(4000); // ₦4,000 hourly default
  const [currency, setCurrency] = useState('NGN');
  const [timezone, setTimezone] = useState('Africa/Lagos');
  const [classroomLink, setClassroomLink] = useState('');
  const [recordingTool, setRecordingTool] = useState('recordly.site');
  const [uploadingState, setUploadingState] = useState({ type: null, progress: 0 });

  const handleFileUpload = async (e, type, setter) => {
    const file = e.target.files[0];
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    setUploadingState({ type, progress: 10 });

    if (!uploadPreset || uploadPreset.includes('placeholder')) {
      // Simulated upload for sandbox / local development
      setTimeout(() => {
        setUploadingState({ type, progress: 50 });
        setTimeout(() => {
          const objectUrl = URL.createObjectURL(file);
          setter(objectUrl);
          setUploadingState({ type: null, progress: 0 });
          toast.success(`✓ Upload Simulation: File "${file.name}" uploaded successfully!`);
        }, 800);
      }, 500);
      return;
    }

    setUploadingState({ type, progress: 20 });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    const resourceType = 'auto';

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadingState({ type, progress: percent });
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setter(response.secure_url);
        } else {
          console.error(xhr.responseText);
          let errMsg = xhr.statusText;
          try {
            const errRes = JSON.parse(xhr.responseText);
            if (errRes.error && errRes.error.message) {
              errMsg = errRes.error.message;
            }
          } catch(e) {}
          toast.error("Cloudinary upload failed: " + errMsg);
        }
        setUploadingState({ type: null, progress: 0 });
      };

      xhr.onerror = () => {
        toast.error("Network error occurred during upload.");
        setUploadingState({ type: null, progress: 0 });
      };

      xhr.send(formData);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Error occurred during upload.");
      setUploadingState({ type: null, progress: 0 });
    }
  };

  const API_BASE = '/api';

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    // Teacher Signup Steps Validation Check
    if (activeTab === 'register' && role === 'Teacher' && signupStep < 4) {
      if (signupStep === 1) {
        if (!name || !email || !password || !username) {
          setError('Name, email, password, and public username are required.');
          return;
        }
        setSignupStep(2);
      } else if (signupStep === 2) {
        if (!whatsapp || !nin || !linkedin) {
          setError('WhatsApp number, NIN, and LinkedIn profile URL are required.');
          return;
        }
        if (!linkedin.includes('linkedin.com/')) {
          setError('LinkedIn Profile URL must include linkedin.com/.');
          return;
        }
        setSignupStep(3);
      } else if (signupStep === 3) {
        if (!rate || rate <= 0) {
          setError('Please enter a valid hourly rate.');
          return;
        }
        setSignupStep(4);
      }
      return;
    }

    setLoading(true);
    const refCode = localStorage.getItem('eduvista_ref');

    try {
      if (activeTab === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        // AuthContext will automatically fetch /me and update currentUser
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        
        // Immediately hit backend /register since we know all details
        const payload = { 
            clientUid: userCredential.user.uid,
            email, 
            displayName: name, 
            username: role === 'Teacher' ? username : undefined, 
            role, 
            country, 
            referredBy: refCode || undefined, 
            eliteCertificate: role === 'Teacher' ? eliteCertificate : undefined,
            whatsapp: role === 'Teacher' ? whatsapp : undefined,
            nin: role === 'Teacher' ? nin : undefined,
            linkedin: role === 'Teacher' ? linkedin : undefined,
            avatar: role === 'Teacher' ? avatar : undefined,
            govIdUrl: role === 'Teacher' ? govIdUrl : undefined,
            cvUrl: role === 'Teacher' ? cvUrl : undefined,
            videoUrl: role === 'Teacher' ? videoUrl : undefined,
            degreeUrl: role === 'Teacher' ? degreeUrl : undefined,
            rate: role === 'Teacher' ? rate : undefined,
            currency: role === 'Teacher' ? currency : undefined,
            timezone: role === 'Teacher' ? timezone : undefined,
            classroomLink: role === 'Teacher' ? classroomLink : undefined,
            recordingTool: role === 'Teacher' ? recordingTool : undefined
        };

        const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/auth/register`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (response.ok) {
          // Trigger a token refresh so backend recognizes them
          await auth.currentUser.getIdToken(true);
          // The onAuthStateChanged might have missed them because they didn't exist in DB at first!
          // We can force AuthContext to recheck, or just wait for it to notice.
          // By refreshing token, the next request to /me will work.
        } else {
          setError(data.error || 'Something went wrong during registration.');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      // AuthContext's onAuthStateChanged will automatically pick this up!
    } catch (popupErr) {
      console.warn("Firebase Google popup error:", popupErr.message);
      toast.error(`Google Sign-In failed: ${popupErr.message}.`);
      setLoading(false);
    }
  };

  const handleGoogleSetupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const refCode = localStorage.getItem('eduvista_ref');

    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("Not authenticated with Google.");

      const token = await firebaseUser.getIdToken();

      const payload = {
        clientUid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: name || firebaseUser.displayName || 'Google User',
        username: role === 'Teacher' ? username : undefined,
        role,
        country,
        referredBy: refCode || undefined,
        eliteCertificate: role === 'Teacher' ? eliteCertificate : undefined
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        // Trigger AuthContext to recheck backend
        setPendingOnboarding(false);
        // We can force AuthContext to recheck by getting a fresh token
        await firebaseUser.getIdToken(true);
        // We rely on AuthContext onAuthStateChanged to pick this up, 
        // or we can reload the page for a clean state
        window.location.reload();
      } else {
        setError(data.error || 'Failed to complete registration.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Google registration error:', err);
      setError(err.message || 'Failed to connect to backend.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (showGooglePicker) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm" onClick={() => setShowGooglePicker(false)} />
        
        <div className="relative bg-white border border-brand-moss/20 rounded-[2.5rem] w-full max-w-md p-6 sm:p-8 shadow-2xl z-10 animate-fade-up text-brand-charcoal">
          <button onClick={() => setShowGooglePicker(false)} className="absolute top-6 right-6 text-brand-charcoal/60 hover:text-brand-charcoal font-bold text-base">
            ✕
          </button>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 shadow-inner border border-slate-200">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <h3 className="font-heading font-bold text-xl text-brand-moss">Choose a Google Account</h3>
            <p className="font-sans text-xs text-brand-charcoal/70 mt-1">to continue to <strong>EduVista Africa</strong></p>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {/* Super Admin Option */}
            <button
              type="button"
              onClick={() => executeGoogleLoginFlow('zeerocodes@gmail.com', 'Zeerocodes Super Admin', 'admin_zeero')}
              className="w-full text-left p-3.5 rounded-2xl border-2 border-brand-clay/30 hover:border-brand-clay bg-brand-clay/5 hover:bg-brand-clay/10 transition-all flex items-center gap-3.5 group cursor-pointer shadow-xs"
            >
              <div className="w-10 h-10 rounded-full bg-brand-clay text-white flex items-center justify-center font-bold font-heading text-sm shrink-0">
                Z
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-brand-moss block truncate group-hover:text-brand-clay">Zeerocodes (Super Admin)</span>
                <span className="font-mono text-[10px] text-brand-clay font-bold block truncate">zeerocodes@gmail.com</span>
              </div>
              <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-brand-clay text-white font-bold shrink-0">Super Admin</span>
            </button>

            {/* Account Option 1 */}
            <button
              type="button"
              onClick={() => executeGoogleLoginFlow('parent.google@eduvista.com', 'Ngozi Adeleke (Parent)', 'google_parent_1')}
              className="w-full text-left p-3.5 rounded-2xl border border-brand-moss/10 hover:border-brand-clay bg-brand-cream/30 hover:bg-brand-cream/60 transition-all flex items-center gap-3.5 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-brand-moss text-white flex items-center justify-center font-bold font-heading text-sm shrink-0">
                N
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-brand-moss block truncate group-hover:text-brand-clay">Ngozi Adeleke</span>
                <span className="font-mono text-[10px] text-brand-charcoal/60 block truncate">parent.google@eduvista.com</span>
              </div>
              <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">Parent</span>
            </button>

            {/* Account Option 2 */}
            <button
              type="button"
              onClick={() => executeGoogleLoginFlow('teacher.google@eduvista.com', 'Dr. Adebayo Okafor (Teacher)', 'google_teacher_1')}
              className="w-full text-left p-3.5 rounded-2xl border border-brand-moss/10 hover:border-brand-clay bg-brand-cream/30 hover:bg-brand-cream/60 transition-all flex items-center gap-3.5 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-brand-clay text-white flex items-center justify-center font-bold font-heading text-sm shrink-0">
                A
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-brand-moss block truncate group-hover:text-brand-clay">Dr. Adebayo Okafor</span>
                <span className="font-mono text-[10px] text-brand-charcoal/60 block truncate">teacher.google@eduvista.com</span>
              </div>
              <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-brand-clay/10 text-brand-clay font-bold shrink-0">Teacher</span>
            </button>

            {/* Account Option 3 */}
            <button
              type="button"
              onClick={() => executeGoogleLoginFlow('admin.google@eduvista.com', 'System Admin', 'google_admin_1')}
              className="w-full text-left p-3.5 rounded-2xl border border-brand-moss/10 hover:border-brand-clay bg-brand-cream/30 hover:bg-brand-cream/60 transition-all flex items-center gap-3.5 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-brand-charcoal text-white flex items-center justify-center font-bold font-heading text-sm shrink-0">
                S
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-brand-moss block truncate group-hover:text-brand-clay">System Administrator</span>
                <span className="font-mono text-[10px] text-brand-charcoal/60 block truncate">admin.google@eduvista.com</span>
              </div>
              <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold shrink-0">Admin</span>
            </button>

            {/* Custom Email Input */}
            <div className="pt-3 border-t border-brand-moss/10 space-y-2">
              <label className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 block font-bold">Or Use Custom Google Account</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="flex-1 bg-white border border-brand-moss/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-clay"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!customGoogleEmail || !customGoogleEmail.includes('@')) {
                      toast.error('Please enter a valid Google email address.');
                      return;
                    }
                    executeGoogleLoginFlow(customGoogleEmail, customGoogleEmail.split('@')[0], `google_${Date.now()}`);
                  }}
                  className="bg-brand-moss text-white px-4 py-2 rounded-xl font-heading font-bold text-xs hover:bg-brand-clay transition-colors"
                >
                  SignIn
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pendingOnboarding && auth.currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm" onClick={() => { setPendingOnboarding(false); onClose(); }} />
        
        {/* Modal Container */}
        <div className="relative bg-brand-cream border border-brand-moss/20 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl z-10 max-h-[85vh] overflow-y-auto">
          {/* Close Button */}
          <button onClick={() => { setPendingOnboarding(false); onClose(); }} className="absolute top-6 right-6 text-brand-moss/60 hover:text-brand-moss">
            <X className="w-5 h-5" />
          </button>

          {/* Logo Icon */}
          <BrandLogo light={false} className="h-10 md:h-11 mb-6 transition-transform duration-300 hover:scale-105" />

          <h3 className="font-heading font-bold text-xl text-brand-moss mb-2">Complete Registration</h3>
          <p className="font-sans text-xs text-brand-charcoal/70 mb-6">
            Just a few more details to set up your account for <strong>{auth.currentUser.email}</strong>.
          </p>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl mb-4 font-sans leading-relaxed">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleGoogleSetupSubmit} className="space-y-4 font-sans text-xs">
            <div>
              <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Full Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-4 w-4 h-4 text-brand-moss/40" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ngozi Adeleke"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-brand-moss/10 rounded-xl pl-11 pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                />
              </div>
            </div>

            <div>
              <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Account Role</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('Parent')}
                  className={`py-2 rounded-xl border font-heading font-bold text-[10px] uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                    role === 'Parent'
                      ? 'border-brand-clay bg-brand-clay/5 text-brand-charcoal'
                      : 'border-brand-moss/10 bg-white hover:border-brand-moss/45'
                  }`}
                >
                  <span>👨‍👩‍👦</span> Parent
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Teacher')}
                  className={`py-2 rounded-xl border font-heading font-bold text-[10px] uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                    role === 'Teacher'
                      ? 'border-brand-clay bg-brand-clay/5 text-brand-charcoal'
                      : 'border-brand-moss/10 bg-white hover:border-brand-moss/45'
                  }`}
                >
                  <span>👨‍🏫</span> Teacher
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Student')}
                  className={`py-2 rounded-xl border font-heading font-bold text-[10px] uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                    role === 'Student'
                      ? 'border-brand-clay bg-brand-clay/5 text-brand-charcoal'
                      : 'border-brand-moss/10 bg-white hover:border-brand-moss/45'
                  }`}
                >
                  <span>🎓</span> Student
                </button>
              </div>
            </div>

            {role === 'Teacher' && (
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Public Username</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 font-mono text-xs text-brand-charcoal/40">@</span>
                  <input
                    type="text"
                    required
                    placeholder="adebayo-maths"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl pl-11 pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm font-mono"
                  />
                </div>
              </div>
            )}

            {role === 'Teacher' && (
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Elite Teachers Certificate (Optional)</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="e.g. ETA-2026-XXXXXX"
                    value={eliteCertificate}
                    onChange={(e) => setEliteCertificate(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  />
                </div>
              </div>
            )}

            {(role === 'Parent' || role === 'Teacher') && (
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Country of Residence</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                >
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Uganda">Uganda</option>
                  <option value="Rwanda">Rwanda</option>
                  <option value="Cameroon">Cameroon</option>
                  <option value="Tanzania">Tanzania</option>
                  <option value="Egypt">Egypt</option>
                  <option value="Senegal">Senegal</option>
                  <option value="Ethiopia">Ethiopia</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                </select>
              </div>
            )}

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingOnboarding(false)}
                className="flex-grow py-4 rounded-full border border-brand-moss/20 hover:border-brand-moss/45 bg-white text-brand-moss font-bold text-xs uppercase tracking-wider text-center cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-grow btn-magnetic py-4 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-clay/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Processing...' : 'Complete'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative bg-brand-cream border border-brand-moss/20 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl z-10 max-h-[85vh] overflow-y-auto">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-6 text-brand-moss/60 hover:text-brand-moss">
          <X className="w-5 h-5" />
        </button>

        {/* Logo Icon */}
        <BrandLogo light={false} className="h-10 md:h-11 mb-6 transition-transform duration-300 hover:scale-105" />

        {/* Tab Switcher */}
        <div className="flex bg-brand-moss/5 border border-brand-moss/10 rounded-full p-1 mb-6">
          <button
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`flex-1 py-2 rounded-full font-heading font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'login'
                ? 'bg-brand-moss text-white shadow-md'
                : 'text-brand-moss hover:bg-brand-moss/5'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={`flex-1 py-2 rounded-full font-heading font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'register'
                ? 'bg-brand-moss text-white shadow-md'
                : 'text-brand-moss hover:bg-brand-moss/5'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl mb-4 font-sans leading-relaxed">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
          {activeTab === 'register' && role === 'Teacher' && (
            <div className="flex items-center justify-between mb-2 border-b border-brand-moss/10 pb-3">
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold">Teacher Application</span>
              <span className="bg-brand-moss/10 text-brand-moss text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">Step {signupStep} of 4</span>
            </div>
          )}

          {/* TAB: LOGIN */}
          {activeTab === 'login' && (
            <>
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-4 h-4 text-brand-moss/40" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl pl-11 pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-4 h-4 text-brand-moss/40" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl pl-11 pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {/* TAB: REGISTER (STANDARD PARENT/STUDENT OR TEACHER STEP 1) */}
          {activeTab === 'register' && (role !== 'Teacher' || signupStep === 1) && (
            <>
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Full Name</label>
                <div className="relative flex items-center">
                  <User className="absolute left-4 w-4 h-4 text-brand-moss/40" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ngozi Adeleke"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl pl-11 pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  />
                </div>
              </div>

              {role === 'Teacher' && (
                <>
                  <div>
                    <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Public Username</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 font-mono text-xs text-brand-charcoal/40">@</span>
                      <input
                        type="text"
                        required
                        placeholder="adebayo-maths"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="w-full bg-white border border-brand-moss/10 rounded-xl pl-11 pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Elite Certificate (Optional)</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder="e.g. ETA-2026-XXXXXX"
                        value={eliteCertificate}
                        onChange={(e) => setEliteCertificate(e.target.value)}
                        className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-4 h-4 text-brand-moss/40" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl pl-11 pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-4 h-4 text-brand-moss/40" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl pl-11 pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Account Role</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setRole('Parent'); setSignupStep(1); }}
                    className={`py-2 rounded-xl border font-heading font-bold text-[10px] uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                      role === 'Parent'
                        ? 'border-brand-clay bg-brand-clay/5 text-brand-charcoal'
                        : 'border-brand-moss/10 bg-white hover:border-brand-moss/45'
                    }`}
                  >
                    <span>👨‍👩‍👦</span> Parent
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRole('Teacher'); setSignupStep(1); }}
                    className={`py-2 rounded-xl border font-heading font-bold text-[10px] uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                      role === 'Teacher'
                        ? 'border-brand-clay bg-brand-clay/5 text-brand-charcoal'
                        : 'border-brand-moss/10 bg-white hover:border-brand-moss/45'
                    }`}
                  >
                    <span>👨‍🏫</span> Teacher
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRole('Student'); setSignupStep(1); }}
                    className={`py-2 rounded-xl border font-heading font-bold text-[10px] uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                      role === 'Student'
                        ? 'border-brand-clay bg-brand-clay/5 text-brand-charcoal'
                        : 'border-brand-moss/10 bg-white hover:border-brand-moss/45'
                    }`}
                  >
                    <span>🎓</span> Student
                  </button>
                </div>
              </div>

              {(role === 'Parent' || role === 'Teacher') && (
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Country of Residence</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  >
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Kenya">Kenya</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Rwanda">Rwanda</option>
                    <option value="Cameroon">Cameroon</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Egypt">Egypt</option>
                    <option value="Senegal">Senegal</option>
                    <option value="Ethiopia">Ethiopia</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                  </select>
                </div>
              )}
            </>
          )}

          {/* TEACHER WIZARD: STEP 2 (CONTACT & VERIFICATION) */}
          {activeTab === 'register' && role === 'Teacher' && signupStep === 2 && (
            <div className="space-y-4 animate-fade-up">
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">WhatsApp Contact Number</label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-4 w-4 h-4 text-brand-moss/40" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. +234 813 645 1607"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl pl-11 pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">National ID (NIN) / Gov ID Number</label>
                <div className="relative flex items-center">
                  <Shield className="absolute left-4 w-4 h-4 text-brand-moss/40" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12049485761"
                    value={nin}
                    onChange={(e) => setNin(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl pl-11 pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">LinkedIn Profile Link</label>
                <div className="relative flex items-center">
                  <Linkedin className="absolute left-4 w-4 h-4 text-brand-moss/40" />
                  <input
                    type="url"
                    required
                    placeholder="https://linkedin.com/in/yourname"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl pl-11 pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm font-mono text-xs"
                  />
                </div>
                <span className="text-[10px] text-brand-charcoal/40 block mt-1">LinkedIn verification is mandatory for vetting.</span>
              </div>
            </div>
          )}

          {/* TEACHER WIZARD: STEP 3 (RATES & TIMEZONE) */}
          {activeTab === 'register' && role === 'Teacher' && signupStep === 3 && (
            <div className="space-y-4 animate-fade-up">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Hourly Rate</label>
                  <div className="relative flex items-center">
                    <DollarSign className="absolute left-4 w-4 h-4 text-brand-moss/40" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={rate}
                      onChange={(e) => setRate(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-brand-moss/10 rounded-xl pl-11 pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Base Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm h-[46px]"
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
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Preferred Timezone</label>
                <div className="relative flex items-center">
                  <Globe className="absolute left-4 w-4 h-4 text-brand-moss/40" />
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl pl-11 pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm appearance-none"
                  >
                    <option value="Africa/Lagos">West Africa Time (Lagos, UTC+1)</option>
                    <option value="Africa/Nairobi">East Africa Time (Nairobi, UTC+3)</option>
                    <option value="Africa/Johannesburg">South Africa Standard Time (UTC+2)</option>
                    <option value="Africa/Accra">Greenwich Mean Time (Accra, UTC+0)</option>
                    <option value="Europe/London">Europe / London (BST/GMT)</option>
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Preferred Classroom Link</label>
                <div className="relative flex items-center">
                  <Link2 className="absolute left-4 w-4 h-4 text-brand-moss/40" />
                  <input
                    type="url"
                    placeholder="e.g. Google Meet or Zoom classroom url"
                    value={classroomLink}
                    onChange={(e) => setClassroomLink(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl pl-11 pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Classroom Recording Tool</label>
                <select
                  value={recordingTool}
                  onChange={(e) => setRecordingTool(e.target.value)}
                  className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                >
                  <option value="recordly.site">Recordly.site (Recommended)</option>
                  <option value="zoom-cloud">Zoom Cloud Native</option>
                  <option value="loom">Loom Personal</option>
                  <option value="other">Other / Manual Upload</option>
                </select>
              </div>
            </div>
          )}

          {/* TEACHER WIZARD: STEP 4 (DOCUMENTS UPLOAD) */}
          {activeTab === 'register' && role === 'Teacher' && signupStep === 4 && (
            <div className="space-y-4 animate-fade-up max-h-[45vh] overflow-y-auto pr-1">
              
              {/* Profile Picture */}
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss flex items-center gap-1.5 mb-2">
                  <Camera className="w-3.5 h-3.5 text-brand-clay" /> Profile Picture Upload *
                </label>
                <div className="flex items-center gap-4 border border-dashed border-brand-moss/20 rounded-xl p-3 bg-white">
                  <img src={avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-brand-moss/10" />
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileUpload(e, 'image', setAvatar)} 
                      className="text-2xs text-brand-charcoal/60"
                    />
                    {uploadingState.type === 'image' && <div className="text-[10px] text-brand-clay font-bold mt-1">Uploading... {uploadingState.progress}%</div>}
                  </div>
                </div>
              </div>

              {/* CV / Resume */}
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss flex items-center gap-1.5 mb-2">
                  <FileText className="w-3.5 h-3.5 text-brand-clay" /> CV / Resume PDF *
                </label>
                <div className="border border-dashed border-brand-moss/20 rounded-xl p-3 bg-white flex items-center justify-between">
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    onChange={(e) => handleFileUpload(e, 'raw', setCvUrl)} 
                    className="text-2xs text-brand-charcoal/60"
                  />
                  {cvUrl ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <span className="text-2xs text-red-600 font-bold shrink-0">Missing</span>}
                </div>
              </div>

              {/* Gov ID */}
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss flex items-center gap-1.5 mb-2">
                  <Shield className="w-3.5 h-3.5 text-brand-clay" /> Government ID Card *
                </label>
                <div className="border border-dashed border-brand-moss/20 rounded-xl p-3 bg-white flex items-center justify-between">
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    onChange={(e) => handleFileUpload(e, 'raw', setGovIdUrl)} 
                    className="text-2xs text-brand-charcoal/60"
                  />
                  {govIdUrl ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <span className="text-2xs text-red-600 font-bold shrink-0">Missing</span>}
                </div>
              </div>

              {/* Qualifications */}
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss flex items-center gap-1.5 mb-2">
                  <FileText className="w-3.5 h-3.5 text-brand-clay" /> Degree / Qualifications *
                </label>
                <div className="border border-dashed border-brand-moss/20 rounded-xl p-3 bg-white flex items-center justify-between">
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    onChange={(e) => handleFileUpload(e, 'raw', setDegreeUrl)} 
                    className="text-2xs text-brand-charcoal/60"
                  />
                  {degreeUrl ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <span className="text-2xs text-red-600 font-bold shrink-0">Missing</span>}
                </div>
              </div>

              {/* Intro Video */}
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss flex items-center gap-1.5 mb-2">
                  <Video className="w-3.5 h-3.5 text-brand-clay" /> Intro Video Presentation *
                </label>
                <div className="border border-dashed border-brand-moss/20 rounded-xl p-3 bg-white flex items-center justify-between">
                  <input 
                    type="file" 
                    accept="video/*" 
                    onChange={(e) => handleFileUpload(e, 'video', setVideoUrl)} 
                    className="text-2xs text-brand-charcoal/60"
                  />
                  {videoUrl ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <span className="text-2xs text-red-600 font-bold shrink-0">Missing</span>}
                </div>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="pt-4 flex gap-3">
            {activeTab === 'register' && role === 'Teacher' && signupStep > 1 && (
              <button
                type="button"
                onClick={() => setSignupStep(prev => prev - 1)}
                className="flex-1 py-3.5 rounded-full border border-brand-moss/20 bg-white hover:bg-brand-moss/5 text-brand-moss font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}

            {activeTab === 'register' && role === 'Teacher' && signupStep < 4 ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-3.5 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : activeTab === 'login' ? (
              <>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-magnetic flex-grow py-4 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-clay/20 flex items-center justify-center gap-2"
                >
                  {loading ? 'Processing...' : 'Log In'}
                </button>
                <button
                  type="button"
                  onClick={handleAdminLoginShortcut}
                  disabled={loading}
                  className="flex-grow py-4 rounded-full border border-brand-moss/20 hover:border-brand-moss/45 bg-white hover:bg-brand-moss/5 text-brand-moss font-bold text-xs uppercase tracking-wider text-center cursor-pointer flex items-center justify-center gap-2 transition-all duration-300 shadow-sm"
                >
                  🔑 Admin
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={loading || (role === 'Teacher' && (!cvUrl || !govIdUrl || !degreeUrl || !videoUrl))}
                className="btn-magnetic w-full py-4 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-clay/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : (role === 'Teacher' ? 'Apply to Teach' : 'Create Account')}
              </button>
            )}
          </div>
        </form>

        {/* Dynamic divider and Google Auth Button */}
        <div className="relative my-4 flex py-1.5 items-center">
          <div className="flex-grow border-t border-brand-moss/10"></div>
          <span className="flex-shrink mx-3 text-2xs text-brand-charcoal/40 uppercase font-mono">or</span>
          <div className="flex-grow border-t border-brand-moss/10"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 rounded-full border border-brand-moss/20 hover:border-brand-moss/45 bg-white hover:bg-brand-moss/5 text-brand-moss font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>



        <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-brand-charcoal/50">
          <Shield className="w-3.5 h-3.5 text-brand-moss/40" />
          <span>Secured zero-trust local environment authentication.</span>
        </div>
      </div>
    </div>
  );
}
