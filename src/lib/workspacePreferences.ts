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
    shortDescription: 'Master exam hub: daily progress, streaks, accuracy analytics & countdown.',
    category: 'core',
    categoryLabel: 'Core Daily Tools',
    iconName: 'Target',
    badge: 'Overview',
    suggestedReason: 'Gives you an instant bird-eye view of preparation progress and daily goals.',
    defaultActive: true,
    defaultOrder: 1,
  },
  {
    id: 'syllabus',
    defaultLabel: 'Syllabus Tracker',
    shortDescription: 'Interactive topic & subtopic checklist with completion progress & official weights.',
    category: 'core',
    categoryLabel: 'Core Daily Tools',
    iconName: 'BookOpen',
    badge: 'Live Track',
    suggestedReason: 'Keeps your syllabus coverage structured and prevents missing critical topics.',
    defaultActive: true,
    defaultOrder: 2,
  },
  {
    id: 'tasks',
    defaultLabel: 'Study Planner & Tasks',
    shortDescription: 'Daily timetable, time-blocked study targets & milestone task manager.',
    category: 'core',
    categoryLabel: 'Core Daily Tools',
    iconName: 'CheckSquare',
    badge: 'Tasks',
    suggestedReason: 'Organizes daily study sessions into manageable, time-bound milestones.',
    defaultActive: true,
    defaultOrder: 3,
  },
  {
    id: 'timer',
    defaultLabel: 'Pomodoro Focus Timer',
    shortDescription: 'Deep-work intervals with ambient background soundscapes and session logs.',
    category: 'core',
    categoryLabel: 'Core Daily Tools',
    iconName: 'Timer',
    badge: 'Focus',
    suggestedReason: 'Boosts deep concentration and tracks real active study hours.',
    defaultActive: true,
    defaultOrder: 4,
  },

  // Practice & Prep
  {
    id: 'cbt',
    defaultLabel: 'CBT Mock Tests',
    shortDescription: 'Real-time simulated computer-based test series with live countdown & percentile ranking.',
    category: 'practice',
    categoryLabel: 'Practice & Mock Tests',
    iconName: 'Award',
    badge: 'Real Exam',
    suggestedReason: 'Builds real exam temperament and time-management under timed pressure.',
    defaultActive: true,
    defaultOrder: 5,
  },
  {
    id: 'pyq',
    defaultLabel: 'PYQ Bank (35+ Yrs)',
    shortDescription: 'Topic-wise past 35 years solved papers with step-by-step verified solutions.',
    category: 'practice',
    categoryLabel: 'Practice & Mock Tests',
    iconName: 'BookMarked',
    badge: '1991–2026',
    suggestedReason: 'Understanding recurring exam patterns and question formats is key to cracking toppers ranks.',
    defaultActive: true,
    defaultOrder: 6,
  },
  {
    id: 'question_bank',
    defaultLabel: 'Question Bank Engine',
    shortDescription: 'Multi-difficulty practice drills with deep conceptual explanations & filters.',
    category: 'practice',
    categoryLabel: 'Practice & Mock Tests',
    iconName: 'HelpCircle',
    badge: 'Practice',
    suggestedReason: 'Reinforces concept clarity with unlimited subject and chapter-wise drills.',
    defaultActive: true,
    defaultOrder: 7,
  },
  {
    id: 'flashcards',
    defaultLabel: 'Flashcards Recall',
    shortDescription: 'Spaced repetition flashcards for rapid formula, fact, date & concept memorization.',
    category: 'practice',
    categoryLabel: 'Practice & Mock Tests',
    iconName: 'Sparkles',
    badge: 'Spaced',
    suggestedReason: 'Proven active recall technique to lock formulas and definitions in long-term memory.',
    defaultActive: true,
    defaultOrder: 8,
  },
  {
    id: 'library',
    defaultLabel: 'Reference Library',
    shortDescription: 'NCERT textbooks, standard standard reference materials, and curated topper notes.',
    category: 'practice',
    categoryLabel: 'Practice & Mock Tests',
    iconName: 'BookOpen',
    badge: 'NCERT',
    suggestedReason: 'Instant access to official NCERTs and reference materials without carrying heavy books.',
    defaultActive: false,
    defaultOrder: 9,
  },

  // AI & Community
  {
    id: 'chat',
    defaultLabel: 'AI Mentor & Doubt Solver',
    shortDescription: '24/7 Gemini-powered AI tutor for instant doubt resolution & answer evaluation.',
    category: 'ai_community',
    categoryLabel: 'AI & Community',
    iconName: 'MessageSquare',
    badge: 'Gemini AI',
    suggestedReason: 'Get immediate, clear explanations whenever you get stuck on difficult questions.',
    defaultActive: true,
    defaultOrder: 10,
  },
  {
    id: 'study_buddy',
    defaultLabel: '1-on-1 Study Buddy',
    shortDescription: 'Connect with peer aspirants preparing for the exact same target exam & stream.',
    category: 'ai_community',
    categoryLabel: 'AI & Community',
    iconName: 'Users',
    badge: 'Peer',
    suggestedReason: 'Stay accountable and discuss difficult topics with serious peer co-aspirants.',
    defaultActive: false,
    defaultOrder: 11,
  },
  {
    id: 'community',
    defaultLabel: 'Community Feed',
    shortDescription: 'Peer discussion forum, strategy exchanges, doubt sharing & study tokens.',
    category: 'ai_community',
    categoryLabel: 'AI & Community',
    iconName: 'Users',
    badge: 'Tokens',
    suggestedReason: 'Stay updated with peer notes, discussions, and shared study breakthroughs.',
    defaultActive: false,
    defaultOrder: 12,
  },
  {
    id: 'podcasts',
    defaultLabel: 'Topper Podcasts',
    shortDescription: 'Audio revision strategies, topper interviews & conceptual audio capsules.',
    category: 'ai_community',
    categoryLabel: 'AI & Community',
    iconName: 'Mic',
    badge: 'Audio',
    suggestedReason: 'Turn commute and walking time into productive audio revision.',
    defaultActive: false,
    defaultOrder: 13,
  },
  {
    id: 'blog',
    defaultLabel: 'Editorial & Blog Desk',
    shortDescription: 'Daily current affairs, PIB analysis, exam notifications & expert articles.',
    category: 'ai_community',
    categoryLabel: 'AI & Community',
    iconName: 'BookOpen',
    badge: 'Daily',
    suggestedReason: 'Stay updated with daily editorials and national exam notification updates.',
    defaultActive: false,
    defaultOrder: 14,
  },

  // Analytics & Diagnostics
  {
    id: 'weakness',
    defaultLabel: 'AI Lag & Diagnostic Engine',
    shortDescription: 'Detect weak chapters, accuracy bottlenecks, and syllabus blindspots.',
    category: 'analytics',
    categoryLabel: 'Diagnostics & Rankings',
    iconName: 'BarChart3',
    badge: 'Diagnosis',
    suggestedReason: 'Pinpoints the exact topics dragging your score down so you can fix them early.',
    defaultActive: true,
    defaultOrder: 15,
  },
  {
    id: 'leaderboard',
    defaultLabel: 'All-India Ranker Board',
    shortDescription: 'National & state percentile ranks, study streaks, and XP leaderboards.',
    category: 'analytics',
    categoryLabel: 'Diagnostics & Rankings',
    iconName: 'Flame',
    badge: 'Rankings',
    suggestedReason: 'Track where your study consistency stands compared to thousands of aspirants.',
    defaultActive: false,
    defaultOrder: 16,
  },
  {
    id: 'eligibility',
    defaultLabel: 'Eligibility Calculator',
    shortDescription: 'Instant age limit, attempts remaining & qualification validator for your exam.',
    category: 'analytics',
    categoryLabel: 'Diagnostics & Rankings',
    iconName: 'ShieldCheck',
    badge: 'Check',
    suggestedReason: 'Quickly verify age cutoffs, category relaxations, and total attempts remaining.',
    defaultActive: false,
    defaultOrder: 17,
  },

  // Resources & Membership
  {
    id: 'reward_milestones',
    defaultLabel: 'Reward Milestones',
    shortDescription: 'Earn study coins, unlock free PRO upgrades & claim premium milestone badges.',
    category: 'resources_perks',
    categoryLabel: 'Perks & Membership',
    iconName: 'Gift',
    badge: 'Perks',
    suggestedReason: 'Gamify your preparation and redeem your hard-earned study points for PRO access.',
    defaultActive: false,
    defaultOrder: 18,
  },
  {
    id: 'premium',
    defaultLabel: 'PRO Membership',
    shortDescription: 'Unlock unlimited AI question generations, mock evaluations & offline notes.',
    category: 'resources_perks',
    categoryLabel: 'Perks & Membership',
    iconName: 'Crown',
    badge: 'Plans',
    suggestedReason: 'Upgrade for zero ads, unlimited AI doubt resolution, and full-length test series.',
    defaultActive: false,
    defaultOrder: 19,
  },
  {
    id: 'teachers',
    defaultLabel: 'Teacher Portal',
    shortDescription: 'Verified educator live classes, doubt rooms & educator-authored blogs.',
    category: 'resources_perks',
    categoryLabel: 'Perks & Membership',
    iconName: 'Users',
    badge: 'Live Class',
    suggestedReason: 'Learn directly from experienced top faculties and subject specialists.',
    defaultActive: false,
    defaultOrder: 20,
  },
  {
    id: 'collaboration',
    defaultLabel: 'Partner & Sponsor',
    shortDescription: 'Campus ambassador opportunities, publisher sponsorships & institutional access.',
    category: 'resources_perks',
    categoryLabel: 'Perks & Membership',
    iconName: 'Handshake',
    badge: 'Collab',
    suggestedReason: 'Explore ambassador programs and collaborative student perks.',
    defaultActive: false,
    defaultOrder: 21,
  },
  {
    id: 'feedback',
    defaultLabel: 'Feedback & Support',
    shortDescription: 'Submit feature requests, report syllabus issues & get quick technical support.',
    category: 'resources_perks',
    categoryLabel: 'Perks & Membership',
    iconName: 'MessageSquare',
    badge: 'Help',
    suggestedReason: 'Direct line to our engineering team to report bugs or suggest enhancements.',
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
