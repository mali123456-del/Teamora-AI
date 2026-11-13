# TEAMORA AI — Phase 358: Alerting & Anomaly Detection

**Status:** VERIFIED COMPLETE  
**Milestone:** Batch 2 (Phase 358)

## 1. Deduplicated Alerting Engine (`server/observabilityEngine.ts`)
- Configured baseline alert rules (`HIGH_ERROR_RATE`, `ELEVATED_P95_LATENCY`, `MEMORY_CEILING_WARNING`, `PROVIDER_UNAVAILABLE`, `BACKUP_OR_INTEGRITY_FAILURE`).
- Alerts use composite deduplication keys (`${ruleId}:${orgId}`) within rule-specific cooldown windows (`dedupeWindowMs`) to prevent alert storms while incrementing `occurrenceCount`.
- Supports operator lifecycle actions (`active` -> `acknowledged` -> `resolved`) via `POST /api/ops/alerts/action` protected by `manager+` RBAC.
