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
  const realisticDateObj = new Date(forecast.realisticDate);
  const nowObj = new Date();
  const daysUntilRealistic = !isNaN(realisticDateObj.getTime())
    ? Math.max(0, Math.ceil((realisticDateObj.getTime() - nowObj.getTime()) / (1000 * 60 * 60 * 24)))
    : 120;

  const baselineDays = Math.max(1, Math.round(daysUntilRealistic * (simulatedPace / basePace)));
  const daysSavedOrDelayed = baselineDays - daysUntilRealistic;

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
        color: 'bg-[#58CC02]/15 text-[#58CC02] border-[#58CC02]/30',
        dot: 'bg-[#58CC02]'
      };
    } else if (simulatedPace <= 9.0) {
      return {
        label: 'Turbo Sprint',
        color: 'bg-[#1CB0F6]/15 text-[#1CB0F6] border-[#1CB0F6]/30',
        dot: 'bg-[#1CB0F6]'
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
    <div className="rounded-2xl bg-[#15181F] border border-[#2A2F3A] p-4 sm:p-5 shadow-lg relative overflow-hidden transition-all">
      {/* ── TOP HEADER ROW: EXAM SELECTOR + STATUS BADGE + TOOLS TOGGLE ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#58CC02]/15 border border-[#58CC02]/30 flex items-center justify-center text-[#58CC02] shrink-0">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value as ExamType)}
                aria-label="Target Examination"
                className="bg-[#0F1115] hover:bg-[#1A1D24] border border-[#2A2F3A] text-white text-sm font-extrabold rounded-lg px-2.5 py-1 outline-none cursor-pointer transition max-w-[190px] sm:max-w-xs truncate"
              >
                {EXAM_LIST.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.label}
                  </option>
                ))}
              </select>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${speedBadge.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${speedBadge.dot} animate-pulse`} />
                {simulatedPace}h/day
              </span>
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
              Target Finish: <strong className="text-white">{formatNiceDate(forecast.realisticDate)}</strong>
              {forecast.revisionBufferDays > 0 && (
                <span className="text-[#58CC02] font-semibold ml-1.5">
                  ({forecast.revisionBufferDays}d buffer)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onOpenAddCustomTopic}
            className="px-2.5 py-1.5 rounded-xl bg-[#0F1115] hover:bg-[#1A1D24] text-[#1CB0F6] border border-[#2A2F3A] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Add custom topic to syllabus"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Topic</span>
          </button>

          <button
            onClick={() => setIsToolsExpanded(!isToolsExpanded)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isToolsExpanded 
                ? 'bg-[#1CB0F6]/15 text-[#1CB0F6] border-[#1CB0F6]/30' 
                : 'bg-[#0F1115] hover:bg-[#1A1D24] text-[#9CA3AF] border-[#2A2F3A]'
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
      <div className="mt-4 pt-3.5 border-t border-[#2A2F3A]">
        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
          <span className="text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#58CC02]" />
            Syllabus Completion
          </span>
          <span className="text-[#58CC02] font-black text-sm">
            {completionPct}%
          </span>
        </div>
        <div className="w-full h-3 bg-[#0F1115] rounded-full overflow-hidden p-0.5 border border-[#2A2F3A]">
          <div
            className="h-full bg-[#58CC02] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(88,204,2,0.4)]"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* ── 3-METRIC SUMMARY CHIPS (CLEAN NUMBERS, ZERO WORDINESS) ── */}
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div className="p-2 rounded-xl bg-[#0F1115] border border-[#2A2F3A]">
          <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider block">Remaining</span>
          <span className="text-sm font-black text-white">{daysUntilRealistic} <span className="text-[10px] font-normal text-[#9CA3AF]">days</span></span>
        </div>
        <div className="p-2 rounded-xl bg-[#0F1115] border border-[#2A2F3A]">
          <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider block">Workload</span>
          <span className="text-sm font-black text-white">{forecast.remainingWorkloadHours} <span className="text-[10px] font-normal text-[#9CA3AF]">hrs</span></span>
        </div>
        <div className="p-2 rounded-xl bg-[#0F1115] border border-[#2A2F3A]">
          <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider block">Buffer</span>
          <span className={`text-sm font-black ${forecast.revisionBufferDays > 0 ? 'text-[#58CC02]' : 'text-amber-400'}`}>
            {forecast.revisionBufferDays} <span className="text-[10px] font-normal text-[#9CA3AF]">days</span>
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
            className="mt-4 pt-3.5 border-t border-[#2A2F3A] space-y-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#1CB0F6]" />
                Daily Study Hours Adjustment
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-[#1CB0F6]">
                  {simulatedPace} hrs/day
                </span>
                {whatIfConfig.dailyHourDelta !== 0 && (
                  <button
                    onClick={() => onUpdateWhatIf(prev => ({ ...prev, dailyHourDelta: 0 }))}
                    className="text-[10px] text-[#9CA3AF] hover:text-white flex items-center gap-0.5 underline cursor-pointer"
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
                className="w-full accent-[#1CB0F6] h-2 bg-[#0F1115] rounded-lg cursor-pointer border border-[#2A2F3A]"
              />
              <div className="flex justify-between text-[10px] text-[#9CA3AF] px-1">
                <span>Slump (-3h)</span>
                <span>Normal ({basePace}h)</span>
                <span>Turbo (+4h)</span>
              </div>
            </div>

            {/* Quick Math Feedback */}
            <div className="p-2.5 rounded-xl bg-[#0F1115] border border-[#2A2F3A] flex items-center justify-between text-xs">
              <span className="text-[#9CA3AF]">
                Finish Date: <strong className="text-white">{formatNiceDate(forecast.realisticDate)}</strong>
              </span>
              {daysSavedOrDelayed > 0 ? (
                <span className="text-[#58CC02] font-bold text-[11px] flex items-center gap-1">
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
