import React, { useState, useEffect } from 'react';
import { 
  Clock, Flame, Target, TrendingUp, Award, 
  Sparkles, BookOpen, BarChart3, Zap, ShieldCheck, Megaphone, X 
} from 'lucide-react';
import { StudentDashboardData, UserProfile, ActiveTab } from '../types';
import { OnboardingTour } from './OnboardingTour';
import { EXAM_LIST } from '../lib/examList';
import { AdSenseBanner } from './AdSenseBanner';

interface StudentDashboardProps {
  userProfile: UserProfile;
  selectedExam?: string;
  onExamChange?: (examId: string) => void;
  onNavigate?: (tab: ActiveTab) => void;
  onOpenProfileModal?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  userProfile, 
  selectedExam, 
  onExamChange, 
  onNavigate, 
  onOpenProfileModal 
}) => {
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

  // Student Announcements State
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
    } catch {
      return [];
    }
  });

  const activeExamTag = selectedExam || userProfile.exam || 'NEET_UG';

  useEffect(() => {
    fetchAnnouncements(activeExamTag);
  }, [activeExamTag]);

  const fetchAnnouncements = async (exam: string) => {
    try {
      const res = await fetch(`/api/announcements?exam=${encodeURIComponent(exam)}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.announcements)) {
          setAnnouncements(json.announcements);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch announcements:', err);
    }
  };

  const handleDismissAnnouncement = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem('dismissed_announcements', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const visibleAnnouncements = announcements.filter((ann) => !dismissedIds.includes(ann.id));

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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Onboarding Tour */}
      {onNavigate && onOpenProfileModal && (
        <OnboardingTour
          onNavigate={onNavigate}
          onOpenProfileModal={onOpenProfileModal}
        />
      )}

      {/* HEADER BANNER */}
      <div className="ax-card p-6 border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>CANDIDATE TELEMETRY</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Welcome back, {userProfile.name}</h1>
          <div className="flex items-center gap-2 text-slate-400 text-sm mt-1.5 flex-wrap">
            <span>Target Exam:</span>
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
              className="bg-slate-950 border border-slate-800 text-indigo-300 font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <optgroup label="Preset Exams">
                {EXAM_LIST.map((ex) => (
                  <option key={ex.id} value={ex.id} className="bg-slate-900 text-slate-200 font-medium">
                    {ex.label}
                  </option>
                ))}
              </optgroup>
              <option value="__CREATE_CUSTOM__" className="bg-slate-900 text-amber-400 font-bold">
                + Create Custom Exam...
              </option>
            </select>
            <span className="text-slate-500">•</span>
            <span>Target Year: <span className="font-semibold text-slate-200">{userProfile.targetYear || 2026}</span></span>
            <span className="text-slate-500">•</span>
            <span>Days Left: <span className="font-bold text-indigo-400">{data.daysLeftForExam} Days</span></span>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950 px-4 py-3 rounded-xl border border-slate-800">
          <Flame className="w-5 h-5 text-amber-400 fill-amber-400/30" />
          <div>
            <div className="text-xs text-slate-400 font-medium">Study Streak</div>
            <div className="text-base font-bold text-slate-100">{(userProfile.streakDays || data.currentStreak || 1)} Days</div>
          </div>
        </div>
      </div>

      {/* ACTIVE ANNOUNCEMENTS BANNER */}
      {visibleAnnouncements.length > 0 && (
        <div className="space-y-3">
          {visibleAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={`p-4 rounded-2xl border transition-all relative flex items-start justify-between gap-4 shadow-lg ${
                ann.priority === 'urgent'
                  ? 'bg-rose-950/40 border-rose-500/80 shadow-rose-950/30 text-rose-100'
                  : 'bg-indigo-950/30 border-indigo-500/50 shadow-indigo-950/20 text-indigo-100'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="pt-0.5">
                  {ann.priority === 'urgent' ? (
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                  ) : (
                    <Megaphone className="w-5 h-5 text-indigo-400 shrink-0" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider ${
                        ann.priority === 'urgent'
                          ? 'bg-rose-500 text-slate-950 shadow-sm shadow-rose-500/30'
                          : 'bg-indigo-500 text-slate-950 shadow-sm shadow-indigo-500/30'
                      }`}
                    >
                      {ann.priority === 'urgent' ? '🚨 URGENT ANNOUNCEMENT' : '📢 ANNOUNCEMENT'}
                    </span>
                    {ann.examTags && ann.examTags.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Targeting: {ann.examTags.join(', ')}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white">{ann.title}</h3>
                  <p className="text-xs text-slate-200 leading-relaxed">{ann.message}</p>
                </div>
              </div>

              <button
                onClick={() => handleDismissAnnouncement(ann.id)}
                className="p-1.5 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-white transition-all shrink-0"
                title="Dismiss Announcement"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AdSense In-Feed Ad Banner */}
      <AdSenseBanner slotType="inFeed" isPremium={userProfile.isPremium} />

      {/* CORE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ax-card p-5 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
            <span>Today's Study Time</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {(data.todayStudyMinutes / 60).toFixed(1)} <span className="text-xs font-normal text-slate-400">/ 10.0 hrs</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/50">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (data.todayStudyMinutes / 600) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="ax-card p-5 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
            <span>Weekly Hours</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {data.weeklyStudyHours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <div className="text-xs text-emerald-400 font-medium flex items-center">
            <Zap className="w-3.5 h-3.5 mr-1" /> +12% pace
          </div>
        </div>

        <div className="ax-card p-5 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
            <span>Syllabus Covered</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {data.overallProgressPercent}%
          </div>
          <div className="text-xs text-slate-400">
            {data.topicsCompleted} of {data.totalTopics} Topics
          </div>
        </div>

        <div className="ax-card p-5 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
            <span>Test Accuracy</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {data.testAccuracyPercent}%
          </div>
          <div className="text-xs text-emerald-400 font-medium">
            Top 5% Percentile
          </div>
        </div>
      </div>

      {/* GRAPH & AI INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 ax-card p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>All India Rank Progression</span>
          </h3>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            {data.rankTrend.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400 w-20">{item.date}</span>
                <div className="flex items-center space-x-3 flex-1 mx-4">
                  <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, 100 - item.rank))}%` }}
                    ></div>
                  </div>
                </div>
                <span className="font-bold text-indigo-300">Rank #{item.rank}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ax-card p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>AI Study Insights</span>
          </h3>

          <div className="space-y-3">
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

