import React, { useState, useEffect } from 'react';
import { 
  Clock, Flame, Target, TrendingUp, Award, 
  Sparkles, BookOpen, BarChart3, Zap, ShieldCheck,
  LayoutGrid, Sliders, ChevronRight, Smartphone
} from 'lucide-react';
import { StudentDashboardData, UserProfile, ActiveTab } from '../types';
import { EXAM_LIST } from '../lib/examList';
import { AdSenseBanner } from './AdSenseBanner';
import { DailyStudySummaryCard } from './DailyStudySummaryCard';
import { CircularPerformanceHub } from './CircularPerformanceMeter';
import { ExamWallpaperWidget } from './ExamWallpaperWidget';
import { loadWorkspaceConfig, getActiveFeaturesInOrder, WorkspaceConfig, recordFeatureUsage } from '../lib/workspacePreferences';

interface StudentDashboardProps {
  userProfile: UserProfile;
  selectedExam?: string;
  onExamChange?: (examId: string) => void;
  onNavigate?: (tab: ActiveTab) => void;
  onOpenProfileModal?: () => void;
  onOpenWorkspaceCustomizer?: () => void;
  onOpenReminderSettings?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  userProfile, 
  selectedExam, 
  onExamChange, 
  onNavigate, 
  onOpenProfileModal,
  onOpenWorkspaceCustomizer,
  onOpenReminderSettings
}) => {
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig>(() => loadWorkspaceConfig(userProfile.id));

  useEffect(() => {
    const handleWorkspaceUpdate = () => {
      setWorkspaceConfig(loadWorkspaceConfig(userProfile.id));
    };
    window.addEventListener('aspirantx_workspace_updated', handleWorkspaceUpdate);
    return () => window.removeEventListener('aspirantx_workspace_updated', handleWorkspaceUpdate);
  }, [userProfile.id]);

  const defaultDashboardData: StudentDashboardData = {
    todayStudyMinutes: 180,
    weeklyStudyHours: 24,
    monthlyStudyHours: 96,
    currentStreak: userProfile.streakDays || 1,
    longestStreak: 12,
    topicsCompleted: 128,
    totalTopics: 310,
    overallProgressPercent: 42,
    daysLeftForExam: 110,
    estimatedCompletionDate: '2026-11-20',
    dailyTargetHours: 8,
    weeklyTargetTopics: 15,
    monthlyTargetTopics: 60,
    revisionProgressPercent: 35,
    testAccuracyPercent: 78,
    rankTrend: [
      { date: 'Mon', rank: 1420 },
      { date: 'Wed', rank: 1180 },
      { date: 'Fri', rank: 940 },
      { date: 'Today', rank: 720 },
    ],
    studyHeatmap: [
      { date: '2026-08-01', hours: 6 },
      { date: '2026-08-02', hours: 8 },
    ],
    aiSuggestions: [
      'Focus on high-yield Organic Chemistry mechanisms today.',
      'Practice 20 MCQs on Modern Physics to maintain your accuracy momentum.',
    ]
  };

  const [data, setData] = useState<StudentDashboardData>(defaultDashboardData);
  const [loading, setLoading] = useState<boolean>(false);

  const activeExamTag = selectedExam || userProfile.exam || 'NEET_UG';

  useEffect(() => {
    fetchDashboardTelemetry(activeExamTag, userProfile.id);

    const handleStreakUpdated = (e: any) => {
      const { streakDays } = e.detail || {};
      if (typeof streakDays === 'number') {
        setData((prev) => (prev ? { ...prev, currentStreak: streakDays } : prev));
      }
    };

    const handleGamificationUpdated = () => {
      fetchDashboardTelemetry(activeExamTag, userProfile.id);
    };

    const handleSyllabusUpdated = () => {
      fetchDashboardTelemetry(activeExamTag, userProfile.id);
    };

    window.addEventListener('aspirantx_streak_updated', handleStreakUpdated);
    window.addEventListener('aspirantx_gamification_updated', handleGamificationUpdated);
    window.addEventListener('aspirantx_personal_syllabus_updated', handleSyllabusUpdated);
    window.addEventListener('aspirantx_syllabus_time_updated', handleSyllabusUpdated);

    return () => {
      window.removeEventListener('aspirantx_streak_updated', handleStreakUpdated);
      window.removeEventListener('aspirantx_gamification_updated', handleGamificationUpdated);
      window.removeEventListener('aspirantx_personal_syllabus_updated', handleSyllabusUpdated);
      window.removeEventListener('aspirantx_syllabus_time_updated', handleSyllabusUpdated);
    };
  }, [activeExamTag, userProfile.id]);

  const fetchDashboardTelemetry = async (examTag: string, userId: string) => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const url = `/api/student/dashboard?userId=${encodeURIComponent(userId)}&exam=${encodeURIComponent(examTag)}`;
      const res = await fetch(url, { cache: 'no-store', signal: controller.signal }).catch(() => null);
      clearTimeout(timer);
      if (res && res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.success && json.dashboard) {
          setData(json.dashboard);
        }
      }
    } catch (err) {
      console.warn('Using default student dashboard telemetry:', err);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Syncing Student Telemetry...
      </div>
    );
  }

  return (
    <div className="w-full space-y-3.5 sm:space-y-6 pb-24 md:pb-6">
      {/* 1. TOP HEADER BANNER (User overview, Target Exam, Streak) */}
      <div className="ax-card p-3.5 sm:p-6 border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
        <div>
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-indigo-400 font-semibold text-[10px] sm:text-xs mb-0.5 sm:mb-1">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span>CANDIDATE COMMAND CENTER</span>
          </div>
          <h1 className="text-base sm:text-xl md:text-2xl font-bold text-slate-100">Welcome back, {userProfile.name}</h1>
          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 text-xs mt-1 flex-wrap">
            <span className="text-[11px] sm:text-xs">Exam:</span>
            <select
              value={selectedExam || userProfile.exam || 'NEET_UG'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__CREATE_CUSTOM__' && onOpenProfileModal) {
                  onOpenProfileModal();
                } else if (onExamChange) {
                  onExamChange(val);
                }
              }}
              className="bg-slate-950 border border-slate-800 text-indigo-300 font-bold text-[11px] sm:text-xs rounded-lg px-2 py-0.5 sm:px-2.5 sm:py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <optgroup label="Preset Exams">
                {EXAM_LIST.map((ex) => (
                  <option key={ex.id} value={ex.id} className="bg-slate-900 text-slate-200 font-medium">
                    {ex.label}
                  </option>
                ))}
              </optgroup>
              <option value="__CREATE_CUSTOM__" className="bg-slate-900 text-amber-400 font-bold">
                + Custom Exam...
              </option>
            </select>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-[11px] sm:text-xs">Days Left: <span className="font-bold text-indigo-400">{data.daysLeftForExam}d</span></span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 sm:space-x-3 bg-slate-950 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-slate-800 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400/30 animate-pulse" />
            <div className="text-[11px] sm:text-xs text-slate-400 font-medium">Daily Streak</div>
          </div>
          <div className="text-xs sm:text-base font-bold text-slate-100">{(userProfile.streakDays || data.currentStreak || 1)} Days 🔥</div>
        </div>
      </div>

      {/* AdSense In-Feed Ad Banner */}
      <AdSenseBanner slotType="inFeed" isPremium={userProfile.isPremium} />

      {/* 2. DYNAMIC CIRCULAR PERFORMANCE RINGS */}
      <CircularPerformanceHub
        syllabusPercent={data.overallProgressPercent}
        revisionPercent={data.revisionProgressPercent || 35}
        testAccuracyPercent={data.testAccuracyPercent}
        dailyStudyMinutes={data.todayStudyMinutes}
        dailyTargetMinutes={data.dailyTargetHours * 60}
      />

      {/* 3. MOBILE WALLPAPER & COUNTDOWN PROGRESS BOX ENGINE */}
      <ExamWallpaperWidget
        user={userProfile}
        selectedExam={activeExamTag}
        onNavigateToSyllabus={() => onNavigate && onNavigate('syllabus')}
      />

      {/* 4. DAILY STUDY SUMMARY NUDGE WIDGET */}
      <DailyStudySummaryCard
        user={userProfile}
        selectedExam={selectedExam}
        onNavigate={onNavigate}
        onOpenReminderSettings={onOpenReminderSettings}
      />

      {/* 5. WORKSPACE FOCUS HUB */}
      <div className="ax-card p-4 sm:p-5 md:p-6 space-y-4 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/20 border-indigo-500/20">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Personalized Study Modules</span>
                {workspaceConfig.preset && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                    {workspaceConfig.preset} MODE
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Quick jump to your selected academic tools and practice engines
              </p>
            </div>
          </div>

          {onOpenWorkspaceCustomizer && (
            <button
              onClick={onOpenWorkspaceCustomizer}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Personalize Hub</span>
            </button>
          )}
        </div>

        {/* Workspace Quick Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5 pt-1">
          {getActiveFeaturesInOrder(workspaceConfig).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                recordFeatureUsage(item.id, userProfile.id);
                if (onNavigate) {
                  onNavigate(item.id as ActiveTab);
                }
              }}
              className="p-2.5 sm:p-3 rounded-xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 transition-all text-left group flex flex-col justify-between h-20 shadow-sm cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base font-bold text-slate-300 group-hover:text-indigo-300">
                  {item.label.charAt(0)}
                </span>
                {item.meta.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-indigo-500/20 text-indigo-300 uppercase">
                    {item.meta.badge}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] sm:text-xs font-bold text-slate-200 group-hover:text-white truncate">
                  {item.label}
                </span>
                <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5 shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 6. ALL INDIA RANK PROGRESSION & AI INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 ax-card p-4 sm:p-6 space-y-4">
          <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>All India Rank & Accuracy Telemetry</span>
          </h3>

          <div className="p-3.5 sm:p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            {data.rankTrend.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400 w-16 sm:w-20">{item.date}</span>
                <div className="flex items-center space-x-3 flex-1 mx-2 sm:mx-4">
                  <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, 100 - (item.rank / 20)))}%` }}
                    ></div>
                  </div>
                </div>
                <span className="font-bold text-indigo-300 text-xs shrink-0">Rank #{item.rank}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ax-card p-4 sm:p-6 space-y-4">
          <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>AI Study Insights</span>
          </h3>

          <div className="space-y-2.5 sm:space-y-3">
            {data.aiSuggestions.map((sugg, i) => (
              <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-amber-400 block mb-0.5">Insight #{i + 1}:</span>
                {sugg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
