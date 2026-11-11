# TEAMORA AI — Notification Center Architecture & Specification

**Module:** `src/lib/notificationService.ts` & `src/components/common/NotificationBell.tsx`  
**Checkpoint:** Phase 151–160 Complete  
**Standards:** Zero-Pill Discipline, Tabular Numerals, Multi-Tenant Scoping, Offline Persistence, Audio Chime via Web Audio API  

---

## 1. Architectural Overview

The TEAMORA Notification Center provides real-time and offline-cached activity alerts across the entire autonomous workforce ecosystem. It connects task creation, execution completion, high-impact approval requests, RAG vector indexing, cryptographic security alerts, and inventory stock thresholds into a unified, accessible feed.

```
┌────────────────────────────────────────────────────────┐
│               Lifecycle Event Producers                │
│  - Agent Execution Engine (Task Started/Done/Failed)   │
│  - Approval Center (Sign-off Needed / Executed)        │
│  - RAG Studio (Vector Indexing Complete)               │
│  - Security Engine (SHA-256 Audit Log Verification)    │
│  - Inventory Manager (Low-Stock Threshold Breach)      │
└──────────────────────────┬─────────────────────────────┘
                           │ dispatchNotification()
                           ▼
┌────────────────────────────────────────────────────────┐
│             NotificationService Singleton              │
│  - Idempotency & Event Deduplication (eventId cache)   │
│  - Multi-Tenant Isolation (orgId partition)            │
│  - User Preferences Filtering (Mutes / Priorities)     │
│  - Storage Persistence (LocalStorage / IndexedDB)      │
│  - Web Audio Ping (587Hz -> 880Hz synthesized chime)   │
│  - Native Web Notification API (background tabs)       │
└──────────────────────────┬─────────────────────────────┘
                           │ subscribe()
                           ▼
┌────────────────────────────────────────────────────────┐
│             Header Notification Bell (UI)              │
│  - Persistent Bell with Live Unread Badge              │
│  - Interactive Filter Tabs (All, Unread, Tasks, ...)   │
│  - 1-Click Navigation to Target Tabs                   │
│  - Inline Mark-As-Read, Delete, & Clear History        │
│  - On-Demand Event Simulator for Demonstrations        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Core Data Models

### `TeamoraNotification`
```typescript
export interface TeamoraNotification {
  id: string;                      // Unique notification identifier
  orgId: string;                   // Multi-tenant organization scoping
  recipientUserId?: string;        // Optional user recipient target
  eventId: string;                 // Deduplication idempotency key
  type: NotificationType;          // Specific lifecycle trigger
  title: string;                   // Human-readable headline
  message: string;                 // Body prose describing outcome
  createdAt: string;               // ISO 8601 creation timestamp
  readAt?: string;                 // ISO 8601 read timestamp
  isRead: boolean;                 // Read state boolean
  priority: 'low' | 'medium' | 'high' | 'urgent';
  entityType: 'task' | 'agent' | 'approval' | 'pipeline' | 'inventory' | 'finance' | 'security' | 'system';
  entityId?: string;               // Target entity ID
  actionUrl?: string;              // Target workspace navigation tab
  metadata?: Record<string, any>;  // Structured execution context
}
```

### `NotificationPreferences`
```typescript
export interface NotificationPreferences {
  soundEnabled: boolean;       // Enable/disable Web Audio synthesis
  taskAlerts: boolean;         // Task lifecycle updates
  agentAlerts: boolean;        // Agent actions & pipeline stages
  approvalAlerts: boolean;     // Managerial sign-off requests
  securityAlerts: boolean;     // Cryptographic log alerts
  inventoryAlerts: boolean;    // Stock threshold breaches
  minPriority: NotificationPriority; // Minimum severity threshold
  browserPushEnabled: boolean; // Native Web Notification API
}
```

---

## 3. Guarantees & Non-Negotiable Standards

1. **Strict Multi-Tenant Scoping:**
   `getNotifications(orgId)` and `getUnreadCount(orgId)` strictly filter items by `orgId`. A user switching from `org-apex` to `org-crescent` sees zero notification leakage across organizational boundaries.

2. **Idempotency & Deduplication:**
   Every event carries an `eventId` (e.g. `evt-task-done-${taskId}`). If repeated retries or offline sync bursts attempt to re-dispatch the same event, the service discards duplicate events immediately.

3. **Zero-Pill Visual Discipline:**
   Metadata (relative time, entity category, priority) is rendered as clean unboxed text separated by typographic middots (`·`). No candy badges or static pills are rendered in the feed.

4. **Zero Layout Jitter with Tabular Figures:**
   Timestamps (`12m ago`), badge counts, and item statistics utilize `font-mono tabular-nums` to guarantee strict character width alignment.

5. **Self-Contained Audio Synthesis:**
   Notification audio is synthesized on-the-fly using the Web Audio API (sine oscillator ramp from D5 587.33Hz to A5 880Hz). No external MP3/WAV assets are downloaded or loaded across the network, reducing memory and avoiding 404 network errors.

6. **1-Click Workspace Navigation:**
   Clicking any notification item marks it as read, switches the active workspace tab to the target view (`tasks`, `approvals`, `finance`, `inventory`, `rag-studio`, `security`), and closes the dropdown smoothly.
