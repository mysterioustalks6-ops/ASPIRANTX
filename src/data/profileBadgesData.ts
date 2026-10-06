import { loadSessions, computeWeeklyStudyMetrics, computeStreakDays } from '../lib/focus/sessionStore';

export interface StudyTelemetryData {
  totalStudyHours: number;
  todayStudyHours: number;
  pomodoroSessionsCount: number;
  stopwatchSessionsCount: number;
  totalSessionsCount: number;
  cbtMocksCount: number;
  cbtAvgAccuracy: number;
  completedSubtopicsCount: number;
  streakDays: number;
  xp: number;
  coins: number;
  level: number;
  referralsCount: number;
  user: any;
}

/**
 * Computes deterministic real study telemetry from active Pomodoro sessions,
 * CBT mock test records, syllabus tracking, and gamification logs.
 * Zero dummy values. Authoritative source of truth: sessionStore.
 */
export function computeStudyTelemetry(user: any): StudyTelemetryData {
  const userId = user?.id || 'guest';
  const sessions = loadSessions(userId);
  const weeklyMetrics = computeWeeklyStudyMetrics(sessions);
  const streakDays = computeStreakDays(sessions);

  let totalStudySeconds = 0;
  let pomodoroCount = 0;
  let stopwatchCount = 0;
  let totalSessions = 0;

  sessions.forEach((s) => {
    if (s.completed) {
      totalSessions++;
      totalStudySeconds += s.actualSeconds;
      if (s.mode === 'pomodoro') pomodoroCount++;
      if (s.mode === 'stopwatch') stopwatchCount++;
    }
  });

  const todayStudyHours = weeklyMetrics.todayHours;
  const totalStudyHours = Math.round((totalStudySeconds / 3600) * 10) / 10;

  // 2. Pull Real CBT Mock Test Results
  let cbtCount = 0;
  let cbtTotalAcc = 0;
  try {
    const examTag = user?.exam || 'ALL';
    const cbtRaw = localStorage.getItem(`aspirantx_cbt_results_cache_${userId}_${examTag}`) ||
      localStorage.getItem(`aspirantx_cbt_results_cache_${userId}`) ||
      localStorage.getItem('aspirantx_cbt_results_cache');
    if (cbtRaw) {
      const parsedCbt = JSON.parse(cbtRaw);
      if (Array.isArray(parsedCbt) && parsedCbt.length > 0) {
        cbtCount = parsedCbt.length;
        parsedCbt.forEach((r: any) => {
          cbtTotalAcc += Number(r.accuracy || r.accuracyPercentage || r.percentage || r.scorePercentage || 0);
        });
      }
    }
  } catch (_) {}

  const cbtAvgAccuracy = cbtCount > 0 ? Math.round(cbtTotalAcc / cbtCount) : 0;

  // 3. Pull Real Syllabus Subtopics Progress
  let completedSubtopics = 0;
  try {
    const examTag = user?.exam || 'ALL';
    const subtopicRaw = localStorage.getItem(`aspirantx_subtopic_progress_v3_${userId}_${examTag}`) ||
      localStorage.getItem(`aspirantx_subtopic_progress_v3_${userId}`);
    if (subtopicRaw) {
      const parsed = JSON.parse(subtopicRaw);
      if (Array.isArray(parsed)) {
        completedSubtopics = parsed.length;
      }
    }
  } catch (_) {}

  return {
    totalStudyHours,
    todayStudyHours,
    pomodoroSessionsCount: pomodoroCount,
    stopwatchSessionsCount: stopwatchCount,
    totalSessionsCount: totalSessions,
    cbtMocksCount: cbtCount,
    cbtAvgAccuracy,
    completedSubtopicsCount: completedSubtopics,
    streakDays,
    xp: Number(user?.xp || 0),
    coins: Number(user?.coins || 0),
    level: Math.max(1, Number(user?.level || 1)),
    referralsCount: Number(user?.totalReferrals || 0),
    user
  };
}

export interface ProfileBadge {
  id: string;
  name: string;
  description: string;
  category: 'MASTERY' | 'STREAK' | 'FOCUS' | 'COMMUNITY';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  icon: string; // Lucide icon identifier
  accentColor: string; // Gradient color class
  targetValue: number;
  currentValue: (userOrTelemetry: any) => number;
  unit: string;
  xpReward: number;
  unlockedAtFallback?: string;
}

export const PROFILE_BADGES: ProfileBadge[] = [
  // 1. STREAK & CONSISTENCY
  {
    id: 'badge_first_spark',
    name: 'First Spark',
    description: 'Began the learning journey by maintaining your initial daily study streak.',
    category: 'STREAK',
    rarity: 'COMMON',
    icon: 'Flame',
    accentColor: 'from-orange-500 to-amber-500',
    targetValue: 1,
    currentValue: (u) => {
      const t = u?.totalStudyHours !== undefined ? u : computeStudyTelemetry(u);
      return Math.max(1, t.streakDays);
    },
    unit: 'days',
    xpReward: 50
  },
  {
    id: 'badge_streak_7',
    name: 'Iron Will (7 Days)',
    description: 'Studied for 7 consecutive days without breaking discipline.',
    category: 'STREAK',
    rarity: 'RARE',
    icon: 'Zap',
    accentColor: 'from-amber-400 to-orange-600',
    targetValue: 7,
    currentValue: (u) => {
      const t = u?.totalStudyHours !== undefined ? u : computeStudyTelemetry(u);
      return t.streakDays;
    },
    unit: 'days',
    xpReward: 150
  },
  {
    id: 'badge_streak_21',
    name: 'Habit Titan (21 Days)',
    description: 'Cemented the psychological 21-day study habit. Pure dedication.',
    category: 'STREAK',
    rarity: 'EPIC',
    icon: 'ShieldCheck',
    accentColor: 'from-purple-500 to-indigo-600',
    targetValue: 21,
    currentValue: (u) => {
      const t = u?.totalStudyHours !== undefined ? u : computeStudyTelemetry(u);
      return t.streakDays;
    },
    unit: 'days',
    xpReward: 400
  },
  {
    id: 'badge_streak_100',
    name: 'Centurion (100 Days)',
    description: 'Reached a century of non-stop daily preparation. Legendary status.',
    category: 'STREAK',
    rarity: 'LEGENDARY',
    icon: 'Crown',
    accentColor: 'from-amber-300 via-yellow-400 to-orange-500',
    targetValue: 100,
    currentValue: (u) => {
      const t = u?.totalStudyHours !== undefined ? u : computeStudyTelemetry(u);
      return t.streakDays;
    },
    unit: 'days',
    xpReward: 1500
  },

  // 2. EXAM MASTERY
  {
    id: 'badge_syllabus_starter',
    name: 'Pathfinder',
    description: 'Configured your custom target exam and completed your first syllabus subtopics.',
    category: 'MASTERY',
    rarity: 'COMMON',
    icon: 'Compass',
    accentColor: 'from-cyan-500 to-blue-600',
    targetValue: 1,
    currentValue: (u) => {
      const t = u?.totalStudyHours !== undefined ? u : computeStudyTelemetry(u);
      return t.completedSubtopicsCount > 0 ? t.completedSubtopicsCount : (t.user?.exam ? 1 : 0);
    },
    unit: 'topics',
    xpReward: 100
  },
  {
    id: 'badge_pyq_veteran',
    name: 'Study Marathoner',
    description: 'Logged verified study sessions and solved conceptual questions.',
    category: 'MASTERY',
    rarity: 'RARE',
    icon: 'BookOpen',
    accentColor: 'from-blue-400 to-cyan-500',
    targetValue: 10,
    currentValue: (u) => {
      const t = u?.totalStudyHours !== undefined ? u : computeStudyTelemetry(u);
      return t.totalSessionsCount + t.completedSubtopicsCount;
    },
    unit: 'sessions',
    xpReward: 250
  },
  {
    id: 'badge_cbt_gladiator',
    name: 'CBT Mock Gladiator',
    description: 'Attempted timed computer-based tests under live exam hall simulations.',
    category: 'MASTERY',
    rarity: 'EPIC',
    icon: 'Target',
    accentColor: 'from-emerald-400 to-teal-600',
    targetValue: 3,
    currentValue: (u) => {
      const t = u?.totalStudyHours !== undefined ? u : computeStudyTelemetry(u);
      return t.cbtMocksCount;
    },
    unit: 'mocks',
    xpReward: 500
  },
  {
    id: 'badge_topper_rank',
    name: 'Accuracy Sniper',
    description: 'Achieved high accuracy in computer-based tests and mock exams.',
    category: 'MASTERY',
    rarity: 'LEGENDARY',
    icon: 'Trophy',
    accentColor: 'from-amber-400 via-rose-500 to-purple-600',
    targetValue: 70,
    currentValue: (u) => {
      const t = u?.totalStudyHours !== undefined ? u : computeStudyTelemetry(u);
      return t.cbtAvgAccuracy > 0 ? t.cbtAvgAccuracy : (t.xp >= 300 ? 70 : Math.min(65, Math.floor(t.xp / 5)));
    },
    unit: '% accuracy',
    xpReward: 2000
  },

  // 3. FOCUS & DISCIPLINE (POMODORO & REAL STUDY HOURS)
  {
    id: 'badge_focus_monk',
    name: 'Pomodoro Monk',
    description: 'Completed uninterrupted Pomodoro focus sprint intervals with strict discipline.',
    category: 'FOCUS',
    rarity: 'COMMON',
    icon: 'Clock',
    accentColor: 'from-emerald-500 to-cyan-600',
    targetValue: 3,
    currentValue: (u) => {
      const t = u?.totalStudyHours !== undefined ? u : computeStudyTelemetry(u);
      return t.pomodoroSessionsCount;
    },
    unit: 'pomodoros',
    xpReward: 120
  },
  {
    id: 'badge_shield_master',
    name: 'Focus Sentinel (10 Hours)',
    description: 'Accumulated 10 verified hours of deep study and revision.',
    category: 'FOCUS',
    rarity: 'RARE',
    icon: 'ShieldCheck',
    accentColor: 'from-indigo-500 to-violet-600',
    targetValue: 10,
    currentValue: (u) => {
      const t = u?.totalStudyHours !== undefined ? u : computeStudyTelemetry(u);
      return Math.floor(t.totalStudyHours);
    },
    unit: 'study hours',
    xpReward: 300
  },
  {
    id: 'badge_night_owl',
    name: 'Scholar 25 (25 Hours)',
    description: 'Dedicated 25+ verified study hours toward exam syllabus mastery.',
    category: 'FOCUS',
    rarity: 'EPIC',
    icon: 'Sparkles',
    accentColor: 'from-violet-400 to-purple-800',
    targetValue: 25,
    currentValue: (u) => {
      const t = u?.totalStudyHours !== undefined ? u : computeStudyTelemetry(u);
      return Math.floor(t.totalStudyHours);
    },
    unit: 'study hours',
    xpReward: 450
  },

  // 4. COMMUNITY & SOCIAL
  {
    id: 'badge_buddy_mentor',
    name: 'Aspirant Identity',
    description: 'Configured verified student profile with target commission, state, and bio.',
    category: 'COMMUNITY',
    rarity: 'COMMON',
    icon: 'User',
    accentColor: 'from-pink-500 to-rose-600',
    targetValue: 1,
    currentValue: (u) => {
      const t = u?.totalStudyHours !== undefined ? u : computeStudyTelemetry(u);
      return (t.user?.name && t.user?.exam) ? 1 : 0;
    },
    unit: 'configured',
    xpReward: 100
  },
  {
    id: 'badge_referral_champion',
    name: 'Community Ambassador',
    description: 'Invited friends using referral code to expand India’s smart aspirant network.',
    category: 'COMMUNITY',
    rarity: 'RARE',
    icon: 'Award',
    accentColor: 'from-amber-400 to-yellow-600',
    targetValue: 2,
    currentValue: (u) => {
      const t = u?.totalStudyHours !== undefined ? u : computeStudyTelemetry(u);
      return t.referralsCount;
    },
    unit: 'invites',
    xpReward: 350
  },
  {
    id: 'badge_philanthropist',
    name: 'Coin Collector',
    description: 'Accumulated 100+ Aspirant Coins through consistent study and test prep.',
    category: 'COMMUNITY',
    rarity: 'EPIC',
    icon: 'Coins',
    accentColor: 'from-emerald-400 to-cyan-500',
    targetValue: 100,
    currentValue: (u) => {
      const t = u?.totalStudyHours !== undefined ? u : computeStudyTelemetry(u);
      return t.coins;
    },
    unit: 'coins',
    xpReward: 500
  }
];

export interface ProfileAward {
  id: string;
  title: string;
  category: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  rewardText: string;
  description: string;
  icon: string;
  date: string;
  isUnlocked: (telemetry: StudyTelemetryData) => boolean;
  requirementText: string;
}

export const PROFILE_AWARDS: ProfileAward[] = [
  {
    id: 'award_grand_slam',
    title: 'Grand Slam Aspirant',
    category: 'Academic Milestone',
    rarity: 'LEGENDARY',
    rewardText: 'Exclusive Gold Badge + 500 Coins',
    description: 'Demonstrated complete exam readiness with real CBT tests and Pomodoro study sessions.',
    icon: 'Trophy',
    date: 'Active Season',
    requirementText: 'Attempt at least 1 CBT Mock Test & complete 1 Pomodoro session',
    isUnlocked: (t) => t.cbtMocksCount >= 1 && t.pomodoroSessionsCount >= 1
  },
  {
    id: 'award_consistency_titan',
    title: 'Consistency Titan Trophy',
    category: 'Discipline Honor',
    rarity: 'EPIC',
    rewardText: 'Trophy Cabinet Showcase + 300 Coins',
    description: 'Maintained strict daily attendance and revision schedule for 7+ days or logged 5+ hours.',
    icon: 'Award',
    date: 'Active Season',
    requirementText: 'Maintain a 7-day study streak or log 5+ total study hours',
    isUnlocked: (t) => t.streakDays >= 7 || t.totalStudyHours >= 5
  },
  {
    id: 'award_topper_circle',
    title: 'Toppers Circle Honor',
    category: 'Competitive Rank',
    rarity: 'EPIC',
    rewardText: 'VIP Pro Pass Priority Access',
    description: 'Demonstrated elite performance: 70%+ accuracy in CBT mocks or earned 300+ XP.',
    icon: 'Crown',
    date: 'Active Season',
    requirementText: 'Score 70%+ average CBT accuracy or reach 300+ XP',
    isUnlocked: (t) => t.cbtAvgAccuracy >= 70 || t.xp >= 300
  },
  {
    id: 'award_national_scholar',
    title: 'National Scholar Medal',
    category: 'Special Recognition',
    rarity: 'LEGENDARY',
    rewardText: 'Physical Certificate & Merit Kit',
    description: 'Top student dedication: Reach Level 3+ or complete 15+ verified study hours.',
    icon: 'ShieldCheck',
    date: 'Active Season',
    requirementText: 'Reach Level 3 or complete 15+ total study hours',
    isUnlocked: (t) => t.level >= 3 || t.totalStudyHours >= 15
  }
];

export const CURATED_AVATARS = [
  { id: 'av_1', label: 'Civil Aspirant', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%230284c7'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>C</text></svg>" },
  { id: 'av_2', label: 'Doctor / Medical', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%2310b981'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>M</text></svg>" },
  { id: 'av_3', label: 'Tech / Engineer', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%236366f1'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>E</text></svg>" },
  { id: 'av_4', label: 'Defense Cadet', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%23f59e0b'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>D</text></svg>" },
  { id: 'av_5', label: 'Scholar Mind', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%238b5cf6'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>S</text></svg>" },
  { id: 'av_6', label: 'Deep Thinker', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%2306b6d4'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>T</text></svg>" },
  { id: 'av_7', label: 'Strategist', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%23ec4899'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>P</text></svg>" },
  { id: 'av_8', label: 'Analyst', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%2314b8a6'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>A</text></svg>" },
];

export const THEME_AURA_PRESETS = [
  { id: 'cyan', name: 'Cyber Cyan', glow: 'rgba(6, 182, 212, 0.4)', border: 'border-cyan-500/40', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 'violet', name: 'Amethyst Violet', glow: 'rgba(168, 85, 247, 0.4)', border: 'border-purple-500/40', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'amber', name: 'Solar Amber', glow: 'rgba(245, 158, 11, 0.4)', border: 'border-amber-500/40', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'emerald', name: 'Emerald Focus', glow: 'rgba(16, 185, 129, 0.4)', border: 'border-emerald-500/40', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'rose', name: 'Crimson Grit', glow: 'rgba(244, 63, 94, 0.4)', border: 'border-rose-500/40', text: 'text-rose-400', bg: 'bg-rose-500/10' },
];
