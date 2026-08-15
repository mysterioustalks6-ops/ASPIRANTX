import { ActiveTab } from '../types';

export interface WorkspaceFeatureMeta {
  id: ActiveTab;
  defaultLabel: string;
  shortDescription: string;
  category: 'core' | 'practice' | 'ai_community' | 'analytics' | 'resources_perks';
  categoryLabel: string;
  iconName: string;
  badge: string;
  suggestedReason: string;
  defaultActive: boolean;
  defaultOrder: number;
}

export interface UserFeaturePreference {
  featureId: ActiveTab;
  isActive: boolean;
  customLabel?: string;
  sortOrder: number;
  lastUsedAt?: string; // ISO date
}

export interface WorkspaceConfig {
  userId?: string;
  version: number;
  isConfigured: boolean;
  preset?: string;
  preferences: UserFeaturePreference[];
  updatedAt: string;
}

export interface WeeklyNudge {
  id: string;
  featureId: ActiveTab;
  featureName: string;
  reason: string;
  type: 'unused_active' | 'hidden_recommendation';
  daysInactive?: number;
  badge: string;
}

export const ALL_WORKSPACE_FEATURES: WorkspaceFeatureMeta[] = [
  // Core
  {
    id: 'dashboard',
    defaultLabel: 'Student Dashboard',
    shortDescription: 'Your daily study progress, streak, and countdown hub.',
    category: 'core',
    categoryLabel: 'Core Daily Tools',
    iconName: 'Target',
    badge: 'Overview',
    suggestedReason: 'Gives you a quick bird-eye view of daily goals and exam countdown.',
    defaultActive: true,
    defaultOrder: 1,
  },
  {
    id: 'syllabus',
    defaultLabel: 'Syllabus Tracker',
    shortDescription: 'Track your complete exam syllabus checklist chapter by chapter.',
    category: 'core',
    categoryLabel: 'Core Daily Tools',
    iconName: 'BookOpen',
    badge: 'Live Track',
    suggestedReason: 'Keeps your syllabus coverage structured so you never miss a topic.',
    defaultActive: true,
    defaultOrder: 2,
  },
  {
    id: 'tasks',
    defaultLabel: 'Study Planner & Tasks',
    shortDescription: 'Daily study timetable and target checklist manager.',
    category: 'core',
    categoryLabel: 'Core Daily Tools',
    iconName: 'CheckSquare',
    badge: 'Tasks',
    suggestedReason: 'Organizes daily study sessions into manageable milestones.',
    defaultActive: true,
    defaultOrder: 3,
  },
  {
    id: 'timer',
    defaultLabel: 'Pomodoro Focus Timer',
    shortDescription: 'Deep focus timer with soothing background study sounds.',
    category: 'core',
    categoryLabel: 'Core Daily Tools',
    iconName: 'Timer',
    badge: 'Focus',
    suggestedReason: 'Boosts concentration and records your real active study hours.',
    defaultActive: true,
    defaultOrder: 4,
  },

  // Practice & Prep
  {
    id: 'cbt',
    defaultLabel: 'CBT Mock Tests',
    shortDescription: 'Full-length simulated computer-based tests with timer.',
    category: 'practice',
    categoryLabel: 'Practice & Mock Tests',
    iconName: 'Award',
    badge: 'Real Exam',
    suggestedReason: 'Builds real exam confidence and speed under timed pressure.',
    defaultActive: true,
    defaultOrder: 5,
  },
  {
    id: 'pyq',
    defaultLabel: 'PYQ Bank (35+ Yrs)',
    shortDescription: 'Past 35 years solved exam papers with solutions.',
    category: 'practice',
    categoryLabel: 'Practice & Mock Tests',
    iconName: 'BookMarked',
    badge: '1991–2026',
    suggestedReason: 'Practice real questions asked in past official examinations.',
    defaultActive: true,
    defaultOrder: 6,
  },
  {
    id: 'question_bank',
    defaultLabel: 'Question Bank Engine',
    shortDescription: 'Practice questions by subject and chapter with answers.',
    category: 'practice',
    categoryLabel: 'Practice & Mock Tests',
    iconName: 'HelpCircle',
    badge: 'Practice',
    suggestedReason: 'Strengthens concepts with unlimited practice questions.',
    defaultActive: true,
    defaultOrder: 7,
  },
  {
    id: 'flashcards',
    defaultLabel: 'Flashcards Recall',
    shortDescription: 'Quick flashcards for rapid formula and definition memory.',
    category: 'practice',
    categoryLabel: 'Practice & Mock Tests',
    iconName: 'Sparkles',
    badge: 'Spaced',
    suggestedReason: 'Proven memory technique to quickly remember formulas and facts.',
    defaultActive: true,
    defaultOrder: 8,
  },
  {
    id: 'library',
    defaultLabel: 'Reference Library',
    shortDescription: 'NCERT textbooks, topper revision notes, and study guides.',
    category: 'practice',
    categoryLabel: 'Practice & Mock Tests',
    iconName: 'BookOpen',
    badge: 'NCERT',
    suggestedReason: 'Instant access to all official textbooks and notes in one place.',
    defaultActive: false,
    defaultOrder: 9,
  },

  // AI & Community
  {
    id: 'chat',
    defaultLabel: 'AI Mentor & Doubt Solver',
    shortDescription: 'Ask any question to get instant step-by-step answers.',
    category: 'ai_community',
    categoryLabel: 'AI & Community',
    iconName: 'MessageSquare',
    badge: 'Gemini AI',
    suggestedReason: 'Get immediate, simple explanations whenever you get stuck.',
    defaultActive: true,
    defaultOrder: 10,
  },
  {
    id: 'study_buddy',
    defaultLabel: '1-on-1 Study Buddy',
    shortDescription: 'Study together with students preparing for your exam.',
    category: 'ai_community',
    categoryLabel: 'AI & Community',
    iconName: 'Users',
    badge: 'Peer',
    suggestedReason: 'Stay motivated and discuss difficult topics with peer students.',
    defaultActive: false,
    defaultOrder: 11,
  },
  {
    id: 'community',
    defaultLabel: 'Community Feed',
    shortDescription: 'Student discussion forum for exam tips and doubts.',
    category: 'ai_community',
    categoryLabel: 'AI & Community',
    iconName: 'Users',
    badge: 'Tokens',
    suggestedReason: 'Share tips, ask doubts, and learn from other aspirants.',
    defaultActive: false,
    defaultOrder: 12,
  },
  {
    id: 'podcasts',
    defaultLabel: 'Topper Podcasts',
    shortDescription: 'Short audio lessons and topper exam revision advice.',
    category: 'ai_community',
    categoryLabel: 'AI & Community',
    iconName: 'Mic',
    badge: 'Audio',
    suggestedReason: 'Listen to quick revision audio while resting or traveling.',
    defaultActive: false,
    defaultOrder: 13,
  },
  {
    id: 'blog',
    defaultLabel: 'Editorial & Blog Desk',
    shortDescription: 'Daily current affairs summaries and exam notifications.',
    category: 'ai_community',
    categoryLabel: 'AI & Community',
    iconName: 'BookOpen',
    badge: 'Daily',
    suggestedReason: 'Stay updated with daily current affairs and exam alerts.',
    defaultActive: false,
    defaultOrder: 14,
  },

  // Analytics & Diagnostics
  {
    id: 'weakness',
    defaultLabel: 'AI Lag & Diagnostic Engine',
    shortDescription: 'Find your weak topics automatically and fix them.',
    category: 'analytics',
    categoryLabel: 'Diagnostics & Rankings',
    iconName: 'BarChart3',
    badge: 'Diagnosis',
    suggestedReason: 'Shows exactly which chapters need extra revision to score higher.',
    defaultActive: true,
    defaultOrder: 15,
  },
  {
    id: 'leaderboard',
    defaultLabel: 'All-India Ranker Board',
    shortDescription: 'See national study rankings and streak scoreboards.',
    category: 'analytics',
    categoryLabel: 'Diagnostics & Rankings',
    iconName: 'Flame',
    badge: 'Rankings',
    suggestedReason: 'Compare your study consistency with students across India.',
    defaultActive: false,
    defaultOrder: 16,
  },
  {
    id: 'eligibility',
    defaultLabel: 'Eligibility Calculator',
    shortDescription: 'Check your age limit and total exam attempts left.',
    category: 'analytics',
    categoryLabel: 'Diagnostics & Rankings',
    iconName: 'ShieldCheck',
    badge: 'Check',
    suggestedReason: 'Check official age limits and attempt rules for your category.',
    defaultActive: false,
    defaultOrder: 17,
  },

  // Resources & Membership
  {
    id: 'reward_milestones',
    defaultLabel: 'Reward Milestones',
    shortDescription: 'Earn coins by studying to unlock badges and perks.',
    category: 'resources_perks',
    categoryLabel: 'Perks & Membership',
    iconName: 'Gift',
    badge: 'Perks',
    suggestedReason: 'Earn rewards as you complete daily study streaks.',
    defaultActive: false,
    defaultOrder: 18,
  },
  {
    id: 'premium',
    defaultLabel: 'PRO Membership',
    shortDescription: 'Unlock ad-free learning and unlimited AI mock tests.',
    category: 'resources_perks',
    categoryLabel: 'Perks & Membership',
    iconName: 'Crown',
    badge: 'Plans',
    suggestedReason: 'Get unlimited AI solutions and full test series access.',
    defaultActive: false,
    defaultOrder: 19,
  },
  {
    id: 'teachers',
    defaultLabel: 'Teacher Portal',
    shortDescription: 'Live doubt sessions and lessons from top educators.',
    category: 'resources_perks',
    categoryLabel: 'Perks & Membership',
    iconName: 'Users',
    badge: 'Live Class',
    suggestedReason: 'Join verified educator live classes and study rooms.',
    defaultActive: false,
    defaultOrder: 20,
  },
  {
    id: 'collaboration',
    defaultLabel: 'Partner & Sponsor',
    shortDescription: 'Student ambassador opportunities and team perks.',
    category: 'resources_perks',
    categoryLabel: 'Perks & Membership',
    iconName: 'Handshake',
    badge: 'Collab',
    suggestedReason: 'Explore campus ambassador rewards and student partnerships.',
    defaultActive: false,
    defaultOrder: 21,
  },
  {
    id: 'feedback',
    defaultLabel: 'Feedback & Support',
    shortDescription: 'Ask for help or suggest new features to our team.',
    category: 'resources_perks',
    categoryLabel: 'Perks & Membership',
    iconName: 'MessageSquare',
    badge: 'Help',
    suggestedReason: 'Report any issue or tell us what new tools you need.',
    defaultActive: false,
    defaultOrder: 22,
  },
];

export interface WorkspacePreset {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  description: string;
  activeFeatureIds: ActiveTab[];
}

export const WORKSPACE_PRESETS: WorkspacePreset[] = [
  {
    id: 'focused_minimalist',
    name: 'Focused Aspirant (Minimalist)',
    tagline: 'Zero distractions, pure study & revision',
    icon: '🎯',
    description: 'Clean single-minded setup centering Syllabus Tracker, PYQs, Pomodoro Timer, Planner, and AI Mentor.',
    activeFeatureIds: ['dashboard', 'syllabus', 'pyq', 'timer', 'tasks', 'chat'],
  },
  {
    id: 'mock_test_grind',
    name: 'Test Series & Drill Fighter',
    tagline: 'Mock tests, speed practice & diagnostic analysis',
    icon: '⚡',
    description: 'Designed for intensive practice phases: CBT Mocks, 35-Yr PYQs, Question Bank, Flashcards & AI Lag Detector.',
    activeFeatureIds: ['dashboard', 'cbt', 'pyq', 'question_bank', 'flashcards', 'weakness', 'syllabus'],
  },
  {
    id: 'self_study_scholar',
    name: 'Self-Study & Conceptual Mastery',
    tagline: 'Textbooks, spaced recall & deep work',
    icon: '📚',
    description: 'Perfect for deep concept builders: Syllabus, Reference Library, Flashcards, Pomodoro, AI Mentor, and Blog.',
    activeFeatureIds: ['dashboard', 'syllabus', 'library', 'flashcards', 'timer', 'chat', 'blog'],
  },
  {
    id: 'all_in_one_pro',
    name: 'All-in-One Comprehensive',
    tagline: 'Full power suite with community & analytics',
    icon: '🚀',
    description: 'Includes all exam preparation modules, All-India Leaderboard, Study Buddy, and Reward Milestones.',
    activeFeatureIds: [
      'dashboard', 'syllabus', 'tasks', 'timer',
      'cbt', 'pyq', 'question_bank', 'flashcards', 'library',
      'chat', 'study_buddy', 'community', 'podcasts', 'blog',
      'weakness', 'leaderboard', 'eligibility',
      'reward_milestones', 'premium', 'teachers'
    ],
  },
];

const STORAGE_KEY_PREFIX = 'aspirantx_workspace_config_';

export function getDefaultWorkspaceConfig(userId: string = 'default_user'): WorkspaceConfig {
  const preferences: UserFeaturePreference[] = ALL_WORKSPACE_FEATURES.map((feat) => ({
    featureId: feat.id,
    isActive: feat.defaultActive,
    customLabel: feat.defaultLabel,
    sortOrder: feat.defaultOrder,
    lastUsedAt: new Date().toISOString(),
  }));

  return {
    userId,
    version: 1,
    isConfigured: false, // will turn true when user completes wizard or customizes
    preferences,
    updatedAt: new Date().toISOString(),
  };
}

export function loadWorkspaceConfig(userId: string = 'default_user'): WorkspaceConfig {
  try {
    const isGuest = !userId || userId === 'default_user';
    // For authenticated users, strictly load from their own unique user key to avoid cross-user leaks.
    // For unauthenticated/guest sessions, use the default/global guest key.
    const key = isGuest ? `${STORAGE_KEY_PREFIX}default_user` : `${STORAGE_KEY_PREFIX}${userId}`;
    const raw = isGuest 
      ? (localStorage.getItem(key) || localStorage.getItem('aspirantx_workspace_config_global'))
      : localStorage.getItem(key);

    if (raw) {
      const parsed: WorkspaceConfig = JSON.parse(raw);
      
      // Ensure all known features are represented (in case new features were added)
      const existingIds = new Set(parsed.preferences.map((p) => p.featureId));
      let maxOrder = Math.max(...parsed.preferences.map((p) => p.sortOrder), 0);
      
      let hasMissing = false;
      const updatedPrefs = [...parsed.preferences];

      ALL_WORKSPACE_FEATURES.forEach((meta) => {
        if (!existingIds.has(meta.id)) {
          hasMissing = true;
          maxOrder += 1;
          updatedPrefs.push({
            featureId: meta.id,
            isActive: meta.defaultActive,
            customLabel: meta.defaultLabel,
            sortOrder: maxOrder,
            lastUsedAt: undefined,
          });
        }
      });

      if (hasMissing) {
        parsed.preferences = updatedPrefs;
        saveWorkspaceConfig(parsed, false);
      }

      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load workspace config from localStorage:', e);
  }

  return getDefaultWorkspaceConfig(userId);
}

export function saveWorkspaceConfig(config: WorkspaceConfig, notifyServer: boolean = true): void {
  try {
    const targetUserId = config.userId || 'default_user';
    const isGuest = !config.userId || config.userId === 'default_user';
    const key = `${STORAGE_KEY_PREFIX}${targetUserId}`;
    const serialized = JSON.stringify({
      ...config,
      userId: targetUserId,
      updatedAt: new Date().toISOString(),
    });

    // Store under the scoped user key
    localStorage.setItem(key, serialized);

    // Only update global key if session is a guest/unauthenticated user
    if (isGuest) {
      localStorage.setItem('aspirantx_workspace_config_global', serialized);
    }

    // Broadcast local event for immediate responsive UI updates across tabs/components
    window.dispatchEvent(new CustomEvent('aspirantx_workspace_updated', { detail: config }));

    if (notifyServer) {
      // Asynchronously sync to backend (non-blocking)
      fetch('/api/user/workspace-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          workspaceConfig: config,
        }),
      }).catch((err) => {
        console.warn('Background workspace sync warning (saved locally):', err);
      });
    }
  } catch (e) {
    console.error('Error saving workspace configuration:', e);
  }
}

export async function fetchServerWorkspaceConfig(userId: string = 'default_user'): Promise<WorkspaceConfig> {
  try {
    const res = await fetch(`/api/user/workspace-preferences?userId=${encodeURIComponent(userId)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.workspaceConfig?.preferences?.length) {
        const remoteConfig: WorkspaceConfig = {
          ...data.workspaceConfig,
          userId,
        };
        // Merge with local storage
        saveWorkspaceConfig(remoteConfig, false);
        return remoteConfig;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch workspace preferences from server:', e);
  }
  return loadWorkspaceConfig(userId);
}

export function recordFeatureUsage(featureId: string, userId: string = 'default_user'): void {
  try {
    const config = loadWorkspaceConfig(userId);
    const prefIndex = config.preferences.findIndex((p) => p.featureId === featureId);
    
    if (prefIndex >= 0) {
      config.preferences[prefIndex].lastUsedAt = new Date().toISOString();
      saveWorkspaceConfig(config, true);
    }
  } catch (e) {
    console.warn('Failed to record feature usage:', e);
  }
}

export function applyWorkspacePreset(presetId: string, userId: string = 'default_user'): WorkspaceConfig {
  const preset = WORKSPACE_PRESETS.find((p) => p.id === presetId) || WORKSPACE_PRESETS[0];
  const config = loadWorkspaceConfig(userId);
  const activeSet = new Set(preset.activeFeatureIds);

  const updatedPrefs: UserFeaturePreference[] = config.preferences.map((p) => ({
    ...p,
    isActive: activeSet.has(p.featureId),
  }));

  // Reorder so preset items come first in order of activeFeatureIds
  const orderedPrefs: UserFeaturePreference[] = [];
  preset.activeFeatureIds.forEach((id, index) => {
    const found = updatedPrefs.find((p) => p.featureId === id);
    if (found) {
      orderedPrefs.push({ ...found, sortOrder: index + 1 });
    }
  });

  // Append remaining inactive items
  let orderIndex = preset.activeFeatureIds.length + 1;
  updatedPrefs.forEach((p) => {
    if (!activeSet.has(p.featureId)) {
      orderedPrefs.push({ ...p, sortOrder: orderIndex++ });
    }
  });

  const newConfig: WorkspaceConfig = {
    ...config,
    isConfigured: true,
    preferences: orderedPrefs,
    updatedAt: new Date().toISOString(),
  };

  saveWorkspaceConfig(newConfig, true);
  return newConfig;
}

export function activateFeatureInWorkspace(featureId: ActiveTab, customLabel?: string, userId: string = 'default_user'): WorkspaceConfig {
  const config = loadWorkspaceConfig(userId);
  const pref = config.preferences.find((p) => p.featureId === featureId);

  if (pref) {
    pref.isActive = true;
    if (customLabel) pref.customLabel = customLabel;
    pref.lastUsedAt = new Date().toISOString();
  }

  config.isConfigured = true;
  saveWorkspaceConfig(config, true);
  return config;
}

export function deactivateFeatureInWorkspace(featureId: ActiveTab, userId: string = 'default_user'): WorkspaceConfig {
  const config = loadWorkspaceConfig(userId);
  const pref = config.preferences.find((p) => p.featureId === featureId);

  if (pref) {
    pref.isActive = false;
  }

  saveWorkspaceConfig(config, true);
  return config;
}

export function renameWorkspaceFeature(featureId: ActiveTab, newLabel: string, userId: string = 'default_user'): WorkspaceConfig {
  const config = loadWorkspaceConfig(userId);
  const pref = config.preferences.find((p) => p.featureId === featureId);

  if (pref) {
    pref.customLabel = newLabel.trim();
  }

  saveWorkspaceConfig(config, true);
  return config;
}

export function reorderWorkspacePreferences(newPreferences: UserFeaturePreference[], userId: string = 'default_user'): WorkspaceConfig {
  const config = loadWorkspaceConfig(userId);
  const updated: WorkspaceConfig = {
    ...config,
    isConfigured: true,
    preferences: newPreferences.map((p, idx) => ({ ...p, sortOrder: idx + 1 })),
    updatedAt: new Date().toISOString(),
  };

  saveWorkspaceConfig(updated, true);
  return updated;
}

export function resetWorkspaceToDefault(userId: string = 'default_user'): WorkspaceConfig {
  const def = getDefaultWorkspaceConfig(userId);
  def.isConfigured = true;
  saveWorkspaceConfig(def, true);
  return def;
}

/**
 * Weekly Nudge Engine
 * Detects features that:
 *  1. Are hidden/inactive and highly recommended for aspirants
 *  2. Are active in workspace but haven't been opened for 7+ days
 */
export function getWeeklyNudges(config: WorkspaceConfig): WeeklyNudge[] {
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const nudges: WeeklyNudge[] = [];

  const metaMap = new Map<ActiveTab, WorkspaceFeatureMeta>();
  ALL_WORKSPACE_FEATURES.forEach((m) => metaMap.set(m.id, m));

  config.preferences.forEach((pref) => {
    const meta = metaMap.get(pref.featureId);
    if (!meta) return;

    const label = pref.customLabel || meta.defaultLabel;

    if (pref.isActive) {
      // Check if unused for > 7 days
      if (pref.lastUsedAt) {
        const lastTime = new Date(pref.lastUsedAt).getTime();
        const diff = now - lastTime;
        if (diff > SEVEN_DAYS_MS) {
          const daysInactive = Math.floor(diff / (24 * 60 * 60 * 1000));
          nudges.push({
            id: `nudge_unused_${pref.featureId}`,
            featureId: pref.featureId,
            featureName: label,
            reason: `${meta.suggestedReason} (Unused for ${daysInactive} days)`,
            type: 'unused_active',
            daysInactive,
            badge: meta.badge,
          });
        }
      }
    } else {
      // Highly recommended inactive features
      if (['cbt', 'pyq', 'flashcards', 'weakness', 'timer', 'chat'].includes(pref.featureId)) {
        nudges.push({
          id: `nudge_hidden_${pref.featureId}`,
          featureId: pref.featureId,
          featureName: label,
          reason: meta.suggestedReason,
          type: 'hidden_recommendation',
          badge: meta.badge,
        });
      }
    }
  });

  return nudges;
}

export function getActiveFeaturesInOrder(config: WorkspaceConfig): Array<{ id: ActiveTab; label: string; meta: WorkspaceFeatureMeta }> {
  const metaMap = new Map<ActiveTab, WorkspaceFeatureMeta>();
  ALL_WORKSPACE_FEATURES.forEach((m) => metaMap.set(m.id, m));

  return config.preferences
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((pref) => {
      const meta = metaMap.get(pref.featureId) || {
        id: pref.featureId,
        defaultLabel: pref.customLabel || String(pref.featureId),
        shortDescription: '',
        category: 'core' as const,
        categoryLabel: 'Core',
        iconName: 'Target',
        badge: 'Feature',
        suggestedReason: '',
        defaultActive: true,
        defaultOrder: pref.sortOrder,
      };
      return {
        id: pref.featureId,
        label: pref.customLabel || meta.defaultLabel,
        meta,
      };
    });
}
