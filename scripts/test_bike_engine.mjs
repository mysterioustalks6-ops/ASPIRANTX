import { getBikeState, computeSuggestedWeeklyTarget } from '../src/lib/focus/bikeEngine.ts';
import { DEFAULT_BIKE_CONFIG } from '../src/lib/focus/bikeConfig.ts';

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

console.log('=== TEST SUITE: BIKE ENGINE (STEP 2) ===\n');

// TEST 1: New User (empty sessions, default empty target)
{
  const state = getBikeState([], DEFAULT_BIKE_CONFIG, new Date('2026-10-07T12:00:00Z'), {});
  assert(state.weeklyTargetHours === null, '1.1 New user weekly target is null (EMPTY)');
  assert(state.progressPercent === 0, '1.2 New user progress is 0%');
  assert(state.unlockedParts.length === 0, '1.3 New user unlocked parts is 0');
  assert(state.completedBikes.length === 0, '1.4 New user has 0 completed bikes (empty garage)');
  assert(state.currentTier.tierNumber === 1, '1.5 Tier is 1 (Highway Cruiser 150)');
  assert(state.activeNudge.speaker === 'rider', '1.6 Rider prompts user to set weekly target');
}

// TEST 2: Partial Week with Target Set
// Set target = 20h. Study 5h (25% progress).
// Part 1 (frame: 12.5%) and Part 2 (wheels: 25%) should be unlocked.
{
  const testWednesday = new Date('2026-10-07T12:00:00Z'); // Wed Oct 7
  const sessions = [
    {
      id: 's_wed',
      startedAt: '2026-10-07T08:00:00Z',
      endedAt: '2026-10-07T10:00:00Z',
      mode: 'stopwatch',
      actualSeconds: 120 * 60, // 2 h
      type: 'focus',
      completed: true
    },
    {
      id: 's_wed_2',
      startedAt: '2026-10-07T11:00:00Z',
      endedAt: '2026-10-07T13:00:00Z',
      mode: 'stopwatch',
      actualSeconds: 120 * 60, // 2 h
      type: 'focus',
      completed: true
    },
    {
      id: 's_wed_3',
      startedAt: '2026-10-07T14:00:00Z',
      endedAt: '2026-10-07T15:00:00Z',
      mode: 'stopwatch',
      actualSeconds: 60 * 60, // 1 h (Total 5h)
      type: 'focus',
      completed: true
    }
  ];

  const state = getBikeState(sessions, DEFAULT_BIKE_CONFIG, testWednesday, { weeklyTargetHours: 20 });
  assert(state.weeklyCountedHours === 5, `2.1 Weekly counted hours is 5: got ${state.weeklyCountedHours}`);
  assert(state.progressPercent === 25, `2.2 Progress is 25%: got ${state.progressPercent}%`);
  assert(state.unlockedParts.length === 2, `2.3 Unlocked parts count is 2: got ${state.unlockedParts.length}`);
  assert(state.unlockedParts[0].id === 'frame', '2.4 First part is frame');
  assert(state.unlockedParts[1].id === 'wheels', '2.5 Second part is wheels');
  assert(state.nextPartToUnlock?.id === 'engine', '2.6 Next part to unlock is engine (37.5%)');
}

// TEST 3: Completed Week (100% Target Met)
{
  const testSunday = new Date('2026-10-11T12:00:00Z');
  const sessions = [];
  // 5 days x 4h = 20h
  for (let day = 5; day <= 9; day++) {
    sessions.push({
      id: `day_${day}`,
      startedAt: `2026-10-0${day}T08:00:00Z`,
      endedAt: `2026-10-0${day}T12:00:00Z`,
      mode: 'stopwatch',
      actualSeconds: 120 * 60, // 2h
      type: 'focus',
      completed: true
    });
    sessions.push({
      id: `day_${day}_b`,
      startedAt: `2026-10-0${day}T13:00:00Z`,
      endedAt: `2026-10-0${day}T15:00:00Z`,
      mode: 'stopwatch',
      actualSeconds: 120 * 60, // 2h (Total 4h per day x 5 days = 20h)
      type: 'focus',
      completed: true
    });
  }

  const state = getBikeState(sessions, DEFAULT_BIKE_CONFIG, testSunday, { weeklyTargetHours: 20 });
  assert(state.progressPercent === 100, `3.1 Progress is 100%: got ${state.progressPercent}%`);
  assert(state.unlockedParts.length === 8, `3.2 All 8 parts unlocked: got ${state.unlockedParts.length}`);
  assert(state.unlockedParts[7].id === 'trophy', '3.3 Final part is trophy');
  assert(state.activeNudge.speaker === 'rider', '3.4 Rider celebrates completed weekly target');
}

// TEST 4: 1 Miss -> Warning
{
  // Mon Oct 5 missed, now is Tue Oct 6
  const testTue = new Date('2026-10-06T12:00:00Z');
  const state = getBikeState([], DEFAULT_BIKE_CONFIG, testTue, { weeklyTargetHours: 20 });
  assert(state.missCount === 1, `4.1 Miss count is 1: got ${state.missCount}`);
  assert(state.healthStatus === 'warning', `4.2 Health status is warning: got ${state.healthStatus}`);
  assert(state.activeNudge.speaker === 'veer', '4.3 Veer delivers gentle encouragement on warning');
}

// TEST 5: 2 Misses -> Damaged
{
  // Mon Oct 5 and Tue Oct 6 missed, now is Wed Oct 7
  const testWed = new Date('2026-10-07T12:00:00Z');
  const state = getBikeState([], DEFAULT_BIKE_CONFIG, testWed, { weeklyTargetHours: 20 });
  assert(state.missCount === 2, `5.1 Miss count is 2: got ${state.missCount}`);
  assert(state.healthStatus === 'damaged', `5.2 Health status is damaged: got ${state.healthStatus}`);
  assert(state.activeNudge.speaker === 'veer', '5.3 Veer provides caring support for damaged bike');
}

// TEST 6: 3 Misses -> Workshop + Rebuild Task Restores (no parts lost)
{
  // Mon, Tue, Wed missed, now is Thu Oct 8
  const testThu = new Date('2026-10-08T12:00:00Z');
  const stateInWorkshop = getBikeState([], DEFAULT_BIKE_CONFIG, testThu, { weeklyTargetHours: 20 });
  assert(stateInWorkshop.missCount === 3, `6.1 Miss count is 3: got ${stateInWorkshop.missCount}`);
  assert(stateInWorkshop.healthStatus === 'workshop', `6.2 Health status is workshop: got ${stateInWorkshop.healthStatus}`);
  assert(stateInWorkshop.rebuildMinutesNeeded === 60, '6.3 Rebuild task requires 60 minutes');

  // User completes 60-min session today
  const rebuildSession = [{
    id: 'rebuild_1',
    startedAt: '2026-10-08T10:00:00Z',
    endedAt: '2026-10-08T11:00:00Z',
    mode: 'stopwatch',
    actualSeconds: 60 * 60,
    type: 'focus',
    completed: true
  }];
  const stateRestored = getBikeState(rebuildSession, DEFAULT_BIKE_CONFIG, testThu, { weeklyTargetHours: 20 });
  assert(stateRestored.isWorkshopCleared === true, '6.4 Workshop is cleared after 60-min session');
  assert(stateRestored.healthStatus === 'optimal', `6.5 Status restored from workshop: got ${stateRestored.healthStatus}`);
}

// TEST 7: Rest Day Exemption (Sunday rest day)
{
  // Sun Oct 11 is rest day, now is Mon Oct 12
  // If user did not study on Sunday, it is NOT counted as a miss!
  const testSun = new Date('2026-10-11T12:00:00Z');
  const stateSun = getBikeState([], DEFAULT_BIKE_CONFIG, testSun, { weeklyTargetHours: 20, restDayOfWeek: 0 });
  const sundayDetail = stateSun.weekDays.find(d => d.dayName === 'Sun');
  assert(sundayDetail?.isRestDay === true, '7.1 Sunday is recognized as Rest Day');
  assert(sundayDetail?.isMissed === false, '7.2 Sunday is NOT marked as missed');
}

// TEST 8: Pause Day (Sick/Travel)
{
  // Mon Oct 5 marked as paused
  const testTue = new Date('2026-10-06T12:00:00Z');
  const state = getBikeState([], DEFAULT_BIKE_CONFIG, testTue, {
    weeklyTargetHours: 20,
    pauseDates: ['2026-10-05']
  });
  assert(state.missCount === 0, `8.1 Paused day excluded from miss count: got ${state.missCount}`);
  assert(state.healthStatus === 'pristine', '8.2 Health status remains pristine');
}

// TEST 9: 120-Minute Session Cap
{
  const longSession = [{
    id: 's_long',
    startedAt: '2026-10-07T08:00:00Z',
    endedAt: '2026-10-07T12:00:00Z',
    mode: 'stopwatch',
    actualSeconds: 240 * 60, // 4 hours in one block
    type: 'focus',
    completed: true
  }];
  const state = getBikeState(longSession, DEFAULT_BIKE_CONFIG, new Date('2026-10-07T13:00:00Z'), { weeklyTargetHours: 20 });
  assert(state.weeklyCountedHours === 2, `9.1 4h single session capped to 2h (120 min): got ${state.weeklyCountedHours}h`);
}

// TEST 10: 8-Hour Daily Cap
{
  const massiveDaySessions = [
    { id: 'm1', startedAt: '2026-10-07T02:00:00Z', endedAt: '2026-10-07T04:00:00Z', mode: 'stopwatch', actualSeconds: 7200, type: 'focus', completed: true },
    { id: 'm2', startedAt: '2026-10-07T04:30:00Z', endedAt: '2026-10-07T06:30:00Z', mode: 'stopwatch', actualSeconds: 7200, type: 'focus', completed: true },
    { id: 'm3', startedAt: '2026-10-07T07:00:00Z', endedAt: '2026-10-07T09:00:00Z', mode: 'stopwatch', actualSeconds: 7200, type: 'focus', completed: true },
    { id: 'm4', startedAt: '2026-10-07T09:30:00Z', endedAt: '2026-10-07T11:30:00Z', mode: 'stopwatch', actualSeconds: 7200, type: 'focus', completed: true },
    { id: 'm5', startedAt: '2026-10-07T12:00:00Z', endedAt: '2026-10-07T14:00:00Z', mode: 'stopwatch', actualSeconds: 7200, type: 'focus', completed: true },
    { id: 'm6', startedAt: '2026-10-07T14:30:00Z', endedAt: '2026-10-07T16:30:00Z', mode: 'stopwatch', actualSeconds: 7200, type: 'focus', completed: true }
  ]; // Total 12h attempted in one calendar day
  const state = getBikeState(massiveDaySessions, DEFAULT_BIKE_CONFIG, new Date('2026-10-07T17:00:00Z'), { weeklyTargetHours: 20 });
  assert(state.weeklyCountedHours === 8, `10.1 12h study day capped at 8h: got ${state.weeklyCountedHours}h`);
}

// TEST 11: Timezone Boundary Integrity
{
  // Session starting 23:30 UTC = 05:00 IST next day
  const midnightSession = [{
    id: 'tz_1',
    startedAt: '2026-10-06T23:30:00Z',
    endedAt: '2026-10-07T00:30:00Z',
    mode: 'stopwatch',
    actualSeconds: 3600,
    type: 'focus',
    completed: true
  }];
  const state = getBikeState(midnightSession, DEFAULT_BIKE_CONFIG, new Date('2026-10-07T12:00:00Z'), { weeklyTargetHours: 20 });
  assert(state.weeklyCountedHours === 1, `11.1 Timezone-mapped session counted accurately: got ${state.weeklyCountedHours}h`);
}

// TEST 12: Weekly Target Formula Suggestion
{
  const suggestion = computeSuggestedWeeklyTarget(625, '2027-05-03T00:00:00Z', new Date('2026-10-07T00:00:00Z'));
  assert(suggestion.suggestedHours >= 10 && suggestion.suggestedHours <= 40, `12.1 Suggested hours clamped: got ${suggestion.suggestedHours}h/week`);
  assert(suggestion.formulaDescription.includes('Formula:'), '12.2 Formula description presented clearly');
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
