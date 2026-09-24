import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../lib/supabase';
import { UserProfile } from '../types';
import { startDemoSession } from '../lib/demoSession';
import { logAuthDiagnostic } from '../lib/authDiagnostics';
import { 
  Shield, 
  ArrowRight,
  Mail,
  User as UserIcon,
  Lock as LockIcon,
  Loader2,
  Download,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { CANONICAL_APP_RELEASE } from '../config/appRelease';

interface LandingPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  
  // Auth Mode State: direct inline toggle between 'quick' (Google + Guest), 'signin', 'signup'
  const [activeAuthMethod, setActiveAuthMethod] = useState<'options' | 'signin' | 'signup'>('options');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');

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
    const demoUser: UserProfile = {
      id: 'demo-guest-123',
      name: '',
      email: 'guest@studyride.in',
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
    document.cookie = `user_email=guest@studyride.in; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `user_role=USER; path=/; max-age=86400; SameSite=Lax`;
    onLoginSuccess(demoUser);
  };

  // Motion variants with reduced motion support
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' as const },
    },
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col justify-between font-sans selection:bg-sky-500 selection:text-white relative overflow-hidden">
      {/* Subtle Ambient Background Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-sky-600/8 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="w-full max-w-5xl mx-auto px-5 py-4 sm:py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center font-black text-white text-base shadow-sm">
            SR
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base tracking-wider text-white">
              STUDY<span className="text-sky-400">RIDE</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Precision Exam Suite</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {!Capacitor.isNativePlatform() && (
            <a
              id="landing-download-app-btn"
              href={CANONICAL_APP_RELEASE.apkDownloadUrl}
              download={CANONICAL_APP_RELEASE.apkFileName}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs transition-colors"
              title={`Download Android App v${CANONICAL_APP_RELEASE.version}`}
            >
              <Download className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="hidden sm:inline">Download App</span>
              <span className="sm:hidden">App</span>
            </a>
          )}

          <button
            id="landing-guest-demo-btn"
            onClick={handleGuestLogin}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-800 transition-colors"
          >
            Guest Demo
          </button>
        </div>
      </header>

      {/* Main Focus Area (No Marketing Wall Before Login) */}
      <main className="w-full max-w-md mx-auto px-4 py-8 sm:py-12 relative z-10 flex-1 flex flex-col justify-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full space-y-6"
        >
          {/* Brand Emblem & Headline */}
          <motion.div variants={itemVariants} className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-semibold tracking-wide mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Built for Serious Aspirants</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              One Workspace. Master Any Exam.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-normal max-w-sm mx-auto leading-relaxed">
              Precision syllabus tracking, 35-year PYQ archive, and official CBT simulation.
            </p>
          </motion.div>

          {/* Feedback Alerts */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{authError}</span>
            </motion.div>
          )}

          {authSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{authSuccess}</span>
            </motion.div>
          )}

          {/* Central Auth Surface */}
          <motion.div
            variants={itemVariants}
            className="p-5 sm:p-6 rounded-2xl bg-[#0c1017] border border-white/[0.08] shadow-xl space-y-4"
          >
            {activeAuthMethod === 'options' ? (
              /* State A: Primary Single-Tap Google Auth + Direct Choices */
              <div className="space-y-3">
                <button
                  id="hero-signin-btn"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-white/[0.08] w-full" />
                  <span className="bg-[#0c1017] px-2.5 text-[11px] text-slate-500 font-medium uppercase tracking-wider">
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
                    className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/[0.06] text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Sign In</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveAuthMethod('signup');
                      setAuthError(null);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/[0.06] text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Create Account</span>
                  </button>
                </div>
              </div>
            ) : (
              /* State B: Direct Clean Email / Password Form */
              <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
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
                    className="text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    ← Back
                  </button>
                </div>

                {activeAuthMethod === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 rounded-lg bg-[#06080d] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 rounded-lg bg-[#06080d] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 rounded-lg bg-[#06080d] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{activeAuthMethod === 'signup' ? 'Create Account' : 'Sign In'}</span>
                  )}
                </button>
              </form>
            )}

            {/* Guest Entry Trigger */}
            <div className="pt-2 text-center">
              <button
                id="hero-guest-btn"
                type="button"
                onClick={handleGuestLogin}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1"
              >
                <span>Continue as Guest</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>
            </div>
          </motion.div>

          {/* Trust Footnote */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-bit Encrypted • Powered by Neon Secure Auth</span>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer Minimalist Strip */}
      <footer className="w-full max-w-5xl mx-auto px-5 py-4 text-center text-[11px] text-slate-600 relative z-10">
        <p>© 2026 StudyRide. Academic Command Center for India's Competitive Exams.</p>
      </footer>
    </div>
  );
};
