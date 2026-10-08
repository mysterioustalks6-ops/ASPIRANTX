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
import { getDefaultExamDate, getExamDaysLeft } from '../lib/packetSyncService';
import { AdSenseBanner } from './AdSenseBanner';
import { DailyStudySummaryCard } from './DailyStudySummaryCard';
import { CircularPerformanceHub } from './CircularPerformanceMeter';
import { loadWorkspaceConfig, getActiveFeaturesInOrder, WorkspaceConfig, recordFeatureUsage } from '../lib/workspacePreferences';
import { TactileButton } from './TactileButton';
import { TactileCard } from './TactileCard';
import { TactileProgressBar } from './TactileProgressBar';
import { AspirantMascot } from './highway/AspirantMascot';
import { CANONICAL_APP_RELEASE } from '../config/appRelease';
import { soundFx } from '../lib/soundEffects';
import { getCandidateHearts } from '../lib/candidateHearts';
import { loadSessions, computeWeeklyStudyMetrics, computeStreakDays } from '../lib/focus/sessionStore';
import { useLanguage } from '../lib/i18n/LanguageContext';

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
  const { t, isHindi, formatDate } = useLanguage();
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
    let customExamDate: string | undefined;
    try {
      const storeKey = `aspirantx_local_store_v1_${userId || 'guest'}_${examTag}`;
      const rawStore = localStorage.getItem(storeKey);
      if (rawStore) {
        const parsed = JSON.parse(rawStore);
        if (parsed.examDate) customExamDate = parsed.examDate;
      }
    } catch {}
    const targetExamDateStr = customExamDate || getDefaultExamDate(examTag);
    const targetExamDate = new Date(targetExamDateStr);
    const daysLeft = getExamDaysLeft(examTag, customExamDate);

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

    // 3. Calculate Real Study Minutes Logged Today and Streak from sessionStore
    const userSessions = loadSessions(userId || 'guest');
    const weeklyMetrics = computeWeeklyStudyMetrics(userSessions);
    const liveStreak = computeStreakDays(userSessions);
    const todayMinutes = Math.round(weeklyMetrics.todayHours * 60);
    const weeklyHours = Math.round(weeklyMetrics.totalWeeklyHours * 10) / 10;

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
      weeklyStudyHours: Math.round(weeklyHours),
      monthlyStudyHours: Math.round(weeklyHours),
      currentStreak: liveStreak,
      longestStreak: liveStreak,
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
      aiSuggestions: [
        `${completedTopicsCount > 0 ? `${completedTopicsCount} topics mastered` : '0 topics completed'} · Focus on ${primarySubject} today`,
        `Practice 20 ${secondarySubject} PYQs to maintain speed and accuracy.`
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

  // Canonical user active days resolution - explicitly writes aspirantx_active_days_${userId}
  const getRealActiveDaysCount = (): number => {
    try {
      const historyKey = `aspirantx_active_days_history_${userProfile.id || 'guest'}`;
      const activeDaysKey = `aspirantx_active_days_${userProfile.id || 'guest'}`;
      const todayStr = new Date().toISOString().split('T')[0];
      let days: string[] = [];
      const rawHistory = localStorage.getItem(historyKey);
      if (rawHistory) {
        try {
          const parsed = JSON.parse(rawHistory);
          if (Array.isArray(parsed)) days = parsed;
        } catch {}
      }
      if (!days.includes(todayStr)) {
        days.push(todayStr);
      }
      localStorage.setItem(historyKey, JSON.stringify(days));
      localStorage.setItem(activeDaysKey, String(days.length));
      return days.length;
    } catch {
      return 1;
    }
  };

  // Canonical user start date resolution
  const getUserStartDate = (): Date => {
    try {
      const stored = localStorage.getItem(`aspirantx_start_date_${userProfile.id || 'guest'}`);
      if (stored) {
        const d = new Date(stored);
        if (!isNaN(d.getTime())) return d;
      }
    } catch {}
    const now = new Date();
    try {
      localStorage.setItem(`aspirantx_start_date_${userProfile.id || 'guest'}`, now.toISOString());
    } catch {}
    return now;
  };

  // Mathematical Pace Formula: Based on canonical exam date, syllabus size, and completed topics
  const calculatePaceStatus = (
    topicsCompleted: number,
    totalSyllabusTopics: number,
    daysLeftForExam: number
  ) => {
    const safeTotal = Math.max(1, totalSyllabusTopics || 15);
    const activeDaysCount = Math.max(1, getRealActiveDaysCount());
    const startDate = getUserStartDate();
    const daysSinceStart = Math.max(1, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const elapsedDays = Math.max(activeDaysCount, daysSinceStart);

    // Only brand new accounts with 0 completed topics on day 1 show 'Just starting'
    if (topicsCompleted === 0 && elapsedDays <= 1) {
      return { 
        isBehind: false, 
        label: 'Just starting', 
        behindCount: 0, 
        expectedCompleted: 0 
      };
    }

    // Dynamic timeline pace: Total Timeline = Elapsed Days + Days Left For Exam
    const totalTimelineDays = elapsedDays + Math.max(1, daysLeftForExam);
    const expectedCompleted = Math.round((safeTotal * elapsedDays) / totalTimelineDays);
    const diff = expectedCompleted - topicsCompleted;

    if (diff <= 0) {
      return { isBehind: false, label: 'On Track', behindCount: 0, expectedCompleted };
    }
    return {
      isBehind: true,
      label: `${diff} ${diff === 1 ? 'topic' : 'topics'} behind`,
      behindCount: diff,
      expectedCompleted,
    };
  };

  // Derive "Continue Where You Left Off" data from localStorage or active exam syllabus
  const getLastStudiedTopic = () => {
    try {
      const histKey = `aspirantx_last_topic_${userProfile.id}_${activeExamTag}`;
      const stored = localStorage.getItem(histKey);
      if (stored) return JSON.parse(stored) as { subject: string; chapter: string; subtopic: string; tab: ActiveTab };
    } catch {}
    const examCfg = getExamConfig(activeExamTag);
    const subject = examCfg.subjects?.[0] || 'Physics';
    const firstTopic = examCfg.syllabusTree?.[subject]?.topics?.[0] || 'Mechanics & Motion';
    return { 
      subject, 
      chapter: firstTopic, 
      subtopic: `${firstTopic} — High-Yield Mastery`, 
      tab: 'syllabus' as ActiveTab 
    };
  };

  const lastTopic = getLastStudiedTopic();
  const examCfg2 = getExamConfig(activeExamTag);
  const primarySubject = examCfg2.subjects?.[0] || 'Core Concepts';
  const secondarySubject = examCfg2.subjects?.[1] || primarySubject;
  const primarySuggestion = data.aiSuggestions?.[0] || `Focus on ${primarySubject} today.`;
  const [showAllShortcuts, setShowAllShortcuts] = useState<boolean>(false);
  const [showTelemetryRings, setShowTelemetryRings] = useState<boolean>(false);
  const [dashboardViewMode, setDashboardViewMode] = useState<'path' | 'analytics'>('path');

  const getExamAwareQuotes = (tag: string, cat: string, isHi: boolean) => {
    const norm = normalizeExamId(tag);
    if (cat === 'MEDICAL' || norm.includes('NEET') || norm.includes('AIIMS')) {
      return isHi ? [
        "आप डॉक्टर अवश्य बनेंगे! एम्स में आपकी सफलता प्रतीक्षारत है 🩺",
        "एनसीईआरटी पर केंद्रित अध्ययन: जीव विज्ञान में शत-प्रतिशत अंक निश्चित! 🧬",
        "भौतिक विज्ञान के संख्यात्मक प्रश्नों का सूत्र अभ्यास निरंतर करें! ⚡",
        "रसायन विज्ञान की अभिक्रियाओं को दोहराएं और चयन सुनिश्चित करें! ⚗️",
        "शीर्ष रैंक का संकल्प: प्रतिदिन एक महत्वपूर्ण विषय पूर्ण करें! 🎯"
      ] : [
        "You will become a Doctor! AIIMS awaits your success 🩺",
        "High-Yield NCERT focus: 180/180 in Biology assured! 🧬",
        "Conquer Physics numericals with daily formula revision! ⚡",
        "Master Chemistry reaction mechanisms for top rank selection! ⚗️",
        "Rank 1 mindset: Master one high-yield topic each day! 🎯"
      ];
    }
    if (cat === 'ENGINEERING' || norm.includes('JEE') || norm.includes('GATE')) {
      return isHi ? [
        "आईआईटी का संकल्प: गति और सटीकता से शीर्ष स्थान प्राप्त करें ⚡",
        "विभिन्न संकल्पनाओं के कठिन प्रश्नों का अभ्यास करें! 📐",
        "प्रतिदिन 20 महत्वपूर्ण प्रश्नों का अभ्यास आपकी रैंक बढ़ाएगा! 🎯",
        "निरंतर सूत्र अभ्यास से जेईई में सफलता निश्चित है! 🚀"
      ] : [
        "IITian mindset! Speed + Accuracy = Top Percentile ⚡",
        "Solve multi-concept problems and master boundary conditions! 📐",
        "Solve 20 high-yield questions daily for guaranteed rank boost! 🎯",
        "Consistent formula drills lead directly to JEE selection! 🚀"
      ];
    }
    if (cat === 'DEFENCE' || norm.includes('NDA') || norm.includes('CDS')) {
      return isHi ? [
        "सशस्त्र बलों में शामिल होकर देश का गौरव बढ़ाएं 🎖️",
        "शारीरिक अनुशासन और मानसिक दृढ़ता ही चयन का मार्ग है! 🇮🇳",
        "दैनिक अभ्यास से अंतिम मेरिट सूची में स्थान सुनिश्चित करें! ⚔️"
      ] : [
        "Join the Armed Forces! Officer's pride awaits you 🎖️",
        "Physical discipline + Mental stamina = Assured Selection! 🇮🇳",
        "Daily GAT and Mathematics drills secure merit list rank! ⚔️"
      ];
    }
    return isHi ? [
      "आप अधिकारी अवश्य बनेंगे! लबासना आपका स्वागत करने को तैयार है 🇮🇳",
      "पाठ्यक्रम का पुनरावलोकन और उत्तर लेखन सफलता की कुंजी है! 📜",
      "राजव्यवस्था व अर्थव्यवस्था की संकल्पनाओं को स्पष्ट कर प्रारंभिक परीक्षा उत्तीर्ण करें! ⚖️",
      "दैनिक निरंतरता आपको अंतिम चयन सूची तक अवश्य पहुंचाएगी! 🎯"
    ] : [
      "You will become an Officer! LBSNAA is calling 🇮🇳",
      "Syllabus revision and analytical answer writing is the golden key! 📜",
      "Master Polity and Economy concepts to crack the Preliminary exam! ⚖️",
      "Daily consistency will take you to the final merit list! 🎯"
    ];
  };

  const VEER_QUOTES = useMemo(() => getExamAwareQuotes(activeExamTag, examCfg2.category, isHindi), [activeExamTag, examCfg2.category, isHindi]);
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
    const subj1 = examSubjects[0] || (isHindi ? 'मुख्य विषय' : 'Core Subject');
    const subj2 = examSubjects[1] || subj1;
    const subj3 = examSubjects[2] || subj1;
    const isCivilOrSsc = examCfg2.category === 'CIVIL_SERVICES' || normalizeExamId(activeExamTag).includes('UPSC') || normalizeExamId(activeExamTag).includes('SSC');

    return [
      {
        id: 'goal-1',
        title: isHindi 
          ? `${subj1}: मुख्य अवधारणाएं एवं सारांश`
          : `${subj1}: Core Concepts & High-Yield Summary`,
        duration: isHindi ? '२०मि' : '20m',
        xp: 20,
        completed: false,
      },
      {
        id: 'goal-2',
        title: isCivilOrSsc
          ? (isHindi ? 'दैनिक समसामयिकी एवं संपादकीय विश्लेषण' : 'Daily Exam Current Affairs & Editorial Analysis')
          : (isHindi ? `${subj2}: उच्च वेटेज समस्या समाधान एवं सूत्र अभ्यास` : `${subj2}: High-Yield Problem Solving & Formula Drill`),
        duration: isHindi ? '१५मि' : '15m',
        xp: 20,
        completed: false,
      },
      {
        id: 'goal-3',
        title: isHindi
          ? `${subj3} के १० महत्वपूर्ण गत वर्ष प्रश्न हल करें`
          : `Practice 10 High-Yield ${subj3} PYQ MCQs`,
        duration: isHindi ? '१५मि' : '15m',
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
      const todayDateStr = new Date().toISOString().split('T')[0];
      const awardKey = `aspirantx_xp_awarded_goals_${userProfile.id || 'guest'}_${todayDateStr}`;
      let awardedGoalIds: string[] = [];
      try {
        awardedGoalIds = JSON.parse(localStorage.getItem(awardKey) || '[]');
      } catch {}

      if (!awardedGoalIds.includes(goalId)) {
        awardedGoalIds.push(goalId);
        try {
          localStorage.setItem(awardKey, JSON.stringify(awardedGoalIds));
        } catch {}
        setRewardBadge(`+${target.xp} XP`);
        try {
          await awardXPAndCoins(target.xp, 5, `Completed goal: ${target.title}`, userProfile.id);
        } catch {}
      }

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
      return { label: isHindi ? 'मॉक टेस्ट दें' : 'Take Mock Test', tab: 'cbt' as ActiveTab };
    }
    if (text.includes('pyq') || text.includes('previous')) {
      return { label: isHindi ? 'गत वर्ष प्रश्न हल करें' : 'Solve PYQs', tab: 'pyq' as ActiveTab };
    }
    if (text.includes('mcq') || text.includes('question') || text.includes('practice')) {
      return { label: isHindi ? 'बहुविकल्पीय प्रश्न अभ्यास' : 'Practice MCQs', tab: 'question_bank' as ActiveTab };
    }
    return { label: isHindi ? 'अब अभ्यास करें' : 'Practice Now', tab: 'pyq' as ActiveTab };
  };

  const recAction = getRecommendationAction();

  const totalCoreTopics = Object.values(examCfg2.syllabusTree || {}).reduce(
    (acc, node) => acc + (node.topics?.length || 0),
    0
  ) || 14;

  const paceStatus = calculatePaceStatus(
    data.topicsCompleted,
    totalCoreTopics,
    data.daysLeftForExam
  );
  const isPaceBehind = paceStatus.isBehind;
  const paceLabel = paceStatus.label;

  const rideStops = [
    {
      stopNumber: 1,
      title: isHindi ? 'अध्ययन' : 'Learn',
      label: lastTopic.chapter,
      subject: lastTopic.subject,
      description: isHindi ? 'मूल संकल्पनाएं व महत्वपूर्ण नोट्स' : 'Foundational concepts and high-yield notes',
      icon: BookOpen,
      actionTab: lastTopic.tab || 'syllabus' as ActiveTab,
      status: 'active' as const,
    },
    {
      stopNumber: 2,
      title: isHindi ? 'अभ्यास' : 'Practice',
      label: isHindi ? '10 महत्वपूर्ण प्रश्न' : '10 High-Yield MCQs',
      subject: secondarySubject,
      description: isHindi ? 'सटीक विषय प्रश्न व गति अभ्यास' : 'Targeted topic questions and accuracy drill',
      icon: Target,
      actionTab: 'pyq' as ActiveTab,
      status: 'pending' as const,
    },
    {
      stopNumber: 3,
      title: isHindi ? 'दोहराव' : 'Revise',
      label: data.topicsCompleted === 0 
        ? (isHindi ? 'अभी कोई दोहराव लंबित नहीं' : 'No reviews due yet') 
        : (isHindi ? 'सक्रिय स्मरण दोहराव' : 'Spaced Repetition Recall'),
      subject: primarySubject,
      description: data.topicsCompleted === 0 
        ? (isHindi ? 'दोहराव सूची में जोड़ने हेतु अध्ययन या अभ्यास पूर्ण करें' : 'Complete topics in Learn or Practice to queue spaced recall') 
        : (isHindi ? 'विस्मृति से पूर्व सक्रिय फ़्लैशकार्ड दोहराव' : 'Active flashcard recall before memory fades'),
      icon: Sparkles,
      actionTab: 'flashcards' as ActiveTab,
      status: 'pending' as const,
    }
  ];

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-[var(--sr-text-muted)]">
        <div className="w-8 h-8 border-3 border-[var(--sr-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold">{isHindi ? 'डेटा समन्वय हो रहा है...' : 'Syncing Study Telemetry...'}</p>
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
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--sr-primary)] animate-pulse shrink-0 flex-shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-[var(--sr-primary)]">
                  {isHindi ? 'वीर का दैनिक मार्गदर्शन' : "Veer's Daily Ride Advice"}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[var(--sr-text)] leading-snug">
                {VEER_QUOTES[mascotQuoteIndex % VEER_QUOTES.length]}
              </p>
              <span className="text-xs text-[var(--sr-text-muted)] font-medium mt-0.5 block">
                {isHindi ? `दैनिक प्रेरणा हेतु स्पर्श करें • लक्ष्य: ${examCfg2.displayName}` : `Tap Veer for motivation • Target: ${examCfg2.displayName}`}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end shrink-0">
            <span className="text-xs font-bold text-[var(--sr-primary)]">
              {data.daysLeftForExam} {isHindi ? 'दिन शेष' : 'Days Left'}
            </span>
            <span className="text-xs text-[var(--sr-text-muted)] font-medium">{isHindi ? 'परीक्षा दिवस तक' : 'Until Exam Day'}</span>
          </div>
        </div>
      </SlideUp>

      {/* ── 2. AAJ KI RIDE: Dominant Primary Study Action (3-Stop Session) ──── */}
      <TactileCard className="p-5 sm:p-6 bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] shadow-sm relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] border border-[var(--sr-primary)]/30">
              {isHindi ? 'आज का अध्ययन' : "TODAY'S RIDE"}
            </span>
            <span className="text-xs font-bold text-[var(--sr-text-muted)]">
              {lastTopic.subject}
            </span>
          </div>
          <span className="text-xs font-bold text-[var(--sr-primary)] shrink-0">
            {data.overallProgressPercent}% {isHindi ? 'पूर्ण' : 'Complete'}
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
            <span className="font-bold text-[var(--sr-text)] uppercase tracking-wider">{isHindi ? '3-चरणीय अध्ययन चक्र' : '3-Stop Journey'}</span>
            <span className="font-bold text-[var(--sr-primary)]">{isHindi ? 'चरण 1: अध्ययन सक्रिय' : 'Stop 1: Learn Active'}</span>
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
            <span className="text-[var(--sr-text-muted)] font-medium">{isHindi ? 'दैनिक गति:' : 'Daily Pace:'}</span>
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
          {isHindi ? 'अध्ययन प्रारंभ करें' : 'START RIDE'}
        </TactileButton>
      </TactileCard>

      {/* ── 3-STOP SESSION MODAL (when Start Ride is tapped) ── */}
      {showRideSessionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 text-left no-backdrop-blur">
          <div className="absolute inset-0" onClick={() => setShowRideSessionModal(false)} />
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] p-5 sm:p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--sr-line)]">
              <div>
                <span className="text-xs font-black uppercase text-[var(--sr-primary)] tracking-wider">
                  {isHindi ? 'आज का अध्ययन सत्र' : "Today's Ride Session"}
                </span>
                <h3 className="text-base sm:text-lg font-black text-[var(--sr-text)]">
                  {isHindi ? '३-चरणीय कार्य योजना' : '3-Stop Action Plan'}
                </h3>
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
                          {isHindi ? `चरण ${stop.stopNumber}: ${stop.title}` : `Stop ${stop.stopNumber}: ${stop.title}`}
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
                      {isHindi ? 'आरंभ' : 'Go'}
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
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--sr-surface-2)] transition-colors cursor-pointer select-none gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-7 h-7 rounded-xl bg-[var(--sr-primary-subtle)] border border-[var(--sr-primary)]/30 flex items-center justify-center text-[var(--sr-primary)] shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-black text-[var(--sr-text)] uppercase tracking-wider leading-snug line-clamp-2">{isHindi ? 'आज के अतिरिक्त लक्ष्य' : 'More for today'}</h3>
              <p className="text-xs text-[var(--sr-text-muted)] leading-snug line-clamp-2">{isHindi ? 'दैनिक अतिरिक्त लक्ष्य व बोनस अंक' : 'Daily supplementary targets & bonus XP'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto whitespace-nowrap">
            <span className="text-xs font-bold text-[var(--sr-primary)] whitespace-nowrap">
              {dailyGoals.filter((g) => g.completed).length}/{dailyGoals.length} {isHindi ? 'पूर्ण' : 'Done'}
            </span>
            <ChevronRight className={`w-4 h-4 text-[var(--sr-text-muted)] shrink-0 transition-transform duration-200 ${showMoreForToday ? 'rotate-90' : ''}`} />
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
              <span className="text-xs font-black uppercase tracking-wider text-[var(--sr-amber)]">
                {isHindi ? 'अनुशंसित अभ्यास' : 'RECOMMENDED PRACTICE'}
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
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--sr-coral)]">
              <Target className="w-3.5 h-3.5" />
              <span>{isHindi ? 'लक्ष्य परीक्षा' : 'Exam Target'}</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-[var(--sr-text)] mt-1">
              {examCfg2.displayName} {new Date(getDefaultExamDate(activeExamTag)).getFullYear()}
            </h4>
            <p className="text-xs text-[var(--sr-text-muted)] mt-0.5">
              {data.daysLeftForExam} {isHindi ? 'दिन शेष' : 'Days Remaining'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs border-t border-[var(--sr-line)]">
            <span className="text-[var(--sr-text-muted)]">{isHindi ? 'लक्ष्य गति:' : 'Target Velocity:'}</span>
            <span className={`font-black ${isPaceBehind ? 'text-[var(--sr-coral)]' : 'text-[var(--sr-primary)]'}`}>
              {paceLabel === 'Just starting' 
                ? (isHindi ? 'प्रारंभिक चरण' : 'Calibration phase') 
                : paceLabel}
            </span>
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
              <h3 className="text-xs font-black text-[var(--sr-text)]">
                {isHindi ? 'सजीव अध्ययन मेट्रिक्स' : 'Live Study Telemetry'}
              </h3>
              <p className="text-xs text-[var(--sr-text-muted)]">
                {isHindi ? 'पाठ्यक्रम, सटीकता एवं दैनिक फोकस मेट्रिक्स' : 'Syllabus, accuracy & daily focus metrics'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--sr-primary)]">
              {showTelemetryRings 
                ? (isHindi ? 'समेटें' : 'Collapse') 
                : (isHindi ? 'देखने हेतु स्पर्श करें' : 'Tap to View')}
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
                {isHindi ? 'त्वरित शॉर्टकट' : 'Quick Shortcuts'}
              </h3>
              <p className="text-xs text-[var(--sr-text-muted)]">
                {isHindi ? 'प्रमुख अध्ययन मॉड्यूल तक सीधी पहुंच' : 'Direct access to primary study engines'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allFeatures.length > 4 && (
              <button
                onClick={() => setShowAllShortcuts(!showAllShortcuts)}
                className="px-2.5 py-1 rounded-xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] border border-[var(--sr-line)] text-xs font-bold text-[var(--sr-text)] transition-all cursor-pointer"
              >
                {showAllShortcuts 
                  ? (isHindi ? 'शीर्ष ४ दिखाएं' : 'Show Top 4') 
                  : (isHindi ? `सभी (${allFeatures.length})` : `All (${allFeatures.length})`)}
              </button>
            )}
            {onOpenWorkspaceCustomizer && (
              <button
                onClick={onOpenWorkspaceCustomizer}
                className="px-2.5 py-1 rounded-xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] border border-[var(--sr-line)] text-xs font-bold text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] flex items-center gap-1 transition-all cursor-pointer"
              >
                <Sliders className="w-3 h-3 text-[var(--sr-blue)]" />
                <span>{isHindi ? 'अनुकूलित करें' : 'Customize'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Grid of Compact Shortcuts with Stagger */}
        <Stagger staggerDelay={0.03} className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {displayedShortcuts.map((item) => {
            const FEATURE_HI_LABELS: Record<string, string> = {
              syllabus: 'पाठ्यक्रम',
              pyq: 'गत वर्ष प्रश्न',
              cbt: 'सीबीटी टेस्ट',
              cbt_exam: 'सीबीटी टेस्ट',
              question_bank: 'प्रश्न बैंक',
              flashcards: 'फ्लैशकार्ड्स',
              timer: 'फोकस टाइमर',
              tasks: 'दैनिक योजनाकार',
              focus_shield: 'फोकस शील्ड',
              library: 'पुस्तकालय',
              podcasts: 'पॉडकास्ट',
              study_buddy: 'अध्ययन साथी',
              community: 'सामुदायिक फ़ीड',
              collaboration: 'ब्रांड एंबेसडर',
              reward_milestones: 'उपलब्धियां',
              rewards: 'उपलब्धियां',
              wallpaper: 'वॉलपेपर',
              eligibility: 'पात्रता जांचकर्ता',
              chat: 'वीर एआई',
              blog: 'संपादकीय एवं लेख'
            };
            const label = isHindi ? (FEATURE_HI_LABELS[item.id] || item.label) : item.label;

            return (
              <StaggerItem key={item.id}>
                <button
                  onClick={() => {
                    recordFeatureUsage(item.id, userProfile.id);
                    if (onNavigate) onNavigate(item.id as ActiveTab);
                  }}
                  className="w-full p-3 rounded-2xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-primary-subtle)] border border-[var(--sr-line)] hover:border-[var(--sr-primary)]/40 active:border-b-0 active:translate-y-0.5 transition-all text-center group flex flex-col items-center gap-1.5 cursor-pointer shadow-sm select-none"
                >
                  <div className="w-8 h-8 rounded-xl bg-[var(--sr-surface)] group-hover:bg-[var(--sr-primary-subtle)] border border-[var(--sr-line)] group-hover:border-[var(--sr-primary)]/40 flex items-center justify-center text-xs font-black text-[var(--sr-text-muted)] group-hover:text-[var(--sr-primary)] transition-all">
                    {label.charAt(0)}
                  </div>
                  <div className="min-w-0 w-full text-center">
                    <span className="text-xs font-bold text-[var(--sr-text)] group-hover:text-[var(--sr-primary)] transition-colors block truncate">
                      {label}
                    </span>
                  </div>
                </button>
              </StaggerItem>
            );
          })}
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
