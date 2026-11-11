# TEAMORA AI — AI Employee Model Compatibility Matrix

**Product:** TEAMORA AI — Your AI Team. One Smart Workspace  
**Status:** Canonical 15-Employee Assignment & Compatibility Matrix  
**Date:** 2026-11-11  

---

## 1. 15 Canonical AI Employees Assignment Analysis

| Employee ID | Name | Role | Department | Current Assigned Model | Recommended Optimal Model | Fit Score | Key Rationale & Benchmark Evidence | Expected Speedup | Cost Impact |
|---|---|---|---|---|---|---|---|---|---|
| `workforce-manager` | **Atlas** | Workforce Manager & Lead Strategist | Leadership | `gemini-3.8-flash` | `gemini-4-argon` | **97%** | Strategic goal decomposition and multi-agent DAG task scheduling benefit from deep thinking reasoning and 2M token context. | Deep Thinking Mode | Enterprise Tier |
| `customer-support` | **Echo** | Customer Support Lead | Customer | `gemini-3.8-flash` | `gemini-3.8-flash` | **96%** | High empathy, Urdu/English multilingual intent recognition (98.2%), and fast ticket resolution (680ms). | Baseline (680ms) | $0.15 / 1M |
| `sales-representative` | **Vanguard** | Enterprise Sales Representative | Revenue | `gemini-3.8-flash` | `gemini-3.8-flash` | **95%** | Bespoke proposal drafting and CRM lead qualification with strict schema validation. | Baseline (690ms) | $0.15 / 1M |
| `marketing-specialist` | **Pulse** | Growth & Content Strategist | Revenue | `gemini-3.8-flash` | `gemini-3.8-flash` | **96%** | SEO copywriting, brand voice calibration, and campaign analytics interpretation. | Baseline (670ms) | $0.15 / 1M |
| `finance-agent` | **Ledger** | Autonomous Financial Controller | Finance | `gemini-3.8-flash` | `gemini-3.8-flash` | **99%** | 100% accuracy on mathematical runway and tiered discount calculations with ThinkingLevel.HIGH. | High Reasoning (890ms) | $0.15 / 1M |
| `data-analyst` | **Prism** | Senior Business Intelligence Analyst | Intelligence | `gemini-3.8-flash` | `gemini-3.8-flash` | **97%** | Structured SQL query synthesis, anomaly detection, and data trend interpretation. | Baseline (710ms) | $0.15 / 1M |
| `inventory-manager` | **Stockwell** | Autonomous Supply Chain Lead | Operations | `gemini-3.8-flash` | `gemini-3.8-flash` | **98%** | 100% deterministic accuracy on Reorder Point (ROP = 260 units) and SKU delta triggers. | Baseline (640ms) | $0.15 / 1M |
| `architect-agent` | **Nexus** | Principal Software Architect | Intelligence | `gemini-3.8-flash` | `gemini-4-argon` | **98%** | Complex TypeScript AST validation, AST type guards, and SQL injection vulnerability diagnosis. | Deep Thinking Mode | Enterprise Tier |
| `research-agent` | **Scout** | Global Research Intelligence Lead | Intelligence | `gemini-3.8-flash` | `gemini-3.8-flash` | **97%** | Native Google Search Grounding with web citation verification and anti-hallucination. | Grounded Mode (920ms) | $0.15 / 1M |
| `hr-coordinator` | **Harmony** | People Operations & Talent Lead | People | `gemini-3.8-flash` | `gemini-3.8-flash` | **95%** | Employee onboarding, policy synthesis, and internal communication workflows. | Baseline (650ms) | $0.15 / 1M |
| `copywriter-agent` | **Quill** | Senior Creative Copywriter | Revenue | `gemini-3.8-flash` | `gemini-3.8-flash` | **96%** | High-conversion ad copy, product descriptions, and bilingual Urdu-English slogans. | Baseline (660ms) | $0.15 / 1M |
| `courier-agent` | **Courier** | Dispatch & Notification Router | Operations | `gemini-3.1-flash-lite` | `gemini-3.1-flash-lite` | **98%** | Sub-400ms notification routing, event deduplication, and high-frequency webhook dispatch at 50% lower cost. | **+52% Faster (320ms)** | **-50% Savings** |
| `project-manager` | **Chronos** | Agile Delivery Lead & Scrum Master | Productivity | `gemini-3.8-flash` | `gemini-3.8-flash` | **96%** | Milestone tracking, Kanban backlog grooming, and autonomous workload rebalancing. | Baseline (680ms) | $0.15 / 1M |
| `legal-compliance` | **Scribe** | Legal & Regulatory Compliance Lead | Leadership | `gemini-3.8-flash` | `gemini-3.1-pro` | **96%** | Long contract NDA parsing, GDPR/SEC compliance auditing, and multi-document synthesis. | Analytical (1.1s) | $1.25 / 1M |
| `orchestration-core` | **Synapse** | Real-Time Neural Core Dispatcher | Operations | `gemini-3.8-flash` | `gemini-3.8-flash` | **97%** | 3D Neural Core state synchronization, agent status heartbeat, and tool call coordination. | Sub-second (540ms) | $0.15 / 1M |

---

## 2. Policy Enforcements

1. **Production Assignment Protection:** Model assignments are NOT changed automatically by benchmark runs without managerial authorization.
2. **Fallback Safety Guarantee:** If any agent's primary model experiences a timeout (>25s) or HTTP 429 quota exhaustion, `server/geminiHandler.ts` cascades deterministically to `gemini-3.8-flash` and `gemini-3.1-flash-lite`.
