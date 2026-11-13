# TEAMORA AI — Known Limitations & Operational Boundaries
**Document:** `docs/KNOWN_LIMITATIONS.md`  
**Milestone:** Phase 350 Release Documentation  
**Status:** Approved & Documented  

---

## 1. Overview

To maintain complete transparency and avoid unsupported claims, this document catalogs all known limitations, operational boundaries, and configuration requirements for TEAMORA AI v2.5.

---

## 2. Identified Operational Boundaries

### 2.1 Vertex AI Live Parameter Fine-Tuning
- **Limitation:** Automated parameter fine-tuning (Level 7) requires an external Google Cloud project with billing enabled for Vertex AI Pipelines.
- **Current State:** The system utilizes Level 1–5 optimizations (prompt system instruction calibration, few-shot exemplars, structured JSON schemas, and hybrid dense RAG). Parameter fine-tuning is documented and eligible, but not triggered in offline/developer sandbox environments.

### 2.2 Statistical Power on Low Sample Sizes
- **Limitation:** In the Benchmarking Lab, running 3 repetition cycles ($N = 3$) provides exploratory variance estimates ($df = 11$ in pilot mode, $df = 59$ in full mode), but does not constitute asymptotic statistical significance ($N \ge 30$ recommended for narrow confidence bands).
- **Mitigation:** The UI clearly flags runs with $N < 30$ as `Exploratory sample` and provides non-parametric empirical bootstrap bounds rather than assuming Gaussian distribution.

### 2.3 Web Speech API Browser Dependency
- **Limitation:** The `VoiceCommandService` relies on the browser's native Web Speech API (`webkitSpeechRecognition` or `SpeechRecognition`). In non-Chromium browsers (e.g. Firefox desktop) or environments where microphone permissions are denied, speech recognition is unavailable.
- **Mitigation:** The system provides graceful visual fallbacks and never crashes when the audio hardware or browser API is inaccessible.

### 2.4 Three.js WebGL Performance on Integrated Graphics
- **Limitation:** On Intel HD Graphics 4400, running the 3D Neural Core in `High Mode` with complex post-processing may cause frame drops below 45 FPS.
- **Mitigation:** The canvas defaults to `Standard Mode` and provides an `ECO Mode` (clamped DPR, 150 particles, zero post-processing) and a 2D canvas fallback, maintaining a steady 58–60 FPS.

### 2.5 In-Memory Historical Persistence
- **Limitation:** Benchmark execution history and approval requests are stored in-memory on the Node server process (`benchmarkRunHistory` and `assignmentApprovalsStore`). Restarting the Node server resets transient benchmark history unless synced with Firestore.
- **Mitigation:** Permanent business tasks, CRM records, and audit logs are persisted durably to Cloud Firestore.
