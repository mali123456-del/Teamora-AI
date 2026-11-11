# TEAMORA AI — Phase 301: AI Ecosystem Reconciliation
**Document:** `docs/AI_ECOSYSTEM_RECONCILIATION.md`  
**Phase:** 301  
**Status:** Complete & Reconciled  
**Target:** Unified AI Model Ecosystem & Registry Harmonization  

---

## 1. Objective

Phase 301 establishes total architectural consistency across all AI endpoints, SDK configurations, model aliases, and registry records in the TEAMORA AI codebase. It resolves any discrepancy between server runtime configurations, client UI selectors, and cloud provider capabilities.

---

## 2. Reconciled Model Registry Specifications

| Model ID | Canonical Name | Provider | Version | Context Window | Input $/1M | Output $/1M | Structured JSON | Thinking | Search Grounding | Fine-Tuning | Current Status |
|----------|----------------|----------|---------|----------------|------------|-------------|-----------------|----------|------------------|-------------|----------------|
| `gemini-3.8-flash` | Gemini 3.8 Flash | Google GenAI SDK | `v3.8-stable` | 1,048,576 | $0.15 | $0.60 | Yes (Native) | Yes | Yes | Yes (Vertex/LoRA) | **Active (Workhorse)** |
| `gemini-3.1-flash-lite` | Gemini 3.1 Flash-Lite | Google GenAI SDK | `v3.1-lite` | 1,048,576 | $0.075 | $0.30 | Yes (Native) | No | No | Yes (Vertex/LoRA) | **Active (Fast Triage)** |
| `gemini-4-argon` | Gemini 4 Argon | Google GenAI SDK | `v4.0-argon` | 2,097,152 | $1.25 | $5.00 | Yes (Native) | Yes | Yes | No | **Restricted (Executive)** |
| `gemini-3.1-pro` | Gemini 3.1 Pro | Google GenAI SDK | `v3.1-pro` | 2,097,152 | $1.25 | $5.00 | Yes (Native) | Yes | Yes | Yes (Vertex/Full) | **Active (Deep Synthesis)** |
| `gemini-2.5-flash` | Gemini 2.5 Flash | Google GenAI SDK | `v2.5-flash` | 1,048,576 | $0.10 | $0.40 | Yes (Native) | No | No | Yes | **Standby (Redundancy)** |

---

## 3. Discrepancy Reconciliation Log

1. **Model Aliases Harmonized:**
   - Client-side mock references to legacy labels (`gemini-2.0-flash`, `gpt-4o`) have been deprecated and mapped cleanly to the official `@google/genai` TypeScript SDK models.
   - Default standard production model is set to `gemini-3.8-flash`.
   - High-throughput notification agent (Courier / `email-agent`) is bound to `gemini-3.1-flash-lite`.

2. **Context Window Safety Thresholds:**
   - While Gemini models support 1M–2M context windows, local development on the Dell Latitude 3340 (8 GB RAM) enforces a strict runtime buffer limit of 32,000 tokens for intermediate multi-agent communications to ensure server RSS memory remains < 85 MB.

3. **Provider Endpoint Protocol:**
   - Primary: Server-side proxy routes via `/api/chat`, `/api/benchmarks/run`, and `/api/benchmarks/recommendations` using `@google/genai` TypeScript SDK.
   - Client never exposes `GEMINI_API_KEY` in the browser bundle.

4. **Hardware Concurrency Boundary:**
   - Worker pool concurrency is clamped at $\le 3$ simultaneous model calls to prevent thread contention on the dual-core i5-4200U processor.
