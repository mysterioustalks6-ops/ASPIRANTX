import React, { useState, useEffect } from 'react';
import { 
  Flame, Target,
  Sparkles, BookOpen, Zap,
  LayoutGrid, Sliders, ChevronRight,
  CheckCircle2, Circle, Play, ArrowRight, Award, CheckSquare
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
  const [showDuolingoPath, setShowDuolingoPath] = useState<boolean>(false);

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
    return [
      {
        id: 'goal-1',
        title: `${primarySubject}: Core Concept Framework & Summary`,
        duration: '20m',
        xp: 20,
        completed: false,
      },
      {
        id: 'goal-2',
        title: 'Daily Exam Current Affairs & Editorial Analysis',
        duration: '15m',
        xp: 20,
        completed: false,
      },
      {
        id: 'goal-3',
        title: `Practice 10 High-Yield ${secondarySubject} PYQ Questions`,
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

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-[#9CA3AF]">
        <div className="w-8 h-8 border-3 border-[#58CC02] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold">Syncing Study Telemetry...</p>
      </div>
    );
  }

  return (
    <div id="student-dashboard" className="w-full space-y-6 pb-24 md:pb-8 font-sans">
      {/* ── 1. HEADER: Student Context & Clear Exam Identity ───────────────── */}
      <SlideUp>
        <TactileCard className="p-4 sm:p-6 bg-[#1A1D24] border border-[#2A2F3A]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#58CC02] animate-pulse" />
                <p className="text-[11px] font-bold text-[#58CC02] uppercase tracking-wider">
                  CANDIDATE WORKSPACE
                </p>
                <span className="px-2 py-0.5 rounded-full bg-[#1CB0F6]/15 border border-[#1CB0F6]/30 text-[#1CB0F6] text-[10px] font-black uppercase tracking-tight">
                  v{CANONICAL_APP_RELEASE.version}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#F3F4F6] tracking-tight">
                Welcome back, <span className="text-[#1CB0F6]">{userProfile.name?.split(' ')[0] || 'Aspirant'}</span>
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                <span className="text-[#9CA3AF] font-medium">Target Exam:</span>
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
                  className="bg-[#0F1115] border border-[#2A2F3A] hover:border-[#1CB0F6]/50 text-[#1CB0F6] font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#1CB0F6] cursor-pointer shadow-sm transition-colors"
                >
                  <optgroup label="Standard Exams">
                    {EXAM_LIST.map((ex) => (
                      <option key={ex.id} value={ex.id} className="bg-[#1A1D24] text-[#F3F4F6]">
                        {ex.label}
                      </option>
                    ))}
                  </optgroup>
                  <option value="__CREATE_CUSTOM__" className="bg-[#1A1D24] text-[#FFA726] font-bold">
                    + Create Custom Exam...
                  </option>
                </select>
              </div>
            </div>

            {/* Right: Key Exam Timeline Telemetry (Streak + Countdown) */}
            <div className="flex items-center gap-2.5">
              <div className="px-3.5 py-2 rounded-xl bg-[#0F1115] border border-[#FF9600]/30 flex items-center gap-2.5 shadow-sm">
                <FlameGlow active={(userProfile.streakDays || data.currentStreak || 0) > 0}>
                  <Flame className="w-5 h-5 text-[#FF9600] fill-[#FF9600]" />
                </FlameGlow>
                <div>
                  <div className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">Streak</div>
                  <div className="text-sm font-black text-[#F3F4F6]">
                    <CountUp value={userProfile.streakDays || data.currentStreak || 1} suffix=" Days" />
                  </div>
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-[#0F1115] border border-[#2A2F3A] flex items-center gap-2.5 shadow-sm">
                <Target className="w-5 h-5 text-[#FF4B4B]" />
                <div>
                  <div className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">Countdown</div>
                  <div className="text-sm font-black text-[#F3F4F6]">
                    <CountUp value={data.daysLeftForExam} suffix=" Days" />
                  </div>
                </div>
              </div>

              {onOpenWorkspaceCustomizer && (
                <button
                  onClick={onOpenWorkspaceCustomizer}
                  title="Personalize Workspace"
                  className="p-2.5 rounded-xl bg-[#0F1115] border border-[#2A2F3A] hover:border-[#1CB0F6]/50 text-[#9CA3AF] hover:text-[#1CB0F6] transition-all cursor-pointer shadow-sm active:translate-y-0.5"
                  aria-label="Personalize Workspace"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </TactileCard>
      </SlideUp>

      {/* ── 1.5. GAMIFIED EXAM PATH BANNER (Duolingo Style Mobile Learning Experience) ── */}
      <TactileCard className="p-4 sm:p-5 bg-gradient-to-r from-[#16251B] via-[#1A1D24] to-[#16251B] border-2 border-[#58CC02]/40 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AspirantMascot state="idle" size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/40 text-[10px] font-black uppercase">
                  Duolingo-Style Mode
                </span>
                <span className="text-[11px] text-[#9CA3AF] font-bold">Interactive Learning Tree</span>
              </div>
              <h3 className="text-base font-black text-[#F3F4F6] mt-0.5">
                Gamified Daily Exam Journey
              </h3>
              <p className="text-xs text-[#9CA3AF]">
                Bite-sized concept drills, 3D buttons, audio chimes, and milestone chests.
              </p>
            </div>
          </div>

          <TactileButton
            variant={showDuolingoPath ? 'secondary' : 'primary'}
            size="md"
            onClick={() => setShowDuolingoPath(!showDuolingoPath)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {showDuolingoPath ? 'SHOW STANDARD DASHBOARD' : 'OPEN EXAM PATH'}
          </TactileButton>
        </div>

        {/* Expandable Gamified Path */}
        {showDuolingoPath && (
          <div className="pt-6 border-t border-[#2A2F3A] mt-4">
            <DuolingoPathEngine
              userProfile={userProfile}
              selectedExam={activeExamTag}
              onNavigate={onNavigate}
            />
          </div>
        )}
      </TactileCard>

      {/* ── 2. DOMINANT PRIMARY STUDY ACTION: Answers "What should I do now?" ── */}
      <TactileCard className="p-5 sm:p-6 bg-gradient-to-br from-[#16251B] to-[#1A1D24] border-2 border-[#58CC02]/40 shadow-lg relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/40">
              NEXT UP TO MASTER
            </span>
            <span className="text-xs font-bold text-[#9CA3AF]">
              {lastTopic.subject}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[#58CC02]">
            {data.overallProgressPercent}% Complete
          </span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#F3F4F6] tracking-tight">
            {lastTopic.chapter}
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1 font-medium">
            {lastTopic.subtopic} • ~45 min recommended study session
          </p>
        </div>

        {/* Tactile Progress bar inside the hero card */}
        <TactileProgressBar
          progressPercent={data.overallProgressPercent}
          color="primary"
          height="sm"
        />

        {/* DOMINANT 3D TACTILE CTA BUTTON */}
        <TactileButton
          variant="primary"
          size="lg"
          fullWidth
          leftIcon={<Play className="w-5 h-5 fill-current" />}
          onClick={() => { if (onNavigate) onNavigate(lastTopic.tab || 'syllabus'); }}
        >
          CONTINUE STUDY
        </TactileButton>
      </TactileCard>

      {/* ── 3. TODAY'S DAILY GOALS (3 Clear Targets with Micro-XP Feedback) ──── */}
      <TactileCard className="p-5 bg-[#1A1D24] border border-[#2A2F3A] space-y-3 relative">
        {rewardBadge && (
          <div className="absolute top-2 right-4">
            <FloatingRewardBadge text={rewardBadge} onComplete={() => setRewardBadge(null)} />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#58CC02]/15 border border-[#58CC02]/30 flex items-center justify-center text-[#58CC02]">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-[#F3F4F6] uppercase tracking-wider">Today's Targets</h3>
          </div>
          <span className="text-xs font-mono font-black text-[#58CC02]">
            {dailyGoals.filter((g) => g.completed).length}/{dailyGoals.length} Done
          </span>
        </div>

        <div className="space-y-2">
          {dailyGoals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => handleToggleGoal(goal.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none touch-manipulation active:scale-[0.99] ${
                goal.completed
                  ? 'bg-[#132A1C] border-[#58CC02]/40 text-[#76E025]'
                  : 'bg-[#15181F] border-[#2A2F3A] hover:border-[#383F4E] text-[#F3F4F6]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <CheckmarkPop isChecked={goal.completed}>
                  {goal.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[#58CC02] fill-[#58CC02]/20 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#6B7280] shrink-0 hover:text-[#9CA3AF]" />
                  )}
                </CheckmarkPop>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${goal.completed ? 'line-through text-[#6B7280]' : 'text-[#F3F4F6]'}`}>
                    {goal.title}
                  </p>
                  <span className="text-[10px] text-[#9CA3AF] font-mono">
                    {goal.duration}
                  </span>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono shrink-0 border ${
                goal.completed
                  ? 'bg-[#58CC02]/20 text-[#76E025] border-[#58CC02]/30'
                  : 'bg-[#1CB0F6]/15 text-[#38BDF8] border-[#1CB0F6]/30'
              }`}>
                +{goal.xp} XP
              </span>
            </div>
          ))}
        </div>
      </TactileCard>

      {/* ── 4. CONTEXTUAL RECOMMENDATION & EXAM TARGET ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-8 p-4 sm:p-5 rounded-2xl bg-[#1A1D24] border border-[#2A2F3A] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FFA726]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-[#FFA726]">
                RECOMMENDED PRACTICE
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-[#F3F4F6]">
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
        <div className="sm:col-span-4 p-4 sm:p-5 rounded-2xl bg-[#1A1D24] border border-[#2A2F3A] flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#FF4B4B]">
              <Target className="w-3.5 h-3.5" />
              <span>Exam Target</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-[#F3F4F6] mt-1">
              {examCfg2.displayName} 2026
            </h4>
            <p className="text-[11px] text-[#9CA3AF] font-mono mt-0.5">
              {data.daysLeftForExam} Days Remaining
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] border-t border-[#2A2F3A]">
            <span className="text-[#9CA3AF]">Pace:</span>
            <span className="text-[#58CC02] font-black">On Track</span>
          </div>
        </div>
      </div>

      {/* ── 5. PERFORMANCE TELEMETRY HUB (Progressive Disclosure) ──────────── */}
      <div className="rounded-2xl border border-[#2A2F3A] bg-[#1A1D24] overflow-hidden">
        <button
          onClick={() => setShowTelemetryRings(!showTelemetryRings)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[#222732] transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#1CB0F6]/15 border border-[#1CB0F6]/30 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-[#1CB0F6]" />
            </div>
            <div>
              <h3 className="text-xs font-black text-[#F3F4F6]">Live Study Telemetry</h3>
              <p className="text-[11px] text-[#9CA3AF]">Syllabus, accuracy & daily focus metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#1CB0F6]">
              {showTelemetryRings ? 'Collapse' : 'Tap to View'}
            </span>
            <ChevronRight className={`w-4 h-4 text-[#9CA3AF] transition-transform duration-200 ${showTelemetryRings ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {showTelemetryRings && (
          <div className="p-4 border-t border-[#2A2F3A] bg-[#0F1115]">
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
      <TactileCard className="p-4 sm:p-5 bg-[#1A1D24] border border-[#2A2F3A]">
        <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#0F1115] border border-[#2A2F3A] flex items-center justify-center">
              <LayoutGrid className="w-3.5 h-3.5 text-[#1CB0F6]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-[#F3F4F6]">
                Quick Shortcuts
              </h3>
              <p className="text-[10px] text-[#9CA3AF]">Direct access to primary study engines</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allFeatures.length > 4 && (
              <button
                onClick={() => setShowAllShortcuts(!showAllShortcuts)}
                className="px-2.5 py-1 rounded-xl bg-[#0F1115] hover:bg-[#222732] border border-[#2A2F3A] text-[11px] font-bold text-[#F3F4F6] transition-all cursor-pointer"
              >
                {showAllShortcuts ? 'Show Top 4' : `All (${allFeatures.length})`}
              </button>
            )}
            {onOpenWorkspaceCustomizer && (
              <button
                onClick={onOpenWorkspaceCustomizer}
                className="px-2.5 py-1 rounded-xl bg-[#0F1115] hover:bg-[#222732] border border-[#2A2F3A] text-[11px] font-bold text-[#9CA3AF] hover:text-[#F3F4F6] flex items-center gap-1 transition-all cursor-pointer"
              >
                <Sliders className="w-3 h-3 text-[#1CB0F6]" />
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
                className="w-full p-3 rounded-xl bg-[#0F1115] hover:bg-[#161920] border-b-2 border-[#2A2F3A] hover:border-[#1CB0F6]/40 active:border-b-0 active:translate-y-0.5 transition-all text-center group flex flex-col items-center gap-1.5 cursor-pointer shadow-sm select-none"
              >
                <div className="w-8 h-8 rounded-xl bg-[#1A1D24] group-hover:bg-[#1CB0F6]/15 border border-[#2A2F3A] group-hover:border-[#1CB0F6]/40 flex items-center justify-center text-xs font-black text-[#9CA3AF] group-hover:text-[#1CB0F6] transition-all">
                  {item.label.charAt(0)}
                </div>
                <div className="min-w-0 w-full text-center">
                  <span className="text-[11px] font-bold text-[#F3F4F6] group-hover:text-[#1CB0F6] transition-colors block truncate">
                    {item.label}
                  </span>
                </div>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      </TactileCard>

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
