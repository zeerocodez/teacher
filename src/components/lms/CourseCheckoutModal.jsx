import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, Wallet, CreditCard, CheckCircle2,
  AlertTriangle, Sparkles, X, ArrowRight, BookOpen, Clock,
  ExternalLink, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function CourseCheckoutModal({
  isOpen,
  onClose,
  course,
  currentUser,
  selectedCurrency = 'NGN',
  formatCurrency,
  convertMinor,
  onSuccess
}) {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // 'wallet' | 'paystack'
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingWallet, setFetchingWallet] = useState(true);
  const [teacherStatus, setTeacherStatus] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '/api';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('eduvista_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Fetch Wallet Balance & Teacher Verification Status
  useEffect(() => {
    async function checkPrerequisites() {
      if (!currentUser || !isOpen) return;

      setFetchingWallet(true);
      try {
        // 1. Fetch wallet balance
        const wRes = await fetch(`${API_BASE}/payments/wallet`, { headers: getAuthHeaders() });
        if (wRes.ok) {
          const wData = await wRes.json();
          setWalletBalance(wData.balance || 0);
        }

        // 2. Fetch teacher profile status
        if (currentUser.role === 'Teacher') {
          const tRes = await fetch(`${API_BASE}/teachers/${currentUser.uid}`, { headers: getAuthHeaders() });
          if (tRes.ok) {
            const tData = await tRes.json();
            setTeacherStatus(tData);
          }
        }
      } catch (err) {
        console.warn("Wallet fetch error:", err);
      } finally {
        setFetchingWallet(false);
      }
    }

    checkPrerequisites();
  }, [currentUser, isOpen]);

  if (!isOpen || !course) return null;

  const coursePrice = Number(course.price) || 0;
  const isVettedOnly = course.requiresVetting || course.accessType === 'vetted_teachers_only';
  
  // Verification check: Admins bypass, teachers must be verified or academy enrolled
  const isTeacher = currentUser?.role === 'Teacher';
  const isAdmin = currentUser?.role === 'Admin';
  const isVerifiedTeacher = isTeacher && (
    teacherStatus?.verified === true || 
    teacherStatus?.status === 'verified' || 
    currentUser?.academyEnrolled === true
  );

  const canAccessVetted = isAdmin || isVerifiedTeacher;
  const hasEnoughWallet = walletBalance >= coursePrice;

  // Formatted price display
  const priceDisplay = formatCurrency 
    ? formatCurrency(convertMinor ? convertMinor(coursePrice, 'NGN', selectedCurrency) : coursePrice, selectedCurrency)
    : `₦${(coursePrice / 100).toLocaleString()}`;

  const walletDisplay = formatCurrency
    ? formatCurrency(convertMinor ? convertMinor(walletBalance, 'NGN', selectedCurrency) : walletBalance, selectedCurrency)
    : `₦${(walletBalance / 100).toLocaleString()}`;

  // Handle Purchase Submission
  const handlePurchase = async () => {
    if (!currentUser) {
      toast("Please log in or register to purchase this course.");
      return;
    }

    if (isVettedOnly && !canAccessVetted) {
      toast.error("This course is restricted to approved & vetted teachers.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/lms/courses/${course.id}/purchase`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          paymentMethod,
          provider: paymentMethod === 'paystack' ? 'paystack' : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`🎉 ${data.message || 'Course unlocked successfully!'}`);
        onClose();
        if (onSuccess) {
          onSuccess(data.enrollment);
        } else {
          navigate(`/academy/classroom/${course.id}`);
        }
      } else {
        if (data.code === 'VETTING_REQUIRED') {
          toast.error("Vetting required: Complete your teacher onboarding.");
        } else if (data.code === 'INSUFFICIENT_BALANCE') {
          toast.error("Insufficient wallet balance. Please top up or pay with Card.");
        } else {
          toast.error(data.error || "Purchase failed.");
        }
      }
    } catch (err) {
      toast.error("An error occurred during checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 animate-slide-up relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-brand-cream/40 hover:bg-brand-cream text-brand-charcoal/60 hover:text-brand-charcoal flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-brand-clay bg-brand-clay/10 px-2.5 py-0.5 rounded-full">
              {course.category}
            </span>
            {isVettedOnly && (
              <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                Vetted Teachers Only
              </span>
            )}
          </div>

          <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-brand-moss leading-snug">
            {course.title}
          </h3>
        </div>

        {/* Course Card Preview */}
        <div className="p-4 bg-brand-cream/20 rounded-2xl border border-brand-moss/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={course.thumbnail || course.coverImage}
              alt=""
              className="w-14 h-14 rounded-xl object-cover border border-brand-moss/15 shrink-0"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-brand-moss block">{course.instructorName}</span>
              <span className="text-[10px] text-brand-charcoal/60 block">{course.duration} · {course.level} Level</span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="font-heading font-extrabold text-xl text-brand-moss block">
              {priceDisplay}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest text-emerald-700 font-bold block">
              Full Accreditation Pass
            </span>
          </div>
        </div>

        {/* 1. RESTRICTION WARNING IF NOT VETTED */}
        {isVettedOnly && !canAccessVetted ? (
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-start gap-2.5 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-heading font-bold text-xs">Accredited Academy Vetting Required</h4>
                <p className="text-[11px] text-amber-800/80 leading-relaxed font-sans mt-0.5">
                  This course is exclusively reserved for approved educators registered in the Elite Teachers Academy. Complete your teacher profile application and background check to unlock this masterclass.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                navigate('/dashboard');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              Complete Teacher Verification
            </button>
          </div>
        ) : (
          /* 2. PAYMENT METHODS SELECTOR */
          <div className="space-y-4">
            <label className="font-mono text-[10px] uppercase font-bold text-brand-charcoal/60 block">
              Select Payment Method
            </label>

            {/* Wallet Option */}
            <div
              onClick={() => setPaymentMethod('wallet')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                paymentMethod === 'wallet'
                  ? 'border-brand-clay bg-brand-clay/5 shadow-xs'
                  : 'border-brand-moss/15 hover:border-brand-moss/30 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-moss text-white flex items-center justify-center">
                    <Wallet className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-xs text-brand-moss block">
                      Platform Wallet Balance
                    </span>
                    <span className="font-mono text-[10px] text-brand-charcoal/60">
                      Available: <strong className="text-emerald-700">{walletDisplay}</strong>
                    </span>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'wallet' ? 'border-brand-clay' : 'border-brand-charcoal/30'}`}>
                  {paymentMethod === 'wallet' && <div className="w-2.5 h-2.5 rounded-full bg-brand-clay" />}
                </div>
              </div>

              {!hasEnoughWallet && paymentMethod === 'wallet' && (
                <div className="mt-2.5 pt-2 border-t border-brand-moss/10 flex items-center justify-between text-[10px] font-mono text-rose-600">
                  <span>Insufficient balance</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      navigate('/dashboard');
                    }}
                    className="font-bold underline hover:text-rose-700"
                  >
                    Top up wallet →
                  </button>
                </div>
              )}
            </div>

            {/* Paystack / Card Option */}
            <div
              onClick={() => setPaymentMethod('paystack')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                paymentMethod === 'paystack'
                  ? 'border-brand-clay bg-brand-clay/5 shadow-xs'
                  : 'border-brand-moss/15 hover:border-brand-moss/30 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-clay text-white flex items-center justify-center">
                    <CreditCard className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-xs text-brand-moss block">
                      Pay with Card / Paystack
                    </span>
                    <span className="font-mono text-[10px] text-brand-charcoal/60">
                      Visa, Mastercard, Bank Transfer, Apple Pay
                    </span>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'paystack' ? 'border-brand-clay' : 'border-brand-charcoal/30'}`}>
                  {paymentMethod === 'paystack' && <div className="w-2.5 h-2.5 rounded-full bg-brand-clay" />}
                </div>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handlePurchase}
              disabled={loading || (paymentMethod === 'wallet' && !hasEnoughWallet)}
              className="w-full py-3.5 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-transform scale-100 hover:scale-103 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span>Unlocking Course...</span>
              ) : (
                <>
                  <span>Pay {priceDisplay} & Unlock Course</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Security Footer */}
        <div className="pt-3 border-t border-brand-moss/10 flex items-center justify-between text-[9px] font-mono text-brand-charcoal/50">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            256-Bit SSL Escrow Encrypted
          </span>
          <span>Instant Lifetime Access & Certificate</span>
        </div>
      </div>
    </div>
  );
}
