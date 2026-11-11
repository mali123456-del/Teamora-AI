# TEAMORA AI — UI Specification: AI Model Benchmarking Lab

**Module:** AI Model Benchmarking Lab  
**Path / Route:** `Platform & Governance → AI Model Benchmarking` (`id: 'benchmarks'`)  
**Design Tokens:** Warm Ivory (`#F5F1E9`), Deep Ink (`#211B2C`), Muted Lavender (`#8B5CF6`), Electric Lime (`#C7F36B`), Soft Coral (`#FF806E`)  
**Status:** Canonical UI/UX Specification  
**Date:** 2026-11-11  

---

## 1. Architectural Placement & Layout

The AI Model Benchmarking Lab resides under the **Governance & Growth** section of the primary navigation. It connects directly with the 15 AI Employees roster and `AppContext` data layer.

### Main Layout Grid:
- **Top Header:** Module title, active organization tag, total benchmark runs badge, execution runner trigger ("Run Standard Benchmark").
- **Metric Ribbon:**
  - Overall Benchmark Leader (`gemini-3.8-flash` / `gemini-4-argon`)
  - Evaluated Models (5 registered)
  - Average Fleet Accuracy (%)
  - Average Latency (p50 / p95)
  - Cost per 1,000 tasks
- **Sub-Navigation Tabs:**
  1. `Overview & Leaderboard`: Top model rankings, category breakdown, radar comparison.
  2. `Model Registry`: 5 registered models, version tags, token limits, pricing, fine-tuning eligibility.
  3. `Task Leaderboards`: Categorical breakdown (Coding, Reasoning, Urdu/Multilingual, RAG, Tool Execution, Business Intelligence).
  4. `AI Employee Compatibility`: 15 canonical employee assignment matrix with empirical fit score.
  5. `Error Analysis`: Failure classification (format errors, tool errors, timeout, hallucination).
  6. `Optimization & Tuning`: Prompt improvement vs fine-tuning advisory, rollback snapshots.
  7. `Benchmark Runner`: Interactive test runner with pilot vs full test suites and token budgets.

---

## 2. Component Design Standards (Anti-Slop Discipline)

- **Zero-Pill Discipline:** Key metrics and categories displayed with unboxed tabular numerals, hairline borders, and subtle typographic hierarchy.
- **Progress & Radar Bars:** Minimalistic hairline indicators (`h-1.5 rounded-full`) without garish gradients.
- **Direct Action Buttons:** Rebalance Fleet, Run Pilot Test, Export Report, Rollback Assignment.
- **Hardware-Aware Loading:** Asynchronous execution with cancellation button and live progress bar, preventing UI freeze.
