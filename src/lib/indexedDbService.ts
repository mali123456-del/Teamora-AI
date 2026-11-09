/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TEAMORA AI — Phase 66–68: IndexedDB Offline Architecture
 * Typed versioned client storage wrapper for caching organization agent tasks,
 * managing offline mutation queues, and tracking synchronization state.
 */

export interface OfflineTaskRecord {
  id: string;
  orgId: string;
  agentId: string;
  agentName: string;
  title: string;
  prompt: string;
  status: 'queued' | 'planning' | 'running' | 'completed' | 'failed' | 'needs_approval' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  result?: string;
  error?: string;
  requiresApproval?: boolean;
  approvalId?: string;
  syncStatus: 'synced' | 'pending_create' | 'pending_update' | 'conflict';
  localDraft: boolean;
  serverVersion: number;
  serverConflictData?: any;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncQueueItem {
  id: string;
  orgId: string;
  action: 'create_task' | 'update_task' | 'cancel_task' | 'execute_approval';
  payload: Record<string, any>;
  idempotencyKey: string;
  queuedAt: string;
  retryCount: number;
  lastError?: string;
}

const DB_NAME = 'TeamoraOfflineDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment.'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Cached Tasks Store
        if (!db.objectStoreNames.contains('cachedTasks')) {
          const taskStore = db.createObjectStore('cachedTasks', { keyPath: 'id' });
          taskStore.createIndex('orgId', 'orgId', { unique: false });
          taskStore.createIndex('status', 'status', { unique: false });
          taskStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          taskStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // 2. Offline Sync Queue Store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          queueStore.createIndex('orgId', 'orgId', { unique: false });
          queueStore.createIndex('queuedAt', 'queuedAt', { unique: false });
          queueStore.createIndex('action', 'action', { unique: false });
        }

        // 3. Cached Offline Knowledge Store
        if (!db.objectStoreNames.contains('cachedKnowledge')) {
          const docStore = db.createObjectStore('cachedKnowledge', { keyPath: 'id' });
          docStore.createIndex('orgId', 'orgId', { unique: false });
          docStore.createIndex('category', 'category', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  return dbPromise;
}

// ==========================================
// Tasks Cache Operations
// ==========================================

export async function saveCachedTask(task: OfflineTaskRecord): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cachedTasks', 'readwrite');
    const store = tx.objectStore('cachedTasks');
    const req = store.put(task);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function bulkSaveCachedTasks(tasks: OfflineTaskRecord[]): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cachedTasks', 'readwrite');
    const store = tx.objectStore('cachedTasks');
    for (const task of tasks) {
      store.put(task);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedTasksForOrg(orgId: string): Promise<OfflineTaskRecord[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cachedTasks', 'readonly');
    const store = tx.objectStore('cachedTasks');
    const index = store.index('orgId');
    const req = index.getAll(orgId);
    req.onsuccess = () => {
      const records: OfflineTaskRecord[] = req.result || [];
      // Sort newest first
      records.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      resolve(records);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getCachedTaskById(taskId: string): Promise<OfflineTaskRecord | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cachedTasks', 'readonly');
    const store = tx.objectStore('cachedTasks');
    const req = store.get(taskId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// ==========================================
// Sync Queue Operations
// ==========================================

export async function enqueueSyncItem(item: SyncQueueItem): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getSyncQueueItems(orgId?: string): Promise<SyncQueueItem[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const req = store.getAll();
    req.onsuccess = () => {
      let items: SyncQueueItem[] = req.result || [];
      if (orgId) {
        items = items.filter((i) => i.orgId === orgId);
      }
      items.sort((a, b) => new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime());
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function removeSyncQueueItem(itemId: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const req = store.delete(itemId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearOrgOfflineData(orgId: string): Promise<void> {
  const db = await getDb();
  const tasks = await getCachedTasksForOrg(orgId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['cachedTasks', 'syncQueue'], 'readwrite');
    const taskStore = tx.objectStore('cachedTasks');
    for (const t of tasks) {
      taskStore.delete(t.id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
