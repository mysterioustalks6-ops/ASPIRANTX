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
  Lock as LockIcon,
  Mail,
  User as UserIcon,
  X,
  Loader2
} from 'lucide-react';

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
          setAuthError(error.message);
        } else if (data?.user) {
          logAuthDiagnostic('AUTH', 'session immediately after signIn', {
            userId: data.user.id,
            email: data.user.email,
            tokenAvailable: Boolean(data.session?.access_token)
          });
          setShowEmailModal(false);

          const email = data.user.email || emailInput.trim();
          const authUser: UserProfile = {
            id: data.user.id,
            name: data.user.user_metadata?.full_name || email.split('@')[0] || 'Aspirant',
            email,
            avatar_url: data.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            exam: 'NEET_UG',
            targetYear: 2026,
            streakDays: 1,
            isPremium: false,
            studyHoursToday: 0,
            xp: 0,
            coins: 0,
            level: 1,
            role: (email.toLowerCase() === 'ambujyadav0010@gmail.com') ? 'ADMIN' : 'USER',
            isProfileComplete: false,
          };
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

  const handleAdminLogin = () => {
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
    };
    document.cookie = `user_email=ambujyadav0010@gmail.com; path=/; max-age=86400`;
    document.cookie = `user_role=ADMIN; path=/; max-age=86400`;
    onLoginSuccess(adminUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Ambient Radial Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-cyan-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Bar */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-white text-lg">
              AX
            </div>
          </div>
          <div>
            <h1 className="font-black text-xl tracking-wider bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              ASPIRANT<span className="text-cyan-400">X</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">UPSC & SSC SaaS</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="landing-guest-demo-btn"
            onClick={handleGuestLogin}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs transition-all duration-200"
          >
            Explore Demo
          </button>
          
          <button
            id="landing-signin-btn"
            onClick={() => { setShowEmailModal(true); setAuthError(null); setAuthSuccess(null); }}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all duration-200"
          >
            <UserIcon className="w-4 h-4" />
            Sign In / Register
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-20 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs font-semibold text-cyan-400 mb-6 shadow-xl backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
          The Gen-Z Operating System for UPSC CSE & SSC CGL Rankers
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-tight"
        >
          Crack India's Toughest Exams with{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            AI & Precision Discipline
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mt-6 leading-relaxed"
        >
          Master syllabus coverage, execute pomodoro focus sprints, track daily PYQ routines, and clear doubts with our dedicated AI Mentor calibrated for Lal Bahadur Shastri National Academy of Administration standards.
        </motion.p>

        {/* Hero CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto"
        >
          <button
            id="hero-google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs flex items-center justify-center gap-3 shadow-xl transition-all duration-200 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Sign In with Google</span>
          </button>

          <button
            id="hero-quick-start-btn"
            onClick={handleGuestLogin}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 transition-all duration-200 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Instant App Access (No Login Required)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        {authSuccess && (
          <p className="text-xs text-emerald-300 mt-4 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30 max-w-md mx-auto font-bold">
            {authSuccess}
          </p>
        )}
      </section>

      {/* Auth Error Diagnostic Modal */}
      <AnimatePresence>
        {authError && (
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
                <h3 className="font-extrabold text-white text-base">Google Authentication Diagnostics</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Below is the exact response returned by Google / Supabase:</p>
              </div>

              <div className="text-xs text-rose-300 font-bold bg-rose-950/60 p-3.5 rounded-2xl border border-rose-500/30 text-left font-mono break-all leading-relaxed">
                ⚠️ {authError}
              </div>

              <div className="text-xs text-slate-300 text-left bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 font-medium">
                <p className="font-bold text-cyan-400">💡 Quick Troubleshooting Steps:</p>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-300 text-[11px]">
                  <li>
                    <strong>If "Provider is not enabled":</strong> Open <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Supabase Dashboard</a> ➔ <strong>Authentication</strong> ➔ <strong>Providers</strong> ➔ Click <strong>Google</strong> ➔ Toggle <strong>Enable Google provider to ON</strong>.
                  </li>
                  <li>
                    <strong>If "redirect_uri_mismatch":</strong> In <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Google Cloud Console</a> ➔ OAuth Client ➔ Add <code>https://ixwpkzorjutnhpnybuvx.supabase.co/auth/v1/callback</code> under <em>Authorized redirect URIs</em>.
                  </li>
                  <li>
                    <strong>Browser Preview:</strong> Make sure you open the website directly in a regular Chrome browser tab (<code>http://localhost:3000</code> or your Vercel link) rather than an embedded preview window.
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

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24 relative z-10">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-white">Engineered for Maximum Retention & Focus</h3>
          <p className="text-xs text-slate-400 mt-1">Five core modules integrated into one unified dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl hover:border-cyan-500/40 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Syllabus Command Center</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Track Prelims, Mains GS1-GS4, CSAT, and Tier-1/2 topics with micro-completion percentages and weightage flags.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl hover:border-purple-500/40 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
              <Timer className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Pomodoro & Soundscapes</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              25m/50m UPSC study sprints with embedded Web Audio ambient rain sounds for distraction-free deep work.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl hover:border-blue-500/40 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">AI Study Mentor</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Powered by server-side Gemini AI for instant answer evaluation, PYQ simplification, and essay structure recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500 relative z-10">
        <p>© 2026 AspirantX SaaS Platform. Built for UPSC & SSC Aspirants.</p>
      </footer>

      {/* Email / Password Sign In & Sign Up Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">
                      {authMode === 'signin' ? 'Sign In to AspirantX' : 'Create Student Account'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Choose your preferred sign-in method</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Google OAuth Button inside Modal */}
              <button
                type="button"
                onClick={() => { setShowEmailModal(false); handleGoogleSignIn(); }}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs flex items-center justify-center gap-2.5 shadow-md transition-all border border-slate-200"
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
                <span>or use email & password</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Mode Toggle */}
              <div className="flex rounded-xl bg-black/50 p-1 border border-white/5">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                    authMode === 'signin' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                    authMode === 'signup' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleEmailAuthSubmit} className="space-y-4 text-xs">
                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Full Name</label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Email Address</label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                {authError && (
                  <p className="text-[11px] text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 font-semibold">
                    ⚠️ {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

