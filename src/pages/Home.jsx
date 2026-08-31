import React, { Suspense } from "react";
import toast from "react-hot-toast";
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
  TrendingDown,
  DollarSign,
  Bell,
  MessageSquare,
  Send,
  X,
  HelpCircle,
  Mail,
  User,
  Play,
  BarChart2,
  Download,
} from "lucide-react";
import { Helmet } from 'react-helmet-async';
import heroImage from "../assets/hero.jpg";

const Marketplace = React.lazy(() => import("../components/Marketplace"));
const SessionEngine = React.lazy(() => import("../components/SessionEngine"));
const Academy = React.lazy(() => import("../components/Academy"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-12 w-full min-h-[200px]">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <div className="absolute inset-0 border-2 border-dashed border-brand-clay rounded-full animate-spin" />
        <span className="font-mono text-[9px] uppercase tracking-wider text-brand-moss font-bold">
          EB
        </span>
      </div>
    </div>
  );
}

export default function Home({
  t,
  scrollToSection,
  teachers,
  hasMoreTeachers,
  loadFilteredTeachers,
  teachersPage,
  selectedCurrency,
  handleBookClick,
  formatCurrency,
  convertMinor,
  handleTutorProfileSelect,
  watchingTeacherVideo,
  setWatchingTeacherVideo,
  bookedSessions,
  handleEndSession,
  escrowBalance,
  currentUser,
  handleUnlockBadge,
  setAuthTab,
  setIsAuthOpen,
  waitlistName,
  setWaitlistName,
  waitlistEmail,
  setWaitlistEmail,
  waitlistRole,
  setWaitlistRole,
  handleWaitlistSubmit,
  waitlistStatus,
  openFaqIdx,
  setOpenFaqIdx,
}) {
  return (
    <>
      <Helmet>
        <title>EduVistar | Premium 1-on-1 Online Home Tutoring & Private Lessons</title>
        <meta name="description" content="Connect with certified, background-checked private tutors for online home tutoring and personalized academic lessons." />
        <meta property="og:title" content="EduVistar | Online Home Tutoring" />
        <meta property="og:description" content="Connect with certified, background-checked private tutors for online home tutoring." />
      </Helmet>
      <section className="relative h-[95dvh] w-full overflow-hidden flex items-end justify-start md:justify-end pb-20 px-6 md:px-16 lg:px-24">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-brand-moss/80 to-transparent mix-blend-multiply opacity-95" />

        <div className="relative z-10 max-w-4xl text-left md:text-right flex flex-col items-start md:items-end w-full">
          <h1 className="font-heading font-bold text-white text-3xl sm:text-5xl md:text-7xl tracking-tight mb-4 flex flex-col gap-2 md:gap-4 w-full">
            <span className="hero-fade block leading-normal">
              {t("heroTitleFirst")}
            </span>
            <span className="hero-fade font-drama italic font-light text-brand-clay text-4xl sm:text-6xl md:text-8xl tracking-normal block leading-normal mt-2">
              {t("heroTitleSecond")}
            </span>
          </h1>

          <p className="hero-fade font-sans font-light text-brand-cream/80 text-base sm:text-lg md:text-xl max-w-xl md:ml-auto mb-8 leading-relaxed">
            {t("heroSubText")}
          </p>

          <div className="hero-fade flex flex-col sm:flex-row gap-4 justify-start md:justify-end w-full">
            <a
              href="#marketplace"
              onClick={scrollToSection("marketplace")}
              className="btn-magnetic group font-sans font-bold text-xs uppercase tracking-wider bg-brand-clay text-white px-8 py-4 rounded-full shadow-lg shadow-brand-clay/20 flex items-center justify-center gap-2"
            >
              <span>{t("exploreMarketplace")}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#academy"
              onClick={scrollToSection("academy")}
              className="btn-magnetic font-sans font-bold text-xs uppercase tracking-wider bg-brand-cream/10 backdrop-blur-sm text-brand-cream border border-brand-cream/30 hover:bg-brand-cream hover:text-brand-charcoal px-8 py-4 rounded-full"
            >
              {t("simulateLiveClass")}
            </a>
          </div>
        </div>
      </section>

      {/* Vetting Trust Manifesto Section */}
      <section className="bg-brand-moss text-brand-cream py-24 px-6 md:px-16 lg:px-24 border-y border-brand-cream/10 relative overflow-hidden trust-section">
        {/* Subtle decorative glowing background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-clay/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <h2 className="trust-fade font-heading font-bold text-4xl sm:text-5xl md:text-6xl text-white leading-[1.15] tracking-tight max-w-3xl">
            Premium private lessons & tutoring <br />
            <span className="font-drama italic text-brand-clay font-light text-5xl sm:text-6xl md:text-7xl block mt-3">
              you can trust completely.
            </span>
          </h2>

          <p className="trust-fade font-sans font-light text-brand-cream/80 text-base sm:text-lg md:text-xl max-w-3xl mt-8 leading-relaxed">
            EduVistar Africa connects you with certified, background-checked
            private tutors for online home tutoring and lessons. Every study
            session is server-timed, escrow-protected, and parent-monitored so
            you can see exactly how your child grows.
          </p>

          <div className="trust-fade flex flex-col sm:flex-row gap-4 justify-center items-center w-full mt-10">
            <a
              href="#marketplace"
              onClick={scrollToSection("marketplace")}
              className="btn-magnetic group font-sans font-bold text-xs uppercase tracking-wider bg-brand-clay text-white px-8 py-4 rounded-full shadow-lg shadow-brand-clay/20 flex items-center justify-center gap-2 hover:bg-brand-clay/90"
            >
              <span>Find a Private Tutor Now →</span>
            </a>
            <a
              href="#protocol"
              onClick={scrollToSection("protocol")}
              className="btn-magnetic font-sans font-bold text-xs uppercase tracking-wider bg-white text-brand-moss hover:bg-brand-cream/90 px-8 py-4 rounded-full transition-colors"
            >
              How Online Tutoring Works
            </a>
          </div>

          <div className="trust-fade my-8 flex justify-center">
            <a
              href="#marketplace"
              onClick={scrollToSection("marketplace")}
              className="w-12 h-12 rounded-full border border-white/20 hover:border-brand-clay hover:text-brand-clay transition-all duration-300 flex items-center justify-center text-white/60 animate-bounce"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </a>
          </div>

          <div className="trust-fade flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-12 select-none w-full max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[160px] shadow-xl shadow-brand-charcoal/50 hover:-translate-y-1 transition-transform">
              <span className="text-brand-clay font-drama text-4xl sm:text-5xl mb-1">
                4,200+
              </span>
              <span className="text-white/80 font-sans text-xs uppercase tracking-widest font-bold">
                Verified Tutors
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[160px] shadow-xl shadow-brand-charcoal/50 hover:-translate-y-1 transition-transform">
              <span className="text-white font-drama italic font-light text-4xl sm:text-5xl mb-1">
                98
              </span>
              <span className="text-white/80 font-sans text-xs uppercase tracking-widest font-bold">
                Countries
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[160px] shadow-xl shadow-brand-charcoal/50 hover:-translate-y-1 transition-transform">
              <span className="text-brand-clay font-drama text-4xl sm:text-5xl mb-1 flex items-center">
                4.9 <Star className="w-6 h-6 ml-1 fill-current" />
              </span>
              <span className="text-white/80 font-sans text-xs uppercase tracking-widest font-bold">
                Average Rating
              </span>
            </div>
          </div>

          {/* Parent Testimonials Section */}
          <div className="trust-fade mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 text-left w-full max-w-5xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-white text-brand-charcoal rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between hover-lift">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-moss text-brand-cream flex items-center justify-center font-heading font-extrabold text-sm shrink-0">
                    NG
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-brand-moss text-base leading-snug">
                      Ngozi A. — Lagos, Nigeria
                    </h4>
                    <div className="flex gap-0.5 text-brand-clay mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </div>
                </div>
                <p className="font-sans italic text-sm text-brand-charcoal/80 leading-relaxed">
                  "Within two weeks I could see Timi’s algebra scores improving.
                  For the first time I actually have proof of what’s being
                  taught — the clock log, the assignments, the AI reports.
                  Nothing like any other tutor I’ve used."
                </p>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white text-brand-charcoal rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between hover-lift">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-800 text-white flex items-center justify-center font-heading font-extrabold text-sm shrink-0">
                    DS
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-brand-moss text-base leading-snug">
                      Damilola S. — London, UK
                    </h4>
                    <div className="flex gap-0.5 text-brand-clay mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </div>
                </div>
                <p className="font-sans italic text-sm text-brand-charcoal/80 leading-relaxed">
                  "I pay in GBP from London. Zara’s teacher is in Lagos. Every
                  session I can see the clock log — exactly how long they
                  taught, what was covered. No other platform gives diaspora
                  parents this level of control."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Preview Section (Mock Dashboard) */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-[#f8f9fa] border-b border-gray-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-3">
              Powerful Analytics
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-5xl text-brand-moss tracking-tight">
              Actionable insights for parents and admins.
            </h2>
            <p className="font-sans text-brand-charcoal/70 mt-3 text-sm">
              Experience total transparency with interactive dashboards that
              track attendance, compliance, and student performance week over
              week.
            </p>
          </div>

          {/* Fake Dashboard Window */}
          <div className="bg-white rounded-2xl shadow-2xl shadow-brand-charcoal/10 border border-gray-200 overflow-hidden relative group">
            {/* Window controls (fake) */}
            <div className="bg-gray-50 border-b border-gray-200 h-10 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <div className="mx-auto flex items-center bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-400 font-mono">
                <Lock className="w-3 h-3 mr-1" /> eduvistar.africa/dashboard
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                    <BarChart2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                      Weekly Reports
                    </h3>
                    <p className="text-sm text-gray-500">
                      Track performance trends and generate insights
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 shadow-sm cursor-pointer hover:border-gray-300">
                    8 Weeks{" "}
                    <ChevronRight className="inline w-4 h-4 ml-2 rotate-90" />
                  </div>
                  <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm flex items-center gap-2 transition-colors">
                    <Download size={16} /> Export All
                  </button>
                </div>
              </div>

              {/* Colorful Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Blue Card */}
                <div className="bg-[#3b82f6] rounded-xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
                  <div className="absolute top-4 right-4 opacity-50">
                    <Calendar size={24} />
                  </div>
                  <span className="block text-xs font-bold text-blue-100 mb-1 opacity-90 uppercase tracking-wider">
                    This Week
                  </span>
                  <span className="block text-4xl font-bold tracking-tight mb-1">
                    94%
                  </span>
                  <span className="block text-sm font-medium text-blue-100 opacity-90">
                    Submission Rate
                  </span>
                </div>
                {/* Green Card */}
                <div className="bg-[#10b981] rounded-xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                  <div className="absolute top-4 right-4 opacity-50">
                    <TrendingUp size={24} />
                  </div>
                  <span className="block text-xs font-bold text-emerald-100 mb-1 opacity-90 uppercase tracking-wider">
                    On-Time Rate
                  </span>
                  <span className="block text-4xl font-bold tracking-tight mb-1">
                    88%
                  </span>
                  <span className="block text-sm font-medium text-emerald-100 opacity-90">
                    This Week
                  </span>
                </div>
                {/* Purple Card */}
                <div className="bg-[#8b5cf6] rounded-xl p-6 text-white shadow-lg shadow-purple-500/20 relative overflow-hidden">
                  <div className="absolute top-4 right-4 opacity-50">
                    <Activity size={24} />
                  </div>
                  <span className="block text-xs font-bold text-purple-100 mb-1 opacity-90 uppercase tracking-wider">
                    Average Grade
                  </span>
                  <span className="block text-4xl font-bold tracking-tight mb-1">
                    8.2/10
                  </span>
                  <span className="block text-sm font-medium text-purple-100 opacity-90">
                    This Week
                  </span>
                </div>
                {/* Orange Card */}
                <div className="bg-[#f59e0b] rounded-xl p-6 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden">
                  <div className="absolute top-4 right-4 opacity-50">
                    <CheckCircle2 size={24} />
                  </div>
                  <span className="block text-xs font-bold text-amber-100 mb-1 opacity-90 uppercase tracking-wider">
                    Compliance
                  </span>
                  <span className="block text-4xl font-bold tracking-tight mb-1">
                    88%
                  </span>
                  <span className="block text-sm font-medium text-amber-100 opacity-90">
                    Curriculum Standards
                  </span>
                </div>
              </div>

              {/* Week over Week Comparison Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h4 className="font-bold text-gray-900 text-lg">
                  Week-over-Week Comparison
                </h4>
                <p className="text-sm text-gray-500 mb-6">
                  Compare current week performance with previous week
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Item 1 */}
                  <div className="border border-gray-100 rounded-lg p-5 flex flex-col relative">
                    <div className="absolute top-5 right-5 text-emerald-500">
                      <TrendingUp size={16} />
                    </div>
                    <span className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                      Submission Rate
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        94%
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        vs 89%
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-500 mt-1">
                      +5%
                    </span>
                  </div>
                  {/* Item 2 */}
                  <div className="border border-gray-100 rounded-lg p-5 flex flex-col relative">
                    <div className="absolute top-5 right-5 text-emerald-500">
                      <TrendingUp size={16} />
                    </div>
                    <span className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                      On-Time Rate
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        88%
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        vs 85%
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-500 mt-1">
                      +3%
                    </span>
                  </div>
                  {/* Item 3 */}
                  <div className="border border-gray-100 rounded-lg p-5 flex flex-col relative">
                    <div className="absolute top-5 right-5 text-emerald-500">
                      <TrendingUp size={16} />
                    </div>
                    <span className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                      Average Grade
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        8.2/10
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        vs 7.9/10
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-500 mt-1">
                      +0.3/10
                    </span>
                  </div>
                  {/* Item 4 */}
                  <div className="border border-gray-100 rounded-lg p-5 flex flex-col relative">
                    <div className="absolute top-5 right-5 text-emerald-500">
                      <TrendingUp size={16} />
                    </div>
                    <span className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                      Compliance
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        88%
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        vs 85%
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-500 mt-1">
                      +3%
                    </span>
                  </div>
                  {/* Item 5 */}
                  <div className="border border-gray-100 rounded-lg p-5 flex flex-col relative">
                    <div className="absolute top-5 right-5 text-rose-500">
                      <TrendingDown size={16} />
                    </div>
                    <span className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                      Watchlist Teachers
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        3
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        vs 5
                      </span>
                    </div>
                    <span className="text-xs font-bold text-rose-500 mt-1">
                      -2
                    </span>
                  </div>
                  {/* Item 6 */}
                  <div className="border border-gray-100 rounded-lg p-5 flex flex-col relative">
                    <div className="absolute top-5 right-5 text-rose-500">
                      <TrendingDown size={16} />
                    </div>
                    <span className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                      AI Recommendations
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        24
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        vs 31
                      </span>
                    </div>
                    <span className="text-xs font-bold text-rose-500 mt-1">
                      -7
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding Pipeline Section */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-brand-cream text-brand-charcoal border-b border-brand-moss/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left Column: Timeline Stepper */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-28">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-3">
                FOR PARENTS
              </span>
              <h2 className="font-heading font-bold text-3xl sm:text-5xl text-brand-moss leading-[1.15] tracking-tight">
                Get started with online <br />
                home tutoring in under 10 minutes.
              </h2>
              <p className="font-sans text-brand-charcoal/70 mt-6 text-base leading-relaxed">
                No agency markups. No deposits. Select certified private lesson
                teachers for school curriculum support, WAEC/JAMB prep, or
                international exam lessons.
              </p>
            </div>

            {/* Stepper Steps */}
            <div className="space-y-8 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-[2px] before:bg-brand-moss/10">
              {/* Step 1 */}
              <div className="flex gap-6 relative">
                <div className="w-12 h-12 rounded-full bg-brand-moss text-brand-cream border border-brand-moss/20 flex items-center justify-center font-heading font-extrabold text-sm shrink-0 z-10">
                  1
                </div>
                <div className="space-y-1 mt-1">
                  <h4 className="font-heading font-bold text-brand-moss text-lg">
                    Select Certified Tutors
                  </h4>
                  <p className="font-sans text-brand-charcoal/70 text-sm leading-relaxed">
                    Browse our directory of top-tier tutors. Filter by subject,
                    level, and specific syllabus (Cambridge IGCSE, WAEC/JAMB,
                    IB). Compare rates and read verified parent reviews.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6 relative">
                <div className="w-12 h-12 rounded-full bg-brand-moss text-brand-cream border border-brand-moss/20 flex items-center justify-center font-heading font-extrabold text-sm shrink-0 z-10">
                  2
                </div>
                <div className="space-y-1 mt-1">
                  <h4 className="font-heading font-bold text-brand-moss text-lg">
                    Schedule Your Trial Lesson
                  </h4>
                  <p className="font-sans text-brand-charcoal/70 text-sm leading-relaxed">
                    Book a trial class with absolute safety. Payments are
                    processed securely and held in escrow until the lesson
                    concludes. Your first class is backed by a 100% refund
                    guarantee.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6 relative">
                <div className="w-12 h-12 rounded-full bg-brand-moss text-brand-cream border border-brand-moss/20 flex items-center justify-center font-heading font-extrabold text-sm shrink-0 z-10">
                  3
                </div>
                <div className="space-y-1 mt-1">
                  <h4 className="font-heading font-bold text-brand-moss text-lg">
                    Track Academic Lessons
                  </h4>
                  <p className="font-sans text-brand-charcoal/70 text-sm leading-relaxed">
                    Access your parent dashboard to view the lesson clock log,
                    grade assignments, review teacher syllabus notes, and read
                    weekly student reports generated by AI.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <a
                href="#marketplace"
                onClick={scrollToSection("marketplace")}
                className="btn-magnetic group font-sans font-bold text-xs uppercase tracking-wider bg-brand-clay text-white px-8 py-4 rounded-full shadow-lg shadow-brand-clay/20 flex items-center justify-center gap-2 hover:bg-brand-clay/90 w-fit"
              >
                <span>Find a Teacher Now</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Right Column: Detailed Cards */}
          <div className="lg:col-span-7 space-y-8">
            {/* Card A: Session Clock */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-8 shadow-sm flex items-start gap-5 hover-lift">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                <Activity className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-xl text-brand-moss">
                  Automated Lesson Clock
                </h3>
                <p className="font-sans text-brand-charcoal/70 text-sm leading-relaxed">
                  Our built-in classroom clock logs lessons to the exact second.
                  You pay only for time spent tutoring, preventing billing
                  manipulation or dispute issues.
                </p>
              </div>
            </div>

            {/* Card B: Live Progress Dashboard */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-8 shadow-sm flex items-start gap-5 hover-lift">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-xl text-brand-moss">
                  Parent Progress Portals
                </h3>
                <p className="font-sans text-brand-charcoal/70 text-sm leading-relaxed">
                  Track attendance, school tests, assignment grades, and tutor
                  lesson notes inside a single portal. Get clear visual
                  performance analysis and AI-curated updates weekly.
                </p>
              </div>
            </div>

            {/* Card C: Escrow Payment Protection */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-8 shadow-sm flex items-start gap-5 hover-lift">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-xl text-brand-moss">
                  Escrow Protection for Lessons
                </h3>
                <p className="font-sans text-brand-charcoal/70 text-sm leading-relaxed">
                  Funds are held in secure escrow and released to educators only
                  after the tutoring session is finished. Your investment in
                  your child's lessons is fully protected.
                </p>
              </div>
            </div>

            {/* Money-Back Guarantee highlighted card */}
            <div className="bg-brand-moss text-brand-cream border border-brand-cream/10 rounded-[2.5rem] p-8 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-clay/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-3 text-brand-clay">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span className="font-mono text-2xs uppercase tracking-widest font-extrabold">
                  EduVistar Guarantee
                </span>
              </div>
              <h3 className="font-heading font-bold text-2xl text-white mb-2 uppercase tracking-tight">
                Money-Back Guarantee
              </h3>
              <p className="font-sans text-brand-cream/80 text-sm leading-relaxed">
                Not satisfied after your first online home tutoring session?
                Full refund, no questions asked. Your risk is zero.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Teacher Quality Standards Section */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-white border-b border-brand-moss/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-3">
              THE EDUVISTAR STANDARD
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-5xl text-brand-moss tracking-tight leading-tight">
              Vetted Private Tutors for <br className="hidden sm:inline" />
              <span className="font-drama italic text-brand-clay font-light text-4xl sm:text-6xl block mt-2">
                Online & Home Lessons.
              </span>
            </h2>
            <p className="font-sans text-brand-charcoal/70 mt-6 max-w-xl mx-auto text-base leading-relaxed">
              We screen and onboard only the top 20% of tutor applicants. Rest
              easy knowing your child is learning from a verified professional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Identity Verified */}
            <div className="bg-brand-cream/30 border border-brand-moss/5 rounded-[2.5rem] p-8 shadow-sm flex items-start gap-5 hover-lift">
              <div className="w-12 h-12 rounded-2xl bg-brand-moss/5 border border-brand-moss/10 flex items-center justify-center shrink-0 text-brand-moss">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-xl text-brand-moss">
                  Vetted Private Tutors
                </h3>
                <p className="font-sans text-brand-charcoal/70 text-sm leading-relaxed">
                  Government-issued ID and background clearance confirmed before
                  any tutor listing goes live.
                </p>
              </div>
            </div>

            {/* Credentials Checked */}
            <div className="bg-brand-cream/30 border border-brand-moss/5 rounded-[2.5rem] p-8 shadow-sm flex items-start gap-5 hover-lift">
              <div className="w-12 h-12 rounded-2xl bg-brand-moss/5 border border-brand-moss/10 flex items-center justify-center shrink-0 text-brand-moss">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-xl text-brand-moss">
                  Academic Board Verified
                </h3>
                <p className="font-sans text-brand-charcoal/70 text-sm leading-relaxed">
                  Degree certificates, qualifications, and curriculum
                  instruction capabilities verified manually.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Parent Stories Section */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-brand-cream/30 border-b border-brand-moss/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-3">
              PARENT STORIES
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-5xl text-brand-moss tracking-tight">
              What parents say after the first month.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Story 1 */}
            <div className="bg-white border border-emerald-500/20 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between hover-lift relative overflow-hidden">
              {/* Giant quote mark icon in background */}
              <div className="absolute top-4 right-6 text-brand-moss/5 font-serif text-9xl leading-none pointer-events-none select-none">
                “
              </div>
              <div className="space-y-6 relative z-10">
                <div className="flex gap-0.5 text-brand-clay">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <p className="font-sans italic text-sm sm:text-base text-brand-charcoal/85 leading-relaxed">
                  "I have tried two other platforms and three Facebook tutors.
                  EduVistar is the only one where I actually feel in control. The
                  dashboard shows me everything. I do not have to chase the
                  teacher for updates."
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-brand-moss/5">
                  <div className="w-10 h-10 rounded-full bg-brand-moss text-brand-cream flex items-center justify-center font-heading font-extrabold text-xs">
                    NA
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-brand-moss text-sm">
                      Ngozi A.
                    </h4>
                    <p className="font-sans text-brand-charcoal/55 text-xs">
                      Lagos - JSS3 Maths
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Story 2 */}
            <div className="bg-white border border-emerald-500/20 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between hover-lift relative overflow-hidden">
              <div className="absolute top-4 right-6 text-brand-moss/5 font-serif text-9xl leading-none pointer-events-none select-none">
                “
              </div>
              <div className="space-y-6 relative z-10">
                <div className="flex gap-0.5 text-brand-clay">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <p className="font-sans italic text-sm sm:text-base text-brand-charcoal/85 leading-relaxed">
                  "My daughter moved from D to B in IGCSE Chemistry in 8 weeks.
                  But what I value most is the trust. I know who is teaching
                  her, I see how long, I see the homework. EduVistar gave me that
                  transparency."
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-brand-moss/5">
                  <div className="w-10 h-10 rounded-full bg-brand-moss text-brand-cream flex items-center justify-center font-heading font-extrabold text-xs">
                    DS
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-brand-moss text-sm">
                      Damilola S.
                    </h4>
                    <p className="font-sans text-brand-charcoal/55 text-xs">
                      London - IGCSE Chemistry
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Find Teachers Component */}
      <Suspense fallback={<LoadingFallback />}>
        <Marketplace
          teachers={teachers}
          hasMoreTeachers={hasMoreTeachers}
          loadFilteredTeachers={loadFilteredTeachers}
          teachersPage={teachersPage}
          selectedCurrency={selectedCurrency}
          onBookClick={handleBookClick}
          formatCurrency={formatCurrency}
          convertMinor={convertMinor}
          onTeacherSelect={handleTutorProfileSelect}
          onWatchVideo={(teacher) => setWatchingTeacherVideo(teacher)}
        />
      </Suspense>

      {/* Live Session Classroom Sandbox */}
      <Suspense fallback={<LoadingFallback />}>
        <SessionEngine
          bookedSessions={bookedSessions}
          onEndSession={handleEndSession}
          escrowBalance={escrowBalance}
          formatCurrency={formatCurrency}
          selectedCurrency={selectedCurrency}
          convertMinor={convertMinor}
        />
      </Suspense>

      {/* AI Academy */}
      <Suspense fallback={<LoadingFallback />}>
        <Academy
          currentUser={currentUser}
          selectedCurrency={selectedCurrency}
          formatCurrency={formatCurrency}
          convertMinor={convertMinor}
          onUnlockBadge={handleUnlockBadge}
          onRegisterClick={() => {
            setAuthTab("register");
            setIsAuthOpen(true);
          }}
        />
      </Suspense>

      {/* Manifesto */}
      <section
        id="manifesto"
        className="relative py-32 bg-brand-charcoal text-brand-cream overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1545167622-3a6ac756afa4?q=80&w=1600&auto=format&fit=crop')`,
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <p className="font-heading text-lg sm:text-2xl text-brand-cream/60 tracking-wide uppercase mb-12">
            Most online home tutoring sites focus on: basic tutor matching.
          </p>
          <div className="h-px w-24 bg-brand-cream/15 mx-auto mb-12" />
          <h2 className="font-drama italic text-3xl sm:text-6xl md:text-7xl leading-tight text-white font-light">
            We focus on: verified{" "}
            <span className="text-brand-clay not-italic font-heading font-bold">
              instructional excellence and private lessons.
            </span>
          </h2>
        </div>
      </section>

      {/* Stacking protocol cards */}
      <section
        id="protocol"
        className="relative bg-brand-moss text-brand-cream min-h-screen flex flex-col justify-between py-16 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 w-full mb-8">
          <h2 className="font-heading font-bold text-3xl sm:text-5xl tracking-tight text-white mb-2">
            Vetting Protocol for Home Tutoring & Lessons
          </h2>
        </div>

        <div className="relative flex-1 w-full max-w-6xl mx-auto px-6 min-h-[70vh]">
          {/* Card 1 */}
          <div className="protocol-stack absolute inset-0 flex items-center justify-center">
            <div className="bg-brand-charcoal border border-brand-cream/10 rounded-[3rem] w-full p-8 md:p-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
              <div className="space-y-6">
                <span className="font-mono text-xs text-brand-clay tracking-widest block">
                  01 // VERIFICATION
                </span>
                <h3 className="font-heading font-bold text-3xl sm:text-5xl text-white">
                  Background Vetting & ID Verification
                </h3>
                <p className="font-sans text-brand-cream/70 text-base leading-relaxed">
                  Every private tutor undergoes strict ID validation, degree
                  credential checks, and background vetting to ensure maximum
                  safety for child home tutoring.
                </p>
              </div>
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-dashed border-brand-clay/30 rounded-full animate-[spin_20s_linear_infinite]" />
                  <div className="absolute w-48 h-48 border border-brand-cream/20 rounded-full flex items-center justify-center animate-[spin_12s_linear_infinite_reverse]">
                    <div className="w-full h-1 border-t border-brand-clay/40" />
                  </div>
                  <div className="absolute w-32 h-32 border border-brand-clay/35 rounded-full flex items-center justify-center animate-pulse-slow">
                    <div className="w-16 h-16 rounded-full bg-brand-clay/10 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-brand-clay" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="protocol-stack absolute inset-0 flex items-center justify-center">
            <div className="bg-brand-charcoal border border-brand-cream/10 rounded-[3rem] w-full p-8 md:p-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
              <div className="space-y-6">
                <span className="font-mono text-xs text-brand-clay tracking-widest block">
                  02 // INSTRUCTION
                </span>
                <h3 className="font-heading font-bold text-3xl sm:text-5xl text-white">
                  Pedagogical & AI Instruction Training
                </h3>
                <p className="font-sans text-brand-cream/70 text-base leading-relaxed">
                  Our educators undergo continuous training in digital class
                  instruction, curriculum alignment, and leveraging AI tools for
                  adaptive private lessons.
                </p>
              </div>
              <div className="flex items-center justify-center h-full min-h-[300px] w-full">
                <div className="relative w-64 h-48 bg-brand-moss/10 border border-brand-cream/10 rounded-2xl overflow-hidden flex flex-col justify-between p-4">
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-2 p-4 opacity-20 pointer-events-none">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-brand-cream mx-auto my-auto"
                      />
                    ))}
                  </div>
                  <div
                    className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-clay to-transparent shadow-lg shadow-brand-clay animate-[scan_4s_ease-in-out_infinite]"
                    style={{
                      boxShadow: "0 0 10px #CC5833, 0 0 20px #CC5833",
                      animation: "scan 4s ease-in-out infinite",
                    }}
                  />
                  <div className="relative z-10 flex justify-between items-start font-mono text-[9px] text-brand-cream/40">
                    <span>VETTING: RUNNING</span>
                    <span>1.5 PRO READY</span>
                  </div>
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                    @keyframes scan {
                      0%, 100% { top: 5%; }
                      50% { top: 95%; }
                    }
                  `,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="protocol-stack absolute inset-0 flex items-center justify-center">
            <div className="bg-brand-charcoal border border-brand-cream/10 rounded-[3rem] w-full p-8 md:p-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
              <div className="space-y-6">
                <span className="font-mono text-xs text-brand-clay tracking-widest block">
                  03 // SETTLEMENT
                </span>
                <h3 className="font-heading font-bold text-3xl sm:text-5xl text-white">
                  Secure Payment & Escrow Settlement
                </h3>
                <p className="font-sans text-brand-cream/70 text-base leading-relaxed">
                  Escrowed funds are released safely to the tutor's account only
                  after successful lesson delivery, ensuring absolute trust and
                  financial safety.
                </p>
              </div>
              <div className="flex items-center justify-center h-full min-h-[300px] w-full">
                <div className="relative w-64 h-48 flex items-center justify-center bg-brand-moss/10 border border-brand-cream/10 rounded-2xl p-4 overflow-hidden">
                  <svg viewBox="0 0 200 100" className="w-full h-full">
                    <path
                      d="M0 50 L40 50 L50 30 L60 70 L70 50 L100 50 L110 20 L120 80 L130 50 L150 50"
                      fill="none"
                      stroke="#CC5833"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="ekg-path"
                    />
                  </svg>
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                    .ekg-path {
                      stroke-dasharray: 400;
                      stroke-dashoffset: 400;
                      animation: ekg-draw 3s linear infinite;
                    }
                    @keyframes ekg-draw {
                      to { stroke-dashoffset: 0; }
                    }
                  `,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-white border-b border-brand-moss/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-3">
                COMMON QUESTIONS
              </span>
              <h2 className="font-heading font-bold text-3xl sm:text-5xl text-brand-moss leading-tight tracking-tight">
                Questions About Online Home Tutoring & Private Lessons.
              </h2>
              <p className="font-sans text-brand-charcoal/70 mt-6 text-sm leading-relaxed">
                Still have questions? Our team is on WhatsApp — tap the button
                below and we will answer in under 5 minutes.
              </p>
            </div>

            <a
              href="https://wa.me/2348136451607"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-magnetic bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-6 rounded-full inline-flex items-center gap-2 text-xs uppercase tracking-wider text-center"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.022-.015-.078-.046-.164-.093-.086-.047-.506-.25-5.84-2.888-2.612-1.28-4.322-3.882-4.322-6.52 0-2.316 1.155-4.148 2.37-5.18.125-.106.312-.132.464-.067.153.066.862.43 1.173.61.312.18.528.328.647.532.146.25.105.782-.124 1.174-.168.288-.667.864-.81 1.05-.143.187-.29.39-.124.673.167.283.743 1.222 1.594 1.983.85.76 1.565 1.246 1.83 1.393.264.148.47.168.65-.024.18-.19.78-.903.99-1.214.21-.31.42-.26.702-.153.284.106 1.8.848 2.11 1.002.31.155.518.232.593.36.076.128.076.743-.153 1.174-.23.43-1.346 1.702-2.373 1.702-.924 0-1.89-.356-3.83-1.298-5.84-2.888-6.195-6.666-6.195-7.394 0-.728.384-1.428 1.155-2.02.772-.593.924-.67.924-.67l.154-.067c.188-.06.34-.143.43-.228.09-.085.11-.205.07-.315-.05-.144-.72-1.745-.986-2.372-.265-.628-.535-.613-.728-.613h-.624c-.212 0-.556.08-.85.4-.294.32-1.127 1.102-1.127 2.69 0 1.588 1.156 3.125 1.316 3.34.16.216 2.274 3.473 5.51 4.878 2.766 1.2 3.84 1.446 5.2 1.25 1.5-.213 3.09-1.263 3.52-2.428.43-1.164.43-2.164.3-2.37-.123-.207-.464-.326-.81-.476z" />
              </svg>
              Chat on WhatsApp
            </a>
          </div>

          {/* Right Column Accordion */}
          <div className="lg:col-span-7 space-y-4">
            {[
              {
                q: "What if my child is not happy with the first lesson?",
                a: "Full refund on your first session with any teacher. No questions, no forms. Just let us know within 48 hours and your money is returned.",
              },
              {
                q: "Can sessions be recorded?",
                a: "Yes, with consent from both teacher and parent. Recordings are stored securely and accessible for 30 days. They are automatically deleted after that. Access is private — only you and the teacher can view.",
              },
              {
                q: "How do I know the teacher is really qualified?",
                a: "Every teacher on EduVistar has submitted government-issued ID and qualification documents reviewed by our admin team. They have also completed our ELITE TEACHERS ACADEMY and hold a verified badge. Fewer than 1 in 5 applicants are accepted.",
              },
              {
                q: "What happens if the teacher does not show up?",
                a: "Your payment is in escrow and is never released if the session does not happen. You receive a full refund automatically within 24 hours, with no forms to fill.",
              },
              {
                q: "How is the teaching time tracked? Can it be manipulated?",
                a: "The session clock is server-side — it cannot be changed by the teacher or student. It logs every second and pauses if either party disconnects. The log is available to you to review after every session.",
              },
              {
                q: "Can I pay in GBP, USD, or CAD?",
                a: "Yes. Select your currency in the top navigation. We accept NGN, USD, GBP, EUR, GHS, and CAD via Paystack. Your teacher earns in their currency — you pay in yours.",
              },
            ].map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="bg-brand-cream/20 border border-brand-moss/10 rounded-[1.5rem] overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full text-left py-5 px-6 flex items-center justify-between gap-4 font-heading font-bold text-brand-moss text-base hover:bg-brand-cream/10 transition-colors"
                  >
                    <span>{item.q}</span>
                    <span
                      className={`text-brand-clay font-bold text-xl transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div className="py-4 px-6 border-t border-brand-moss/5 bg-white font-sans text-sm text-brand-charcoal/80 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Banner Section */}
      <section className="py-12 px-6 md:px-16 lg:px-24 bg-white">
        <div className="max-w-5xl mx-auto bg-brand-moss text-brand-cream rounded-[3rem] p-12 md:p-16 text-center relative overflow-hidden shadow-2xl hover-lift">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-clay/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-extrabold block">
              YOUR CHILD'S EDUCATION IS NOT SOMETHING TO LEAVE TO CHANCE
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl text-white leading-tight tracking-tight">
              Provide the Best Online Home Tutoring & Lessons for Your Child.{" "}
              <br />
              <span className="font-drama italic text-brand-clay font-light text-4xl sm:text-5xl md:text-6xl block mt-2">
                Start with a risk-free trial private lesson today.
              </span>
            </h2>
            <p className="font-sans text-brand-cream/80 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed pt-2">
              Join 18,000+ families across Africa and the diaspora who trust
              EduVistar Africa for their children's private tutoring. Verified
              teachers. Transparent progress. Payment protection. Always.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <a
                href="#marketplace"
                onClick={scrollToSection("marketplace")}
                className="btn-magnetic font-sans font-bold text-xs uppercase tracking-wider bg-brand-clay text-white px-8 py-4 rounded-full shadow-lg shadow-brand-clay/20 flex items-center justify-center gap-2 hover:bg-brand-clay/90"
              >
                Find My Child's Teacher →
              </a>
              <a
                href="#marketplace"
                onClick={scrollToSection("marketplace")}
                className="btn-magnetic font-sans font-bold text-xs uppercase tracking-wider bg-transparent text-white border border-white/30 hover:bg-white/10 px-8 py-4 rounded-full"
              >
                View Verified Teachers
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-[11px] text-brand-cream/60 font-medium">
              <span className="flex items-center gap-1.5">
                ✓ First lesson money-back guarantee
              </span>
              <span className="flex items-center gap-1.5">
                ✓ No subscription. No pre-payment.
              </span>
              <span className="flex items-center gap-1.5">
                ✓ Pay in your currency
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Packages */}
      <section
        id="pricing"
        className="py-24 px-6 md:px-16 lg:px-24 bg-brand-cream text-brand-charcoal"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-heading font-bold text-3xl sm:text-5xl text-brand-moss tracking-tight">
              Begin Academic Acceleration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
            {/* Trial */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-8 flex flex-col justify-between h-[500px] custom-card-shadow hover-lift">
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">
                    Single session
                  </span>
                  <h3 className="font-heading font-bold text-2xl text-brand-moss mt-1">
                    Trial Pack
                  </h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-bold text-brand-moss">
                    FREE
                  </span>
                  <span className="font-mono text-xs text-brand-charcoal/50 block mt-1">
                    / one-time
                  </span>
                </div>
                <ul className="space-y-3 font-sans text-xs text-brand-charcoal/80">
                  <li className="flex items-center gap-2">
                    ✓ 1-on-1 Trial Lesson
                  </li>
                  <li className="flex items-center gap-2">
                    ✓ Local Escrow Protection
                  </li>
                  <li className="flex items-center gap-2">
                    ✓ 100% Refundable Guarantee
                  </li>
                </ul>
              </div>
              <a
                href="#marketplace"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("marketplace")(e);
                  toast.success(
                    "Select a verified teacher below to book your Trial Class.",
                    { duration: 4000 },
                  );
                }}
                className="btn-magnetic w-full py-3.5 px-6 rounded-full border border-brand-moss text-brand-moss font-bold hover:bg-brand-clay hover:border-brand-clay hover:text-white transition-colors text-xs uppercase tracking-wider text-center"
              >
                Book Trial Class
              </a>
            </div>

            {/* Performance */}
            <div className="bg-brand-moss border border-brand-moss rounded-[2.5rem] p-8 flex flex-col justify-between h-[540px] text-brand-cream relative shadow-2xl scale-105 z-10 border-2 border-brand-clay">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-clay text-white font-mono text-[10px] tracking-widest uppercase font-bold py-1 px-4 rounded-full">
                RECOMMENDED
              </div>
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-2xs text-brand-cream/50 block uppercase">
                    8 Session Pack (2 TIMES A WEEK)
                  </span>
                  <h3 className="font-heading font-bold text-2xl text-white mt-1 font-bold">
                    Performance Bundle
                  </h3>
                </div>
                <div className="flex items-baseline gap-1 mt-4 mb-3">
                  <span className="font-heading text-lg font-bold text-white uppercase">
                    <strong>Subject to Tutors Rates</strong>
                  </span>
                </div>
                <ul className="space-y-3 font-sans text-xs text-brand-cream/90">
                  <li className="flex items-center gap-2">
                    ✓ 8 Live Private Classes
                  </li>
                  <li className="flex items-center gap-2">
                    ✓ Attendance & Score Tracking
                  </li>
                  <li className="flex items-center gap-2">
                    ✓ Cognitive Gemini Insights
                  </li>
                  <li className="flex items-center gap-2">
                    ✓ Secure Escrow Release
                  </li>
                </ul>
              </div>
              <a
                href="#marketplace"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("marketplace")(e);
                  toast.success(
                    "Select a verified teacher below to book your Performance Bundle.",
                    { duration: 4000 },
                  );
                }}
                className="btn-magnetic w-full py-4 px-6 rounded-full bg-brand-clay text-white font-bold hover:bg-brand-clay/90 transition-colors shadow-lg text-xs uppercase tracking-wider text-center"
              >
                Book Bundle
              </a>
            </div>

            {/* Academic Prep */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-8 flex flex-col justify-between h-[500px] custom-card-shadow hover-lift">
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">
                    16 Session Intensive (4 TIMES A WEEK)
                  </span>
                  <h3 className="font-heading font-bold text-2xl text-brand-moss mt-1 font-bold">
                    Academic Prep
                  </h3>
                </div>
                <div className="flex items-baseline gap-1 mt-4 mb-3">
                  <span className="font-heading text-lg font-bold text-brand-moss uppercase">
                    <strong>Subject to Tutors Rates</strong>
                  </span>
                </div>
                <ul className="space-y-3 font-sans text-xs text-brand-charcoal/80">
                  <li className="flex items-center gap-2">
                    ✓ 16 Live Private Classes
                  </li>
                  <li className="flex items-center gap-2">
                    ✓ Priorities Syllabus Mentorship
                  </li>
                  <li className="flex items-center gap-2">
                    ✓ Mock WAEC/IGCSE Practice Tests
                  </li>
                </ul>
              </div>
              <a
                href="#marketplace"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("marketplace")(e);
                  toast.success(
                    "Select a verified teacher below to book your Academic Prep Bundle.",
                    { duration: 4000 },
                  );
                }}
                className="btn-magnetic w-full py-3.5 px-6 rounded-full border border-brand-moss text-brand-moss font-bold hover:bg-brand-clay hover:border-brand-clay hover:text-white transition-colors text-xs uppercase tracking-wider text-center"
              >
                Book Prep
              </a>
            </div>
          </div>

          {/* Waitlist Banner Form */}
          <div className="mt-20 bg-brand-moss border border-brand-moss rounded-[3rem] p-8 md:p-12 text-brand-cream max-w-4xl mx-auto shadow-xl relative overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-5 mix-blend-overlay pointer-events-none"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1545167622-3a6ac756afa4?q=80&w=1600&auto=format&fit=crop')`,
              }}
            />
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="font-mono text-[10px] text-brand-clay uppercase tracking-widest font-bold block mb-2">
                  Exclusive Acceleration
                </span>
                <h3 className="font-heading font-bold text-2xl sm:text-3xl text-white">
                  Join the Waitlist
                </h3>
                <p className="font-sans text-xs text-brand-cream/80 mt-2 max-w-sm">
                  Subscribe to receive notifications when premium tutors match
                  your specified subject focus, rates, and curriculums.
                </p>
              </div>
              <form
                onSubmit={handleWaitlistSubmit}
                className="space-y-3 font-sans text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={waitlistName}
                    onChange={(e) => setWaitlistName(e.target.value)}
                    className="w-full bg-brand-cream/10 border border-brand-cream/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-clay text-xs"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Your Email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="w-full bg-brand-cream/10 border border-brand-cream/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-clay text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={waitlistRole}
                    onChange={(e) => setWaitlistRole(e.target.value)}
                    className="bg-brand-cream/10 border border-brand-cream/20 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-clay text-xs font-bold"
                  >
                    <option value="Parent" className="text-brand-moss">
                      I am a Parent
                    </option>
                    <option value="Teacher" className="text-brand-moss">
                      I am a Teacher
                    </option>
                  </select>
                  <button
                    type="submit"
                    className="flex-1 btn-magnetic py-2.5 px-5 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-bold transition-all text-xs uppercase tracking-wider text-center"
                  >
                    Submit Request
                  </button>
                </div>
                {waitlistStatus && (
                  <div className="text-center font-mono text-[9px] uppercase tracking-wider animate-pulse text-brand-clay mt-2">
                    {waitlistStatus}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
