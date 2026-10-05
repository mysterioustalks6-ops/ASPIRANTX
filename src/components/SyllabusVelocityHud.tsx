import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Target, 
  Calendar, 
  Clock, 
  Sliders, 
  RotateCcw, 
  ChevronDown, 
  Plus, 
  CheckCircle2, 
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap
} from 'lucide-react';
import { ForecastResult, WhatIfConfig } from '../lib/forecast/types';
import { ExamType } from '../types';
import { EXAM_LIST } from '../lib/examList';
import { getDefaultExamDate } from '../lib/packetSyncService';

interface SyllabusVelocityHudProps {
  forecast: ForecastResult;
  whatIfConfig: WhatIfConfig;
  onUpdateWhatIf: (updater: (prev: WhatIfConfig) => WhatIfConfig) => void;
  defaultDailyHours: number;
  examDateStr?: string;
  selectedExam: string;
  setSelectedExam: (exam: string) => void;
  examName: string;
  onOpenSimulatorDrawer: () => void;
  isSimulatorOpen: boolean;
  onOpenTargetDrawer: () => void;
  isTargetOpen: boolean;
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

export const SyllabusVelocityHud: React.FC<SyllabusVelocityHudProps> = ({
  forecast,
  whatIfConfig,
  onUpdateWhatIf,
  defaultDailyHours,
  examDateStr,
  selectedExam,
  setSelectedExam,
  examName,
  onOpenAddCustomTopic
}) => {
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);

  // Baseline effective pace & current simulated pace
  const basePace = defaultDailyHours || 5.5;
  const simulatedPace = Math.max(1.0, Math.round((basePace + whatIfConfig.dailyHourDelta) * 10) / 10);

  // Days remaining calculation
  // Unified Exam Date: canonical days to exam
  const examDate = examDateStr || getDefaultExamDate(selectedExam);
  const examDateObj = new Date(examDate);
  const nowObj = new Date();
  const daysUntilExam = !isNaN(examDateObj.getTime())
    ? Math.max(1, Math.ceil((examDateObj.getTime() - nowObj.getTime()) / (1000 * 60 * 60 * 24)))
    : 210;

  // Days until syllabus completion at current pace
  const realisticDateObj = new Date(forecast.realisticDate);
  const daysUntilSyllabusFinish = !isNaN(realisticDateObj.getTime())
    ? Math.max(0, Math.ceil((realisticDateObj.getTime() - nowObj.getTime()) / (1000 * 60 * 60 * 24)))
    : 44;

  const baselineDays = Math.max(1, Math.round(daysUntilSyllabusFinish * (simulatedPace / basePace)));
  const daysSavedOrDelayed = baselineDays - daysUntilSyllabusFinish;

  // Compact Speed State
  const speedBadge = useMemo(() => {
    if (simulatedPace < 3.5) {
      return {
        label: 'Sluggish Pace',
        color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-400'
      };
    } else if (simulatedPace <= 6.5) {
      return {
        label: 'Steady Standard',
        color: 'bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] border-[var(--sr-primary)]/30',
        dot: 'bg-[var(--sr-primary)]'
      };
    } else if (simulatedPace <= 9.0) {
      return {
        label: 'Turbo Sprint',
        color: 'bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] border-[var(--sr-blue)]/30',
        dot: 'bg-[var(--sr-blue)]'
      };
    } else {
      return {
        label: 'Maximum Pace',
        color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        dot: 'bg-purple-400'
      };
    }
  }, [simulatedPace]);

  const completionPct = Math.min(100, Math.max(0, forecast.syllabusCompletionPercentage || 0));

  return (
    <div className="rounded-2xl bg-[var(--sr-surface)] border border-[var(--sr-line-strong)] p-4 sm:p-5 shadow-lg relative overflow-hidden transition-all text-[var(--sr-text)]">
      {/* ── TOP HEADER ROW: EXAM SELECTOR + STATUS BADGE + TOOLS TOGGLE ── */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-[var(--sr-primary-subtle)] border border-[var(--sr-primary)]/30 flex items-center justify-center text-[var(--sr-primary)] shrink-0 mt-0.5 sm:mt-0">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value as ExamType)}
                aria-label="Target Examination"
                className="bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] border border-[var(--sr-line)] text-[var(--sr-text)] text-xs sm:text-sm font-black rounded-xl px-2.5 py-1.5 outline-none cursor-pointer transition max-w-full sm:max-w-md leading-snug whitespace-normal"
              >
                {EXAM_LIST.map((ex) => (
                  <option key={ex.id} value={ex.id} className="bg-[var(--sr-surface)] text-[var(--sr-text)] font-bold">
                    {ex.label}
                  </option>
                ))}
              </select>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border shrink-0 whitespace-nowrap ${speedBadge.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${speedBadge.dot} animate-pulse`} />
                {simulatedPace}h/day
              </span>
            </div>
            <p className="text-xs text-[var(--sr-text-muted)] mt-1 font-medium">
              Exam: <strong className="text-[var(--sr-text)] font-bold">{formatNiceDate(examDate)}</strong>
              <span className="mx-1.5 text-[var(--sr-text-subtle)]">•</span>
              Target Finish: <strong className="text-[var(--sr-text)] font-bold">{formatNiceDate(forecast.realisticDate)}</strong>
              {forecast.revisionBufferDays > 0 && (
                <span className="text-[var(--sr-primary)] font-bold ml-1.5">
                  ({forecast.revisionBufferDays}d buffer)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenAddCustomTopic}
            className="px-2.5 py-1.5 rounded-xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] text-[var(--sr-blue)] border border-[var(--sr-line)] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Add custom topic to syllabus"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Topic</span>
          </button>

          <button
            onClick={() => setIsToolsExpanded(!isToolsExpanded)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isToolsExpanded 
                ? 'bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] border-[var(--sr-blue)]/30' 
                : 'bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] text-[var(--sr-text-muted)] border-[var(--sr-line)]'
            }`}
            title="Adjust study velocity and pace simulation"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pace Tools</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isToolsExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── CENTRAL PROGRESS BAR (DUOLINGO TACTILE STYLE) ── */}
      <div className="mt-4 pt-3.5 border-t border-[var(--sr-line)]">
        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
          <span className="text-[var(--sr-text)] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--sr-primary)]" />
            Syllabus Completion
          </span>
          <span className="text-[var(--sr-primary)] font-black text-sm">
            {completionPct}%
          </span>
        </div>
        <div className="w-full h-3 bg-[var(--sr-surface-2)] rounded-full overflow-hidden p-0.5 border border-[var(--sr-line)]">
          <div
            className="h-full bg-[var(--sr-primary)] rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* ── 3-METRIC SUMMARY CHIPS (CONSISTENT WITH EXAM COUNTDOWN) ── */}
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div className="p-2 rounded-xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)]">
          <span className="text-[10px] text-[var(--sr-text-muted)] font-bold uppercase tracking-wider block">Exam Countdown</span>
          <span className="text-sm font-black text-[var(--sr-text)]">{daysUntilExam} <span className="text-[10px] font-normal text-[var(--sr-text-muted)]">days left</span></span>
        </div>
        <div className="p-2 rounded-xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)]">
          <span className="text-[10px] text-[var(--sr-text-muted)] font-bold uppercase tracking-wider block">Workload</span>
          <span className="text-sm font-black text-[var(--sr-text)]">{forecast.remainingWorkloadHours} <span className="text-[10px] font-normal text-[var(--sr-text-muted)]">hrs</span></span>
        </div>
        <div className="p-2 rounded-xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)]">
          <span className="text-[10px] text-[var(--sr-text-muted)] font-bold uppercase tracking-wider block">Buffer Cushion</span>
          <span className={`text-sm font-black ${forecast.revisionBufferDays > 0 ? 'text-[var(--sr-primary)]' : 'text-amber-500'}`}>
            {forecast.revisionBufferDays} <span className="text-[10px] font-normal text-[var(--sr-text-muted)]">days</span>
          </span>
        </div>
      </div>

      {/* ── COLLAPSIBLE WHAT-IF PACE SLIDER & SIMULATOR (OPENS ON DEMAND) ── */}
      <AnimatePresence>
        {isToolsExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-3.5 border-t border-[var(--sr-line)] space-y-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--sr-text)] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[var(--sr-blue)]" />
                Daily Study Hours Adjustment
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-[var(--sr-blue)]">
                  {simulatedPace} hrs/day
                </span>
                {whatIfConfig.dailyHourDelta !== 0 && (
                  <button
                    onClick={() => onUpdateWhatIf(prev => ({ ...prev, dailyHourDelta: 0 }))}
                    className="text-[10px] text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] flex items-center gap-0.5 underline cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Reset
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <input
                type="range"
                min="-3.0"
                max="4.0"
                step="0.5"
                value={whatIfConfig.dailyHourDelta}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  onUpdateWhatIf(prev => ({ ...prev, dailyHourDelta: val }));
                }}
                className="w-full accent-[var(--sr-blue)] h-2 bg-[var(--sr-surface-2)] rounded-lg cursor-pointer border border-[var(--sr-line)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--sr-text-muted)] px-1">
                <span>Slump (-3h)</span>
                <span>Normal ({basePace}h)</span>
                <span>Turbo (+4h)</span>
              </div>
            </div>

            {/* Quick Math Feedback */}
            <div className="p-2.5 rounded-xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)] flex items-center justify-between text-xs">
              <span className="text-[var(--sr-text-muted)]">
                Finish Date: <strong className="text-[var(--sr-text)]">{formatNiceDate(forecast.realisticDate)}</strong>
              </span>
              {daysSavedOrDelayed > 0 ? (
                <span className="text-[var(--sr-primary)] font-bold text-[11px] flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> {daysSavedOrDelayed} days saved
                </span>
              ) : daysSavedOrDelayed < 0 ? (
                <span className="text-rose-400 font-bold text-[11px] flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {Math.abs(daysSavedOrDelayed)}d delay risk
                </span>
              ) : (
                <span className="text-[#9CA3AF] text-[11px]">Normal schedule</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
