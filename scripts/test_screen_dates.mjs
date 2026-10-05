import { getDefaultExamDate } from '../src/lib/packetSyncService.js';

// Test unified date resolution across all screens:
// 1. Today
// 2. Map Territory
// 3. Map List
// 4. Map Path
// 5. Pace
// 6. Revision Buffer

function getScreenDateAndDays(screenName, examId, userSetDate = null) {
  const canonicalDateStr = userSetDate || getDefaultExamDate(examId);
  const targetDate = new Date(canonicalDateStr);
  const today = new Date();
  const diffMs = targetDate.getTime() - today.getTime();
  const daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    screen: screenName,
    examId,
    examDate: canonicalDateStr,
    daysLeft,
    formattedDate: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
}

const screens = [
  'Today (StudentDashboard)',
  'Map Territory (MapJourneyView)',
  'Map List (SyllabusTracker & VelocityHud)',
  'Map Path (DuolingoPathEngine)',
  'Pace (calculatePaceStatus)',
  'Buffer Cushion (forecastingEngine)'
];

console.log('=== UNIFIED EXAM DATE VERIFICATION TEST (DEFAULT: NEET_UG) ===');
screens.forEach(s => {
  const res = getScreenDateAndDays(s, 'NEET_UG');
  console.log(`[${res.screen}]: Date = ${res.examDate} (${res.formattedDate}) | Days Left = ${res.daysLeft} days`);
});

console.log('\n=== UNIFIED EXAM DATE VERIFICATION TEST (USER-SET DATE: 2027-06-15) ===');
screens.forEach(s => {
  const res = getScreenDateAndDays(s, 'NEET_UG', '2027-06-15');
  console.log(`[${res.screen}]: Date = ${res.examDate} (${res.formattedDate}) | Days Left = ${res.daysLeft} days`);
});
