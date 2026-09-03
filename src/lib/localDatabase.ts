/**
 * AspirantX Local-First Database Layer (IndexedDB)
 * 
 * Provides high-performance, asynchronous, structured storage on the user's device
 * with zero external dependencies. Compatible with Web, Android WebView, and iOS.
 * 
 * Handles:
 * - Content Packages (Syllabus, Questions, PYQs, CBT)
 * - User Progress & Telemetry
 * - Durable Offline Synchronization Queue
 */

const DB_NAME = 'aspirantx_local_db_v1';
const DB_VERSION = 2;

export interface ContentPackageMeta {
  examId: string;
  version: number;
  schemaVersion: number;
  title: string;
  installedAt: number;
  itemCounts: {
    syllabusTopics: number;
    questions: number;
    pyqs: number;
    cbtTests: number;
  };
}

export interface LocalSyllabusRecord {
  id: string; // e.g. `${examId}_${subject}_${topic}`
  examId: string;
  subject: string;
  topic: string;
  subtopics: Array<{
    id: string;
    name: string;
    completed?: boolean;
    estimatedMinutes?: number;
  }>;
  subtopicsCount: number;
  completedSubtopics?: number;
}

export interface LocalQuestionRecord {
  id: string;
  examId: string;
  subject: string;
  topic: string;
  questionText: string;
  options: string[];
  correctOption: number;
  solutionText: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  type: 'mcq' | 'numerical' | 'assertion';
  language?: string;
  status?: 'published';
}

export interface LocalPyqRecord {
  id: string;
  examId: string;
  year: number;
  stage?: string;
  paper?: string;
  subject: string;
  topic: string;
  questionText: string;
  options: string[];
  correctOption: number;
  explanation: string;
  difficulty?: string;
  language?: string;
}

export interface LocalCbtRecord {
  id: string;
  examId: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  negativeMarking: number;
  questions: any[];
  difficulty?: string;
  isMock?: boolean;
}

export interface LocalUserProgressRecord {
  key: string; // `${userId}_${examId}`
  userId: string;
  examId: string;
  completedSubtopics: string[];
  todayMinutes: number;
  streakDays: number;
  lastActiveDate: string;
  completedBoxKeys: string[];
  updatedAt: number;
}

export interface SyncQueueItem {
  id: string;
  userId: string;
  examId: string;
  type: 'SYLLABUS_PROGRESS' | 'TELEMETRY' | 'CBT_RESULT';
  payload: any;
  createdAt: number;
  retryCount: number;
}

class LocalDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private isSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  public getDb(): Promise<IDBDatabase> {
    if (!this.isSupported()) {
      return Promise.reject(new Error('IndexedDB is not supported in this environment'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 1. Content Packages Metadata Store
          if (!db.objectStoreNames.contains('content_packages')) {
            db.createObjectStore('content_packages', { keyPath: 'examId' });
          }

          // 2. Syllabus Store
          if (!db.objectStoreNames.contains('content_syllabus')) {
            const store = db.createObjectStore('content_syllabus', { keyPath: 'id' });
            store.createIndex('by_exam', 'examId', { unique: false });
            store.createIndex('by_exam_subject', ['examId', 'subject'], { unique: false });
          }

          // 3. Questions Store
          if (!db.objectStoreNames.contains('content_questions')) {
            const store = db.createObjectStore('content_questions', { keyPath: 'id' });
            store.createIndex('by_exam', 'examId', { unique: false });
            store.createIndex('by_exam_subject', ['examId', 'subject'], { unique: false });
            store.createIndex('by_exam_type', ['examId', 'type'], { unique: false });
          }

          // 4. PYQ Store
          if (!db.objectStoreNames.contains('content_pyqs')) {
            const store = db.createObjectStore('content_pyqs', { keyPath: 'id' });
            store.createIndex('by_exam', 'examId', { unique: false });
            store.createIndex('by_exam_subject', ['examId', 'subject'], { unique: false });
            store.createIndex('by_exam_year', ['examId', 'year'], { unique: false });
          }

          // 5. CBT Store
          if (!db.objectStoreNames.contains('content_cbt')) {
            const store = db.createObjectStore('content_cbt', { keyPath: 'id' });
            store.createIndex('by_exam', 'examId', { unique: false });
          }

          // 6. User Progress Store
          if (!db.objectStoreNames.contains('user_progress')) {
            const store = db.createObjectStore('user_progress', { keyPath: 'key' });
            store.createIndex('by_user', 'userId', { unique: false });
            store.createIndex('by_exam', 'examId', { unique: false });
          }

          // 7. CBT Results Store
          if (!db.objectStoreNames.contains('user_cbt_results')) {
            const store = db.createObjectStore('user_cbt_results', { keyPath: 'id' });
            store.createIndex('by_user_exam', ['userId', 'examId'], { unique: false });
          }

          // 8. Offline Sync Queue Store
          if (!db.objectStoreNames.contains('sync_queue')) {
            const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
            store.createIndex('by_created', 'createdAt', { unique: false });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    return this.dbPromise;
  }

  // ─── Generic Helpers ────────────────────────────────────────────────────────
  public async get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`[LocalDB] Get failed for ${storeName}:${String(key)}`, e);
      return null;
    }
  }

  public async put<T>(storeName: string, value: T): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(value);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`[LocalDB] Put failed for ${storeName}`, e);
    }
  }

  public async putBatch<T>(storeName: string, items: T[]): Promise<void> {
    if (!items || items.length === 0) return;
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        for (const item of items) {
          store.put(item);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn(`[LocalDB] PutBatch failed for ${storeName}`, e);
    }
  }

  public async delete(storeName: string, key: IDBValidKey): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`[LocalDB] Delete failed for ${storeName}:${String(key)}`, e);
    }
  }

  public async getAllFromIndex<T>(
    storeName: string,
    indexName: string,
    query: IDBValidKey | IDBKeyRange
  ): Promise<T[]> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const req = index.getAll(query);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`[LocalDB] getAllFromIndex failed for ${storeName}:${indexName}`, e);
      return [];
    }
  }

  public async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`[LocalDB] getAll failed for ${storeName}`, e);
      return [];
    }
  }

  public async clear(storeName: string): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`[LocalDB] Clear failed for ${storeName}`, e);
    }
  }
}

export const localDb = new LocalDatabase();
