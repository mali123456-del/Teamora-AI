# TEAMORA AI — Testing Strategy & Verification Evidence

## 1. Automated Test Architecture

TEAMORA AI utilizes **Vitest** for fast unit and security invariant verification.

### Test Runner Execution
```bash
npm run test
# or
npx vitest run
```

---

## 2. Test Verification Evidence

Latest test run executed on **November 8, 2026**:

```
 RUN  v5.1.0 /app/applet
 ✓ src/test/securityAndBusiness.test.ts (18 tests) 20ms
   ✓ Phase 21: Security & Input Validation Tests (6)
     ✓ rejects empty prompts in GenerateSchema
     ✓ accepts valid prompt with system instruction and model
     ✓ rejects prompts exceeding maximum 32KB boundary limits (Denial of Wallet guard)
     ✓ rejects chat request with empty message
     ✓ validates history roles to only permitted values (user, model, assistant)
     ✓ validates OrchestrateSchema requires goal string
   ✓ Phase 28: Human-in-the-Loop Safe Approval & Execution Tests (2)
     ✓ validates execute approval schema requires valid actionType
     ✓ requires reviewerId to avoid anonymous approval execution
   ✓ Phase 31: Truthful Google Workspace Integration Tests (2)
     ✓ rejects invalid email formats
     ✓ distinguishes between personal @gmail.com and managed enterprise domains
   ✓ Phase 25: 15 Autonomous Workforce Employees Completeness (4)
     ✓ contains exactly 15 distinct specialized AI agents
     ✓ every agent has unique id, systemInstruction, role and department
     ✓ Atlas is designated as Workforce Manager with cross-department orchestration capability
     ✓ Financial agent Ledger has human approval requirement on sensitive payouts
   ✓ Phase 21: Multi-Tenant RBAC Permissions Matrix (4)
     ✓ enforces that Viewers cannot create records or approve actions
     ✓ enforces that Members can create records but cannot approve high-risk actions
     ✓ enforces that Managers can approve actions but cannot modify billing
     ✓ enforces that Owners have full operational and billing privileges

 Test Files  1 passed (1)
      Tests  18 passed (18)
   Duration  646ms
```

---

## 3. Real Endpoint Verification Evidence

### Health Check Endpoint
```bash
curl -s http://localhost:3000/api/status
# Response:
# {"status":"ok","hasApiKey":true,"timestamp":"2026-11-08T03:43:02.975Z","service":"Teamora AI Enterprise Gateway","version":"2.4.0"}
```

### Two-Stage Approval Execution Gateway Endpoint
```bash
curl -s -X POST http://localhost:3000/api/approval/execute \
  -H "Content-Type: application/json" \
  -d '{"approvalId":"appr-301","orgId":"org-apex","actionType":"payout","reviewerId":"user-test","payloadSummary":{"amount":4200,"vendor":"ServerHub Cloud Services"}}'
# Response:
# {"success":true,"approvalId":"appr-301","orgId":"org-apex","reviewerId":"user-test","executionId":"exec-1794109386928-gz6d9i9","status":"executed","result":"Disbursement of $4200 to ServerHub Cloud Services electronically queued via treasury gateway. Transfer Reference ID: exec-1794109386928-gz6d9i9.","executedAt":"2026-11-08T03:43:06.928Z"}
```

### Truthful Google Keep Enterprise API Verification Endpoint
```bash
curl -s -X POST http://localhost:3000/api/integrations/verify-keep \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"m.sulaiman10thclass@gmail.com"}'
# Response:
# {"connected":false,"status":"restricted_account_type","eligible":false,"accountType":"Personal Google Account (@gmail.com)","message":"Google Keep official API requires a Google Workspace Enterprise or Education organization domain. Personal consumer @gmail.com accounts cannot synchronize directly via official Google Keep Enterprise API.","recommendedAction":"Use a Google Workspace domain email or utilize Teamora AI native Knowledge Hub notes for local and team-wide synchronization."}
```
