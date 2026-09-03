/**
 * AspirantX Deterministic Daily Study Tracker & Streak Engine
 * 
 * Single source of truth for daily habit tracking, calendar progress,
 * and exam countdown telemetry for wallpaper and dashboard widgets.
 */

import { normalizeExamId, getExamConfig } from './examRegistry';
import { getLocalDeviceStore, markDailyBoxCompleted } from './packetSyncService';
import { loadStudySessions, getISTDateString } from './gamification';
import { getLocalCompletedSubtopicIds } from './syllabusStorage';

export interface DailyDateBox {
  dateKey: string;      // 'YYYY-MM-DD'
  dayNumber: string;    // '01', '02', '03'
  shortMonth: string;   // 'Sep'
  status: 'completed' | 'missed' | 'today' | 'future';
  isCompleted: boolean;
  isToday: boolean;
  isMissed: boolean;
  activityLabel: string;
}

export interface ExamScheduleInfo {
  hasDate: boolean;
  dateStr: string;
  formattedDate: string;
  daysRemaining: number | null;
  statusText: string;
}

export interface WallpaperTelemetry {
  examId: string;
  examName: string;
  category: string;
  schedule: ExamScheduleInfo;
  syllabusPercentage: number;
  completedSubtopicsCount: number;
  totalSubtopicsCount: number;
  currentStreak: number;
  totalCompletedDays: number;
  dateBoxes: DailyDateBox[];
}

export function getKnownExamDateString(examId: string): string | undefined {
  const currentYear = new Date().getFullYear();
  const KNOWN_DATES: Record<string, string> = {
    NEET_UG: `${currentYear + 1}-05-03`,
    UPSC_CSE: `${currentYear + 1}-05-24`,
    JEE_MAIN: `${currentYear + 1}-04-06`,
    JEE_ADVANCED: `${currentYear + 1}-05-24`,
    SSC_CGL: `${currentYear + 1}-09-15`,
    NDA_NA: `${currentYear + 1}-04-19`,
    GATE_CS: `${currentYear + 1}-02-08`,
    CAT: `${currentYear}-11-29`,
    CDS: `${currentYear + 1}-04-19`,
  };
  return KNOWN_DATES[normalizeExamId(examId)];
}

/**
 * Standard exam target date resolver.
 * Shows explicit 'Date To Be Announced' for unannounced exams rather than inventing fake dates.
 */
export function getExamScheduleInfo(examId: string, customDate?: string): ExamScheduleInfo {
  const normId = normalizeExamId(examId);
  const now = new Date();

  // 1. If user has customized an explicit exam target date in the future
  if (customDate) {
    const customTime = new Date(customDate).getTime();
    if (!isNaN(customTime) && customTime > now.getTime()) {
      const days = Math.ceil((customTime - now.getTime()) / (1000 * 60 * 60 * 24));
      const dObj = new Date(customDate);
      return {
        hasDate: true,
        dateStr: customDate,
        formattedDate: dObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        daysRemaining: days,
        statusText: `${days} DAYS LEFT`
      };
    }
  }

  // 2. Authoritative academic exam schedule table
  const targetStr = getKnownExamDateString(normId);
  if (targetStr) {
    const targetDate = new Date(targetStr);
    const diffMs = targetDate.getTime() - now.getTime();
    if (diffMs > 0) {
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return {
        hasDate: true,
        dateStr: targetStr,
        formattedDate: targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        daysRemaining: days,
        statusText: `${days} DAYS LEFT`
      };
    }
  }

  // 3. Exam date not officially announced yet
  return {
    hasDate: false,
    dateStr: '',
    formattedDate: 'Date To Be Announced',
    daysRemaining: null,
    statusText: 'SCHEDULE PENDING'
  };
}

/**
 * Deterministically computes calendar study dates and verified streaks.
 * Scoped strictly to userId + examId.
 */
export function getDeterministicDailyProgress(
  userId: string = 'guest',
  examId: string = 'NEET_UG',
  daysWindow: number = 28
): { dateBoxes: DailyDateBox[]; currentStreak: number; totalCompletedDays: number } {
  const normExam = normalizeExamId(examId);
  const store = getLocalDeviceStore(userId, normExam);
  const completedKeysSet = new Set(store.completedBoxKeys || []);

  // Also read study session logs for this user
  let sessionsByDate: Record<string, number> = {};
  try {
    const rawSessions = localStorage.getItem(`aspirantx_study_sessions_v3_${userId}`);
    if (rawSessions) {
      const parsed = JSON.parse(rawSessions);
      if (Array.isArray(parsed)) {
        parsed.forEach((s: any) => {
          if (s.createdAt) {
            const dateStr = s.createdAt.split('T')[0];
            sessionsByDate[dateStr] = (sessionsByDate[dateStr] || 0) + (s.durationSeconds || 0);
          }
        });
      }
    }
  } catch (e) {}

  // Also read CBT test results submitted for this user & exam
  let cbtByDate: Record<string, boolean> = {};
  try {
    const rawCbt = localStorage.getItem(`aspirantx_cbt_results_cache_${userId}_${normExam}`);
    if (rawCbt) {
      const parsedCbt = JSON.parse(rawCbt);
      if (Array.isArray(parsedCbt)) {
        parsedCbt.forEach((c: any) => {
          if (c.submittedAt) {
            const dateStr = c.submittedAt.split('T')[0];
            cbtByDate[dateStr] = true;
          }
        });
      }
    }
  } catch (e) {}

  const todayStr = getISTDateString(new Date());
  const dateBoxes: DailyDateBox[] = [];

  // Generate calendar grid: e.g. 28 days (starting from (daysWindow - 7) days ago up to future days)
  // Let's create a 4-week (28-day) rolling view centered on current week
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (daysWindow - 7));

  for (let i = 0; i < daysWindow; i++) {
    const cur = new Date(startDate);
    cur.setDate(startDate.getDate() + i);
    const dateKey = getISTDateString(cur);
    const dayNum = String(cur.getDate()).padStart(2, '0');
    const monthShort = cur.toLocaleDateString('en-US', { month: 'short' });

    const isToday = dateKey === todayStr;
    const isPast = dateKey < todayStr;
    const isFuture = dateKey > todayStr;

    // Deterministic study completion check:
    // User completed study requirement if:
    // 1. Manually marked or packet-synced in store.completedBoxKeys, OR
    // 2. Has >= 600 seconds (10 mins) of focus study session on this date, OR
    // 3. Submitted a CBT test on this date
    const hasStudyMinutes = (sessionsByDate[dateKey] || 0) >= 600;
    const hasCbtTest = Boolean(cbtByDate[dateKey]);
    const hasManualCheck = completedKeysSet.has(dateKey);

    const hasRealActivity = hasManualCheck || hasStudyMinutes || hasCbtTest;

    let status: DailyDateBox['status'] = 'future';
    let isCompleted = false;
    let isMissed = false;
    let activityLabel = 'Upcoming';

    if (isCompleted || hasRealActivity) {
      status = 'completed';
      isCompleted = true;
      activityLabel = hasCbtTest ? 'CBT Mock Complete' : hasStudyMinutes ? 'Study Goal Complete' : 'Habit Complete';
    } else if (isToday) {
      status = 'today';
      activityLabel = 'Today — Goal Pending';
    } else if (isPast) {
      status = 'missed';
      isMissed = true;
      activityLabel = 'No Study Recorded';
    } else {
      status = 'future';
      activityLabel = 'Scheduled';
    }

    dateBoxes.push({
      dateKey,
      dayNumber: dayNum,
      shortMonth: monthShort,
      status,
      isCompleted,
      isToday,
      isMissed,
      activityLabel
    });
  }

  // Calculate deterministic real streak:
  // Count consecutive completed days backwards starting from today (if completed) or yesterday
  let streak = 0;
  const todayBox = dateBoxes.find(b => b.isToday);
  let checkIndex = dateBoxes.findIndex(b => b.isToday);

  // If today is completed, count today and go backwards
  if (todayBox && todayBox.isCompleted) {
    for (let j = checkIndex; j >= 0; j--) {
      if (dateBoxes[j].isCompleted) {
        streak++;
      } else {
        break;
      }
    }
  } else if (checkIndex > 0) {
    // If today is not yet completed, evaluate streak from yesterday
    for (let j = checkIndex - 1; j >= 0; j--) {
      if (dateBoxes[j].isCompleted) {
        streak++;
      } else {
        break;
      }
    }
  }

  const totalCompletedDays = dateBoxes.filter(b => b.isCompleted).length;

  return {
    dateBoxes,
    currentStreak: streak,
    totalCompletedDays
  };
}

/**
 * Gathers complete authoritative telemetry for the active exam.
 */
export function getAuthoritativeWallpaperTelemetry(
  userId: string = 'guest',
  examId: string = 'NEET_UG',
  customExamDate?: string
): WallpaperTelemetry {
  const normExam = normalizeExamId(examId);
  const examConfig = getExamConfig(normExam);
  const schedule = getExamScheduleInfo(normExam, customExamDate);

  // Calculate real syllabus %
  const completedSubtopics = getLocalCompletedSubtopicIds(userId, normExam);
  const completedCount = completedSubtopics.size;
  let totalSubtopics = 0;

  if (examConfig && examConfig.syllabusTree) {
    Object.values(examConfig.syllabusTree).forEach((node: any) => {
      if (Array.isArray(node.topics)) {
        totalSubtopics += node.topics.length;
      }
    });
  }
  if (totalSubtopics === 0) totalSubtopics = 50;

  const syllabusPercentage = Math.min(100, Math.round((completedCount / totalSubtopics) * 100));

  // Calculate deterministic daily progress & streak
  const { dateBoxes, currentStreak, totalCompletedDays } = getDeterministicDailyProgress(userId, normExam, 28);

  return {
    examId: normExam,
    examName: examConfig.displayName || normExam.replace(/_/g, ' '),
    category: examConfig.category || 'ACADEMIC',
    schedule,
    syllabusPercentage,
    completedSubtopicsCount: completedSubtopics.size,
    totalSubtopicsCount: totalSubtopics,
    currentStreak,
    totalCompletedDays,
    dateBoxes
  };
}
