# UI Specification — Executive Command Center (Phase 231)

**Component Target:** `src/components/views/CommandCenterView.tsx`  
**Route / Tab ID:** `command-center`  
**Navigation Group:** Overview  
**Date:** 2026-11-11  

---

## 1. Purpose & User Journey

The Executive Command Center provides a real-time operational mission control for managing organization priorities, live agent dispatch, pending approvals, and active task queues. 

### User Journey:
1. Executive/Manager arrives at the Command Center to assess daily operations at a glance.
2. Identifies urgent priorities: pending approvals requiring human sign-off, failed or stalled agent tasks, and high-impact project milestones.
3. Takes immediate action: 1-click approvals, rapid agent prompt dispatch, or task reassignment.
4. Reviews live agent telemetry and active execution pipelines without navigating between fragmented screens.

---

## 2. Layout Regions & Wireframe

```
┌────────────────────────────────────────────────────────────────────────┐
│ Header: Operational Pulse · Live Date · Quick Dispatch Prompt           │
├────────────────────────┬───────────────────────────────────────────────┤
│ Active Triage (60%)    │ Live Operational Status (40%)                 │
│ ┌────────────────────┐ │ ┌───────────────────────────────────────────┐ │
│ │ Urgent Actions Deck│ │ │ 15-Agent Fleet Runtime Matrix             │ │
│ │ - Pending Sign-offs│ │ │ - Atlas (Orchestrating) · Ledger (Idle)    │ │
│ │ - Critical Tasks   │ │ │ - Pulse (Analyzing) · Echo (Standby)      │ │
│ └────────────────────┘ │ └───────────────────────────────────────────┘ │
│ ┌────────────────────┐ │ ┌───────────────────────────────────────────┐ │
│ │ Today's Execution  │ │ │ Project Health & Milestone Trajectory     │ │
│ │ Pipeline Stream    │ │ │ - Q4 Product Launch (82% · On Track)      │ │
│ │ (Live task steps)  │ │ │ - Cloud Migration (45% · In Progress)     │ │
│ └────────────────────┘ │ └───────────────────────────────────────────┘ │
└────────────────────────┴───────────────────────────────────────────────┘
```

---

## 3. Design Tokens & Anti-Slop Guidelines
- **Canvas:** `#F5F1E9` (Light) / `#181320` (Dark)
- **Surfaces:** `#FFFEFC` (Light) / `#2C2438` (Dark) with hairline border `#E2DBD0` / `#382F47`.
- **Accents:** Muted Lavender (`#8B5CF6`), Electric Lime (`#C7F36B` for active runs), Soft Coral (`#FF806E` for urgent blocks).
- **Tabular Figures:** `font-mono tabular-nums` for all execution times, task counts, and completion percentages.
- **Zero-Pill Metadata:** Task categories and agent names rendered with typographic separators (`Atlas · Strategic Planning · 2.4s`).
