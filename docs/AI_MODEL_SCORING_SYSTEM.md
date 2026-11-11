# TEAMORA AI — Model Scoring System & Mathematical Formulation

**Product:** TEAMORA AI — Your AI Team. One Smart Workspace  
**Status:** Canonical Model Scoring System  
**Date:** 2026-11-11  

---

## 1. Weighted Overall Scoring Formula

The Overall Model Score $S_{overall}$ is computed as a weighted aggregate across 8 standard evaluation dimensions:

$$S_{overall} = \sum_{i=1}^{8} w_i \cdot S_i$$

Where weights $w_i$ are configured as:

| Dimension $i$ | Category | Default Weight $w_i$ | Calculation Formula |
|---|---|---|---|
| 1 | Accuracy | 25% | $\frac{\text{Correct Answers}}{\text{Total Evaluated}} \times 100$ |
| 2 | Reasoning & Math | 15% | $\frac{\text{Valid Logic Steps}}{\text{Total Steps}} \times 100$ |
| 3 | Instruction Following | 10% | $\frac{\text{Constraints Met}}{\text{Total Constraints}} \times 100$ |
| 4 | Reliability & Uptime | 10% | $\left(1 - \frac{\text{Errors + Timeouts}}{\text{Total Calls}}\right) \times 100$ |
| 5 | Tool & Agent Execution | 10% | $\frac{\text{Valid Schema Calls}}{\text{Total Attempted Calls}} \times 100$ |
| 6 | Grounding & Anti-Hallucination | 10% | $\left(1 - \frac{\text{Unsupported Claims}}{\text{Total Claims}}\right) \times 100$ |
| 7 | Speed & Latency Score | 10% | $\max\left(0, 100 - \frac{\text{P95 Latency (ms)}}{50}\right)$ |
| 8 | Cost Efficiency | 10% | $\max\left(0, 100 - \frac{\text{Cost per 1k Tasks (\USD)}}{0.05}\right)$ |

**Total Weight: 100%**

---

## 2. Specialized Task Profiles

In addition to the overall score, models are ranked according to specific operational profiles:

1. **Coding & Engineering Profile:**
   - Accuracy: 35%, Reasoning: 30%, Tool Execution: 20%, Speed: 15%.
2. **Real-Time Notification / Courier Profile:**
   - Speed: 40%, Cost Efficiency: 30%, Reliability: 20%, Accuracy: 10%.
3. **Strategic Orchestration & Enterprise Planning:**
   - Reasoning: 40%, Accuracy: 30%, Grounding: 20%, Reliability: 10%.
4. **Multilingual Urdu Operations:**
   - Multilingual Fidelity: 40%, Accuracy: 30%, Instruction Following: 20%, Speed: 10%.
