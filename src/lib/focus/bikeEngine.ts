/**
 * ── BIKE ENGINE (PURE DERIVATION FUNCTION) ──────────────────────────────────
 * Bike state is strictly DERIVED via getBikeState(sessions, config, now, prefs).
 * Never stored as truth in localStorage or database.
 */

import { FocusSession, getDailyCountedSecondsMap, getLocalDateKey } from './sessionStore';
import { BikeEngineConfig, DEFAULT_BIKE_CONFIG, VehicleTierConfig, BikePartConfig } from './bikeConfig';

export interface UserBikePreferences {
  weeklyTargetHours?: number | null; // default null (EMPTY)
  pauseDates?: string[];            // ['YYYY-MM-DD'] for sick/travel
  restDayOfWeek?: number;           // 0=Sun, 1=Mon, ..., 6=Sat (default 0 Sunday)
}

export interface DayStudyDetail {
  dateKey: string;     // YYYY-MM-DD
  dayName: string;     // Mon, Tue...
  dayIndex: number;    // 0..6 (Mon..Sun)
  countedSeconds: number;
  isRestDay: boolean;
  isPaused: boolean;
  isMissed: boolean;
  isFuture: boolean;
  isToday: boolean;
}

export interface CompletedBikeRecord {
  tierNumber: number;
  tierId: string;
  name: string;
  type: 'bike' | 'car';
  weekNumber: number;
  year: number;
  totalHours: number;
  targetHours: number;
  completedAt: string; // ISO 8601
  partsUnlockedCount: number;
}

export interface DerivedBikeState {
  currentWeekNumber: number;        // 1..seasonWeeks
  seasonNumber: number;
  currentTier: VehicleTierConfig;
  weeklyTargetHours: number | null; // null if unset (EMPTY)
  weeklyTargetSeconds: number;
  weeklyCountedSeconds: number;
  weeklyCountedHours: number;
  progressPercent: number;          // 0..100
  unlockedParts: BikePartConfig[];  // List of parts unlocked this week
  nextPartToUnlock: BikePartConfig | null;
  missCount: number;                // 0, 1, 2, 3+
  healthStatus: 'pristine' | 'optimal' | 'warning' | 'damaged' | 'workshop';
  rebuildMinutesNeeded: number;
  rebuildMinutesCompleted: number;
  isWorkshopCleared: boolean;
  activeNudge: {
    speaker: 'veer' | 'rider';
    title: string;
    message: string;
  };
  weekDays: DayStudyDetail[];
  completedBikes: CompletedBikeRecord[];
  allTiers: VehicleTierConfig[];
}

/**
 * Returns Monday 00:00:00 of the week for given date
 */
export function getMondayOfWeek(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0 is Sun, 1 is Mon...
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Weekly target suggestion formula:
 * (Remaining Syllabus Workload Hours) / (Remaining Weeks to Exam)
 * Clamped between 10h and 40h/week.
 */
export function computeSuggestedWeeklyTarget(
  remainingWorkloadHours: number = 625,
  examDateIso?: string,
  now: Date = new Date()
): {
  suggestedHours: number;
  weeksRemaining: number;
  formulaDescription: string;
} {
  const targetDate = examDateIso ? new Date(examDateIso) : new Date(now.getFullYear(), now.getMonth() + 7, now.getDate());
  const diffMs = targetDate.getTime() - now.getTime();
  const weeksRemaining = Math.max(1, Math.round(diffMs / (7 * 24 * 3600 * 1000)));

  const rawHoursPerWeek = remainingWorkloadHours / weeksRemaining;
  const suggestedHours = Math.min(40, Math.max(10, Math.round(rawHoursPerWeek * 10) / 10));

  return {
    suggestedHours,
    weeksRemaining,
    formulaDescription: `Formula: ${remainingWorkloadHours}h remaining workload ÷ ${weeksRemaining} weeks = ~${suggestedHours}h/week`
  };
}

/**
 * Pure function: Derives entire Bike Builder & Garage state.
 */
export function getBikeState(
  sessions: FocusSession[],
  config: BikeEngineConfig = DEFAULT_BIKE_CONFIG,
  now: Date = new Date(),
  preferences: UserBikePreferences = {}
): DerivedBikeState {
  const dailyMap = getDailyCountedSecondsMap(sessions, {
    focusPresets: [25, 30, 40, 50],
    breakPresets: [5, 10],
    longBreakPresets: [15, 20],
    defaultFocusMinutes: 25,
    defaultBreakMinutes: 5,
    blocksBeforeLongBreak: 4,
    sessionCapMinutes: config.sessionCapMinutes,
    dayCapHours: config.dayCapHours,
    minStopwatchSeconds: config.minStopwatchSeconds,
    minPomodoroCompletionPercent: config.minPomodoroCompletionPercent
  });

  const weeklyTargetHours = preferences.weeklyTargetHours ?? config.defaultWeeklyTargetHours;
  const weeklyTargetSeconds = weeklyTargetHours ? weeklyTargetHours * 3600 : 0;
  const pauseDates = new Set(preferences.pauseDates || []);
  const restDayOfWeek = preferences.restDayOfWeek ?? 0; // Sunday by default

  const monday = getMondayOfWeek(now);
  const todayKey = getLocalDateKey(now);

  // 1. Build Day Details for current week
  const weekDays: DayStudyDetail[] = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  let weeklyCountedSeconds = 0;
  let missesBeforeToday = 0;

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dateKey = getLocalDateKey(dayDate);
    const secs = dailyMap[dateKey] || 0;
    const isToday = dateKey === todayKey;
    const isFuture = dayDate.getTime() > now.getTime() && !isToday;
    const isRest = dayDate.getDay() === restDayOfWeek;
    const isPaused = pauseDates.has(dateKey);

    let isMissed = false;
    if (!isFuture && !isToday && !isRest && !isPaused && secs <= 0) {
      isMissed = true;
      missesBeforeToday++;
    }

    weekDays.push({
      dateKey,
      dayName: dayNames[i],
      dayIndex: i,
      countedSeconds: secs,
      isRestDay: isRest,
      isPaused,
      isMissed,
      isFuture,
      isToday
    });

    weeklyCountedSeconds += secs;
  }

  // 2. Health & Workshop status derived from misses
  let healthStatus: 'pristine' | 'optimal' | 'warning' | 'damaged' | 'workshop' = 'pristine';
  if (missesBeforeToday === 1) healthStatus = 'warning';
  else if (missesBeforeToday === 2) healthStatus = 'damaged';
  else if (missesBeforeToday >= 3) healthStatus = 'workshop';

  // Check Workshop rebuild progress (needs config.workshopRebuildMinutes of focus)
  const rebuildMinutesNeeded = config.workshopRebuildMinutes;
  let rebuildMinutesCompleted = 0;
  let isWorkshopCleared = healthStatus !== 'workshop';

  if (healthStatus === 'workshop') {
    const todaySecs = dailyMap[todayKey] || 0;
    rebuildMinutesCompleted = Math.min(rebuildMinutesNeeded, Math.floor(todaySecs / 60));
    if (rebuildMinutesCompleted >= rebuildMinutesNeeded) {
      isWorkshopCleared = true;
      healthStatus = 'optimal'; // Restored to optimal after rebuild
    }
  }

  // 3. Current Tier calculation & Historical Completed Bikes
  // Find completed weeks prior to current week
  const completedBikes: CompletedBikeRecord[] = [];

  // Group historical sessions by week
  const weeksMap = new Map<string, number>();
  for (const session of sessions) {
    if (!session.completed || session.type !== 'focus') continue;
    const sDate = new Date(session.startedAt);
    const sMonday = getMondayOfWeek(sDate);
    const sMonKey = getLocalDateKey(sMonday);
    if (sMonKey !== getLocalDateKey(monday)) {
      const existing = weeksMap.get(sMonKey) || 0;
      const counted = Math.min(session.actualSeconds, config.sessionCapMinutes * 60);
      weeksMap.set(sMonKey, existing + counted);
    }
  }

  let completedWeeksCount = 0;
  for (const [wKey, totalSecs] of weeksMap.entries()) {
    // If historical week met weekly target
    const targetSecs = weeklyTargetSeconds > 0 ? weeklyTargetSeconds : 20 * 3600;
    if (totalSecs >= targetSecs) {
      completedWeeksCount++;
      const tierIdx = Math.min(config.tiers.length - 1, completedWeeksCount - 1);
      const tier = config.tiers[tierIdx];
      completedBikes.push({
        tierNumber: tier.tierNumber,
        tierId: tier.id,
        name: tier.name,
        type: tier.type,
        weekNumber: completedWeeksCount,
        year: new Date(wKey).getFullYear(),
        totalHours: Math.round((totalSecs / 3600) * 10) / 10,
        targetHours: Math.round((targetSecs / 3600) * 10) / 10,
        completedAt: wKey,
        partsUnlockedCount: tier.parts.length
      });
    }
  }

  // Current active tier
  const activeTierIndex = Math.min(config.tiers.length - 1, completedWeeksCount);
  const currentTier = config.tiers[activeTierIndex];
  const currentWeekNumber = (completedWeeksCount % config.seasonWeeks) + 1;
  const seasonNumber = Math.floor(completedWeeksCount / config.seasonWeeks) + 1;

  // 4. Progress percentage and unlocked parts
  const progressPercent = weeklyTargetSeconds > 0
    ? Math.min(100, Math.round((weeklyCountedSeconds / weeklyTargetSeconds) * 1000) / 10)
    : 0;

  const unlockedParts: BikePartConfig[] = [];
  let nextPartToUnlock: BikePartConfig | null = null;

  if (weeklyTargetHours && weeklyTargetHours > 0) {
    for (const part of currentTier.parts) {
      if (progressPercent >= part.unlockPercent) {
        unlockedParts.push(part);
      } else if (!nextPartToUnlock) {
        nextPartToUnlock = part;
      }
    }
  } else {
    // Target is unset; no parts unlocked yet
    nextPartToUnlock = currentTier.parts[0];
  }

  // 5. Original Nudges (Veer OR Rider — never both at the same time)
  let activeNudge: { speaker: 'veer' | 'rider'; title: string; message: string };

  if (!weeklyTargetHours) {
    activeNudge = {
      speaker: 'rider',
      title: 'Set Your Weekly Target',
      message: 'Every champion needs a destination. Set your target weekly study hours to begin forging the Highway Cruiser!'
    };
  } else if (progressPercent >= 100) {
    activeNudge = {
      speaker: 'rider',
      title: 'Target Smashed!',
      message: `Exceptional discipline! 100% of weekly target conquered. The ${currentTier.name} is fully built and ready for the Garage.`
    };
  } else if (healthStatus === 'workshop') {
    activeNudge = {
      speaker: 'rider',
      title: 'Workshop Pit Stop',
      message: `Bike is in the workshop for maintenance. Complete a ${rebuildMinutesNeeded - rebuildMinutesCompleted}m focus ride today to hit the highway again!`
    };
  } else if (healthStatus === 'damaged') {
    activeNudge = {
      speaker: 'veer',
      title: 'Veer is Watching Over You',
      message: 'Pace yourself, dost! Two missed rides noticed. Hop in for a calm 25-minute session today to keep your ride healthy.'
    };
  } else if (healthStatus === 'warning') {
    activeNudge = {
      speaker: 'veer',
      title: 'Gentle Reminder',
      message: 'One rest day behind you. Jump on the highway today to keep the engine humming!'
    };
  } else {
    activeNudge = {
      speaker: 'rider',
      title: 'Highway Momentum',
      message: nextPartToUnlock
        ? `Next part: ${nextPartToUnlock.name} unlocks at ${nextPartToUnlock.unlockPercent}% of weekly target. Keep riding!`
        : 'Stay in the flow zone!'
    };
  }

  return {
    currentWeekNumber,
    seasonNumber,
    currentTier,
    weeklyTargetHours,
    weeklyTargetSeconds,
    weeklyCountedSeconds,
    weeklyCountedHours: Math.round((weeklyCountedSeconds / 3600) * 10) / 10,
    progressPercent,
    unlockedParts,
    nextPartToUnlock,
    missCount: missesBeforeToday,
    healthStatus,
    rebuildMinutesNeeded,
    rebuildMinutesCompleted,
    isWorkshopCleared,
    activeNudge,
    weekDays,
    completedBikes,
    allTiers: config.tiers
  };
}

export function loadUserBikePreferences(userId: string = 'guest'): UserBikePreferences {
  try {
    const saved = localStorage.getItem(`aspirantx_bike_prefs_${userId}`);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { weeklyTargetHours: null, pauseDates: [], restDayOfWeek: 0 };
}

export function saveUserBikePreferences(userId: string = 'guest', prefs: UserBikePreferences): void {
  try {
    localStorage.setItem(`aspirantx_bike_prefs_${userId}`, JSON.stringify(prefs));
  } catch {}
}
