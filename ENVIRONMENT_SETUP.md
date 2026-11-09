# TEAMORA AI — Environment Setup & Configuration

## 1. Prerequisites

- **Node.js**: v20+ or v22+
- **Package Manager**: npm or bun
- **Google AI Studio Account**: For Gemini API key access
- **Firebase Project**: Configured for Cloud Firestore & Firebase Auth

---

## 2. Environment Variables

Create `.env` (or configure via AI Studio Secrets Panel):

```bash
# GEMINI_API_KEY: Required for autonomous multi-agent reasoning, search grounding, and chat
# Users configure this via the Secrets panel in AI Studio UI.
GEMINI_API_KEY="AIzaSy..."

# APP_URL: Current hosting origin for self-referential links & callbacks
APP_URL="https://your-domain.run.app"
```

---

## 3. Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Development server starts at:
# http://localhost:3000
```

---

## 4. Full-Stack Production Mode

```bash
# 1. Build client bundle
npm run build

# 2. Start Express full-stack production server
npm start
```

---

## 5. Firebase Configuration Setup

The applet reads configuration from `/firebase-applet-config.json`:

```json
{
  "projectId": "gen-lang-client-0255849452",
  "appId": "1:722583701874:web:b885495347f04f6bd475eb",
  "apiKey": "AIzaSyBUYuMR-BYRT-hjYaefyVAlynyv_9543f0",
  "authDomain": "gen-lang-client-0255849452.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-ef82aa0c-500c-4772-b17a-70d50299535a"
}
```

To deploy rules to your Firebase project:
```bash
# Firestore rules are deployed via the deploy_firebase tool
# firestore.rules -> Cloud Firestore
```
