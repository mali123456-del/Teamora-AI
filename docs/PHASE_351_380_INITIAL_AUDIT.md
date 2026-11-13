# TEAMORA AI — Phase 351–380 Initial Preflight Audit

**Product:** TEAMORA AI — Your AI Team. One Smart Workspace  
**Audit Date:** 2026-11-13  
**Milestone Scope:** Phases 351–380 (Production Operations, Monitoring, Disaster Recovery, SaaS Readiness & Controlled Launch)  
**Baseline Preceding Milestone:** Phases 341–350 (`READY WITH LIMITATIONS`, 104/104 Vitest tests passing)

---

## 1. Repository & Workspace Verification (Observed Evidence)

| Check | Command / Source | Observed Result | Status |
|---|---|---|---|
| Git repository metadata | `git status` | `fatal: not a git repository (.git missing in /app/applet)` | **CONFIGURATION NOTE** |
| Baseline Automated Tests | `npm test -- --run` | `src/test/securityAndBusiness.test.ts`: **104 / 104 passed** (322ms) | **VERIFIED** |
| Package Scripts | `package.json` | `dev` (Vite port 3000), `build` (`vite build`), `start` (`tsx server.ts`), `lint` (`tsc --noEmit`), `test` (`vitest run`) | **VERIFIED** |
| Firebase Configuration | `firebase-applet-config.json` | Project `gen-lang-client-0255849452`, DB `ai-studio-ef82aa0c-500c-4772-b17a-70d50299535a` | **VERIFIED (Single Environment Only)** |
| Firestore Security Rules | `firestore.rules` | 191-line hardened Zero-Trust ABAC + append-only `auditLogs` | **VERIFIED** |

---

## 2. Current Implementation vs. Phase 351–380 Requirements Gap Audit

### Batch 1 Targets (Phases 351–355: Production Architecture & Staging Readiness)
- **What exists:** `server.ts` Express entry serving `dist/` and routing `/api` to `handleApiRequest` in `server/geminiHandler.ts`; `vite.config.ts` dev middleware; `.env.example` (`GEMINI_API_KEY`, `APP_URL`); `DEPLOYMENT.md` & `ENVIRONMENT_SETUP.md`.
- **Gaps found:**
  1. No explicit environment profile separation (`development | staging | production | test`) or startup env validation (`server/envConfig.ts`).
  2. No centralized secret redaction helper (`redactSecrets`) protecting server logs and config diagnostics.
  3. `.env.example` lacks `APP_ENV`, `NODE_ENV`, `LOG_LEVEL`, `BILLING_MODE`, `BACKUP_RETENTION_DAYS`, and `ALLOWED_ORIGINS`.
  4. No `.github/workflows/ci-preflight.yml` CI verification workflow template.
  5. Single `firebase-applet-config.json` configured — isolated staging Firebase project credentials are not provisioned locally (**BLOCKER FOR LIVE STAGING CLOUD DEPLOYMENT**).

### Batch 2 Targets (Phases 356–360: Observability, Alerting & Incident Management)
- **What exists:** `SystemHealthView.tsx` tracks browser `requestAnimationFrame` FPS, counts active/queued tasks, shows 15 canonical agents, and calls `/api/security/audit` for SHA-256 chain validation.
- **Gaps found:**
  1. `SystemHealthView.tsx` renders static placeholder ceiling strings (`< 95 MB RSS`, `60 req / min / IP`) instead of real server RSS/heap/rate-limit telemetry.
  2. No structured JSON request logger with correlation IDs, redacted tenant tags, p50/p95 API latency tracking, or provider error rates.
  3. No configurable Alerting Engine with deduplication windows or Incident Lifecycle Manager (`DETECTED -> INVESTIGATING -> IDENTIFIED -> MITIGATING -> MONITORING -> RESOLVED -> CLOSED`).

### Batch 3 Targets (Phases 361–365: Backup, Disaster Recovery & Data Portability)
- **What exists:** Client IndexedDB offline cache (`indexedDbService.ts`) and file-backed `.teamora_audit_log.json` / `.teamora_idempotency_store.json`.
- **Gaps found:**
  1. No snapshot backup engine with SHA-256 checksum integrity verification and retention policies.
  2. No isolated sandbox restore verification harness validating entity counts and tenant isolation without touching production state.
  3. No authorized multi-format tenant Data Export API (`JSON` + `CSV`, schema versioned, sensitive field stripping, audit trail).

### Batch 4 Targets (Phases 366–370: SaaS Customer Readiness & Billing)
- **What exists:** `server/saasEngine.ts` (`PLAN_ENTITLEMENTS`, `checkPlanQuota`, `recordUsageMetric`, `updateSubscriptionPlan`, `getTenantInvoices`, `PAKISTAN_PAYMENT_GATEWAY_DOCS`).
- **Gaps found:**
  1. **Pricing Discrepancy:** `SubscriptionView.tsx` displays Business `$299` & Enterprise `$499`, whereas authoritative `server/saasEngine.ts` defines Business `$399` & Enterprise `$999`. `SubscriptionView.tsx` upgrade buttons are non-interactive and quota cards show static `"Unlimited"` / `"Active"` strings instead of server data.
  2. `TeamSettingsView.tsx` uses local React `useState` mock array instead of a server-authoritative Organization Lifecycle & Invitation Engine (expiration, duplicate invite checks, revocation, seat-limit enforcement, ownership transfer guard).
  3. `saasEngine.ts` lacks webhook HMAC signature verification + idempotent event reconciliation, trial expiration checks, `cancelAtPeriodEnd`, and export-when-expired guarantees.
  4. No guided resumable Customer Onboarding Wizard exists.

### Batch 5 Targets (Phases 371–375: Acceptance Testing, Accessibility, Help & Support)
- **What exists:** Dual EN/UR RTL toggle in `Header.tsx` and `AppContext.tsx`, USD/PKR formatting, `<ErrorBoundary>` isolation.
- **Gaps found:**
  1. No dedicated in-app Help Center (`HelpSupportView.tsx`) or Support Ticket / Bug Report Lifecycle Engine (`server/supportEngine.ts`) with tenant isolation and RBAC-restricted internal notes.
  2. No automated E2E multi-persona acceptance test suite covering owner, admin, manager, member, viewer, new-user onboarding, and subscription lifecycle workflows.

### Batch 6 Targets (Phases 376–380: Controlled Release & Governance Runbooks)
- **Gaps found:** No release-candidate / feature-flag rollback manager (`server/releaseConfig.ts`) or consolidated operational runbooks (`DEPLOYMENT_RUNBOOK.md`, `INCIDENT_RESPONSE_RUNBOOK.md`, `PRODUCTION_GO_LIVE_CHECKLIST.md`, `SAAS_OPERATIONAL_READINESS.md`, etc.).

---

## 3. External Prerequisites Requiring User Action / Approval

1. **Staging Firebase Project:** Only one Firebase project (`gen-lang-client-0255849452`) is present in `firebase-applet-config.json`. Provisioning an isolated staging Firebase project requires user/admin GCP action.
2. **Production Secrets & Domain:** Hosting secrets (`GEMINI_API_KEY`, `SAAS_WEBHOOK_SECRET`, `APP_URL`, `ALLOWED_ORIGINS`) must be injected by the platform secret manager at deploy time.
3. **Live Payment Gateway Keys:** Safepay / PayFast / SadaBiz / LemonSqueezy live merchant keys remain unconfigured (`BILLING_MODE=sandbox`); explicit user approval is required before enabling real monetary charges.
4. **Live Cloud Deployment & Rollout:** Automated workflows stop strictly at CI preflight (`lint`, `test`, `build`); live production deployment requires explicit user approval.

---

## 4. Sequential Execution Plan

1. **Batch 1 (Phases 351–355):** `server/envConfig.ts`, `.env.example`, `.github/workflows/ci-preflight.yml`, `server.ts` startup validation & security headers, `/api/ops/config-health`, Batch 1 docs & tests.
2. **Batch 2 (Phases 356–360):** `server/observabilityEngine.ts`, `/api/ops/{metrics,logs,alerts,incidents}`, upgrade `SystemHealthView.tsx` with real telemetry, alerts & incident workflow, Batch 2 docs & tests.
3. **Batch 3 (Phases 361–365):** `server/backupRecoveryEngine.ts`, `/api/backup/*` & `/api/export/tenant-data`, Backup & Export controls in Governance UI, Batch 3 docs & tests.
4. **Batch 4 (Phases 366–370):** `server/organizationLifecycleEngine.ts`, harden `server/saasEngine.ts` (billing webhook HMAC + idempotency + cancellation/trial), `CustomerOnboardingModal.tsx`, rewire `SubscriptionView.tsx` & `TeamSettingsView.tsx`, Batch 4 docs & tests.
5. **Batch 5 (Phases 371–375):** `server/supportEngine.ts`, `HelpSupportView.tsx` + Sidebar/Header integration, accessibility/i18n pass, multi-persona E2E acceptance test suite, Batch 5 docs.
6. **Batch 6 (Phases 376–380):** `server/releaseConfig.ts`, full verification (`vitest`, `tsc --noEmit`, `vite build`), complete operational runbooks, update `README.md` & `BUILD_STATUS.md`, honest sign-off report.
