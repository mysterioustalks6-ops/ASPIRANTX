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
    <div className="relative w-full h-screen min-h-[600px] overflow-hidden select-none bg-[#020408] text-slate-100 font-sans flex flex-col justify-between">
      {/* ══════════════════════════════════════════════════════════════════
          1. TOP COSMIC HUD (PERSISTENT ACROSS VIEWS)
      ══════════════════════════════════════════════════════════════════ */}
      <header className="relative z-30 w-full px-4 pt-4 sm:pt-6 pb-2 max-w-5xl mx-auto flex flex-col gap-2">
        <div className="p-3 sm:p-4 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-2xl shadow-2xl flex items-center justify-between gap-2">
          {/* Left: User Level Badge */}
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div 
              className="px-3 py-1.5 rounded-2xl border flex items-center gap-2 shadow-sm transition-all"
              style={{
                borderColor: `${milestone.accentColor}50`,
                backgroundColor: `${milestone.accentColor}15`
              }}
            >
              <span className="text-sm">{milestone.icon}</span>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {milestone.badge}
                </span>
                <span className="text-xs font-black font-mono" style={{ color: milestone.accentColor }}>
                  LVL {progression.currentLevel} / 1000
                </span>
              </div>
            </div>
          </div>

          {/* Center: Streak Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 shadow-sm">
            <Flame className="w-4 h-4 fill-current animate-pulse text-amber-400" />
            <span className="text-xs font-black font-mono">
              {streakDays} {streakDays === 1 ? 'Day' : 'Days'} Streak
            </span>
          </div>

          {/* Right: Audio Toggle, WakeLock & Cosmic Dust Balance */}
          <div className="flex items-center gap-2">
            {/* Screen WakeLock Indicator */}
            {isWakeLockActive && (
              <div 
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono shadow-sm"
                title="Screen WakeLock Active: Display will not sleep during focus"
              >
                <Zap className="w-3 h-3 fill-current animate-pulse text-emerald-400" />
                <span>AWAKE</span>
              </div>
            )}

            {/* Battery Saver ECO Mode Indicator */}
            {isBatterySaverMode && (
              <button
                onClick={toggleBatterySaver}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono shadow-sm cursor-pointer"
                title="Adaptive Battery Saver Active: 30 FPS, Throttled Particles. Click to toggle."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>ECO</span>
              </button>
            )}

            {/* Zero-Asset Cosmic Audio Mute/Unmute Toggle */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
              title={isMuted ? "Unmute Cosmic Audio" : "Mute Cosmic Audio"}
              aria-label="Toggle Cosmic Audio"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-slate-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-sky-400" />
              )}
              {isDroneActive && !isMuted && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
              )}
            </button>

            {/* Cosmic Dust Balance */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-sky-300 shadow-sm">
              <Sparkles className="w-4 h-4 text-sky-400 animate-spin" style={{ animationDuration: '10s' }} />
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
                  Cosmic Dust
                </span>
                <span className="text-xs font-black font-mono text-sky-200">
                  {totalDust.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Level Progression Progress Bar */}
        <div className="px-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 px-1">
            <span className="flex items-center gap-1">
              <span>Tier:</span>
              <span className="text-slate-200 font-bold">{milestone.name}</span>
            </span>
            <span>
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
      <main className="relative flex-1 w-full max-w-5xl mx-auto px-4 flex flex-col items-center justify-center overflow-hidden">
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
              className="relative w-full h-full flex flex-col items-center justify-center"
            >
              {/* Active 3D WebGL Canvas */}
              <div className="relative w-full h-[360px] sm:h-[460px] max-h-[62vh] min-h-[350px] rounded-3xl overflow-hidden border border-slate-800/60 shadow-2xl bg-gradient-to-b from-[#050812] to-[#020306]">
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

                {/* Overlaid Planet Details Badge (pointer-events-none so touches pass to 3D canvas) */}
                <div className="absolute top-4 left-4 z-10 px-3.5 py-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 backdrop-blur-md flex items-center gap-2 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{milestone.name}</span>
                </div>

                {/* Touch Guidance Overlay (Fades subtly) */}
                <div className="absolute bottom-4 right-4 z-10 px-3 py-1 rounded-xl bg-slate-950/70 border border-slate-800/70 text-[10px] font-mono text-slate-400 backdrop-blur-md pointer-events-none hidden sm:block">
                  Drag to rotate • Pinch to zoom
                </div>
              </div>

              {/* Planet Stats Pill Bar Below */}
              <div className="mt-3 w-full grid grid-cols-3 gap-2 text-center max-w-xl pointer-events-none">
                <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Class</span>
                  <p className="text-xs font-black text-sky-400 capitalize">{milestone.category}</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Atmosphere</span>
                  <p className="text-xs font-black text-emerald-400">Stable</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Moons</span>
                  <p className="text-xs font-black text-amber-400 font-mono">{unlockedMoonsCount} / 5</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW B: SKY MODE (2D Constellation Map)
              (Note: PlanetarySystem is completely unmounted here to preserve GPU)
          ───────────────────────────────────────────────────────────── */}
          {mode === 'SKY' && (
            <motion.div
              key="sky-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full flex flex-col items-center justify-center"
            >
              <div className="w-full h-[400px] sm:h-[480px] max-h-[66vh] min-h-[350px] rounded-3xl overflow-hidden shadow-2xl">
                <ConstellationMap userId={userId} className="w-full h-full pointer-events-auto" />
              </div>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW C: FOCUS MODE (Minimalist Timer with Dimmed 3D Backdrop)
          ───────────────────────────────────────────────────────────── */}
          {mode === 'FOCUS' && (
            <motion.div
              key="focus-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full flex flex-col items-center justify-center"
            >
              {/* Dimmed 3D Backdrop */}
              <div className="absolute inset-0 z-0 pointer-events-none opacity-30 scale-90 sm:scale-100 flex items-center justify-center overflow-hidden">
                <PlanetarySystem
                  level={progression.currentLevel}
                  streakDays={streakDays}
                  type={milestone.category}
                  seed={planetSeed}
                  autoRotate={true}
                  allowIdleRotation={allowIdleRotation}
                  targetFps={targetFps}
                  devicePixelRatio={optimizedDpr}
                  showStarfield={false}
                  className="w-full h-full pointer-events-none"
                />
              </div>

              {/* Foreground Floating Minimalist Timer HUD */}
              <div className="relative z-10 w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/85 border border-slate-700/80 backdrop-blur-2xl shadow-2xl text-center space-y-6 pointer-events-auto">
                {/* Mode Selector Pill (Pomodoro / Stopwatch) */}
                <div className="inline-flex p-1 rounded-2xl bg-slate-950 border border-slate-800">
                  <button
                    onClick={() => {
                      setTimerMode('pomodoro');
                      resetTimer();
                    }}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      timerMode === 'pomodoro'
                        ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Pomodoro (25m)
                  </button>
                  <button
                    onClick={() => {
                      setTimerMode('stopwatch');
                      resetTimer();
                    }}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      timerMode === 'stopwatch'
                        ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Stopwatch
                  </button>
                </div>

                {/* Subject & Topic Dropdown / Display */}
                <div className="relative">
                  <button
                    onClick={() => setShowSubjectPicker(!showSubjectPicker)}
                    className="w-full px-4 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <BookOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>{subject} • {topic}</span>
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {/* Quick Subject Select Popover */}
                  {showSubjectPicker && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl z-30 text-left space-y-1">
                      {quickSubjects.map(qs => (
                        <button
                          key={qs}
                          onClick={() => {
                            setSubject(qs);
                            setShowSubjectPicker(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                            subject === qs ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                          }`}
                        >
                          {qs}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Giant Digital Digits */}
                <div className="py-2">
                  <span className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white drop-shadow-lg">
                    {formattedTimer}
                  </span>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isTimerActive && !isTimerPaused ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className="text-xs uppercase font-bold tracking-widest text-slate-400 font-mono">
                      {isTimerActive ? (isTimerPaused ? 'Orbit Suspended' : 'Deep Accretion Flow') : 'Ready To Launch'}
                    </span>
                  </div>
                </div>

                {/* Session Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${sessionProgress}%` }}
                  />
                </div>

                {/* Timer Action Controls */}
                <div className="flex items-center justify-center gap-3">
                  {!isTimerActive ? (
                    <button
                      onClick={() => {
                        onSessionStart();
                        startTimer();
                      }}
                      className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-sky-500/25 cursor-pointer transition-all active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Ignite Orbit</span>
                    </button>
                  ) : (
                    <>
                      {isTimerPaused ? (
                        <button
                          onClick={() => {
                            onSessionResume();
                            resumeTimer();
                          }}
                          className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer transition-all active:scale-95"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Resume</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onSessionPause();
                            pauseTimer();
                          }}
                          className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-all active:scale-95"
                        >
                          <Pause className="w-4 h-4 fill-current" />
                          <span>Pause</span>
                        </button>
                      )}

                      <button
                        onClick={handleFinishSession}
                        className="px-6 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-rose-500/25 cursor-pointer transition-all active:scale-95"
                        title="Finish and claim dust rewards"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>Finish & Claim</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      onButtonTap();
                      resetTimer();
                    }}
                    className="p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          3. BOTTOM NAVIGATION & ACTION DOCK (GLASSMORPHISM PILL)
      ══════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-30 w-full px-4 pb-6 pt-2 max-w-md mx-auto">
        <nav 
          className="p-1.5 rounded-3xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-2xl shadow-2xl flex items-center justify-around gap-1.5"
          aria-label="Cosmic Navigation Dock"
        >
          {/* Tab 1: ORBIT */}
          <button
            onClick={() => {
              onButtonTap();
              setMode('ORBIT');
            }}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'ORBIT'
                ? 'bg-sky-500 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.35)] scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Orbit className="w-4 h-4" />
            <span>Orbit</span>
          </button>

          {/* Tab 2: FOCUS (Center Hero Glow) */}
          <button
            onClick={() => {
              onButtonTap();
              setMode('FOCUS');
            }}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'FOCUS'
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_18px_rgba(251,191,36,0.45)] scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Flame className="w-4 h-4 fill-current text-amber-400 group-hover:animate-bounce" />
            <span>Focus</span>
          </button>

          {/* Tab 3: SKY */}
          <button
            onClick={() => {
              onButtonTap();
              setMode('SKY');
            }}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
