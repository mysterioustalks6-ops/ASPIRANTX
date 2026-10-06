/**
 * ── SESSION STORE (SINGLE SOURCE OF TRUTH) ──────────────────────────────────
 * Versioned single store for all focus, pomodoro, and stopwatch sessions.
 * 
 * Rules:
 * 1. Timer uses timestamps (remaining = endsAt - Date.now()), never tick counting.
 * 2. Pause excludes paused time.
 * 3. Resume after background/kill; if it ended while away, ask once "Count it?".
 * 4. Counted time: completed focus sessions with actualSeconds >= 60% of planned
 *    (stopwatch >= 10 min).
 * 5. Cap 120 min per session and 8 h per day (config-driven).
 * 6. Abandoned = saved completed=false, never counted.
 * 7. Streak = consecutive days with >=1 counted session; new user = 0 (never 1).
 */

export interface FocusSession {
  id: string;
  startedAt: string; // ISO 8601 UTC
  endedAt: string;   // ISO 8601 UTC
  mode: "pomodoro" | "stopwatch";
  plannedMinutes?: number;
  actualSeconds: number;
  type: "focus" | "break";
  subject?: string;
  topicId?: string;
  completed: boolean;
}

export interface ActiveTimerState {
  id: string;
  mode: "pomodoro" | "stopwatch";
  type: "focus" | "break";
  startedAt: number;     // UTC timestamp ms
  endsAt?: number;       // UTC timestamp ms (for pomodoro/break)
  plannedMinutes?: number;
  subject?: string;
  topicId?: string;
  isPaused: boolean;
  pausedAt?: number;     // UTC timestamp ms when paused
  totalPausedMs: number;
  blockIndex: number;    // 1-based index (resets after 4 blocks)
}

export interface TimerConfig {
  focusPresets: number[];     // [25, 30, 40, 50]
  breakPresets: number[];     // [5, 10]
  longBreakPresets: number[]; // [15, 20]
  defaultFocusMinutes: number; // 25
  defaultBreakMinutes: number; // 5
  blocksBeforeLongBreak: number; // 4
  sessionCapMinutes: number;  // 120
  dayCapHours: number;        // 8
  minStopwatchSeconds: number;// 600 (10 min)
  minPomodoroCompletionPercent: number; // 0.60 (60%)
}

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  focusPresets: [25, 30, 40, 50],
  breakPresets: [5, 10],
  longBreakPresets: [15, 20],
  defaultFocusMinutes: 25,
  defaultBreakMinutes: 5,
  blocksBeforeLongBreak: 4,
  sessionCapMinutes: 120,
  dayCapHours: 8,
  minStopwatchSeconds: 600,
  minPomodoroCompletionPercent: 0.60
};

const STORE_PREFIX = 'aspirantx_focus_sessions_v1_';
const ACTIVE_TIMER_KEY = 'aspirantx_active_timer_state_v1';
const PENDING_AWAY_CONFIRM_KEY = 'aspirantx_pending_away_confirm_v1';

/** Format a Date or timestamp into device local YYYY-MM-DD */
export function getLocalDateKey(dateInput: Date | number | string): string {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Check if session qualifies as counted time */
export function isSessionCounted(session: FocusSession, config: TimerConfig = DEFAULT_TIMER_CONFIG): boolean {
  if (!session.completed) return false;
  if (session.type !== 'focus') return false;
  if (session.actualSeconds <= 0) return false;

  if (session.mode === 'pomodoro') {
    const plannedSecs = (session.plannedMinutes || config.defaultFocusMinutes) * 60;
    return session.actualSeconds >= plannedSecs * config.minPomodoroCompletionPercent;
  }

  if (session.mode === 'stopwatch') {
    return session.actualSeconds >= config.minStopwatchSeconds;
  }

  return false;
}

/** Get effective counted seconds capped at 120 min per session */
export function getCountedSecondsForSession(session: FocusSession, config: TimerConfig = DEFAULT_TIMER_CONFIG): number {
  if (!isSessionCounted(session, config)) return 0;
  const maxSessionSecs = config.sessionCapMinutes * 60;
  return Math.min(session.actualSeconds, maxSessionSecs);
}

/**
 * Loads all FocusSessions for a user, running automatic non-destructive migration
 * from legacy stores (aspirantx_study_sessions_v3_*) if new store is empty.
 */
export function loadSessions(userId: string = 'guest'): FocusSession[] {
  if (typeof window === 'undefined') return [];
  const key = `${STORE_PREFIX}${userId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    // ── Non-Destructive Migration from Legacy v3 ──
    const legacyKey = `aspirantx_study_sessions_v3_${userId}`;
    const legacyRaw = localStorage.getItem(legacyKey) || localStorage.getItem('aspirantx_study_sessions_v3_guest');
    if (legacyRaw) {
      const legacyList = JSON.parse(legacyRaw);
      if (Array.isArray(legacyList) && legacyList.length > 0) {
        const migrated: FocusSession[] = legacyList.map((old: any, idx: number) => {
          const startedAt = old.createdAt || old.timestamp || new Date(Date.now() - (old.durationSeconds || 1500) * 1000).toISOString();
          const duration = Number(old.durationSeconds || 0);
          const endedAt = old.endedAt || new Date(new Date(startedAt).getTime() + duration * 1000).toISOString();
          const mode: "pomodoro" | "stopwatch" = old.mode === 'stopwatch' ? 'stopwatch' : 'pomodoro';
          const planned = old.plannedMinutes || (mode === 'pomodoro' ? Math.round(duration / 60) || 25 : undefined);
          return {
            id: old.id || `migrated_${idx}_${Date.now()}`,
            startedAt,
            endedAt,
            mode,
            plannedMinutes: planned,
            actualSeconds: duration,
            type: old.type === 'break' ? 'break' : 'focus',
            subject: old.subject || 'General Study',
            topicId: old.topicId || undefined,
            completed: old.completed !== false && duration > 0
          };
        });
        localStorage.setItem(key, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch (err) {
    console.error('Failed to load focus sessions:', err);
  }
  return [];
}

/** Save full sessions list */
export function saveSessions(userId: string = 'guest', sessions: FocusSession[]): void {
  if (typeof window === 'undefined') return;
  const key = `${STORE_PREFIX}${userId}`;
  try {
    localStorage.setItem(key, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save focus sessions:', err);
  }
}

/** Record a new session into the store */
export function recordSession(userId: string = 'guest', session: FocusSession): FocusSession[] {
  const current = loadSessions(userId);
  const updated = [session, ...current];
  saveSessions(userId, updated);
  // Dispatch notification for live telemetry & bike engine
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aspirantx_session_recorded', { detail: session }));
  }
  return updated;
}

/**
 * Computes daily counted seconds aggregated with the 8-hour daily cap applied.
 * Returns map of YYYY-MM-DD -> countedSeconds (<= 28800).
 */
export function getDailyCountedSecondsMap(
  sessions: FocusSession[],
  config: TimerConfig = DEFAULT_TIMER_CONFIG
): Record<string, number> {
  const dayTotals: Record<string, number> = {};
  const maxDaySecs = config.dayCapHours * 3600;

  // Process oldest to newest to cap sequentially
  const sorted = [...sessions].sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  for (const session of sorted) {
    const counted = getCountedSecondsForSession(session, config);
    if (counted <= 0) continue;

    const dayKey = getLocalDateKey(session.startedAt);
    const existing = dayTotals[dayKey] || 0;
    const remainingCap = Math.max(0, maxDaySecs - existing);
    const addSecs = Math.min(counted, remainingCap);
    dayTotals[dayKey] = existing + addSecs;
  }

  return dayTotals;
}

/**
 * Computes consecutive active streak (in days) using counted focus sessions.
 * Returns 0 for new user with zero counted sessions.
 */
export function computeStreakDays(
  sessions: FocusSession[],
  now: Date = new Date(),
  config: TimerConfig = DEFAULT_TIMER_CONFIG
): number {
  const dailyMap = getDailyCountedSecondsMap(sessions, config);
  const activeDays = new Set(
    Object.keys(dailyMap).filter(k => (dailyMap[k] || 0) > 0)
  );

  if (activeDays.size === 0) return 0;

  const todayKey = getLocalDateKey(now);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);

  // If user hasn't studied today or yesterday, streak is 0
  let currentCheckDate: Date;
  if (activeDays.has(todayKey)) {
    currentCheckDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (activeDays.has(yesterdayKey)) {
    currentCheckDate = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (true) {
    const key = getLocalDateKey(currentCheckDate);
    if (activeDays.has(key)) {
      streak++;
      currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Computes weekly study telemetry (Mon-Sun of current week)
 */
export function computeWeeklyStudyMetrics(
  sessions: FocusSession[],
  now: Date = new Date(),
  config: TimerConfig = DEFAULT_TIMER_CONFIG
) {
  const dailyMap = getDailyCountedSecondsMap(sessions, config);

  // Find Monday of current week
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = d.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - distanceToMonday);

  const days: { dateKey: string; label: string; seconds: number }[] = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  let totalWeeklyCountedSeconds = 0;

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dateKey = getLocalDateKey(dayDate);
    const secs = dailyMap[dateKey] || 0;
    days.push({
      dateKey,
      label: dayNames[i],
      seconds: secs
    });
    totalWeeklyCountedSeconds += secs;
  }

  const todayKey = getLocalDateKey(now);
  const todayCountedSeconds = dailyMap[todayKey] || 0;

  return {
    days,
    totalWeeklyCountedSeconds,
    totalWeeklyHours: Math.round((totalWeeklyCountedSeconds / 3600) * 10) / 10,
    todayCountedSeconds,
    todayHours: Math.round((todayCountedSeconds / 3600) * 10) / 10
  };
}

/**
 * Active Timer State helpers (Timestamp based, zero tick count drift)
 */
export function getActiveTimerState(): ActiveTimerState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_TIMER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveActiveTimerState(state: ActiveTimerState | null): void {
  if (typeof window === 'undefined') return;
  if (!state) {
    localStorage.removeItem(ACTIVE_TIMER_KEY);
  } else {
    localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(state));
  }
}

/** Check if there is a pending confirmation for a session that ended while app was closed/background */
export function getPendingAwayConfirmation(): FocusSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PENDING_AWAY_CONFIRM_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function setPendingAwayConfirmation(session: FocusSession | null): void {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem(PENDING_AWAY_CONFIRM_KEY);
  } else {
    localStorage.setItem(PENDING_AWAY_CONFIRM_KEY, JSON.stringify(session));
  }
}
