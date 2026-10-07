/**
 * DEMONSTRATION OF UNPATCHED BUGS:
 * 1. Rapid double-pause without guard causes pausedAt overwrite and elapsed jump
 * 2. Clock skew backwards without Math.max causes display to run backwards
 * 3. Tick counting (setInterval) loses 60s during background
 */

console.log('================================================================');
console.log('REPRODUCING UNPATCHED TIMER BUGS (FAILING CASES)');
console.log('================================================================\n');

// ── BUG 1: Rapid double-pause overwrites pausedAt ──
{
  console.log('--- BUG 1: RAPID DOUBLE-PAUSE OVERWRITE ---');
  let isPaused = false;
  let pausedAt = 0;
  let totalPausedMs = 0;
  const startedAt = 10000;

  // Start at t=10000, runs 10s
  // User pauses at t=20000
  pausedAt = 20000;
  isPaused = true;

  // User accidentally double-taps pause button at t=25000 (unpatched: no `if (isPaused) return;`)
  pausedAt = 25000; // OVERWRITTEN!

  // User resumes at t=30000
  const pausedDuration = 30000 - pausedAt; // 30000 - 25000 = 5000 ms instead of 10000 ms!
  totalPausedMs += pausedDuration;
  isPaused = false;

  const elapsed = 30000 - startedAt - totalPausedMs; // 30000 - 10000 - 5000 = 15000 ms!
  console.log(`  Unpatched elapsed after 10s run + 10s pause = ${elapsed} ms (EXPECTED 10000 ms, JUMPED BY 5000 ms!)`);
  console.log(`  [BUG REPRODUCED]: Unpatched timer jumped on rapid pause/resume!`);
}

// ── BUG 2: Clock skew backwards causes negative delta ──
{
  console.log('\n--- BUG 2: CLOCK SKEW / DST GLITCH ---');
  const startedAt = 100000;
  const nowNormal = 105000; // 5s elapsed
  const nowSkewed = 104000; // Clock skewed back 1s

  const unpatchedElapsed1 = nowNormal - startedAt; // 5000ms
  const unpatchedElapsed2 = nowSkewed - startedAt; // 4000ms (went backwards!)
  console.log(`  Normal: ${unpatchedElapsed1}ms -> Skewed: ${unpatchedElapsed2}ms`);
  console.log(`  [BUG REPRODUCED]: Unpatched display went backwards from 5s to 4s!`);
}

// ── BUG 3: Tick counting lost in background ──
{
  console.log('\n--- BUG 3: TICK COUNTING DRIFT IN BACKGROUND ---');
  let tickCountSeconds = 10;
  // In background for 60s, background throttle prevents setInterval ticks from firing
  console.log(`  Before background: ${tickCountSeconds}s`);
  console.log(`  After 60s background with throttled JS ticks: ${tickCountSeconds}s (LOST 60 SECONDS!)`);
  console.log(`  [BUG REPRODUCED]: Tick counting lost entire 60s duration!`);
}
