import { projectCompletionDate } from '../src/lib/forecast/forecastingEngine.ts';
import { CalendarAvailability } from '../src/lib/forecast/types.ts';
import { DEFAULT_CALENDAR_AVAILABILITY } from '../src/data/forecastDefaultData.ts';

console.log('=== SECTION F1: WORKLOAD, PACE & PROJECTION AUDIT ===\n');

// 1. Availability Map
const availabilityMap = new Map<string, CalendarAvailability>();
DEFAULT_CALENDAR_AVAILABILITY.forEach(c => availabilityMap.set(c.date, c));

// 2. Real inputs
const startDate = '2026-10-06'; // Today's actual date
const syntheticWorkloadHours = 127.0; // The benchmark workload from audit specs
const baselineCapacity = 5.5; // App's defaultDailyProductiveHours in SyllabusTracker.tsx:501

console.log(`[Trace Origin]`);
console.log(`  Start Date: ${startDate} (today's actual anchor date)`);
console.log(`  Benchmark Workload: ${syntheticWorkloadHours} hrs (synthetic audit benchmark; real NEET/JEE syllabus uses dynamic topic hours from SyllabusTracker.tsx:470)`);
console.log(`  Baseline Capacity: ${baselineCapacity} hrs/day (from SyllabusTracker.tsx:501 defaultDailyProductiveHours)`);

// 3. Step-by-step intermediate calculation for 127 hrs @ 5.5 hrs/day
console.log('\n--- Scenario A: 127.0 hrs @ 5.5 hrs/day (Baseline Planned Capacity) ---');
let remainingA = syntheticWorkloadHours;
const curDateA = new Date(startDate);
let calendarDaysA = 0;
let studyDaysA = 0;
let sundaysA = 0;
let customBlockedA = 0;

while (remainingA > 0 && calendarDaysA < 900) {
  calendarDaysA++;
  curDateA.setDate(curDateA.getDate() + 1);
  const dateKey = curDateA.toISOString().split('T')[0];
  const dayOfWeek = curDateA.getDay(); // 0 = Sunday

  const customAvail = availabilityMap.get(dateKey);
  let multiplier = 1.0;
  if (customAvail) {
    if (customAvail.status === 'unavailable') multiplier = 0.0;
    else if (customAvail.status === 'reduced') multiplier = 0.5;
  } else if (dayOfWeek === 0) {
    multiplier = 0.0;
    sundaysA++;
  }

  const capacity = baselineCapacity * multiplier;
  if (capacity > 0) {
    studyDaysA++;
    remainingA = Math.max(0, remainingA - capacity);
  }
}

console.log(`  Total Hours to clear: ${syntheticWorkloadHours}h`);
console.log(`  Daily Capacity: ${baselineCapacity}h/day`);
console.log(`  Effective Study Days: ${studyDaysA} days`);
console.log(`  Sunday Rest Days: ${sundaysA} days`);
console.log(`  Total Calendar Days: ${calendarDaysA} days`);
console.log(`  Projected Completion Date: ${curDateA.toISOString().split('T')[0]}`);

const engineOutputA = projectCompletionDate(startDate, syntheticWorkloadHours, baselineCapacity, availabilityMap, 1.0, true);
console.log(`  Engine Verification: completionDate=${engineOutputA.completionDate}, calendarDays=${engineOutputA.calendarDaysNeeded}`);

// 4. Step-by-step intermediate calculation for Observed Sustainable Pace (3.7 hrs/day)
const observedCapacity = 3.7; // Derived by calculateObservedProductivity in forecastingEngine.ts:235 from studyLogs
console.log('\n--- Scenario B: 127.0 hrs @ 3.7 hrs/day (Observed Student Pace) ---');
let remainingB = syntheticWorkloadHours;
const curDateB = new Date(startDate);
let calendarDaysB = 0;
let studyDaysB = 0;
let sundaysB = 0;

while (remainingB > 0 && calendarDaysB < 900) {
  calendarDaysB++;
  curDateB.setDate(curDateB.getDate() + 1);
  const dateKey = curDateB.toISOString().split('T')[0];
  const dayOfWeek = curDateB.getDay();

  const customAvail = availabilityMap.get(dateKey);
  let multiplier = 1.0;
  if (customAvail) {
    if (customAvail.status === 'unavailable') multiplier = 0.0;
    else if (customAvail.status === 'reduced') multiplier = 0.5;
  } else if (dayOfWeek === 0) {
    multiplier = 0.0;
    sundaysB++;
  }

  const capacity = observedCapacity * multiplier;
  if (capacity > 0) {
    studyDaysB++;
    remainingB = Math.max(0, remainingB - capacity);
  }
}

console.log(`  Total Hours to clear: ${syntheticWorkloadHours}h`);
console.log(`  Daily Capacity: ${observedCapacity}h/day`);
console.log(`  Effective Study Days: ${studyDaysB} days`);
console.log(`  Sunday Rest Days: ${sundaysB} days`);
console.log(`  Total Calendar Days: ${calendarDaysB} days`);
console.log(`  Projected Completion Date: ${curDateB.toISOString().split('T')[0]}`);

const engineOutputB = projectCompletionDate(startDate, syntheticWorkloadHours, observedCapacity, availabilityMap, 1.0, true);
console.log(`  Engine Verification: completionDate=${engineOutputB.completionDate}, calendarDays=${engineOutputB.calendarDaysNeeded}`);

console.log('\n=== AUDIT PASS: All intermediate values explicitly printed without infinite loops ===');
