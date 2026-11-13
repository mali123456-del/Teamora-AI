# TEAMORA AI — Phase 351: Production Deployment Architecture

**Status:** VERIFIED COMPLETE  
**Milestone:** Batch 1 (Phase 351)

## 1. Runtime Topology

```
HTTPS Client (React 19 SPA / IndexedDB Sync)
   │
   ├── Firebase Auth & Cloud Firestore (Zero-Trust ABAC `firestore.rules`)
   │
   └── Express 4 + Vite 8 Full-Stack Runtime (Port 3000)
         ├── Security Headers & CORS Enforcement (`server.ts`, `server/envConfig.ts`)
         ├── Centralized API Gateway (`server/geminiHandler.ts`)
         │     ├── Rate Limiter (60 req/min/IP)
         │     ├── Server-Authoritative RBAC + Cross-Tenant Guard (`server/security.ts`)
         │     ├── Gemini Resilient Cascade (`gemini-3.8-flash` -> `gemini-3.1-flash-lite`)
         │     ├── Workforce / RAG / Crawler / Benchmark / SaaS Engines
         │     └── Operational Health, Telemetry, Backup & Release Controls
         └── Static Production Bundle (`dist/`)
```

## 2. Production Invariants
- Single HTTP server port `3000` with explicit startup environment validation via `validateServerEnvironment()`.
- `dist/` static assets served with `Cache-Control` separation from `/api/*` (`Cache-Control: no-store`).
- All AI inference, approval execution, and webhook secrets isolated strictly server-side.
