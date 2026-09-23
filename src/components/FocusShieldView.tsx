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
  WifiOff
} from 'lucide-react';
import { UserProfile, TrophyItem } from '../types';
import { PressFeedback, SlideUp, triggerConfetti } from '../lib/animations';
import { getApiUrl } from '../lib/apiConfig';

// Direct Capacitor bridge for FocusShield
declare const Capacitor: any;

interface FocusShieldViewProps {
  user: UserProfile | null;
  onTrophyUnlock?: (unlocked: any) => void;
}

interface DistractingApp {
  id: string;
  name: string;
  package: string;
  icon: string;
  defaultBlocked: boolean;
}

const DISTRACTING_APPS: DistractingApp[] = [
  { id: 'youtube', name: 'YouTube', package: 'com.google.android.youtube', icon: '▶️', defaultBlocked: true },
  { id: 'instagram', name: 'Instagram', package: 'com.instagram.android', icon: '📸', defaultBlocked: true },
  { id: 'facebook', name: 'Facebook', package: 'com.facebook.katana', icon: '👥', defaultBlocked: false },
  { id: 'snapchat', name: 'Snapchat', package: 'com.snapchat.android', icon: '👻', defaultBlocked: false },
  { id: 'reddit', name: 'Reddit', package: 'com.reddit.frontpage', icon: '🤖', defaultBlocked: false },
  { id: 'twitter', name: 'X / Twitter', package: 'com.twitter.android', icon: '🐦', defaultBlocked: false }
];

export const FocusShieldView: React.FC<FocusShieldViewProps> = ({ user, onTrophyUnlock }) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [customDuration, setCustomDuration] = useState<string>('45');
  const [selectedApps, setSelectedApps] = useState<string[]>([
    'com.google.android.youtube',
    'com.instagram.android'
  ]);

  // Session state
  const [sessionState, setSessionState] = useState<'IDLE' | 'STARTING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'>('IDLE');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [totalRequestedSeconds, setTotalRequestedSeconds] = useState<number>(25 * 60);
  const [isVpnActive, setIsVpnActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showVpnDisclosure, setShowVpnDisclosure] = useState<boolean>(false);

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
  }, [user?.id]);

  // App toggle handler
  const toggleApp = (pkg: string) => {
    if (sessionState !== 'IDLE') return;
    setSelectedApps(prev => 
      prev.includes(pkg) ? prev.filter(p => p !== pkg) : [...prev, pkg]
    );
  };

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

  // Start Focus Session
  const handleStartFocus = async () => {
    if (!user) return;
    setErrorMsg(null);

    // Google Play VpnService Prominent Disclosure check
    const hasConsented = localStorage.getItem('protrack_vpn_disclosure_consented') === 'true';
    if (!hasConsented && typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      setShowVpnDisclosure(true);
      return;
    }

    setSessionState('STARTING');

    const duration = selectedDuration === -1 ? Math.max(5, parseInt(customDuration, 10) || 45) : selectedDuration;
    const durationSeconds = duration * 60;

    try {
      // 1. Check & request Android VPN permission if on native Android
      const prepRes = await callNativePlugin('prepareVpn');
      if (prepRes && prepRes.granted === false) {
        setErrorMsg('VPN Permission was not granted by system. Focus Shield requires VPN permission to restrict network for selected apps.');
        setSessionState('IDLE');
        return;
      }

      // 2. Start session on server
      const sRes = await fetch(getApiUrl('/api/focus/session/start'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          requestedMinutes: duration,
          blockedApps: selectedApps
        })
      });
      const sData = await sRes.json();
      if (!sData.success) {
        throw new Error(sData.error || 'Failed to start server focus session');
      }

      const sessionId = sData.session.id;
      setActiveSessionId(sessionId);
      setTotalRequestedSeconds(durationSeconds);
      setRemainingSeconds(durationSeconds);

      // 3. Start native Android VPN black-hole
      await callNativePlugin('startShield', { apps: selectedApps });
      setIsVpnActive(true);

      setSessionState('ACTIVE');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error starting focus session');
      setSessionState('IDLE');
    }
  };

  const handleAgreeDisclosure = () => {
    localStorage.setItem('protrack_vpn_disclosure_consented', 'true');
    setShowVpnDisclosure(false);
    handleStartFocus();
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

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 pt-2">
            {sessionState === 'ACTIVE' ? (
              <button
                onClick={handlePause}
                className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center gap-2 transition-all border border-slate-700"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="py-3 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-sky-500/25"
              >
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </button>
            )}

            <button
              onClick={handleCompleteFocus}
              className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finish Early</span>
            </button>

            <button
              onClick={handleCancelFocus}
              className="py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 font-semibold text-sm transition-all border border-slate-800"
            >
              <span>Cancel</span>
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
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-indigo-400" />
              <span>2. Select Distracting Apps to Restrict</span>
            </h3>
            <p className="text-xs text-slate-400">
              Only the selected apps will have their network paused during your session. ProTrack, browsers, and study resources maintain full high-speed internet.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {DISTRACTING_APPS.map(app => {
                const isSelected = selectedApps.includes(app.package);
                return (
                  <div
                    key={app.id}
                    onClick={() => toggleApp(app.package)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-950/30 border-indigo-500/40 text-white'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{app.icon}</span>
                      <div>
                        <div className="font-bold text-sm text-white">{app.name}</div>
                        <div className="text-[10px] text-slate-400">{app.package}</div>
                      </div>
                    </div>

                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-indigo-500 focus:ring-0"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trust & Privacy Notice */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <span className="text-white font-semibold">100% On-Device Privacy: </span>
              Focus Shield runs an on-device local network filter. ProTrack does not route your traffic to external servers, does not inspect your messages, and does not require Accessibility hacks.
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

      {/* ── GOOGLE PLAY VPNSERVICE PROMINENT DISCLOSURE MODAL ── */}
      {showVpnDisclosure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-indigo-500/40 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Focus Shield Network Permission</h3>
              <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                Google Play Policy Disclosure
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed max-h-60 overflow-y-auto pr-1">
              <p>
                To help you maintain distraction-free study sessions, <strong>ProTrack Focus Shield</strong> uses the Android <strong>VpnService</strong> API.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-white">How it works:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>Creates a <strong>local on-device filter</strong> to restrict network access <em>only</em> for the specific apps you select (e.g., YouTube, Instagram).</li>
                  <li><strong>Zero Data Collection:</strong> No internet traffic is collected, inspected, tracked, or sent to any remote server.</li>
                  <li><strong>All other apps & ProTrack</strong> maintain full, unrestricted internet access.</li>
                  <li>Active <em>only</em> during your study timer. Stops immediately when the timer ends or you tap Stop.</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowVpnDisclosure(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAgreeDisclosure}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-sm shadow-lg shadow-sky-500/20 transition-all"
              >
                Agree & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
