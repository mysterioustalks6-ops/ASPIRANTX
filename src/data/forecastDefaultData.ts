// ============================================================================
// EXAM FORECAST TRACKER: DEFAULT DEMO DATA
// Pre-populated for a fictional JEE Main fresher (Arjun Sharma)
// ============================================================================

import {
  ExamDefinition,
  ExamTask,
  StudentTaskProgress,
  StudySessionLog,
  TestRecord,
  ForecastSnapshot,
  CalendarAvailability
} from '../lib/forecast/types';

// Anchor date: Current context time
const now = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];

const addDays = (d: Date, days: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + days);
  return formatDate(c);
};

const subDays = (d: Date, days: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() - days);
  return formatDate(c);
};

export const DEFAULT_JEE_EXAM: ExamDefinition = {
  id: 'JEE_MAIN',
  name: 'JEE Main (Engineering)',
  category: 'Engineering',
  examDate: addDays(now, 115), // ~115 days away
  targetSyllabusCompletionDate: addDays(now, 55), // Target finish in ~55 days
  subjects: ['Physics', 'Chemistry', 'Mathematics'],
  defaultDailyProductiveHours: 5.0,
  minRevisionBufferDays: 25
};

export const DEFAULT_JEE_TASKS: ExamTask[] = [
  // ── PHYSICS ───────────────────────────────────────────────────────────────
  {
    id: 'phy_01',
    examId: 'JEE_MAIN',
    subject: 'Physics',
    title: 'Units, Dimensions & Errors',
    categoryType: 'Chapter',
    estimatedHours: 8,
    difficulty: 'Easy',
    weightagePercentage: 4,
    orderIndex: 1
  },
  {
    id: 'phy_02',
    examId: 'JEE_MAIN',
    subject: 'Physics',
    title: 'Kinematics (1D & 2D)',
    categoryType: 'Chapter',
    estimatedHours: 14,
    difficulty: 'Medium',
    weightagePercentage: 6,
    prerequisites: ['phy_01'],
    orderIndex: 2
  },
  {
    id: 'phy_03',
    examId: 'JEE_MAIN',
    subject: 'Physics',
    title: 'Newton\'s Laws of Motion & Friction',
    categoryType: 'Chapter',
    estimatedHours: 16,
    difficulty: 'Hard',
    weightagePercentage: 7,
    prerequisites: ['phy_02'],
    orderIndex: 3
  },
  {
    id: 'phy_04',
    examId: 'JEE_MAIN',
    subject: 'Physics',
    title: 'Work, Energy & Power',
    categoryType: 'Chapter',
    estimatedHours: 14,
    difficulty: 'Medium',
    weightagePercentage: 6,
    prerequisites: ['phy_03'],
    orderIndex: 4
  },
  {
    id: 'phy_05',
    examId: 'JEE_MAIN',
    subject: 'Physics',
    title: 'Center of Mass & Collisions',
    categoryType: 'Chapter',
    estimatedHours: 15,
    difficulty: 'Hard',
    weightagePercentage: 6,
    prerequisites: ['phy_04'],
    orderIndex: 5
  },
  {
    id: 'phy_06',
    examId: 'JEE_MAIN',
    subject: 'Physics',
    title: 'Rotational Motion & Inertia',
    categoryType: 'Chapter',
    estimatedHours: 24,
    difficulty: 'Very Hard',
    weightagePercentage: 8,
    prerequisites: ['phy_04', 'phy_05'],
    orderIndex: 6
  },
  {
    id: 'phy_07',
    examId: 'JEE_MAIN',
    subject: 'Physics',
    title: 'Gravitation',
    categoryType: 'Chapter',
    estimatedHours: 10,
    difficulty: 'Easy',
    weightagePercentage: 5,
    prerequisites: ['phy_03'],
    orderIndex: 7
  },
  {
    id: 'phy_08',
    examId: 'JEE_MAIN',
    subject: 'Physics',
    title: 'Thermodynamics & Kinetic Theory',
    categoryType: 'Chapter',
    estimatedHours: 18,
    difficulty: 'Medium',
    weightagePercentage: 7,
    orderIndex: 8
  },
  {
    id: 'phy_09',
    examId: 'JEE_MAIN',
    subject: 'Physics',
    title: 'Electrostatics & Gauss\'s Law',
    categoryType: 'Chapter',
    estimatedHours: 22,
    difficulty: 'Hard',
    weightagePercentage: 8,
    orderIndex: 9
  },
  {
    id: 'phy_10',
    examId: 'JEE_MAIN',
    subject: 'Physics',
    title: 'Current Electricity & Circuit Laws',
    categoryType: 'Chapter',
    estimatedHours: 16,
    difficulty: 'Medium',
    weightagePercentage: 8,
    prerequisites: ['phy_09'],
    orderIndex: 10
  },
  {
    id: 'phy_11',
    examId: 'JEE_MAIN',
    subject: 'Physics',
    title: 'Ray Optics & Optical Instruments',
    categoryType: 'Chapter',
    estimatedHours: 18,
    difficulty: 'Medium',
    weightagePercentage: 7,
    orderIndex: 11
  },
  {
    id: 'phy_12',
    examId: 'JEE_MAIN',
    subject: 'Physics',
    title: 'Modern Physics & Semiconductors',
    categoryType: 'Chapter',
    estimatedHours: 20,
    difficulty: 'Easy',
    weightagePercentage: 10,
    orderIndex: 12
  },

  // ── CHEMISTRY ─────────────────────────────────────────────────────────────
  {
    id: 'chem_01',
    examId: 'JEE_MAIN',
    subject: 'Chemistry',
    title: 'Mole Concept & Stoichiometry',
    categoryType: 'Chapter',
    estimatedHours: 10,
    difficulty: 'Medium',
    weightagePercentage: 5,
    orderIndex: 13
  },
  {
    id: 'chem_02',
    examId: 'JEE_MAIN',
    subject: 'Chemistry',
    title: 'Atomic Structure & Quantum Numbers',
    categoryType: 'Chapter',
    estimatedHours: 12,
    difficulty: 'Medium',
    weightagePercentage: 5,
    orderIndex: 14
  },
  {
    id: 'chem_03',
    examId: 'JEE_MAIN',
    subject: 'Chemistry',
    title: 'Chemical Bonding & Molecular Geometry',
    categoryType: 'Chapter',
    estimatedHours: 18,
    difficulty: 'Hard',
    weightagePercentage: 9,
    prerequisites: ['chem_02'],
    orderIndex: 15
  },
  {
    id: 'chem_04',
    examId: 'JEE_MAIN',
    subject: 'Chemistry',
    title: 'Chemical & Ionic Equilibrium',
    categoryType: 'Chapter',
    estimatedHours: 20,
    difficulty: 'Very Hard',
    weightagePercentage: 8,
    prerequisites: ['chem_01'],
    orderIndex: 16
  },
  {
    id: 'chem_05',
    examId: 'JEE_MAIN',
    subject: 'Chemistry',
    title: 'Thermodynamics & Thermochemistry',
    categoryType: 'Chapter',
    estimatedHours: 16,
    difficulty: 'Hard',
    weightagePercentage: 7,
    orderIndex: 17
  },
  {
    id: 'chem_06',
    examId: 'JEE_MAIN',
    subject: 'Chemistry',
    title: 'Coordination Compounds',
    categoryType: 'Chapter',
    estimatedHours: 14,
    difficulty: 'Medium',
    weightagePercentage: 8,
    prerequisites: ['chem_03'],
    orderIndex: 18
  },
  {
    id: 'chem_07',
    examId: 'JEE_MAIN',
    subject: 'Chemistry',
    title: 'General Organic Chemistry (GOC)',
    categoryType: 'Chapter',
    estimatedHours: 22,
    difficulty: 'Hard',
    weightagePercentage: 10,
    prerequisites: ['chem_03'],
    orderIndex: 19
  },
  {
    id: 'chem_08',
    examId: 'JEE_MAIN',
    subject: 'Chemistry',
    title: 'Hydrocarbons',
    categoryType: 'Chapter',
    estimatedHours: 15,
    difficulty: 'Medium',
    weightagePercentage: 7,
    prerequisites: ['chem_07'],
    orderIndex: 20
  },
  {
    id: 'chem_09',
    examId: 'JEE_MAIN',
    subject: 'Chemistry',
    title: 'Aldehydes, Ketones & Carboxylic Acids',
    categoryType: 'Chapter',
    estimatedHours: 18,
    difficulty: 'Hard',
    weightagePercentage: 8,
    prerequisites: ['chem_07'],
    orderIndex: 21
  },

  // ── MATHEMATICS ───────────────────────────────────────────────────────────
  {
    id: 'math_01',
    examId: 'JEE_MAIN',
    subject: 'Mathematics',
    title: 'Sets, Relations & Functions',
    categoryType: 'Chapter',
    estimatedHours: 12,
    difficulty: 'Medium',
    weightagePercentage: 6,
    orderIndex: 22
  },
  {
    id: 'math_02',
    examId: 'JEE_MAIN',
    subject: 'Mathematics',
    title: 'Quadratic Equations & Complex Numbers',
    categoryType: 'Chapter',
    estimatedHours: 16,
    difficulty: 'Medium',
    weightagePercentage: 7,
    orderIndex: 23
  },
  {
    id: 'math_03',
    examId: 'JEE_MAIN',
    subject: 'Mathematics',
    title: 'Sequences & Series',
    categoryType: 'Chapter',
    estimatedHours: 12,
    difficulty: 'Easy',
    weightagePercentage: 6,
    orderIndex: 24
  },
  {
    id: 'math_04',
    examId: 'JEE_MAIN',
    subject: 'Mathematics',
    title: 'Permutations & Combinations',
    categoryType: 'Chapter',
    estimatedHours: 18,
    difficulty: 'Hard',
    weightagePercentage: 6,
    orderIndex: 25
  },
  {
    id: 'math_05',
    examId: 'JEE_MAIN',
    subject: 'Mathematics',
    title: 'Binomial Theorem',
    categoryType: 'Chapter',
    estimatedHours: 10,
    difficulty: 'Easy',
    weightagePercentage: 5,
    orderIndex: 26
  },
  {
    id: 'math_06',
    examId: 'JEE_MAIN',
    subject: 'Mathematics',
    title: 'Limits, Continuity & Differentiability',
    categoryType: 'Chapter',
    estimatedHours: 18,
    difficulty: 'Medium',
    weightagePercentage: 8,
    prerequisites: ['math_01'],
    orderIndex: 27
  },
  {
    id: 'math_07',
    examId: 'JEE_MAIN',
    subject: 'Mathematics',
    title: 'Application of Derivatives (AOD)',
    categoryType: 'Chapter',
    estimatedHours: 20,
    difficulty: 'Hard',
    weightagePercentage: 8,
    prerequisites: ['math_06'],
    orderIndex: 28
  },
  {
    id: 'math_08',
    examId: 'JEE_MAIN',
    subject: 'Mathematics',
    title: 'Definite Integration & Area Under Curve',
    categoryType: 'Chapter',
    estimatedHours: 24,
    difficulty: 'Very Hard',
    weightagePercentage: 9,
    prerequisites: ['math_06'],
    orderIndex: 29
  },
  {
    id: 'math_09',
    examId: 'JEE_MAIN',
    subject: 'Mathematics',
    title: 'Coordinate Geometry (Straight Lines & Circles)',
    categoryType: 'Chapter',
    estimatedHours: 22,
    difficulty: 'Hard',
    weightagePercentage: 9,
    orderIndex: 30
  },
  {
    id: 'math_10',
    examId: 'JEE_MAIN',
    subject: 'Mathematics',
    title: 'Vectors & 3D Geometry',
    categoryType: 'Chapter',
    estimatedHours: 18,
    difficulty: 'Medium',
    weightagePercentage: 9,
    orderIndex: 31
  }
];

// Pre-populated realistic student progress
export const DEFAULT_STUDENT_PROGRESS: Record<string, StudentTaskProgress> = {
  // Fully completed & mastered topics
  phy_01: {
    taskId: 'phy_01',
    learningStatus: 'completed',
    practiceStatus: 'completed',
    pyqPercentage: 95,
    revisionCycle: 2,
    masteryLevel: 5,
    plannedHours: 8,
    actualHoursSpent: 8.5,
    completedAt: subDays(now, 28)
  },
  phy_02: {
    taskId: 'phy_02',
    learningStatus: 'completed',
    practiceStatus: 'completed',
    pyqPercentage: 85,
    revisionCycle: 2,
    masteryLevel: 4,
    plannedHours: 14,
    actualHoursSpent: 16.0,
    completedAt: subDays(now, 20)
  },
  chem_01: {
    taskId: 'chem_01',
    learningStatus: 'completed',
    practiceStatus: 'completed',
    pyqPercentage: 90,
    revisionCycle: 2,
    masteryLevel: 5,
    plannedHours: 10,
    actualHoursSpent: 9.5,
    completedAt: subDays(now, 25)
  },
  chem_02: {
    taskId: 'chem_02',
    learningStatus: 'completed',
    practiceStatus: 'completed',
    pyqPercentage: 80,
    revisionCycle: 1,
    masteryLevel: 4,
    plannedHours: 12,
    actualHoursSpent: 13.0,
    completedAt: subDays(now, 18)
  },
  math_01: {
    taskId: 'math_01',
    learningStatus: 'completed',
    practiceStatus: 'completed',
    pyqPercentage: 85,
    revisionCycle: 2,
    masteryLevel: 4,
    plannedHours: 12,
    actualHoursSpent: 11.0,
    completedAt: subDays(now, 26)
  },
  math_02: {
    taskId: 'math_02',
    learningStatus: 'completed',
    practiceStatus: 'completed',
    pyqPercentage: 75,
    revisionCycle: 1,
    masteryLevel: 4,
    plannedHours: 16,
    actualHoursSpent: 17.5,
    completedAt: subDays(now, 19)
  },
  math_03: {
    taskId: 'math_03',
    learningStatus: 'completed',
    practiceStatus: 'completed',
    pyqPercentage: 90,
    revisionCycle: 2,
    masteryLevel: 5,
    plannedHours: 12,
    actualHoursSpent: 11.5,
    completedAt: subDays(now, 15)
  },

  // Completed theory, but lower mastery / pending revision (The "Completed != Mastered" case)
  phy_03: {
    taskId: 'phy_03',
    learningStatus: 'completed',
    practiceStatus: 'in_progress',
    pyqPercentage: 55,
    revisionCycle: 0,
    masteryLevel: 3,
    plannedHours: 16,
    actualHoursSpent: 19.0,
    completedAt: subDays(now, 10),
    notes: 'Struggling with multi-block friction and pseudo force problems.'
  },
  chem_03: {
    taskId: 'chem_03',
    learningStatus: 'completed',
    practiceStatus: 'completed',
    pyqPercentage: 70,
    revisionCycle: 1,
    masteryLevel: 3,
    plannedHours: 18,
    actualHoursSpent: 21.0,
    completedAt: subDays(now, 12),
    notes: 'Molecular orbital theory magnetic properties need extra practice.'
  },

  // In-progress topics
  phy_04: {
    taskId: 'phy_04',
    learningStatus: 'in_progress',
    practiceStatus: 'in_progress',
    pyqPercentage: 30,
    revisionCycle: 0,
    masteryLevel: 2,
    plannedHours: 14,
    actualHoursSpent: 8.0
  },
  chem_07: {
    taskId: 'chem_07',
    learningStatus: 'in_progress',
    practiceStatus: 'pending',
    pyqPercentage: 20,
    revisionCycle: 0,
    masteryLevel: 2,
    plannedHours: 22,
    actualHoursSpent: 10.0
  },
  math_04: {
    taskId: 'math_04',
    learningStatus: 'in_progress',
    practiceStatus: 'in_progress',
    pyqPercentage: 40,
    revisionCycle: 0,
    masteryLevel: 3,
    plannedHours: 18,
    actualHoursSpent: 9.0
  }
};

// Past 21 days of realistic study sessions (Arjun Sharma)
export const DEFAULT_STUDY_LOGS: StudySessionLog[] = [
  { id: 'log_01', date: subDays(now, 20), dayType: 'NORMAL', plannedHours: 6.0, actualHours: 5.5, productiveHours: 4.8, topicsCovered: ['phy_02', 'chem_02'], createdAt: subDays(now, 20) },
  { id: 'log_02', date: subDays(now, 19), dayType: 'FULL_STUDY', plannedHours: 7.0, actualHours: 6.5, productiveHours: 5.8, topicsCovered: ['math_02', 'phy_02'], createdAt: subDays(now, 19) },
  { id: 'log_03', date: subDays(now, 18), dayType: 'COACHING_DAY', plannedHours: 5.0, actualHours: 4.5, productiveHours: 3.8, topicsCovered: ['chem_02'], createdAt: subDays(now, 18) },
  { id: 'log_04', date: subDays(now, 17), dayType: 'NORMAL', plannedHours: 6.0, actualHours: 5.0, productiveHours: 4.4, topicsCovered: ['math_03', 'phy_03'], createdAt: subDays(now, 17) },
  { id: 'log_05', date: subDays(now, 16), dayType: 'REST_DAY', plannedHours: 0.0, actualHours: 0.0, productiveHours: 0.0, topicsCovered: [], notes: 'Weekly recovery rest day', createdAt: subDays(now, 16) },
  { id: 'log_06', date: subDays(now, 15), dayType: 'NORMAL', plannedHours: 6.0, actualHours: 5.5, productiveHours: 4.7, topicsCovered: ['math_03', 'chem_03'], createdAt: subDays(now, 15) },
  { id: 'log_07', date: subDays(now, 14), dayType: 'TEST_DAY', plannedHours: 5.0, actualHours: 5.0, productiveHours: 4.2, topicsCovered: ['phy_02', 'chem_01'], notes: 'Part-syllabus Mock 1 (Score: 168/300)', createdAt: subDays(now, 14) },
  { id: 'log_08', date: subDays(now, 13), dayType: 'TEST_ANALYSIS_DAY', plannedHours: 5.5, actualHours: 5.0, productiveHours: 4.0, topicsCovered: ['phy_03', 'chem_03'], notes: 'Detailed error notebook update', createdAt: subDays(now, 13) },
  { id: 'log_09', date: subDays(now, 12), dayType: 'NORMAL', plannedHours: 6.0, actualHours: 5.0, productiveHours: 4.2, topicsCovered: ['chem_03'], createdAt: subDays(now, 12) },
  { id: 'log_10', date: subDays(now, 11), dayType: 'NORMAL', plannedHours: 6.0, actualHours: 5.2, productiveHours: 4.5, topicsCovered: ['phy_03', 'math_04'], createdAt: subDays(now, 11) },
  { id: 'log_11', date: subDays(now, 10), dayType: 'COACHING_DAY', plannedHours: 5.0, actualHours: 4.0, productiveHours: 3.2, topicsCovered: ['phy_03'], createdAt: subDays(now, 10) },
  { id: 'log_12', date: subDays(now, 9), dayType: 'REST_DAY', plannedHours: 0.0, actualHours: 0.0, productiveHours: 0.0, topicsCovered: [], notes: 'Family outing & rest', createdAt: subDays(now, 9) },
  { id: 'log_13', date: subDays(now, 8), dayType: 'NORMAL', plannedHours: 6.0, actualHours: 5.8, productiveHours: 5.0, topicsCovered: ['chem_07'], createdAt: subDays(now, 8) },
  { id: 'log_14', date: subDays(now, 7), dayType: 'FULL_STUDY', plannedHours: 7.0, actualHours: 6.2, productiveHours: 5.4, topicsCovered: ['chem_07', 'math_04'], createdAt: subDays(now, 7) },
  { id: 'log_15', date: subDays(now, 6), dayType: 'MISSED_DAY', plannedHours: 6.0, actualHours: 0.0, productiveHours: 0.0, topicsCovered: [], notes: 'Unwell - fever, full day off', createdAt: subDays(now, 6) },
  { id: 'log_16', date: subDays(now, 5), dayType: 'LIGHT', plannedHours: 4.0, actualHours: 3.0, productiveHours: 2.5, topicsCovered: ['chem_07'], notes: 'Post-fever recovery day', createdAt: subDays(now, 5) },
  { id: 'log_17', date: subDays(now, 4), dayType: 'NORMAL', plannedHours: 6.0, actualHours: 5.0, productiveHours: 4.3, topicsCovered: ['phy_04'], createdAt: subDays(now, 4) },
  { id: 'log_18', date: subDays(now, 3), dayType: 'NORMAL', plannedHours: 6.0, actualHours: 5.2, productiveHours: 4.6, topicsCovered: ['phy_04', 'math_04'], createdAt: subDays(now, 3) },
  { id: 'log_19', date: subDays(now, 2), dayType: 'COACHING_DAY', plannedHours: 5.0, actualHours: 4.5, productiveHours: 3.9, topicsCovered: ['chem_07'], createdAt: subDays(now, 2) },
  { id: 'log_20', date: subDays(now, 1), dayType: 'NORMAL', plannedHours: 6.0, actualHours: 5.5, productiveHours: 4.8, topicsCovered: ['phy_04', 'chem_07'], createdAt: subDays(now, 1) },
  { id: 'log_21', date: formatDate(now), dayType: 'NORMAL', plannedHours: 6.0, actualHours: 5.0, productiveHours: 4.5, topicsCovered: ['phy_04'], createdAt: formatDate(now) }
];

export const DEFAULT_TEST_RECORDS: TestRecord[] = [
  {
    id: 'test_01',
    testName: 'Kinematics & Mole Concept Sectional',
    testType: 'chapter',
    date: subDays(now, 22),
    testDurationHours: 1.5,
    analysisDurationHours: 1.0,
    score: 72,
    totalMarks: 100,
    accuracyPercentage: 82,
    attemptedQuestions: 25,
    incorrectQuestions: 4,
    weakTaskIds: ['phy_02']
  },
  {
    id: 'test_02',
    testName: 'Part-Syllabus Mock 1 (Physics & Chem Foundations)',
    testType: 'part_syllabus',
    date: subDays(now, 14),
    testDurationHours: 3.0,
    analysisDurationHours: 2.0,
    score: 168,
    totalMarks: 300,
    accuracyPercentage: 74,
    attemptedQuestions: 62,
    incorrectQuestions: 14,
    weakTaskIds: ['phy_03', 'chem_03']
  }
];

export const DEFAULT_CALENDAR_AVAILABILITY: CalendarAvailability[] = [
  { date: addDays(now, 3), status: 'reduced', dayType: 'LIGHT', effectiveCapacityHours: 3.0, reason: 'College midterm practical exam' },
  { date: addDays(now, 7), status: 'unavailable', dayType: 'REST_DAY', effectiveCapacityHours: 0.0, reason: 'Planned Sunday rest' },
  { date: addDays(now, 14), status: 'reduced', dayType: 'TEST_DAY', effectiveCapacityHours: 2.5, reason: 'Full Mock Test 2 Scheduled' },
  { date: addDays(now, 21), status: 'unavailable', dayType: 'REST_DAY', effectiveCapacityHours: 0.0, reason: 'Planned Sunday rest' }
];

export const DEFAULT_FORECAST_SNAPSHOTS: ForecastSnapshot[] = [
  {
    id: 'snap_01',
    date: subDays(now, 21),
    projectedRealisticDate: addDays(now, 48),
    projectedFastDate: addDays(now, 38),
    projectedSlowDate: addDays(now, 62),
    weeklyPaceHours: 32.5,
    remainingHours: 420,
    explanation: 'Initial baseline projection based on 5.0h/day study commitment.'
  },
  {
    id: 'snap_02',
    date: subDays(now, 14),
    projectedRealisticDate: addDays(now, 46),
    projectedFastDate: addDays(now, 37),
    projectedSlowDate: addDays(now, 59),
    weeklyPaceHours: 31.0,
    remainingHours: 375,
    explanation: 'Slightly faster completion of Mathematics Foundations pulled date closer.'
  },
  {
    id: 'snap_03',
    date: subDays(now, 7),
    projectedRealisticDate: addDays(now, 53),
    projectedFastDate: addDays(now, 42),
    projectedSlowDate: addDays(now, 68),
    weeklyPaceHours: 27.5,
    remainingHours: 345,
    explanation: 'Completion moved back 5 days due to 1 missed day (fever) and lighter recovery hours.'
  },
  {
    id: 'snap_04',
    date: formatDate(now),
    projectedRealisticDate: addDays(now, 51),
    projectedFastDate: addDays(now, 40),
    projectedSlowDate: addDays(now, 66),
    weeklyPaceHours: 28.5,
    remainingHours: 325,
    explanation: 'Pace recovered to 4.7h/day over the last 3 days, stabilizing projected finish.'
  }
];
