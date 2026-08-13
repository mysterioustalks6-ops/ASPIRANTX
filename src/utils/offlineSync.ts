/**
 * Offline Sync and Local Cache Storage Utility for AspirantX
 */

export interface SyncQueueItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: any;
  createdAt: string;
}

const SYNC_QUEUE_KEY = 'aspirantx_offline_sync_queue';
const OFFLINE_NOTES_KEY = 'aspirantx_offline_notes';
const OFFLINE_PYQ_KEY = 'aspirantx_offline_pyqs';

export const offlineSyncUtil = {
  // Add item to retry queue when offline
  addToSyncQueue(endpoint: string, method: 'POST' | 'PUT' | 'DELETE', payload: any) {
    const queue = this.getSyncQueue();
    const newItem: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      endpoint,
      method,
      payload,
      createdAt: new Date().toISOString()
    };
    queue.push(newItem);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    return newItem;
  },

  getSyncQueue(): SyncQueueItem[] {
    try {
      const data = localStorage.getItem(SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async processSyncQueue() {
    if (!navigator.onLine) return;
    const queue = this.getSyncQueue();
    if (queue.length === 0) return;

    const remaining: SyncQueueItem[] = [];
    for (const item of queue) {
      try {
        const res = await fetch(item.endpoint, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload)
        });
        if (!res.ok) {
          remaining.push(item);
        }
      } catch (err) {
        remaining.push(item);
      }
    }
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
  },

  // Save offline notes
  saveOfflineNote(topicId: string, content: string) {
    try {
      const notes = this.getOfflineNotes();
      notes[topicId] = { content, updatedAt: new Date().toISOString() };
      localStorage.setItem(OFFLINE_NOTES_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save offline note:', e);
    }
  },

  getOfflineNotes(): Record<string, { content: string; updatedAt: string }> {
    try {
      const data = localStorage.getItem(OFFLINE_NOTES_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  // Save offline PYQ bookmark
  cachePyqForOffline(year: number, subject: string, questions: any[]) {
    try {
      const pyqs = this.getOfflinePyqs();
      const key = `${subject}_${year}`;
      pyqs[key] = { questions, cachedAt: new Date().toISOString() };
      localStorage.setItem(OFFLINE_PYQ_KEY, JSON.stringify(pyqs));
    } catch (e) {
      console.error('Failed to cache PYQs:', e);
    }
  },

  getOfflinePyqs(): Record<string, any> {
    try {
      const data = localStorage.getItem(OFFLINE_PYQ_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }
};
