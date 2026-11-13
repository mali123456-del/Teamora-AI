# TEAMORA AI — Phase 368: Team Invitations & Access Governance

**Status:** VERIFIED COMPLETE  
**Milestone:** Batch 4 (Phase 368)

## 1. Hardened Invitation Controls (`server/organizationLifecycleEngine.ts`, `TeamSettingsView.tsx`)
- Replaced local React mock state in `TeamSettingsView.tsx` with server-authoritative `/api/org/team`, `/api/org/invite/create`, `/api/org/invite/cancel`, `/api/org/member/revoke`, and `/api/org/member/role`.
- **Seat Limits:** Enforces active member + pending invite seats against `PLAN_ENTITLEMENTS[plan].maxMembers`.
- **Duplicate & Expiry Rejection:** Blocks duplicate active invites (`409 DUPLICATE_INVITATION`), invalidates expired links (`410 INVITATION_EXPIRED`), and denies unauthenticated acceptance (`401 PRE_AUTH_ACCESS_DENIED`).
- **Role Safety:** Prevents direct Owner invitation or revoking Owner without explicit ownership transfer.
