# TEAMORA AI — Your AI Team. One Smart Workspace.

A premium, modern, multi-tenant AI Workforce & Business Automation SaaS platform.

![TEAMORA AI](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80)

---

## 1. Overview

**TEAMORA AI** unifies 15 specialized autonomous AI employees into an orchestrated, enterprise-grade business workspace. Unlike generic AI chatbots, TEAMORA AI provides a coordinated workforce with distinct departmental responsibilities, tools, and human-in-the-loop safety gates.

- **Unique Visual Identity:** Warm Ivory (`#F5F1E9`), Deep Ink (`#211B2C`), Muted Lavender (`#8B5CF6`), Electric Lime (`#C7F36B`), Soft Coral (`#FF806E`). Zero generic blue gradients or boilerplate AI templates.
- **Original Logo:** Architectural letter **T** integrated with connected team nodes.
- **Multilingual & Dual-Currency:** Full English and Urdu (`اردو`, true `dir="rtl"`) layout adaptation; dual USD (`$`) and Pakistani Rupee (`₨` PKR) currency formatting.
- **3D Neural Core Workforce:** Six-layer industrial-futuristic computing core with 15 real-time agent nodes in dual concentric tiers, studio PBR environment lighting, and adaptive ECO/STANDARD/HIGH modes optimized for integrated graphics (Dell Latitude 3340 / Intel HD graphics).
- **Enterprise RAG Engine (Phases 81–94):** Hybrid vector cosine similarity and BM25 keyword retrieval, smart semantic chunking with sliding window overlap, exact source citation attribution, and organization-isolated vector stores.
- **Autonomous Web Crawler (Phases 95–106):** SSRF-hardened web crawler blocking RFC1918 private IPs, parsing robots.txt rules, sanitizing HTML, and directly ingesting web content into the tenant RAG vault.
- **Real AI Workforce Runtime (Phases 121–135):** 15 specialized agents with typed Zod tool schemas, multi-agent dependency pipeline orchestration, and cryptographic execution receipts.
- **Two-Stage Human Safety Gate:** Mandatory policy sign-off followed by server-side physical execution with verifiable cryptographic receipts and tamper-evident SHA-256 chained audit logs.
- **Voice Intelligence (Phases 61–65):** Web Speech API with lazy initialization, cross-browser permission error resilience, rapid-click protection, allowlist navigation, and bilingual task drafting.
- **Offline Synchronization (Phases 66–68):** IndexedDB local cache with deterministic idempotency keys (`idemp-task-${taskId}`), automatic retry backoff, and version conflict resolution.
- **System Health Center (Phases 113, 146–148):** Real-time hardware budget telemetry (memory, FPS, rate limit headroom), live audit log chain integrity validator, and 15-agent runtime matrix.

---

## 2. The 15 Autonomous AI Employees

1. **Atlas** (`workforce-manager`) — Chief Orchestrator & Workforce Manager (Leadership & Strategy)
2. **Echo** (`support-agent`) — Customer Support Lead (Customer Experience)
3. **Vanguard** (`sales-agent`) — Enterprise Sales & Revenue Agent (Revenue Operations)
4. **Pulse** (`marketing-agent`) — Growth Marketing & Campaign Strategist (Revenue Operations)
5. **Ledger** (`finance-agent`) — Finance & Compliance Specialist (Finance & Treasury)
6. **Prism** (`analytics-agent`) — Business Intelligence & Data Scientist (Intelligence & Data)
7. **Stockwell** (`inventory-agent`) — Supply Chain & Inventory Controller (Operations)
8. **Nexus** (`operations-agent`) — Operations & Process Optimization Lead (Operations)
9. **Scout** (`research-agent`) — Market Intelligence & Research Agent (with Google Search Grounding)
10. **Harmony** (`hr-agent`) — People Operations & Talent Manager (Human Resources)
11. **Quill** (`content-agent`) — Editorial & Brand Voice Director (Content & Communications)
12. **Courier** (`email-agent`) — Communications & Inbox Dispatcher (Outbound Email)
13. **Chronos** (`project-manager`) — Agile Project & Sprint Director (Project Management)
14. **Scribe** (`document-agent`) — Document Intelligence & Knowledge Architect (Knowledge Systems)
15. **Synapse** (`workflow-agent`) — Autonomous Workflow & Integration Engineer (Automation Studio)

---

## 3. Architecture & Security Invariants

- **Zero Client Secret Leakage:** `@google/genai` is only accessed server-side in `server/geminiHandler.ts`. `GEMINI_API_KEY` is never exposed in browser bundles.
- **Sliding-Window Rate Limiting:** Enforces max 60 req/min per IP to prevent Denial-of-Wallet attacks.
- **Multi-Tier Resilience:** Primary `gemini-3.8-flash` automatically cascades to `gemini-3.1-flash-lite` on quota spikes or high demand.
- **Two-Stage Safe Approvals:** Decoupled `pending` -> `approved` -> `executing` -> `executed` pipeline prevents premature task completion.
- **Multi-Tenant Firestore Isolation:** Strict Zero-Trust ABAC rules in `firestore.rules` protect organization data.
- **Durable Idempotency:** Deterministic keys bound to logical operations (`idemp-task-${taskId}`) prevent duplicate task execution across network retries.
- **Tamper-Evident Chained Audit Logging:** SHA-256 hash chains detect any unauthorized modification of sensitive logs.

---

## 4. Documentation Suite

- [`docs/TEAMORA_PHASE_351_380_FINAL_REPORT.md`](./docs/TEAMORA_PHASE_351_380_FINAL_REPORT.md) — Phase 351–380 Master Operational Sign-Off Report (**READY WITH LIMITATIONS**, 120/120 passing)
- [`docs/SAAS_OPERATIONAL_READINESS.md`](./docs/SAAS_OPERATIONAL_READINESS.md) — SaaS Operational Readiness Matrix across Env, Telemetry, DR, Billing & Support
- [`docs/DEPLOYMENT_RUNBOOK.md`](./docs/DEPLOYMENT_RUNBOOK.md) — Production Deployment & Secret Injection Runbook
- [`docs/INCIDENT_RESPONSE_RUNBOOK.md`](./docs/INCIDENT_RESPONSE_RUNBOOK.md) — Alert Triage, Incident State Machine & Non-Destructive Rollback Guide
- [`docs/CUSTOMER_ONBOARDING_GUIDE.md`](./docs/CUSTOMER_ONBOARDING_GUIDE.md) — Workspace Setup, Invitations, Governance & Export Guide
- [`docs/PRODUCTION_GO_LIVE_CHECKLIST.md`](./docs/PRODUCTION_GO_LIVE_CHECKLIST.md) — 10-Gate Pre-Release & Approval Checklist
- [`docs/POST_RELEASE_MONITORING_PLAN.md`](./docs/POST_RELEASE_MONITORING_PLAN.md) — Post-Launch SLA & Telemetry Watch Plan
- [`docs/PHASE_351_380_INITIAL_AUDIT.md`](./docs/PHASE_351_380_INITIAL_AUDIT.md) — Preflight Baseline Gap Audit (Phases 351–380)
- [`docs/TEAMORA_PHASE_341_350_FINAL_REPORT.md`](./docs/TEAMORA_PHASE_341_350_FINAL_REPORT.md) — Phase 341–350 Master Final Release Report (READY WITH LIMITATIONS)
- [`docs/PRODUCTION_READINESS_CHECKLIST.md`](./docs/PRODUCTION_READINESS_CHECKLIST.md) — Comprehensive 10-Gate Production Readiness Checklist
- [`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md) — Documented Operational Boundaries & Configuration Limits
- [`docs/RELEASE_RISK_REGISTER.md`](./docs/RELEASE_RISK_REGISTER.md) — Monitored Security, Operational & Cloud Risks
- [`docs/PHASE_341_ARCHITECTURE_AUDIT.md`](./docs/PHASE_341_ARCHITECTURE_AUDIT.md) — Architecture & Canonical 15 Workforce Audit
- [`docs/PHASE_342_BENCHMARK_INTEGRITY_AUDIT.md`](./docs/PHASE_342_BENCHMARK_INTEGRITY_AUDIT.md) — 20 Golden Cases, SEM, df & Statistical Hardening
- [`docs/PHASE_343_MODEL_REGISTRY_AUDIT.md`](./docs/PHASE_343_MODEL_REGISTRY_AUDIT.md) — Provider Specs, Pricing & Assignment Reconciliation
- [`docs/PHASE_344_REPRODUCIBILITY_REPORT.md`](./docs/PHASE_344_REPRODUCIBILITY_REPORT.md) — Multi-Run Empirical Benchmark Reproducibility
- [`docs/PHASE_345_SECURITY_AUDIT.md`](./docs/PHASE_345_SECURITY_AUDIT.md) — OWASP GenAI Top 10 (2026) Certified Security Audit
- [`docs/PHASE_346_GOVERNANCE_VERIFICATION.md`](./docs/PHASE_346_GOVERNANCE_VERIFICATION.md) — Two-Stage Execution & Anti-Self-Approval Verification
- [`docs/PHASE_347_RELIABILITY_AUDIT.md`](./docs/PHASE_347_RELIABILITY_AUDIT.md) — Circuit Breakers, Fault Injection & Offline Sync
- [`docs/PHASE_348_PERFORMANCE_REPORT.md`](./docs/PHASE_348_PERFORMANCE_REPORT.md) — Low-Resource Profile (<85MB RSS, 60 FPS Three.js ECO)
- [`docs/PHASE_349_REGRESSION_REPORT.md`](./docs/PHASE_349_REGRESSION_REPORT.md) — Full Regression Testing
- [`docs/TEAMORA_PHASE_301_340_FINAL_REPORT.md`](./docs/TEAMORA_PHASE_301_340_FINAL_REPORT.md) — Phase 301–340 Master Final Release Report
- [`BUILD_STATUS.md`](./BUILD_STATUS.md) — Live build status and test evidence summary

---

## 5. Development & Testing Commands

```bash
# Start local development server (Port 3000)
npm run dev

# Run TypeScript type check (0 errors)
npm run lint

# Run automated unit, security, ops & SaaS acceptance suite (120/120 passed)
npm test -- --run

# Compile production bundle
npm run build

# Start full-stack Express production server
npm start
```
