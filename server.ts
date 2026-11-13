import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleApiRequest } from './server/geminiHandler.ts';
import { validateServerEnvironment, isOriginAllowed } from './server/envConfig.ts';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envReport = validateServerEnvironment();
console.log(
  `[TEAMORA_BOOT] env=${envReport.environment} billingMode=${envReport.billingMode} hasGeminiKey=${envReport.hasGeminiApiKey} firebase=${envReport.firebaseProjectId || 'none'} warnings=${envReport.warnings.length} blockers=${envReport.blockers.length}`
);
if (envReport.blockers.length > 0) {
  console.warn('[TEAMORA_BOOT_BLOCKERS]', envReport.blockers.join(' | '));
}

const app = express();
const port = envReport.port;

// Security headers & CORS origin enforcement for API routes
app.use('/api', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store');

  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  next();
});

// API routes handled by server-side geminiHandler
app.use('/api', async (req, res, next) => {
  const handled = await handleApiRequest(req, res);
  if (!handled) next();
});

// Serve Vite build output in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`TEAMORA AI server running on port ${port} (${envReport.environment})`);
});

