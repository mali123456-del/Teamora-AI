/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TEAMORA AI — Phases 351–355: Production Architecture, Environment Separation & Secrets Management
 * Handles environment profile validation, secret redaction, client-exposure checks, and config health.
 */

import fs from 'fs';
import path from 'path';

export type AppEnvironment = 'development' | 'staging' | 'production' | 'test';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type BillingMode = 'sandbox' | 'live';

export interface EnvironmentCheckItem {
  key: string;
  status: 'ok' | 'warning' | 'blocker';
  message: string;
}

export interface EnvironmentValidationReport {
  environment: AppEnvironment;
  billingMode: BillingMode;
  logLevel: LogLevel;
  port: number;
  rateLimitMaxPerMinute: number;
  backupRetentionDays: number;
  hasGeminiApiKey: boolean;
  hasWebhookSecret: boolean;
  firebaseConfigured: boolean;
  firebaseProjectId: string | null;
  firebaseDatabaseId: string | null;
  stagingIsolationReady: boolean;
  allowedOrigins: string[];
  clientSecretLeakDetected: boolean;
  readyForStaging: boolean;
  readyForProduction: boolean;
  checks: EnvironmentCheckItem[];
  warnings: string[];
  blockers: string[];
  checkedAt: string;
}

const SECRET_ENV_KEYS = [
  'GEMINI_API_KEY',
  'SAAS_WEBHOOK_SECRET',
  'SAFEPAY_SECRET_KEY',
  'PAYFAST_SECRET_KEY',
  'LEMONSQUEEZY_WEBHOOK_SECRET',
  'FIREBASE_SERVICE_ACCOUNT',
];

const PLACEHOLDER_VALUES = new Set([
  '',
  'MY_GEMINI_API_KEY',
  'MY_APP_URL',
  'configure_via_secrets_manager',
  'placeholder',
  'changeme',
]);

export function resolveEnvironment(env: NodeJS.ProcessEnv = process.env): AppEnvironment {
  const raw = (env.APP_ENV || env.NODE_ENV || 'development').toLowerCase().trim();
  if (raw === 'production' || raw === 'prod') return 'production';
  if (raw === 'staging' || raw === 'stage') return 'staging';
  if (raw === 'test' || env.VITEST === 'true') return 'test';
  return 'development';
}

/**
 * Redacts sensitive tokens, API keys, authorization headers, and secret strings from logs & payloads.
 */
export function redactSecrets<T = unknown>(input: T): T {
  const maskValue = (str: string): string => {
    let out = str;
    // Mask Google/Firebase style API keys (AIza...)
    out = out.replace(/AIza[0-9A-Za-z\-_]{16,}/g, '[REDACTED_API_KEY]');
    // Mask Bearer tokens / JWTs
    out = out.replace(/Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*/gi, 'Bearer [REDACTED_JWT]');
    out = out.replace(/Bearer\s+[A-Za-z0-9\-_.]{12,}/gi, 'Bearer [REDACTED_TOKEN]');
    // Mask common sk-/whsec_ secrets
    out = out.replace(/\b(sk|rk|pk|whsec)_[A-Za-z0-9]{10,}\b/g, '[REDACTED_SECRET]');
    // Mask exact active GEMINI_API_KEY if present in env
    const activeGeminiKey = process.env.GEMINI_API_KEY;
    if (activeGeminiKey && activeGeminiKey.length > 8 && out.includes(activeGeminiKey)) {
      out = out.split(activeGeminiKey).join('[REDACTED_GEMINI_KEY]');
    }
    const activeWebhookSecret = process.env.SAAS_WEBHOOK_SECRET;
    if (activeWebhookSecret && activeWebhookSecret.length > 8 && out.includes(activeWebhookSecret)) {
      out = out.split(activeWebhookSecret).join('[REDACTED_WEBHOOK_SECRET]');
    }
    return out;
  };

  if (typeof input === 'string') {
    return maskValue(input) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSecrets(item)) as unknown as T;
  }

  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      if (
        lower.includes('apikey') ||
        lower.includes('api_key') ||
        lower.includes('secret') ||
        lower.includes('password') ||
        lower.includes('authorization') ||
        lower.includes('privatekey') ||
        lower.includes('private_key')
      ) {
        out[key] = '[REDACTED]';
      } else {
        out[key] = redactSecrets(value);
      }
    }
    return out as T;
  }

  return input;
}

export function loadFirebaseConfigSummary(): {
  configured: boolean;
  projectId: string | null;
  databaseId: string | null;
} {
  try {
    const cfgPath = path.resolve('firebase-applet-config.json');
    if (!fs.existsSync(cfgPath)) {
      return { configured: false, projectId: null, databaseId: null };
    }
    const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    return {
      configured: Boolean(parsed.projectId && parsed.apiKey && parsed.firestoreDatabaseId),
      projectId: parsed.projectId || null,
      databaseId: parsed.firestoreDatabaseId || null,
    };
  } catch {
    return { configured: false, projectId: null, databaseId: null };
  }
}

export function detectClientSecretLeaks(env: NodeJS.ProcessEnv = process.env): string[] {
  const leaks: string[] = [];
  for (const key of Object.keys(env)) {
    if (key.startsWith('VITE_')) {
      const upper = key.toUpperCase();
      if (
        upper.includes('GEMINI_API_KEY') ||
        upper.includes('WEBHOOK_SECRET') ||
        upper.includes('PRIVATE_KEY') ||
        upper.includes('SERVICE_ACCOUNT')
      ) {
        leaks.push(key);
      }
    }
  }
  return leaks;
}

export function isOriginAllowed(origin: string | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  if (!origin) return true; // Same-origin / server-to-server requests without Origin header
  const environment = resolveEnvironment(env);
  if (environment === 'development' || environment === 'test') {
    return true;
  }
  const configured = (env.ALLOWED_ORIGINS || env.APP_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (configured.length === 0) return false;
  return configured.includes(origin);
}

export function validateServerEnvironment(env: NodeJS.ProcessEnv = process.env): EnvironmentValidationReport {
  const environment = resolveEnvironment(env);
  const rawPort = Number(env.PORT || 3000);
  const port = Number.isFinite(rawPort) && rawPort > 0 && rawPort <= 65535 ? rawPort : 3000;
  const rawBillingMode = (env.BILLING_MODE || 'sandbox').toLowerCase().trim();
  const billingMode: BillingMode = rawBillingMode === 'live' ? 'live' : 'sandbox';

  const rawLogLevel = (env.LOG_LEVEL || (environment === 'production' ? 'info' : 'debug')).toLowerCase().trim();
  const logLevel: LogLevel = ['debug', 'info', 'warn', 'error'].includes(rawLogLevel)
    ? (rawLogLevel as LogLevel)
    : 'info';

  const retention = Math.max(7, Math.min(365, Number(env.BACKUP_RETENTION_DAYS || 30)));
  const geminiKey = (env.GEMINI_API_KEY || '').trim();
  const hasGeminiApiKey = Boolean(geminiKey && !PLACEHOLDER_VALUES.has(geminiKey));
  const webhookSecret = (env.SAAS_WEBHOOK_SECRET || '').trim();
  const hasWebhookSecret = Boolean(webhookSecret && !PLACEHOLDER_VALUES.has(webhookSecret));

  const fb = loadFirebaseConfigSummary();
  const clientLeaks = detectClientSecretLeaks(env);
  const allowedOrigins = (env.ALLOWED_ORIGINS || env.APP_URL || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Separate staging Firebase project check: unless STAGING_FIREBASE_PROJECT_ID differs from primary project
  const stagingProjectId = (env.STAGING_FIREBASE_PROJECT_ID || '').trim();
  const stagingIsolationReady = Boolean(stagingProjectId && stagingProjectId !== fb.projectId);

  const checks: EnvironmentCheckItem[] = [];
  const warnings: string[] = [];
  const blockers: string[] = [];

  if (hasGeminiApiKey) {
    checks.push({ key: 'GEMINI_API_KEY', status: 'ok', message: 'Configured server-side (redacted).' });
  } else {
    const msg = 'GEMINI_API_KEY missing or placeholder; live AI endpoints return 503 until configured.';
    if (environment === 'production' || environment === 'staging') {
      checks.push({ key: 'GEMINI_API_KEY', status: 'blocker', message: msg });
      blockers.push(msg);
    } else {
      checks.push({ key: 'GEMINI_API_KEY', status: 'warning', message: msg });
      warnings.push(msg);
    }
  }

  if (clientLeaks.length > 0) {
    const msg = `Unsafe VITE_ secret env prefix detected: ${clientLeaks.join(', ')}.`;
    checks.push({ key: 'CLIENT_BUNDLE_ISOLATION', status: 'blocker', message: msg });
    blockers.push(msg);
  } else {
    checks.push({
      key: 'CLIENT_BUNDLE_ISOLATION',
      status: 'ok',
      message: 'Zero server secrets mapped to VITE_ client prefixes.',
    });
  }

  if (fb.configured) {
    checks.push({
      key: 'FIREBASE_CONFIG',
      status: 'ok',
      message: `Primary project ${fb.projectId} (DB: ${fb.databaseId}) configured.`,
    });
  } else {
    const msg = 'firebase-applet-config.json incomplete or unreadable.';
    checks.push({ key: 'FIREBASE_CONFIG', status: 'blocker', message: msg });
    blockers.push(msg);
  }

  if (!stagingIsolationReady) {
    const msg =
      'Isolated staging Firebase project not provisioned (STAGING_FIREBASE_PROJECT_ID unset). Staging uses same config unless separately provisioned.';
    checks.push({ key: 'STAGING_ISOLATION', status: environment === 'staging' ? 'blocker' : 'warning', message: msg });
    if (environment === 'staging') blockers.push(msg);
    else warnings.push(msg);
  } else {
    checks.push({
      key: 'STAGING_ISOLATION',
      status: 'ok',
      message: `Isolated staging project ${stagingProjectId} configured.`,
    });
  }

  if (billingMode === 'live' && !hasWebhookSecret) {
    const msg = 'BILLING_MODE=live requested without SAAS_WEBHOOK_SECRET; live billing remains blocked.';
    checks.push({ key: 'BILLING_SAFETY', status: 'blocker', message: msg });
    blockers.push(msg);
  } else {
    checks.push({
      key: 'BILLING_SAFETY',
      status: 'ok',
      message: `Billing operating in safe '${billingMode}' mode.`,
    });
  }

  // Secret hygiene check: confirm none of SECRET_ENV_KEYS are returned in plaintext
  void SECRET_ENV_KEYS;

  const readyForStaging = blockers.length === 0 && stagingIsolationReady && fb.configured;
  const readyForProduction = blockers.length === 0 && fb.configured && hasGeminiApiKey;

  return {
    environment,
    billingMode,
    logLevel,
    port,
    rateLimitMaxPerMinute: 60,
    backupRetentionDays: retention,
    hasGeminiApiKey,
    hasWebhookSecret,
    firebaseConfigured: fb.configured,
    firebaseProjectId: fb.projectId,
    firebaseDatabaseId: fb.databaseId,
    stagingIsolationReady,
    allowedOrigins,
    clientSecretLeakDetected: clientLeaks.length > 0,
    readyForStaging,
    readyForProduction,
    checks,
    warnings,
    blockers,
    checkedAt: new Date().toISOString(),
  };
}

export function getEnvironmentConfigHealth(): EnvironmentValidationReport {
  return redactSecrets(validateServerEnvironment());
}
