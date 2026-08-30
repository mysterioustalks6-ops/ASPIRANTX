import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Sliders, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  AlertTriangle,
  Flame,
  Hourglass
} from 'lucide-react';
import { PredictorStats, savePredictorSettings } from '../lib/syllabusStorage';
import { PredictorSettings } from '../types';

interface PredictorEngineWidgetProps {
  stats: PredictorStats;
  settings: PredictorSettings;
  onUpdateSettings: (newSettings: PredictorSettings) => void;
  examName?: string;
}

export const PredictorEngineWidget: React.FC<PredictorEngineWidgetProps> = ({
  stats,
  settings,
  onUpdateSettings,
  examName,
}) => {
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const handleHoursPerSubtopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const updated = { ...settings, hoursPerSubtopic: val };
    onUpdateSettings(updated);
    savePredictorSettings(updated);
  };

  const handleDailyHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const updated = { ...settings, dailyStudyHours: val };
    onUpdateSettings(updated);
    savePredictorSettings(updated);
  };

  const handleResetDefaults = () => {
    const defaults = {
      hoursPerSubtopic: 2.5,
      dailyStudyHours: 10.0,
      startDate: new Date().toISOString(),
      actualHoursLoggedToday: 10.0,
    };
    onUpdateSettings(defaults);
    savePredictorSettings(defaults);
  };

  if (stats.totalSubtopics === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c0c0e] via-[#050505] to-[#120a1f] border border-white/10 p-8 text-center shadow-[0_0_40px_rgba(112,0,255,0.15)]">
        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-lg font-black text-white tracking-tight mb-2">
          No syllabus data yet for {examName || 'this exam'} — ask admin to upload it
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          The AI Predictor engine requires syllabus modules for {examName || 'this exam'} to calculate estimated completion dates and study velocity. Please use the Admin Bulk Import panel or wait for syllabus upload.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c0c0e] via-[#050505] to-[#120a1f] border border-white/10 p-6 md:p-8 shadow-[0_0_40px_rgba(112,0,255,0.15)] transition-all duration-300">
      {/* Background Neon Ambient Orbs */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#00FF94]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#7000FF]/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#7000FF] to-[#00FF94] p-[1px] shadow-[0_0_20px_rgba(0,255,148,0.3)]">
            <div className="w-full h-full bg-[#050505] rounded-[15px] p-2 flex items-center justify-center text-[#00FF94]">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white tracking-tight">
                AI Predictor Engine
              </h3>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full bg-[#00FF94]/10 text-[#00FF94] border border-[#00FF94]/30 shadow-[0_0_10px_rgba(0,255,148,0.2)]">
                Dynamic Pace
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live calculation based on {stats.hoursPerSubtopic}h/sub-topic @ {stats.dailyStudyHours}h/day study target
            </p>
          </div>
        </div>

        {/* Toggle Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all self-start sm:self-auto"
        >
          <Sliders className="w-3.5 h-3.5 text-[#00FF94]" />
          <span>Adjust Parameters</span>
          {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Settings Drawer (Collapsible) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl relative z-10 overflow-hidden space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#00FF94] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Predictor Formula Parameters
              </span>
              <button
                onClick={handleResetDefaults}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 underline"
              >
                <RotateCcw className="w-3 h-3" /> Reset Defaults (2.5h / 10h)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Slider 1: Hours per Sub-topic */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Estimated Hours per Sub-topic</span>
                  <span className="font-extrabold text-[#00FF94] bg-[#00FF94]/10 px-2 py-0.5 rounded border border-[#00FF94]/30">
                    {settings.hoursPerSubtopic} Hours
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.5"
                  value={settings.hoursPerSubtopic}
                  onChange={handleHoursPerSubtopicChange}
                  className="w-full accent-[#00FF94] bg-white/10 h-2 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">Default requirement: 2.5 hours per sub-topic</p>
              </div>

              {/* Slider 2: Daily Study Hours */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Target Daily Study Hours</span>
                  <span className="font-extrabold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                    {settings.dailyStudyHours} Hours/Day
                  </span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="16.0"
                  step="0.5"
                  value={settings.dailyStudyHours}
                  onChange={handleDailyHoursChange}
                  className="w-full accent-purple-500 bg-white/10 h-2 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">Default requirement: 10 hours per day study routine</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main KPI Stats Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* KPI 1: Main Highlight - Predicted Days to Complete */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-[#121215] to-[#08080a] border border-[#00FF94]/30 shadow-[0_0_30px_rgba(0,255,148,0.1)] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-[#00FF94]">
            <Hourglass className="w-28 h-28" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#00FF94] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Predicted Days to Complete Syllabus
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1 ${
                  stats.paceStatus === 'Ahead'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : stats.paceStatus === 'Lagging'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-[#00FF94]/10 text-[#00FF94] border-[#00FF94]/30'
                }`}
              >
                {stats.paceStatus === 'Lagging' && <AlertTriangle className="w-3 h-3" />}
                {stats.paceStatus === 'Ahead' && <Flame className="w-3 h-3" />}
                {stats.paceStatus === 'On Track' && <CheckCircle2 className="w-3 h-3" />}
                Pace: {stats.paceStatus} {stats.lagDays > 0 ? `(+${stats.lagDays}d lag)` : ''}
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(0,255,148,0.5)]">
                {stats.predictedDays}
              </span>
              <span className="text-xl font-bold text-slate-400 uppercase tracking-widest">
                Days
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              At your current target pace of <strong className="text-[#00FF94]">{stats.dailyStudyHours} hours/day</strong>, you will complete all remaining unchecked sub-topics by <strong className="text-white bg-white/10 px-2 py-0.5 rounded">{stats.predictedCompletionDate}</strong>.
            </p>
          </div>

          {/* Dynamic Progress Bar */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Overall Completion Progress</span>
              <span className="font-extrabold text-white">
                {stats.completedSubtopics} / {stats.totalSubtopics} Sub-topics ({stats.completionPercentage}%)
              </span>
            </div>

            <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
              <motion.div
                className="h-full bg-gradient-to-r from-[#00FF94] via-cyan-400 to-[#7000FF] rounded-full shadow-[0_0_15px_rgba(0,255,148,0.6)]"
                initial={{ width: 0 }}
                animate={{ width: `${stats.completionPercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* KPI 2 & 3: Remaining Hours & Subtopics Breakdown */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Card: Total Remaining Study Hours */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Remaining Study Time
              </span>
              <div className="text-3xl font-black text-white flex items-baseline gap-1">
                {stats.totalRemainingHours.toFixed(1)}
                <span className="text-xs font-semibold text-slate-400">Hrs</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {stats.remainingSubtopics} unchecked subtopics × {stats.hoursPerSubtopic}h
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card: Daily Goal & Finish Target */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Target Completion Date
              </span>
              <div className="text-lg font-black text-[#00FF94]">
                {stats.predictedCompletionDate}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Required average: {stats.dailyStudyHours}h/day
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#00FF94]/10 text-[#00FF94] border border-[#00FF94]/30">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
