# TEAMORA AI — Post-Release Monitoring Plan

1. **First 2 Hours (Intensive):** Monitor `/api/ops/metrics` every 15 minutes for RSS (`< 256 MB`), p95 latency (`< 3000ms`), and 5xx error ratio (`< 1%`).
2. **24-Hour Stability Window:** Review deduplicated alerts under **Operations Console -> Alerts & Incidents** and inspect redacted `/api/ops/logs` for unexpected 401/403 spikes.
3. **Daily Verification:** Confirm `/api/security/audit` SHA-256 chain integrity passes (`0 tampered entries`) and verify latest backup snapshot checksum parity.
4. **Escalation Threshold:** Any critical unresolved alert or >5% error rate triggers immediate non-destructive feature rollback via `POST /api/release/rollback`.
