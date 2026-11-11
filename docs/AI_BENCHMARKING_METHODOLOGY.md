# TEAMORA AI — Standardized AI Benchmarking Methodology

**Product:** TEAMORA AI — Your AI Team. One Smart Workspace  
**Status:** Canonical Benchmarking Methodology  
**Date:** 2026-11-11  

---

## 1. Principles of Fair & Reproducible Evaluation

1. **Equivalent Inputs & Prompts:** Every model receives the exact same system instructions, input prompts, and context under identical temperature conditions.
2. **Deterministic Verification:** Wherever possible, answers are graded using deterministic answer keys, regex assertions, JSON schema validators, and code syntax parsers.
3. **Separation of Retrieval & Generation:** For RAG tasks, retrieval accuracy (retrieved chunk relevance) is measured separately from generative synthesis.
4. **Tool Execution Verification:** A model only receives credit if the tool payload conforms to Zod schema definitions and would physically succeed; claims without execution receive a zero score.
5. **No Data Contamination:** The holdout test dataset is never shown in system prompts or used in prompt engineering tuning.
6. **Honest Outage Recording:** Provider rate limits or network timeouts are flagged as infrastructure events, separated from model cognitive errors.

---

## 2. Standard Benchmark Categories (8 Domains)

| Domain | Focus Areas | Evaluation Method | Key Metric |
|---|---|---|---|
| **A. General Intelligence** | Instruction following, summarization, entity extraction, logical consistency | Exact-match keywords, structural validation | Accuracy (%) |
| **B. Reasoning & Mathematics** | Arithmetic, algebra, multi-step financial logic, problem decomposition | Numeric answer key, step validity | Reasoning Score (%) |
| **C. Coding & Software Engineering** | TypeScript generation, bug detection, secure API consumption, syntax validity | TypeScript compiler AST & syntax parsing | Code Correctness (%) |
| **D. Research & Knowledge Retrieval** | RAG retrieval, citation verification, hallucination resistance | Source overlap, ground truth presence | Grounding Score (%) |
| **E. AI Agent & Tool Execution** | Tool selection, parameter schema validation, multi-step handoff | Zod schema validation, argument check | Tool Success Rate (%) |
| **F. Business Intelligence** | CRM lead scoring, inventory restock math, invoice ledger validation | Numerical tolerance (<0.1% delta) | BI Accuracy (%) |
| **G. Multilingual Performance** | Urdu, Roman Urdu, English-Urdu code-switching, translation preservation | Bilingual intent extraction & grammar | Multilingual Score (%) |
| **H. Long-Context Performance** | Needle-in-a-haystack retrieval across 100k+ tokens, cross-document coherence | Target token retrieval rate | Retrieval Recall (%) |

---

## 3. Execution Pipeline & Rate Limits

```
[Test Suite Dataset]
         ↓
[Concurrency Limiter (max 3 concurrent jobs)]
         ↓
[Token Budget Guard (< 20,000 tokens per run)]
         ↓
[Model API Call with Latency Timer (p50, p90, p95)]
         ↓
[Automated Evaluation & Error Classification]
         ↓
[Score Calculation & Firestore Incremental Storage]
```
