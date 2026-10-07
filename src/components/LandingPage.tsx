import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion } from 'motion/react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../lib/supabase';
import { UserProfile } from '../types';
import { resolveUserAvatar } from '../lib/avatarStorage';
import { getKnownExamDateString } from '../lib/dailyStudyTracker';
import { startDemoSession } from '../lib/demoSession';
import { logAuthDiagnostic } from '../lib/authDiagnostics';
import { 
  Shield, 
  ArrowRight,
  Mail,
  User as UserIcon,
  Loader2,
  Download,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Clock,
  BookOpen,
  Target,
  Brain,
  Smartphone,
  ChevronDown,
  Layers,
  Zap,
  Flame,
  Award,
  Check,
  Compass
} from 'lucide-react';
import { CANONICAL_APP_RELEASE } from '../config/appRelease';

interface LandingPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  
  // Auth Mode State: direct inline toggle between 'quick', 'signin', 'signup'
  const [activeAuthMethod, setActiveAuthMethod] = useState<'options' | 'signin' | 'signup'>('options');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    // Check URL parameters for OAuth errors
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    const errorCode = urlParams.get('error_code') || hashParams.get('error_code');
    const errorDesc = urlParams.get('error_description') || hashParams.get('error_description');

    if (errorCode || errorDesc) {
      if (errorCode === 'bad_oauth_state' || errorDesc?.includes('OAuth state not found')) {
        setAuthError('OAuth session expired. Please tap Continue with Google to sign in.');
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
      if (response && response.error) {
        setAuthError(response.error.message);
      }
    } catch (err: any) {
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
      if (activeAuthMethod === 'signup') {
        logAuthDiagnostic('AUTH', 'signUp started', { email: emailInput.trim() });
        const { data, error } = await signUpWithEmail(emailInput.trim(), passwordInput.trim(), nameInput.trim());
        if (error) {
          setAuthError(error.message);
        } else if (data?.user) {
          if (data.user.identities && data.user.identities.length === 0) {
            setAuthError('An account with this email already exists. Please sign in.');
          } else {
            setAuthSuccess(`🎉 Account created! A verification link has been sent to ${emailInput.trim()}. Please verify your email to log in.`);
            setActiveAuthMethod('signin');
          }
        }
      } else {
        logAuthDiagnostic('AUTH', 'signIn started', { email: emailInput.trim() });
        const { data, error } = await signInWithEmail(emailInput.trim(), passwordInput.trim());
        if (error) {
          setAuthError(error.message);
        } else if (data?.user) {
          const email = data.user.email || emailInput.trim();
          const isAdminUser = email.toLowerCase() === 'ambujyadav0010@gmail.com';
          // Check saved preference or default to NEET_UG
          const savedExam = typeof window !== 'undefined' ? localStorage.getItem('aspirantx_global_selected_exam') : null;
          const userExam = data.user.user_metadata?.exam || savedExam || 'NEET_UG';
          const examDateStr = getKnownExamDateString(userExam);
          const computedTargetYear = examDateStr ? new Date(examDateStr).getFullYear() : (new Date().getFullYear() + 1);
          const authUser: UserProfile = {
            id: data.user.id,
            name: data.user.user_metadata?.full_name || (isAdminUser ? 'Ambuj Yadav (Admin)' : email.split('@')[0]) || 'Aspirant',
            email,
            avatar_url: resolveUserAvatar(data.user.user_metadata?.avatar_url, data.user.id, email),
            exam: userExam,
            targetYear: computedTargetYear,
            streakDays: 0,
            isPremium: isAdminUser ? true : false,
            studyHoursToday: 0,
            xp: 0,
            coins: 100,
            level: 1,
            role: isAdminUser ? 'ADMIN' : 'USER',
            isProfileComplete: true,
          };
          document.cookie = `user_email=${email}; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = `user_role=${isAdminUser ? 'ADMIN' : 'USER'}; path=/; max-age=86400; SameSite=Lax`;
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
    const guestExam = 'NEET_UG';
    const guestExamDateStr = getKnownExamDateString(guestExam);
    const guestTargetYear = guestExamDateStr ? new Date(guestExamDateStr).getFullYear() : (new Date().getFullYear() + 1);
    const demoUser: UserProfile = {
      id: 'demo-guest-123',
      name: 'Aspirant',
      email: 'guest@studyride.in',
      avatar_url: resolveUserAvatar(null, 'demo-guest-123', 'guest@studyride.in'),
      exam: guestExam,
      targetYear: guestTargetYear,
      streakDays: 0,
      isPremium: false,
      isGuest: true,
      studyHoursToday: 0,
      xp: 0,
      coins: 50,
      level: 1,
      role: 'USER',
      isProfileComplete: true,
    };
    document.cookie = `user_email=guest@studyride.in; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `user_role=USER; path=/; max-age=86400; SameSite=Lax`;
    onLoginSuccess(demoUser);
  };

  // Motion physics
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' as const },
    },
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#06080d] text-slate-100 flex flex-col justify-between font-sans selection:bg-sky-500 selection:text-white relative overflow-x-hidden pb-24 md:pb-6">
      {/* Ambient Cosmos Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] max-w-full h-[320px] bg-gradient-to-b from-sky-600/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-3.5 sm:py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img 
              src="/logo.png" 
              alt="StudyRide Logo" 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl object-cover border border-white/[0.12] shadow-lg shadow-sky-500/20 shrink-0" 
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#06080d] rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base sm:text-lg tracking-wider text-white">
                STUDY<span className="text-sky-400">RIDE</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/25 text-[10px] font-bold text-sky-400">
                PRO v{CANONICAL_APP_RELEASE.version}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Precision Exam Suite</p>
          </div>
        </div>

        {/* Desktop Quick Header CTAs */}
        <div className="hidden sm:flex items-center gap-2.5">
          {!Capacitor.isNativePlatform() && (
            <a
              id="landing-download-app-btn"
              href={CANONICAL_APP_RELEASE.apkDownloadUrl}
              download={CANONICAL_APP_RELEASE.apkFileName}
              className="btn-3d btn-3d-slate flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold tap-target-44"
              title={`Download Android APK v${CANONICAL_APP_RELEASE.version}`}
            >
              <Download className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Android APK v{CANONICAL_APP_RELEASE.version}</span>
            </a>
          )}

          <button
            id="landing-guest-demo-btn"
            onClick={handleGuestLogin}
            className="btn-3d btn-3d-emerald px-4 py-2 rounded-xl text-xs font-bold tap-target-44 flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Guest Demo</span>
          </button>
        </div>
      </header>

      {/* Main Hero & Auth Cockpit (Stage 1 & 2: App-First, Zero Clutter) */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-8 relative z-10 flex-1 flex flex-col justify-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center"
        >
          {/* Left Column: Visual Punch & Gen Z Value Proposition */}
          <motion.div variants={itemVariants} className="lg:col-span-7 space-y-4 text-center lg:text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-500/15 via-indigo-500/15 to-purple-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>India's #1 Gen Z Study Cockpit</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase">
                100% Free
              </span>
            </div>

            {/* 3-Word Bold Title (Content Diet) */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.12]">
              Study Smarter. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                Rank Faster.
              </span>
            </h2>

            {/* Micro 1-Line Subtitle */}
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
              No boring walls of text. Precision syllabus radar, 35-yr official PYQs, distraction-blocking focus shield & live countdown.
            </p>

            {/* 3 Visual Micro-Stats (Stage 2 Visual Formula) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 max-w-md mx-auto lg:mx-0">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-[#0c1017]/90 border border-white/[0.08] text-center shadow-sm">
                <div className="text-sm sm:text-base font-extrabold text-sky-400 flex items-center justify-center gap-1">
                  <span>35+</span>
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Years PYQs</div>
              </div>

              <div className="p-2.5 sm:p-3 rounded-2xl bg-[#0c1017]/90 border border-white/[0.08] text-center shadow-sm">
                <div className="text-sm sm:text-base font-extrabold text-emerald-400 flex items-center justify-center gap-1">
                  <span>100%</span>
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Free Access</div>
              </div>

              <div className="p-2.5 sm:p-3 rounded-2xl bg-[#0c1017]/90 border border-white/[0.08] text-center shadow-sm">
                <div className="text-sm sm:text-base font-extrabold text-amber-400 flex items-center justify-center gap-1">
                  <span>60 FPS</span>
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">App Speed</div>
              </div>
            </div>

            {/* Target Exams Supported Ticker */}
            <div className="pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-1.5 text-[11px] font-bold text-slate-400">
              <span className="text-slate-500 uppercase text-[10px] mr-1">Target Exams:</span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-white/[0.08] text-slate-200">UPSC CSE</span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-white/[0.08] text-slate-200">NEET UG</span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-white/[0.08] text-slate-200">SSC CGL</span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-white/[0.08] text-slate-200">JEE Main</span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-white/[0.08] text-slate-200">+ State PSC</span>
            </div>
          </motion.div>

          {/* Right Column: Tactile Auth Card (Bento App Style) */}
          <motion.div variants={itemVariants} className="lg:col-span-5 w-full max-w-md mx-auto">
            {/* Feedback Alerts */}
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 shadow-sm"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{authError}</span>
              </motion.div>
            )}

            {authSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{authSuccess}</span>
              </motion.div>
            )}

            {/* Central Bento Auth Surface */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#0c1017]/95 border border-white/[0.12] shadow-2xl backdrop-blur-xl relative space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-1.5">
                    <span>Instant Access</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </h3>
                  <p className="text-[11px] text-slate-400">One-tap login or instant guest demo</p>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-slate-900 border border-white/[0.08] text-[10px] font-bold text-sky-400">
                  ⚡ 100% Free
                </div>
              </div>

              {activeAuthMethod === 'options' ? (
                /* Primary Tactile 3D Button Actions */
                <div className="space-y-3">
                  <button
                    id="hero-signin-btn"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="btn-3d btn-3d-white w-full py-3 px-4 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 tap-target-44"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-800" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    )}
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-white/[0.08] w-full" />
                    <span className="bg-[#0c1017] px-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      or
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      id="landing-signin-btn"
                      onClick={() => {
                        setActiveAuthMethod('signin');
                        setAuthError(null);
                      }}
                      className="btn-3d btn-3d-slate py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 tap-target-44"
                    >
                      <Mail className="w-3.5 h-3.5 text-sky-400" />
                      <span>Email Sign In</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveAuthMethod('signup');
                        setAuthError(null);
                      }}
                      className="btn-3d btn-3d-slate py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 tap-target-44"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Create Account</span>
                    </button>
                  </div>

                  {/* 1-Tap Guest Access */}
                  <button
                    id="hero-guest-btn"
                    onClick={handleGuestLogin}
                    className="btn-3d btn-3d-emerald w-full py-2.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 tap-target-44 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Try Instant Guest Demo (No Sign Up)</span>
                  </button>
                </div>
              ) : (
                /* State B: Direct Clean Email / Password Form */
                <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveAuthMethod('signin')}
                        className={`text-xs font-bold pb-1 transition-colors ${
                          activeAuthMethod === 'signin'
                            ? 'text-sky-400 border-b-2 border-sky-400'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Sign In
                      </button>
                      <span className="text-slate-600 text-xs">•</span>
                      <button
                        type="button"
                        onClick={() => setActiveAuthMethod('signup')}
                        className={`text-xs font-bold pb-1 transition-colors ${
                          activeAuthMethod === 'signup'
                            ? 'text-sky-400 border-b-2 border-sky-400'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Create Account
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveAuthMethod('options')}
                      className="text-[11px] text-slate-400 hover:text-slate-200 font-semibold"
                    >
                      ← Back
                    </button>
                  </div>

                  {activeAuthMethod === 'signup' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#06080d] border border-white/[0.12] text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#06080d] border border-white/[0.12] text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#06080d] border border-white/[0.12] text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-3d btn-3d-primary w-full py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 tap-target-44 disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>{activeAuthMethod === 'signup' ? 'Create Free Account' : 'Sign In Now'}</span>
                    )}
                  </button>
                </form>
              )}

              {/* Security Pill */}
              <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>256-Bit Encrypted • Verified Neon Auth</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Stage 2 Content Diet: 3 Visual Interactive Step Cards ("How It Works") */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 border-t border-white/[0.06] relative z-10 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
            <Zap className="w-3 h-3" />
            <span>High Velocity System</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            How It Works
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            3 simple steps to transform your exam preparation from chaotic to high rank certainty.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Step 1 */}
          <div className="p-4 rounded-3xl bg-[#0c1017] border border-white/[0.08] hover:border-sky-500/30 transition-all space-y-2.5 relative group">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-2xl bg-sky-500/15 border border-sky-500/25 text-sky-400 flex items-center justify-center font-extrabold text-sm">
                🎯
              </div>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-extrabold uppercase">
                1 Tap
              </span>
            </div>
            <h4 className="font-extrabold text-sm text-white">Pick Your Exam</h4>
            <p className="text-xs text-slate-400 leading-snug">
              Select UPSC, NEET, SSC or JEE. The entire official micro-syllabus loads instantly into your workspace.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-3xl bg-[#0c1017] border border-white/[0.08] hover:border-emerald-500/30 transition-all space-y-2.5 relative group">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center font-extrabold text-sm">
                ⚡
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold uppercase">
                Smart Pacing
              </span>
            </div>
            <h4 className="font-extrabold text-sm text-white">Study With Radar</h4>
            <p className="text-xs text-slate-400 leading-snug">
              Speedometer tracks study velocity in background. Days & finish countdown update live with zero mental fatigue.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-3xl bg-[#0c1017] border border-white/[0.08] hover:border-amber-500/30 transition-all space-y-2.5 relative group">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center font-extrabold text-sm">
                🚀
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-extrabold uppercase">
                AIR 1 Ready
              </span>
            </div>
            <h4 className="font-extrabold text-sm text-white">Crack High Rank</h4>
            <p className="text-xs text-slate-400 leading-snug">
              Official CBT simulator, 35-yr archives, and automated revision alerts guarantee peak exam-day mastery.
            </p>
          </div>
        </div>
      </section>

      {/* Stage 2 Bento Feature Grid (The exact formula: [Micro-Icon] + [Bold 3-Word Title] + [1 Pill Badge]) */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 border-t border-white/[0.06] relative z-10 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-bold">
            <Compass className="w-3 h-3" />
            <span>Powerhouse Features</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            Engineered For Serious Aspirants
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Everything you need, zero distractions. Clean, fast, and 60fps responsive on all screens.
          </p>
        </div>

        {/* 6 Bento Grid Cards: Formula [Micro-Icon] + [Bold 3-Word Title] + [1 Pill Badge] */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Card 1 */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0c1017] border border-white/[0.08] hover:border-sky-500/40 transition-colors space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/25 text-sky-400 flex items-center justify-center text-lg">
                ⏱️
              </div>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 text-[10px] font-extrabold">
                ⚡ Auto Streak
              </span>
            </div>
            <h4 className="font-extrabold text-sm sm:text-base text-white">Track Study Time</h4>
            <p className="text-xs text-slate-400 leading-snug">
              1-tap daily hour logs, heatmap streaks, and subject distribution charts.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0c1017] border border-white/[0.08] hover:border-emerald-500/40 transition-colors space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center text-lg">
                🎯
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-extrabold">
                🚀 Smart Forecast
              </span>
            </div>
            <h4 className="font-extrabold text-sm sm:text-base text-white">Syllabus Speedometer HUD</h4>
            <p className="text-xs text-slate-400 leading-snug">
              Animated velocity gauge, live finish countdown, and custom topic addition.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0c1017] border border-white/[0.08] hover:border-purple-500/40 transition-colors space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/25 text-purple-400 flex items-center justify-center text-lg">
                🛡️
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-[10px] font-extrabold">
                🧘 App Blocker
              </span>
            </div>
            <h4 className="font-extrabold text-sm sm:text-base text-white">Distraction Focus Shield</h4>
            <p className="text-xs text-slate-400 leading-snug">
              Blocks social media and doom-scrolling during Pomodoro focus sessions.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0c1017] border border-white/[0.08] hover:border-rose-500/40 transition-colors space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/25 text-rose-400 flex items-center justify-center text-lg">
                📝
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[10px] font-extrabold">
                🏆 35-Yr Archive
              </span>
            </div>
            <h4 className="font-extrabold text-sm sm:text-base text-white">Official CBT Simulator</h4>
            <p className="text-xs text-slate-400 leading-snug">
              Practice exact NTA/UPSC examination screens with negative marking calculation.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0c1017] border border-white/[0.08] hover:border-amber-500/40 transition-colors space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center text-lg">
                🤖
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-extrabold">
                💡 Instant Solves
              </span>
            </div>
            <h4 className="font-extrabold text-sm sm:text-base text-white">24/7 AI Mentor</h4>
            <p className="text-xs text-slate-400 leading-snug">
              Smart doubt resolution, memory mnemonics, and adaptive flashcard generation.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0c1017] border border-white/[0.08] hover:border-cyan-500/40 transition-colors space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 flex items-center justify-center text-lg">
                🎁
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[10px] font-extrabold">
                💎 100% Free
              </span>
            </div>
            <h4 className="font-extrabold text-sm sm:text-base text-white">Earn Free PRO</h4>
            <p className="text-xs text-slate-400 leading-snug">
              Answer peer doubts, complete daily streaks, and unlock PRO features for free.
            </p>
          </div>
        </div>

        {/* Collapsible FAQ Drawer for Full Google SEO Rich Snippets without visual clutter */}
        <div className="pt-6 border-t border-white/[0.06] space-y-3">
          <div className="text-center space-y-1">
            <h4 className="text-base sm:text-lg font-extrabold text-white">Frequently Asked Questions</h4>
            <p className="text-xs text-slate-400">Everything you need to know about StudyRide and study tracking.</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-2">
            {[
              {
                q: "What is StudyRide and how does it help with study tracking?",
                a: "StudyRide is an all-in-one study tracking and exam preparation platform designed for competitive exam aspirants (UPSC, NEET, SSC CGL, JEE). It provides real-time study hour logging, subject-wise distribution analytics, streak monitoring, and visual productivity insights so students can measure and optimize their daily study habits."
              },
              {
                q: "How does the StudyRide Syllabus Tracker work for competitive exams?",
                a: "The StudyRide Syllabus Tracker breaks down complex exam curricula into granular micro-topics. As you complete each chapter or topic, you can mark it completed, log revisions, and instantly view your overall syllabus completion percentage."
              },
              {
                q: "How does the Pomodoro Technique work in the StudyRide app?",
                a: "StudyRide features a scientific Pomodoro Timer with default 25-minute deep focus intervals followed by 5-minute restorative breaks. It combines with an Android Focus Shield to block distracting social media apps during study sessions."
              },
              {
                q: "Does StudyRide provide official CBT mock tests and Previous Year Questions (PYQs)?",
                a: "Yes! StudyRide features a high-fidelity Computer-Based Test (CBT) exam engine mimicking the exact NTA and UPSC exam interface, complete with a 35-year archive of past year question papers, negative marking calculation, and national percentile benchmarking."
              },
              {
                q: "Is StudyRide free to use for students?",
                a: "Yes, StudyRide is completely free for all students to track their syllabus, practice previous year papers, use the Pomodoro timer, and log daily study hours."
              }
            ].map((faq, idx) => (
              <div 
                key={idx}
                className="rounded-2xl bg-[#0c1017] border border-white/[0.08] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openFaq === idx ? 'rotate-180 text-sky-400' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-white/[0.04] pt-2.5">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Minimalist Strip */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 text-center text-[11px] text-slate-500 border-t border-white/[0.06] relative z-10 space-y-2">
        <p className="font-semibold text-slate-400">© 2026 StudyRide Technologies • India's #1 Precision Exam Suite</p>
        <p className="text-[10px] text-slate-600 max-w-xl mx-auto">
          Optimized for UPSC CSE, NEET UG, SSC CGL/CHSL, JEE Main/Adv & State PSC exams.
        </p>
      </footer>

      {/* Stage 1: Mobile Floating App Dock (Bottom Navigation Bar) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-2.5 px-3 bg-[#0c1017]/95 backdrop-blur-xl border-t border-white/[0.1] shadow-2xl flex items-center gap-2 pb-[calc(0.65rem+env(safe-area-inset-bottom,0px))]">
        <button
          onClick={handleGuestLogin}
          className="btn-3d btn-3d-emerald flex-1 py-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 tap-target-44"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Guest Demo</span>
        </button>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="btn-3d btn-3d-white flex-1 py-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 tap-target-44"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-sky-600" />
              <span>Google Login</span>
            </>
          )}
        </button>

        {!Capacitor.isNativePlatform() && (
          <a
            href={CANONICAL_APP_RELEASE.apkDownloadUrl}
            download={CANONICAL_APP_RELEASE.apkFileName}
            className="btn-3d btn-3d-slate p-2.5 rounded-2xl text-sky-400 flex items-center justify-center tap-target-44 shrink-0"
            title="Download APK"
          >
            <Download className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
};
