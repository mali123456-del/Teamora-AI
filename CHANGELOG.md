# TEAMORA AI — Changelog

## [2.4.0] — 2026-11-08

### Security & Hardening (Phase 21)
- Implemented sliding-window in-memory rate limiting (60 req/min per IP) on all server endpoints.
- Added strict Zod schemas for `/api/gemini/generate`, `/api/gemini/chat`, `/api/gemini/orchestrate`, `/api/approval/execute`, and `/api/integrations/verify-keep`.
- Added automated security test suite (`src/test/securityAndBusiness.test.ts`) covering 18 test cases with 100% pass rate.
- Hardened `firestore.rules` with Zero-Trust ABAC, membership validation, and immortal ID checks.

### Authentication & Multi-Tenancy (Phase 22)
- Replaced demo fallback in `AppContext.tsx` with true Firebase Auth state (`onAuthStateChanged`).
- Created isolated Demo Sandbox mode for read-only exploration without giving fake production permissions.
- Added organization creation flow (`createOrganization`) enabling custom tenant names and primary currency (USD/PKR).

### Database Persistence (Phase 23)
- Created centralized data access layer `src/lib/firestoreService.ts` with standardized `FirestoreErrorInfo` handling.
- Implemented local tenant storage sync to guarantee data persistence across browser reloads.

### Human-in-the-Loop Safe Approval Gate (Phase 28)
- Decoupled approval policy decision from physical action execution.
- Added server endpoint `POST /api/approval/execute` that executes authorized actions and records cryptographic receipts.
- Upgraded `ApprovalsCenter.tsx` with distinct status badges (`pending`, `approved`, `executing`, `executed`, `execution_failed`).

### Multi-Agent Orchestration (Phase 26)
- Updated `OrchestrationCenter.tsx` with honest task lifecycle statuses (`queued`, `planning`, `running`, `completed`).
- Enabled real agent invocation triggers via `generateGeminiContent` for individual subtasks.

### Integrations (Phase 31)
- Implemented truthful verification endpoint `/api/integrations/verify-keep` that checks account domain eligibility.
- Clearly explains Google Keep official API limitation for consumer `@gmail.com` accounts and provides local Knowledge Hub notes alternative.

---

## [1.0.0] — 2026-11-07
- Initial master build with 15 AI agents, Three.js 3D Neural Workforce Canvas, dual USD/PKR currency, Urdu RTL support, and business modules.
