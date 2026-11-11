# TEAMORA AI — Complete AI Ecosystem Audit

**Product:** TEAMORA AI — Your AI Team. One Smart Workspace  
**Status:** Canonical AI Ecosystem & Provider Inventory  
**Date:** 2026-11-11  
**Audit Scope:** Server-side handlers, agent definitions, client libraries, RAG retrieval, token governance, rate limiters, resilience fallbacks, and hardware constraints.

---

## 1. Executive Summary

TEAMORA AI operates an enterprise multi-agent AI architecture powered by the Google Gemini API (`@google/genai` TypeScript SDK). All API keys are securely managed server-side (`server/geminiHandler.ts` and `/api/*` proxy routes), with zero client-side credential exposure.

The ecosystem utilizes a multi-tier resilience cascade:
```
Primary Requested Model
         ↓ (on failure or timeout > 25,000ms)
gemini-3.8-flash (Standard Tier Workhorse)
         ↓ (on failure or rate limit)
gemini-3.1-flash-lite (High-Throughput Fallback)
```

---

## 2. Configured Model Registry & Inventory

| Provider | Model ID | Model Version | Assigned AI Employee(s) | Primary Capabilities | Context Window | Input Pricing (per 1M) | Output Pricing (per 1M) | Tool Calling | Structured Output | Fine-Tuning | Current Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Google GenAI | `gemini-3.8-flash` | v3.8 Stable | 14 Employees (Atlas, Echo, Vanguard, Pulse, Ledger, Prism, Stockwell, Nexus, Scout, Harmony, Quill, Chronos, Scribe, Synapse) | General intelligence, High Thinking reasoning, Search Grounding, Function Calling, Code generation, Multilingual Urdu/English | 1,048,576 tokens | $0.15 | $0.60 | Supported | Supported | Supported (Gemini Tuning API) | **Active (Default Primary)** |
| Google GenAI | `gemini-3.1-flash-lite` | v3.1 Lite | Courier (High-frequency notifications & dispatcher) | Ultra-fast throughput, low latency text classification, alert routing, fallback recovery | 1,048,576 tokens | $0.075 | $0.30 | Supported | Supported | Supported | **Active (Primary for Courier, Universal Fallback)** |
| Google GenAI | `gemini-4-argon` | v4.0 Argon | Strategic Orchestrator (Atlas Master Planning), Optional in Workspace | Deep reasoning, high-stakes math/financial modeling, multi-step agent decomposition, complex code analysis | 2,097,152 tokens | $1.25 | $5.00 | Supported | Supported | Unverified (Enterprise Tier) | **Active (Requires billing key in Secrets)** |
| Google GenAI | `gemini-3.1-pro` | v3.1 Pro | Eligible for Nexus & Ledger | Architectural analysis, complex logic verification, long document synthesis | 2,097,152 tokens | $1.25 | $5.00 | Supported | Supported | Supported | **Available in Registry** |
| Google GenAI | `gemini-2.5-flash` | v2.5 Flash | Legacy Fallback | Baseline classification, legacy workflow execution | 1,048,576 tokens | $0.10 | $0.40 | Supported | Supported | Supported | **Standby** |

---

## 3. Subsystem Model Utilization Matrix

| Subsystem / Area | Active Endpoint | Configured Primary Model | Fallback Models | Generation Settings |
|---|---|---|---|---|
| **Workforce Orchestrator** | `POST /api/gemini/orchestrate` | `gemini-4-argon` | `gemini-3.8-flash`, `gemini-3.1-flash-lite` | Thinking Level: HIGH, Temperature: 0.2, Timeout: 25s |
| **Agent Workspace** | `POST /api/gemini/chat` | User-selected (`gemini-3.8-flash` default) | `gemini-3.1-flash-lite` | Thinking toggle, Temperature: 0.7, Max History: 8 turns |
| **Direct Prompt Execution** | `POST /api/gemini/generate` | `gemini-3.8-flash` | `gemini-3.1-flash-lite` | Search Grounding toggle, Temperature: 0.4 |
| **Task Execution Engine** | `POST /api/agent/task/execute` | Agent `preferredModel` | `gemini-3.8-flash`, `gemini-3.1-flash-lite` | Tool Calling schemas enforced via Zod |
| **Approval Execution** | `POST /api/approval/execute` | Ledger / Nexus verification | N/A (Cryptographic receipt SHA-256) | Deterministic review gate |
| **RAG Retrieval Engine** | `POST /api/rag/query` | Hybrid BM25 + Cosine TF-IDF | In-memory token store | Top-K: 4, Relevance threshold: 0.15 |
| **AI Safety Guardrails** | `server/aiGovernance.ts` | Regex & Token Quota Gateway | N/A | Risk Threshold: 60/100, Script strip, HTML strip |

---

## 4. Token Limits, Quotas & Hardware Boundaries

### Organization Plan Quotas (`server/aiGovernance.ts`):
- **Free Tier:** 50,000 tokens/month
- **Starter Tier:** 250,000 tokens/month
- **Pro Tier:** 1,500,000 tokens/month
- **Business Tier:** 5,000,000 tokens/month
- **Enterprise Tier:** 25,000,000 tokens/month

### Hardware Profile Constraints (Dell Latitude 3340 — Intel Core i5-4200U, 8GB RAM):
- **Local Model Execution:** Local weight execution (e.g. Ollama/Llama 70B) is strictly prohibited on this dual-core CPU.
- **Provider API Offloading:** All model inference offloaded to Google Gemini cloud APIs, keeping server memory footprint under **85 MB RSS**.
- **Concurrency Guard:** Max concurrent benchmark evaluations capped at 3 requests to prevent socket exhaustion and rate-limit penalties.
