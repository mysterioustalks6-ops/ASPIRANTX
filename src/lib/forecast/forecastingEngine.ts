// ============================================================================
// EXAM FORECAST TRACKER: DEDICATED MATHEMATICAL FORECASTING ENGINE
// Standalone, deterministic, explainable, and exam-agnostic.
// ============================================================================

import {
  ExamDefinition,
  ExamTask,
  StudentTaskProgress,
  StudySessionLog,
  TestRecord,
  CalendarAvailability,
  ForecastResult,
  ForecastWarning,
  WhatIfConfig,
  StudyDayType
} from './types';

// Productivity multiplier per Day Type
export const DAY_TYPE_CAPACITY_MULTIPLIER: Record<StudyDayType, number> = {
  NORMAL: 1.0,
  LIGHT: 0.5,
  FULL_STUDY: 1.25,
  PARTIAL_STUDY: 0.65,
  REVISION_DAY: 0.35, // 65% of day spent revising old material, 35% on new syllabus
  TEST_DAY: 0.30,     // Mock test + preliminary review takes energy
  TEST_ANALYSIS_DAY: 0.50, // Thorough post-test diagnostic analysis
  REST_DAY: 0.0,      // Pure recovery (essential for sustainable study)
  MISSED_DAY: 0.0,    // Unplanned disruptions
  TRAVEL_EVENT_DAY: 0.25,
  COACHING_DAY: 0.70  // Formal classes take up day, leaving evening for self-study
};

export const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  Easy: 0.85,
  Medium: 1.0,
  Hard: 1.25,
  'Very Hard': 1.50
};

/**
 * Calculates effective remaining workload hours across all syllabus tasks
 */
export function calculateRemainingWorkload(
  tasks: ExamTask[],
  progressMap: Map<string, StudentTaskProgress>,
  observedVelocityRatio: number = 1.0,
  targetRevisionCycles: number = 2
): {
  remainingLearningHours: number;
  remainingPracticeHours: number;
  remainingPyqHours: number;
  remainingRevisionHours: number;
  totalRemainingWorkload: number;
  totalSyllabusBaseHours: number;
  completedBaseHours: number;
  masteredTaskCount: number;
  totalTaskCount: number;
  prerequisiteIssues: { taskId: string; incompletePrereqIds: string[] }[];
} {
  let remainingLearningHours = 0;
  let remainingPracticeHours = 0;
  let remainingPyqHours = 0;
  let remainingRevisionHours = 0;
  let totalSyllabusBaseHours = 0;
  let completedBaseHours = 0;
  let masteredTaskCount = 0;

  const completedTaskIds = new Set<string>();
  const prerequisiteIssues: { taskId: string; incompletePrereqIds: string[] }[] = [];

  // Pass 1: Gather completed tasks for prerequisite validation
  for (const task of tasks) {
    const prog = progressMap.get(task.id);
    if (prog && prog.learningStatus === 'completed') {
      completedTaskIds.add(task.id);
    }
  }

  // Pass 2: Calculate task-level workloads
  for (const task of tasks) {
    const prog = progressMap.get(task.id);
    const diff = prog?.studentSpecificDifficulty || task.difficulty || 'Medium';
    const diffMult = DIFFICULTY_MULTIPLIER[diff] || 1.0;
    const baseHours = (task.estimatedHours || 10) * diffMult;
    totalSyllabusBaseHours += baseHours;

    // Check prerequisites
    if (task.prerequisites && task.prerequisites.length > 0) {
      const missingPrereqs = task.prerequisites.filter(pId => !completedTaskIds.has(pId));
      if (missingPrereqs.length > 0) {
        prerequisiteIssues.push({ taskId: task.id, incompletePrereqIds: missingPrereqs });
      }
    }

    if (!prog) {
      // Completely unstarted
      remainingLearningHours += baseHours * observedVelocityRatio;
      remainingPracticeHours += (baseHours * 0.25) * observedVelocityRatio;
      remainingPyqHours += (baseHours * 0.20) * observedVelocityRatio;
      remainingRevisionHours += (baseHours * 0.35) * targetRevisionCycles;
      continue;
    }

    if (prog.masteryLevel >= 4) {
      masteredTaskCount++;
    }

    // Learning stage
    if (prog.learningStatus === 'completed') {
      completedBaseHours += baseHours;
    } else if (prog.learningStatus === 'in_progress') {
      remainingLearningHours += (baseHours * 0.5) * observedVelocityRatio;
      completedBaseHours += baseHours * 0.5;
    } else {
      remainingLearningHours += baseHours * observedVelocityRatio;
    }

    // Practice stage
    if (prog.practiceStatus !== 'completed') {
      const practiceFactor = prog.practiceStatus === 'in_progress' ? 0.12 : 0.25;
      remainingPracticeHours += (baseHours * practiceFactor) * observedVelocityRatio;
    }

    // PYQ stage (Target = at least 80% pyqs solved)
    const currentPyq = prog.pyqPercentage || 0;
    if (currentPyq < 80) {
      const neededFraction = (80 - currentPyq) / 100;
      remainingPyqHours += (baseHours * 0.25 * neededFraction) * observedVelocityRatio;
    }

    // Revision cycles workload
    const currentCycle = prog.revisionCycle || 0;
    if (currentCycle < targetRevisionCycles) {
      const cyclesNeeded = targetRevisionCycles - currentCycle;
      // Cycle 1 = 25% of chapter, Cycle 2 = 15%, Cycle 3 = 10%
      const cycleWeights = [0.25, 0.15, 0.10];
      let revWork = 0;
      for (let c = currentCycle; c < targetRevisionCycles; c++) {
        revWork += baseHours * (cycleWeights[c] || 0.10);
      }
      remainingRevisionHours += revWork;
    }

    // Low mastery penalty (if chapter marked complete but mastery < 3, add consolidation buffer)
    if (prog.learningStatus === 'completed' && prog.masteryLevel < 3) {
      remainingRevisionHours += baseHours * 0.20;
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
    completedBaseHours: Math.round(completedBaseHours),
    masteredTaskCount,
    totalTaskCount: tasks.length,
    prerequisiteIssues
  };
}

/**
 * Calculates recent observed student velocity (productive hours/day) using weighted rolling window
 */
export function calculateObservedProductivity(
  sessionLogs: StudySessionLog[],
  defaultDailyHours: number = 4.5
): {
  sustainableDailyHours: number;
  sustainableWeeklyHours: number;
  observedVelocityRatio: number;
  recentTrend: 'improving' | 'stable' | 'declining';
  daysOfHistory: number;
  variancePercentage: number;
  backlogHours: number;
} {
  if (!sessionLogs || sessionLogs.length === 0) {
    return {
      sustainableDailyHours: defaultDailyHours,
      sustainableWeeklyHours: Math.round(defaultDailyHours * 6 * 10) / 10,
      observedVelocityRatio: 1.0,
      recentTrend: 'stable',
      daysOfHistory: 0,
      variancePercentage: 15,
      backlogHours: 0
    };
  }

  // Sort logs by date ascending
  const sortedLogs = [...sessionLogs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Take the most recent 21 days
  const recentLogs = sortedLogs.slice(-21);
  const daysOfHistory = recentLogs.length;

  let weightedProductiveSum = 0;
  let totalWeights = 0;
  let totalPlanned = 0;
  let totalProductive = 0;

  recentLogs.forEach((log, idx) => {
    // Exponential weighting: recent days get higher weight
    // Last 7 days: weight = 3.0, Middle 7 days: weight = 2.0, Oldest 7 days: weight = 1.0
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

  // Blend with default if history is short (< 7 days) to prevent extreme jumps
  let sustainableDailyHours = weightedDailyAverage;
  if (daysOfHistory < 7) {
    const blendWeight = daysOfHistory / 7;
    sustainableDailyHours = weightedDailyAverage * blendWeight + defaultDailyHours * (1 - blendWeight);
  }

  // Bound daily hours to realistic human limits (minimum 1.0h, maximum 10.0h)
  sustainableDailyHours = Math.max(1.0, Math.min(10.0, Math.round(sustainableDailyHours * 10) / 10));
  const sustainableWeeklyHours = Math.round(sustainableDailyHours * 6 * 10) / 10;

  // Trend detection (compare last 7 days vs previous 7 days)
  let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (daysOfHistory >= 10) {
    const half = Math.floor(daysOfHistory / 2);
    const older = recentLogs.slice(0, half);
    const newer = recentLogs.slice(half);

    const oldAvg = older.reduce((acc, l) => acc + (l.productiveHours || 0), 0) / older.length;
    const newAvg = newer.reduce((acc, l) => acc + (l.productiveHours || 0), 0) / newer.length;

    if (newAvg > oldAvg * 1.10) recentTrend = 'improving';
    else if (newAvg < oldAvg * 0.88) recentTrend = 'declining';
  }

  // Variance calculation
  const mean = totalProductive / daysOfHistory;
  const variance = recentLogs.reduce((acc, l) => acc + Math.pow((l.productiveHours || 0) - mean, 2), 0) / daysOfHistory;
  const stdDev = Math.sqrt(variance);
  const variancePercentage = mean > 0 ? Math.round((stdDev / mean) * 100) : 20;

  // Observed velocity ratio (Actual vs Planned)
  let observedVelocityRatio = 1.0;
  if (totalPlanned > 0 && totalProductive > 0) {
    // If student takes 10h planned but only produces 8h, velocity ratio is 10/8 = 1.25
    observedVelocityRatio = Math.max(0.85, Math.min(1.40, totalPlanned / totalProductive));
  }

  // Backlog: Cumulative deficit in last 14 days
  const backlogHours = Math.max(0, Math.round((totalPlanned - totalProductive) * 10) / 10);

  return {
    sustainableDailyHours,
    sustainableWeeklyHours,
    observedVelocityRatio,
    recentTrend,
    daysOfHistory,
    variancePercentage,
    backlogHours
  };
}

/**
 * Projects date when a given workload will be cleared based on calendar availability and daily capacity
 */
function projectCompletionDate(
  startDateStr: string,
  workloadHours: number,
  dailyPaceHours: number,
  availabilityMap: Map<string, CalendarAvailability>,
  scenarioMultiplier: number = 1.0,
  sundayRest: boolean = true
): { completionDate: string; calendarDaysNeeded: number; effectiveStudyDaysNeeded: number } {
  let remainingHours = workloadHours;
  const curDate = new Date(startDateStr);
  let calendarDaysNeeded = 0;
  let effectiveStudyDaysNeeded = 0;

  // Max simulation horizon: 2.5 years (prevents infinite loops)
  const MAX_DAYS = 900;

  while (remainingHours > 0 && calendarDaysNeeded < MAX_DAYS) {
    calendarDaysNeeded++;
    curDate.setDate(curDate.getDate() + 1);
    const dateKey = curDate.toISOString().split('T')[0];
    const dayOfWeek = curDate.getDay(); // 0 = Sunday

    const customAvail = availabilityMap.get(dateKey);
    let dayMultiplier = 1.0;

    if (customAvail) {
      if (customAvail.status === 'unavailable') {
        dayMultiplier = 0.0;
      } else if (customAvail.status === 'reduced') {
        dayMultiplier = 0.5;
      } else {
        dayMultiplier = DAY_TYPE_CAPACITY_MULTIPLIER[customAvail.dayType] ?? 1.0;
      }
    } else {
      // Default behavior
      if (sundayRest && dayOfWeek === 0) {
        dayMultiplier = 0.0; // Weekly rest day
      } else {
        dayMultiplier = 1.0; // Normal study day
      }
    }

    const dayCapacity = dailyPaceHours * dayMultiplier * scenarioMultiplier;
    if (dayCapacity > 0) {
      effectiveStudyDaysNeeded++;
      remainingHours -= dayCapacity;
    }
  }

  return {
    completionDate: curDate.toISOString().split('T')[0],
    calendarDaysNeeded,
    effectiveStudyDaysNeeded
  };
}

/**
 * Generates actionable, informative, non-guilt-tripping warnings
 */
function generateWarnings(
  currentPaceWeekly: number,
  requiredPaceWeekly: number,
  recentTrend: 'improving' | 'stable' | 'declining',
  backlogHours: number,
  revisionBufferDays: number,
  minRevisionBufferDays: number,
  prerequisiteIssues: { taskId: string; incompletePrereqIds: string[] }[],
  tasks: ExamTask[]
): ForecastWarning[] {
  const warnings: ForecastWarning[] = [];

  if (recentTrend === 'declining') {
    warnings.push({
      id: 'warn_pace_declining',
      type: 'pace_declining',
      severity: 'warning',
      title: 'Study Pace Noticeably Softened',
      message: 'Your average productive study time has dipped over the past week compared to your baseline.',
      actionableTip: 'Prioritize one focused 90-minute morning session to reset momentum without overcompensating.'
    });
  }

  if (backlogHours >= 10) {
    warnings.push({
      id: 'warn_backlog',
      type: 'backlog_high',
      severity: backlogHours >= 20 ? 'critical' : 'warning',
      title: `Accumulated Backlog: ${backlogHours} Productive Hours`,
      message: 'Uncompleted planned sessions have created backlog. Do not try to clear this in a single marathon day.',
      actionableTip: 'Spread recovery by adding +45 minutes per weekday, or designate a Saturday afternoon catch-up slot.'
    });
  }

  if (revisionBufferDays < minRevisionBufferDays) {
    warnings.push({
      id: 'warn_buffer_tight',
      type: 'buffer_tight',
      severity: revisionBufferDays < 7 ? 'critical' : 'warning',
      title: `Tight Revision Window (${revisionBufferDays} days)`,
      message: `Your realistic syllabus completion leaves only ${revisionBufferDays} days before the exam, under the recommended ${minRevisionBufferDays}-day revision & mock test cushion.`,
      actionableTip: 'Switch high-difficulty pending topics to focused PYQ revision rather than unconstrained theory.'
    });
  }

  if (requiredPaceWeekly > currentPaceWeekly + 10) {
    warnings.push({
      id: 'warn_target_gap',
      type: 'target_unsustainable',
      severity: 'critical',
      title: 'Target Date Requires Unsustainable Weekly Surge',
      message: `Meeting your target date demands ${requiredPaceWeekly}h/week vs your current sustainable pace of ${currentPaceWeekly}h/week (+${Math.round(requiredPaceWeekly - currentPaceWeekly)}h gap).`,
      actionableTip: 'Adjust your target syllabus date 10-14 days later, or prune non-essential peripheral reading.'
    });
  }

  if (prerequisiteIssues.length > 0) {
    const taskTitle = tasks.find(t => t.id === prerequisiteIssues[0].taskId)?.title || 'Advanced topic';
    warnings.push({
      id: 'warn_prereq',
      type: 'prerequisite_unmet',
      severity: 'info',
      title: `Prerequisite Gap Detected for ${taskTitle}`,
      message: 'You have scheduled or marked progress on advanced chapters whose foundational prerequisites are not yet completed.',
      actionableTip: 'Review prerequisite concepts for 45 minutes before starting complex problem sets to avoid high friction.'
    });
  }

  return warnings;
}

/**
 * Main Entry Point: Generates comprehensive multi-scenario forecast
 */
export function generateExamForecast(
  exam: ExamDefinition,
  tasks: ExamTask[],
  progressMap: Map<string, StudentTaskProgress>,
  sessionLogs: StudySessionLog[],
  availabilityMap: Map<string, CalendarAvailability> = new Map(),
  tests: TestRecord[] = [],
  whatIf?: WhatIfConfig,
  currentDateStr: string = new Date().toISOString().split('T')[0]
): ForecastResult {
  // 1. Observed Velocity & Pace
  const observed = calculateObservedProductivity(sessionLogs, exam.defaultDailyProductiveHours);
  
  // Apply What-If modifications if provided
  let effectiveDailyPace = observed.sustainableDailyHours;
  let sundayRest = true;
  let scenarioFastMultiplier = 1.15;
  let scenarioSlowMultiplier = 0.82;
  let targetRevisionCycles = 2;

  if (whatIf) {
    effectiveDailyPace = Math.max(1.0, effectiveDailyPace + whatIf.dailyHourDelta);
    if (whatIf.removeSundayStudy) sundayRest = true;
    if (whatIf.revisionMultiplier) {
      targetRevisionCycles = Math.max(1, Math.round(2 * whatIf.revisionMultiplier));
    }
  }

  // 2. Workload Analysis
  const workload = calculateRemainingWorkload(
    tasks,
    progressMap,
    observed.observedVelocityRatio,
    targetRevisionCycles
  );

  // Add Test Workload: scheduled mocks and analysis
  let testWorkloadHours = 0;
  if (whatIf && whatIf.weeklyTestCount > 0) {
    // 3h test + 2h analysis = 5h workload per weekly test
    testWorkloadHours = whatIf.weeklyTestCount * 5 * 4; // over 4 weeks
  }

  const effectiveWorkload = workload.totalRemainingWorkload + testWorkloadHours;

  // 3. Project Scenarios
  // Realistic Scenario: based on observed pace and standard calendar
  const realisticProj = projectCompletionDate(
    currentDateStr,
    effectiveWorkload,
    effectiveDailyPace,
    availabilityMap,
    1.0,
    sundayRest
  );

  // Fast Scenario: 15% pace expansion, disciplined execution, no bottlenecks
  const fastProj = projectCompletionDate(
    currentDateStr,
    effectiveWorkload,
    effectiveDailyPace,
    availabilityMap,
    scenarioFastMultiplier,
    false // utilizes weekend partially
  );

  // Slow Scenario: 18% pace contraction, factoring in minor disruptions and extra consolidation
  const slowProj = projectCompletionDate(
    currentDateStr,
    effectiveWorkload,
    effectiveDailyPace,
    availabilityMap,
    scenarioSlowMultiplier,
    true
  );

  // Expected Range: Fast to Slow (or tighter window around realistic)
  const rangeStart = fastProj.completionDate;
  const rangeEnd = slowProj.completionDate;

  // 4. Milestone & Buffer calculations
  const examDate = new Date(exam.examDate);
  const curDate = new Date(currentDateStr);
  const realisticDate = new Date(realisticProj.completionDate);

  const daysUntilExam = Math.max(0, Math.ceil((examDate.getTime() - curDate.getTime()) / (1000 * 60 * 60 * 24)));
  const revisionBufferDays = Math.ceil((examDate.getTime() - realisticDate.getTime()) / (1000 * 60 * 60 * 24));

  // Revision Completion Date: Realistic completion + remaining revision
  const revDate = new Date(realisticDate);
  revDate.setDate(revDate.getDate() + Math.ceil(workload.remainingRevisionHours / (effectiveDailyPace || 4)));
  const plannedRevisionCompletionDate = revDate.toISOString().split('T')[0];

  // Mock test window: Days between revision completion and exam
  const mockTestWindowDays = Math.max(0, Math.ceil((examDate.getTime() - revDate.getTime()) / (1000 * 60 * 60 * 24)));

  // 5. Confidence Calculation
  let confidenceLevel: 'Low' | 'Medium' | 'High' = 'Low';
  let confidenceReason = 'Only initial baseline estimates available.';

  if (observed.daysOfHistory >= 21 && observed.variancePercentage < 35) {
    confidenceLevel = 'High';
    confidenceReason = `Grounded in ${observed.daysOfHistory} days of consistent historical logging with low variance.`;
  } else if (observed.daysOfHistory >= 7) {
    confidenceLevel = 'Medium';
    confidenceReason = `Based on ${observed.daysOfHistory} days of recent study tracking; forecast will refine as habits stabilize.`;
  } else {
    confidenceLevel = 'Low';
    confidenceReason = 'Limited historical study activity logged. Currently using standard exam baseline.';
  }

  // 6. Risk Level
  let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  if (revisionBufferDays < 0) riskLevel = 'critical';
  else if (revisionBufferDays < exam.minRevisionBufferDays / 2) riskLevel = 'high';
  else if (revisionBufferDays < exam.minRevisionBufferDays) riskLevel = 'moderate';

  // 7. Target Date Calculation (if exam has target completion date)
  let targetCalculation = undefined;
  const targetDateStr = exam.targetSyllabusCompletionDate;
  if (targetDateStr) {
    const targetDate = new Date(targetDateStr);
    const daysToTarget = Math.max(1, Math.ceil((targetDate.getTime() - curDate.getTime()) / (1000 * 60 * 60 * 24)));
    const studyDaysToTarget = Math.floor(daysToTarget * (sundayRest ? 6 / 7 : 1));
    const requiredDailyHours = Math.round((effectiveWorkload / Math.max(1, studyDaysToTarget)) * 10) / 10;
    const requiredWeeklyHours = Math.round(requiredDailyHours * 6 * 10) / 10;
    const currentWeekly = observed.sustainableWeeklyHours;
    const gapWeeklyHours = Math.round((requiredWeeklyHours - currentWeekly) * 10) / 10;
    const isFeasible = requiredDailyHours <= 8.5 && daysToTarget > 0;
    const targetAvailableBuffer = Math.ceil((targetDate.getTime() - realisticDate.getTime()) / (1000 * 60 * 60 * 24));

    let explanation = '';
    if (isFeasible && gapWeeklyHours <= 0) {
      explanation = `You are comfortably on track. Your current pace (${currentWeekly}h/week) exceeds the required ${requiredWeeklyHours}h/week.`;
    } else if (isFeasible) {
      explanation = `Mathematically feasible, but requires increasing daily productive study by +${Math.round((gapWeeklyHours / 6) * 10) / 10} hours each day.`;
    } else {
      explanation = `Target date is currently unfeasible without pruning non-critical topics. Requires ${requiredDailyHours}h daily productive focus every single day.`;
    }

    targetCalculation = {
      targetDate: targetDateStr,
      requiredWeeklyHours,
      requiredDailyHours,
      gapWeeklyHours,
      isFeasible,
      availableBufferDays: targetAvailableBuffer,
      explanation
    };
  }

  // 8. Generate Warnings
  const warnings = generateWarnings(
    observed.sustainableWeeklyHours,
    targetCalculation?.requiredWeeklyHours || observed.sustainableWeeklyHours,
    observed.recentTrend,
    observed.backlogHours,
    revisionBufferDays,
    exam.minRevisionBufferDays,
    workload.prerequisiteIssues,
    tasks
  );

  // Percentages
  const syllabusPct = workload.totalSyllabusBaseHours > 0
    ? Math.round((workload.completedBaseHours / workload.totalSyllabusBaseHours) * 100)
    : 0;

  const masteryPct = workload.totalTaskCount > 0
    ? Math.round((workload.masteredTaskCount / workload.totalTaskCount) * 100)
    : 0;

  return {
    remainingWorkloadHours: effectiveWorkload,
    totalSyllabusHours: workload.totalSyllabusBaseHours,
    completedSyllabusHours: workload.completedBaseHours,
    syllabusCompletionPercentage: syllabusPct,
    masteryCoveragePercentage: masteryPct,

    currentPaceHoursPerWeek: Math.round(effectiveDailyPace * 6 * 10) / 10,
    currentDailyProductiveAverage: effectiveDailyPace,
    observedVelocityRatio: observed.observedVelocityRatio,
    recentTrend: observed.recentTrend,

    fastDate: fastProj.completionDate,
    realisticDate: realisticProj.completionDate,
    slowDate: slowProj.completionDate,
    expectedRangeStart: rangeStart,
    expectedRangeEnd: rangeEnd,

    daysUntilExam,
    effectiveStudyDaysRemaining: realisticProj.effectiveStudyDaysNeeded,
    revisionBufferDays,
    plannedRevisionCompletionDate,
    mockTestWindowDays,

    backlogHours: observed.backlogHours,
    backlogRecoveryScenario: 'moderate',
    recoveryHoursPerWeek: 2.0,

    confidenceLevel,
    confidenceReason,
    riskLevel,
    warnings,
    targetCalculation
  };
}
