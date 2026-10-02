import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Square, RotateCcw, Flame, Sparkles, BookOpen } from 'lucide-react';
import { PlanetarySystem, PlanetType } from './PlanetarySystem';

export interface FocusStopwatchViewProps {
  userId?: string;
  level?: number;
  streakDays?: number;
  category?: PlanetType;
  seed?: number;
  accentColor?: string;
  // Controlled timer state
  timerMode?: 'stopwatch' | 'pomodoro';
  formattedTime: string;
  secondsElapsed: number;
  progressPercent: number;
  isActive: boolean;
  isPaused: boolean;
  subject?: string;
  topic?: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onReset: () => void;
  // Optional backdrop config
  show3DBackdrop?: boolean;
}

/**
 * Universal Responsive Focus Stopwatch View
 * Features:
 * 1. 3D Galaxy as full-screen background layer (pointer-events-auto for interactive rotation)
 * 2. Floating foreground stopwatch HUD (pointer-events-none with pointer-events-auto on interactive dock)
 * 3. Auto-scaling circular SVG progress ring (clamp(180px, 50vw, 240px))
 * 4. Fluid typography via clamp() (Stopwatch digits, headers, tags)
 * 5. Compact 44px min-touch-target floating action dock
 */
export const FocusStopwatchView: React.FC<FocusStopwatchViewProps> = ({
  level = 1,
  streakDays = 1,
  category = 'rocky',
  seed = 42,
  accentColor = '#38bdf8',
  timerMode = 'pomodoro',
  formattedTime,
  secondsElapsed,
  progressPercent,
  isActive,
  isPaused,
  subject = 'General Studies',
  topic = 'Deep Sprint',
  onStart,
  onPause,
  onResume,
  onFinish,
  onReset,
  show3DBackdrop = true,
}) => {
  // SVG Circular Ring Math (radius = 44, circumference = 2 * PI * 44 ≈ 276.46)
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = useMemo(() => {
    const clamped = Math.min(100, Math.max(0, progressPercent));
    return circumference - (clamped / 100) * circumference;
  }, [circumference, progressPercent]);

  return (
    <div className="relative w-full h-full min-h-0 flex-1 overflow-hidden select-none flex flex-col justify-between items-center">
      {/* ══════════════════════════════════════════════════════════════════
          1. 3D GALAXY AS FULL-SCREEN BACKGROUND LAYER (SWIPEABLE)
      ══════════════════════════════════════════════════════════════════ */}
      {show3DBackdrop && (
        <div 
          className="absolute inset-0 z-0 pointer-events-auto opacity-75 sm:opacity-85 overflow-hidden flex items-center justify-center"
          aria-hidden="true"
        >
          <PlanetarySystem
            level={level}
            streakDays={streakDays}
            type={category}
            seed={seed}
            autoRotate={true}
            allowIdleRotation={true}
            targetFps={60}
            showStarfield={true}
            className="w-full h-full pointer-events-auto"
          />
          {/* Subtle cosmic vignette so time digits stay razor sharp */}
          <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_30%,rgba(2,4,8,0.75)_80%] pointer-events-none" />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          2. FLOATING STOPWATCH FOREGROUND LAYER (PASS-THROUGH TOUCHES)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full h-full min-h-0 flex-1 flex flex-col justify-between items-center pointer-events-none py-1 sm:py-2 px-3">
        {/* Top Context Pill (Subject / Topic) */}
        <div className="flex-shrink-0 pt-1 pointer-events-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 border border-slate-800/80 backdrop-blur-md text-slate-300 text-[10px] sm:text-xs font-medium shadow-lg max-w-[280px] sm:max-w-xs truncate">
            <BookOpen className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="truncate">{subject}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 truncate">{topic}</span>
          </div>
        </div>

        {/* Center Circular Progress Ring & High-Contrast Digits */}
        <div className="flex-1 min-h-0 flex items-center justify-center w-full my-auto">
          <div className="relative w-[clamp(180px,50vw,240px)] h-[clamp(180px,50vw,240px)] flex items-center justify-center">
            {/* Ambient Radial Aura Glow */}
            <div 
              className="absolute inset-2 rounded-full blur-2xl opacity-35 transition-all duration-700 pointer-events-none"
              style={{
                backgroundColor: isActive && !isPaused ? accentColor : 'rgba(56, 189, 248, 0.2)'
              }}
            />

            {/* Auto-scaling SVG Progress Track */}
            <svg 
              className="w-full h-full -rotate-90 pointer-events-none drop-shadow-md"
              viewBox="0 0 100 100"
            >
              {/* Dimmed Background Orbit Track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-800/80"
                strokeWidth="4.5"
                fill="transparent"
              />
              {/* Dynamic Gradient / Progress Arc */}
              <motion.circle
                cx="50"
                cy="50"
                r={radius}
                stroke={accentColor}
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            </svg>

            {/* Dead-Center Digits & Telemetry HUD (High Contrast) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none px-2">
              {/* Status Indicator Tag */}
              <div className="mb-1 pointer-events-auto">
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs py-0.5 px-2.5 rounded-full font-mono uppercase tracking-wider backdrop-blur-md border border-slate-800/80 bg-slate-950/70 text-slate-300 shadow-sm">
                  <span 
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive && !isPaused 
                        ? 'bg-emerald-400 animate-pulse' 
                        : isPaused 
                          ? 'bg-amber-400' 
                          : 'bg-slate-500'
                    }`} 
                  />
                  <span>
                    {isActive 
                      ? (isPaused ? 'Paused' : 'Accreting') 
                      : (timerMode === 'pomodoro' ? 'Ready (25m)' : 'Ready')}
                  </span>
                </span>
              </div>

              {/* Giant Fluid Digital Digits */}
              <span className="text-[clamp(2rem,8vw,3.25rem)] font-mono font-bold leading-none tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                {formattedTime}
              </span>

              {/* Accretion / Mode Metric */}
              <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[clamp(0.7rem,2.8vw,0.85rem)] font-mono text-slate-400">
                <Flame className="w-3 h-3 text-amber-400 fill-current" />
                <span>{progressPercent}% Complete</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            3. ACTION DOCK (COMPACT FLOATING PILL, 44PX TOUCH TARGET)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="flex-shrink-0 z-20 pointer-events-auto pb-1">
          <div className="p-1 rounded-full bg-slate-950/90 border border-slate-800/90 backdrop-blur-2xl shadow-2xl flex items-center gap-1.5">
            {!isActive ? (
              <button
                onClick={onStart}
                className="h-[44px] min-h-[44px] px-6 py-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-sky-500/30 cursor-pointer active:scale-95 transition-all"
                title="Start Focus Session"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Launch</span>
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    onClick={onResume}
                    className="h-[44px] min-h-[44px] px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 transition-all"
                    title="Resume Session"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    onClick={onPause}
                    className="h-[44px] min-h-[44px] px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/25 cursor-pointer active:scale-95 transition-all"
                    title="Pause Session"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={onFinish}
                  className="h-[44px] min-h-[44px] px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-rose-500/25 cursor-pointer active:scale-95 transition-all"
                  title="Finish and log study time"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Claim</span>
                </button>
              </>
            )}

            <button
              onClick={onReset}
              className="h-[44px] w-[44px] min-h-[44px] min-w-[44px] rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all"
              title="Reset Timer"
              aria-label="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusStopwatchView;
