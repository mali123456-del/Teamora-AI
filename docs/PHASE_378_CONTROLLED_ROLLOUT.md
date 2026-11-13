# TEAMORA AI — Phase 378: Controlled Progressive Rollout Strategy

**Status:** VERIFIED COMPLETE (Rollout Plan Defined; Live Execution Held for Approval)

## 1. Cohort Progression Gates (`RolloutCohort`)
1. `internal_canary`: Operator/internal workspace validation using `/api/ops/metrics` and isolated restore checks.
2. `staged_beta`: Selected beta organizations on provisioned staging Firebase (`STAGING_FIREBASE_PROJECT_ID`).
3. `general_availability`: Full production traffic after 24h error-rate `< 1%` and zero critical unresolved incidents.

## 2. Explicit Stop-Ship / Rollback Triggers
- 5xx API error rate `> 5%` (`HIGH_ERROR_RATE` alert)
- Audit chain integrity failure or backup checksum mismatch (`BACKUP_OR_INTEGRITY_FAILURE`)
- Unintended client bundle secret exposure or `live_payment_charging` activation while `BILLING_MODE=sandbox`
