import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Play, 
  Pause, 
  RotateCcw, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Flame, 
  Trophy, 
  Lock, 
  Smartphone, 
  ShieldCheck, 
  Sparkles,
  WifiOff,
  AlertTriangle,
  ExternalLink,
  Search,
  CheckCheck,
  X
} from 'lucide-react';
import { UserProfile, TrophyItem } from '../types';
import { PressFeedback, SlideUp, triggerConfetti } from '../lib/animations';
import { getApiUrl } from '../lib/apiConfig';

// Direct Capacitor bridge for FocusShield
declare const Capacitor: any;

// Helper to call native FocusShield plugin
const callNativePlugin = async (method: string, data: any = {}) => {
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
    try {
      const { Plugins } = (window as any).Capacitor;
      if (Plugins?.FocusShield && typeof Plugins.FocusShield[method] === 'function') {
        return await Plugins.FocusShield[method](data);
      }
    } catch (e: any) {
      console.warn(`[FocusShield] Native plugin call ${method} failed:`, e?.message || e);
    }
  }
  return null;
};

interface FocusShieldViewProps {
  user: UserProfile | null;
  onTrophyUnlock?: (unlocked: any) => void;
}

interface DistractingApp {
  id: string;
  name: string;
  package: string;
  icon: string;
  category?: string;
  isDistraction?: boolean;
  defaultBlocked?: boolean;
}

const DEFAULT_DISTRACTING_APPS: DistractingApp[] = [
  { id: 'instagram', name: 'Instagram', package: 'com.instagram.android', icon: '📸', category: 'Social', isDistraction: true, defaultBlocked: true },
  { id: 'youtube', name: 'YouTube', package: 'com.google.android.youtube', icon: '▶️', category: 'Entertainment', isDistraction: true, defaultBlocked: true },
  { id: 'facebook', name: 'Facebook', package: 'com.facebook.katana', icon: '👥', category: 'Social', isDistraction: true, defaultBlocked: true },
  { id: 'snapchat', name: 'Snapchat', package: 'com.snapchat.android', icon: '👻', category: 'Social', isDistraction: true, defaultBlocked: true },
  { id: 'hotstar', name: 'Disney+ Hotstar', package: 'in.startv.hotstar', icon: '⭐', category: 'Entertainment', isDistraction: true, defaultBlocked: true },
  { id: 'sharechat', name: 'ShareChat', package: 'in.mohalla.sharechat', icon: '💬', category: 'Social', isDistraction: true, defaultBlocked: true },
  { id: 'moj', name: 'Moj Video', package: 'in.mohalla.video', icon: '🎬', category: 'Entertainment', isDistraction: true, defaultBlocked: true },
  { id: 'spotify', name: 'Spotify Music', package: 'com.spotify.music', icon: '🎵', category: 'Entertainment', isDistraction: true, defaultBlocked: false },
  { id: 'reddit', name: 'Reddit', package: 'com.reddit.frontpage', icon: '🤖', category: 'Social', isDistraction: true, defaultBlocked: true },
  { id: 'twitter', name: 'X / Twitter', package: 'com.twitter.android', icon: '🐦', category: 'Social', isDistraction: true, defaultBlocked: true },
  { id: 'flipkart', name: 'Flipkart', package: 'com.flipkart.android', icon: '🛍️', category: 'Shopping', isDistraction: true, defaultBlocked: false },
  { id: 'amazon', name: 'Amazon Shopping', package: 'in.amazon.mShop.android.shopping', icon: '📦', category: 'Shopping', isDistraction: true, defaultBlocked: false },
  { id: 'myntra', name: 'Myntra', package: 'com.myntra.android', icon: '👗', category: 'Shopping', isDistraction: true, defaultBlocked: false },
  { id: 'swiggy', name: 'Swiggy Food & Dineout', package: 'in.swiggy.android', icon: '🍔', category: 'Shopping', isDistraction: true, defaultBlocked: false },
  { id: 'games', name: 'Google Play Games', package: 'com.google.android.play.games', icon: '🎮', category: 'Gaming', isDistraction: true, defaultBlocked: true }
];

export const FocusShieldView: React.FC<FocusShieldViewProps> = ({ user, onTrophyUnlock }) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [customDuration, setCustomDuration] = useState<string>('45');
  const [installedApps, setInstalledApps] = useState<DistractingApp[]>(DEFAULT_DISTRACTING_APPS);
  const [loadingApps, setLoadingApps] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('DISTRACTIONS');
  const [selectedApps, setSelectedApps] = useState<string[]>([
    'com.google.android.youtube',
    'com.instagram.android',
    'com.facebook.katana',
    'com.snapchat.android',
    'in.startv.hotstar',
    'in.mohalla.sharechat',
    'in.mohalla.video',
    'com.reddit.frontpage'
  ]);

  // Session state
  const [sessionState, setSessionState] = useState<'IDLE' | 'STARTING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'>('IDLE');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [totalRequestedSeconds, setTotalRequestedSeconds] = useState<number>(25 * 60);
  const [isVpnActive, setIsVpnActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAccessibilityGuide, setShowAccessibilityGuide] = useState<boolean>(false);
  const [showStrictFrictionModal, setShowStrictFrictionModal] = useState<boolean>(false);
  const [frictionAction, setFrictionAction] = useState<'GIVE_UP' | 'PAUSE' | 'FINISH_EARLY'>('GIVE_UP');
  const [frictionCountdown, setFrictionCountdown] = useState<number>(15);
  const [frictionInput, setFrictionInput] = useState<string>('');
  const frictionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const STRICT_PLEDGE = "I AM GIVING UP MY STUDY GOAL";

  // Stats
  const [stats, setStats] = useState<{
    todayMinutes: number;
    weekMinutes: number;
    totalSessions: number;
  }>({
    todayMinutes: 0,
    weekMinutes: 0,
    totalSessions: 0
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('aspirantx_auth_token') || localStorage.getItem('supabase.auth.token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (user?.id) headers['x-user-id'] = user.id;
    if (user?.email) headers['x-user-email'] = user.email;
    return headers;
  };

  // Fetch telemetry
  const fetchStats = async () => {
    if (!user) return;
    try {
      const res = await fetch(getApiUrl('/api/focus/stats'), { headers: getHeaders() });
      const data = await res.json();
      if (data.success && data.stats) {
        setStats({
          todayMinutes: data.stats.todayMinutes,
          weekMinutes: data.stats.weekMinutes,
          totalSessions: data.stats.totalSessions
        });
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchStats();

    // Load all launchable apps from device
    const loadInstalledApps = async () => {
      setLoadingApps(true);
      try {
        const res = await callNativePlugin('getInstalledApps');
        if (res && Array.isArray(res.apps) && res.apps.length > 0) {
          setInstalledApps(res.apps);

          // Restore saved selection or default to all auto-detected distraction apps
          const savedSelection = localStorage.getItem('protrack_focus_shield_selected_apps');
          if (savedSelection) {
            try {
              const parsed = JSON.parse(savedSelection);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSelectedApps(parsed);
                return;
              }
            } catch (e) {}
          }

          // Default: select all apps identified as distractions
          const distractionPkgs = res.apps
            .filter((a: any) => a.isDistraction)
            .map((a: any) => a.package);
          if (distractionPkgs.length > 0) {
            setSelectedApps(distractionPkgs);
          }
        }
      } catch (err) {
        console.warn('[FocusShield] Failed to query installed apps:', err);
      } finally {
        setLoadingApps(false);
      }
    };

    loadInstalledApps();

    // Check if there is an active session in localStorage or native plugin
    const checkActiveSession = async () => {
      const saved = localStorage.getItem('protrack_active_focus_session');
      const nativeStatus = await callNativePlugin('getShieldStatus');
      
      if (saved) {
        try {
          const sess = JSON.parse(saved);
          const elapsed = Math.floor((Date.now() - sess.startTimestamp) / 1000);
          const remaining = Math.max(0, sess.totalSeconds - elapsed);
          
          if (remaining > 0) {
            setActiveSessionId(sess.sessionId);
            setTotalRequestedSeconds(sess.totalSeconds);
            setRemainingSeconds(remaining);
            if (sess.selectedApps) setSelectedApps(sess.selectedApps);
            setSessionState('ACTIVE');
            setIsVpnActive(nativeStatus?.isActive ?? true);
          } else {
            // Session expired while away
            localStorage.removeItem('protrack_active_focus_session');
            if (nativeStatus?.isActive) {
              await callNativePlugin('stopShield');
            }
          }
        } catch (e) {
          localStorage.removeItem('protrack_active_focus_session');
        }
      } else if (nativeStatus?.isActive) {
        // Native shield active but no local session saved, restore generic session
        setIsVpnActive(true);
        setSessionState('ACTIVE');
        setActiveSessionId(`foc_active_${Date.now()}`);
        setTotalRequestedSeconds(25 * 60);
        setRemainingSeconds(20 * 60);
      }
    };

    checkActiveSession();
  }, [user?.id]);

  // App toggle handler with persistence
  const toggleApp = (pkg: string) => {
    if (sessionState !== 'IDLE') return;
    setSelectedApps(prev => {
      const next = prev.includes(pkg) ? prev.filter(p => p !== pkg) : [...prev, pkg];
      localStorage.setItem('protrack_focus_shield_selected_apps', JSON.stringify(next));
      return next;
    });
  };

  // Quick Selection Helpers
  const handleSelectAllDistractions = () => {
    const distractionPkgs = installedApps
      .filter(a => a.isDistraction)
      .map(a => a.package);
    setSelectedApps(distractionPkgs);
    localStorage.setItem('protrack_focus_shield_selected_apps', JSON.stringify(distractionPkgs));
  };

  const handleSelectAllVisible = (visiblePkgs: string[]) => {
    const combined = Array.from(new Set([...selectedApps, ...visiblePkgs]));
    setSelectedApps(combined);
    localStorage.setItem('protrack_focus_shield_selected_apps', JSON.stringify(combined));
  };

  const handleClearAll = () => {
    setSelectedApps([]);
    localStorage.setItem('protrack_focus_shield_selected_apps', JSON.stringify([]));
  };

  // Start Focus Session
  const handleStartFocus = async () => {
    if (!user) return;
    setErrorMsg(null);

    // 1. Accessibility permission check on Android native
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      const accessRes = await callNativePlugin('isAccessibilityEnabled');
      if (accessRes && accessRes.enabled === false) {
        setShowAccessibilityGuide(true);
        return;
      }
    }

    setSessionState('STARTING');

    const duration = selectedDuration === -1 ? Math.max(5, parseInt(customDuration, 10) || 45) : selectedDuration;
    const durationSeconds = duration * 60;

    try {
      // 2. Start session on server with graceful fallback
      let sessionId = `foc_local_${Date.now()}`;
      try {
        const sRes = await fetch(getApiUrl('/api/focus/session/start'), {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            requestedMinutes: duration,
            blockedApps: selectedApps
          })
        });
        const sData = await sRes.json();
        if (sData?.success && sData?.session?.id) {
          sessionId = sData.session.id;
        }
      } catch (serverErr: any) {
        console.warn('[FocusShield] Server sync warning, continuing in local mode:', serverErr?.message);
      }

      setActiveSessionId(sessionId);
      setTotalRequestedSeconds(durationSeconds);
      setRemainingSeconds(durationSeconds);

      // Save to localStorage for persistence across tabs/backgrounding
      localStorage.setItem('protrack_active_focus_session', JSON.stringify({
        sessionId,
        startTimestamp: Date.now(),
        totalSeconds: durationSeconds,
        selectedApps
      }));

      // 3. Start native Android Accessibility app blocker
      await callNativePlugin('startShield', { 
        apps: selectedApps,
        durationMinutes: duration,
        durationSeconds: durationSeconds
      });
      setIsVpnActive(true);

      setSessionState('ACTIVE');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error starting focus session');
      setSessionState('IDLE');
    }
  };

  // Strict Friction Trigger (Enforces anti-impulse delay on Pause, Early Finish, & Give Up)
  const handleInitiateFriction = (action: 'GIVE_UP' | 'PAUSE' | 'FINISH_EARLY' = 'GIVE_UP') => {
    setFrictionAction(action);
    setShowStrictFrictionModal(true);
    setFrictionCountdown(15);
    setFrictionInput('');
    if (frictionTimerRef.current) clearInterval(frictionTimerRef.current);
    frictionTimerRef.current = setInterval(() => {
      setFrictionCountdown(prev => {
        if (prev <= 1) {
          if (frictionTimerRef.current) clearInterval(frictionTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleConfirmStrictAction = async () => {
    if (frictionCountdown > 0 || frictionInput.trim().toUpperCase() !== STRICT_PLEDGE) {
      return;
    }
    if (frictionTimerRef.current) clearInterval(frictionTimerRef.current);
    setShowStrictFrictionModal(false);
    if (frictionAction === 'PAUSE') {
      await handlePause();
    } else if (frictionAction === 'FINISH_EARLY') {
      await handleCompleteFocus();
    } else {
      await handleCancelFocus();
    }
  };

  // Heartbeat loop & countdown timer
  useEffect(() => {
    if (sessionState === 'ACTIVE') {
      // Countdown tick
      timerRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            handleCompleteFocus();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Server Heartbeat every 60s
      heartbeatRef.current = setInterval(() => {
        if (activeSessionId) {
          fetch(getApiUrl(`/api/focus/session/${activeSessionId}/heartbeat`), {
            method: 'POST',
            headers: getHeaders()
          }).catch(() => {});
        }
      }, 60000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [sessionState, activeSessionId]);

  // Pause
  const handlePause = async () => {
    if (!activeSessionId) return;
    try {
      await fetch(getApiUrl(`/api/focus/session/${activeSessionId}/pause`), {
        method: 'POST',
        headers: getHeaders()
      });
      setSessionState('PAUSED');
    } catch (e) {}
  };

  // Resume
  const handleResume = async () => {
    if (!activeSessionId) return;
    try {
      await fetch(getApiUrl(`/api/focus/session/${activeSessionId}/resume`), {
        method: 'POST',
        headers: getHeaders()
      });
      setSessionState('ACTIVE');
    } catch (e) {}
  };

  // Complete Focus
  const handleCompleteFocus = async () => {
    if (!activeSessionId) return;
    try {
      localStorage.removeItem('protrack_active_focus_session');
      // Stop native VPN
      await callNativePlugin('stopShield');
      setIsVpnActive(false);

      const res = await fetch(getApiUrl(`/api/focus/session/${activeSessionId}/complete`), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ exam: user?.exam || 'ALL' })
      });
      const data = await res.json();

      setSessionState('COMPLETED');
      triggerConfetti();
      fetchStats();

      // Trigger unlock celebrations if any
      if (data.rewards?.unlockedTrophies?.length > 0 && onTrophyUnlock) {
        data.rewards.unlockedTrophies.forEach((t: any) => onTrophyUnlock(t));
      }
    } catch (err: any) {
      setErrorMsg('Failed to verify completion: ' + err.message);
    }
  };

  // Cancel Session
  const handleCancelFocus = async () => {
    if (!activeSessionId) return;
    try {
      localStorage.removeItem('protrack_active_focus_session');
      await callNativePlugin('stopShield');
      setIsVpnActive(false);
      await fetch(getApiUrl(`/api/focus/session/${activeSessionId}/cancel`), {
        method: 'POST',
        headers: getHeaders()
      });
      setSessionState('IDLE');
      setActiveSessionId(null);
    } catch (e) {
      setSessionState('IDLE');
    }
  };

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const progressPercent = totalRequestedSeconds > 0 
    ? Math.min(100, Math.round(((totalRequestedSeconds - remainingSeconds) / totalRequestedSeconds) * 100))
    : 0;

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto px-4 sm:px-6">
      {/* ── HERO BANNER ────────────────────────────────────────────── */}
      <SlideUp delay={0.05}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border border-slate-800/90 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>On-Device Distraction Control</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Focus Shield
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
            Protect your study time by restricting network access to distracting apps (YouTube, Instagram) while you focus.
            ProTrack stays local, private, and server-verified.
          </p>

          {/* Quick Stats Pill */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400">Today's Focus</div>
              <div className="text-lg font-bold text-white">{Math.floor(stats.todayMinutes / 60)}h {stats.todayMinutes % 60}m</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400">This Week</div>
              <div className="text-lg font-bold text-indigo-400">{Math.floor(stats.weekMinutes / 60)}h {stats.weekMinutes % 60}m</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400">Completed Sessions</div>
              <div className="text-lg font-bold text-emerald-400">{stats.totalSessions}</div>
            </div>
          </div>
        </div>
      </SlideUp>

      {/* ── ERROR ALERT ────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* ── ACTIVE / PAUSED TIMER INTERFACE ────────────────────────── */}
      {(sessionState === 'ACTIVE' || sessionState === 'PAUSED') && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-3xl bg-slate-900 border border-indigo-500/40 text-center shadow-2xl space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 animate-pulse">
            <ShieldCheck className="w-4 h-4" />
            <span>Focus Shield Active • {selectedApps.length} Apps Restricted</span>
          </div>

          {/* Large Countdown Display */}
          <div className="text-6xl sm:text-7xl font-mono font-black text-white tracking-tight">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto space-y-1">
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
              <span>Elapsed: {Math.floor((totalRequestedSeconds - remainingSeconds) / 60)}m</span>
              <span>Target: {Math.floor(totalRequestedSeconds / 60)}m</span>
            </div>
          </div>

          {/* Controls with Strict Anti-Impulse Friction */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {sessionState === 'ACTIVE' ? (
              <button
                onClick={() => handleInitiateFriction('PAUSE')}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all border border-slate-700 shadow-sm"
                title="Strict Focus: Requires 15s cooldown and pledge"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="py-3 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-sky-500/25"
              >
                <Play className="w-4 h-4" />
                <span>Resume Session</span>
              </button>
            )}

            <button
              onClick={() => {
                // If more than 90% completed, allow finish early directly; otherwise enforce friction
                if (remainingSeconds <= totalRequestedSeconds * 0.1) {
                  handleCompleteFocus();
                } else {
                  handleInitiateFriction('FINISH_EARLY');
                }
              }}
              className="py-3 px-5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all border border-emerald-500/40"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Finish Early</span>
            </button>

            <button
              onClick={() => handleInitiateFriction('GIVE_UP')}
              className="py-3 px-4 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 font-semibold text-xs sm:text-sm transition-all border border-slate-800"
            >
              <span>Give Up</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ── SESSION COMPLETED SCREEN ──────────────────────────────── */}
      {sessionState === 'COMPLETED' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-3xl bg-slate-900 border border-emerald-500/40 text-center shadow-2xl space-y-5"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
            🏆
          </div>
          <h2 className="text-2xl font-black text-white">Focus Session Completed!</h2>
          <p className="text-slate-300 text-sm max-w-md mx-auto">
            Your focused study minutes have been verified and recorded to your permanent academic record in Neon PostgreSQL.
          </p>

          <button
            onClick={() => {
              setSessionState('IDLE');
              setActiveSessionId(null);
            }}
            className="py-3 px-8 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-sky-500/25"
          >
            Start Another Session
          </button>
        </motion.div>
      )}

      {/* ── IDLE SETUP SCREEN ──────────────────────────────────────── */}
      {sessionState === 'IDLE' && (
        <div className="space-y-6">
          {/* Duration Selector */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/90 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>1. Choose Session Duration</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[25, 50, 90, -1].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDuration(d)}
                  className={`py-3 px-4 rounded-2xl border text-sm font-bold transition-all ${
                    selectedDuration === d
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/50 shadow-md shadow-sky-500/10'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  {d === -1 ? 'Custom' : `${d} Minutes`}
                </button>
              ))}
            </div>

            {selectedDuration === -1 && (
              <div className="pt-2 flex items-center gap-3">
                <label className="text-xs text-slate-400 font-medium">Custom Minutes:</label>
                <input
                  type="number"
                  min="5"
                  max="360"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  className="w-24 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-sky-500"
                />
              </div>
            )}
          </div>

          {/* Distracting Apps Checklist */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <span>2. Select Distracting Apps to Lock ({selectedApps.length} Selected)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Opening any selected app will immediately show the ProTrack Lock Screen until your timer completes.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSelectAllDistractions}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 hover:from-amber-500/30 hover:to-orange-500/30 transition-all shadow-sm"
                  title="Select all apps categorized as distractions"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Block All Distractions ({installedApps.filter(a => a.isDistraction).length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white font-medium text-xs transition-all"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="space-y-3 pt-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search installed apps (e.g. Instagram, Hotstar, Moj, Snapchat)..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                {[
                  { id: 'DISTRACTIONS', label: 'Distractions', count: installedApps.filter(a => a.isDistraction).length, icon: '⚡' },
                  { id: 'ALL', label: 'All Installed', count: installedApps.length, icon: '📱' },
                  { id: 'Social', label: 'Social', count: installedApps.filter(a => a.category === 'Social').length, icon: '💬' },
                  { id: 'Entertainment', label: 'Video / OTT', count: installedApps.filter(a => a.category === 'Entertainment').length, icon: '🎬' },
                  { id: 'Gaming', label: 'Games', count: installedApps.filter(a => a.category === 'Gaming').length, icon: '🎮' },
                  { id: 'Shopping', label: 'Shopping', count: installedApps.filter(a => a.category === 'Shopping').length, icon: '🛍️' }
                ].filter(c => c.count > 0 || c.id === 'DISTRACTIONS' || c.id === 'ALL').map(cat => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border-slate-800'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Apps Grid */}
            {(() => {
              const filteredList = installedApps.filter(app => {
                if (selectedCategory === 'DISTRACTIONS' && !app.isDistraction) return false;
                if (selectedCategory !== 'ALL' && selectedCategory !== 'DISTRACTIONS' && app.category !== selectedCategory) return false;
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase().trim();
                  if (!app.name.toLowerCase().includes(q) && !app.package.toLowerCase().includes(q)) {
                    return false;
                  }
                }
                return true;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="p-8 text-center rounded-2xl bg-slate-950/50 border border-slate-800/80 text-slate-400 text-xs">
                    No apps found matching your query or filter.
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span>Showing {filteredList.length} apps</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllVisible(filteredList.map(a => a.package))}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      + Select All {filteredList.length}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {filteredList.map(app => {
                      const isSelected = selectedApps.includes(app.package);
                      return (
                        <div
                          key={app.package}
                          onClick={() => toggleApp(app.package)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-sm'
                              : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-2xl flex-shrink-0">{app.icon || '📱'}</span>
                            <div className="min-w-0">
                              <div className="font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
                                <span>{app.name}</span>
                                {app.isDistraction && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    Distraction
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">{app.package}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isSelected && (
                              <Lock className="w-3.5 h-3.5 text-indigo-400" />
                            )}
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-indigo-500 focus:ring-0 cursor-pointer"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Trust & Privacy Notice */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <span className="text-white font-semibold">100% On-Device Protection: </span>
              Focus Shield intercepts distracting apps instantly using Android Accessibility. The moment a blocked app is tapped, ProTrack's branded lock overlay opens with your active countdown timer. No VPN, no battery drain, zero privacy risk.
            </div>
          </div>

          {/* Launch Button */}
          <PressFeedback>
            <button
              onClick={handleStartFocus}
              disabled={selectedApps.length === 0}
              className={`w-full py-4 rounded-2xl text-base font-black shadow-xl transition-all flex items-center justify-center gap-2 ${
                selectedApps.length > 0
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 shadow-sky-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-5 h-5" />
              <span>Start Focus Session ({selectedDuration === -1 ? customDuration : selectedDuration} Min)</span>
            </button>
          </PressFeedback>
        </div>
      )}

      {/* ── ACCESSIBILITY SERVICE PERMISSION GUIDE MODAL ── */}
      {showAccessibilityGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-indigo-500/40 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Enable Focus Shield Blocker</h3>
              <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                Android Accessibility Setup
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                To block distracting apps (YouTube, Instagram) from opening and display the <strong>ProTrack Lock Screen Overlay with Timer</strong>, Android requires the <strong>ProTrack Focus Shield</strong> accessibility permission.
              </p>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-white">Quick 3-Step Setup:</div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>Tap <strong>Open Accessibility Settings</strong> below.</li>
                  <li>Find and tap <strong>ProTrack Focus Shield</strong> (under Downloaded Apps).</li>
                  <li>Toggle the switch to <strong>ON</strong> and tap Allow.</li>
                </ol>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAccessibilityGuide(false)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  await callNativePlugin('openAccessibilitySettings');
                  setShowAccessibilityGuide(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-sm shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STRICT FRICTION / ANTI-QUIT MODAL ── */}
      {showStrictFrictionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-rose-500/40 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">
                Strict Focus Mode: {frictionAction === 'PAUSE' ? 'Pause Session?' : frictionAction === 'FINISH_EARLY' ? 'Finish Early?' : 'Give Up?'}
              </h3>
              <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider">
                Anti-Impulse Friction Challenge
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Focus Shield enforces ironclad study discipline. To {frictionAction === 'PAUSE' ? 'pause' : frictionAction === 'FINISH_EARLY' ? 'finish early' : 'cancel'} your session before the timer completes, you must wait out the reflection cooldown and type the pledge below.
            </p>

            {/* Friction Cooldown Display */}
            <div className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${
              frictionCountdown > 0 
                ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' 
                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            }`}>
              {frictionCountdown > 0 ? (
                <span>⏳ Wait {frictionCountdown}s before unlock activates</span>
              ) : (
                <span>✓ Reflection delay passed</span>
              )}
            </div>

            {/* Confirmation Pledge Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400">
                Type exactly: <span className="text-rose-400 font-bold tracking-wider">{STRICT_PLEDGE}</span>
              </label>
              <input
                type="text"
                value={frictionInput}
                onChange={e => setFrictionInput(e.target.value)}
                placeholder={STRICT_PLEDGE}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  if (frictionTimerRef.current) clearInterval(frictionTimerRef.current);
                  setShowStrictFrictionModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all"
              >
                Keep Focusing
              </button>
              <button
                disabled={frictionCountdown > 0 || frictionInput.trim().toUpperCase() !== STRICT_PLEDGE}
                onClick={handleConfirmStrictAction}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                  frictionCountdown === 0 && frictionInput.trim().toUpperCase() === STRICT_PLEDGE
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                {frictionAction === 'PAUSE' ? 'Confirm Pause' : frictionAction === 'FINISH_EARLY' ? 'Confirm Finish' : 'Confirm Give Up'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
