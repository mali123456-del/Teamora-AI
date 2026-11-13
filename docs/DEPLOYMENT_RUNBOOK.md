# TEAMORA AI — Production Deployment Runbook

1. **Pre-Deploy Verification (Mandatory):**
   - Ensure `npm run lint`, `npm test -- --run` (120/120), and `npm run build` pass cleanly.
   - Confirm `dist/` contains zero secret strings.
2. **Environment & Secrets Injection:**
   - Set `APP_ENV=production`, `NODE_ENV=production`, `PORT=3000`, `BILLING_MODE=sandbox` (or `live` ONLY with explicit owner approval + merchant keys), `ALLOWED_ORIGINS`, `GEMINI_API_KEY`, `SAAS_WEBHOOK_SECRET`.
3. **Firebase Rules Synchronization:**
   - Review `firestore.rules` and deploy explicitly using `deploy_firebase` only after approval.
4. **Boot Verification:**
   - Run `npm start` (`tsx server.ts`). Inspect startup log `[TEAMORA_BOOT]` for `blockers=0`.
   - Verify `GET /api/status` returns `200 OK` with `version: "2.5.0"` and `memoryRssMb`.
5. **Rollback Procedure:**
   - Execute `POST /api/release/rollback` for feature-flag rollback OR shift Cloud Run traffic to prior immutable container revision.
