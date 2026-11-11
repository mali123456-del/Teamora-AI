# TEAMORA AI — UX Information Architecture

**Product:** TEAMORA AI — Your AI Team. One Smart Workspace  
**Information Architecture Standard:** Material Design 3, WCAG 2.2 AA, Adaptive Responsive Navigation  
**Hardware Profile:** Dell Latitude 3340 (Intel HD Graphics, Port 3000)  
**Date:** 2026-11-10  

---

## 1. Information Architecture Philosophy

TEAMORA AI coordinates 15 specialized autonomous AI employees across complex business operations, intelligence, and platform governance. The Information Architecture guarantees:
1. **Zero Feature Bloat & Zero Duplicate Panels:** Every destination serves a distinct, non-overlapping workflow.
2. **Contextual Adjacency:** High-frequency tasks (Task Center, Approvals Gate, Command Center) are accessible within 1 click.
3. **Strict Top Bar Contract:** The Header remains concise (Brand wordmark, Workspace Switcher, Global Tools, User Profile) without cramming multi-row tabs.
4. **Adaptive Navigation Rail:** Responsive collapse on tablet/mobile screens while maintaining persistent status counters.

---

## 2. Navigation Hierarchy & Route Groupings

```
TEAMORA AI WORKSPACE SHELL
├── TOP HEADER (Persistent)
│   ├── Left Zone: Brand Wordmark · Workspace Selector (`currentOrg`) · Breadcrumbs
│   └── Right Zone: Voice Mic · Notification Bell · Approvals Badge · Currency (USD/PKR) · Lang (EN/اردو) · Theme · Profile
│
├── NAVIGATION SIDEBAR (Collapsible & Responsive)
│   ├── [SECTION 1: WORKFORCE CORE]
│   │   ├── `dashboard`     → Main Dashboard (Live KPIs, Quick Actions, Active Agents)
│   │   ├── `workforce`     → 15 AI Employees (Canonical Directory, Role Cards, Skill Tags)
│   │   ├── `agent-workspace` → Agent Workspace (Individual Employee Focus, Run History, Prompt Chat)
│   │   ├── `orchestrator`  → Orchestrator 3D (Interactive Three.js Neural Core & Workforce Canvas)
│   │   ├── `tasks`         → Task Center (Persistent Task Queues, Status Lifecycle, Results)
│   │   └── `approvals`     → Approvals Gate (Safe Execution Gate for High-Risk Actions)
│   │
│   ├── [SECTION 2: BUSINESS OPERATIONS]
│   │   ├── `crm`           → CRM & Leads (Customer Pipeline: Lead, Prospect, Customer, Churned)
│   │   ├── `inventory`     → Inventory & SKUs (Stock Quantities, Thresholds, Reorder Triggers)
│   │   ├── `finance`       → Invoices & Expenses (Dual-Currency USD/PKR, Status Transitions)
│   │   ├── `projects`      → Projects & Kanban (Agile Milestone Tracking, Agent Assignees)
│   │   ├── `knowledge`     → Knowledge Hub (Corporate Documents, SOPs, Contracts, Tags)
│   │   ├── `rag-studio`    → RAG Studio & Crawler (Autonomous Web Ingestion, BM25 Vector Search)
│   │   └── `automation`    → Automation Studio (Trigger-Condition-Action Visual Workflows)
│   │
│   └── [SECTION 3: PLATFORM & GOVERNANCE]
│       ├── `analytics`     → Analytics & Insights (MRR, Agent Utilization, Execution Timelines)
│       ├── `health`        → System Health & Metrics (RAM Footprint, FPS, Circuit Headroom, Audit Chain)
│       ├── `team`          → Team & Permissions (Multi-Tenant RBAC: Owner, Admin, Manager, Member, Viewer)
│       ├── `integrations`  → Integrations & Keep (Google Workspace, External Webhooks, Keep Verifier)
│       ├── `subscriptions` → Subscription & Plans (Free, Starter, Pro, Business, Enterprise)
│       └── `security`      → Security & Audit Logs (SHA-256 Tamper-Evident Chained Cryptographic Logs)
│
└── CONTENT VIEWPORT (Bounded Container, Single-Elevation Depth, Error Boundary Isolated)
```

---

## 3. Top Bar Architecture Contract

The Top Bar follows a strict single-row layout across all resolutions:

$$\text{[Brand Logo + Org Switcher]} \quad\longleftrightarrow\quad \text{[Voice Assistant + Notification Center + Approvals + Locale + Theme + User Profile]}$$

- **Left Zone:**
  - `TeamoraLogo` (navigates to dashboard or public landing).
  - Workspace Switcher dropdown (displays active organization, tier badge, currency, and create organization modal).
- **Right Zone:**
  - Offline/Online connectivity badge (IndexedDB synchronization indicator).
  - Voice Command Assistant trigger (`Mic` icon).
  - Notification Center Bell (`Bell` icon with live unread badge, filterable feed, audio chime toggle).
  - Pending Approvals gate badge (`ShieldAlert` with bounce indicator when pending $> 0$).
  - Currency switcher segmented toggle (`USD` / `PKR`).
  - Language switcher (`EN` / `اردو` with automatic RTL layout flip).
  - Theme toggle (`Sun` / `Moon`).
  - User Authentication state (Google Sign-In, Verified avatar, or Demo Sandbox toggle).

---

## 4. Responsive Viewport Adaptations

### A. Desktop Viewport ($\ge 1024\text{px}$)
- Persistent Sidebar ($256\text{px}$ width) with section headers and badge chips.
- Main content area expands with auto-scrolling container and max width bounds ($1440\text{px}$).
- Three.js Neural Core renders full 6-layer scene in STANDARD or HIGH mode based on detected GPU.

### B. Tablet Viewport ($768\text{px} - 1023\text{px}$)
- Sidebar collapses into an icon-only navigation rail or toggles via a drawer.
- High-density grids gracefully wrap from 4 columns to 2 columns.
- Three.js Neural Core throttles render rate to 30 FPS to preserve battery and memory.

### C. Mobile Viewport ($< 768\text{px}$)
- Persistent compact Header ($56\text{px}$ height).
- Sidebar hidden inside accessible slide-over drawer triggered by hamburger menu.
- Bottom navigation bar anchors 4 primary destinations: Dashboard, Tasks, Workforce, Approvals.
- Sticky overlays capped at $\le 15\%$ of mobile viewport height.
- Three.js Neural Core renders static 2D high-fidelity SVG/Canvas fallback to preserve CPU and RAM.
