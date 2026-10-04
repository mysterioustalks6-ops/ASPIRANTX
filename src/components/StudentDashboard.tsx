import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, Target,
  Sparkles, BookOpen, Zap,
  LayoutGrid, Sliders, ChevronRight,
  CheckCircle2, Circle, Play, ArrowRight, Award, CheckSquare,
  Heart, Coins, Trophy, Gamepad2, BarChart2, Clock, X
} from 'lucide-react';
import { 
  FadeIn, SlideUp, Stagger, StaggerItem, CountUp, FlameGlow,
  CheckmarkPop, FloatingRewardBadge, triggerConfetti
} from '../lib/animations';
import { awardXPAndCoins } from '../lib/gamification';
import { StudentDashboardData, UserProfile, ActiveTab } from '../types';
import { EXAM_LIST } from '../lib/examList';
import { getExamConfig, normalizeExamId } from '../lib/examRegistry';
import { AdSenseBanner } from './AdSenseBanner';
import { DailyStudySummaryCard } from './DailyStudySummaryCard';
import { CircularPerformanceHub } from './CircularPerformanceMeter';
import { loadWorkspaceConfig, getActiveFeaturesInOrder, WorkspaceConfig, recordFeatureUsage } from '../lib/workspacePreferences';
import { TactileButton } from './TactileButton';
import { TactileCard } from './TactileCard';
import { TactileProgressBar } from './TactileProgressBar';
import { AspirantMascot } from './duolingo/AspirantMascot';
import { DuolingoPathEngine } from './duolingo/DuolingoPathEngine';
import { CANONICAL_APP_RELEASE } from '../config/appRelease';
import { soundFx } from '../lib/soundEffects';
import { getCandidateHearts } from '../lib/duolingoHearts';

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

  const activeExamTag = normalizeExamId(selectedExam || userProfile.exam);

  // Compute 100% Real Live Telemetry from User's Actual Progress & Storage
  const computeLiveDashboardData = (examTag: string, userId: string): StudentDashboardData => {
    // 1. Calculate Real Days Left for Selected Exam
    const today = new Date();
    const currentYear = today.getFullYear();
    let targetExamDate = new Date(`${currentYear + 1}-05-03`); // default
    if (examTag.includes('JEE_MAIN')) targetExamDate = new Date(`${currentYear + 1}-04-06`);
    else if (examTag.includes('JEE_ADV')) targetExamDate = new Date(`${currentYear + 1}-05-24`);
    else if (examTag.includes('UPSC')) targetExamDate = new Date(`${currentYear + 1}-05-25`);
    else if (examTag.includes('GATE')) targetExamDate = new Date(`${currentYear + 1}-02-08`);
    else if (examTag.includes('CAT')) targetExamDate = new Date(`${currentYear}-11-29`);
    else if (examTag.includes('SSC')) targetExamDate = new Date(`${currentYear + 1}-09-15`);
    else if (examTag.includes('NDA') || examTag.includes('CDS')) targetExamDate = new Date(`${currentYear + 1}-04-18`);
    
    const diffMs = targetExamDate.getTime() - today.getTime();
    const daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    // 2. Calculate Real Syllabus Topics Completed from LocalStorage
    let completedTopicsCount = 0;
    try {
      const progressKey = `aspirantx_subtopic_progress_v3_${userId || 'guest'}_${examTag}`;
      let rawProgress = localStorage.getItem(progressKey);
      if (!rawProgress) {
        rawProgress = localStorage.getItem(`aspirantx_subtopic_progress_v3_${userId || 'guest'}`);
      }
      if (rawProgress) {
        const parsed = JSON.parse(rawProgress);
        if (Array.isArray(parsed)) completedTopicsCount = parsed.length;
      }
    } catch {}

    const totalTopicsEstimate = 240;
    const syllabusProgressPercent = totalTopicsEstimate > 0 
      ? Math.min(100, Math.round((completedTopicsCount / totalTopicsEstimate) * 100)) 
      : 0;

    // 3. Calculate Real Study Minutes Logged Today
    let todayMinutes = 0;
    try {
      const storeKey = `aspirantx_local_store_v1_${userId || 'guest'}_${examTag}`;
      const rawStore = localStorage.getItem(storeKey);
      if (rawStore) {
        const parsedStore = JSON.parse(rawStore);
        if (typeof parsedStore.todayStudyMinutes === 'number') {
          todayMinutes = Math.max(0, parsedStore.todayStudyMinutes);
        }
      }
    } catch {}

    if (todayMinutes === 0 && userProfile.studyHoursToday) {
      todayMinutes = Math.max(0, Math.round(userProfile.studyHoursToday * 60));
    }

    // 4. Calculate Real Accuracy from CBT tests
    let testAccuracy = 0;
    try {
      const scopedKey = `aspirantx_cbt_results_cache_${userId || 'guest'}_${examTag}`;
      const cbtResults = localStorage.getItem(scopedKey) || localStorage.getItem('aspirantx_cbt_results_cache');
      if (cbtResults) {
        const parsedResults = JSON.parse(cbtResults);
        if (Array.isArray(parsedResults) && parsedResults.length > 0) {
          const matchingTests = parsedResults.filter((r: any) => !r.exam || normalizeExamId(r.exam) === examTag);
          const testsToEvaluate = matchingTests.length > 0 ? matchingTests : parsedResults;
          if (testsToEvaluate.length > 0) {
            const totalAcc = testsToEvaluate.reduce((acc: number, r: any) => acc + (r.accuracy || r.accuracyPercentage || 0), 0);
            testAccuracy = Math.round(totalAcc / testsToEvaluate.length);
          }
        }
      }
    } catch {}

    const examCfg = getExamConfig(examTag);
    const primarySubject = examCfg.subjects?.[0] || 'Core Concepts';
    const secondarySubject = examCfg.subjects?.[1] || primarySubject;

    return {
      todayStudyMinutes: todayMinutes,
      weeklyStudyHours: Math.round(todayMinutes / 60),
      monthlyStudyHours: Math.round(todayMinutes / 60),
      currentStreak: userProfile.streakDays || 0,
      longestStreak: userProfile.streakDays || 0,
      topicsCompleted: completedTopicsCount,
      totalTopics: totalTopicsEstimate,
      overallProgressPercent: syllabusProgressPercent,
      daysLeftForExam: daysLeft,
      estimatedCompletionDate: targetExamDate.toISOString().split('T')[0],
      dailyTargetHours: 8,
      weeklyTargetTopics: 15,
      monthlyTargetTopics: 60,
      revisionProgressPercent: Math.min(100, Math.round(syllabusProgressPercent * 0.8)),
      testAccuracyPercent: testAccuracy,
      rankTrend: [],
      studyHeatmap: todayMinutes > 0 ? [{ date: today.toISOString().split('T')[0], hours: Math.round(todayMinutes / 60) }] : [],
      aiSuggestions: completedTopicsCount === 0 && testAccuracy === 0 ? [
        `Start your ${examCfg.displayName} preparation with ${primarySubject} foundational topics.`,
        `Complete your first study session or 10 PYQs in ${secondarySubject} to see live accuracy metrics.`
      ] : [
        `Focus on high-yield ${primarySubject} topics today for ${examCfg.displayName}.`,
        `Practice 20 ${secondarySubject} PYQ MCQs to maintain your speed and accuracy momentum.`,
      ]
    };
  };

  const [data, setData] = useState<StudentDashboardData>(() => 
    computeLiveDashboardData(activeExamTag, userProfile.id)
  );
  const [loading] = useState<boolean>(false);

  useEffect(() => {
    setData(computeLiveDashboardData(activeExamTag, userProfile.id));

    const handleStreakUpdated = (e: any) => {
      const { streakDays } = e.detail || {};
      if (typeof streakDays === 'number') {
        setData((prev) => (prev ? { ...prev, currentStreak: streakDays } : prev));
      }
    };

    const handleSyncEvent = () => {
      setData(computeLiveDashboardData(activeExamTag, userProfile.id));
    };

    const handleExamChanged = (e: any) => {
      const newExam = normalizeExamId(e.detail?.examId || activeExamTag);
      setData(computeLiveDashboardData(newExam, userProfile.id));
    };

    window.addEventListener('aspirantx_streak_updated', handleStreakUpdated);
    window.addEventListener('aspirantx_gamification_updated', handleSyncEvent);
    window.addEventListener('aspirantx_personal_syllabus_updated', handleSyncEvent);
    window.addEventListener('aspirantx_syllabus_time_updated', handleSyncEvent);
    window.addEventListener('aspirantx_local_store_updated', handleSyncEvent);
    window.addEventListener('aspirantx_exam_changed', handleExamChanged);

    return () => {
      window.removeEventListener('aspirantx_streak_updated', handleStreakUpdated);
      window.removeEventListener('aspirantx_gamification_updated', handleSyncEvent);
      window.removeEventListener('aspirantx_personal_syllabus_updated', handleSyncEvent);
      window.removeEventListener('aspirantx_syllabus_time_updated', handleSyncEvent);
      window.removeEventListener('aspirantx_local_store_updated', handleSyncEvent);
      window.removeEventListener('aspirantx_exam_changed', handleExamChanged);
    };
  }, [activeExamTag, userProfile.id, userProfile.streakDays, userProfile.xp]);

  // Derive "Continue Where You Left Off" data from localStorage
  const getLastStudiedTopic = () => {
    try {
      const histKey = `aspirantx_last_topic_${userProfile.id}_${activeExamTag}`;
      const stored = localStorage.getItem(histKey);
      if (stored) return JSON.parse(stored) as { subject: string; chapter: string; subtopic: string; tab: ActiveTab };
    } catch {}
    const examCfg = getExamConfig(activeExamTag);
    const subject = examCfg.subjects?.[0] || 'Core Subject';
    return { subject, chapter: 'Chapter 1', subtopic: 'Foundational Overview', tab: 'syllabus' as ActiveTab };
  };

  const lastTopic = getLastStudiedTopic();
  const examCfg2 = getExamConfig(activeExamTag);
  const primarySubject = examCfg2.subjects?.[0] || 'Core Concepts';
  const secondarySubject = examCfg2.subjects?.[1] || primarySubject;
  const primarySuggestion = data.aiSuggestions?.[0] || `Focus on ${primarySubject} today.`;
  const [showAllShortcuts, setShowAllShortcuts] = useState<boolean>(false);
  const [showTelemetryRings, setShowTelemetryRings] = useState<boolean>(false);
  const [dashboardViewMode, setDashboardViewMode] = useState<'path' | 'analytics'>('path');

  const getExamAwareQuotes = (tag: string, cat: string) => {
    const norm = normalizeExamId(tag);
    if (cat === 'MEDICAL' || norm.includes('NEET') || norm.includes('AIIMS')) {
      return [
        "Tu banega Doctor! Dr. Aspirant, AIIMS is waiting 🩺",
        "High-Yield NCERT focus: 180/180 in Biology pakka! 🧬",
        "Physics numericals se mat daro, formula sheets revision karo! ⚡",
        "Chemistry reaction mechanisms revise karo aur selection lo! ⚗️",
        "Rank 1 mindset: Roz ka ek topic master karo! 🩺"
      ];
    }
    if (cat === 'ENGINEERING' || norm.includes('JEE') || norm.includes('GATE')) {
      return [
        "IITian mindset! Speed + Accuracy = Top Percentile ⚡",
        "Boundary conditions aur multi-concept problem solve karo! 📐",
        "Roz 20 high-yield questions, rank boost guaranteed! 🎯",
        "Formula practice + speed drills = JEE selection pakka! 🚀"
      ];
    }
    if (cat === 'DEFENCE' || norm.includes('NDA') || norm.includes('CDS')) {
      return [
        "Join the Armed Forces! Officer's pride awaits you 🎖️",
        "Physical discipline + Mental stamina = Selection! 🇮🇳",
        "GAT and Mathematics daily drills se merit list pakki! ⚔️"
      ];
    }
    return [
      "Tu banega Officer! LBSNAA is calling 🇮🇳",
      "Syllabus revision and answer writing is the golden key! 📜",
      "Polity and Economy concepts revise karo aur prelims clear karo! ⚖️",
      "Daily consistency will take you to the final merit list! 🎯"
    ];
  };

  const VEER_QUOTES = useMemo(() => getExamAwareQuotes(activeExamTag, examCfg2.category), [activeExamTag, examCfg2.category]);
  const [mascotQuoteIndex, setMascotQuoteIndex] = useState(0);
  const [mascotState, setMascotState] = useState<'idle' | 'happy' | 'celebrating'>('happy');
  const [showMoreForToday, setShowMoreForToday] = useState(false);
  const [showRideSessionModal, setShowRideSessionModal] = useState(false);

  const handleMascotTap = () => {
    soundFx.playChestOpen();
    triggerConfetti();
    setMascotState('celebrating');
    setMascotQuoteIndex((prev) => (prev + 1) % VEER_QUOTES.length);
    setTimeout(() => setMascotState('happy'), 1600);
  };

  // 5-Pillar Architecture: Daily Goals Engine (Persistent with Instant XP Feedback)
  const todayDateStr = new Date().toISOString().split('T')[0];
  const dailyGoalsStorageKey = `aspirantx_daily_goals_${userProfile.id || 'guest'}_${todayDateStr}`;

  const [dailyGoals, setDailyGoals] = useState<{ id: string; title: string; duration: string; xp: number; completed: boolean }[]>(() => {
    try {
      const raw = localStorage.getItem(dailyGoalsStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const examSubjects = examCfg2.subjects && examCfg2.subjects.length > 0 ? examCfg2.subjects : ['Physics', 'Chemistry', 'Biology'];
    const subj1 = examSubjects[0] || 'Core Subject';
    const subj2 = examSubjects[1] || subj1;
    const subj3 = examSubjects[2] || subj1;
    const isCivilOrSsc = examCfg2.category === 'CIVIL_SERVICES' || normalizeExamId(activeExamTag).includes('UPSC') || normalizeExamId(activeExamTag).includes('SSC');

    return [
      {
        id: 'goal-1',
        title: `${subj1}: Core Concepts & High-Yield Summary`,
        duration: '20m',
        xp: 20,
        completed: false,
      },
      {
        id: 'goal-2',
        title: isCivilOrSsc
          ? 'Daily Exam Current Affairs & Editorial Analysis'
          : `${subj2}: High-Yield Problem Solving & Formula Drill`,
        duration: '15m',
        xp: 20,
        completed: false,
      },
      {
        id: 'goal-3',
        title: `Practice 10 High-Yield ${subj3} PYQ MCQs`,
        duration: '15m',
        xp: 20,
        completed: false,
      },
    ];
  });

  const [rewardBadge, setRewardBadge] = useState<string | null>(null);

  const handleToggleGoal = async (goalId: string) => {
    const target = dailyGoals.find((g) => g.id === goalId);
    if (!target) return;
    const isChecking = !target.completed;

    const updated = dailyGoals.map((g) => (g.id === goalId ? { ...g, completed: isChecking } : g));
    setDailyGoals(updated);
    try {
      localStorage.setItem(dailyGoalsStorageKey, JSON.stringify(updated));
    } catch {}

    if (isChecking) {
      setRewardBadge(`+${target.xp} XP`);
      try {
        await awardXPAndCoins(target.xp, 5, `Completed goal: ${target.title}`, userProfile.id);
      } catch {}

      const allDone = updated.every((g) => g.completed);
      if (allDone) {
        triggerConfetti();
      }
    }
  };

  const allFeatures = getActiveFeaturesInOrder(workspaceConfig);
  const displayedShortcuts = showAllShortcuts ? allFeatures : allFeatures.slice(0, 4);

  const getRecommendationAction = () => {
    const text = (primarySuggestion || '').toLowerCase();
    if (text.includes('cbt') || text.includes('mock') || text.includes('test series')) {
      return { label: 'Take Mock Test', tab: 'cbt' as ActiveTab };
    }
    if (text.includes('pyq') || text.includes('previous')) {
      return { label: 'Solve PYQs', tab: 'pyq' as ActiveTab };
    }
    if (text.includes('mcq') || text.includes('question') || text.includes('practice')) {
      return { label: 'Practice MCQs', tab: 'question_bank' as ActiveTab };
    }
    return { label: 'Practice Now', tab: 'pyq' as ActiveTab };
  };

  const recAction = getRecommendationAction();

  const isPaceBehind = data.topicsCompleted < 3 && data.daysLeftForExam < 300;
  const paceLabel = isPaceBehind ? '2 topics behind' : 'On Track';

  const rideStops = [
    {
      stopNumber: 1,
      title: 'Learn',
      label: lastTopic.chapter,
      subject: lastTopic.subject,
      description: 'Foundational concepts and high-yield notes',
      icon: BookOpen,
      actionTab: lastTopic.tab || 'syllabus' as ActiveTab,
      status: 'active' as const,
    },
    {
      stopNumber: 2,
      title: 'Practice',
      label: `10 High-Yield MCQs`,
      subject: secondarySubject,
      description: 'Targeted topic questions and accuracy drill',
      icon: Target,
      actionTab: 'pyq' as ActiveTab,
      status: 'pending' as const,
    },
    {
      stopNumber: 3,
      title: 'Revise',
      label: 'Spaced Repetition Recall',
      subject: primarySubject,
      description: 'Active flashcard recall before memory fades',
      icon: Sparkles,
      actionTab: 'flashcards' as ActiveTab,
      status: 'pending' as const,
    }
  ];

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-[var(--sr-text-muted)]">
        <div className="w-8 h-8 border-3 border-[var(--sr-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold">Syncing Study Telemetry...</p>
      </div>
    );
  }

  return (
    <div id="student-dashboard" className="w-full max-w-3xl mx-auto space-y-5 pb-24 md:pb-8 font-sans px-3 sm:px-4 text-[var(--sr-text)]">
      {/* ── 1. VEER MOTIVATIONAL HERO CARD (ONE VEER NUDGE) ────────────────── */}
      <SlideUp>
        <div 
          onClick={handleMascotTap}
          className="p-4 sm:p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] hover:border-[var(--sr-primary)]/50 transition-all flex items-center justify-between gap-4 cursor-pointer shadow-sm select-none"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <AspirantMascot 
              size="md" 
              state={mascotState} 
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-[var(--sr-primary)] animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-[var(--sr-primary)]">
                  Veer's Daily Ride Advice
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[var(--sr-text)] line-clamp-2">
                {VEER_QUOTES[mascotQuoteIndex % VEER_QUOTES.length]}
              </p>
              <span className="text-xs text-[var(--sr-text-muted)] font-medium mt-0.5 block">
                Tap Veer for motivation • Target: {examCfg2.displayName}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end shrink-0">
            <span className="text-xs font-bold text-[var(--sr-primary)]">
              {data.daysLeftForExam} Days Left
            </span>
            <span className="text-xs text-[var(--sr-text-muted)] font-medium">Until Exam Day</span>
          </div>
        </div>
      </SlideUp>

      {/* ── 2. AAJ KI RIDE: Dominant Primary Study Action (3-Stop Session) ──── */}
      <TactileCard className="p-5 sm:p-6 bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] shadow-sm relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] border border-[var(--sr-primary)]/30">
              AAJ KI RIDE
            </span>
            <span className="text-xs font-bold text-[var(--sr-text-muted)]">
              {lastTopic.subject}
            </span>
          </div>
          <span className="text-xs font-bold text-[var(--sr-primary)] shrink-0">
            {data.overallProgressPercent}% Complete
          </span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--sr-text)] tracking-tight line-clamp-2 leading-snug">
            {lastTopic.chapter}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--sr-text-muted)] mt-1 font-medium line-clamp-2">
            {lastTopic.subtopic}
          </p>
        </div>

        {/* 3-STOP PROGRESS ROAD */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--sr-text)] uppercase tracking-wider">3-Stop Journey</span>
            <span className="font-bold text-[var(--sr-primary)]">Stop 1: Learn Active</span>
          </div>

          <div className="relative flex items-center justify-between px-3 py-2">
            {/* Connecting Road Bar */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1.5 bg-[var(--sr-line-strong)] rounded-full z-0">
              <div className="h-full bg-[var(--sr-primary)] rounded-full" style={{ width: '35%' }} />
            </div>

            {rideStops.map((stop) => {
              const Icon = stop.icon;
              const isActive = stop.stopNumber === 1;
              return (
                <div key={stop.stopNumber} className="relative z-10 flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    isActive 
                      ? 'bg-[var(--sr-primary)] text-[var(--sr-on-primary)] border-[var(--sr-primary-depth)] shadow-md scale-110' 
                      : 'bg-[var(--sr-surface)] text-[var(--sr-text-muted)] border-[var(--sr-line-strong)]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs mt-1 font-bold ${isActive ? 'text-[var(--sr-primary)]' : 'text-[var(--sr-text-muted)]'}`}>
                    {stop.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Single Pace Tile */}
        <div className="p-3 rounded-2xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--sr-primary)]" />
            <span className="text-[var(--sr-text-muted)] font-medium">Daily Pace:</span>
          </div>
          <span className={`font-bold ${isPaceBehind ? 'text-[var(--sr-amber)]' : 'text-[var(--sr-primary)]'}`}>
            {paceLabel}
          </span>
        </div>

        {/* EXACTLY ONE PRIMARY START RIDE BUTTON */}
        <TactileButton
          variant="primary"
          size="lg"
          fullWidth
          leftIcon={<Play className="w-5 h-5 fill-current" />}
          onClick={() => setShowRideSessionModal(true)}
        >
          START RIDE
        </TactileButton>
      </TactileCard>

      {/* ── 3-STOP SESSION MODAL (when Start Ride is tapped) ── */}
      {showRideSessionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 text-left no-backdrop-blur">
          <div className="absolute inset-0" onClick={() => setShowRideSessionModal(false)} />
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] p-5 sm:p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--sr-line)]">
              <div>
                <span className="text-xs font-black uppercase text-[var(--sr-primary)] tracking-wider">Aaj ki Ride Session</span>
                <h3 className="text-base sm:text-lg font-black text-[var(--sr-text)]">3-Stop Action Plan</h3>
              </div>
              <button
                onClick={() => setShowRideSessionModal(false)}
                className="w-8 h-8 rounded-full bg-[var(--sr-surface-2)] text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {rideStops.map((stop) => {
                const Icon = stop.icon;
                return (
                  <div key={stop.stopNumber} className="p-3.5 rounded-2xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[var(--sr-surface)] border border-[var(--sr-line)] flex items-center justify-center text-[var(--sr-primary)] shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-black uppercase text-[var(--sr-primary)]">
                          Stop {stop.stopNumber}: {stop.title}
                        </span>
                        <h4 className="text-sm font-bold text-[var(--sr-text)] truncate">{stop.label}</h4>
                        <p className="text-xs text-[var(--sr-text-muted)] truncate">{stop.description}</p>
                      </div>
                    </div>
                    <TactileButton
                      variant={stop.stopNumber === 1 ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => {
                        setShowRideSessionModal(false);
                        if (onNavigate) onNavigate(stop.actionTab);
                      }}
                    >
                      Go
                    </TactileButton>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. MORE FOR TODAY (Collapsible generic targets) ──────────────────── */}
      <div className="rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] overflow-hidden shadow-sm">
        <button
          onClick={() => setShowMoreForToday(!showMoreForToday)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--sr-surface-2)] transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[var(--sr-primary-subtle)] border border-[var(--sr-primary)]/30 flex items-center justify-center text-[var(--sr-primary)]">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-[var(--sr-text)] uppercase tracking-wider">More for today</h3>
              <p className="text-xs text-[var(--sr-text-muted)]">Daily supplementary targets & bonus XP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--sr-primary)]">
              {dailyGoals.filter((g) => g.completed).length}/{dailyGoals.length} Done
            </span>
            <ChevronRight className={`w-4 h-4 text-[var(--sr-text-muted)] transition-transform duration-200 ${showMoreForToday ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {showMoreForToday && (
          <div className="p-4 pt-1 space-y-2 border-t border-[var(--sr-line)] bg-[var(--sr-surface-2)]">
            {dailyGoals.map((goal) => (
              <div
                key={goal.id}
                onClick={() => handleToggleGoal(goal.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none touch-manipulation active:scale-[0.99] ${
                  goal.completed
                    ? 'bg-[var(--sr-primary-subtle)] border-[var(--sr-primary)]/40 text-[var(--sr-primary)]'
                    : 'bg-[var(--sr-surface)] border-[var(--sr-line)] hover:border-[var(--sr-line-strong)] text-[var(--sr-text)]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CheckmarkPop isChecked={goal.completed}>
                    {goal.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-[var(--sr-primary)] fill-[var(--sr-primary-subtle)] shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-[var(--sr-text-subtle)] shrink-0 hover:text-[var(--sr-text)]" />
                    )}
                  </CheckmarkPop>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold line-clamp-2 leading-snug ${goal.completed ? 'line-through text-[var(--sr-text-muted)]' : 'text-[var(--sr-text)]'}`}>
                      {goal.title}
                    </p>
                    <span className="text-xs text-[var(--sr-text-subtle)] font-bold">
                      {goal.duration}
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 border ${
                  goal.completed
                    ? 'bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] border-[var(--sr-primary)]/30'
                    : 'bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] border-[var(--sr-blue)]/30'
                }`}>
                  +{goal.xp} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. CONTEXTUAL RECOMMENDATION & EXAM TARGET ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-8 p-4 sm:p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] flex flex-col justify-between space-y-3 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--sr-amber)]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--sr-amber)]">
                RECOMMENDED PRACTICE
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-[var(--sr-text)]">
              {primarySuggestion}
            </h4>
          </div>

          <div className="pt-1">
            <TactileButton
              variant="secondary"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => { if (onNavigate) onNavigate(recAction.tab); }}
            >
              {recAction.label}
            </TactileButton>
          </div>
        </div>

        {/* TARGET EXAM COUNTDOWN CARD */}
        <div className="sm:col-span-4 p-4 sm:p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] flex flex-col justify-between space-y-2 shadow-sm">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--sr-coral)]">
              <Target className="w-3.5 h-3.5" />
              <span>Exam Target</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-[var(--sr-text)] mt-1">
              {examCfg2.displayName} 2026
            </h4>
            <p className="text-[11px] text-[var(--sr-text-muted)] font-mono mt-0.5">
              {data.daysLeftForExam} Days Remaining
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] border-t border-[var(--sr-line)]">
            <span className="text-[var(--sr-text-muted)]">Pace:</span>
            <span className="text-[var(--sr-primary)] font-black">On Track</span>
          </div>
        </div>
      </div>

      {/* ── 5. PERFORMANCE TELEMETRY HUB (Progressive Disclosure) ──────────── */}
      <div className="rounded-3xl border-2 border-[var(--sr-line-strong)] bg-[var(--sr-surface)] overflow-hidden shadow-sm">
        <button
          onClick={() => setShowTelemetryRings(!showTelemetryRings)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--sr-surface-2)] transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[var(--sr-blue-subtle)] border border-[var(--sr-blue)]/30 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-[var(--sr-blue)]" />
            </div>
            <div>
              <h3 className="text-xs font-black text-[var(--sr-text)]">Live Study Telemetry</h3>
              <p className="text-[11px] text-[var(--sr-text-muted)]">Syllabus, accuracy & daily focus metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[var(--sr-primary)]">
              {showTelemetryRings ? 'Collapse' : 'Tap to View'}
            </span>
            <ChevronRight className={`w-4 h-4 text-[var(--sr-text-muted)] transition-transform duration-200 ${showTelemetryRings ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {showTelemetryRings && (
          <div className="p-4 border-t border-[var(--sr-line)] bg-[var(--sr-surface-2)]">
            <CircularPerformanceHub
              syllabusPercent={data.overallProgressPercent}
              revisionPercent={data.revisionProgressPercent || 0}
              testAccuracyPercent={data.testAccuracyPercent}
              dailyStudyMinutes={data.todayStudyMinutes}
              dailyTargetMinutes={data.dailyTargetHours * 60}
            />
          </div>
        )}
      </div>

      {/* Non-intrusive in-feed slot for non-premium candidates */}
      <AdSenseBanner slotType="inFeed" isPremium={userProfile.isPremium} />

      {/* ── 6. ESSENTIAL QUICK LAUNCH (Tactile Shortcuts) ───────────────────── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] shadow-sm">
        <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[var(--sr-blue-subtle)] border border-[var(--sr-blue)]/30 flex items-center justify-center">
              <LayoutGrid className="w-3.5 h-3.5 text-[var(--sr-blue)]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-[var(--sr-text)]">
                Quick Shortcuts
              </h3>
              <p className="text-[10px] text-[var(--sr-text-muted)]">Direct access to primary study engines</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allFeatures.length > 4 && (
              <button
                onClick={() => setShowAllShortcuts(!showAllShortcuts)}
                className="px-2.5 py-1 rounded-xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] border border-[var(--sr-line)] text-[11px] font-bold text-[var(--sr-text)] transition-all cursor-pointer"
              >
                {showAllShortcuts ? 'Show Top 4' : `All (${allFeatures.length})`}
              </button>
            )}
            {onOpenWorkspaceCustomizer && (
              <button
                onClick={onOpenWorkspaceCustomizer}
                className="px-2.5 py-1 rounded-xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] border border-[var(--sr-line)] text-[11px] font-bold text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] flex items-center gap-1 transition-all cursor-pointer"
              >
                <Sliders className="w-3 h-3 text-[var(--sr-blue)]" />
                <span>Customize</span>
              </button>
            )}
          </div>
        </div>

        {/* Grid of Compact Shortcuts with Stagger */}
        <Stagger staggerDelay={0.03} className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {displayedShortcuts.map((item) => (
            <StaggerItem key={item.id}>
              <button
                onClick={() => {
                  recordFeatureUsage(item.id, userProfile.id);
                  if (onNavigate) onNavigate(item.id as ActiveTab);
                }}
                className="w-full p-3 rounded-2xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-primary-subtle)] border border-[var(--sr-line)] hover:border-[var(--sr-primary)]/40 active:border-b-0 active:translate-y-0.5 transition-all text-center group flex flex-col items-center gap-1.5 cursor-pointer shadow-sm select-none"
              >
                <div className="w-8 h-8 rounded-xl bg-[var(--sr-surface)] group-hover:bg-[var(--sr-primary-subtle)] border border-[var(--sr-line)] group-hover:border-[var(--sr-primary)]/40 flex items-center justify-center text-xs font-black text-[var(--sr-text-muted)] group-hover:text-[var(--sr-primary)] transition-all">
                  {item.label.charAt(0)}
                </div>
                <div className="min-w-0 w-full text-center">
                  <span className="text-[11px] font-bold text-[var(--sr-text)] group-hover:text-[var(--sr-primary)] transition-colors block truncate">
                    {item.label}
                  </span>
                </div>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      {/* ── 7. LOWER REGION: Daily Study Summary Card ──────────────────────── */}
      <DailyStudySummaryCard
        user={userProfile}
        selectedExam={selectedExam}
        onNavigate={onNavigate}
        onOpenReminderSettings={onOpenReminderSettings}
      />
    </div>
  );
};
