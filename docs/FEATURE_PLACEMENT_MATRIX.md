# TEAMORA AI — Feature Placement Matrix

**Product:** TEAMORA AI — Your AI Team. One Smart Workspace  
**Status:** Canonical Single Source of Truth for Feature Placement  
**Date:** 2026-11-10  

---

## 1. Feature Placement Matrix Table

### 1. Main Dashboard
- **User Problem Solved:** Lack of executive visibility into cross-departmental operations and AI workforce metrics.
- **Target User:** Executive, Manager, Team Member.
- **Primary Navigation Group:** Workforce Core.
- **Exact Page / Panel:** `src/components/views/MainDashboard.tsx` (`dashboard`).
- **Placement:** Workspace viewport with top KPI strip and activity feed.
- **UI Layout:** 4-column metric cards row, 2-column split (active tasks vs workforce status), recent approvals feed.
- **Light Theme Appearance:** `#F5F1E9` background, `#FFFEFC` cards with `#E2DBD0` hairline border.
- **Dark Theme Appearance:** `#181320` background, `#2C2438` cards with `#382F47` hairline border.
- **Mobile Behavior:** Stacks into a single column; bottom navigation bar for quick access.
- **Main User Actions:** View MRR and task counts, trigger quick agent actions, click into detail views.
- **Backend Service:** `AppContext`, Firestore listeners.
- **Database Collections:** `organizations/{orgId}/tasks`, `invoices`, `approvals`.
- **API Endpoints:** `GET /api/agent/task/list`.
- **AI Employee Connection:** Atlas (`workforce-manager`).
- **Required Permissions:** Viewer, Member, Manager, Admin, Owner.
- **Human Approval Requirements:** None for viewing.
- **Test Cases:** `TEST-DASH-01` (KPI calculation), `TEST-DASH-02` (Currency toggle).
- **Implementation Status:** Verified & Live.

---

### 2. 15 Canonical AI Employees Directory
- **User Problem Solved:** Difficulty discovering and selecting the right AI agent for specific enterprise tasks.
- **Target User:** All team members.
- **Primary Navigation Group:** Workforce Core.
- **Exact Page / Panel:** `src/components/views/WorkforceDirectory.tsx` (`workforce`).
- **Placement:** Workspace viewport with department filter tabs.
- **UI Layout:** Grid of 15 agent cards with department badges, role descriptions, and "Assign Task" buttons.
- **Light Theme Appearance:** `#FFFEFC` cards, `#8B5CF6` primary CTA, `#211B2C` text.
- **Dark Theme Appearance:** `#2C2438` cards, `#C7F36B` accents, `#F5F1E9` text.
- **Mobile Behavior:** 1-column responsive scroll with sticky department filter bar.
- **Main User Actions:** Filter by department, inspect agent tools, click to launch agent workspace.
- **Backend Service:** `src/data/agents.ts`, `server/agentExecutionEngine.ts`.
- **Database Collections:** Static canonical employee configuration + tenant run history.
- **API Endpoints:** `GET /api/agents`.
- **AI Employee Connection:** All 15 Canonical Employees (Atlas, Echo, Vanguard, Pulse, Ledger, Prism, Stockwell, Nexus, Scout, Harmony, Quill, Courier, Chronos, Scribe, Synapse).
- **Required Permissions:** Member, Manager, Admin, Owner.
- **Human Approval Requirements:** None for browsing.
- **Test Cases:** `TEST-WORKFORCE-01` (15 canonical IDs present), `TEST-WORKFORCE-02` (Synonyms mapping).
- **Implementation Status:** Verified & Live.

---

### 3. Agent Focus Workspace
- **User Problem Solved:** Need a focused interface to collaborate with a single specialized AI employee with memory context.
- **Target User:** Specialist, Manager.
- **Primary Navigation Group:** Workforce Core.
- **Exact Page / Panel:** `src/components/views/AgentWorkspace.tsx` (`agent-workspace`).
- **Placement:** Full workspace viewport with agent header bar, execution timeline, and prompt input box.
- **UI Layout:** Split layout: Left column agent profile and tool list; Right column live interaction timeline.
- **Light Theme Appearance:** White message cards, lavender user prompts, hairline borders.
- **Dark Theme Appearance:** Deep ink message cards, lavender user prompts, subtle contrast scrim.
- **Mobile Behavior:** Stacked layout with collapsible tool drawer.
- **Main User Actions:** Dispatch custom prompt, view tool call execution, approve generated drafts.
- **Backend Service:** `server/geminiHandler.ts`, `server/agentExecutionEngine.ts`.
- **Database Collections:** `organizations/{orgId}/tasks`, `organizations/{orgId}/agent_memories`.
- **API Endpoints:** `POST /api/agent/task/execute`.
- **AI Employee Connection:** Selected agent (`selectedAgentId`).
- **Required Permissions:** Member, Manager, Admin, Owner.
- **Human Approval Requirements:** Triggered on sensitive keywords (refund, payout, contract sign).
- **Test Cases:** `TEST-AGENT-EXEC-01` (Tool schema execution), `TEST-AGENT-EXEC-02` (Approval requirement).
- **Implementation Status:** Verified & Live.

---

### 4. 3D Neural Core Orchestrator
- **User Problem Solved:** Lack of intuitive spatial comprehension of how multi-agent pipelines collaborate and exchange context.
- **Target User:** Executive, Architect, Operator.
- **Primary Navigation Group:** Workforce Core.
- **Exact Page / Panel:** `src/components/views/OrchestrationCenter.tsx` (`orchestrator`).
- **Placement:** Fullscreen canvas viewport with collapsible bottom control dock ($\le 15\%$ viewport height).
- **UI Layout:** WebGL Three.js interactive canvas with 6 physical concentric layers and 15 orbital agent nodes.
- **Light Theme Appearance:** Titanium graphite core with warm ivory ambient reflections.
- **Dark Theme Appearance:** Titanium graphite core with muted lavender emissive node glow.
- **Mobile Behavior:** Automatically renders 2D SVG fallback to prevent GPU throttling on mobile.
- **Main User Actions:** Rotate camera, click agent node, toggle ECO/STANDARD/HIGH modes, launch multi-agent pipeline.
- **Backend Service:** `src/components/three/TeamoraWorkforceCanvas.tsx`.
- **Database Collections:** N/A (Client Three.js rendering).
- **API Endpoints:** `POST /api/orchestrate`.
- **AI Employee Connection:** Atlas (`workforce-manager`) coordinating all nodes.
- **Required Permissions:** Viewer, Member, Manager, Admin, Owner.
- **Human Approval Requirements:** None for visualization.
- **Test Cases:** `TEST-3D-01` (Disposal on unmount), `TEST-3D-02` (Software WebGL detection).
- **Implementation Status:** Verified & Live.

---

### 5. Safe Approvals Gate
- **User Problem Solved:** Autonomous agents executing irreversible real-world actions (payments, refunds, contract dispatches) without human supervision.
- **Target User:** Manager, Admin, Owner.
- **Primary Navigation Group:** Workforce Core.
- **Exact Page / Panel:** `src/components/views/ApprovalsCenter.tsx` (`approvals`).
- **Placement:** Workspace viewport + Persistent Header alert badge.
- **UI Layout:** Card list of pending approvals with risk impact banners, consequence disclosures, and payload inspectors.
- **Light Theme Appearance:** Soft coral (`#FF806E`) alert badges, white inspection cards.
- **Dark Theme Appearance:** Soft coral (`#FF806E`) alert badges, deep ink inspection cards.
- **Mobile Behavior:** Full-width swipeable decision cards.
- **Main User Actions:** Review consequence analysis, click "Approve & Execute" or "Reject & Abort".
- **Backend Service:** `server/geminiHandler.ts`, `server/agentExecutionEngine.ts`.
- **Database Collections:** `organizations/{orgId}/approvals`.
- **API Endpoints:** `POST /api/approval/execute`.
- **AI Employee Connection:** Ledger (Refunds/Payouts), Scribe (Contracts), Echo (Customer credits).
- **Required Permissions:** Manager, Admin, Owner.
- **Human Approval Requirements:** Two-stage architectural gate: Review approval $\rightarrow$ Server-side cryptographic receipt execution.
- **Test Cases:** `TEST-APPR-01` (Decoupled execution), `TEST-APPR-02` (Cryptographic receipt verification).
- **Implementation Status:** Verified & Live.

---

### 6. Persistent Notification Center
- **User Problem Solved:** Missed task completions, approval requests, and inventory alerts when navigating across modules.
- **Target User:** All users.
- **Primary Navigation Group:** Persistent Shell Header.
- **Exact Page / Panel:** `src/components/common/NotificationBell.tsx` mounted in `Header.tsx`.
- **Placement:** Top Header adjacent to Voice trigger and Approvals badge.
- **UI Layout:** Bell icon with unread badge $\rightarrow$ Accessible dropdown feed with category tabs, sound preferences, and 1-click routing.
- **Light Theme Appearance:** `#FFFEFC` dropdown with `#8B5CF6` unread accents and unboxed zero-pill metadata.
- **Dark Theme Appearance:** `#2C2438` dropdown with `#A78BFA` unread accents and unboxed zero-pill metadata.
- **Mobile Behavior:** Dropdown adapts to full-width sheet on small screens with dismiss button.
- **Main User Actions:** Filter by category (Task, Agent, Approval), mark as read, delete alert, clear history, toggle chime.
- **Backend Service:** `src/lib/notificationService.ts`.
- **Database Collections:** LocalStorage / IndexedDB cache + Firestore sync.
- **API Endpoints:** Internal event bus subscription.
- **AI Employee Connection:** Event producers across all 15 agents.
- **Required Permissions:** All authenticated and demo users.
- **Human Approval Requirements:** None.
- **Test Cases:** `TEST-NOTIF-01` to `TEST-NOTIF-12` (71 Vitest tests passing).
- **Implementation Status:** Verified & Live.

---

### 7. RAG Studio & Autonomous Web Crawler
- **User Problem Solved:** Ingesting external URLs, documentation, and corporate policies into isolated vector storage with source attribution.
- **Target User:** Knowledge Manager, Operations Lead, Developer.
- **Primary Navigation Group:** Business Operations.
- **Exact Page / Panel:** `src/components/views/RagStudioView.tsx` (`rag-studio`).
- **Placement:** Workspace viewport with Crawler Console and Vector Retrieval Inspector.
- **UI Layout:** Split layout: Left column crawler URL input and robots.txt tester; Right column live semantic chunk inspector.
- **Light Theme Appearance:** Clean travertine surfaces, monospace chunk displays, green status badges.
- **Dark Theme Appearance:** Deep slate surfaces, monospace chunk displays, lime status badges.
- **Mobile Behavior:** Stacked columns with horizontal tab switching.
- **Main User Actions:** Crawl website URL, inspect sanitized text, ingest chunks into vector store, query semantic similarity.
- **Backend Service:** `server/ragEngine.ts`, `server/crawlerEngine.ts`.
- **Database Collections:** `organizations/{orgId}/rag_chunks`.
- **API Endpoints:** `POST /api/rag/crawl`, `POST /api/rag/query`, `POST /api/rag/ingest`.
- **AI Employee Connection:** Scout (`research-agent`), Scribe (`legal-agent`).
- **Required Permissions:** Admin, Owner.
- **Human Approval Requirements:** SSRF protection blocks private IPv4 (RFC1918) automatically.
- **Test Cases:** `TEST-RAG-01` (Chunk overlap), `TEST-RAG-02` (Hybrid search), `TEST-SSRF-01` (Private IP blocking).
- **Implementation Status:** Verified & Live.

---

### 8. System Health & Observability Console
- **User Problem Solved:** Operating blind regarding memory consumption, API rate limits, circuit breaker states, and tamper logs.
- **Target User:** Developer, Admin, Owner.
- **Primary Navigation Group:** Platform & Governance.
- **Exact Page / Panel:** `src/components/views/SystemHealthView.tsx` (`health`).
- **Placement:** Workspace viewport.
- **UI Layout:** Metric telemetry cards (RAM RSS < 95MB, FPS, Circuit State), Cryptographic Audit Chain validator, Agent Matrix.
- **Light Theme Appearance:** Monospace tabular figures, clean hairline dividers, green/amber status indicators.
- **Dark Theme Appearance:** Dark metallic casing, lime telemetry counters, green/amber status indicators.
- **Mobile Behavior:** Single-column card stack.
- **Main User Actions:** Run live cryptographic audit check, inspect memory ceiling, toggle circuit breaker state.
- **Backend Service:** `server/circuitBreaker.ts`, `server/security.ts`.
- **Database Collections:** `organizations/{orgId}/audit_logs`.
- **API Endpoints:** `GET /api/security/audit`, `GET /api/system/health`.
- **AI Employee Connection:** Nexus (`operations-agent`).
- **Required Permissions:** Admin, Owner.
- **Human Approval Requirements:** None.
- **Test Cases:** `TEST-CIRCUIT-01` (Fail-fast), `TEST-AUDIT-01` (SHA-256 chain validation).
- **Implementation Status:** Verified & Live.

---

### 9. AI Model Benchmarking & Optimization Lab
- **User Problem Solved:** Blind selection of models without empirical proof of accuracy, speed, cost, Urdu fluency, or tool-calling reliability.
- **Target User:** AI Engineer, Architect, Manager, Owner.
- **Primary Navigation Group:** Governance & Growth.
- **Exact Page / Panel:** `src/components/views/BenchmarkingLabView.tsx` (`benchmarks`).
- **Placement:** Workspace viewport with top metric ribbon and domain tabs.
- **UI Layout:** 5-column metric strip, 7 sub-tabs (Leaderboard, Model Registry, Task Leaderboards, 15 Employees Matrix, Error Analysis, Tuning, Datasets).
- **Light Theme Appearance:** `#F5F1E9` background, `#FFFEFC` cards, hairline `#E2DBD0` borders, `#8B5CF6` accents.
- **Dark Theme Appearance:** `#181320` background, `#211B2C` cards, hairline `#382F47` borders, `#C7F36B` accents.
- **Mobile Behavior:** Horizontal tab scroll, responsive card grid with stacked metrics.
- **Main User Actions:** Execute Pilot and Full Suite benchmarks, compare models, inspect error taxonomy, review and apply employee-model assignments.
- **Backend Service:** `server/benchmarkRunner.ts`, `server/benchmarkDataset.ts`.
- **Database Collections:** `organizations/{orgId}/benchmark_runs`, `model_registry`.
- **API Endpoints:** `GET /api/benchmarks/registry`, `GET /api/benchmarks/datasets`, `POST /api/benchmarks/run`, `GET /api/benchmarks/history`, `GET /api/benchmarks/recommendations`.
- **AI Employee Connection:** All 15 Canonical Employees (Evaluated for optimal compatibility).
- **Required Permissions:** Admin, Owner, Manager.
- **Human Approval Requirements:** Production model reassignment requires human confirmation before saving.
- **Test Cases:** `TEST-BENCH-01` (Registry metadata), `TEST-BENCH-02` (Dataset 8-domain coverage), `TEST-BENCH-03` (Scoring math), `TEST-BENCH-04` (Courier fast-tier assignment).
- **Implementation Status:** Verified & Live.

