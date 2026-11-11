# TEAMORA AI — Phase 333: Model Routing Strategy & Dispatch Architecture
**Document:** `docs/AI_MODEL_ROUTING_STRATEGY.md`  
**Phase:** 333  
**Status:** Canonical & Active  
**Author:** Principal AI Systems Engineer  

---

## 1. Multi-Tier Dynamic Routing Flow

TEAMORA AI employs an intelligent, cost-and-latency-aware routing engine that analyzes incoming user and inter-agent requests to determine the optimal model.

```text
[Incoming Request]
        │
        ▼
[Complexity & Intent Classifier]
        │
   ┌────┴───────────────────────────────────────────┐
   │ Check Task Complexity, Domain & Priority       │
   ├────────────────┬───────────────┬───────────────┤
   │ High Reasoning │ Standard Work │ High-Speed    │
   │ & Complex DAG  │ & Multilingual│ Notification  │
   │                │               │ & Fast Triage │
   ▼                ▼               ▼               ▼
[gemini-4-argon]  [gemini-3.8-flash][gemini-3.1-flash-lite]
(Atlas / PM)      (Workforce Std) (Courier / Alerts)
   │                │               │
   └────────────────┼───────────────┘
                    │
                    ▼
           [Hardware Throttling Check]
                    │
     Is CPU Load > 85% or Rate Limited?
            ├─── YES ──► Downgrade to next lower tier
            └─── NO  ──► Dispatch immediately
```

---

## 2. Dispatch Decision Matrix

| Task Type | Intent Keywords | Primary Model | Fallback Model | Timeout SLA |
|-----------|-----------------|---------------|----------------|-------------|
| **Executive Planning** | `orchestrate`, `pipeline`, `dag`, `dependencies` | `gemini-4-argon` | `gemini-3.8-flash` | 8,000ms |
| **Notification Dispatch** | `notify`, `email_send`, `alert`, `ping` | `gemini-3.1-flash-lite` | `gemini-3.8-flash` | 1,500ms |
| **Urdu Translation / QA** | `اردو`, `urdu`, `translation`, `roman urdu` | `gemini-3.8-flash` | `gemini-3.1-flash-lite` | 3,000ms |
| **Financial Computation** | `runway`, `margin`, `invoice`, `reconcile` | `gemini-3.8-flash` | `gemini-3.1-pro` | 3,000ms |
| **Code Generation** | `typescript`, `function`, `api`, `sql` | `gemini-3.8-flash` | `gemini-3.1-pro` | 5,000ms |
| **RAG Grounding** | `cite`, `source`, `document`, `policy` | `gemini-3.8-flash` | `gemini-3.1-pro` | 4,000ms |

---

## 3. Rate Limit & Cost Caching Rules

1. **Context Caching:** Repetitive system instructions and few-shot exemplars (>32k tokens) utilize Google GenAI native context caching, reducing input token billing by up to 75%.
2. **Sliding Window Throttling:** Strict 60 requests/minute per tenant IP enforced in `server/geminiHandler.ts` with exponential backoff.
3. **Graceful Degradation:** If `gemini-4-argon` exhausts quota, the router transparently falls back to `gemini-3.8-flash` with zero user disruption.
