# TEAMORA AI — Model Optimization, Fine-Tuning & Training Strategy

**Product:** TEAMORA AI — Your AI Team. One Smart Workspace  
**Status:** Canonical Model Optimization & Training Policy  
**Date:** 2026-11-11  

---

## 1. Hierarchy of Optimization Activities

Before considering expensive or privacy-sensitive model fine-tuning, TEAMORA AI strictly follows a 7-stage optimization sequence:

```
Level 1: System Instruction & Persona Calibration (Zero Cost)
    ↓
Level 2: Few-Shot In-Context Demonstrations (Low Cost, High Impact)
    ↓
Level 3: Dynamic Context Window & Semantic RAG Retrieval Tuning
    ↓
Level 4: Structured Output & JSON Schema Constraint Enforcement
    ↓
Level 5: ThinkingLevel & Reasoning Parameter Tuning
    ↓
Level 6: Tool Routing & Multi-Agent Decomposition
    ↓
Level 7: Official Fine-Tuning (Only when justified by empirical failure of Levels 1–6)
```

---

## 2. Fine-Tuning Eligibility & Provider Verification

| Model | Fine-Tuning Support | Minimum Dataset | Supported Formats | Recommended Action |
|---|---|---|---|---|
| `gemini-3.8-flash` | Supported (Google Vertex AI / Gemini API Tuning) | 100 verified examples | JSONL (prompt/response pairs) | **Recommended for Domain-Specific Urdu/PKR accounting conventions** |
| `gemini-3.1-flash-lite` | Supported | 500 verified examples | JSONL | **Recommended for High-Frequency Notification Triage** |
| `gemini-4-argon` | Restricted / Custom Enterprise Engagement | N/A | Enterprise Pipeline | **Not recommended; prompt optimization provides superior ROI** |
| `gemini-3.1-pro` | Supported (Vertex AI) | 200 verified examples | JSONL | **Evaluate for Complex Legal/Compliance Document Extraction** |

---

## 3. Data Governance & Anonymization Rules

1. **Zero Secret Leakage:** No API keys, database credentials, or auth tokens in datasets.
2. **Zero PII Leakage:** All names, emails, and phone numbers in training datasets must be synthetic or hashed.
3. **No Cross-Tenant Leakage:** Data collected from Tenant A can NEVER be used to fine-tune a model accessible to Tenant B.
4. **Holdout Test Isolation:** Training datasets must maintain a 20% holdout set that the model never sees during training.
5. **Instant Rollback:** If post-optimization accuracy drops on any golden test case, system reverts immediately to baseline prompt/model.
