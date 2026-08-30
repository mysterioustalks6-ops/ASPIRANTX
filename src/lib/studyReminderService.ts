import { UserProfile, TaskItem, ActiveTab } from '../types';
import { getISTDateString } from './gamification';
import { INITIAL_TASKS } from '../data/tasks';
import { EXAM_LIST } from './examList';

export interface StudyReminderSettings {
  enabled: boolean;
  reminderTime: string; // 'HH:MM' 24-hr format, e.g. '20:00' (8:00 PM)
  updateType: 'both' | 'tasks_only' | 'streak_only';
  lastNotificationSentDate?: string;
  hasUserDisabledPrompt?: boolean;
}

export interface StudyTopicItem {
  id: string;
  title: string;
  subject?: string;
  completed: boolean;
  source: 'task' | 'syllabus';
}

export interface DailyStudySummary {
  isCompletedForToday: boolean;
  pendingCount: number;
  completedCount: number;
  pendingTopics: StudyTopicItem[];
  completedTopics: StudyTopicItem[];
  streakDays: number;
  headlineCopy: string;
  streakCopy: string;
  examLabel: string;
  examId: string;
  deepLinkTab: ActiveTab;
}

const SETTINGS_KEY = (userId?: string) => `aspirantx_study_reminder_settings_v1_${userId || 'guest'}`;

export const DEFAULT_REMINDER_SETTINGS: StudyReminderSettings = {
  enabled: true,
  reminderTime: '20:00', // 8:00 PM default
  updateType: 'both',
  lastNotificationSentDate: '',
  hasUserDisabledPrompt: false,
};

/**
 * Loads user reminder settings from localStorage
 */
export function loadStudyReminderSettings(userId?: string): StudyReminderSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_REMINDER_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Error loading study reminder settings:', e);
  }
  return { ...DEFAULT_REMINDER_SETTINGS };
}

/**
 * Saves user reminder settings to localStorage
 */
export function saveStudyReminderSettings(settings: StudyReminderSettings, userId?: string): void {
  try {
    localStorage.setItem(SETTINGS_KEY(userId), JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('aspirantx_reminder_settings_updated', { detail: settings }));
  } catch (e) {
    console.error('Error saving study reminder settings:', e);
  }
}

/**
 * Retrieves today's study topics & tasks for the active exam to build the summary
 */
export function getDailyStudySummary(
  user: UserProfile,
  selectedExam?: string
): DailyStudySummary {
  const activeExamId = selectedExam || user.exam || 'UPSC_CSE';
  const examInfo = EXAM_LIST.find((e) => e.id === activeExamId);
  const examLabel = examInfo ? examInfo.label : activeExamId.replace(/_/g, ' ');
  const streakDays = Math.max(1, user.streakDays || 1);

  const taskKey = `aspirantx_kanban_tasks_v3_${user.id || 'guest'}_${activeExamId}`;
  let tasks: TaskItem[] = [];

  try {
    const rawTasks = localStorage.getItem(taskKey);
    if (rawTasks) {
      tasks = JSON.parse(rawTasks);
    } else {
      tasks = INITIAL_TASKS;
    }
  } catch {
    tasks = INITIAL_TASKS;
  }

  const allTopics: StudyTopicItem[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    subject: t.subject,
    completed: t.status === 'completed' || t.completed === true,
    source: 'task' as const,
  }));

  // Fallback: If no tasks exist, pull from personal syllabus progress
  if (allTopics.length === 0) {
    try {
      const progressKey = `aspirantx_subtopic_progress_v3_${user.id || 'guest'}`;
      const rawProgress = localStorage.getItem(progressKey);
      const completedSet = new Set<string>(rawProgress ? JSON.parse(rawProgress) : []);

      // Generic topic placeholders if syllabus is empty
      allTopics.push(
        {
          id: 'sub_1',
          title: `${examLabel} High-Yield Core Topic Revision`,
          subject: 'Core Concept',
          completed: completedSet.size > 0,
          source: 'syllabus',
        },
        {
          id: 'sub_2',
          title: 'Speed & Accuracy PYQ Practice Session',
          subject: 'Problem Solving',
          completed: completedSet.size > 2,
          source: 'syllabus',
        }
      );
    } catch {
      // safe fallback
    }
  }

  const completedTopics = allTopics.filter((t) => t.completed);
  const pendingTopics = allTopics.filter((t) => !t.completed);

  const pendingCount = pendingTopics.length;
  const completedCount = completedTopics.length;
  const isCompletedForToday = pendingCount === 0 && completedCount > 0;

  // Copy Generation strictly adhering to research guidelines:
  // - If tasks pending: "Abhi der nahi hui hai. [N] topics baaki hai aaj ke liye."
  // - If all tasks done: "Aaj ka target complete! 🎯 [N]-day streak"
  // - Never use loss-framed/urgent words like "lose your streak", "hurry", "last chance", or ALL CAPS
  let headlineCopy = '';
  let streakCopy = '';

  if (isCompletedForToday) {
    headlineCopy = `Aaj ka target complete! 🎯 ${streakDays}-day streak`;
    streakCopy = `${streakDays}-day streak maintained`;
  } else {
    headlineCopy = `Abhi der nahi hui hai. ${pendingCount} topics baaki hai aaj ke liye.`;
    streakCopy = `${streakDays}-day streak alive`;
  }

  return {
    isCompletedForToday,
    pendingCount,
    completedCount,
    pendingTopics: pendingTopics.slice(0, 2), // top 1-2 specific topic names
    completedTopics: completedTopics.slice(0, 2),
    streakDays,
    headlineCopy,
    streakCopy,
    examLabel,
    examId: activeExamId,
    deepLinkTab: 'tasks',
  };
}

/**
 * Checks and triggers local or web notification if scheduled time is reached
 * Rule: Max 1 notification per day, skip if completed before scheduled time
 */
export async function checkAndTriggerStudyReminder(
  user: UserProfile,
  selectedExam?: string
): Promise<{ triggered: boolean; reason?: string }> {
  const settings = loadStudyReminderSettings(user.id);

  if (!settings.enabled) {
    return { triggered: false, reason: 'reminders_disabled' };
  }

  const todayStr = getISTDateString(new Date());

  // Max 1 notification per day check
  if (settings.lastNotificationSentDate === todayStr) {
    return { triggered: false, reason: 'already_sent_today' };
  }

  const summary = getDailyStudySummary(user, selectedExam);

  // Skip sending notification entirely if user already completed tasks/streak requirement
  if (summary.isCompletedForToday) {
    return { triggered: false, reason: 'completed_for_today_skipped_notification' };
  }

  // Check scheduled time vs current time
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const [prefHourStr, prefMinStr] = (settings.reminderTime || '20:00').split(':');
  const prefHour = parseInt(prefHourStr || '20', 10);
  const prefMin = parseInt(prefMinStr || '0', 10);

  const currentTotalMins = currentHours * 60 + currentMinutes;
  const prefTotalMins = prefHour * 60 + prefMin;

  // Send if current time is within or past scheduled window today
  if (currentTotalMins < prefTotalMins) {
    return { triggered: false, reason: 'scheduled_time_not_reached' };
  }

  // Compose clean, positive body copy with specific topic names
  let bodyText = '';
  if (settings.updateType === 'streak_only') {
    bodyText = `${summary.streakCopy}. Take a moment to continue your journey today.`;
  } else {
    const topicList = summary.pendingTopics.map((t) => t.title).join(', ');
    if (settings.updateType === 'tasks_only') {
      bodyText = topicList ? `Pending: ${topicList}` : `${summary.pendingCount} topics left for today`;
    } else {
      // Both
      bodyText = topicList
        ? `${topicList} • ${summary.streakCopy}`
        : `${summary.pendingCount} topics left • ${summary.streakCopy}`;
    }
  }

  // Trigger Notification cross-platform
  let delivered = false;

  // 1. Check Native Capacitor LocalNotifications
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const permStatus = await LocalNotifications.checkPermissions();
    if (permStatus.display === 'granted') {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Date.now() % 100000),
            title: summary.headlineCopy,
            body: bodyText,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: undefined,
            attachments: undefined,
            extra: {
              targetTab: summary.deepLinkTab,
              examId: summary.examId,
            },
          },
        ],
      });
      delivered = true;
    }
  } catch {
    // Capacitor not available or in web browser
  }

  // 2. Web Notification API fallback
  if (!delivered && typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(summary.headlineCopy, {
          body: bodyText,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'aspirantx-daily-study-reminder',
        });
        notif.onclick = () => {
          window.focus();
          window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: summary.deepLinkTab }));
        };
        delivered = true;
      } catch (e) {
        console.warn('Web notification delivery failed:', e);
      }
    }
  }

  // Update last sent date to enforce max 1 per day only upon successful delivery
  if (delivered) {
    settings.lastNotificationSentDate = todayStr;
    saveStudyReminderSettings(settings, user.id);
  }

  return { triggered: delivered, reason: delivered ? 'delivered' : 'permission_needed' };
}

/**
 * Requests Notification permission safely without aggressive re-prompting
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // 1. Capacitor Native
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const res = await LocalNotifications.requestPermissions();
    if (res.display === 'granted') return true;
  } catch {
    // web fallback
  }

  // 2. Web Notification API
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch {
      return false;
    }
  }

  return false;
}
