import {
  isSessionCounted,
  getCountedSecondsForSession,
  getDailyCountedSecondsMap,
  computeStreakDays,
  computeWeeklyStudyMetrics,
  DEFAULT_TIMER_CONFIG
} from '../src/lib/focus/sessionStore.ts';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('=== TEST SUITE: SESSION STORE (STEP 1) ===');

// 1. New user with zero sessions
{
  const sessions = [];
  const streak = computeStreakDays(sessions, new Date('2026-10-07T12:00:00Z'));
  assert(streak === 0, 'New user streak is strictly 0 (never 1)');
  const weekly = computeWeeklyStudyMetrics(sessions, new Date('2026-10-07T12:00:00Z'));
  assert(weekly.todayCountedSeconds === 0, 'New user today study seconds is 0');
  assert(weekly.totalWeeklyCountedSeconds === 0, 'New user weekly counted seconds is 0');
}

// 2. Abandoned session (completed: false)
{
  const session = {
    id: 's1',
    startedAt: '2026-10-07T10:00:00Z',
    endedAt: '2026-10-07T10:25:00Z',
    mode: 'pomodoro',
    plannedMinutes: 25,
    actualSeconds: 1500,
    type: 'focus',
    completed: false
  };
  assert(!isSessionCounted(session), 'Abandoned session is NOT counted');
  assert(getCountedSecondsForSession(session) === 0, 'Abandoned session returns 0 counted seconds');
}

// 3. Short Pomodoro (< 60% of planned)
{
  const session = {
    id: 's2',
    startedAt: '2026-10-07T10:00:00Z',
    endedAt: '2026-10-07T10:14:00Z',
    mode: 'pomodoro',
    plannedMinutes: 25,
    actualSeconds: 14 * 60, // 56% (< 60%)
    type: 'focus',
    completed: true
  };
  assert(!isSessionCounted(session), 'Pomodoro with 56% of planned is NOT counted');
}

// 4. Completed Pomodoro (>= 60% of planned)
{
  const session = {
    id: 's3',
    startedAt: '2026-10-07T10:00:00Z',
    endedAt: '2026-10-07T10:20:00Z',
    mode: 'pomodoro',
    plannedMinutes: 25,
    actualSeconds: 16 * 60, // 64% (>= 60%)
    type: 'focus',
    completed: true
  };
  assert(isSessionCounted(session), 'Pomodoro with 64% of planned IS counted');
  assert(getCountedSecondsForSession(session) === 16 * 60, 'Counted seconds matches actual seconds');
}

// 5. Short Stopwatch (< 10 min) vs Valid Stopwatch (>= 10 min)
{
  const shortStopwatch = {
    id: 'sw1',
    startedAt: '2026-10-07T10:00:00Z',
    endedAt: '2026-10-07T10:08:00Z',
    mode: 'stopwatch',
    actualSeconds: 8 * 60, // 8 min
    type: 'focus',
    completed: true
  };
  assert(!isSessionCounted(shortStopwatch), 'Stopwatch with 8 min is NOT counted');

  const validStopwatch = {
    id: 'sw2',
    startedAt: '2026-10-07T10:00:00Z',
    endedAt: '2026-10-07T10:15:00Z',
    mode: 'stopwatch',
    actualSeconds: 15 * 60, // 15 min
    type: 'focus',
    completed: true
  };
  assert(isSessionCounted(validStopwatch), 'Stopwatch with 15 min IS counted');
}

// 6. Session Cap: 150 min session capped at 120 min (7200 s)
{
  const longSession = {
    id: 's_long',
    startedAt: '2026-10-07T08:00:00Z',
    endedAt: '2026-10-07T10:30:00Z',
    mode: 'stopwatch',
    actualSeconds: 150 * 60, // 150 min (9000 s)
    type: 'focus',
    completed: true
  };
  const counted = getCountedSecondsForSession(longSession);
  assert(counted === 120 * 60, `150-min session capped to 120 min (${counted} === 7200s)`);
}

// 7. Day Cap: 15 hours in one day capped at 8 hours (28800 s)
{
  const sessions = [
    {
      id: 'day1_s1',
      startedAt: '2026-10-07T06:00:00Z',
      endedAt: '2026-10-07T08:00:00Z',
      mode: 'stopwatch',
      actualSeconds: 120 * 60, // 2 h
      type: 'focus',
      completed: true
    },
    {
      id: 'day1_s2',
      startedAt: '2026-10-07T09:00:00Z',
      endedAt: '2026-10-07T11:00:00Z',
      mode: 'stopwatch',
      actualSeconds: 120 * 60, // 2 h
      type: 'focus',
      completed: true
    },
    {
      id: 'day1_s3',
      startedAt: '2026-10-07T12:00:00Z',
      endedAt: '2026-10-07T14:00:00Z',
      mode: 'stopwatch',
      actualSeconds: 120 * 60, // 2 h
      type: 'focus',
      completed: true
    },
    {
      id: 'day1_s4',
      startedAt: '2026-10-07T15:00:00Z',
      endedAt: '2026-10-07T17:00:00Z',
      mode: 'stopwatch',
      actualSeconds: 120 * 60, // 2 h (Total so far: 8 h)
      type: 'focus',
      completed: true
    },
    {
      id: 'day1_s5',
      startedAt: '2026-10-07T18:00:00Z',
      endedAt: '2026-10-07T20:00:00Z',
      mode: 'stopwatch',
      actualSeconds: 120 * 60, // 2 h (Total 10 h)
      type: 'focus',
      completed: true
    },
    {
      id: 'day1_s6',
      startedAt: '2026-10-07T20:30:00Z',
      endedAt: '2026-10-07T23:30:00Z',
      mode: 'stopwatch',
      actualSeconds: 180 * 60, // 3 h (Total 13 h)
      type: 'focus',
      completed: true
    }
  ];

  const map = getDailyCountedSecondsMap(sessions);
  const dateKey = Object.keys(map)[0];
  const dayTotal = map[dateKey];
  assert(dayTotal === 8 * 3600, `Day study total capped at 8h (28800s): got ${dayTotal}`);
}

// 8. Streak calculation across consecutive days
{
  const sessions = [
    {
      id: 'st1',
      startedAt: '2026-10-05T10:00:00Z',
      endedAt: '2026-10-05T10:30:00Z',
      mode: 'pomodoro',
      plannedMinutes: 30,
      actualSeconds: 1800,
      type: 'focus',
      completed: true
    },
    {
      id: 'st2',
      startedAt: '2026-10-06T10:00:00Z',
      endedAt: '2026-10-06T10:30:00Z',
      mode: 'pomodoro',
      plannedMinutes: 30,
      actualSeconds: 1800,
      type: 'focus',
      completed: true
    },
    {
      id: 'st3',
      startedAt: '2026-10-07T10:00:00Z',
      endedAt: '2026-10-07T10:30:00Z',
      mode: 'pomodoro',
      plannedMinutes: 30,
      actualSeconds: 1800,
      type: 'focus',
      completed: true
    }
  ];
  const streak = computeStreakDays(sessions, new Date('2026-10-07T15:00:00Z'));
  assert(streak === 3, `3 consecutive days yields streak 3: got ${streak}`);
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
