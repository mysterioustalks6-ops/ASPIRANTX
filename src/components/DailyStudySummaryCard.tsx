import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  CheckCircle2, 
  Circle, 
  ArrowUpRight, 
  Sliders, 
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { UserProfile, ActiveTab } from '../types';
import { 
  getDailyStudySummary, 
  DailyStudySummary, 
  loadStudyReminderSettings,
  StudyReminderSettings
} from '../lib/studyReminderService';
import { awardXPAndCoins } from '../lib/gamification';

interface DailyStudySummaryCardProps {
  user: UserProfile;
  selectedExam?: string;
  onNavigate?: (tab: ActiveTab) => void;
  onOpenReminderSettings?: () => void;
  variant?: 'wallpaper' | 'compact' | 'widget';
  className?: string;
}

export const DailyStudySummaryCard: React.FC<DailyStudySummaryCardProps> = ({
  user,
  selectedExam,
  onNavigate,
  onOpenReminderSettings,
  variant = 'wallpaper',
  className = '',
}) => {
  const [summary, setSummary] = useState<DailyStudySummary>(() =>
    getDailyStudySummary(user, selectedExam)
  );
  const [settings, setSettings] = useState<StudyReminderSettings>(() =>
    loadStudyReminderSettings(user?.id)
  );

  const refreshData = () => {
    setSummary(getDailyStudySummary(user, selectedExam));
    setSettings(loadStudyReminderSettings(user?.id));
  };

  useEffect(() => {
    refreshData();

    const handleStreak = () => refreshData();
    const handleSettings = () => refreshData();
    const handleGamification = () => refreshData();

    window.addEventListener('aspirantx_streak_updated', handleStreak);
    window.addEventListener('aspirantx_reminder_settings_updated', handleSettings);
    window.addEventListener('aspirantx_gamification_updated', handleGamification);

    return () => {
      window.removeEventListener('aspirantx_streak_updated', handleStreak);
      window.removeEventListener('aspirantx_reminder_settings_updated', handleSettings);
      window.removeEventListener('aspirantx_gamification_updated', handleGamification);
    };
  }, [user, selectedExam]);

  const handleToggleTask = async (taskId: string, currentCompleted: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    // Completed items in this summary widget are read-only to prevent XP/coin farming exploits
    if (currentCompleted) {
      return;
    }
    const activeExam = selectedExam || user.exam || 'UPSC_CSE';
    const taskKey = `aspirantx_kanban_tasks_v3_${user.id || 'guest'}_${activeExam}`;

    try {
      const raw = localStorage.getItem(taskKey);
      if (raw) {
        const tasks = JSON.parse(raw);
        const targetTask = tasks.find((t: any) => t.id === taskId);
        // Only award reward on genuine transitions from incomplete to completed
        if (targetTask && (targetTask.completed || targetTask.status === 'completed')) {
          return;
        }

        const updated = tasks.map((t: any) =>
          t.id === taskId
            ? { ...t, completed: true, status: 'completed' }
            : t
        );
        localStorage.setItem(taskKey, JSON.stringify(updated));

        await awardXPAndCoins(20, 5, 'Completed Study Topic', user.id);
        try {
          const res = await fetch('/api/user/streak/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id || 'guest', activityType: 'task_complete' }),
          });
          const data = await res.json().catch(() => null);
          if (data && typeof data.streakDays === 'number') {
            window.dispatchEvent(
              new CustomEvent('aspirantx_streak_updated', {
                detail: { streakDays: data.streakDays, lastActiveDate: data.lastActiveDate },
              })
            );
          }
        } catch {}
        refreshData();
      }
    } catch (err) {
      console.warn('Error updating task status from card:', err);
    }
  };

  const handleCardClick = () => {
    if (onNavigate) {
      onNavigate(summary.deepLinkTab);
    }
  };

  const formatReminderTimeLabel = (timeStr: string) => {
    const [hStr, mStr] = (timeStr || '20:00').split(':');
    const h = parseInt(hStr || '20', 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m} ${ampm}`;
  };

  // Compact Variant (e.g. Header or quick glance)
  if (variant === 'compact') {
    return (
      <div 
        onClick={handleCardClick}
        className={`bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-3 sm:p-4 transition-all cursor-pointer group shadow-md ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 fill-emerald-400/20" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate group-hover:text-emerald-300 transition-colors">
                {summary.headlineCopy}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-emerald-400">{summary.streakCopy}</span>
                <span>•</span>
                <span className="truncate">{summary.examLabel}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5 shrink-0" />
        </div>
      </div>
    );
  }

  // Full Wallpaper / Widget Card Variant (Default)
  return (
    <div
      onClick={handleCardClick}
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-200 cursor-pointer group shadow-xl ${
        summary.isCompletedForToday
          ? 'bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-emerald-950/40 border-emerald-500/30 hover:border-emerald-500/50'
          : 'bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-indigo-950/30 border-slate-800 hover:border-indigo-500/40'
      } p-4 sm:p-6 ${className}`}
    >
      {/* Calm background ambient highlight */}
      <div 
        className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-opacity ${
          summary.isCompletedForToday ? 'bg-emerald-500/10' : 'bg-indigo-500/10'
        }`}
      />

      <div className="relative z-10 space-y-4">
        {/* Card Header: App Name, Target Exam, Streak Badge, Settings Gear */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800/80">
              AspirantX
            </span>
            <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
              {summary.examLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Streak Alive Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-bold text-amber-300 shadow-sm">
              <Flame className="w-3.5 h-3.5 fill-amber-400/30 text-amber-400" />
              <span>{summary.streakCopy}</span>
            </div>

            {/* Reminder Settings Trigger */}
            {onOpenReminderSettings && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenReminderSettings();
                }}
                className="p-1.5 rounded-lg bg-slate-950/80 hover:bg-indigo-950/50 text-slate-400 hover:text-indigo-300 border border-slate-800 transition-colors"
                title={`Reminder set for ${formatReminderTimeLabel(settings.reminderTime)}`}
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Primary Headline Copy */}
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-indigo-200 transition-colors leading-snug">
            {summary.headlineCopy}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {summary.isCompletedForToday
              ? 'Great consistency today. Keep the momentum going whenever you are ready.'
              : 'Every small concept mastered moves you closer to your goal.'}
          </p>
        </div>

        {/* Specific Topic Progress Items */}
        <div className="space-y-2 pt-1">
          {/* Completed topic items (progress visibility without uncomplete exploit) */}
          {summary.completedTopics.map((topic) => (
            <div
              key={`comp_${topic.id}`}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300 font-medium line-through truncate opacity-75">
                  {topic.title}
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded shrink-0">
                Done
              </span>
            </div>
          ))}

          {/* Pending topic items (specific 1-2 topics) */}
          {summary.pendingTopics.map((topic, idx) => (
            <div
              key={`pend_${topic.id}`}
              onClick={(e) => handleToggleTask(topic.id, false, e)}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-950/80 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/40 text-xs transition-all cursor-pointer group/item"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Circle className="w-4 h-4 text-slate-500 group-hover/item:text-indigo-400 shrink-0 transition-colors" />
                <span className="text-slate-200 font-semibold truncate group-hover/item:text-white">
                  {topic.title}
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                {topic.subject || 'Target Topic'}
              </span>
            </div>
          ))}
        </div>

        {/* Card Footer: Quick Action & Deep Link */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Reminder at {formatReminderTimeLabel(settings.reminderTime)}</span>
          </div>

          <div className="flex items-center gap-1 font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors text-xs">
            <span>{summary.isCompletedForToday ? 'Review Workspace' : 'Continue Studying'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
