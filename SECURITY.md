# TEAMORA AI — Security Architecture & Hardening Guide

## 1. Zero-Trust Access Control (ABAC)

TEAMORA AI implements defense-in-depth across the client UI, server gateway, and database rules layer.

```
Request -> [Rate Limiter] -> [Zod Input Validator] -> [Server RBAC Gate] -> [Firestore Rules Engine]
```

### Role-Based Access Control (RBAC) Matrix

| Capability | Owner | Admin | Manager | Member | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| Read Workspace Business Data | Yes | Yes | Yes | Yes | Yes |
| Create & Update Standard Tasks | Yes | Yes | Yes | Yes | No |
| Create CRM Leads & Products | Yes | Yes | Yes | Yes | No |
| Authorize Sensitive Approvals | Yes | Yes | Yes | No | No |
| Dispatch External Gateway Execution | Yes | Yes | No | No | No |
| Invite & Remove Team Members | Yes | Yes | No | No | No |
| Delete Business Records | Yes | Yes | No | No | No |
| Change Billing & Plan Tiers | Yes | Yes | No | No | No |
| Delete Organization Workspace | Yes | No | No | No | No |

---

## 2. API Gateway Security & Threat Defenses

### A. Denial of Wallet / Resource Exhaustion Guard
- **Sliding-Window Rate Limiting:** Enforces a maximum of 60 requests per minute per IP. Returns HTTP 429 when threshold is reached with `X-RateLimit-*` response headers.
- **Payload Size Caps:** Prompts are capped at 32KB. File metadata strings are capped at reasonable boundaries. Raw JSON streaming rejects payloads exceeding 5MB.
- **Latency Guard:** All model requests are wrapped in a 6000ms timeout to prevent connection exhaustion.

### B. Prompt Injection & Malicious Input Sanitization
- Zod schemas validate string lengths, types, and required fields before model invocation.
- System instructions are strictly segregated from user inputs using structured message arrays.

### C. Secret Protection
- `GEMINI_API_KEY` is never delivered to the client browser.
- All Gemini calls originate from server-side handlers (`server/geminiHandler.ts`).
- GitHub repository commits and client-side builds contain zero secrets.

### D. Audit Logging
- Every high-risk action (`APPROVAL_AUTHORIZED`, `APPROVAL_EXECUTED`, `USER_LOGIN_GOOGLE`, `CRM_CUSTOMER_DELETE`, `ORG_CREATE`) writes a permanent, unalterable entry to `/organizations/{orgId}/auditLogs`.
