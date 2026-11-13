# TEAMORA AI — Phase 365: Data Portability & Multi-Format Tenant Export

**Status:** VERIFIED COMPLETE  
**Milestone:** Batch 3 (Phase 365)

## 1. Portability Guarantees (`exportTenantData`)
- Formats: Schema-versioned `JSON` (`schemaVersion: "1.0"`) and RFC 4180 `CSV` with CSV formula-injection neutralization (`'`, quotes escaping).
- Access Control: Restricted to `manager`, `admin`, and `owner` within the authenticated tenant; `viewer` and `member` are denied (`403 EXPORT_UNAUTHORIZED_ROLE`), and cross-tenant export requests return `403 CROSS_TENANT_EXPORT_FORBIDDEN`.
- Subscription Cancellation Continuity: Tenant export remains authorized even if a subscription is `canceled` or `past_due`.
- Sensitive Field Stripping: API keys, secrets, passwords, and tokens are omitted before checksum generation and download.
