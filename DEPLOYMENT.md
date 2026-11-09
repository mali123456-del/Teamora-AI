# TEAMORA AI — Deployment & Release Manual

## 1. Hosting Architecture

TEAMORA AI is designed to deploy on Google Cloud Run or any containerized Node.js environment.

```
Client Traffic -> Cloud Run (HTTPS Load Balancer) -> Express Node Server -> Static Assets + API Routes
```

---

## 2. Production Build Commands

```bash
# 1. Clean previous builds
npm run clean

# 2. Compile client SPA bundle via Vite
npm run build

# 3. Verify TypeScript types
npm run lint

# 4. Run automated test suite
npm run test

# 5. Launch full-stack production server
npm start
```

---

## 3. Production Dockerfile Reference

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

EXPOSE 3000
CMD ["npm", "start"]
```

---

## 4. Rollback Strategy

1. **Firestore Rules:** Versioned in git (`firestore.rules`). Can be reverted and redeployed via `deploy_firebase` within seconds.
2. **Container Rollback:** Cloud Run supports instant revision traffic migration (revert traffic to previous revision hash with zero downtime).
