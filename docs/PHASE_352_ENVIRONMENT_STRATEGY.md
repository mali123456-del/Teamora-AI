# TEAMORA AI — Phase 352: Environment Separation Strategy

**Status:** CONFIGURATION REQUIRED (Staging Firebase Project Unprovisioned)  
**Milestone:** Batch 1 (Phase 352)

## 1. Environment Matrix (`server/envConfig.ts`)

| Profile | `APP_ENV` / `NODE_ENV` | CORS Enforcement | Billing Mode Default | Key & Firebase Expectations |
|---|---|---|---|---|
| **Development** | `development` | Relaxed local dev | `sandbox` | Local/sandbox mode permitted if key unset (returns 503 on live AI calls) |
| **Test** | `test` | Test runner | `sandbox` | Isolated test namespaces; no real charges or external webhooks |
| **Staging** | `staging` | `ALLOWED_ORIGINS` required | `sandbox` | Requires `GEMINI_API_KEY` + isolated `STAGING_FIREBASE_PROJECT_ID` |
| **Production** | `production` | `ALLOWED_ORIGINS` strict | Explicit config (`sandbox` until approved) | Requires `GEMINI_API_KEY`, secrets manager keys, production Firebase |

## 2. Current Staging Separation Finding
- `firebase-applet-config.json` currently targets project `gen-lang-client-0255849452` (`ai-studio-ef82aa0c-500c-4772-b17a-70d50299535a`).
- No separate `STAGING_FIREBASE_PROJECT_ID` is configured locally. `getEnvironmentConfigHealth()` explicitly flags `stagingIsolationReady: false` until an isolated staging Firebase project is provisioned by the administrator.
