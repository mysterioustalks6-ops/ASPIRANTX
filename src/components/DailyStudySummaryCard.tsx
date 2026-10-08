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
import { useLanguage } from '../lib/i18n/LanguageContext';

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
  const { currentLanguage, isHindi: ctxIsHindi } = useLanguage();
  const isHindi = Boolean(ctxIsHindi || currentLanguage === 'hi');
  const [summary, setSummary] = useState<DailyStudySummary>(() =>
    getDailyStudySummary(user, selectedExam, currentLanguage)
  );
  const [settings, setSettings] = useState<StudyReminderSettings>(() =>
    loadStudyReminderSettings(user?.id)
  );

  const refreshData = () => {
    setSummary(getDailyStudySummary(user, selectedExam, currentLanguage));
    setSettings(loadStudyReminderSettings(user?.id));
  };

  useEffect(() => {
    refreshData();
  }, [currentLanguage]);

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
        className={`bg-[var(--sr-surface)] border border-[var(--sr-line)] hover:border-[var(--sr-primary)]/40 rounded-2xl p-3 sm:p-4 transition-all cursor-pointer group shadow-sm ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[var(--sr-primary-subtle)] border border-[var(--sr-primary)]/20 text-[var(--sr-primary)] flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 fill-current opacity-30" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[var(--sr-text)] truncate group-hover:text-[var(--sr-primary)] transition-colors">
                {summary.headlineCopy}
              </div>
              <div className="text-xs text-[var(--sr-text-muted)] flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-[var(--sr-primary)]">{summary.streakCopy}</span>
                <span>•</span>
                <span className="truncate">{summary.examLabel}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--sr-text-muted)] group-hover:text-[var(--sr-primary)] transition-transform group-hover:translate-x-0.5 shrink-0" />
        </div>
      </div>
    );
  }

  // Full Wallpaper / Widget Card Variant (Default)
  return (
    <div
      onClick={handleCardClick}
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 transition-all duration-200 cursor-pointer group shadow-md ${
        summary.isCompletedForToday
          ? 'bg-[var(--sr-surface)] border-[var(--sr-primary)]/40 hover:border-[var(--sr-primary)]'
          : 'bg-[var(--sr-surface)] border-[var(--sr-line-strong)] hover:border-[var(--sr-primary)]/40'
      } p-4 sm:p-6 ${className}`}
    >
      <div className="relative z-10 space-y-4">
        {/* Card Header: App Name, Target Exam, Streak Badge, Settings Gear */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--sr-text-muted)] bg-[var(--sr-surface-2)] px-2.5 py-1 rounded-lg border border-[var(--sr-line)]">
              StudyRide
            </span>
            <span className="text-xs font-bold text-[var(--sr-primary)] bg-[var(--sr-primary-subtle)] border border-[var(--sr-primary)]/20 px-2.5 py-1 rounded-lg">
              {summary.examLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Streak Alive Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--sr-surface-2)] border border-[var(--sr-line)] text-xs font-bold text-[var(--sr-warning-text)] shadow-sm">
              <Flame className="w-3.5 h-3.5 fill-current opacity-40 text-amber-500" />
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
                className="p-1.5 rounded-lg bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] border border-[var(--sr-line)] transition-colors cursor-pointer"
                title={`Reminder set for ${formatReminderTimeLabel(settings.reminderTime)}`}
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Primary Headline Copy */}
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--sr-text)] group-hover:text-[var(--sr-primary)] transition-colors leading-snug">
            {summary.headlineCopy}
          </h2>
          <p className="text-xs text-[var(--sr-text-muted)] mt-1">
            {summary.isCompletedForToday
              ? (isHindi ? 'आज की शानदार निरंतरता। जब भी तैयार हों, अध्ययन जारी रखें।' : 'Great consistency today. Keep the momentum going whenever you are ready.')
              : (isHindi ? 'प्रत्येक सीखी गई छोटी संकल्पना आपको आपके लक्ष्य के करीब ले जाती है।' : 'Every small concept mastered moves you closer to your goal.')}
          </p>
        </div>

        {/* Specific Topic Progress Items */}
        <div className="space-y-2 pt-1">
          {/* Completed topic items */}
          {summary.completedTopics.map((topic) => (
            <div
              key={`comp_${topic.id}`}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[var(--sr-primary-subtle)] border border-[var(--sr-primary)]/30 text-xs select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-[var(--sr-primary)] shrink-0" />
                <span className="text-[var(--sr-text)] font-medium line-through truncate opacity-75">
                  {topic.title}
                </span>
              </div>
              <span className="text-xs font-bold text-[var(--sr-primary)] bg-[var(--sr-primary-subtle)] px-2 py-0.5 rounded border border-[var(--sr-primary)]/30 shrink-0">
                {isHindi ? 'पूर्ण' : 'Done'}
              </span>
            </div>
          ))}

          {/* Pending topic items */}
          {summary.pendingTopics.map((topic) => (
            <div
              key={`pend_${topic.id}`}
              onClick={(e) => handleToggleTask(topic.id, false, e)}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] border border-[var(--sr-line)] hover:border-[var(--sr-primary)]/40 text-xs transition-all cursor-pointer group/item"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Circle className="w-4 h-4 text-[var(--sr-text-subtle)] group-hover/item:text-[var(--sr-primary)] shrink-0 transition-colors" />
                <span className="text-[var(--sr-text)] font-semibold truncate group-hover/item:text-[var(--sr-primary)]">
                  {topic.title}
                </span>
              </div>
              <span className="text-xs font-medium text-[var(--sr-text-muted)] bg-[var(--sr-surface)] px-2 py-0.5 rounded border border-[var(--sr-line)] shrink-0">
                {topic.subject || (isHindi ? 'लक्ष्य विषय' : 'Target Topic')}
              </span>
            </div>
          ))}
        </div>

        {/* Card Footer: Quick Action & Deep Link */}
        <div className="pt-2 flex items-center justify-between text-xs text-[var(--sr-text-muted)] border-t border-[var(--sr-line)]">
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[var(--sr-text-subtle)]" />
            <span>{isHindi ? `दैनिक स्मरण: ${formatReminderTimeLabel(settings.reminderTime)}` : `Reminder at ${formatReminderTimeLabel(settings.reminderTime)}`}</span>
          </div>

          <div className="flex items-center gap-1 font-bold text-[var(--sr-primary)] group-hover:underline transition-colors text-xs">
            <span>
              {summary.isCompletedForToday 
                ? (isHindi ? 'कार्यक्षेत्र देखें' : 'Review Workspace') 
                : (isHindi ? 'अध्ययन जारी रखें' : 'Continue Studying')}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
