// ============================================================================
// EXAM FORECAST TRACKER: DOMAIN TYPES & INTERFACES
// ============================================================================

export type TaskDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Very Hard';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type RevisionCycle = 0 | 1 | 2 | 3; // 0 = not started, 1 = Rev 1, 2 = Rev 2, 3 = Rev 3

export type MasteryRating = 1 | 2 | 3 | 4 | 5; // 1 = Novice, 5 = Mastered

export type StudyDayType = 
  | 'NORMAL'
  | 'LIGHT'
  | 'FULL_STUDY'
  | 'PARTIAL_STUDY'
  | 'REVISION_DAY'
  | 'TEST_DAY'
  | 'TEST_ANALYSIS_DAY'
  | 'REST_DAY'
  | 'MISSED_DAY'
  | 'TRAVEL_EVENT_DAY'
  | 'COACHING_DAY';

export interface ExamDefinition {
  id: string;
  name: string;
  category: 'Engineering' | 'Medical' | 'Civil Services' | 'Government/SSC' | 'Banking' | 'Teaching' | 'State' | 'Other';
  examDate: string; // YYYY-MM-DD
  targetSyllabusCompletionDate?: string; // YYYY-MM-DD
  subjects: string[];
  defaultDailyProductiveHours: number;
  minRevisionBufferDays: number;
}

export interface TaskPrerequisite {
  taskId: string;
  prerequisiteTaskId: string;
  note?: string;
}

export interface ExamTask {
  id: string;
  examId: string;
  subject: string;
  title: string;
  categoryType: 'Chapter' | 'Topic' | 'Subtopic' | 'PracticeSet' | 'PYQSet' | 'RevisionUnit' | 'MockTest';
  estimatedHours: number;
  difficulty: TaskDifficulty;
  weightagePercentage?: number;
  prerequisites?: string[]; // IDs of tasks required before this
  orderIndex: number;
}

export interface StudentTaskProgress {
  taskId: string;
  learningStatus: TaskStatus;
  practiceStatus: TaskStatus;
  pyqPercentage: number; // 0 to 100
  revisionCycle: RevisionCycle;
  masteryLevel: MasteryRating; // 1 to 5
  studentSpecificDifficulty?: TaskDifficulty;
  plannedHours: number;
  actualHoursSpent: number;
  completedAt?: string; // ISO date
  lastRevisedAt?: string; // ISO date
  notes?: string;
}

export interface StudySessionLog {
  id: string;
  date: string; // YYYY-MM-DD
  dayType: StudyDayType;
  plannedHours: number;
  actualHours: number;
  productiveHours: number;
  topicsCovered: string[]; // task IDs
  notes?: string;
  createdAt: string;
}

export interface TestRecord {
  id: string;
  testName: string;
  testType: 'chapter' | 'subject' | 'part_syllabus' | 'full_mock';
  date: string; // YYYY-MM-DD
  testDurationHours: number;
  analysisDurationHours: number;
  score: number;
  totalMarks: number;
  accuracyPercentage: number;
  attemptedQuestions: number;
  incorrectQuestions: number;
  weakTaskIds: string[];
  notes?: string;
}

export interface CalendarAvailability {
  date: string; // YYYY-MM-DD
  status: 'full' | 'reduced' | 'unavailable';
  dayType: StudyDayType;
  effectiveCapacityHours: number;
  reason?: string;
}

export interface ForecastWarning {
  id: string;
  type: 'pace_declining' | 'backlog_high' | 'buffer_tight' | 'target_unsustainable' | 'missed_days' | 'difficult_bottleneck' | 'weak_topics_risk' | 'prerequisite_unmet';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionableTip: string;
}

export interface ForecastResult {
  // Workload summary
  remainingWorkloadHours: number;
  totalSyllabusHours: number;
  completedSyllabusHours: number;
  syllabusCompletionPercentage: number;
  masteryCoveragePercentage: number; // Percentage with mastery >= 4

  // Observed student velocity
  currentPaceHoursPerWeek: number;
  currentDailyProductiveAverage: number;
  observedVelocityRatio: number; // actual vs estimated ratio (e.g. 1.15 = takes 15% longer)
  recentTrend: 'improving' | 'stable' | 'declining';

  // Three primary scenarios
  fastDate: string; // YYYY-MM-DD
  realisticDate: string; // YYYY-MM-DD
  slowDate: string; // YYYY-MM-DD
  expectedRangeStart: string; // YYYY-MM-DD
  expectedRangeEnd: string; // YYYY-MM-DD

  // Buffers and milestones
  daysUntilExam: number;
  effectiveStudyDaysRemaining: number;
  revisionBufferDays: number;
  plannedRevisionCompletionDate: string;
  mockTestWindowDays: number;

  // Backlog
  backlogHours: number;
  backlogRecoveryScenario: 'aggressive' | 'moderate' | 'none';
  recoveryHoursPerWeek: number;

  // Reliability & warnings
  confidenceLevel: 'Low' | 'Medium' | 'High';
  confidenceReason: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  warnings: ForecastWarning[];

  // Target Date Calculator output (if requested)
  targetCalculation?: {
    targetDate: string;
    requiredWeeklyHours: number;
    requiredDailyHours: number;
    gapWeeklyHours: number;
    isFeasible: boolean;
    availableBufferDays: number;
    explanation: string;
  };
}

export interface WhatIfConfig {
  dailyHourDelta: number; // -3 to +4
  removeSundayStudy: boolean;
  weeklyTestCount: number; // 0 to 3
  extraRestDaysPerMonth: number; // 0 to 6
  missedDaysToSimulate: number; // 0 to 14
  revisionMultiplier: number; // 0.5 to 2.0 (intensity of revision passes)
}

export interface ForecastSnapshot {
  id: string;
  date: string; // When forecast was computed
  projectedRealisticDate: string;
  projectedFastDate: string;
  projectedSlowDate: string;
  weeklyPaceHours: number;
  remainingHours: number;
  explanation: string;
}
