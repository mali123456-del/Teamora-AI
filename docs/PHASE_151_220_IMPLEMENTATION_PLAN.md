# TEAMORA AI — Phases 151–220 Implementation Plan

**Product:** TEAMORA AI — Your AI Team. One Smart Workspace  
**GitHub Repository:** https://github.com/mali123456-del/Teamora-AI  
**Audited Checkpoint:** Phases 1–150 Complete (53/53 Vitest Tests Passing, TypeScript Lint 0 Errors)  
**Target Architecture:** Vite + React + TypeScript + Express Backend + Three.js + IndexedDB + Firebase Firestore  
**Hardware Profile:** Dell Latitude 3340 (Intel Core i5-4200U, 8 GB RAM, Intel HD Graphics, Port 3000)  
**Date:** 2026-11-10  

---

## 1. Executive Summary & Strategy

Phases 151–220 elevate TEAMORA AI from an advanced agent execution platform to a commercially resilient, production-ready enterprise SaaS. The core focus areas are:
- **Phases 151–160:** Persistent Notification Center (Architecture, Header Bell, reactive event dispatch, read management, offline persistence, and user preferences).
- **Phases 161–170:** Platform Reliability & Observability (Distributed tracing with correlation IDs, circuit breakers, centralized telemetry, and rate-limit guardrails).
- **Phases 171–180:** Advanced AI Governance & Guardrails (Prompt injection defense, output validation schemas, agent sandboxing, and execution benchmarking).
- **Phases 181–190:** Enterprise Automation & Webhooks (Secure outbound webhooks, HMAC signatures, automation scheduling, and workflow dry-runs).
- **Phases 191–200:** Commercial SaaS Intelligence & Entitlements (Plan limit enforcement, usage metering, seats, and dual-currency billing reconciliations).
- **Phases 201–210:** Unified Business & Document Intelligence (Universal fuzzy search, custom report generator, document chunk query interface).
- **Phases 211–220:** Production Release Hardening, WCAG 2.2 AA Accessibility, PWA Compliance & Master Audit.

---

## 2. Phase 151–160 Detailed Technical Specifications

### Phase 151: Notification Service Architecture
- **Service:** `src/lib/notificationService.ts`
- **Data Model:** `TeamoraNotification`
  - `id`: unique string ID (`notif-{timestamp}-{random}`)
  - `orgId`: multi-tenant tenant isolation
  - `recipientUserId`?: target user ID or empty for org broadcast
  - `eventId`: unique idempotency key for deduplicating repeated system events
  - `type`: `task_started` | `task_completed` | `task_failed` | `agent_approval_needed` | `agent_action_executed` | `rag_indexed` | `sync_status` | `security_alert` | `system`
  - `title`: human-readable headline
  - `message`: concise detail string
  - `createdAt`: ISO 8601 timestamp
  - `readAt`?: ISO 8601 timestamp when user acknowledged
  - `isRead`: boolean read status
  - `priority`: `low` | `medium` | `high` | `urgent`
  - `entityType`: `task` | `agent` | `approval` | `pipeline` | `system`
  - `entityId`?: referenced ID
  - `actionUrl`?: target navigation tab/route (e.g. `tasks`, `approvals`, `agents`, `security`)
  - `metadata`?: contextual details
- **Preferences:** `NotificationPreferences`
  - `soundEnabled`: boolean
  - `taskAlerts`: boolean
  - `agentAlerts`: boolean
  - `approvalAlerts`: boolean
  - `securityAlerts`: boolean
  - `minPriority`: `low` | `medium` | `high` | `urgent`
  - `browserPushEnabled`: boolean

### Phase 152: Header Notification Bell & Feed
- **Component:** `src/components/layout/Header.tsx` & `src/components/common/NotificationBell.tsx`
- **Design Philosophy:**
  - Zero-pill metadata: timeagos and categories formatted cleanly with typographic separators (`·`).
  - Strict Top Bar Contract: Bell sits cleanly in the tools zone adjacent to Mic and Approvals.
  - Tabular numerals for timestamps and badges (`tabular-nums font-mono`).
  - Accessible dropdown with outside click handling, ESC key dismissal, and filter tabs (`All`, `Unread`, `Tasks`, `Agents`, `Approvals`).
  - Interactive actions: Mark individual as read, Mark all as read, Delete notification, Clear read history, and 1-click tab routing.
  - Simulation toolbar to test realistic alerts on-demand.

### Phase 153–158: Integration with App State & Offline Engine
- Hook into `src/context/AppContext.tsx`:
  - When a task is marked `completed` or `failed`, dispatch a task notification.
  - When an approval is required, dispatch an urgent approval alert.
  - When sync status transitions from offline to online, dispatch a sync alert.
- Persist notifications in LocalStorage/IndexedDB with fallback seed data for `org-apex` and `org-crescent`.

### Phase 159–160: Documentation & Test Matrix
- `docs/NOTIFICATION_CENTER.md`: Architectural documentation, lifecycle diagram, and API reference.
- Vitest tests covering deduplication, organization isolation, read management, preference enforcement, and state subscriptions.
