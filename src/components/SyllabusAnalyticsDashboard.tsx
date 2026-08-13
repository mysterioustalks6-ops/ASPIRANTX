import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PredictionAnalyticsData } from '../types';
import { 
  Zap, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle, 
  Award, 
  Sparkles, 
  Flame, 
  Target, 
  RotateCcw, 
  ChevronRight, 
  ShieldCheck,
  Check,
  BarChart3,
  TrendingDown
} from 'lucide-react';

interface SyllabusAnalyticsDashboardProps {
  completedSubtopicIds: Set<string>;
  totalSubtopicsCount?: number;
  dailyStudyHours?: number;
  targetExamDate?: string;
  examName?: string;
}

export const SyllabusAnalyticsDashboard: React.FC<SyllabusAnalyticsDashboardProps> = ({
  completedSubtopicIds,
  totalSubtopicsCount = 120,
  dailyStudyHours = 10,
  targetExamDate = '2026-05-24',
  examName = 'UPSC CSE 2026',
}) => {
  const [analytics, setAnalytics] = useState<PredictionAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch prediction data from live server calculation engine
  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch('/api/academic/syllabus/calculate-prediction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            completedSubtopicIds: Array.from(completedSubtopicIds),
            totalSubtopicsCount,
            dailyStudyHours,
            hoursPerSubtopic: 2.5,
            targetExamDate,
            exam: examName,
            actualHoursLoggedToday: 8.5,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.analytics) {
            setAnalytics(data.analytics);
          }
        }
      } catch (e) {
        console.warn('Failed to calculate analytics from backend');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [completedSubtopicIds, totalSubtopicsCount, dailyStudyHours, targetExamDate, examName]);

  if (loading || !analytics) {
    return (
      <div className="p-12 text-center rounded-3xl bg-black/40 border border-white/10">
        <Zap className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-300">Calculating AI Syllabus Completion Prediction...</p>
      </div>
    );
  }

  const isBehind = analytics.status === 'behind_schedule';
  const isAhead = analytics.status === 'ahead_of_schedule';

  return (
    <div className="space-y-6">
      {/* Hero Stats Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a0a0f] via-[#050508] to-[#120c24] border border-white/10 p-6 md:p-8 shadow-[0_0_50px_rgba(0,255,148,0.1)]">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] shadow-[0_0_20px_rgba(0,255,200,0.3)]">
              <div className="w-full h-full bg-[#050508] rounded-[15px] p-3 flex items-center justify-center text-cyan-400">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  AI Syllabus Completion Predictor
                </h2>
                <span className="px-3 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Realtime Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Predictive telemetry for {examName} • Exam Date: {analytics.targetExamDate}
              </p>
            </div>
          </div>

          {/* Schedule Status Badge */}
          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-2.5 rounded-2xl border backdrop-blur-xl flex items-center gap-2.5 shadow-lg ${
                isBehind
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : isAhead
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              }`}
            >
              {isBehind ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              )}
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest block opacity-75">
                  Completion Status
                </span>
                <span className="text-sm font-extrabold capitalize">
                  {analytics.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 relative z-10">
          {/* Days Left Counter */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Days Left</span>
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white">{analytics.daysLeft} Days</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Until Exam Day</p>
          </div>

          {/* Syllabus % Completed */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Completion</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">{analytics.completedPercent}%</div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {analytics.completedSubtopics} / {analytics.totalSubtopics} Topics Covered
            </p>
          </div>

          {/* Current vs Required Pace */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Required Pace</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300">
              {analytics.requiredDailyPaceHours} h/day
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Current Pace: {analytics.currentDailyPaceHours} h/day</p>
          </div>

          {/* Estimated Completion Date */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Est. Finish Date</span>
              <Target className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-black text-amber-300 truncate">
              {analytics.estimatedCompletionDate}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Predicted by Engine</p>
          </div>
        </div>
      </div>

      {/* Target & Pace Breakdown + Weekly / Monthly Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly & Monthly Target Targets */}
        <div className="p-6 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" /> Dynamic Study Target Goals
          </h3>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Weekly Subtopic Target</span>
                <span className="text-[11px] text-slate-400">Target count for this 7-day period</span>
              </div>
              <span className="text-lg font-black text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20">
                {analytics.weeklyTargetSubtopics} Topics
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Monthly Subtopic Target</span>
                <span className="text-[11px] text-slate-400">Target count for this 30-day period</span>
              </div>
              <span className="text-lg font-black text-purple-300 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">
                {analytics.monthlyTargetSubtopics} Topics
              </span>
            </div>
          </div>
        </div>

        {/* AI Recovery Plan Recommendations */}
        <div className="p-6 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> AI Recovery & Optimization Plan
          </h3>

          <div className="space-y-2">
            {analytics.recoveryPlan.aiSuggestions.map((sug, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{sug}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subject Weightage Breakdown Table */}
      <div className="p-6 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl space-y-4">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> Subject-wise Weightage & Progress Breakdown
        </h3>

        <div className="space-y-3">
          {analytics.subjectWeightageBreakdown.map((subj) => (
            <div key={subj.subject} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-200">{subj.subject}</span>
                <span className="text-cyan-400 font-extrabold">
                  {subj.completed} / {subj.total} Topics ({subj.percentage}%)
                </span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-500"
                  style={{ width: `${subj.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
