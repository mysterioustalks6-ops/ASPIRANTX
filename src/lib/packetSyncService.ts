/**
 * Aspirantx Packet-Based Local-First Sync Service
 * 
 * Guarantees zero server overload by caching telemetry locally (LocalStorage/IndexedDB)
 * and batch-syncing lightweight JSON packets to the backend.
 */

import { syncWorker } from './syncWorker';

export interface StudyTelemetryPacket {
  id: string;
  userId: string;
  examId: string;
  date: string;
  studyMinutesIncrement: number;
  boxCompleted: boolean;
  boxDateKey: string;
  completedTasksCount: number;
  accuracyScore?: number;
  timestamp: number;
}

export interface LocalDeviceStudyStore {
  userId: string;
  activeExam: string;
  examDate: string;
  completedBoxKeys: string[]; // List of 'YYYY-MM-DD' dates completed
  todayStudyMinutes: number;
  streakDays: number;
  lastActiveDate: string;
  pendingSyncPackets: StudyTelemetryPacket[];
  lastSyncedAt: number;
}

const STORAGE_KEY_PREFIX = 'aspirantx_local_store_v1_';

/**
 * Get device-oriented study state for current user
 */
export function getLocalDeviceStore(userId: string = 'guest', examId: string = 'NEET_UG'): LocalDeviceStudyStore {
  const key = `${STORAGE_KEY_PREFIX}${userId}_${examId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        userId,
        activeExam: examId,
        examDate: parsed.examDate || getDefaultExamDate(examId),
        completedBoxKeys: Array.isArray(parsed.completedBoxKeys) ? parsed.completedBoxKeys : [],
        todayStudyMinutes: parsed.todayStudyMinutes || 0,
        streakDays: parsed.streakDays || 1,
        lastActiveDate: parsed.lastActiveDate || new Date().toISOString().split('T')[0],
        pendingSyncPackets: Array.isArray(parsed.pendingSyncPackets) ? parsed.pendingSyncPackets : [],
        lastSyncedAt: parsed.lastSyncedAt || Date.now(),
      };
    }
  } catch (err) {
    console.warn('Failed to parse local device study store:', err);
  }

  // Default initial store with zero unearned progress
  const todayKey = new Date().toISOString().split('T')[0];
  const initialStore: LocalDeviceStudyStore = {
    userId,
    activeExam: examId,
    examDate: getDefaultExamDate(examId),
    completedBoxKeys: [],
    todayStudyMinutes: 0,
    streakDays: 0,
    lastActiveDate: '',
    pendingSyncPackets: [],
    lastSyncedAt: Date.now(),
  };

  saveLocalDeviceStore(initialStore);
  return initialStore;
}

/**
 * Persist store directly on user's device (phone/laptop)
 */
export function saveLocalDeviceStore(store: LocalDeviceStudyStore): void {
  const key = `${STORAGE_KEY_PREFIX}${store.userId}_${store.activeExam}`;
  try {
    localStorage.setItem(key, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent('aspirantx_local_store_updated', { detail: store }));
  } catch (err) {
    console.warn('Failed to write local study store to device storage:', err);
  }
}

/**
 * Toggle or complete a daily progress box for a specific date
 */
export function markDailyBoxCompleted(
  userId: string, 
  examId: string, 
  dateKey: string = new Date().toISOString().split('T')[0]
): { completed: boolean; totalCompleted: number } {
  const store = getLocalDeviceStore(userId, examId);
  const exists = store.completedBoxKeys.includes(dateKey);

  let newKeys: string[];
  let completed = false;

  if (!exists) {
    newKeys = [...store.completedBoxKeys, dateKey];
    completed = true;
  } else {
    // If already complete, keep it complete (or toggle if needed)
    newKeys = store.completedBoxKeys;
    completed = true;
  }

  // Create lightweight packet for background synchronization
  const packet: StudyTelemetryPacket = {
    id: `pkt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    examId,
    date: dateKey,
    studyMinutesIncrement: 30,
    boxCompleted: true,
    boxDateKey: dateKey,
    completedTasksCount: 1,
    timestamp: Date.now(),
  };

  store.completedBoxKeys = newKeys;
  store.pendingSyncPackets.push(packet);
  saveLocalDeviceStore(store);

  // Enqueue in IndexedDB durable syncWorker
  syncWorker.enqueueTelemetry(userId, examId, dateKey, 30, true).catch(() => {});

  // Trigger background batch sync if online
  queueBackgroundPacketSync(store);

  return { completed, totalCompleted: newKeys.length };
}

/**
 * Default estimated exam dates
 */
export function getDefaultExamDate(examId: string): string {
  const currentYear = new Date().getFullYear();
  switch (examId) {
    case 'NEET_UG':
      return `${currentYear + 1}-05-03`;
    case 'JEE_MAIN':
      return `${currentYear + 1}-04-06`;
    case 'JEE_ADVANCED':
      return `${currentYear + 1}-05-24`;
    case 'UPSC_CSE':
      return `${currentYear + 1}-05-25`;
    case 'GATE':
      return `${currentYear + 1}-02-08`;
    case 'CAT':
      return `${currentYear}-11-29`;
    case 'SSC_CGL':
      return `${currentYear + 1}-09-15`;
    default:
      return `${currentYear + 1}-06-15`;
  }
}

let syncTimeout: any = null;

/**
 * Batches packets together and transmits once to prevent server load
 */
export function queueBackgroundPacketSync(store: LocalDeviceStudyStore): void {
  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(async () => {
    if (!navigator.onLine || store.pendingSyncPackets.length === 0) return;

    const packetsToSync = [...store.pendingSyncPackets];
    try {
      const res = await fetch('/api/telemetry/packet-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: store.userId,
          examId: store.activeExam,
          packets: packetsToSync,
          deviceTimestamp: Date.now(),
        }),
      }).catch(() => null);

      if (res && res.ok) {
        // Clear synced packets from local queue
        const currentStore = getLocalDeviceStore(store.userId, store.activeExam);
        currentStore.pendingSyncPackets = currentStore.pendingSyncPackets.filter(
          p => !packetsToSync.some(synced => synced.id === p.id)
        );
        currentStore.lastSyncedAt = Date.now();
        saveLocalDeviceStore(currentStore);
      }
    } catch (err) {
      console.warn('Packet sync deferred (will retry when network is stable):', err);
    }
  }, 4000); // 4-second batch debounce
}
