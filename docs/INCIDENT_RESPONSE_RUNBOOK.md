# TEAMORA AI — Incident Response Runbook

1. **Detection (`DETECTED`):** Automated thresholds (`HIGH_ERROR_RATE`, `ELEVATED_P95_LATENCY`, `MEMORY_CEILING_WARNING`, `BACKUP_OR_INTEGRITY_FAILURE`) open deduplicated alerts in Operations Console (`/api/ops/alerts`).
2. **Triage (`INVESTIGATING -> IDENTIFIED`):** Manager/Admin acknowledges alert, inspects `/api/ops/logs` by `X-Correlation-ID` (secrets automatically redacted), and verifies `/api/security/audit` SHA-256 chain.
3. **Mitigation (`MITIGATING`):**
   - For AI outage: confirm automatic fallback to `gemini-3.1-flash-lite`; non-AI SaaS endpoints remain online.
   - For feature regression: trigger `POST /api/release/rollback` without modifying customer DBs.
   - For data corruption: run `POST /api/backup/restore-verify` in isolated sandbox namespace before recovery.
4. **Recovery & Closure (`MONITORING -> RESOLVED -> CLOSED`):** Verify 30 minutes nominal p95/error rate, document root cause & recovery action on incident timeline, and close incident.
