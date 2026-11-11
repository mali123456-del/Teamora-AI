# TEAMORA AI — Canonical AI Employee Model Assignment Reconciliation
**Document:** `docs/AI_MODEL_ASSIGNMENT_RECONCILIATION.md`  
**Phase:** 301–340 Master Architecture  
**Status:** Approved & Canonical  
**Author:** Principal AI Systems Engineer & Model Optimization Architect  

---

## 1. Executive Summary

This document establishes the single authoritative model assignment mapping for all **15 canonical AI employees** across TEAMORA AI. Each assignment is based on rigorous empirical evaluation across reasoning depth, tool execution reliability, multilingual comprehension (Urdu, Roman Urdu, English), latency requirements, and compute cost optimization within our hardware constraints (Intel Core i5-4200U, <85MB memory footprint).

In accordance with TEAMORA AI governance, **zero automatic production reassignments occur without human-in-the-loop confirmation**. The system provides intelligent recommendations, risk-assessed fallbacks, and parameter-tuned profiles.

---

## 2. Master Employee-to-Model Assignment Matrix

| # | Agent ID | Agent Name | Department | Primary Model | Fallback Model | Optimal Temp | Max Tokens | Latency Profile | Cost Tier | Assigned Domain Focus |
|---|----------|------------|------------|---------------|----------------|--------------|------------|-----------------|-----------|------------------------|
| 1 | `workforce-manager` | **Atlas** | Leadership | `gemini-4-argon` | `gemini-3.8-flash` | 0.2 | 2,048 | 1,200ms | Premium | Strategic multi-agent decomposition, pipeline orchestration |
| 2 | `support-agent` | **Echo** | Customer | `gemini-3.8-flash` | `gemini-3.1-flash-lite` | 0.3 | 800 | 650ms | Standard | Empathetic support, ticket classification, Urdu FAQs |
| 3 | `sales-agent` | **Vanguard** | Revenue | `gemini-3.8-flash` | `gemini-3.1-flash-lite` | 0.4 | 1,024 | 700ms | Standard | Prospect qualification, objection handling, pitch drafting |
| 4 | `marketing-agent` | **Pulse** | Revenue | `gemini-3.8-flash` | `gemini-3.1-flash-lite` | 0.6 | 1,200 | 720ms | Standard | Campaign copy, SEO optimization, social engagement |
| 5 | `finance-agent` | **Ledger** | Finance | `gemini-3.8-flash` | `gemini-3.1-pro` | 0.0 | 1,024 | 680ms | Standard | Exact SaaS runway math, gross margin, invoice auditing |
| 6 | `analytics-agent` | **Prism** | Intelligence | `gemini-3.8-flash` | `gemini-3.1-pro` | 0.1 | 1,500 | 750ms | Standard | KPI trends, anomaly detection, cohort retention analysis |
| 7 | `inventory-agent` | **Stockwell** | Operations | `gemini-3.8-flash` | `gemini-3.1-flash-lite` | 0.0 | 600 | 600ms | Standard | Reorder point (ROP), SKU stockouts, supplier lead-times |
| 8 | `operations-agent` | **Nexus** | Operations | `gemini-3.8-flash` | `gemini-3.1-flash-lite` | 0.2 | 1,024 | 670ms | Standard | SLA monitoring, process bottleneck resolution, sync integrity |
| 9 | `research-agent` | **Scout** | Intelligence | `gemini-3.8-flash` | `gemini-3.1-pro` | 0.2 | 2,500 | 950ms | Standard | Grounded RAG synthesis, citation enforcement, competitive intel |
| 10 | `hr-agent` | **Harmony** | People | `gemini-3.8-flash` | `gemini-3.1-flash-lite` | 0.4 | 1,024 | 710ms | Standard | Employee onboarding, policy QA, sentiment pulse |
| 11 | `content-agent` | **Quill** | Productivity | `gemini-3.8-flash` | `gemini-3.1-flash-lite` | 0.7 | 2,048 | 850ms | Standard | Long-form articles, whitepapers, tone-calibrated memos |
| 12 | `email-agent` | **Courier** | Productivity | `gemini-3.1-flash-lite` | `gemini-3.8-flash` | 0.2 | 500 | 320ms | Ultra-Low | High-throughput notification dispatch, rapid triage |
| 13 | `project-manager` | **Chronos** | Leadership | `gemini-3.8-flash` | `gemini-4-argon` | 0.2 | 1,024 | 690ms | Standard | Sprint milestone tracking, critical path, Gantt dependencies |
| 14 | `document-agent` | **Scribe** | Productivity | `gemini-3.8-flash` | `gemini-3.1-pro` | 0.1 | 3,000 | 980ms | Standard | Contract extraction, structured JSON parsing, legal compliance |
| 15 | `workflow-agent` | **Synapse** | Operations | `gemini-3.8-flash` | `gemini-3.1-flash-lite` | 0.1 | 800 | 640ms | Standard | Automated trigger execution, webhook payload transformation |

---

## 3. Employee Specialization & Configuration Profiles

### 1. Atlas (`workforce-manager`) — Leadership
- **Model:** `gemini-4-argon` (Fallback: `gemini-3.8-flash`)
- **Reasoning Depth:** Maximum. High-dimensional planning over 2M token context.
- **Allowed Tools:** `orchestrate_pipeline`, `assign_agent`, `aggregate_reports`, `escalate_approval`
- **Approval Gate:** Bulk agent reassignment, system-wide configuration changes.
- **System Guardrail:** Must always generate explicit dependency DAGs before dispatching subtasks.

### 2. Echo (`support-agent`) — Customer
- **Model:** `gemini-3.8-flash` (Fallback: `gemini-3.1-flash-lite`)
- **Reasoning Depth:** Fast response with high empathy.
- **Allowed Tools:** `read_tickets`, `draft_reply`, `update_ticket_status`, `search_knowledge_base`
- **Approval Gate:** Customer refunds over $50, account cancellations.
- **Urdu Specialization:** Detects Urdu/Roman Urdu greetings and responds with natural warmth.

### 3. Vanguard (`sales-agent`) — Revenue
- **Model:** `gemini-3.8-flash` (Fallback: `gemini-3.1-flash-lite`)
- **Allowed Tools:** `score_lead`, `draft_pitch`, `schedule_demo`, `log_crm_activity`
- **Approval Gate:** Enterprise contract discounts exceeding 15%.

### 4. Pulse (`marketing-agent`) — Revenue
- **Model:** `gemini-3.8-flash` (Fallback: `gemini-3.1-flash-lite`)
- **Allowed Tools:** `generate_campaign_copy`, `analyze_keywords`, `schedule_post`
- **Approval Gate:** Ad spend allocation changes, public announcement publishing.

### 5. Ledger (`finance-agent`) — Finance
- **Model:** `gemini-3.8-flash` (Fallback: `gemini-3.1-pro`)
- **Determinism:** `temperature: 0.0`. Zero hallucination tolerance.
- **Allowed Tools:** `audit_invoice`, `calculate_runway`, `reconcile_ledger`, `generate_financial_statement`
- **Approval Gate:** Wire transfers, disbursements over $500, tax adjustments.

### 6. Prism (`analytics-agent`) — Intelligence
- **Model:** `gemini-3.8-flash` (Fallback: `gemini-3.1-pro`)
- **Allowed Tools:** `query_bi_metrics`, `detect_anomalies`, `generate_trend_chart`
- **Approval Gate:** Deletion or archiving of historical telemetry logs.

### 7. Stockwell (`inventory-agent`) — Operations
- **Model:** `gemini-3.8-flash` (Fallback: `gemini-3.1-flash-lite`)
- **Allowed Tools:** `check_stock_levels`, `compute_reorder_point`, `draft_purchase_order`
- **Approval Gate:** Purchase orders exceeding $1,000.

### 8. Nexus (`operations-agent`) — Operations
- **Model:** `gemini-3.8-flash` (Fallback: `gemini-3.1-flash-lite`)
- **Allowed Tools:** `monitor_uptime`, `trigger_failover`, `check_sync_queue`
- **Approval Gate:** Production service restarts or node teardowns.

### 9. Scout (`research-agent`) — Intelligence
- **Model:** `gemini-3.8-flash` (Fallback: `gemini-3.1-pro`)
- **Grounded Verification:** Strict citations `[Source X]` required on all claims.
- **Allowed Tools:** `vector_search`, `fetch_web_grounding`, `synthesize_literature`
- **Approval Gate:** Access to restricted proprietary competitor dossiers.

### 10. Harmony (`hr-agent`) — People
- **Model:** `gemini-3.8-flash` (Fallback: `gemini-3.1-flash-lite`)
- **Allowed Tools:** `query_company_policy`, `schedule_interview`, `draft_offer_letter`
- **Approval Gate:** Offer letter compensation values, disciplinary records.

### 11. Quill (`content-agent`) — Productivity
- **Model:** `gemini-3.8-flash` (Fallback: `gemini-3.1-flash-lite`)
- **Allowed Tools:** `generate_draft`, `refine_tone`, `fact_check_draft`
- **Approval Gate:** External syndication release.

### 12. Courier (`email-agent`) — Productivity
- **Model:** `gemini-3.1-flash-lite` (Fallback: `gemini-3.8-flash`)
- **Performance Rationale:** Sub-350ms dispatch latency, 50% lower compute cost.
- **Allowed Tools:** `parse_incoming_email`, `draft_fast_reply`, `route_notification`
- **Approval Gate:** Outbound mass emails (>25 recipients).

### 13. Chronos (`project-manager`) — Leadership
- **Model:** `gemini-3.8-flash` (Fallback: `gemini-4-argon`)
- **Allowed Tools:** `update_sprint_board`, `recalculate_critical_path`, `flag_blocker`
- **Approval Gate:** Project deadline extensions > 14 days.

### 14. Scribe (`document-agent`) — Productivity
- **Model:** `gemini-3.8-flash` (Fallback: `gemini-3.1-pro`)
- **Allowed Tools:** `extract_document_entities`, `parse_pdf_tables`, `validate_contract_clauses`
- **Approval Gate:** Legal contract signature dispatch.

### 15. Synapse (`workflow-agent`) — Operations
- **Model:** `gemini-3.8-flash` (Fallback: `gemini-3.1-flash-lite`)
- **Allowed Tools:** `execute_webhook`, `map_payload_fields`, `retry_failed_job`
- **Approval Gate:** Modification of active webhook endpoints.

---

## 4. Hardware Safety & Fallback Routing

When system CPU load exceeds 85% on the Dell Latitude 3340 host or API rate limits trigger:
1. `gemini-4-argon` calls immediately fall back to `gemini-3.8-flash`.
2. `gemini-3.8-flash` non-critical tasks fall back to `gemini-3.1-flash-lite`.
3. Worker concurrency is strictly throttled to $\le 3$ simultaneous invocations.
4. Token budgets are clamped to prevent memory spikes.
