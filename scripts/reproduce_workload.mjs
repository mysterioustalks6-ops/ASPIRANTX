// Standalone script to calculate the exact workload reproduction
import { readFileSync } from 'fs';

// 1. Let's parse DEFAULT_STUDY_LOGS from forecastDefaultData.ts
const forecastDataContent = readFileSync('src/data/forecastDefaultData.ts', 'utf8');

// Match the study logs
const logsMatch = forecastDataContent.match(/export const DEFAULT_STUDY_LOGS: StudySessionLog\[\] = \[([\s\S]*?)\];/);
const lines = logsMatch[1].split('\n').filter(l => l.includes('plannedHours'));
const sessionLogs = lines.map(line => {
  const plannedHours = parseFloat(line.match(/plannedHours:\s*([\d.]+)/)?.[1] || '0');
  const actualHours = parseFloat(line.match(/actualHours:\s*([\d.]+)/)?.[1] || '0');
  const productiveHours = parseFloat(line.match(/productiveHours:\s*([\d.]+)/)?.[1] || '0');
  return { plannedHours, actualHours, productiveHours };
});

console.log('Parsed sessionLogs count:', sessionLogs.length);

function calculateObservedProductivity(sessionLogs, defaultDailyHours = 4.5) {
  if (!sessionLogs || sessionLogs.length === 0) {
    return { sustainableDailyHours: defaultDailyHours, observedVelocityRatio: 1.0 };
  }
  const recentLogs = sessionLogs.slice(-21);
  const daysOfHistory = recentLogs.length;
  let weightedProductiveSum = 0;
  let totalWeights = 0;
  let totalPlanned = 0;
  let totalProductive = 0;

  recentLogs.forEach((log, idx) => {
    const ageCategory = daysOfHistory - 1 - idx;
    let weight = 1.0;
    if (ageCategory < 7) weight = 3.0;
    else if (ageCategory < 14) weight = 2.0;

    weightedProductiveSum += (log.productiveHours || 0) * weight;
    totalWeights += weight;
    totalPlanned += log.plannedHours || 0;
    totalProductive += log.productiveHours || 0;
  });

  const weightedDailyAverage = totalWeights > 0 ? weightedProductiveSum / totalWeights : defaultDailyHours;
  let sustainableDailyHours = weightedDailyAverage;
  if (daysOfHistory < 7) {
    const blendWeight = daysOfHistory / 7;
    sustainableDailyHours = weightedDailyAverage * blendWeight + defaultDailyHours * (1 - blendWeight);
  }
  sustainableDailyHours = Math.max(1.0, Math.min(10.0, Math.round(sustainableDailyHours * 10) / 10));

  let observedVelocityRatio = 1.0;
  if (totalPlanned > 0 && totalProductive > 0) {
    observedVelocityRatio = Math.max(0.85, Math.min(1.40, totalPlanned / totalProductive));
  }
  return { sustainableDailyHours, observedVelocityRatio, totalPlanned, totalProductive };
}

const obs = calculateObservedProductivity(sessionLogs, 5.5);
console.log('Observed Productivity:', obs);

// Let's test with Android tasks (10 chapters from generateRealisticSyllabus):
// 7 chapters with 4 topics (each 2.5h = 10h), 3 chapters with 3 topics (each 2.5h = 7.5h -> Math.round is 8h)
const DIFFICULTY_MULTIPLIER = { Easy: 0.85, Medium: 1.0, Hard: 1.25, 'Very Hard': 1.50 };

function calculateRemainingWorkload(tasks, progressMap = new Map(), observedVelocityRatio = 1.0, targetRevisionCycles = 2) {
  let remainingLearningHours = 0;
  let remainingPracticeHours = 0;
  let remainingPyqHours = 0;
  let remainingRevisionHours = 0;
  let totalSyllabusBaseHours = 0;

  for (const task of tasks) {
    const prog = progressMap.get(task.id);
    const diff = prog?.studentSpecificDifficulty || task.difficulty || 'Medium';
    const diffMult = DIFFICULTY_MULTIPLIER[diff] || 1.0;
    const baseHours = (task.estimatedHours || 10) * diffMult;
    totalSyllabusBaseHours += baseHours;

    if (!prog) {
      remainingLearningHours += baseHours * observedVelocityRatio;
      remainingPracticeHours += (baseHours * 0.25) * observedVelocityRatio;
      remainingPyqHours += (baseHours * 0.20) * observedVelocityRatio;
      remainingRevisionHours += (baseHours * 0.35) * targetRevisionCycles;
      continue;
    }
  }

  const totalRemainingWorkload = Math.round(
    remainingLearningHours + remainingPracticeHours + remainingPyqHours + remainingRevisionHours
  );

  return {
    remainingLearningHours: Math.round(remainingLearningHours),
    remainingPracticeHours: Math.round(remainingPracticeHours),
    remainingPyqHours: Math.round(remainingPyqHours),
    remainingRevisionHours: Math.round(remainingRevisionHours),
    totalRemainingWorkload,
    totalSyllabusBaseHours: Math.round(totalSyllabusBaseHours),
  };
}

// Android: 7 chapters of 10h, 3 chapters of 8h (estHours in SyllabusTracker)
// difficulty is 'Hard' because weightage is 'High'
const androidTasks = [
  ...Array(7).fill({ estimatedHours: 10, difficulty: 'Hard' }),
  ...Array(3).fill({ estimatedHours: 8, difficulty: 'Hard' })
];

const androidWorkload = calculateRemainingWorkload(androidTasks, new Map(), obs.observedVelocityRatio, 2);
console.log('Android Workload:', androidWorkload);

// Web: 14 topics (from examRegistry syllabusTree)
// Each has 1 subtopic of 2.5h -> estHours: Math.round(2.5) = 3! Or was estHours 2.5?
// Let's check: in SyllabusTracker.tsx:
// estHours = t.subtopics.reduce(...) = 2.5.
// Then estimatedHours: Math.round(estHours) = Math.round(2.5) = 3!
// difficulty: 'Hard' (weightage: 'High')
const webTasksWith3 = Array(14).fill({ estimatedHours: 3, difficulty: 'Hard' });
const webWorkload3 = calculateRemainingWorkload(webTasksWith3, new Map(), obs.observedVelocityRatio, 2);
console.log('Web Workload (Math.round 2.5 = 3):', webWorkload3);

const webTasksWith2_5 = Array(14).fill({ estimatedHours: 2.5, difficulty: 'Hard' });
const webWorkload2_5 = calculateRemainingWorkload(webTasksWith2_5, new Map(), obs.observedVelocityRatio, 2);
console.log('Web Workload (2.5 unrounded):', webWorkload2_5);
