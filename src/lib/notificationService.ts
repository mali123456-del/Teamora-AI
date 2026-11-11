/**
 * TEAMORA AI — Enterprise Persistent Notification Service
 * Handles multi-tenant activity alerts, task events, agent status updates,
 * approval requests, and security logs with offline-first persistence.
 */

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationType =
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'agent_approval_needed'
  | 'agent_action_executed'
  | 'rag_indexed'
  | 'sync_status'
  | 'security_alert'
  | 'inventory_alert'
  | 'system';

export type NotificationEntityType = 'task' | 'agent' | 'approval' | 'pipeline' | 'inventory' | 'finance' | 'security' | 'system';

export interface TeamoraNotification {
  id: string;
  orgId: string;
  recipientUserId?: string;
  eventId: string; // Idempotency & deduplication key
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string;
  isRead: boolean;
  priority: NotificationPriority;
  entityType: NotificationEntityType;
  entityId?: string;
  actionUrl?: string; // App tab navigation target (e.g. 'tasks', 'approvals', 'agents', 'inventory')
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  soundEnabled: boolean;
  taskAlerts: boolean;
  agentAlerts: boolean;
  approvalAlerts: boolean;
  securityAlerts: boolean;
  inventoryAlerts: boolean;
  minPriority: NotificationPriority;
  browserPushEnabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  soundEnabled: true,
  taskAlerts: true,
  agentAlerts: true,
  approvalAlerts: true,
  securityAlerts: true,
  inventoryAlerts: true,
  minPriority: 'low',
  browserPushEnabled: false,
};

const STORAGE_KEY_NOTIFS = 'teamora_notifications_v1';
const STORAGE_KEY_PREFS = 'teamora_notification_prefs_v1';

// Seed Initial Realistic Activity for Workspaces
const SEED_NOTIFICATIONS: TeamoraNotification[] = [
  {
    id: 'notif-seed-1',
    orgId: 'org-apex',
    eventId: 'evt-task-fin-reconcile-01',
    type: 'task_completed',
    title: 'Financial Reconciliation Completed',
    message: 'Tariq Vance finalized Q3 revenue reconciliation across 14 bank statements with 99.8% balance accuracy.',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    isRead: false,
    priority: 'medium',
    entityType: 'task',
    entityId: 'task-fin-01',
    actionUrl: 'finance',
    metadata: { agentId: 'agent-tariq', duration: '2.4s', tokens: 1420 },
  },
  {
    id: 'notif-seed-2',
    orgId: 'org-apex',
    eventId: 'evt-approval-contract-01',
    type: 'agent_approval_needed',
    title: 'Contract Signature Authorization Required',
    message: 'Sarah Jenkins drafted Enterprise SaaS Agreement for Global Logistics Corp ($45,000/yr). Review required before dispatch.',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    isRead: false,
    priority: 'urgent',
    entityType: 'approval',
    entityId: 'appr-01',
    actionUrl: 'approvals',
    metadata: { agentId: 'agent-sarah', riskLevel: 'high' },
  },
  {
    id: 'notif-seed-3',
    orgId: 'org-apex',
    eventId: 'evt-rag-index-01',
    type: 'rag_indexed',
    title: 'Knowledge Hub Documents Ingested',
    message: 'Successfully indexed 18 corporate policy files into vector store. 240 semantic chunks generated with BM25 keyword boosting.',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    isRead: true,
    readAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    priority: 'low',
    entityType: 'system',
    actionUrl: 'rag-studio',
    metadata: { chunksCount: 240 },
  },
  {
    id: 'notif-seed-4',
    orgId: 'org-apex',
    eventId: 'evt-sec-audit-01',
    type: 'security_alert',
    title: 'Cryptographic Audit Chain Verified',
    message: 'Scheduled audit log verification passed. SHA-256 chained hash integrity is 100% valid with 0 tamper attempts.',
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    isRead: true,
    readAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    priority: 'low',
    entityType: 'security',
    actionUrl: 'security',
    metadata: { hashRoot: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
  },
  {
    id: 'notif-seed-5',
    orgId: 'org-crescent',
    eventId: 'evt-inv-lowstock-01',
    type: 'inventory_alert',
    title: 'Low Stock Alert — Industrial Yarn Rolls',
    message: 'SKU-PK-102 dropped below minimum buffer threshold. 6 units remaining in Karachi warehouse.',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isRead: false,
    priority: 'high',
    entityType: 'inventory',
    entityId: 'prod-02',
    actionUrl: 'inventory',
    metadata: { currentStock: 6, minThreshold: 15 },
  },
  {
    id: 'notif-seed-6',
    orgId: 'org-crescent',
    eventId: 'evt-inv-invoice-01',
    type: 'task_completed',
    title: 'Invoice Sent to Lahore Retailers',
    message: 'Tariq Vance generated and transmitted INV-2026-089 for ₨ 450,000 with 14-day payment terms.',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    isRead: false,
    priority: 'medium',
    entityType: 'finance',
    actionUrl: 'finance',
    metadata: { amountPkr: 450000 },
  },
];

class NotificationService {
  private notifications: TeamoraNotification[] = [];
  private preferences: Record<string, NotificationPreferences> = {};
  private listeners: Set<(notifs: TeamoraNotification[]) => void> = new Set();
  private processedEventIds: Set<string> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedNotifs = localStorage.getItem(STORAGE_KEY_NOTIFS);
        if (storedNotifs) {
          const parsed = JSON.parse(storedNotifs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.notifications = parsed;
          } else {
            this.notifications = [...SEED_NOTIFICATIONS];
          }
        } else {
          this.notifications = [...SEED_NOTIFICATIONS];
        }

        const storedPrefs = localStorage.getItem(STORAGE_KEY_PREFS);
        if (storedPrefs) {
          this.preferences = JSON.parse(storedPrefs);
        }
      } else {
        this.notifications = [...SEED_NOTIFICATIONS];
      }
    } catch {
      this.notifications = [...SEED_NOTIFICATIONS];
    }

    // Populate deduplication event ID cache
    this.notifications.forEach((n) => {
      if (n.eventId) this.processedEventIds.add(n.eventId);
    });
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(this.notifications));
        localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(this.preferences));
      }
    } catch {
      // Ignore storage errors (quota or private mode)
    }
  }

  private notifyListeners(): void {
    const copy = [...this.notifications];
    this.listeners.forEach((listener) => {
      try {
        listener(copy);
      } catch (err) {
        console.error('Notification listener error:', err);
      }
    });
  }

  /**
   * Subscribe to notification updates.
   */
  public subscribe(listener: (notifs: TeamoraNotification[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.notifications]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Retrieve notifications for a specific organization with optional filtering.
   */
  public getNotifications(
    orgId: string,
    filter?: {
      category?: 'all' | 'unread' | 'task' | 'agent' | 'approval';
      unreadOnly?: boolean;
      priority?: NotificationPriority;
      searchQuery?: string;
    }
  ): TeamoraNotification[] {
    const prefs = this.getPreferences(orgId);

    return this.notifications
      .filter((n) => n.orgId === orgId)
      .filter((n) => {
        // Preference check
        if (!prefs.taskAlerts && (n.type === 'task_completed' || n.type === 'task_started' || n.type === 'task_failed')) {
          return false;
        }
        if (!prefs.approvalAlerts && n.type === 'agent_approval_needed') {
          return false;
        }
        if (!prefs.securityAlerts && n.type === 'security_alert') {
          return false;
        }
        if (!prefs.inventoryAlerts && n.type === 'inventory_alert') {
          return false;
        }
        return true;
      })
      .filter((n) => {
        if (!filter) return true;
        if (filter.unreadOnly && n.isRead) return false;
        if (filter.priority && n.priority !== filter.priority) return false;

        if (filter.category && filter.category !== 'all') {
          if (filter.category === 'unread') return !n.isRead;
          if (filter.category === 'task') return n.entityType === 'task';
          if (filter.category === 'agent') return n.entityType === 'agent' || n.type === 'agent_action_executed';
          if (filter.category === 'approval') return n.entityType === 'approval' || n.type === 'agent_approval_needed';
        }

        if (filter.searchQuery && filter.searchQuery.trim()) {
          const q = filter.searchQuery.toLowerCase();
          return (
            n.title.toLowerCase().includes(q) ||
            n.message.toLowerCase().includes(q) ||
            n.entityType.toLowerCase().includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get unread count for an organization.
   */
  public getUnreadCount(orgId: string): number {
    return this.getNotifications(orgId, { unreadOnly: true }).length;
  }

  /**
   * Dispatch a new notification with deduplication by eventId.
   */
  public dispatchNotification(
    input: Omit<TeamoraNotification, 'id' | 'createdAt' | 'isRead'> & {
      id?: string;
      createdAt?: string;
      isRead?: boolean;
    }
  ): { success: boolean; notification?: TeamoraNotification; reason?: string } {
    if (input.eventId && this.processedEventIds.has(input.eventId)) {
      return { success: false, reason: 'Duplicate eventId ignored' };
    }

    const newNotif: TeamoraNotification = {
      id: input.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orgId: input.orgId,
      recipientUserId: input.recipientUserId,
      eventId: input.eventId || `evt-${Date.now()}`,
      type: input.type,
      title: input.title,
      message: input.message,
      createdAt: input.createdAt || new Date().toISOString(),
      isRead: input.isRead ?? false,
      priority: input.priority || 'medium',
      entityType: input.entityType || 'system',
      entityId: input.entityId,
      actionUrl: input.actionUrl,
      metadata: input.metadata,
    };

    if (newNotif.eventId) {
      this.processedEventIds.add(newNotif.eventId);
    }

    this.notifications.unshift(newNotif);
    this.saveToStorage();
    this.notifyListeners();

    // Trigger subtle notification chime or browser push if enabled
    this.tryPlayChime(newNotif.orgId);
    this.tryTriggerBrowserNotification(newNotif);

    return { success: true, notification: newNotif };
  }

  /**
   * Mark a single notification as read.
   */
  public markAsRead(notificationId: string, orgId?: string): boolean {
    const item = this.notifications.find((n) => n.id === notificationId && (!orgId || n.orgId === orgId));
    if (item && !item.isRead) {
      item.isRead = true;
      item.readAt = new Date().toISOString();
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Mark all notifications in an organization as read.
   */
  public markAllAsRead(orgId: string): number {
    let count = 0;
    const now = new Date().toISOString();
    this.notifications.forEach((n) => {
      if (n.orgId === orgId && !n.isRead) {
        n.isRead = true;
        n.readAt = now;
        count++;
      }
    });

    if (count > 0) {
      this.saveToStorage();
      this.notifyListeners();
    }
    return count;
  }

  /**
   * Delete a notification by ID.
   */
  public deleteNotification(notificationId: string, orgId?: string): boolean {
    const index = this.notifications.findIndex((n) => n.id === notificationId && (!orgId || n.orgId === orgId));
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Clear all read notifications for an organization to free memory.
   */
  public clearReadHistory(orgId: string): number {
    const initialLen = this.notifications.length;
    this.notifications = this.notifications.filter((n) => !(n.orgId === orgId && n.isRead));
    const removed = initialLen - this.notifications.length;

    if (removed > 0) {
      this.saveToStorage();
      this.notifyListeners();
    }
    return removed;
  }

  /**
   * Get user notification preferences for an org.
   */
  public getPreferences(orgId: string): NotificationPreferences {
    return this.preferences[orgId] || { ...DEFAULT_PREFERENCES };
  }

  /**
   * Update notification preferences.
   */
  public updatePreferences(orgId: string, updates: Partial<NotificationPreferences>): NotificationPreferences {
    const current = this.getPreferences(orgId);
    const updated = { ...current, ...updates };
    this.preferences[orgId] = updated;
    this.saveToStorage();
    this.notifyListeners();
    return updated;
  }

  /**
   * Play subtle low-overhead notification audio via Web Audio API.
   * Completely self-contained; requires zero external audio asset files.
   */
  private tryPlayChime(orgId: string): void {
    const prefs = this.getPreferences(orgId);
    if (!prefs.soundEnabled) return;

    try {
      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        // Gentle two-tone ping: 587.33Hz (D5) -> 880Hz (A5)
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // AudioContext could be blocked by autoplay policies
    }
  }

  /**
   * Request browser Notification permission.
   */
  public async requestBrowserPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  /**
   * Trigger native browser push notification if permitted and document is hidden.
   */
  private tryTriggerBrowserNotification(notif: TeamoraNotification): void {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.visibilityState === 'hidden'
    ) {
      try {
        new Notification(`TEAMORA AI: ${notif.title}`, {
          body: notif.message,
          icon: '/teamora-icon.png',
        });
      } catch {
        // Browser notification failure ignored
      }
    }
  }

  /**
   * Simulation helper for on-demand testing and manual user demonstration.
   */
  public simulateActivity(
    orgId: string,
    type: 'task_completion' | 'approval_needed' | 'agent_action' | 'system_alert'
  ): TeamoraNotification | null {
    const rand = Math.floor(Math.random() * 1000);
    let sample: Omit<TeamoraNotification, 'id' | 'createdAt' | 'isRead'>;

    switch (type) {
      case 'task_completion':
        sample = {
          orgId,
          eventId: `evt-sim-task-${Date.now()}-${rand}`,
          type: 'task_completed',
          title: 'Autonomous Competitor Analysis Generated',
          message: 'Maya Lin synthesized competitive pricing trends across 8 SaaS peers with actionable margin insights.',
          priority: 'medium',
          entityType: 'task',
          actionUrl: 'tasks',
          metadata: { agentId: 'agent-maya' },
        };
        break;
      case 'approval_needed':
        sample = {
          orgId,
          eventId: `evt-sim-appr-${Date.now()}-${rand}`,
          type: 'agent_approval_needed',
          title: 'High-Impact Refund Authorization',
          message: 'Customer Care Agent requested refund approval for Order #TX-9021 ($840). Manager sign-off required.',
          priority: 'urgent',
          entityType: 'approval',
          actionUrl: 'approvals',
          metadata: { amount: 840, orderId: 'TX-9021' },
        };
        break;
      case 'agent_action':
        sample = {
          orgId,
          eventId: `evt-sim-agent-${Date.now()}-${rand}`,
          type: 'agent_action_executed',
          title: 'DevOps Auto-Scaling Triggered',
          message: 'Vikram Patel detected 85% CPU surge on container cluster and dispatched 2 horizontal replicas.',
          priority: 'high',
          entityType: 'agent',
          actionUrl: 'health',
          metadata: { agentId: 'agent-vikram', replicas: 2 },
        };
        break;
      case 'system_alert':
      default:
        sample = {
          orgId,
          eventId: `evt-sim-sys-${Date.now()}-${rand}`,
          type: 'security_alert',
          title: 'Multi-Tenant Sandbox Integrity Verified',
          message: 'Zero tenant cross-contamination detected across 48 concurrent memory buffer partitions.',
          priority: 'low',
          entityType: 'security',
          actionUrl: 'security',
        };
        break;
    }

    const res = this.dispatchNotification(sample);
    return res.notification || null;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
