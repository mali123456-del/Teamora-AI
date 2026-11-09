# TEAMORA AI — Your AI Team. One Smart Workspace.

A premium, modern, multi-tenant AI Workforce & Business Automation SaaS platform.

![TEAMORA AI](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80)

---

## 1. Overview

**TEAMORA AI** unifies 15 specialized autonomous AI employees into an orchestrated, enterprise-grade business workspace. Unlike generic AI chatbots, TEAMORA AI provides a coordinated workforce with distinct departmental responsibilities, tools, and human-in-the-loop safety gates.

- **Unique Visual Identity:** Warm Ivory (`#F5F1E9`), Deep Ink (`#211B2C`), Muted Lavender (`#8B5CF6`), Electric Lime (`#C7F36B`), Soft Coral (`#FF806E`). Zero generic blue gradients or boilerplate AI sparkle templates.
- **Original Logo:** Architectural letter **T** integrated with connected team nodes.
- **Multilingual & Dual-Currency:** Full English and Urdu (`اردو`, true `dir="rtl"`) layout adaptation; dual USD (`$`) and Pakistani Rupee (`₨` PKR) currency formatting.
- **3D Neural Workforce Canvas:** Interactive Three.js r187 procedural workforce visualization with studio PBR lighting, PMREMGenerator, and software WebGL guard.
- **Two-Stage Human Safety Gate:** Mandatory policy sign-off followed by server-side physical execution with verifiable cryptographic receipts.
- **Truthful Integrations:** Real Firebase Authentication, Google Cloud Firestore ABAC rules, and truthful Google Keep Enterprise API eligibility verification.

---

## 2. The 15 Autonomous AI Employees

1. **Atlas** — Workforce Manager & Chief Orchestrator (Leadership & Strategy)
2. **Echo** — Customer Support Lead (Customer Experience)
3. **Vanguard** — Enterprise Sales & Revenue Agent (Revenue Operations)
4. **Pulse** — Growth Marketing & Campaign Strategist (Revenue Operations)
5. **Ledger** — Finance & Compliance Specialist (Finance & Treasury)
6. **Prism** — Business Intelligence & Data Scientist (Intelligence & Data)
7. **Stockwell** — Supply Chain & Inventory Controller (Operations)
8. **Nexus** — Operations & Process Optimization Lead (Operations)
9. **Scout** — Market Intelligence & Research Agent (with Google Search Grounding)
10. **Harmony** — People Operations & Talent Manager (Human Resources)
11. **Quill** — Editorial & Brand Voice Director (Content & Communications)
12. **Courier** — Communications & Inbox Dispatcher (Outbound Email)
13. **Chronos** — Agile Project & Sprint Director (Project Management)
14. **Scribe** — Document Intelligence & Knowledge Architect (Knowledge Systems)
15. **Synapse** — Autonomous Workflow & Integration Engineer (Automation Studio)

---

## 3. Architecture & Security Invariants

- **Zero Client Secret Leakage:** `@google/genai` is only accessed server-side in `server/geminiHandler.ts`. `GEMINI_API_KEY` is never exposed in browser bundles.
- **Sliding-Window Rate Limiting:** Enforces max 60 req/min per IP to prevent Denial-of-Wallet attacks.
- **Multi-Tier Resilience:** Primary `gemini-3.8-flash` automatically cascades to `gemini-3.1-flash-lite` on quota spikes or high demand.
- **Two-Stage Safe Approvals:** Decoupled `pending` -> `approved` -> `executing` -> `executed` pipeline prevents premature task completion.
- **Multi-Tenant Firestore Isolation:** Strict Zero-Trust ABAC rules in `firestore.rules` protect organization data.

---

## 4. Documentation Suite

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — System topology, gateway proxy, and cascade engine
- [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) — Firestore collection schemas and relational rules
- [`SECURITY.md`](./SECURITY.md) — RBAC matrix, Zod schemas, and threat defense
- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — Color tokens, typography, and Three.js standards
- [`ENVIRONMENT_SETUP.md`](./ENVIRONMENT_SETUP.md) — Local development and environment configuration
- [`TESTING.md`](./TESTING.md) — Vitest test results and real endpoint curl receipts
- [`ROADMAP.md`](./ROADMAP.md) — Completed milestones and near-term capabilities
- [`CHANGELOG.md`](./CHANGELOG.md) — Version history and release notes
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Cloud Run Dockerfile and rollback procedures
- [`BUILD_STATUS.md`](./BUILD_STATUS.md) — Live build status and phase audit verification

---

## 5. Development & Testing Commands

```bash
# Start local development server (Port 3000)
npm run dev

# Run TypeScript type check
npm run lint

# Run automated unit & security test suite
npm run test

# Compile production bundle
npm run build

# Start full-stack Express production server
npm start
```
