# TEAMORA AI — Architecture Specification

## 1. System Topology

TEAMORA AI is a production-grade, multi-tenant AI Workforce & Business Automation platform. It couples a React 19 frontend with a hardened server-side Node.js / Express proxy layer, Google Cloud Firestore, Firebase Authentication, and Google Gemini API services.

```
                         ┌───────────────────────────────────────────────┐
                         │               CLIENT BROWSER                  │
                         │  - React 19 SPA (Vite 8, Tailwind v4)        │
                         │  - Three.js r187 3D Neural Workforce Canvas   │
                         │  - Dual-Theme (Warm Ivory / Dark Surface)     │
                         │  - English (LTR) / Urdu (RTL) Layout Engine   │
                         │  - Local Tenant Sync & Offline Cache          │
                         └──────────────┬──────────────────┬─────────────┘
                                        │                  │
                         HTTPS JSON REST│                  │ Firebase Web SDK
                                        ▼                  ▼
        ┌───────────────────────────────────────────┐   ┌───────────────────────────────┐
        │        TEAMORA SERVER GATEWAY             │   │       FIREBASE SERVICES       │
        │ - Express.js / Vite Connect Middleware    │   │                               │
        │ - Sliding-Window Rate Limiter (60 req/min)│   │ 1. Firebase Authentication    │
        │ - Zod Request Validation Schemas          │   │    - Google Sign-In           │
        │ - Latency Timeout & Guard (6000ms)        │   │    - Session Restoration      │
        │ - Model Resilience Cascade Engine         │   │ 2. Cloud Firestore Database   │
        │ - Safe Two-Stage Approval Executor        │   │    - Zero-Trust ABAC Rules    │
        │ - Google Keep Truthful Verification       │   │    - Multi-Tenant Isolation   │
        └─────────────────────┬─────────────────────┘   └───────────────────────────────┘
                              │
               Secure Private API Call (API Key Hidden)
                              ▼
        ┌───────────────────────────────────────────┐
        │          GOOGLE GEMINI SERVICES           │
        │ - gemini-3.8-flash (Reasoning & Grounding)│
        │ - gemini-3.1-flash-lite (Speed & Fallback)│
        │ - gemini-4-argon (Paid Deep Inference)    │
        └───────────────────────────────────────────┘
```

## 2. Key Architecture Pillars

### A. Zero Client Secret Exposure
- `@google/genai` is loaded exclusively inside the server context (`server/geminiHandler.ts`).
- `GEMINI_API_KEY` is read strictly from `process.env`. The frontend bundle contains zero API keys.
- All AI calls route through `/api/gemini/generate`, `/api/gemini/chat`, and `/api/gemini/orchestrate`.

### B. Resilience & Cascade Strategy
- Google AI Studio Free Tier keys have limit: 0 for `gemini-4-argon`.
- All autonomous agents and default routes use `gemini-3.8-flash` (which natively supports `ThinkingLevel.HIGH` and Google Search Grounding).
- When a 429 (rate limit) or 503 (high demand) is caught, `generateWithResilience` cascades to `gemini-3.1-flash-lite`, returning a fast, valid response without disrupting user workflows.

### C. Human-in-the-Loop Safe Approval Execution Gate (Phase 28)
- Approvals operate in a strict two-stage state machine:
  1. **Policy Decision:** Manager clicks "Authorize Action" -> status transitions from `pending` to `approved`.
  2. **Physical Execution:** Manager clicks "Dispatch via Gateway" -> calls `/api/approval/execute`, invoking the server executor. Status transitions to `executing`, then `executed` with a cryptographic execution ID receipt, or `execution_failed` with retry capability.
- Approving an action never fakes execution.

### D. Multi-Tenancy & Firestore Security (Phase 21-23)
- All records belong to a specific tenant workspace (`organizations/{orgId}`).
- Database security rules verify that the requesting user is an active member or owner before permitting read/write access.
- Subcollections (`tasks`, `approvals`, `customers`, `inventory`, `invoices`, `expenses`, `projects`, `documents`, `workflows`, `auditLogs`) inherit organization isolation.
- Audit logs are append-only; update and delete operations are forbidden at the database rule layer.

### E. Truthful Integration Standard (Phase 31)
- The system distinguishes between Personal Google accounts (`@gmail.com`) and Google Workspace Managed accounts.
- Official Google Keep REST API requires a Google Workspace Enterprise or Education domain. Personal accounts are reported truthfully with alternative local Knowledge Hub storage.
