/**
 * STOPWATCH & POMODORO TIMER ENGINE SUITE
 * Test cases:
 * 1. start
 * 2. pause
 * 3. resume
 * 4. background 60s
 * 5. kill/reopen
 * 6. midnight crossing (23:59:00 -> 00:05:00 next day)
 * 7. timezone / DST change (wall clock jump +/- 1 hr)
 * 8. rapid pause/resume (double pause clicks, 5ms bursts)
 */

let passed = 0;
let failed = 0;

function assert(cond, name, details = '') {
  if (cond) {
    passed++;
    console.log(`  [PASS] ${name} ${details ? `(${details})` : ''}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${name} ${details ? `(${details})` : ''}`);
  }
}

// ── PURE TIMESTAMP ENGINE IMPLEMENTATION ──
export class TimestampTimerEngine {
  constructor(mode = 'stopwatch', plannedMinutes = 25) {
    this.mode = mode;
    this.plannedMinutes = plannedMinutes;
    this.startedAt = 0;
    this.endsAt = 0;
    this.isPaused = false;
    this.pausedAt = null;
    this.totalPausedMs = 0;
    this.lastElapsedMs = 0;
  }

  start(nowMs) {
    this.startedAt = nowMs;
    this.isPaused = false;
    this.pausedAt = null;
    this.totalPausedMs = 0;
    this.lastElapsedMs = 0;
    if (this.mode === 'pomodoro') {
      this.endsAt = nowMs + this.plannedMinutes * 60 * 1000;
    }
  }

  pause(nowMs) {
    // Rapid pause defense: ignore if already paused
    if (this.isPaused) return;
    this.isPaused = true;
    this.pausedAt = nowMs;
  }

  resume(nowMs) {
    // Rapid resume defense: ignore if not paused or no pausedAt
    if (!this.isPaused || this.pausedAt === null) return;
    const pausedDuration = Math.max(0, nowMs - this.pausedAt);
    this.totalPausedMs += pausedDuration;
    if (this.mode === 'pomodoro') {
      this.endsAt += pausedDuration;
    }
    this.isPaused = false;
    this.pausedAt = null;
  }

  getElapsedMs(nowMs) {
    if (this.startedAt === 0) return 0;
    let effectiveNow = nowMs;
    if (this.isPaused && this.pausedAt !== null) {
      effectiveNow = this.pausedAt;
    }
    const computed = Math.max(0, (effectiveNow - this.startedAt) - this.totalPausedMs);
    // Guarantee non-decreasing display
    if (computed >= this.lastElapsedMs) {
      this.lastElapsedMs = computed;
    }
    return this.lastElapsedMs;
  }

  getRemainingMs(nowMs) {
    if (this.mode !== 'pomodoro') return 0;
    if (this.isPaused && this.pausedAt !== null) {
      return Math.max(0, this.endsAt - this.pausedAt);
    }
    return Math.max(0, this.endsAt - nowMs);
  }

  // Restore state after app kill / background
  static restore(saved, nowMs) {
    const engine = new TimestampTimerEngine(saved.mode, saved.plannedMinutes);
    engine.startedAt = saved.startedAt;
    engine.endsAt = saved.endsAt || 0;
    engine.isPaused = saved.isPaused;
    engine.pausedAt = saved.pausedAt || null;
    engine.totalPausedMs = saved.totalPausedMs || 0;
    return engine;
  }
}

console.log('================================================================');
console.log('STOPWATCH & POMODORO ENGINE VERIFICATION (TIMESTAMP RULE)');
console.log('================================================================\n');

// 1. START
console.log('--- CASE 1: START ---');
{
  const t0 = 1700000000000;
  const sw = new TimestampTimerEngine('stopwatch');
  sw.start(t0);
  assert(sw.getElapsedMs(t0) === 0, 'Initial elapsed is 0 ms');
  assert(sw.getElapsedMs(t0 + 5000) === 5000, 'Elapsed after 5s is exactly 5000 ms');
}

// 2 & 3. PAUSE & RESUME
console.log('\n--- CASE 2 & 3: PAUSE & RESUME ---');
{
  const t0 = 1700000000000;
  const sw = new TimestampTimerEngine('stopwatch');
  sw.start(t0);

  // Run 10s -> Pause at t0 + 10s
  sw.pause(t0 + 10000);
  assert(sw.getElapsedMs(t0 + 10000) === 10000, 'Elapsed at pause is 10000 ms');
  assert(sw.getElapsedMs(t0 + 25000) === 10000, 'Elapsed during pause remains 10000 ms (frozen)');

  // Resume after 20s paused (at t0 + 30s)
  sw.resume(t0 + 30000);
  assert(sw.getElapsedMs(t0 + 30000) === 10000, 'Elapsed immediately upon resume is 10000 ms (no jump)');
  assert(sw.getElapsedMs(t0 + 35000) === 15000, 'Elapsed 5s after resume is 15000 ms');
  assert(sw.totalPausedMs === 20000, 'Total paused time tracked accurately as 20000 ms');
}

// 4. BACKGROUND 60 S
console.log('\n--- CASE 4: BACKGROUND 60 SECONDS ---');
{
  const t0 = 1700000000000;
  const sw = new TimestampTimerEngine('stopwatch');
  sw.start(t0);
  const beforeBg = sw.getElapsedMs(t0 + 12000); // 12s
  // Backgrounded for 60s, no JS ticks executed
  const afterBg = sw.getElapsedMs(t0 + 12000 + 60000); // 72s
  assert(afterBg === 72000, 'Elapsed after 60s background is exactly 72000 ms (zero drift)');
  assert(afterBg - beforeBg === 60000, 'Background delta matches real clock elapsed');
}

// 5. KILL / REOPEN
console.log('\n--- CASE 5: KILL / REOPEN ---');
{
  const t0 = 1700000000000;
  const sw = new TimestampTimerEngine('stopwatch');
  sw.start(t0);
  sw.pause(t0 + 30000); // paused at 30s
  
  // Persisted state
  const serialized = {
    startedAt: sw.startedAt,
    isPaused: sw.isPaused,
    pausedAt: sw.pausedAt,
    totalPausedMs: sw.totalPausedMs,
    mode: sw.mode
  };

  // Reopen 5 minutes later
  const restored = TimestampTimerEngine.restore(serialized, t0 + 330000);
  assert(restored.isPaused === true, 'Restored state retains paused status');
  assert(restored.getElapsedMs(t0 + 330000) === 30000, 'Elapsed remains exactly 30000 ms across app kill/reopen');
}

// 6. MIDNIGHT CROSSING
console.log('\n--- CASE 6: MIDNIGHT CROSSING ---');
{
  // 23:59:30 UTC -> 00:01:30 UTC next day (2 minutes / 120s)
  const beforeMidnight = new Date('2026-10-06T23:59:30.000Z').getTime();
  const afterMidnight = new Date('2026-10-07T00:01:30.000Z').getTime();

  const sw = new TimestampTimerEngine('stopwatch');
  sw.start(beforeMidnight);
  const elapsed = sw.getElapsedMs(afterMidnight);
  assert(elapsed === 120000, 'Elapsed across midnight crossing is exactly 120000 ms (2 minutes)');
}

// 7. TIMEZONE / DST CHANGE
console.log('\n--- CASE 7: TIMEZONE / DST JUMP DEFENSE ---');
{
  const t0 = 1700000000000;
  const sw = new TimestampTimerEngine('stopwatch');
  sw.start(t0);
  const normal5m = sw.getElapsedMs(t0 + 300000); // 5 min = 300000 ms
  
  // Simulated clock glitch where nowMs goes backwards by 10s
  const clockSkewBackwards = sw.getElapsedMs(t0 + 290000);
  assert(clockSkewBackwards === normal5m, 'Display never goes backwards even if system clock skews backwards');
}

// 8. RAPID PAUSE / RESUME
console.log('\n--- CASE 8: RAPID PAUSE / RESUME ---');
{
  const t0 = 1700000000000;
  const sw = new TimestampTimerEngine('stopwatch');
  sw.start(t0);

  // Rapid double-pause clicks
  sw.pause(t0 + 2000);
  sw.pause(t0 + 2010); // 2nd redundant pause click
  assert(sw.pausedAt === t0 + 2000, 'Double-pause does not overwrite original pausedAt timestamp');

  // Resume 500ms later
  sw.resume(t0 + 2500);
  assert(sw.totalPausedMs === 500, 'Paused duration calculated from original pause event');

  // Rapid resume clicks
  sw.resume(t0 + 2510);
  assert(sw.totalPausedMs === 500, 'Redundant resume click does not corrupt totalPausedMs');
}

// 9. POMODORO COUNTDOWN DISPLAY
console.log('\n--- CASE 9: POMODORO COUNTDOWN DISPLAY ---');
{
  const t0 = 1700000000000;
  const pomo = new TimestampTimerEngine('pomodoro', 25);
  pomo.start(t0);

  assert(pomo.getRemainingMs(t0) === 25 * 60 * 1000, 'Initial remaining is 25:00 (1500000 ms)');
  assert(pomo.getRemainingMs(t0 + 5 * 60 * 1000) === 20 * 60 * 1000, 'Remaining after 5 min is 20:00 (1200000 ms)');

  // Pause at 20:00 for 10 min
  pomo.pause(t0 + 5 * 60 * 1000);
  assert(pomo.getRemainingMs(t0 + 15 * 60 * 1000) === 20 * 60 * 1000, 'Remaining remains 20:00 during pause');

  // Resume at +15 min
  pomo.resume(t0 + 15 * 60 * 1000);
  assert(pomo.getRemainingMs(t0 + 15 * 60 * 1000) === 20 * 60 * 1000, 'Remaining on resume is 20:00 (no jump)');
  assert(pomo.getRemainingMs(t0 + 25 * 60 * 1000) === 10 * 60 * 1000, 'Remaining after another 10 min is 10:00');
}

console.log('\n================================================================');
console.log(`TOTAL STOPWATCH & POMO TESTS: Passed: ${passed}, Failed: ${failed}`);
console.log('================================================================');

if (failed > 0) process.exit(1);
