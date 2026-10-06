import { generateExamForecast, calculateRemainingWorkload, calculateObservedProductivity, projectCompletionDate } from '../src/lib/forecast/forecastingEngine';
import { DEFAULT_JEE_EXAM, DEFAULT_JEE_TASKS, DEFAULT_STUDY_LOGS, DEFAULT_CALENDAR_AVAILABILITY, DEFAULT_STUDENT_PROGRESS } from '../src/data/forecastDefaultData';
import { StudentTaskProgress } from '../src/lib/forecast/types';

console.log('=== FULL FORECAST INSPECTION ===');

// Check with DEFAULT_JEE_TASKS and default progress
const progressMap = new Map<string, StudentTaskProgress>(Object.entries(DEFAULT_STUDENT_PROGRESS));
const availabilityMap = new Map();
DEFAULT_CALENDAR_AVAILABILITY.forEach(c => availabilityMap.set(c.date, c));

const observed = calculateObservedProductivity(DEFAULT_STUDY_LOGS, 5.5);
console.log('Observed Productivity:', observed);

const workload = calculateRemainingWorkload(DEFAULT_JEE_TASKS, progressMap, observed.observedVelocityRatio, 2);
console.log('Workload with DEFAULT_JEE_TASKS:', workload);

// Check if tasks are empty:
const emptyWorkload = calculateRemainingWorkload([], new Map(), 1.0, 2);
console.log('Empty Workload:', emptyWorkload);

// Now let's check NEET workload when empty:
const neetExam = {
  id: 'NEET',
  name: 'NEET UG 2026',
  category: 'Medical',
  examDate: '2026-05-03',
  targetSyllabusCompletionDate: '2026-04-15',
  defaultDailyProductiveHours: 5.5,
  minRevisionBufferDays: 14,
  subjects: ['Physics', 'Chemistry', 'Biology']
};
const neetForecast = generateExamForecast(neetExam, [], new Map(), DEFAULT_STUDY_LOGS, availabilityMap);
console.log('NEET Forecast (empty tasks):', {
  remainingWorkloadHours: neetForecast.remainingWorkloadHours,
  realisticDays: neetForecast.realisticDays,
  targetDays: neetForecast.targetDays
});
