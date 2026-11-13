# TEAMORA AI — Production Go-Live Checklist

| Gate | Requirement | Status |
|---|---|---|
| **1. Build & Type Safety** | `npm run lint` (0 errors) & `vite build` pass | **VERIFIED** |
| **2. Automated Test Suite** | `npm test -- --run` (120 / 120 passed) | **VERIFIED** |
| **3. Bundle Secret Hygiene** | Zero secret variables leaked into `dist/` | **VERIFIED** |
| **4. Environment Separation** | Provision isolated `STAGING_FIREBASE_PROJECT_ID` | **CONFIGURATION REQUIRED** |
| **5. Secrets Injection** | Set `GEMINI_API_KEY`, `SAAS_WEBHOOK_SECRET`, `ALLOWED_ORIGINS` via Secret Manager | **CONFIGURATION REQUIRED** |
| **6. Billing Safety Gate** | Keep `BILLING_MODE=sandbox` until merchant keys & user approval | **REQUIRES USER APPROVAL** |
| **7. Firestore Rules Sync** | Deploy `firestore.rules` explicitly via `deploy_firebase` | **REQUIRES USER APPROVAL** |
| **8. Backup & Export Verification** | Checksummed snapshot + JSON/CSV export verified | **VERIFIED** |
| **9. Incident & Rollback** | Feature-flag rollback + Operations Console ready | **VERIFIED** |
| **10. Go-Live Authorization** | Maintainer sign-off prior to external deployment | **REQUIRES USER APPROVAL** |
