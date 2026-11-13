# TEAMORA AI — Phase 346: Human Approval & AI Governance Verification
**Document:** `docs/PHASE_346_GOVERNANCE_VERIFICATION.md`  
**Phase:** 346  
**Status:** Certified & Verified  
**Target:** Two-Stage Execution Decoupling, Human Approval Gates, Anti-Self-Approval & Reassignment Governance  

---

## 1. Two-Stage Execution Architecture

In TEAMORA AI, the policy decision to approve a task and its physical execution are strictly decoupled into two isolated stages:

```text
[AI Agent Generates Sensitive Action]
                  │
                  ▼
[Policy Evaluation: Is Action Sensitive?]
       ├── Payments > $500
       ├── Refunds > $50
       ├── Purchase Orders > $1,000
       ├── Mass Emails > 25 recipients
       ├── Deletions or Disciplinary Records
       └── Production Model Reassignments
                  │
         ┌────────┴────────┐
        YES                NO
         │                 │
         ▼                 ▼
[Status: needs_approval] [Immediate Execution]
         │
         ▼
[Approval Record Queued in Approvals Center]
         │
         ▼
[Human Review by Authorized Admin/Manager]
         │
    ┌────┴──────────────────────────┐
   REJECT                          APPROVE
    │                               │
    ▼                               ▼
[Status: rejected]         [Verify Reviewer Credentials]
                            (AI Actor Blocked)
                                    │
                                    ▼
                           [Idempotency Check]
                                    │
                                    ▼
                           [Physical Execution]
                                    │
                                    ▼
                           [Cryptographic Receipt Logged]
                                    │
                                    ▼
                           [Status: executed]
```

---

## 2. Governance Invariants & Protections

| Governance Invariant | Implementation Mechanism | Verification Test |
|----------------------|--------------------------|-------------------|
| **Anti-Self-Approval** | Reviewer UID must belong to a human authenticated user (`request.auth.uid !== agent.id`). AI agents cannot sign their own approval tickets. | Verified in `server/geminiHandler.ts` |
| **No Execution Before Approval** | The execution endpoint `POST /api/approval/execute` validates that the ticket has transitioned to `approved` before invoking tools. | Verified in `src/test/securityAndBusiness.test.ts` |
| **No False Completion** | Tasks waiting on human review remain in `needs_approval`. The UI displays a warning banner and never marks the task `completed` prematurely. | Verified in `TaskCenter.tsx` |
| **Duplicate Execution Prevention** | Deduplication map (`idempotencyStore`) records execution receipts with SHA-256 payload hashes. Re-submitting the same request returns the cached receipt. | Verified in `src/test/securityAndBusiness.test.ts` |
| **Invalid State Transition Guard** | Tickets in `executed` or `rejected` state reject subsequent transition requests (immutable terminal states). | Verified in state machine checks |
| **Production Model Reassignment** | Changes to agent preferred models (e.g. Courier to Flash-Lite) generate pending approval tickets requiring explicit administrator approval in the Benchmarking Lab. | Verified in `BenchmarkingLabView.tsx` |

---

## 3. Sensitive Action Catalog

| Agent Name | Agent ID | Sensitive Action | Approval Boundary |
|------------|----------|------------------|-------------------|
| **Echo** | `support-agent` | Customer Refund | Any refund request $> \$50$ |
| **Ledger** | `finance-agent` | Wire Transfer / Disbursement | Any outgoing transaction $> \$500$ |
| **Stockwell** | `inventory-agent` | Purchase Order | Any inventory replenishment $> \$1,000$ |
| **Courier** | `email-agent` | Mass Email Dispatch | Any outbound broadcast $> 25$ recipients |
| **Scribe** | `document-agent` | Contract Execution | Any document with legal binding signature |
| **Atlas** | `workforce-manager` | Bulk Reassignment | System-wide re-allocation of workforce agents |
| **Pulse** | `marketing-agent` | Ad Budget Modification | Any change to paid marketing budgets |
| **Harmony** | `hr-agent` | Disciplinary & Offer Letters | Any binding salary or disciplinary action |
