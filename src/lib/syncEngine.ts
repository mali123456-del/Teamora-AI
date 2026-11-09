/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TEAMORA AI — Phase 68: Offline Synchronization Engine
 * Manages background replay of queued mutations, conflict detection,
 * idempotency protection, and connectivity state tracking.
 */

import {
  enqueueSyncItem,
  getSyncQueueItems,
  removeSyncQueueItem,
  saveCachedTask,
  getCachedTaskById,
  OfflineTaskRecord,
  SyncQueueItem,
} from './indexedDbService.ts';

export type ConnectivityStatus = 'online' | 'offline';

export interface SyncEngineStatus {
  connectivity: ConnectivityStatus;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTimestamp: string | null;
  conflictsCount: number;
}

type SyncStatusListener = (status: SyncEngineStatus) => void;

class SynchronizationEngine {
  private connectivity: ConnectivityStatus = typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline';
  private isSyncing = false;
  private lastSyncTimestamp: string | null = null;
  private listeners: Set<SyncStatusListener> = new Set();
  private maxRetries = 3;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.connectivity = 'online';
        this.notify();
        this.triggerSync();
      });

      window.addEventListener('offline', () => {
        this.connectivity = 'offline';
        this.notify();
      });

      // Load last sync time from localStorage
      this.lastSyncTimestamp = localStorage.getItem('teamora_last_sync_time');
    }
  }

  public getStatus(): SyncEngineStatus {
    return {
      connectivity: this.connectivity,
      isSyncing: this.isSyncing,
      pendingCount: 0, // Computed dynamically in subscribe or trigger
      lastSyncTimestamp: this.lastSyncTimestamp,
      conflictsCount: 0,
    };
  }

  public subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    this.refreshAndNotify();
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async refreshAndNotify(orgId?: string) {
    let pendingCount = 0;
    try {
      const items = await getSyncQueueItems(orgId);
      pendingCount = items.length;
    } catch {
      // Ignore
    }

    const status: SyncEngineStatus = {
      connectivity: this.connectivity,
      isSyncing: this.isSyncing,
      pendingCount,
      lastSyncTimestamp: this.lastSyncTimestamp,
      conflictsCount: 0,
    };

    for (const listener of this.listeners) {
      listener(status);
    }
  }

  private notify() {
    this.refreshAndNotify();
  }

  /**
   * Queue a local task draft while offline or online.
   * Hardened against race conditions: syncStatus is strictly 'pending_create' until server returns 200 OK.
   */
  public async queueTaskCreation(
    orgId: string,
    taskDraft: {
      id?: string;
      agentId: string;
      agentName: string;
      title: string;
      prompt: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      idempotencyKey?: string;
    }
  ): Promise<OfflineTaskRecord> {
    const taskId = taskDraft.id || `task-offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    // Single stable idempotency key per logical operation, reused across retries
    const idempotencyKey = taskDraft.idempotencyKey || `idemp-task-${taskId}`;

    // Initial state is ALWAYS pending_create to prevent premature 'synced' reads by concurrent listeners
    const record: OfflineTaskRecord = {
      id: taskId,
      orgId,
      agentId: taskDraft.agentId,
      agentName: taskDraft.agentName,
      title: taskDraft.title,
      prompt: taskDraft.prompt,
      status: 'queued',
      priority: taskDraft.priority || 'medium',
      syncStatus: 'pending_create',
      localDraft: true,
      serverVersion: 1,
      idempotencyKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to IndexedDB cache in pending state prior to network call
    await saveCachedTask(record);

    // If offline, enqueue into syncQueue immediately
    if (this.connectivity === 'offline') {
      const queueItem: SyncQueueItem = {
        id: `sync-${taskId}`,
        orgId,
        action: 'create_task',
        payload: {
          taskId,
          agentId: taskDraft.agentId,
          title: taskDraft.title,
          prompt: taskDraft.prompt,
          priority: taskDraft.priority || 'medium',
          orgId,
          idempotencyKey,
        },
        idempotencyKey,
        queuedAt: new Date().toISOString(),
        retryCount: 0,
      };
      await enqueueSyncItem(queueItem);
      this.refreshAndNotify(orgId);
      return record;
    }

    // If online, attempt synchronization with server
    try {
      const res = await fetch('/api/agent/task/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teamora-org': orgId,
          'x-teamora-idempotency': idempotencyKey,
        },
        body: JSON.stringify({
          agentId: taskDraft.agentId,
          title: taskDraft.title,
          prompt: taskDraft.prompt,
          priority: taskDraft.priority || 'medium',
          orgId,
          idempotencyKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const serverTask = data.task || data.data?.task || (data.id ? data : null);
        // Verify response envelope and task ID
        if (data && (data.success === true || serverTask) && serverTask?.id) {
          record.status = serverTask.status || 'queued';
          record.result = serverTask.result;
          record.requiresApproval = serverTask.requiresApproval;
          record.approvalId = serverTask.approvalId;
          record.syncStatus = 'synced';
          record.localDraft = false;
          record.updatedAt = serverTask.updatedAt || new Date().toISOString();
          await saveCachedTask(record);
        } else {
          // Malformed response envelope: fallback to retry queue
          await this.fallbackEnqueue(record, idempotencyKey);
        }
      } else {
        // Non-200 response: queue for background retry
        await this.fallbackEnqueue(record, idempotencyKey);
      }
    } catch {
      // Network failure during flight: safely fallback to queue
      await this.fallbackEnqueue(record, idempotencyKey);
    }

    this.refreshAndNotify(orgId);
    return record;
  }

  private async fallbackEnqueue(record: OfflineTaskRecord, idempotencyKey: string) {
    record.syncStatus = 'pending_create';
    record.idempotencyKey = idempotencyKey;
    await saveCachedTask(record);
    await enqueueSyncItem({
      id: `sync-${record.id}`,
      orgId: record.orgId,
      action: 'create_task',
      payload: {
        taskId: record.id,
        agentId: record.agentId,
        title: record.title,
        prompt: record.prompt,
        priority: record.priority,
        orgId: record.orgId,
        idempotencyKey,
      },
      idempotencyKey,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
    });
  }

  /**
   * Process all queued offline mutations when connection is restored.
   */
  public async triggerSync(orgId?: string): Promise<{ syncedCount: number; errorsCount: number }> {
    if (this.connectivity === 'offline' || this.isSyncing) {
      return { syncedCount: 0, errorsCount: 0 };
    }

    this.isSyncing = true;
    this.refreshAndNotify(orgId);

    let syncedCount = 0;
    let errorsCount = 0;

    try {
      const items = await getSyncQueueItems(orgId);

      for (const item of items) {
        try {
          if (item.action === 'create_task') {
            const res = await fetch('/api/agent/task/execute', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-teamora-org': item.orgId,
                'x-teamora-idempotency': item.idempotencyKey,
              },
              body: JSON.stringify({
                ...item.payload,
                idempotencyKey: item.idempotencyKey,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              const serverTask = data.task || (data.id ? data : null);

              if (data && (data.success === true || serverTask) && serverTask?.id) {
                // Update cached task
                const localTask = await getCachedTaskById(item.payload.taskId);
                if (localTask) {
                  localTask.status = serverTask.status || 'queued';
                  localTask.result = serverTask.result;
                  localTask.requiresApproval = serverTask.requiresApproval;
                  localTask.approvalId = serverTask.approvalId;
                  localTask.syncStatus = 'synced';
                  localTask.localDraft = false;
                  localTask.serverVersion = (localTask.serverVersion || 1) + 1;
                  localTask.updatedAt = new Date().toISOString();
                  await saveCachedTask(localTask);
                }

                // Remove from queue
                await removeSyncQueueItem(item.id);
                syncedCount++;
              } else {
                throw new Error('Malformed server response envelope: missing success or task.id');
              }
            } else if (res.status === 409) {
              // Server already has this idempotent record: mark as synced and remove queue
              const localTask = await getCachedTaskById(item.payload.taskId);
              if (localTask) {
                localTask.syncStatus = 'synced';
                localTask.localDraft = false;
                await saveCachedTask(localTask);
              }
              await removeSyncQueueItem(item.id);
              syncedCount++;
            } else {
              // Server error: check retry count
              item.retryCount += 1;
              if (item.retryCount >= this.maxRetries) {
                // Flag conflict or failure
                const localTask = await getCachedTaskById(item.payload.taskId);
                if (localTask) {
                  localTask.syncStatus = 'conflict';
                  localTask.error = `Server sync failed after ${this.maxRetries} attempts.`;
                  await saveCachedTask(localTask);
                }
                await removeSyncQueueItem(item.id);
              } else {
                // Persist updated retryCount into IndexedDB to avoid reset on next boot
                await enqueueSyncItem(item);
              }
              errorsCount++;
            }
          }
        } catch (err: any) {
          item.retryCount += 1;
          errorsCount++;
          if (item.retryCount >= this.maxRetries) {
            const localTask = await getCachedTaskById(item.payload.taskId);
            if (localTask) {
              localTask.syncStatus = 'conflict';
              localTask.error = `Network or execution error after ${this.maxRetries} attempts: ${err.message || 'Timeout'}`;
              await saveCachedTask(localTask);
            }
            await removeSyncQueueItem(item.id);
          } else {
            await enqueueSyncItem(item);
          }
        }
      }

      this.lastSyncTimestamp = new Date().toISOString();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('teamora_last_sync_time', this.lastSyncTimestamp);
      }
    } finally {
      this.isSyncing = false;
      this.refreshAndNotify(orgId);
    }

    return { syncedCount, errorsCount };
  }

  /**
   * Resolve a conflicting record manually.
   */
  public async resolveConflict(taskId: string, resolution: 'keep_local' | 'accept_server'): Promise<void> {
    const task = await getCachedTaskById(taskId);
    if (!task) return;

    if (resolution === 'keep_local') {
      task.syncStatus = 'pending_create';
      task.error = undefined;
      await saveCachedTask(task);
      await enqueueSyncItem({
        id: `sync-retry-${task.id}`,
        orgId: task.orgId,
        action: 'create_task',
        payload: {
          taskId: task.id,
          agentId: task.agentId,
          title: task.title,
          prompt: task.prompt,
          priority: task.priority,
          orgId: task.orgId,
        },
        idempotencyKey: `idemp-force-${Date.now()}`,
        queuedAt: new Date().toISOString(),
        retryCount: 0,
      });
      this.triggerSync(task.orgId);
    } else {
      // Accept server: clear conflict flag
      task.syncStatus = 'synced';
      task.error = undefined;
      await saveCachedTask(task);
      this.notify();
    }
  }
}

export const syncEngine = new SynchronizationEngine();
