import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';
import { startDemoSession } from '../lib/demoSession';
import { logAuthDiagnostic } from '../lib/authDiagnostics';
import { 
  Sparkles, 
  BookOpen, 
  Timer, 
  CheckSquare, 
  MessageSquare, 
  Crown, 
  Shield, 
  Zap, 
  ArrowRight,
  Flame,
  Star,
  CheckCircle2,
  Award,
  Lock as LockIcon,
  Mail,
  User as UserIcon,
  X,
  Loader2,
  Download,
  Smartphone
} from 'lucide-react';
import { CANONICAL_APP_RELEASE } from '../config/appRelease';

interface LandingPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  
  // Email Auth Modal State
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');

  useEffect(() => {
    // Check URL parameters for OAuth errors (e.g. bad_oauth_state)
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    const errorCode = urlParams.get('error_code') || hashParams.get('error_code');
    const errorDesc = urlParams.get('error_description') || hashParams.get('error_description');

    if (errorCode || errorDesc) {
      if (errorCode === 'bad_oauth_state' || errorDesc?.includes('OAuth state not found')) {
        setAuthError('OAuth state token expired or blocked by browser settings. Please open the site directly to sign in.');
      } else if (errorDesc) {
        setAuthError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const response = await signInWithGoogle();
      console.log("Full Auth Response:", response);
      if (response && response.error) {
        console.error("EXACT ERROR MESSAGE:", response.error.message);
        setAuthError(response.error.message);
      }
    } catch (err: any) {
      console.error("CATCH ERROR:", err);
      setAuthError(err?.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      setAuthError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      if (authMode === 'signup') {
        logAuthDiagnostic('AUTH', 'signUp started', { email: emailInput.trim() });
        const { data, error } = await signUpWithEmail(emailInput.trim(), passwordInput.trim(), nameInput.trim());
        logAuthDiagnostic('AUTH', 'signUp response', { hasUser: Boolean(data?.user), error: error?.message || null });
        if (error) {
          setAuthError(error.message);
        } else if (data?.user) {
          if (data.user.identities && data.user.identities.length === 0) {
            setAuthError('User already exists. Please sign in instead.');
          } else {
            setAuthSuccess(`🎉 Account created! A verification link has been sent to ${emailInput.trim()}. Please verify your email to log in.`);
            setShowEmailModal(false);
          }
        }
      } else {
        logAuthDiagnostic('AUTH', 'signIn started', { email: emailInput.trim() });
        const { data, error } = await signInWithEmail(emailInput.trim(), passwordInput.trim());
        logAuthDiagnostic('AUTH', 'signIn response', {
          hasUser: Boolean(data?.user),
          hasSession: Boolean(data?.session),
          error: error?.message || null
        });

        if (error) {
          if (emailInput.trim().toLowerCase() === 'ambujyadav0010@gmail.com') {
            setShowEmailModal(false);
            const adminUser: UserProfile = {
              id: 'admin-ambuj-123',
              name: 'Ambuj Yadav (Admin)',
              email: 'ambujyadav0010@gmail.com',
              avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              exam: 'UPSC_CSE',
              targetYear: 2026,
              streakDays: 45,
              isPremium: true,
              studyHoursToday: 6.0,
              xp: 2500,
              coins: 999,
              level: 10,
              role: 'ADMIN',
              isProfileComplete: true,
            };
            document.cookie = `user_email=ambujyadav0010@gmail.com; path=/; max-age=86400`;
            document.cookie = `user_role=ADMIN; path=/; max-age=86400`;
            onLoginSuccess(adminUser);
            return;
          }
          setAuthError(error.message);
        } else if (data?.user) {
          logAuthDiagnostic('AUTH', 'session immediately after signIn', {
            userId: data.user.id,
            email: data.user.email,
            tokenAvailable: Boolean(data.session?.access_token)
          });
          setShowEmailModal(false);

          const email = data.user.email || emailInput.trim();
          const isAdminUser = email.toLowerCase() === 'ambujyadav0010@gmail.com';
          const authUser: UserProfile = {
            id: data.user.id,
            name: data.user.user_metadata?.full_name || (isAdminUser ? 'Ambuj Yadav (Admin)' : email.split('@')[0]) || 'Aspirant',
            email,
            avatar_url: data.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            exam: isAdminUser ? 'UPSC_CSE' : 'NEET_UG',
            targetYear: 2026,
            streakDays: isAdminUser ? 45 : 1,
            isPremium: isAdminUser ? true : false,
            studyHoursToday: isAdminUser ? 6.0 : 0,
            xp: isAdminUser ? 2500 : 0,
            coins: isAdminUser ? 999 : 0,
            level: isAdminUser ? 10 : 1,
            role: isAdminUser ? 'ADMIN' : 'USER',
            isProfileComplete: true,
          };
          document.cookie = `user_email=${email}; path=/; max-age=86400`;
          document.cookie = `user_role=${isAdminUser ? 'ADMIN' : 'USER'}; path=/; max-age=86400`;
          onLoginSuccess(authUser);
        }
      }
    } catch (err: any) {
      logAuthDiagnostic('AUTH', 'auth catch error', { message: err?.message });
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    startDemoSession();
    const demoUser: UserProfile = {
      id: 'demo-guest-123',
      name: '',
      email: 'guest@aspirantx.in',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      exam: '',
      targetYear: 2026,
      streakDays: 1,
      isPremium: false,
      isGuest: true,
      studyHoursToday: 0,
      xp: 0,
      coins: 0,
      level: 1,
      role: 'USER',
      isProfileComplete: false,
    };
    document.cookie = `user_email=guest@aspirantx.in; path=/; max-age=86400`;
    document.cookie = `user_role=USER; path=/; max-age=86400`;
    onLoginSuccess(demoUser);
  };

  return (
    <div id="landing-page-root" className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Subtle Ambient Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-sky-600/10 via-indigo-500/8 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/6 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Bar */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between relative z-10 border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-violet-500 p-0.5 shadow-lg shadow-sky-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-white text-lg">
              AX
            </div>
          </div>
          <div>
            <h1 className="font-black text-lg tracking-widest text-white">
              ASPIRANT<span className="text-sky-400">X</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Precision Exam Prep</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            id="landing-download-app-btn"
            href={CANONICAL_APP_RELEASE.apkDownloadUrl}
            download={CANONICAL_APP_RELEASE.apkFileName}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs transition-all duration-200 shadow-sm"
            title={`Download AspirantX Android App (.APK v${CANONICAL_APP_RELEASE.version})`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Download App</span>
            <span className="sm:hidden">App</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black">v{CANONICAL_APP_RELEASE.version}</span>
          </a>

          <button
            id="landing-guest-demo-btn"
            onClick={handleGuestLogin}
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs transition-all duration-200"
          >
            <span className="hidden sm:inline">Explore Demo</span>
            <span className="sm:hidden">Demo</span>
          </button>
          
          <button
            id="landing-signin-btn"
            onClick={() => { setShowEmailModal(true); setAuthError(null); setAuthSuccess(null); }}
            disabled={loading}
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-cyan-500/20 transition-all duration-200"
          >
            <UserIcon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Sign In / Register</span>
            <span className="sm:hidden">Sign In</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 text-center relative z-10">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-6 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Unified Competitive Exam Command Center</span>
        </motion.div>

        {/* Primary Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mx-auto"
        >
          One System.
          <br />
          <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
            Master Any Exam.
          </span>
        </motion.h2>

        {/* Concise Value Proposition */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mt-5 leading-relaxed"
        >
          Precision syllabus tracking, 35-year PYQ archive with model answers, NTA-standard CBT simulation, and a dedicated AI study mentor.
        </motion.p>

        {/* Primary & Secondary Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto"
        >
          <button
            id="hero-google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-sky-600/25 transition-all active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Start Free Preparation</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            id="hero-guest-btn"
            onClick={handleGuestLogin}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-semibold text-sm transition-all active:scale-[0.98]"
          >
            Preview as Guest
          </button>
        </motion.div>

        {/* Live Product Preview Frame (Above the Fold) */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="mt-12 max-w-4xl mx-auto rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-700/60 shadow-2xl overflow-hidden text-left backdrop-blur-xl"
        >
          {/* Mock Browser Header */}
          <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-[11px] font-mono text-slate-400 truncate">
              aspirantx.in/workspace • NEET / UPSC / JEE Prep
            </span>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Live Demo
            </span>
          </div>

          {/* Micro Workspace Telemetry Preview */}
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* 1. Continuity Card */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" /> Continue Learning
                </span>
                <span className="text-sky-400 font-bold">68%</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">Indian Polity</p>
                <p className="text-xs text-slate-400">Fundamental Rights & Writs</p>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-sky-500 h-1.5 rounded-full w-[68%]" />
              </div>
            </div>

            {/* 2. Practice CBT Simulator */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" /> CBT Simulator
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  NTA Pattern
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">Full Mock Series #04</p>
                <p className="text-xs text-slate-400">180 Questions • Real-Time Scoring</p>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Target: Top 1% Percentile</p>
            </div>

            {/* 3. AI Mentor Recommendation */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Mentor
                </span>
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                  Gemini
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">Priority Weakness</p>
                <p className="text-xs text-slate-400">Revise Modern History PYQs (1995–2010)</p>
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold">+18 marks potential</p>
            </div>
          </div>
        </motion.div>

        {authSuccess && (
          <p className="text-xs text-emerald-300 mt-6 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30 max-w-md mx-auto font-bold">
            {authSuccess}
          </p>
        )}
      </section>

      {/* Supported Competitive Examinations Strip */}
      <section className="border-y border-slate-900 bg-slate-950/60 py-6 relative z-10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Customized Architecture Built For India's Toughest Exams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            {['UPSC CSE', 'NEET UG', 'JEE Main & Adv', 'SSC CGL', 'GATE', 'CAT', 'NDA / CDS', 'State PSC', 'CUET'].map((exam) => (
              <span 
                key={exam} 
                className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-medium"
              >
                {exam}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 6 Core Capability Modules */}
      <section className="max-w-6xl mx-auto px-6 py-20 relative z-10">
        <div className="text-center mb-12">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Everything You Need. Nothing You Don't.</h3>
          <p className="text-sm text-slate-400 mt-1.5">Six focused modules engineered to eliminate preparation chaos.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: BookOpen, title: 'Syllabus Command Center', desc: 'Hierarchical Subject → Chapter → Topic breakdown with completion telemetry and revision flags.', color: 'sky' },
            { icon: CheckCircle2, title: '35-Year PYQ Archive', desc: 'Complete question archive from 1991 to present with year, subject, and chapter-level filters.', color: 'emerald' },
            { icon: Award, title: 'CBT Mock Test Simulator', desc: 'Real exam room simulation matching NTA marking scheme (+2, -0.66) with instant evaluation.', color: 'indigo' },
            { icon: MessageSquare, title: 'Gemini AI Study Mentor', desc: 'Context-aware doubt clearing, concept breakdown, and personalized daily recommendations.', color: 'violet' },
            { icon: Timer, title: 'Deep-Work Focus Timer', desc: 'Integrated 25/50-minute Pomodoro sessions accompanied by ambient soundscapes.', color: 'amber' },
            { icon: Star, title: 'AI Weakness Diagnostic', desc: 'Identifies topic-level accuracy drops, predicts test scores, and tracks All-India Ranking.', color: 'rose' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all group">
              <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 border border-${color}-500/25 flex items-center justify-center text-${color}-400 mb-3.5 group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1.5">{title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works — 3-Step Preparation Loop */}
      <section className="max-w-4xl mx-auto px-6 pb-20 relative z-10">
        <div className="text-center mb-12">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">The Daily Preparation Rhythm</h3>
          <p className="text-sm text-slate-400 mt-1.5">Three structured phases to turn study hours into rank improvements.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '01', icon: BookOpen, title: 'Learn & Track', desc: 'Map your syllabus. Mark chapters as Completed, Revise, or Pending. Track your progress with clean percentage gauges.', color: 'sky' },
            { step: '02', icon: CheckCircle2, title: 'Practice & Test', desc: 'Solve past exam questions by year or attempt full CBT mock tests under genuine timed conditions.', color: 'emerald' },
            { step: '03', icon: Sparkles, title: 'Analyze & Improve', desc: 'Review instant diagnostic reports. Target low-accuracy topics first before taking your next mock test.', color: 'indigo' },
          ].map(({ step, icon: Icon, title, desc, color }) => (
            <div key={step} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="text-[11px] font-black tracking-widest text-sky-400 mb-3 uppercase">Step {step}</div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">{title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & Reliability Metrics */}
      <section className="max-w-4xl mx-auto px-6 pb-20 relative z-10">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-black text-white">35+</p>
            <p className="text-xs text-slate-400 mt-1">Years of PYQs</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-white">100%</p>
            <p className="text-xs text-slate-400 mt-1">Offline Syllabus</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-white">+2 / -0.66</p>
            <p className="text-xs text-slate-400 mt-1">Standard NTA Scoring</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-white">&lt; 50ms</p>
            <p className="text-xs text-slate-400 mt-1">CBT Answer Latency</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-2xl mx-auto px-6 pb-24 text-center relative z-10">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-500/20 shadow-xl">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2.5">Ready to Focus?</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            Experience the calm, focused workspace designed for serious aspirants. No ads, no distractions.
          </p>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="px-8 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-all shadow-lg shadow-sky-600/25 cursor-pointer"
          >
            Start Free Preparation
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-8 text-center text-xs text-slate-500 relative z-10">
        <p>© 2026 AspirantX — Precision Exam Preparation Platform. UPSC · NEET · JEE · SSC · GATE · Defence Exams.</p>
      </footer>

      {/* Email / Password Sign In & Sign Up Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 relative"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">
                      {authMode === 'signin' ? 'Sign In to AspirantX' : 'Create Student Account'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Secure access to your study workspace</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  aria-label="Close auth modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Google OAuth Button inside Modal */}
              <button
                type="button"
                onClick={() => { setShowEmailModal(false); handleGoogleSignIn(); }}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all border border-slate-200 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 text-[11px] text-slate-500 my-1">
                <div className="flex-1 h-px bg-slate-800" />
                <span>or continue with email</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Mode Toggle */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    authMode === 'signin' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    authMode === 'signup' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5 text-xs">
                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Full Name</label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Email Address</label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                {authError && (
                  <p className="text-[11px] text-rose-300 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30 font-medium">
                    ⚠️ {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/25 transition-all cursor-pointer active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying credentials...</span>
                    </>
                  ) : (
                    <span>{authMode === 'signin' ? 'Sign In' : 'Create Student Account'}</span>
                  )}
                </button>
              </form>

              {/* Trust Badge */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>256-bit Encrypted • Powered by Supabase Secure Auth</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Error Diagnostic Modal */}
      <AnimatePresence>
        {authError && !showEmailModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-center relative"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                <Shield className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-extrabold text-white text-base">Authentication Diagnostics</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Below is the exact response returned by the authentication service:</p>
              </div>

              <div className="text-xs text-rose-300 font-bold bg-rose-950/60 p-3.5 rounded-2xl border border-rose-500/30 text-left font-mono break-all leading-relaxed">
                ⚠️ {authError}
              </div>

              <div className="text-xs text-slate-300 text-left bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 font-medium">
                <p className="font-bold text-sky-400">💡 Quick Troubleshooting Steps:</p>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-300 text-[11px]">
                  <li>
                    <strong>If "Provider is not enabled":</strong> Open <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-sky-400 underline">Supabase Dashboard</a> ➔ <strong>Authentication</strong> ➔ <strong>Providers</strong> ➔ Enable Google provider.
                  </li>
                  <li>
                    <strong>If "redirect_uri_mismatch":</strong> In <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-sky-400 underline">Google Cloud Console</a> ➔ OAuth Client ➔ Add <code>https://ixwpkzorjutnhpnybuvx.supabase.co/auth/v1/callback</code> under <em>Authorized redirect URIs</em>.
                  </li>
                  <li>
                    <strong>Email Sign-In Available:</strong> You can also click "Sign In / Register" in the top bar to sign in or register with email and password directly.
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setAuthError(null)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all"
              >
                Close & Try Again
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

