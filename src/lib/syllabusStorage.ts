import { SyllabusTopic, SubTopic, PredictorSettings } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { syncWorker } from './syncWorker';
import { syncAuthoritativeWallpaperToNative } from './nativeWallpaperBridge';

export const getProgressKey = (userId?: string, examId?: string) =>
  `aspirantx_subtopic_progress_v3_${userId || 'guest'}_${examId || 'ALL'}`;
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
 * Loads checked subtopic IDs from Neon PostgreSQL Cloud API, Supabase, or LocalStorage partitioned by user + exam
 */
export async function loadCompletedSubtopicIds(userId?: string, examId?: string): Promise<Set<string>> {
  const normExam = (examId || 'ALL').toUpperCase();
  const key = getProgressKey(userId, normExam);

  // 1. Authoritative Neon PostgreSQL Cloud API fetch for authenticated users
  if (userId && userId !== 'guest' && userId !== 'usr_guest_101') {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('aspirantx_auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/user/syllabus-progress?exam=${encodeURIComponent(normExam)}`, { headers }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data && data.success && data.progress) {
          const ids = data.progress.completed_subtopic_ids || data.progress.completedSubtopics;
          if (Array.isArray(ids)) {
            // Update local storage so cache stays synchronized with cloud
            try {
              localStorage.setItem(key, JSON.stringify(ids));
            } catch (e) {}
            return new Set(ids);
          }
        }
      }
    } catch (apiErr) {
      console.warn('[syllabusStorage] Backend syllabus progress fetch error:', apiErr);
    }
  }

  // 2. Fallback check Supabase partitioned by user + exam
  try {
    if (isSupabaseConfigured && userId) {
      let query = supabase
        .from('user_syllabus_progress')
        .select('completed_subtopic_ids')
        .eq('user_id', userId);

      if (normExam) {
        query = query.eq('exam_id', normExam);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data?.completed_subtopic_ids && Array.isArray(data.completed_subtopic_ids)) {
        return new Set(data.completed_subtopic_ids);
      }

      // Fallback check user metadata in Supabase Auth if table returned null
      const { data: authUser } = await supabase.auth.getUser();
      const metaKey = normExam ? `completed_subtopic_ids_${normExam}` : 'completed_subtopic_ids';
      if (authUser?.user?.user_metadata?.[metaKey] && Array.isArray(authUser.user.user_metadata[metaKey])) {
        return new Set(authUser.user.user_metadata[metaKey]);
      }
    }
  } catch (err) {
    console.warn('Supabase fetch progress error, falling back to localStorage:', err);
  }

  // 3. LocalStorage partitioned by exam (offline instant cache)
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
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
 * Fast synchronous reader for locally cached completed subtopics partitioned by user + exam
 */
export function getLocalCompletedSubtopicIds(userId?: string, examId?: string): Set<string> {
  const normExam = (examId || 'ALL').toUpperCase();
  const key = getProgressKey(userId, normExam);
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (e) {}
  return new Set();
}

/**
 * Saves completed subtopic IDs to Neon PostgreSQL Cloud, IndexedDB Queue, and LocalStorage partitioned by user + exam
 */
export async function saveCompletedSubtopicIds(
  completedIds: Set<string>,
  userId?: string,
  examId?: string
): Promise<SyncState> {
  const normExam = (examId || 'ALL').toUpperCase();
  const idsArray = Array.from(completedIds);

  // 1. Always save locally first with user + exam scoping for instant offline responsiveness
  const key = getProgressKey(userId, normExam);
  try {
    localStorage.setItem(key, JSON.stringify(idsArray));
  } catch (e) {}

  // 2. Durable IndexedDB Queue for batched low-cloud sync
  syncWorker.enqueueSyllabusProgress(userId || 'guest', normExam, idsArray).catch(() => {});

  // 3. Update native Android Live Wallpaper with new syllabus completion %
  syncAuthoritativeWallpaperToNative(userId, normExam).catch(() => {});

  // 4. If subtopics are completed, trigger streak update on server
  if (completedIds.size > 0) {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('aspirantx_auth_token') : null;
      const streakHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) streakHeaders['Authorization'] = `Bearer ${token}`;

      fetch('/api/user/streak/trigger', {
        method: 'POST',
        headers: streakHeaders,
        body: JSON.stringify({ userId: userId || 'guest', activityType: 'syllabus_progress', examId: normExam })
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

  // 5. Authoritative Direct Neon PostgreSQL Cloud Sync
  if (userId && userId !== 'guest' && userId !== 'usr_guest_101') {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('aspirantx_auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/user/syllabus-progress', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          exam: normExam,
          progress: {
            completed_subtopic_ids: idsArray,
            completedSubtopics: idsArray.length,
            updatedAt: new Date().toISOString()
          }
        })
      });

      if (res.ok) {
        return {
          status: 'synced',
          lastSavedAt: new Date().toLocaleTimeString(),
          message: 'Saved to Cloud (StudyRide Neon DB)',
        };
      }
    } catch (cloudErr) {
      console.warn('[syllabusStorage] Neon cloud sync fetch error:', cloudErr);
    }
  }

  // 6. Optional Supabase sync for backward compatibility
  if (isSupabaseConfigured && userId) {
    try {
      const payload: any = {
        user_id: userId,
        completed_subtopic_ids: idsArray,
        updated_at: new Date().toISOString(),
      };
      if (normExam) {
        payload.exam_id = normExam;
      }

      const { error } = await supabase
        .from('user_syllabus_progress')
        .upsert(payload, { onConflict: normExam ? 'user_id,exam_id' : 'user_id' });

      if (error) {
        const metaKey = normExam ? `completed_subtopic_ids_${normExam}` : 'completed_subtopic_ids';
        await supabase.auth.updateUser({
          data: { [metaKey]: idsArray },
        });
      }
    } catch (err: any) {
      console.warn('Failed to sync progress to Supabase:', err);
    }
  }

  return {
    status: 'synced',
    lastSavedAt: new Date().toLocaleTimeString(),
    message: 'Saved locally',
  };
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
  const filteredTopics = exam ? topics.filter((t) => t.exam === exam) : topics;
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
