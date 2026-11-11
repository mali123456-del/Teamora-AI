# TEAMORA AI — Phase 302: Model Registry Verification
**Document:** `docs/AI_MODEL_REGISTRY_VERIFICATION.md`  
**Phase:** 302  
**Status:** Verified & Validated  
**Target:** Official Provider Endpoints, Citations, Parameter Limits & Availability  

---

## 1. Registry Integrity Verification

Every model registered in `server/benchmarkRunner.ts` (`MODEL_REGISTRY`) has been cross-verified against official Google GenAI documentation and production availability.

### Verification Checklist:
- [x] Canonical model IDs conform to `@google/genai` TypeScript SDK schemas.
- [x] Input and output pricing values align with Google Cloud / Gemini API public tier metrics.
- [x] Context window limits verified: 1,048,576 tokens for Flash tiers; 2,097,152 tokens for Pro/Argon tiers.
- [x] Native tool-calling (function declarations with JSON schema) verified across all active models.
- [x] Grounding capabilities (Google Search & custom vector RAG) verified.

---

## 2. Parameter Operational Boundaries

| Parameter | Recommended Default | Safe Range | High-Risk Setting (Flagged) | Purpose |
|-----------|---------------------|------------|-----------------------------|---------|
| `temperature` | 0.2 (deterministic tasks), 0.7 (creative) | 0.0 – 1.0 | > 1.2 (unstable responses) | Response entropy |
| `topP` | 0.95 | 0.8 – 1.0 | < 0.5 (excessive repetition) | Nucleus sampling |
| `topK` | 40 | 20 – 64 | > 100 (unnecessary search overhead) | Token pool selection |
| `maxOutputTokens` | 1,024 | 256 – 8,192 | > 16,384 (memory spike hazard) | Response truncation boundary |
| `thinkingConfig` | Enabled on Argon / Pro | Mode: On/Off | Enabled on low-latency routes | Reasoning tokens |

---

## 3. Availability & Health Fallback Chain

```text
[Incoming Task Request]
           │
           ▼
[Check Target Agent Preferred Model]
           │
      ┌────┴───────────────────────────┐
      │ Primary Model Available?        │
      ├─────────────────┬──────────────┤
     YES                NO (Rate Limit / Unavailable)
      │                 │
      ▼                 ▼
[Execute Primary]  [Invoke Tier-1 Fallback Model]
                        │
                  ┌─────┴───────────────────┐
                  │ Fallback Succeeded?     │
                  ├───┬─────────────────────┤
                 YES  NO
                  │   │
                  │   ▼
                  │  [Invoke Standby: gemini-2.5-flash]
                  │   │
                  ▼   ▼
              [Log Telemetry & Response]
```

- Primary fallback for `gemini-4-argon` is `gemini-3.8-flash`.
- Primary fallback for `gemini-3.8-flash` is `gemini-3.1-flash-lite`.
- Extreme disaster recovery fallback is `gemini-2.5-flash` with degraded thinking mode.
