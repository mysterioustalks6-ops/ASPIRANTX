import { SyllabusTopic, SubTopic, PredictorSettings } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const getProgressKey = (userId?: string) => `aspirantx_subtopic_progress_v3_${userId || 'guest'}`;
const getSettingsKey = (userId?: string) => `aspirantx_predictor_settings_v3_${userId || 'guest'}`;

export const DEFAULT_PREDICTOR_SETTINGS: PredictorSettings = {
  hoursPerSubtopic: 2.5, // Default 2.5 hours per sub-topic
  dailyStudyHours: 10.0, // Default 10 hours per day
  startDate: new Date().toISOString(),
  actualHoursLoggedToday: 10.0,
};

export interface SyncState {
  status: 'synced' | 'saving' | 'offline' | 'error';
  lastSavedAt?: string;
  message?: string;
}

/**
 * Loads checked subtopic IDs from local storage or Supabase
 */
export async function loadCompletedSubtopicIds(userId?: string): Promise<Set<string>> {
  try {
    if (isSupabaseConfigured && userId) {
      const { data, error } = await supabase
        .from('user_syllabus_progress')
        .select('completed_subtopic_ids')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data?.completed_subtopic_ids && Array.isArray(data.completed_subtopic_ids)) {
        return new Set(data.completed_subtopic_ids);
      }

      // Fallback check user metadata in Supabase Auth if table returned null
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser?.user?.user_metadata?.completed_subtopic_ids && Array.isArray(authUser.user.user_metadata.completed_subtopic_ids)) {
        return new Set(authUser.user.user_metadata.completed_subtopic_ids);
      }
    }
  } catch (err) {
    console.warn('Supabase fetch progress error, falling back to localStorage:', err);
  }

  // LocalStorage fallback
  const key = getProgressKey(userId);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    } catch (e) {
      console.error('Error parsing progress from localStorage:', e);
    }
  }

  return new Set();
}

/**
 * Saves completed subtopic IDs to Supabase and LocalStorage
 */
export async function saveCompletedSubtopicIds(
  completedIds: Set<string>,
  userId?: string
): Promise<SyncState> {
  const idsArray = Array.from(completedIds);

  // Always save locally first for instant offline responsiveness
  const key = getProgressKey(userId);
  localStorage.setItem(key, JSON.stringify(idsArray));

  // If subtopics are completed, trigger streak update on server
  if (completedIds.size > 0) {
    try {
      fetch('/api/user/streak/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId || 'guest', activityType: 'syllabus_progress' })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.streakDays === 'number') {
            window.dispatchEvent(
              new CustomEvent('aspirantx_streak_updated', {
                detail: { streakDays: data.streakDays, lastActiveDate: data.lastActiveDate },
              })
            );
          }
        })
        .catch(() => {});
    } catch (e) {}
  }

  if (!isSupabaseConfigured || !userId) {
    return {
      status: 'synced',
      lastSavedAt: new Date().toLocaleTimeString(),
      message: 'Saved locally (Cloud setup optional)',
    };
  }

  try {
    const { error } = await supabase
      .from('user_syllabus_progress')
      .upsert(
        {
          user_id: userId,
          completed_subtopic_ids: idsArray,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      // If table doesn't exist yet, save to user metadata
      await supabase.auth.updateUser({
        data: { completed_subtopic_ids: idsArray },
      });
    }

    return {
      status: 'synced',
      lastSavedAt: new Date().toLocaleTimeString(),
      message: 'Saved to Supabase Cloud',
    };
  } catch (err: any) {
    console.warn('Failed to sync progress to Supabase:', err);
    return {
      status: 'offline',
      lastSavedAt: new Date().toLocaleTimeString(),
      message: 'Saved locally (Supabase offline)',
    };
  }
}

/**
 * Loads Predictor Engine settings
 */
export function loadPredictorSettings(userId?: string): PredictorSettings {
  const key = getSettingsKey(userId);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      return { ...DEFAULT_PREDICTOR_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {
      console.error('Error reading predictor settings:', e);
    }
  }
  return DEFAULT_PREDICTOR_SETTINGS;
}

/**
 * Saves Predictor Engine settings
 */
export function savePredictorSettings(settings: PredictorSettings, userId?: string): void {
  const key = getSettingsKey(userId);
  localStorage.setItem(key, JSON.stringify(settings));
}

/**
 * Predictor Engine Calculation helper
 */
export interface PredictorStats {
  totalSubtopics: number;
  completedSubtopics: number;
  remainingSubtopics: number;
  hoursPerSubtopic: number; // e.g. 2.5
  dailyStudyHours: number; // e.g. 10.0
  totalRemainingHours: number; // e.g. remainingSubtopics * 2.5
  predictedDays: number; // Math.ceil(totalRemainingHours / dailyStudyHours)
  predictedCompletionDate: string; // Formatted date e.g. "Oct 24, 2026"
  completionPercentage: number;
  paceStatus: 'Ahead' | 'On Track' | 'Lagging';
  lagDays: number;
}

export function calculatePredictorStats(
  topics: SyllabusTopic[],
  settings: PredictorSettings = DEFAULT_PREDICTOR_SETTINGS,
  exam?: string
): PredictorStats {
  const filteredTopics = exam ? topics.filter((t) => !t.exam || t.exam === exam) : topics;
  let totalSubtopics = 0;
  let completedSubtopics = 0;

  for (const topic of filteredTopics) {
    if (topic.subtopics && topic.subtopics.length > 0) {
      totalSubtopics += topic.subtopics.length;
      completedSubtopics += topic.subtopics.filter((s) => s.completed).length;
    } else {
      totalSubtopics += topic.subtopicsCount || 1;
      completedSubtopics += topic.completedSubtopics || 0;
    }
  }

  const remainingSubtopics = Math.max(0, totalSubtopics - completedSubtopics);
  const hoursPerSub = settings.hoursPerSubtopic || 2.5;
  const dailyHours = settings.dailyStudyHours || 10.0;

  // Calculate remaining hours based on UNCHECKED sub-topics
  const totalRemainingHours = remainingSubtopics * hoursPerSub;

  // Calculate days elapsed since study start
  const startDate = new Date(settings.startDate || Date.now());
  const now = new Date();
  const daysElapsed = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Pace lag calculation: if time has passed without meeting daily target 10h/day average
  // Expected completed subtopics so far
  const expectedSubtopicsCompleted = Math.min(totalSubtopics, Math.floor((daysElapsed * dailyHours) / hoursPerSub));
  const subtopicDeficit = Math.max(0, expectedSubtopicsCompleted - completedSubtopics);
  const lagDays = Math.ceil((subtopicDeficit * hoursPerSub) / dailyHours);

  // Predicted days = base remaining days + lag days if behind
  const basePredictedDays = Math.ceil(totalRemainingHours / dailyHours);
  const finalPredictedDays = Math.max(0, basePredictedDays + lagDays);

  // Target completion date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + finalPredictedDays);
  const formattedDate = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const completionPercentage = totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;

  let paceStatus: 'Ahead' | 'On Track' | 'Lagging' = 'On Track';
  if (lagDays > 2) {
    paceStatus = 'Lagging';
  } else if (completedSubtopics > expectedSubtopicsCompleted + 2) {
    paceStatus = 'Ahead';
  }

  return {
    totalSubtopics,
    completedSubtopics,
    remainingSubtopics,
    hoursPerSubtopic: hoursPerSub,
    dailyStudyHours: dailyHours,
    totalRemainingHours,
    predictedDays: finalPredictedDays,
    predictedCompletionDate: formattedDate,
    completionPercentage,
    paceStatus,
    lagDays,
  };
}
