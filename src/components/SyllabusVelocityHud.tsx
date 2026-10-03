import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Clock, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Sliders, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  Calendar,
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';
import { ForecastResult, WhatIfConfig } from '../lib/forecast/types';

import { ExamType } from '../types';
import { EXAM_LIST } from '../lib/examList';

interface SyllabusVelocityHudProps {
  forecast: ForecastResult;
  whatIfConfig: WhatIfConfig;
  onUpdateWhatIf: (updater: (prev: WhatIfConfig) => WhatIfConfig) => void;
  defaultDailyHours: number;
  examDateStr?: string;
  selectedExam: ExamType;
  setSelectedExam: (exam: ExamType) => void;
  examName: string;
  onOpenSimulatorDrawer: () => void;
  isSimulatorOpen: boolean;
  onOpenTargetDrawer: () => void;
  isTargetOpen: boolean;
  onOpenTimerDrawer: () => void;
  isTimerRunning: boolean;
  timerSeconds: number;
  onOpenAddCustomTopic: () => void;
}

function formatNiceDate(isoDateStr: string): string {
  if (!isoDateStr) return 'TBD';
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return isoDateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return isoDateStr;
  }
}

/**
 * Smooth Number Counter with Up/Down delta detection and animation
 */
const SmoothNumberCounter: React.FC<{
  value: number;
  unit?: string;
  className?: string;
}> = ({ value, unit = '', className = '' }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [direction, setDirection] = useState<'up' | 'down' | 'same'>('same');
  const prevValueRef = useRef(value);

  useEffect(() => {
    const prev = prevValueRef.current;
    if (prev === value) return;

    if (value > prev) {
      setDirection('up');
    } else if (value < prev) {
      setDirection('down');
    }
    prevValueRef.current = value;

    const start = displayValue;
    const end = value;
    const duration = 500;
    const startTime = performance.now();

    let frameId: number;
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (end - start) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(end);
        setTimeout(() => setDirection('same'), 1200);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return (
    <span className={`inline-flex items-baseline gap-1 relative ${className}`}>
      <span>{displayValue.toLocaleString()}</span>
      {unit && <span className="text-xs font-normal opacity-70 ml-0.5">{unit}</span>}
      {direction !== 'same' && (
        <motion.span
          initial={{ opacity: 0, y: direction === 'down' ? -4 : 4, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute -top-3.5 right-0 text-[10px] font-black px-1 py-0.2 rounded ${
            direction === 'down' ? 'text-emerald-400 bg-emerald-950/80' : 'text-rose-400 bg-rose-950/80'
          }`}
        >
          {direction === 'down' ? '↓ speeding' : '↑ slower'}
        </motion.span>
      )}
    </span>
  );
};

export const SyllabusVelocityHud: React.FC<SyllabusVelocityHudProps> = ({
  forecast,
  whatIfConfig,
  onUpdateWhatIf,
  defaultDailyHours,
  examDateStr = '2027-01-24',
  selectedExam,
  setSelectedExam,
  examName,
  onOpenSimulatorDrawer,
  isSimulatorOpen,
  onOpenTargetDrawer,
  isTargetOpen,
  onOpenTimerDrawer,
  isTimerRunning,
  timerSeconds,
  onOpenAddCustomTopic
}) => {
  const [hudViewMode, setHudViewMode] = useState<'radar' | 'analytics'>('radar');

  // Baseline effective pace & current simulated pace
  const basePace = defaultDailyHours || 5.5;
  const simulatedPace = Math.max(1.0, Math.round((basePace + whatIfConfig.dailyHourDelta) * 10) / 10);
  const paceRatio = Math.round((simulatedPace / basePace) * 100) / 100;

  // Calculate days remaining until realistic completion
  const realisticDateObj = new Date(forecast.realisticDate);
  const nowObj = new Date();
  const daysUntilRealistic = !isNaN(realisticDateObj.getTime())
    ? Math.max(0, Math.ceil((realisticDateObj.getTime() - nowObj.getTime()) / (1000 * 60 * 60 * 24)))
    : 120;

  // Baseline days without whatIf adjustment
  const baselineDays = Math.max(1, Math.round(daysUntilRealistic * (simulatedPace / basePace)));
  const daysSavedOrDelayed = baselineDays - daysUntilRealistic;

  // Speedometer needle angle: maps 0h -> -90deg, 6h -> 0deg, 12h -> +90deg
  const needleAngle = useMemo(() => {
    const clampedHours = Math.min(Math.max(simulatedPace, 0), 12);
    return (clampedHours / 12) * 180 - 90;
  }, [simulatedPace]);

  // Speed state metadata
  const speedTier = useMemo(() => {
    if (simulatedPace < 3.5) {
      return {
        label: '🐢 Sluggish Pace',
        desc: 'Delay Risk • Buffer Shrinking',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        glowColor: 'from-rose-500/20 to-amber-500/10',
        speedometerColor: '#f43f5e'
      };
    } else if (simulatedPace <= 6.5) {
      return {
        label: '🚶 Steady Standard',
        desc: 'Sustainable • On Schedule',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        glowColor: 'from-emerald-500/20 to-teal-500/10',
        speedometerColor: '#10b981'
      };
    } else if (simulatedPace <= 9.0) {
      return {
        label: '⚡ Turbo Sprint',
        desc: 'Accelerating • Days Saving Fast',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        glowColor: 'from-cyan-500/25 to-blue-500/15',
        speedometerColor: '#06b6d4'
      };
    } else {
      return {
        label: '🚀 Godspeed Velocity',
        desc: 'Maximum Warp • Extreme Finish',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        glowColor: 'from-purple-500/30 to-indigo-500/20',
        speedometerColor: '#a855f7'
      };
    }
  }, [simulatedPace]);

  // Smart Contextual Alert ("Waqt aane par alert show kare")
  const contextualAlert = useMemo(() => {
    if (forecast.revisionBufferDays < 10) {
      return {
        type: 'danger' as const,
        icon: AlertTriangle,
        title: 'Tight Revision Buffer Alert',
        message: `Only ${forecast.revisionBufferDays} days buffer remain before the target exam. Daily pace badhakar +1.5h karein taaki mock tests ka time bache.`,
        actionLabel: 'Boost to Turbo (+2h)',
        actionDelta: 2.0
      };
    }
    if (whatIfConfig.dailyHourDelta > 2.0) {
      return {
        type: 'success' as const,
        icon: Zap,
        title: 'Accelerated Sprint Active!',
        message: `Aap ${simulatedPace}h/day speed par hain. Realistic finish date ${formatNiceDate(forecast.realisticDate)} tak pohoch rahi hai!`,
        actionLabel: 'Maintain Pace',
        actionDelta: null
      };
    }
    if (forecast.confidenceLevel === 'High') {
      return {
        type: 'info' as const,
        icon: CheckCircle2,
        title: 'High Empirical Confidence',
        message: `Consistent study logs ke aadhar par realistic target date mathematically stable hai (${forecast.revisionBufferDays} days revision cushion).`,
        actionLabel: null,
        actionDelta: null
      };
    }
    return {
      type: 'neutral' as const,
      icon: Sparkles,
      title: 'Dynamic Pace Balancing',
      message: `Daily productive study hours adjust karke dekhiye ki syllabus completion kitne din pehle complete ho sakta hai.`,
      actionLabel: null,
      actionDelta: null
    };
  }, [forecast, whatIfConfig, simulatedPace]);

  return (
    <div className="rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl p-5 sm:p-7 relative overflow-hidden backdrop-blur-xl">
      {/* ── BACKGROUND AMBIENT COSMOS (SUBTLE LIVING ENGINE) ── */}
      <motion.div 
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.12, 0.22, 0.12],
          x: [0, 20, 0],
          y: [0, -15, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1.1, 0.95, 1.1],
          opacity: [0.10, 0.18, 0.10],
          x: [0, -25, 0],
          y: [0, 20, 0]
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-20 -left-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" 
      />

      {/* ── TOP HEADER: EXAM TITLE, TARGET EXAM DROPDOWN & VIEW MODES ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Dynamic Velocity & Forecast Engine
            </span>
            <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${speedTier.badgeColor}`}>
              {speedTier.label} ({paceRatio}x Speed)
            </span>
            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-900 text-slate-300 border border-slate-800">
              Confidence: <strong className="text-emerald-400">{forecast.confidenceLevel}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{examName}</span>
              <span className="text-sky-400 text-lg font-bold">Preparation Hub</span>
            </h1>

            {/* Exam Selector Dropdown */}
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value as ExamType)}
              className="bg-slate-900 hover:bg-slate-850 border border-slate-700 text-sky-300 text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer transition shadow-sm"
              title="Switch target exam"
            >
              {EXAM_LIST.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.label}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Live velocity speedometer animates completion dates & workload dynamically as study speed speeds up or slows down.
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* Add Custom Syllabus Button (Apne hisaab se syllabus add karein) */}
          <button
            onClick={onOpenAddCustomTopic}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-600/20"
            title="Add your own custom subject or chapter to syllabus"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>+ Add My Syllabus</span>
          </button>

          {/* Quick HUD View Mode Toggle */}
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setHudViewMode('radar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                hudViewMode === 'radar'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏎️ Velocity Radar
            </button>
            <button
              onClick={() => setHudViewMode('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                hudViewMode === 'analytics'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔬 Deep Analytics
            </button>
          </div>

          {/* Tool Drawer Buttons */}
          <button
            onClick={onOpenSimulatorDrawer}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isSimulatorOpen
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>What-If</span>
          </button>

          <button
            onClick={onOpenTargetDrawer}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isTargetOpen
                ? 'bg-indigo-600 text-white font-black'
                : 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Target</span>
          </button>

          {/* Stopwatch Focus Timer */}
          <button
            onClick={onOpenTimerDrawer}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isTimerRunning
                ? 'bg-emerald-500 text-slate-950 font-black animate-pulse'
                : 'bg-slate-900 hover:bg-slate-850 text-emerald-400 border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isTimerRunning ? `${Math.floor(timerSeconds / 60)}m Focus` : 'Study Timer'}</span>
          </button>
        </div>
      </div>

      {/* ── CONTEXTUAL ALERT / MILESTONE NOTICE (WAQT AANE PAR SHOW KARE) ── */}
      <AnimatePresence>
        {contextualAlert && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mt-4 p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10 ${
              contextualAlert.type === 'danger'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                : contextualAlert.type === 'success'
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200'
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5">
              <contextualAlert.icon className={`w-4 h-4 shrink-0 mt-0.5 sm:mt-0 ${
                contextualAlert.type === 'danger' ? 'text-rose-400' : 'text-cyan-400'
              }`} />
              <div>
                <strong className="block sm:inline mr-2 text-white font-bold">{contextualAlert.title}:</strong>
                <span className="text-slate-300">{contextualAlert.message}</span>
              </div>
            </div>

            {contextualAlert.actionDelta !== null && (
              <button
                onClick={() => onUpdateWhatIf(prev => ({ ...prev, dailyHourDelta: contextualAlert.actionDelta! }))}
                className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shrink-0 cursor-pointer transition border border-white/20"
              >
                {contextualAlert.actionLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN INTERACTIVE VELOCITY RADAR (SPEEDOMETER & DAYS ANIMATION) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5 relative z-10">
        {/* Left: Speedometer Gauge & Live Velocity Dial (4 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between relative overflow-hidden shadow-xl">
          {/* Subtle Speedometer Glow */}
          <div 
            className="absolute inset-0 opacity-15 blur-2xl pointer-events-none transition-colors duration-500" 
            style={{ backgroundColor: speedTier.speedometerColor }} 
          />

          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2 relative z-10">
            <span className="font-bold flex items-center gap-1.5 text-white">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Study Velocity Gauge</span>
            </span>
            <span className="font-mono text-[11px] text-slate-300">
              {simulatedPace} h/day ({paceRatio}x)
            </span>
          </div>

          {/* SVG Speedometer Semi-Circle */}
          <div className="relative w-56 h-32 flex items-end justify-center my-2">
            <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="speedGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="40%" stopColor="#10b981" />
                  <stop offset="70%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>

              {/* Background Track */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#1e293b"
                strokeWidth="14"
                strokeLinecap="round"
              />

              {/* Colored Gauge Path */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#speedGaugeGrad)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="251"
                strokeDashoffset={251 - (251 * Math.min(simulatedPace / 12, 1))}
                className="transition-all duration-500 ease-out"
              />

              {/* Needle */}
              <g 
                style={{
                  transform: `rotate(${needleAngle}deg)`,
                  transformOrigin: '100px 100px',
                  transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                <polygon points="98,100 102,100 100,28" fill="#ffffff" filter="drop-shadow(0 0 4px rgba(255,255,255,0.8))" />
                <circle cx="100" cy="100" r="7" fill="#38bdf8" />
                <circle cx="100" cy="100" r="3" fill="#0f172a" />
              </g>
            </svg>

            {/* Needle Center readout */}
            <div className="absolute bottom-0 text-center">
              <div className="text-2xl font-black text-white tracking-tight">
                {simulatedPace}
                <span className="text-xs font-normal text-slate-400 ml-1">h/day</span>
              </div>
            </div>
          </div>

          {/* Speed Status Description */}
          <div className="text-center mt-1 relative z-10">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${speedTier.badgeColor}`}>
              {speedTier.label}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              {speedTier.desc}
            </p>
          </div>

          {/* 4 Quick Pace Presets Buttons */}
          <div className="grid grid-cols-4 gap-1.5 w-full mt-4 pt-3 border-t border-slate-800 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => onUpdateWhatIf(prev => ({ ...prev, dailyHourDelta: -2.5 }))}
              className={`py-1.5 px-1 rounded-xl transition cursor-pointer text-center ${
                whatIfConfig.dailyHourDelta <= -2
                  ? 'bg-rose-500 text-slate-950 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Simulate slow recovery or exam slump"
            >
              🐢 Slump
            </button>
            <button
              type="button"
              onClick={() => onUpdateWhatIf(prev => ({ ...prev, dailyHourDelta: 0 }))}
              className={`py-1.5 px-1 rounded-xl transition cursor-pointer text-center ${
                whatIfConfig.dailyHourDelta === 0
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Reset to baseline daily productive hours"
            >
              🚶 Steady
            </button>
            <button
              type="button"
              onClick={() => onUpdateWhatIf(prev => ({ ...prev, dailyHourDelta: 2.5 }))}
              className={`py-1.5 px-1 rounded-xl transition cursor-pointer text-center ${
                whatIfConfig.dailyHourDelta >= 2 && whatIfConfig.dailyHourDelta < 4
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Turbo sprint: +2.5 hours per day"
            >
              ⚡ Turbo
            </button>
            <button
              type="button"
              onClick={() => onUpdateWhatIf(prev => ({ ...prev, dailyHourDelta: 5 }))}
              className={`py-1.5 px-1 rounded-xl transition cursor-pointer text-center ${
                whatIfConfig.dailyHourDelta >= 4
                  ? 'bg-purple-500 text-white font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Godspeed sprint: +5 hours per day"
            >
              🚀 Warp
            </button>
          </div>
        </div>

        {/* Right: Dynamic Countdown Counters & Interactive Slider (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Main 2 Highlight Cards: Days Needed & Projected Finish */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Days Remaining (Animated Number) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-indigo-950/50 to-slate-950 border border-indigo-500/30 relative overflow-hidden group">
              <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold mb-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>DAYS TO FINISH</span>
                </span>
                <span className="text-[11px] text-indigo-400/80 font-mono">Dynamic</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-baseline gap-2">
                <SmoothNumberCounter value={daysUntilRealistic} unit="days" />
              </div>
              <p className="text-xs text-slate-300 mt-2 flex items-center gap-1">
                {daysSavedOrDelayed > 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>⚡ {daysSavedOrDelayed} days saved with this pace!</span>
                  </span>
                ) : daysSavedOrDelayed < 0 ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>⚠️ {Math.abs(daysSavedOrDelayed)} days delay risk at low speed!</span>
                  </span>
                ) : (
                  <span className="text-slate-400">Baseline pacing on schedule</span>
                )}
              </p>
            </div>

            {/* 2. Projected Finish Date Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-emerald-950/50 to-slate-950 border border-emerald-500/40 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-2">
                <span className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>PROJECTED FINISH</span>
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Target Match
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-200 tracking-tight">
                {formatNiceDate(forecast.realisticDate)}
              </div>
              <p className="text-xs text-slate-300 mt-2">
                Revision Buffer: <strong className="text-white">{forecast.revisionBufferDays} days</strong> ({forecast.mockTestWindowDays}d dedicated mocks)
              </p>
            </div>
          </div>

          {/* Interactive Speed Slider with Live Response */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-white">Live Speed Adjustment Slider</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sky-400 font-mono">
                  {whatIfConfig.dailyHourDelta > 0 ? `+${whatIfConfig.dailyHourDelta}h` : `${whatIfConfig.dailyHourDelta}h`} / day
                </span>
                {whatIfConfig.dailyHourDelta !== 0 && (
                  <button
                    type="button"
                    onClick={() => onUpdateWhatIf(prev => ({ ...prev, dailyHourDelta: 0 }))}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                type="range"
                min="-3.5"
                max="5.5"
                step="0.5"
                value={whatIfConfig.dailyHourDelta}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  onUpdateWhatIf(prev => ({ ...prev, dailyHourDelta: val }));
                }}
                className="w-full accent-sky-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold mt-1">
                <span>-3.5h (Slump / Sickness)</span>
                <span>Normal Pace ({basePace}h)</span>
                <span>+5.5h (Sprint Mode)</span>
              </div>
            </div>

            {/* Quick Math Summary strip */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span>Workload: <strong className="text-white">{forecast.remainingWorkloadHours}h</strong> remaining</span>
              <span>Weekly Pace: <strong className="text-indigo-300">{Math.round(simulatedPace * 7)}h/week</strong></span>
              <button
                onClick={onOpenTargetDrawer}
                className="text-sky-400 hover:underline font-bold cursor-pointer"
              >
                Set Target Date →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXPANDABLE DEEP ANALYTICS (REVEALED WHEN USER SWITCHES TO DEEP VIEW) ── */}
      <AnimatePresence>
        {hudViewMode === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-5 border-t border-slate-800 relative z-10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>3-Scenario Comparative Mathematical Projections</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Plausibility Confidence: <strong className="text-emerald-400">{forecast.confidenceLevel}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
              {/* Fast Scenario */}
              <div className="bg-slate-900/60 border border-indigo-500/30 rounded-xl p-4">
                <div className="flex justify-between font-bold text-indigo-300 mb-1">
                  <span>Fast Scenario</span>
                  <span className="text-[10px]">~115% Pace</span>
                </div>
                <div className="text-xl font-black text-white">
                  {formatNiceDate(forecast.fastDate)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Disciplined upper bound without unrecovered study breaks.
                </p>
              </div>

              {/* Realistic Scenario */}
              <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4">
                <div className="flex justify-between font-bold text-emerald-300 mb-1">
                  <span>Realistic Most-Likely</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Recommended</span>
                </div>
                <div className="text-xl font-black text-emerald-200">
                  {formatNiceDate(forecast.realisticDate)}
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Expected Window: {formatNiceDate(forecast.expectedRangeStart)} – {formatNiceDate(forecast.expectedRangeEnd)}
                </p>
              </div>

              {/* Slow Scenario */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="flex justify-between font-bold text-slate-400 mb-1">
                  <span>Slow Scenario</span>
                  <span className="text-[10px]">~82% Pace</span>
                </div>
                <div className="text-xl font-black text-slate-300">
                  {formatNiceDate(forecast.slowDate)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Disruption-tolerant projection with allowance for unexpected holidays.
                </p>
              </div>
            </div>

            {/* Syllabus vs True Mastery Progress Strip */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                  <span>Syllabus Reading Coverage:</span>
                  <strong className="text-sky-400">{forecast.syllabusCompletionPercentage}%</strong>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-sky-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${forecast.syllabusCompletionPercentage}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                  <span>5-Dimension True Mastery:</span>
                  <strong className="text-emerald-400">{forecast.masteryCoveragePercentage}% Mastered</strong>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${forecast.masteryCoveragePercentage}%` }} 
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
