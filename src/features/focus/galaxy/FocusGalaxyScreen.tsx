import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Orbit, 
  Sparkles, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Flame, 
  Globe2, 
  ChevronRight, 
  CheckCircle2, 
  Zap, 
  Award, 
  ArrowLeft,
  Clock,
  BookOpen,
  Volume2,
  VolumeX,
  Compass,
  Layers,
  ChevronDown
} from 'lucide-react';
import { PlanetarySystem } from './PlanetarySystem';
import { ConstellationMap } from './ConstellationMap';
import { FocusStopwatchView } from './FocusStopwatchView';
import { useFocusSession } from './useFocusSession';
import { useFocusProgression, SessionCompleteModal, FocusSessionRewardResult } from '../progression';
import { useFocusPeripherals, useDeviceOptimization } from '../hooks';
import { loadStudySessions, getISTDateString } from '../../../lib/gamification';

export type GalaxyViewMode = 'ORBIT' | 'SKY' | 'FOCUS';

export interface FocusGalaxyScreenProps {
  initialMode?: GalaxyViewMode;
  userId?: string;
  selectedExam?: string;
  onBack?: () => void;
}

export const FocusGalaxyScreen: React.FC<FocusGalaxyScreenProps> = ({
  initialMode = 'ORBIT',
  userId = 'guest',
  selectedExam = 'UPSC',
  onBack
}) => {
  // 1. Navigation View Mode
  const [mode, setMode] = useState<GalaxyViewMode>(initialMode);

  // 2. Progression Hook (Levels 1 to 1000)
  const [streakDays, setStreakDays] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(`aspirantx_focus_streak_${userId}`);
      return stored ? Math.max(1, parseInt(stored, 10)) : 1;
    } catch {
      return 1;
    }
  });

  const {
    totalDust,
    progression,
    milestone,
    addSessionReward
  } = useFocusProgression(userId, streakDays);

  // 3. Focus Session Engine
  const {
    mode: timerMode,
    setMode: setTimerMode,
    selectedDuration,
    setDurationMinutes,
    pomoMinutes,
    pomoSeconds,
    stopwatchSeconds,
    isActive: isTimerActive,
    isPaused: isTimerPaused,
    subject,
    setSubject,
    topic,
    setTopic,
    startTimer,
    pauseTimer,
    resumeTimer,
    completeSession,
    resetTimer
  } = useFocusSession({
    userId,
    defaultDurationMinutes: 25,
    initialSubject: selectedExam ? `${selectedExam} Core` : 'General Studies',
    initialTopic: 'Deep Sprint'
  });

  // 4. Zero-Asset Cosmic Audio Synth, Haptics & Screen Keep-Awake
  const {
    isMuted,
    toggleMute,
    isDroneActive,
    isWakeLockActive,
    onSessionStart,
    onSessionPause,
    onSessionResume,
    onSessionComplete,
    onButtonTap,
    triggerHaptic
  } = useFocusPeripherals({
    isFocusActive: isTimerActive && !isTimerPaused,
    autoDroneOnFocus: true
  });

  // 5. Adaptive Device Optimization (Battery Saver & Frame Throttling)
  const {
    isBatterySaverMode,
    toggleBatterySaver,
    targetFps,
    starParticleCount,
    allowIdleRotation,
    devicePixelRatio: optimizedDpr
  } = useDeviceOptimization();

  // 6. Session Complete Modal & Comet Delivery State
  const [isRewardModalOpen, setIsRewardModalOpen] = useState<boolean>(false);
  const [activeReward, setActiveReward] = useState<FocusSessionRewardResult | null>(null);
  const [isCometDelivering, setIsCometDelivering] = useState<boolean>(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState<boolean>(false);

  // Sync profile streak from backend / storage
  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const token = localStorage.getItem('aspirantx_auth_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/user/profile', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const resolved = Number(data.profile.streakDays || data.profile.streak_days) || 1;
            setStreakDays(Math.max(1, resolved));
            localStorage.setItem(`aspirantx_focus_streak_${userId}`, String(resolved));
          }
        }
      } catch {}
    };
    fetchStreak();
  }, [userId]);

  // Session Completion Handler
  const handleFinishSession = useCallback(async () => {
    const sessionData = await completeSession();
    const duration = sessionData.durationMinutes;

    // Trigger reward calculation
    const reward = addSessionReward(duration, streakDays);
    setActiveReward(reward);

    // Audio SFX + Haptic celebration pulse + Screen WakeLock release
    onSessionComplete(reward.leveledUp);

    // Switch to ORBIT view and trigger comet delivery and celebration modal
    setMode('ORBIT');
    setIsCometDelivering(true);
    setIsRewardModalOpen(true);
  }, [completeSession, addSessionReward, streakDays, onSessionComplete]);

  // Predefined subjects for quick selection
  const quickSubjects = useMemo(() => [
    'General Studies',
    'History & Culture',
    'Polity & Constitution',
    'Economy & Development',
    'Geography & Environment',
    'Science & Tech',
    'Ethics & Aptitude'
  ], []);

  // Format Timer Digits
  const formattedTimer = useMemo(() => {
    if (timerMode === 'pomodoro') {
      const m = String(pomoMinutes).padStart(2, '0');
      const s = String(pomoSeconds).padStart(2, '0');
      return `${m}:${s}`;
    } else {
      const h = Math.floor(stopwatchSeconds / 3600);
      const m = Math.floor((stopwatchSeconds % 3600) / 60);
      const s = stopwatchSeconds % 60;
      if (h > 0) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  }, [timerMode, pomoMinutes, pomoSeconds, stopwatchSeconds]);

  // Timer Progress Percentage
  const sessionProgress = useMemo(() => {
    if (timerMode === 'pomodoro') {
      const totalSecs = selectedDuration * 60;
      const currentSecs = pomoMinutes * 60 + pomoSeconds;
      return Math.min(100, Math.max(0, Math.round(((totalSecs - currentSecs) / totalSecs) * 100)));
    }
    return Math.min(100, Math.round((stopwatchSeconds / 3600) * 100));
  }, [timerMode, selectedDuration, pomoMinutes, pomoSeconds, stopwatchSeconds]);

  const unlockedMoonsCount = Math.min(Math.floor(streakDays / 3), 5);

  // Stable Comet Absorbed Handler
  const handleCometAbsorbed = useCallback(() => {
    setIsCometDelivering(false);
  }, []);

  // Stable Planet Seed (changes only on level progression, not every timer tick)
  const planetSeed = useMemo(() => {
    return progression.currentLevel * 37 + 101;
  }, [progression.currentLevel]);

  return (
    <div className="w-full max-w-md mx-auto h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden select-none touch-none relative bg-slate-950 pt-[env(safe-area-inset-top,0.75rem)] pb-[env(safe-area-inset-bottom,0.75rem)] px-3 sm:px-4 text-slate-100 font-sans">
      {/* ══════════════════════════════════════════════════════════════════
          1. TOP COSMIC HUD (PERSISTENT ACROSS VIEWS, FLEX-SHRINK-0)
      ══════════════════════════════════════════════════════════════════ */}
      <header className="relative z-30 w-full flex-shrink-0 flex flex-col gap-1.5 pt-1 sm:pt-2 pb-1">
        <div className="p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl bg-slate-900/85 border border-slate-800/80 backdrop-blur-2xl shadow-xl flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Left: User Level Badge */}
          <div className="flex items-center gap-1.5">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div 
              className="px-2.5 py-1 rounded-xl border flex items-center gap-1.5 shadow-sm transition-all"
              style={{
                borderColor: `${milestone.accentColor}50`,
                backgroundColor: `${milestone.accentColor}15`
              }}
            >
              <span className="text-xs sm:text-sm">{milestone.icon}</span>
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-none">
                  {milestone.badge}
                </span>
                <span className="text-[clamp(0.7rem,2.8vw,0.85rem)] font-black font-mono leading-tight" style={{ color: milestone.accentColor }}>
                  LVL {progression.currentLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Streak Counter */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 shadow-sm">
            <Flame className="w-3.5 h-3.5 fill-current animate-pulse text-amber-400 shrink-0" />
            <span className="text-[clamp(0.7rem,2.8vw,0.85rem)] font-black font-mono whitespace-nowrap">
              {streakDays}d Streak
            </span>
          </div>

          {/* Right: Audio Toggle, WakeLock & Cosmic Dust Balance */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Screen WakeLock Indicator */}
            {isWakeLockActive && (
              <div 
                className="hidden xs:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono shadow-sm"
                title="Screen WakeLock Active: Display will not sleep during focus"
              >
                <Zap className="w-2.5 h-2.5 fill-current animate-pulse text-emerald-400" />
                <span>AWAKE</span>
              </div>
            )}

            {/* Battery Saver ECO Mode Indicator */}
            {isBatterySaverMode && (
              <button
                onClick={toggleBatterySaver}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-mono shadow-sm cursor-pointer"
                title="Adaptive Battery Saver Active: 30 FPS, Throttled Particles. Click to toggle."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>ECO</span>
              </button>
            )}

            {/* Cosmic Audio Toggle */}
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer flex items-center justify-center min-h-[36px] min-w-[36px]"
              title={isMuted ? "Unmute Cosmic Audio" : "Mute Cosmic Audio"}
              aria-label="Toggle Cosmic Audio"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              )}
              {isDroneActive && !isMuted && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping ml-0.5" />
              )}
            </button>

            {/* Cosmic Dust Balance */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-300 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-spin shrink-0" style={{ animationDuration: '10s' }} />
              <span className="text-[clamp(0.7rem,2.8vw,0.85rem)] font-black font-mono text-sky-200">
                {totalDust.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Level Progression Progress Bar */}
        <div className="px-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5 px-1">
            <span className="flex items-center gap-1">
              <span>Tier:</span>
              <span className="text-slate-200 font-bold">{milestone.name}</span>
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[170px] sm:max-w-none text-right">
              {progression.isMaxLevel 
                ? 'Singularity Max Level' 
                : `${progression.dustToNextLevel.toLocaleString()} Dust to Lv. ${progression.currentLevel + 1}`}
            </span>
          </div>
          <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-950/80 border border-slate-800/80 overflow-hidden">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 shadow-lg shadow-sky-500/25"
              initial={{ width: 0 }}
              animate={{ width: `${progression.progressPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          2. CENTER STAGE (CONDITIONAL VIEWPORT WITH ZERO WEBGL GPU LEAKS)
      ══════════════════════════════════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════════════════════
          2. CENTER STAGE (FLEX-1 MIN-H-0 RELATIVE W-FULL OVERFLOW-HIDDEN)
      ══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 min-h-0 relative w-full overflow-hidden flex items-center justify-center my-1">
        <AnimatePresence mode="wait">
          {/* ─────────────────────────────────────────────────────────────
              VIEW A: ORBIT MODE (3D Planetary System + Moons)
          ───────────────────────────────────────────────────────────── */}
          {mode === 'ORBIT' && (
            <motion.div
              key="orbit-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full min-h-0 flex-1 flex flex-col items-center justify-center"
            >
              {/* Active 3D WebGL Canvas Viewport */}
              <div className="relative w-full h-full min-h-0 flex-1 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800/60 shadow-2xl bg-gradient-to-b from-[#050812] to-[#020306] flex items-center justify-center">
                <PlanetarySystem
                  level={progression.currentLevel}
                  streakDays={streakDays}
                  type={milestone.category}
                  seed={planetSeed}
                  isDeliveringReward={isCometDelivering}
                  onCometAbsorbed={handleCometAbsorbed}
                  autoRotate={true}
                  allowIdleRotation={allowIdleRotation}
                  targetFps={targetFps}
                  starParticleCount={starParticleCount}
                  devicePixelRatio={optimizedDpr}
                  showStarfield={true}
                  className="w-full h-full pointer-events-auto"
                />

                {/* Overlaid Planet Details Badge */}
                <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] sm:text-xs font-mono text-slate-300 backdrop-blur-md flex items-center gap-1.5 pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{milestone.name}</span>
                </div>

                {/* Touch Guidance Overlay */}
                <div className="absolute bottom-3 right-3 z-10 px-2.5 py-0.5 rounded-lg bg-slate-950/70 border border-slate-800/70 text-[9px] font-mono text-slate-400 backdrop-blur-md pointer-events-none hidden xs:block">
                  Drag to rotate • Pinch to zoom
                </div>
              </div>

              {/* Planet Stats Pill Bar Below (Compact) */}
              <div className="mt-1.5 sm:mt-2 w-full grid grid-cols-3 gap-1.5 text-center pointer-events-none flex-shrink-0">
                <div className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Class</span>
                  <p className="text-[clamp(0.7rem,2.8vw,0.85rem)] font-black text-sky-400 capitalize truncate">{milestone.category}</p>
                </div>
                <div className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Atmosphere</span>
                  <p className="text-[clamp(0.7rem,2.8vw,0.85rem)] font-black text-emerald-400 truncate">Stable</p>
                </div>
                <div className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Moons</span>
                  <p className="text-[clamp(0.7rem,2.8vw,0.85rem)] font-black text-amber-400 font-mono truncate">{unlockedMoonsCount} / 5</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW B: SKY MODE (2D Constellation Map)
          ───────────────────────────────────────────────────────────── */}
          {mode === 'SKY' && (
            <motion.div
              key="sky-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full min-h-0 flex-1 flex flex-col items-center justify-center"
            >
              <div className="relative w-full h-full min-h-0 flex-1 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
                <ConstellationMap userId={userId} className="w-full h-full pointer-events-auto" />
              </div>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW C: FOCUS MODE (Auto-Adaptive 3D Backdrop + Stopwatch HUD)
          ───────────────────────────────────────────────────────────── */}
          {mode === 'FOCUS' && (
            <motion.div
              key="focus-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full min-h-0 flex-1 flex flex-col items-center justify-center"
            >
              <FocusStopwatchView
                userId={userId}
                level={progression.currentLevel}
                streakDays={streakDays}
                category={milestone.category}
                seed={planetSeed}
                accentColor={milestone.accentColor}
                timerMode={timerMode}
                formattedTime={formattedTimer}
                secondsElapsed={timerMode === 'pomodoro' ? (selectedDuration * 60 - (pomoMinutes * 60 + pomoSeconds)) : stopwatchSeconds}
                progressPercent={sessionProgress}
                isActive={isTimerActive}
                isPaused={isTimerPaused}
                subject={subject}
                topic={topic}
                onStart={() => {
                  onSessionStart();
                  startTimer();
                }}
                onPause={() => {
                  onSessionPause();
                  pauseTimer();
                }}
                onResume={() => {
                  onSessionResume();
                  resumeTimer();
                }}
                onFinish={handleFinishSession}
                onReset={() => {
                  onButtonTap();
                  resetTimer();
                }}
                show3DBackdrop={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          3. BOTTOM NAVIGATION & ACTION DOCK (FLEX-SHRINK-0 Z-20)
      ══════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-30 w-full flex-shrink-0 pt-1 pb-[env(safe-area-inset-bottom,0.75rem)]">
        <nav 
          className="p-1 sm:p-1.5 rounded-full sm:rounded-3xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-2xl shadow-2xl flex items-center justify-around gap-1"
          aria-label="Cosmic Navigation Dock"
        >
          {/* Tab 1: ORBIT */}
          <button
            onClick={() => {
              onButtonTap();
              setMode('ORBIT');
            }}
            className={`flex-1 h-[44px] min-h-[44px] py-2 px-3 rounded-full sm:rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'ORBIT'
                ? 'bg-sky-500 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.35)] scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Orbit className="w-4 h-4" />
            <span>Orbit</span>
          </button>

          {/* Tab 2: FOCUS */}
          <button
            onClick={() => {
              onButtonTap();
              setMode('FOCUS');
            }}
            className={`flex-1 h-[44px] min-h-[44px] py-2 px-3 rounded-full sm:rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'FOCUS'
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_18px_rgba(251,191,36,0.45)] scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Flame className="w-4 h-4 fill-current text-slate-950" />
            <span>Focus</span>
          </button>

          {/* Tab 3: SKY */}
          <button
            onClick={() => {
              onButtonTap();
              setMode('SKY');
            }}
            className={`flex-1 h-[44px] min-h-[44px] py-2 px-3 rounded-full sm:rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'SKY'
                ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)] scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Sky</span>
          </button>
        </nav>
      </footer>

      {/* ══════════════════════════════════════════════════════════════════
          4. SESSION COMPLETE CELEBRATION REWARD MODAL
      ══════════════════════════════════════════════════════════════════ */}
      <SessionCompleteModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        reward={activeReward}
        subject={subject}
        topic={topic}
        onClaim={() => {
          setIsRewardModalOpen(false);
          setMode('ORBIT');
        }}
      />
    </div>
  );
};
