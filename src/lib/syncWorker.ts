/**
 * AspirantX Durable Offline Synchronization Worker
 * 
 * Guarantees zero lost user progress across network disruptions.
 * 
 * Workflow:
 * 1. User performs an action (checks subtopic, studies with timer, finishes CBT test).
 * 2. Writes immediately to local IndexedDB (optimistic local state).
 * 3. Enqueues a sync item into IndexedDB `sync_queue`.
 * 4. Batched background worker collects all pending items and transmits them
 *    in a single POST /api/sync/batch request every 15s or on network reconnection.
 * 5. Acknowledged items are purged; offline items remain safely queued.
 */

import { localDb, SyncQueueItem, LocalUserProgressRecord } from './localDatabase';
import { normalizeExamId } from './examRegistry';

export type SyncActionType = 'SYLLABUS_PROGRESS' | 'TELEMETRY' | 'CBT_RESULT';

export interface BatchSyncPayload {
  userId: string;
  deviceTimestamp: number;
  items: SyncQueueItem[];
}

export class SyncWorker {
  private static instance: SyncWorker;
  private syncTimer: any = null;
  private isSyncing = false;

  public static getInstance(): SyncWorker {
    if (!SyncWorker.instance) {
      SyncWorker.instance = new SyncWorker();
      SyncWorker.instance.initializeListeners();
    }
    return SyncWorker.instance;
  }

  public init(): void {
    // Already initialized singleton and listeners
  }

  private initializeListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncWorker] Network online detected, triggering batch sync...');
        this.triggerBatchSync();
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.triggerBatchSync();
        }
      });
    }
  }

  /**
   * Enqueues a syllabus subtopic completion update
   */
  public async enqueueSyllabusProgress(
    userId: string = 'guest',
    rawExamId: string,
    completedSubtopicIds: string[]
  ): Promise<void> {
    const examId = normalizeExamId(rawExamId);
    const key = `${userId}_${examId}`;

    // 1. Optimistic Local Update in IndexedDB
    const existing = await localDb.get<LocalUserProgressRecord>('user_progress', key);
    const updated: LocalUserProgressRecord = {
      key,
      userId,
      examId,
      completedSubtopics: completedSubtopicIds,
      todayMinutes: existing?.todayMinutes || 0,
      streakDays: existing?.streakDays || 1,
      lastActiveDate: existing?.lastActiveDate || new Date().toISOString().split('T')[0],
      completedBoxKeys: existing?.completedBoxKeys || [],
      updatedAt: Date.now()
    };
    await localDb.put('user_progress', updated);

    // 2. Also keep localStorage updated for instant synchronous reads
    try {
      localStorage.setItem(`aspirantx_subtopic_progress_v3_${userId}_${examId}`, JSON.stringify(completedSubtopicIds));
    } catch (e) {}

    // 3. Enqueue to durable sync queue
    const syncItem: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId,
      examId,
      type: 'SYLLABUS_PROGRESS',
      payload: {
        completedSubtopicIds,
        completedCount: completedSubtopicIds.length,
        timestamp: Date.now()
      },
      createdAt: Date.now(),
      retryCount: 0
    };

    await localDb.put('sync_queue', syncItem);
    this.scheduleDebouncedSync();
  }

  /**
   * Enqueues study telemetry / habit box completion
   */
  public async enqueueTelemetry(
    userId: string = 'guest',
    rawExamId: string,
    dateKey: string,
    studyMinutesIncrement: number,
    boxCompleted: boolean
  ): Promise<void> {
    const examId = normalizeExamId(rawExamId);
    const key = `${userId}_${examId}`;

    // 1. Optimistic Local Update
    const existing = await localDb.get<LocalUserProgressRecord>('user_progress', key);
    const boxKeys = new Set(existing?.completedBoxKeys || []);
    if (boxCompleted) boxKeys.add(dateKey);

    const updated: LocalUserProgressRecord = {
      key,
      userId,
      examId,
      completedSubtopics: existing?.completedSubtopics || [],
      todayMinutes: (existing?.todayMinutes || 0) + studyMinutesIncrement,
      streakDays: Math.max(1, existing?.streakDays || 1),
      lastActiveDate: dateKey,
      completedBoxKeys: Array.from(boxKeys),
      updatedAt: Date.now()
    };
    await localDb.put('user_progress', updated);

    // 2. Enqueue sync item
    const syncItem: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId,
      examId,
      type: 'TELEMETRY',
      payload: {
        dateKey,
        studyMinutesIncrement,
        boxCompleted,
        totalCompletedBoxes: updated.completedBoxKeys.length,
        timestamp: Date.now()
      },
      createdAt: Date.now(),
      retryCount: 0
    };

    await localDb.put('sync_queue', syncItem);
    this.scheduleDebouncedSync();
  }

  /**
   * Enqueues a CBT exam test submission
   */
  public async enqueueCbtResult(
    userId: string = 'guest',
    rawExamId: string,
    testId: string,
    resultPayload: any
  ): Promise<void> {
    const examId = normalizeExamId(rawExamId);

    // Save to user_cbt_results store in IndexedDB
    const resultRecord = {
      id: `res_${testId}_${Date.now()}`,
      userId,
      examId,
      testId,
      ...resultPayload,
      completedAt: Date.now()
    };
    await localDb.put('user_cbt_results', resultRecord);

    // Enqueue sync item
    const syncItem: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId,
      examId,
      type: 'CBT_RESULT',
      payload: resultRecord,
      createdAt: Date.now(),
      retryCount: 0
    };

    await localDb.put('sync_queue', syncItem);
    this.scheduleDebouncedSync();
  }

  /**
   * Schedules a debounced batch synchronization (15 seconds)
   */
  public scheduleDebouncedSync(delayMs: number = 15000): void {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.triggerBatchSync();
    }, delayMs);
  }

  /**
   * Performs the batched network sync
   */
  public async triggerBatchSync(): Promise<{ success: boolean; syncedCount: number }> {
    if (this.isSyncing) return { success: false, syncedCount: 0 };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: false, syncedCount: 0 };
    }

    this.isSyncing = true;
    try {
      const allItems = await localDb.getAll<SyncQueueItem>('sync_queue');
      if (allItems.length === 0) {
        return { success: true, syncedCount: 0 };
      }

      // Group items by user or sync all in one batch
      const userId = allItems[0].userId || 'guest';
      const payload: BatchSyncPayload = {
        userId,
        deviceTimestamp: Date.now(),
        items: allItems.slice(0, 50) // Process up to 50 items per batch
      };

      const res = await fetch('/api/sync/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        const acknowledgedIds: string[] = data.acknowledgedIds || payload.items.map(i => i.id);

        // Delete acknowledged items from IndexedDB
        for (const id of acknowledgedIds) {
          await localDb.delete('sync_queue', id);
        }

        console.log(`[SyncWorker] Successfully synced ${acknowledgedIds.length} queued items to server.`);
        window.dispatchEvent(new CustomEvent('aspirantx_sync_status', { 
          detail: { status: 'synced', count: acknowledgedIds.length, timestamp: Date.now() } 
        }));

        return { success: true, syncedCount: acknowledgedIds.length };
      } else {
        // Increment retry count
        for (const item of payload.items) {
          item.retryCount = (item.retryCount || 0) + 1;
          await localDb.put('sync_queue', item);
        }
        return { success: false, syncedCount: 0 };
      }
    } catch (err) {
      console.warn('[SyncWorker] Batch sync encountered network issue, will retry:', err);
      return { success: false, syncedCount: 0 };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get count of pending unsynced items
   */
  public async getPendingSyncCount(): Promise<number> {
    const items = await localDb.getAll<SyncQueueItem>('sync_queue');
    return items.length;
  }
}

export const syncWorker = SyncWorker.getInstance();
