export interface ProfileBadge {
  id: string;
  name: string;
  description: string;
  category: 'MASTERY' | 'STREAK' | 'FOCUS' | 'COMMUNITY';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  icon: string; // Lucide icon identifier
  accentColor: string; // Gradient color class
  targetValue: number;
  currentValue: (user: any) => number;
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
    currentValue: (u) => Math.max(1, u?.streakDays || 1),
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
    currentValue: (u) => u?.streakDays || 1,
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
    currentValue: (u) => u?.streakDays || 1,
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
    currentValue: (u) => u?.streakDays || 1,
    unit: 'days',
    xpReward: 1500
  },

  // 2. EXAM MASTERY
  {
    id: 'badge_syllabus_starter',
    name: 'Pathfinder',
    description: 'Configured your custom target exam and kicked off official syllabus tracking.',
    category: 'MASTERY',
    rarity: 'COMMON',
    icon: 'Compass',
    accentColor: 'from-cyan-500 to-blue-600',
    targetValue: 1,
    currentValue: (u) => (u?.exam ? 1 : 0),
    unit: 'exam set',
    xpReward: 100
  },
  {
    id: 'badge_pyq_veteran',
    name: 'PYQ Veteran',
    description: 'Engaged with standard previous year question papers in the 38,000+ archive.',
    category: 'MASTERY',
    rarity: 'RARE',
    icon: 'BookOpen',
    accentColor: 'from-blue-400 to-cyan-500',
    targetValue: 50,
    currentValue: (u) => Math.min(50, Math.floor((u?.xp || 100) / 10)),
    unit: 'questions',
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
    targetValue: 10,
    currentValue: (u) => Math.max(1, Math.floor((u?.level || 1) * 2)),
    unit: 'mocks',
    xpReward: 500
  },
  {
    id: 'badge_topper_rank',
    name: 'All India Top 1%',
    description: 'Secured elite score percentile and earned verified pro aspirant standing.',
    category: 'MASTERY',
    rarity: 'LEGENDARY',
    icon: 'Trophy',
    accentColor: 'from-amber-400 via-rose-500 to-purple-600',
    targetValue: 1000,
    currentValue: (u) => u?.xp || 250,
    unit: 'XP',
    xpReward: 2000
  },

  // 3. FOCUS & DISCIPLINE
  {
    id: 'badge_focus_monk',
    name: 'Pomodoro Monk',
    description: 'Completed uninterrupted deep work focus intervals with zero distractions.',
    category: 'FOCUS',
    rarity: 'COMMON',
    icon: 'Clock',
    accentColor: 'from-emerald-500 to-cyan-600',
    targetValue: 5,
    currentValue: (u) => Math.max(1, Math.floor((u?.studyHoursToday || 0) * 2 + 1)),
    unit: 'sessions',
    xpReward: 80
  },
  {
    id: 'badge_shield_master',
    name: 'Focus Shield Sentinel',
    description: 'Defended study hours from social media distractions and app temptations.',
    category: 'FOCUS',
    rarity: 'RARE',
    icon: 'ShieldCheck',
    accentColor: 'from-indigo-500 to-violet-600',
    targetValue: 20,
    currentValue: (u) => Math.min(20, Math.floor((u?.coins || 50) / 5)),
    unit: 'shield hours',
    xpReward: 300
  },
  {
    id: 'badge_night_owl',
    name: 'Night Owl Scholar',
    description: 'Mastered late-night revisions and high-yield problem solving.',
    category: 'FOCUS',
    rarity: 'EPIC',
    icon: 'Sparkles',
    accentColor: 'from-violet-400 to-purple-800',
    targetValue: 15,
    currentValue: (u) => Math.max(2, u?.level || 1),
    unit: 'modules',
    xpReward: 450
  },

  // 4. COMMUNITY & SOCIAL
  {
    id: 'badge_buddy_mentor',
    name: 'Study Buddy Mentor',
    description: 'Joined community study groups and solved doubts with peer aspirants.',
    category: 'COMMUNITY',
    rarity: 'COMMON',
    icon: 'User',
    accentColor: 'from-pink-500 to-rose-600',
    targetValue: 1,
    currentValue: (u) => (u?.name ? 1 : 0),
    unit: 'connected',
    xpReward: 100
  },
  {
    id: 'badge_referral_champion',
    name: 'Ambassador',
    description: 'Invited friends using referral code to help build India’s smartest study community.',
    category: 'COMMUNITY',
    rarity: 'RARE',
    icon: 'Award',
    accentColor: 'from-amber-400 to-yellow-600',
    targetValue: 3,
    currentValue: (u) => u?.totalReferrals || 1,
    unit: 'referrals',
    xpReward: 350
  },
  {
    id: 'badge_philanthropist',
    name: 'Philanthropist',
    description: 'Contributed questions or supported peer learners in live mock discussions.',
    category: 'COMMUNITY',
    rarity: 'EPIC',
    icon: 'Coins',
    accentColor: 'from-emerald-400 to-cyan-500',
    targetValue: 100,
    currentValue: (u) => u?.coins || 50,
    unit: 'coins donated',
    xpReward: 500
  }
];

export const PROFILE_AWARDS = [
  {
    id: 'award_grand_slam',
    title: 'Grand Slam Aspirant',
    category: 'Academic Milestone',
    rarity: 'LEGENDARY',
    rewardText: 'Exclusive Gold Badge + 500 Coins',
    description: 'Demonstrated exceptional performance across PYQ engines and CBT Mock Hall.',
    icon: 'Trophy',
    date: 'Active Season 2026',
    unlocked: true
  },
  {
    id: 'award_consistency_titan',
    title: 'Consistency Titan Trophy',
    category: 'Discipline Honor',
    rarity: 'EPIC',
    rewardText: 'Trophy Cabinet Showcase + 300 Coins',
    description: 'Maintained strict daily attendance and revision schedule for 3 consecutive weeks.',
    icon: 'Award',
    date: 'Unlocked',
    unlocked: true
  },
  {
    id: 'award_topper_circle',
    title: 'Toppers Circle Honor',
    category: 'Competitive Rank',
    rarity: 'EPIC',
    rewardText: 'VIP Pro Pass Priority Access',
    description: 'Consistently scored above the 90th percentile in statewide CBT test series.',
    icon: 'Crown',
    date: 'Earned',
    unlocked: true
  },
  {
    id: 'award_national_scholar',
    title: 'National Scholar Medal',
    category: 'Special Recognition',
    rarity: 'LEGENDARY',
    rewardText: 'Physical Certificate & Merit Kit',
    description: 'Top candidate in AspirantX All-India Scholarship Test Series.',
    icon: 'ShieldCheck',
    date: 'Upcoming Season',
    unlocked: false
  }
];

export const CURATED_AVATARS = [
  { id: 'av_1', label: 'Civil Aspirant', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { id: 'av_2', label: 'Doctor / Medical', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80' },
  { id: 'av_3', label: 'Tech / Engineer', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
  { id: 'av_4', label: 'Defense Cadet', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: 'av_5', label: 'Scholar Mind', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80' },
  { id: 'av_6', label: 'Deep Thinker', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80' },
  { id: 'av_7', label: 'Strategist', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { id: 'av_8', label: 'Analyst', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80' },
];

export const THEME_AURA_PRESETS = [
  { id: 'cyan', name: 'Cyber Cyan', glow: 'rgba(6, 182, 212, 0.4)', border: 'border-cyan-500/40', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 'violet', name: 'Amethyst Violet', glow: 'rgba(168, 85, 247, 0.4)', border: 'border-purple-500/40', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'amber', name: 'Solar Amber', glow: 'rgba(245, 158, 11, 0.4)', border: 'border-amber-500/40', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'emerald', name: 'Emerald Focus', glow: 'rgba(16, 185, 129, 0.4)', border: 'border-emerald-500/40', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'rose', name: 'Crimson Grit', glow: 'rgba(244, 63, 94, 0.4)', border: 'border-rose-500/40', text: 'text-rose-400', bg: 'bg-rose-500/10' },
];
