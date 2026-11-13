# TEAMORA AI — Release Risk Register
**Document:** `docs/RELEASE_RISK_REGISTER.md`  
**Milestone:** Phase 350 Release Documentation  
**Status:** Monitored & Mitigated  

---

## 1. Risk Matrix Summary

| Risk ID | Risk Description | Severity | Likelihood | Impact | Current Mitigation & Control | Residual Risk |
|---------|------------------|----------|------------|--------|------------------------------|---------------|
| **RSK-01** | Upstream Gemini API Quota Exhaustion (HTTP 429) | Medium | Medium | Medium | Sliding window rate limiter (60 req/min); automated fallback chain (`gemini-3.8-flash` $\to$ `gemini-3.1-flash-lite`); exponential backoff retry. | Low |
| **RSK-02** | Low-End Host CPU Throttling | Low | Low | Low | Server worker pool clamped at $\le 3$ concurrent tasks; Three.js ECO mode; zero heavy local weights. | Low |
| **RSK-03** | Unauthorized Production Model Reassignment | High | Low | High | Reassignment requires authenticated human administrator review in Benchmarking Lab; Anti-Self-Approval blocks automated agent reassignments. | Low |
| **RSK-04** | Cross-Tenant Data Leakage | High | Very Low | Critical | Strict Cloud Firestore ABAC security rules (`firestore.rules`) enforcing `/organizations/{orgId}/...` and server-side RBAC validation. | Very Low |
| **RSK-05** | Prompt Injection / DAN Bypass | High | Low | High | Validated against OWASP GenAI Top 10 (2026); test case `gen-03` verifies instruction override refusal. | Low |
| **RSK-06** | Browser Cache Desynchronization | Medium | Low | Low | Deterministic operation keys (`idemp-task-${taskId}`); version conflict resolution in `syncEngine.ts`. | Low |

---

## 2. Release Sign-Off Status

All identified risks possess active architectural mitigations, automated tests, and verified fallback behaviors.
Residual risk across all categories is evaluated as **Low** or **Very Low**.
