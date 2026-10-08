import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, 
  ShieldAlert, CheckCircle2, ChevronRight, Sliders, Wrench, 
  ArrowLeft, Eye, EyeOff, Info, Clock, AlertTriangle, Coffee, Compass, BarChart2,
  CloudRain, Wind
} from 'lucide-react';
import { 
  FocusSession, 
  ActiveTimerState, 
  getActiveTimerState, 
  saveActiveTimerState, 
  getPendingAwayConfirmation, 
  setPendingAwayConfirmation, 
  recordSession, 
  loadSessions, 
  DEFAULT_TIMER_CONFIG 
} from '../../../lib/focus/sessionStore';
import { 
  getBikeState, 
  computeSuggestedWeeklyTarget, 
  UserBikePreferences 
} from '../../../lib/focus/bikeEngine';
import { DEFAULT_BIKE_CONFIG } from '../../../lib/focus/bikeConfig';
import { RELAX_SCENES_MANIFEST, RelaxScene } from './relaxManifest';
import { RiderAssetSlot } from './RiderAssetSlot';
import { scheduleFocusNotifications, clearFocusNotifications } from './notifications';
import { soundFx } from '../../../lib/soundEffects';
import { triggerConfetti } from '../../../lib/animations';
import { TactileButton } from '../../../design-system/TactileButton';
import { VeerMascot } from '../../../design-system/VeerMascot';
import { EndlessHighwayLandscape } from './EndlessHighwayLandscape';

export interface HighwayFocusTimerProps {
  userId?: string;
  selectedExam?: string;
  onNavigateToGarage?: () => void;
  onOpenGarage?: () => void;
  onNavigateToMyRides?: () => void;
  onBack?: () => void;
  onTimerRunningChange?: (isRunning: boolean) => void;
}

export const HighwayFocusTimer: React.FC<HighwayFocusTimerProps> = ({
  userId = 'guest',
  selectedExam = 'NEET_UG',
  onNavigateToGarage,
  onOpenGarage,
  onNavigateToMyRides,
  onBack,
  onTimerRunningChange
}) => {
  const handleOpenGarage = onOpenGarage || onNavigateToGarage;
  // ── 1. TIMER STATE & CONFIG ──
  const [mode, setMode] = useState<'pomodoro' | 'stopwatch'>('pomodoro');
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');
  const [plannedMinutes, setPlannedMinutes] = useState<number>(25);
  const [breakMinutes, setBreakMinutes] = useState<number>(5);
  const [blockIndex, setBlockIndex] = useState<number>(1);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeRemainingMs, setTimeRemainingMs] = useState<number>(25 * 60 * 1000);
  const [stopwatchElapsedMs, setStopwatchElapsedMs] = useState<number>(0);

  // Active Timer Reference
  const timerStateRef = useRef<ActiveTimerState | null>(null);

  // ── 2. AWAY / BACKGROUND RECOVERY MODAL & CELEBRATION MODAL ──
  const [pendingAwaySession, setPendingAwaySession] = useState<FocusSession | null>(null);
  const [completedSessionModal, setCompletedSessionModal] = useState<FocusSession | null>(null);

  // ── 3. HARDWARE BACK / ABANDON CONFIRMATION ──
  const [showExitConfirmModal, setShowExitConfirmModal] = useState<boolean>(false);

  // ── 4. RELAX SCENERY VIEW & CLOCK CHIP (PERSISTED) ──
  const [isRelaxViewActive, setIsRelaxViewActive] = useState<boolean>(false);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const [showSceneCredits, setShowSceneCredits] = useState<boolean>(false);
  const [showClockChip, setShowClockChip] = useState<boolean>(() => {
    try {
      return localStorage.getItem('studyride_show_clock_chip') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleClockChip = () => {
    setShowClockChip(prev => {
      const next = !prev;
      try {
        localStorage.setItem('studyride_show_clock_chip', String(next));
      } catch {}
      return next;
    });
  };

  // ── RELAX AMBIENCE & SCENERY PACE STATE ──
  const [ambientSound, setAmbientSound] = useState<'off' | 'rain' | 'wind' | 'engine'>('off');
  const [sceneryPace, setSceneryPace] = useState<number>(1.0);

  const handleSelectAmbientSound = (soundType: 'off' | 'rain' | 'wind' | 'engine') => {
    soundFx.playTap();
    soundFx.triggerHaptic(12);
    setAmbientSound(soundType);
    soundFx.setAmbient(soundType);
  };

  const handleSelectPace = (pace: number) => {
    soundFx.playTap();
    soundFx.triggerHaptic(10);
    setSceneryPace(pace);
  };

  const handleExitRelaxView = () => {
    soundFx.playTap();
    soundFx.stopAmbient();
    setAmbientSound('off');
    setIsRelaxViewActive(false);
  };

  useEffect(() => {
    onTimerRunningChange?.(isRunning);
  }, [isRunning, onTimerRunningChange]);

  // ── 5. BIKE ENGINE & USER PREFERENCES ──
  const [userPrefs, setUserPrefs] = useState<UserBikePreferences>(() => {
    try {
      const saved = localStorage.getItem(`aspirantx_bike_prefs_${userId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { weeklyTargetHours: null, pauseDates: [], restDayOfWeek: 0 };
  });

  const [targetInputVal, setTargetInputVal] = useState<string>('');
  const [showTargetModal, setShowTargetModal] = useState<boolean>(false);

  const currentScene = RELAX_SCENES_MANIFEST[selectedSceneIndex] || RELAX_SCENES_MANIFEST[0];

  // Derived Bike state from Session Store
  const sessions = useMemo(() => loadSessions(userId), [userId, isRunning]);
  const bikeState = useMemo(() => {
    return getBikeState(sessions, DEFAULT_BIKE_CONFIG, new Date(), userPrefs);
  }, [sessions, userPrefs]);

  // Suggested weekly target
  const suggestion = useMemo(() => {
    return computeSuggestedWeeklyTarget(625, undefined, new Date());
  }, []);

  // ── 6. INITIALIZATION & RECOVERY ──
  useEffect(() => {
    // Check pending away confirmation
    const away = getPendingAwayConfirmation();
    if (away) {
      setPendingAwaySession(away);
      setPendingAwayConfirmation(null);
    }

    // Check active timer state
    const savedActive = getActiveTimerState();
    if (savedActive) {
      const nowMs = Date.now();
      timerStateRef.current = savedActive;
      setMode(savedActive.mode);
      setTimerType(savedActive.type);
      setBlockIndex(savedActive.blockIndex);

      if (savedActive.mode === 'pomodoro' && savedActive.endsAt) {
        if (savedActive.isPaused) {
          setIsRunning(true);
          setIsPaused(true);
          const remaining = Math.max(0, savedActive.endsAt - (savedActive.pausedAt || nowMs));
          setTimeRemainingMs(remaining);
        } else if (nowMs >= savedActive.endsAt) {
          // Ended while away! Create pending session to ask user
          const actualSecs = (savedActive.plannedMinutes || 25) * 60;
          const finishedSession: FocusSession = {
            id: savedActive.id,
            startedAt: new Date(savedActive.startedAt).toISOString(),
            endedAt: new Date(savedActive.endsAt).toISOString(),
            mode: 'pomodoro',
            plannedMinutes: savedActive.plannedMinutes,
            actualSeconds: actualSecs,
            type: savedActive.type,
            completed: true
          };
          saveActiveTimerState(null);
          setPendingAwaySession(finishedSession);
          setIsRunning(false);
          setIsPaused(false);
        } else {
          // Still running! Resume smoothly with exact remaining timestamp
          setIsRunning(true);
          setIsPaused(false);
          setTimeRemainingMs(savedActive.endsAt - nowMs);
        }
      } else if (savedActive.mode === 'stopwatch') {
        setIsRunning(true);
        setIsPaused(savedActive.isPaused);
        const currentEffectiveTime = savedActive.isPaused ? (savedActive.pausedAt || nowMs) : nowMs;
        const elapsed = Math.max(0, (currentEffectiveTime - savedActive.startedAt) - (savedActive.totalPausedMs || 0));
        setStopwatchElapsedMs(elapsed);
      }
    }
  }, []);

  // ── 7. TIMESTAMP ENGINE (TICK-INDEPENDENT) ──
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = setInterval(() => {
      const active = timerStateRef.current;
      if (!active) return;
      const nowMs = Date.now();

      if (active.mode === 'pomodoro' && active.endsAt) {
        const remaining = Math.max(0, active.endsAt - nowMs);
        setTimeRemainingMs(remaining);
        if (remaining <= 0) {
          setTimeRemainingMs(0);
          handleFinishSession(true);
        }
      } else if (active.mode === 'stopwatch') {
        const elapsed = Math.max(0, (nowMs - active.startedAt) - (active.totalPausedMs || 0));
        setStopwatchElapsedMs(prev => Math.max(prev, elapsed));
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  // Recalculate accurately upon foregrounding without waiting for interval tick
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const active = timerStateRef.current;
        if (!active) return;
        const nowMs = Date.now();
        if (active.mode === 'stopwatch') {
          if (!active.isPaused) {
            const elapsed = Math.max(0, (nowMs - active.startedAt) - (active.totalPausedMs || 0));
            setStopwatchElapsedMs(prev => Math.max(prev, elapsed));
          }
        } else if (active.mode === 'pomodoro' && active.endsAt) {
          if (!active.isPaused) {
            const remaining = Math.max(0, active.endsAt - nowMs);
            setTimeRemainingMs(remaining);
            if (remaining <= 0) {
              handleFinishSession(true);
            }
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // ── 8. TIMER ACTIONS ──
  const handleStartTimer = async () => {
    soundFx.playTap();
    soundFx.triggerHaptic(15);

    const nowMs = Date.now();
    const sessionId = `fs_${Date.now()}`;

    if (mode === 'pomodoro') {
      const durationMs = (timerType === 'focus' ? plannedMinutes : breakMinutes) * 60 * 1000;
      const endsAt = nowMs + durationMs;

      const newState: ActiveTimerState = {
        id: sessionId,
        mode: 'pomodoro',
        type: timerType,
        startedAt: nowMs,
        endsAt,
        plannedMinutes: timerType === 'focus' ? plannedMinutes : breakMinutes,
        isPaused: false,
        totalPausedMs: 0,
        blockIndex
      };

      timerStateRef.current = newState;
      saveActiveTimerState(newState);
      setTimeRemainingMs(durationMs);
      setIsRunning(true);
      setIsPaused(false);

      // Schedule Native Android notification
      await scheduleFocusNotifications({
        title: `Focus Ride (${plannedMinutes}m)`,
        body: 'Keep riding smoothly. Highway focus is in progress.',
        endsAtMs: endsAt
      });
    } else {
      // Stopwatch
      const newState: ActiveTimerState = {
        id: sessionId,
        mode: 'stopwatch',
        type: 'focus',
        startedAt: nowMs,
        isPaused: false,
        totalPausedMs: 0,
        blockIndex: 1
      };
      timerStateRef.current = newState;
      saveActiveTimerState(newState);
      setStopwatchElapsedMs(0);
      setIsRunning(true);
      setIsPaused(false);
    }
  };

  const handlePauseTimer = () => {
    soundFx.playTap();
    soundFx.triggerHaptic(12);

    const active = timerStateRef.current;
    if (!active || active.isPaused) return; // Prevent double pause overwrite

    const nowMs = Date.now();
    active.isPaused = true;
    active.pausedAt = nowMs;
    timerStateRef.current = active;
    saveActiveTimerState(active);
    setIsPaused(true);
    clearFocusNotifications();
  };

  const handleResumeTimer = () => {
    soundFx.playTap();
    soundFx.triggerHaptic(15);

    const active = timerStateRef.current;
    if (!active || !active.isPaused || !active.pausedAt) return; // Only resume if active and paused

    const nowMs = Date.now();
    const pausedDuration = Math.max(0, nowMs - active.pausedAt);
    active.totalPausedMs += pausedDuration;
    active.isPaused = false;
    active.pausedAt = undefined;

    if (active.mode === 'pomodoro' && active.endsAt) {
      active.endsAt += pausedDuration;
      scheduleFocusNotifications({
        title: `Focus Ride Resumed`,
        body: 'Pacing on the highway resumed.',
        endsAtMs: active.endsAt
      });
    }

    timerStateRef.current = active;
    saveActiveTimerState(active);
    setIsPaused(false);
  };

  const handleFinishSession = (completed: boolean) => {
    const active = timerStateRef.current;
    if (!active) return;

    const nowMs = Date.now();
    let actualSeconds = 0;

    if (active.mode === 'pomodoro') {
      actualSeconds = Math.round(((active.plannedMinutes || 25) * 60 * 1000 - Math.max(0, timeRemainingMs)) / 1000);
      if (completed) {
        actualSeconds = (active.plannedMinutes || 25) * 60;
      }
    } else {
      actualSeconds = Math.round(stopwatchElapsedMs / 1000);
    }

    const session: FocusSession = {
      id: active.id,
      startedAt: new Date(active.startedAt).toISOString(),
      endedAt: new Date(nowMs).toISOString(),
      mode: active.mode,
      plannedMinutes: active.plannedMinutes,
      actualSeconds: Math.max(0, actualSeconds),
      type: active.type,
      completed
    };

    recordSession(userId, session);
    saveActiveTimerState(null);
    clearFocusNotifications();
    timerStateRef.current = null;
    soundFx.stopAmbient();
    setAmbientSound('off');
    setIsRunning(false);
    setIsPaused(false);

    if (completed) {
      soundFx.playSuccess();
      triggerConfetti({ particleCount: 60, spread: 80 });
      setCompletedSessionModal(session);

      // Advance block index
      if (active.type === 'focus') {
        const nextBlock = (active.blockIndex % DEFAULT_TIMER_CONFIG.blocksBeforeLongBreak) + 1;
        setBlockIndex(nextBlock);
        if (nextBlock === 1) {
          // Long break preset
          setTimerType('break');
          setBreakMinutes(15);
        } else {
          setTimerType('break');
          setBreakMinutes(5);
        }
      } else {
        setTimerType('focus');
      }
    }
  };

  const handleAbandonSession = () => {
    handleFinishSession(false);
    setShowExitConfirmModal(false);
  };

  // ── 9. PREFERENCE UPDATES ──
  const handleSaveWeeklyTarget = (hours: number | null) => {
    const updated: UserBikePreferences = { ...userPrefs, weeklyTargetHours: hours };
    setUserPrefs(updated);
    try {
      localStorage.setItem(`aspirantx_bike_prefs_${userId}`, JSON.stringify(updated));
    } catch {}
    setShowTargetModal(false);
  };

  // Format seconds to mm:ss
  const formatTime = (ms: number) => {
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Format stopwatch to hh:mm:ss
  const formatStopwatch = (ms: number) => {
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Derive ride progress percentage for 4-layer parallax transitions (0/25/50/75%)
  const rideProgressPercent = useMemo(() => {
    if (mode === 'pomodoro') {
      const totalMs = (timerType === 'focus' ? plannedMinutes : breakMinutes) * 60 * 1000;
      if (totalMs <= 0) return 0;
      return Math.min(100, Math.max(0, Math.round(((totalMs - timeRemainingMs) / totalMs) * 100)));
    } else {
      // Stopwatch: progress up to 60m
      return Math.min(100, Math.max(0, Math.round((stopwatchElapsedMs / (60 * 60 * 1000)) * 100)));
    }
  }, [mode, timerType, plannedMinutes, breakMinutes, timeRemainingMs, stopwatchElapsedMs]);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden select-none">
      {/* ── ZEN RELAX VIEW (ZERO DIGITS BY DEFAULT, 60FPS PARALLAX, DUO-STYLE CLOCK CHIP & AMBIENCE) ── */}
      {isRelaxViewActive ? (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden select-none">
          {/* Endless highway background towards distant mountains & valleys */}
          <div className="absolute inset-0 z-0">
            <EndlessHighwayLandscape 
              isDriving={isRunning && !isPaused} 
              progressPercent={rideProgressPercent}
              playbackRate={sceneryPace}
            />
          </div>

          {/* Minimalist Top Control Bar */}
          <div className="relative z-30 w-full max-w-4xl mx-auto px-4 pt-4 sm:pt-6 flex items-center justify-between gap-2">
            <button
              onClick={handleExitRelaxView}
              className="px-3.5 py-2 min-h-[44px] rounded-2xl bg-slate-950/85 hover:bg-slate-900 active:scale-95 backdrop-blur-md text-xs font-bold text-white border border-slate-700/80 flex items-center gap-2 cursor-pointer shadow-xl transition-all"
              aria-label="Exit relax view"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Exit relax</span>
            </button>

            {/* Digits hidden by default with visible toggle */}
            {showClockChip ? (
              <button
                onClick={handleToggleClockChip}
                aria-label="Hide clock"
                className="px-3.5 py-2 min-h-[44px] rounded-full bg-slate-950/90 hover:bg-slate-900 active:scale-95 backdrop-blur-md text-xs font-mono font-bold text-white border border-indigo-500/50 flex items-center gap-1.5 cursor-pointer shadow-xl transition-all"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{mode === 'pomodoro' ? formatTime(timeRemainingMs) : formatStopwatch(stopwatchElapsedMs)}</span>
              </button>
            ) : (
              <button
                onClick={handleToggleClockChip}
                aria-label="Show time"
                className="px-3.5 py-2 min-h-[44px] rounded-2xl bg-slate-950/85 hover:bg-slate-900 active:scale-95 backdrop-blur-md text-xs font-bold text-slate-300 border border-slate-700/80 flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Show time</span>
              </button>
            )}
          </div>

          {/* Bottom Floating Action Dock (2 rows to prevent cutting chips, 48dp controls, above gesture bar) */}
          <div className="relative z-30 w-full max-w-lg mx-auto pb-8 sm:pb-8 px-4 flex flex-col items-center gap-3">
            {/* Ambience & Speed Toolbar (2 Rows: Sound Chips on Row 1, Speed Chips on Row 2) */}
            <div className="w-full flex flex-col gap-2 p-2 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800/90 shadow-2xl">
              {/* Row 1: Ambient Sounds (Disabled with "Coming soon") */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-slate-400 pl-1">Sound:</span>
                <div className="flex items-center gap-1">
                  {[
                    { id: 'off', label: 'Off' },
                    { id: 'rain', label: 'Rain' },
                    { id: 'wind', label: 'Wind' },
                    { id: 'engine', label: 'Engine' },
                  ].map(s => (
                    <button
                      key={s.id}
                      disabled
                      title="Audio coming soon"
                      aria-label={`${s.label} - Coming soon`}
                      className="px-2.5 py-1.5 min-h-[36px] rounded-xl text-[11px] font-bold bg-slate-900/60 text-slate-500 border border-slate-800/60 cursor-not-allowed opacity-60"
                    >
                      {s.label}
                    </button>
                  ))}
                  <span className="text-[10px] text-slate-500 font-medium pl-1">Coming soon</span>
                </div>
              </div>

              {/* Row 2: Highway Pace Selector (0.8x, 1.0x, 1.25x - clearly visible without horizontal cut) */}
              <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-800/60">
                <span className="text-[11px] font-bold text-slate-400 pl-1">Speed:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { rate: 0.8, label: '0.8x' },
                    { rate: 1.0, label: '1.0x' },
                    { rate: 1.25, label: '1.25x' }
                  ].map(({ rate, label }) => (
                    <button
                      key={rate}
                      onClick={() => handleSelectPace(rate)}
                      className={`px-3 py-1.5 min-h-[36px] min-w-[48px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        sceneryPace === rate
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tactile Primary Action Buttons (Start / Pause / Resume / End - 48dp min touch targets) */}
            <div className="w-full flex items-center justify-center gap-3">
              {!isRunning ? (
                <TactileButton
                  variant="primary"
                  size="lg"
                  onClick={handleStartTimer}
                  icon={<Play className="w-5 h-5 fill-current" />}
                  className="w-full max-w-xs shadow-2xl text-sm font-bold min-h-[48px]"
                >
                  Start focus ride
                </TactileButton>
              ) : (
                <>
                  {isPaused ? (
                    <TactileButton
                      variant="primary"
                      size="md"
                      onClick={handleResumeTimer}
                      icon={<Play className="w-4 h-4 fill-current" />}
                      className="flex-1 shadow-lg font-bold min-h-[48px]"
                    >
                      Resume ride
                    </TactileButton>
                  ) : (
                    <TactileButton
                      variant="secondary"
                      size="md"
                      onClick={handlePauseTimer}
                      icon={<Pause className="w-4 h-4" />}
                      className="flex-1 shadow-lg font-bold min-h-[48px]"
                    >
                      Pause ride
                    </TactileButton>
                  )}
                  <TactileButton
                    variant="ghost"
                    size="md"
                    onClick={() => setShowExitConfirmModal(true)}
                    className="flex-1 border border-slate-700/80 bg-slate-900/80 hover:bg-rose-950/50 hover:text-rose-400 font-bold min-h-[48px]"
                  >
                    End ride
                  </TactileButton>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>

      {/* ── TOP CONTROL BAR (1 ROW AT 360PX WITHOUT SCROLL) ── */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 pt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={() => {
                if (isRunning) {
                  setShowExitConfirmModal(true);
                } else {
                  onBack();
                }
              }}
              aria-label="Back"
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center justify-center transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-base sm:text-lg font-bold text-white truncate">
            Focus ride
          </h1>
        </div>

        {/* Action Icon Buttons: Relax, Rides, Garage (48dp touch targets, fits 1 row at 360) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Relax View Toggle */}
          <button
            onClick={() => {
              soundFx.playTap();
              setIsRelaxViewActive(true);
            }}
            aria-label="Relax scenery"
            title="Relax scenery"
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Eye className="w-5 h-5 text-emerald-400" />
          </button>

          {/* My Rides Navigation */}
          {onNavigateToMyRides && (
            <button
              onClick={onNavigateToMyRides}
              aria-label="My rides"
              title="My rides"
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 border border-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <BarChart2 className="w-5 h-5 text-indigo-400" />
            </button>
          )}

          {/* Garage Navigation */}
          {handleOpenGarage && (
            <button
              onClick={handleOpenGarage}
              aria-label="Garage"
              title="Garage"
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Wrench className="w-5 h-5 text-amber-400" />
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN TIMER CONTAINER ── */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 my-auto py-6 flex flex-col items-center text-center space-y-6">
        {/* Rider / Veer Coach Nudge */}
        <div className="w-full p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md flex items-center gap-3.5 text-left">
          <div className="shrink-0 relative">
            <VeerMascot 
              state={isRunning && !isPaused ? 'cheering' : 'idle'} 
              size="sm" 
              showClickTip={false} 
              showSpeechBubble={false} 
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--sr-amber)] animate-pulse" />
              <span className="text-xs font-bold text-[var(--sr-amber)]">
                Veer coach
              </span>
            </div>
            <p className="text-xs font-medium text-slate-200 mt-0.5 leading-snug">
              {bikeState.activeNudge.message}
            </p>
          </div>
        </div>

        {/* Mode Selector (Pomodoro vs Stopwatch) */}
        {!isRunning && (
          <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <button
              onClick={() => { setMode('pomodoro'); setTimerType('focus'); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'pomodoro' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => { setMode('stopwatch'); setTimerType('focus'); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'stopwatch' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Highway stopwatch
            </button>
          </div>
        )}

        {/* Presets (when Pomodoro is idle) */}
        {!isRunning && mode === 'pomodoro' && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setTimerType('focus')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  timerType === 'focus' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400'
                }`}
              >
                Focus Block {blockIndex}/4
              </button>
              <button
                onClick={() => setTimerType('break')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  timerType === 'break' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400'
                }`}
              >
                Rest Break
              </button>
            </div>

            <div className="flex items-center justify-center gap-2">
              {timerType === 'focus' ? (
                [25, 30, 40, 50].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setPlannedMinutes(mins);
                      setTimeRemainingMs(mins * 60 * 1000);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      plannedMinutes === mins
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md scale-105'
                        : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                    }`}
                  >
                    {mins}m
                  </button>
                ))
              ) : (
                [5, 10, 15, 20].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setBreakMinutes(mins);
                      setTimeRemainingMs(mins * 60 * 1000);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      breakMinutes === mins
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md scale-105'
                        : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                    }`}
                  >
                    {mins}m
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── GIANT DIGIT DISPLAY (900 ALLOWED FOR DIGITS ONLY) ── */}
        <div className="relative py-4 flex flex-col items-center justify-center">
          <div className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tight text-white font-mono drop-shadow-2xl">
            {mode === 'pomodoro' ? formatTime(timeRemainingMs) : formatStopwatch(stopwatchElapsedMs)}
          </div>
          <span className="text-xs font-bold text-slate-400 mt-2">
            {timerType === 'focus' ? (mode === 'pomodoro' ? 'Deep highway focus' : 'Open road stopwatch') : 'Recharge break'}
          </span>
        </div>

        {/* ── TIMER CONTROLS ── */}
        <div className="flex items-center justify-center gap-4 pt-2">
          {!isRunning ? (
            <TactileButton
              variant="primary"
              size="lg"
              onClick={handleStartTimer}
              icon={<Play className="w-5 h-5 fill-current" />}
            >
              Start focus ride
            </TactileButton>
          ) : (
            <>
              {isPaused ? (
                <TactileButton
                  variant="primary"
                  size="md"
                  onClick={handleResumeTimer}
                  icon={<Play className="w-4 h-4 fill-current" />}
                >
                  Resume ride
                </TactileButton>
              ) : (
                <TactileButton
                  variant="secondary"
                  size="md"
                  onClick={handlePauseTimer}
                  icon={<Pause className="w-4 h-4" />}
                >
                  Pause ride
                </TactileButton>
              )}

              <TactileButton
                variant="ghost"
                size="md"
                onClick={() => setShowExitConfirmModal(true)}
              >
                End ride
              </TactileButton>
            </>
          )}
        </div>

        {/* Weekly Target Suggestion Chip */}
        {!bikeState.weeklyTargetHours && (
          <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span className="font-bold text-amber-400">Target unset: </span>
              <span>Suggested: {suggestion.suggestedHours}h/week ({suggestion.formulaDescription})</span>
            </div>
            <button
              onClick={() => handleSaveWeeklyTarget(suggestion.suggestedHours)}
              className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
            >
              Apply suggestion
            </button>
          </div>
        )}
      </div>

      {/* ── BOTTOM BIKE BUILDER STRIP ── */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 pb-4">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {bikeState.currentTier.name} • {bikeState.progressPercent}% built
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {bikeState.unlockedParts.length} / 8 parts installed • Week {bikeState.currentWeekNumber} of 12
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenGarage}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 transition-colors cursor-pointer"
          >
            View assembly →
          </button>
        </div>
      </div>
    </>
  )}

      {/* ── MODAL: EXIT / ABANDON CONFIRMATION ── */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 mx-auto flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Leave session?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ending early saves this session as abandoned and will not count towards your bike build.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <TactileButton
                variant="secondary"
                size="md"
                onClick={() => setShowExitConfirmModal(false)}
              >
                Stay in ride
              </TactileButton>
              <TactileButton
                variant="danger"
                size="md"
                onClick={handleAbandonSession}
              >
                End session
              </TactileButton>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: BACKGROUND FINISH RECOVERY (ASK ONCE) ── */}
      {pendingAwaySession && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Session finished while away
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your planned focus ride ({pendingAwaySession.plannedMinutes || 25} minutes) completed while the app was in the background. Count it towards your weekly target?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <TactileButton
                variant="secondary"
                size="md"
                onClick={() => {
                  setPendingAwaySession(null);
                }}
              >
                Discard
              </TactileButton>
              <TactileButton
                variant="primary"
                size="md"
                onClick={() => {
                  recordSession(userId, pendingAwaySession);
                  setPendingAwaySession(null);
                  soundFx.playSuccess();
                  triggerConfetti({ particleCount: 50, spread: 70 });
                }}
              >
                Count it!
              </TactileButton>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: NORMAL SESSION COMPLETE WITH RIDER CELEBRATION (RULE F) ── */}
      {completedSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-indigo-500/40 p-6 space-y-4 shadow-2xl text-center flex flex-col items-center">
            {/* Rider Character Card (Initial 'R') */}
            <RiderAssetSlot pose="rider_celebrate" size="sm" />

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-400">
                Focus milestone achieved
              </span>
              <h3 className="text-lg font-bold text-white">
                Ride completed!
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Great highway pace! {Math.round((completedSessionModal.actualSeconds || 0) / 60)} minutes recorded towards your weekly bike build progression.
              </p>
            </div>

            <div className="w-full pt-2">
              <TactileButton
                variant="primary"
                size="md"
                onClick={() => setCompletedSessionModal(null)}
                className="w-full"
              >
                Keep riding
              </TactileButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
