# TEAMORA AI — Phases 151–220 Test Matrix

**Audited Checkpoint:** Phases 1–150 (53 Passing Tests)  
**Target Checkpoint:** Phases 151–220  
**Test Runner:** Vitest (`vitest run --run`)  
**Target Coverage:** 100% Passing, Zero Flaky Tests, Fast Execution (< 1.5s)  

---

## 1. Test Suite Architecture

| Test ID | Test Category | Target Module | Description | Expected Result |
|---|---|---|---|---|
| `TEST-NOTIF-01` | Service Init | `notificationService.ts` | Initialize service and seed default tenant alerts | Returns non-empty seed array for `org-apex` |
| `TEST-NOTIF-02` | Org Isolation | `notificationService.ts` | Query notifications across `org-apex` and `org-crescent` | No notification leaks across organizations |
| `TEST-NOTIF-03` | Event Deduplication | `notificationService.ts` | Dispatch two notifications with the identical `eventId` | Second dispatch rejected/ignored; count unchanged |
| `TEST-NOTIF-04` | Unread Counting | `notificationService.ts` | Calculate unread count and verify accuracy | Unread matches count of items where `isRead === false` |
| `TEST-NOTIF-05` | Mark As Read | `notificationService.ts` | Mark single notification as read | Item `isRead` set to `true`, `readAt` populated |
| `TEST-NOTIF-06` | Mark All As Read | `notificationService.ts` | Mark all unread items for an org as read | Unread count drops to 0; all items set to read |
| `TEST-NOTIF-07` | Delete Notification | `notificationService.ts` | Remove an individual notification by ID | Item removed from notification list |
| `TEST-NOTIF-08` | Clear Read History | `notificationService.ts` | Purge read notifications while preserving unread | Only unread items remain |
| `TEST-NOTIF-09` | Priority Filtering | `notificationService.ts` | Filter notifications by category or status | Correct subset returned |
| `TEST-NOTIF-10` | Preference Filtering | `notificationService.ts` | Update user preferences to mute categories | Filtered notifications respect disabled alert categories |
| `TEST-NOTIF-11` | Reactive Subscription | `notificationService.ts` | Subscribe to notification changes | Callback fired synchronously on dispatch/mutation |
| `TEST-NOTIF-12` | Simulation Dispatch | `notificationService.ts` | Trigger test simulation helper | Generates valid formatted alert and updates unread badge |

---

## 2. Platform Reliability & Correlation Tests (Phases 161–170)

| Test ID | Test Category | Target Module | Description | Expected Result |
|---|---|---|---|---|
| `TEST-TRACE-01` | Correlation ID | `server/telemetry.ts` | Generate and propagate `x-correlation-id` | Valid UUIDv4 / nanoid format attached to request context |
| `TEST-CIRCUIT-01` | Circuit Breaker | `server/circuitBreaker.ts` | Trip circuit breaker after 5 consecutive simulated errors | Subsequent calls fail fast with `CircuitOpenError` |
| `TEST-CIRCUIT-02` | Circuit Half-Open | `server/circuitBreaker.ts` | Allow canary call after reset timeout | Resets to closed state on success |
| `TEST-METRIC-01` | Telemetry Health | `server/telemetry.ts` | Collect latency, throughput, error rates | Returns accurate aggregates |

---

## 3. AI Governance & Defense Tests (Phases 171–180)

| Test ID | Test Category | Target Module | Description | Expected Result |
|---|---|---|---|---|
| `TEST-SEC-INJECT-01` | Injection Defense | `server/aiGovernance.ts` | Detect prompt injection patterns ("ignore previous instructions") | Blocked with security warning log |
| `TEST-SEC-SCHEMA-01` | Output Validation | `server/aiGovernance.ts` | Validate structured agent output against strict Zod schema | Validated payload or formatted rejection |
| `TEST-SEC-BENCH-01` | Token Budgeting | `server/aiGovernance.ts` | Enforce model token limits per tier | Enforces enterprise/pro/free budget ceilings |

---

## 4. Execution Command
```bash
npm test -- --run
```
All tests must execute in under 1500ms to guarantee ultra-low developer feedback loop on Intel Core i5-4200U.
