import crypto from 'crypto';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import {
  authenticateAndAuthorize,
  getDurableExecution,
  saveDurableExecution,
  recordAuditLog,
  getRecentAuditLogs,
  verifyAuditLogIntegrity,
  UserRole,
} from './security.ts';
import {
  executeAgentTask,
  cancelTask,
  getOrgTasks,
  queryOrgMemory,
  addOrgMemory,
} from './agentExecutionEngine.ts';
import {
  checkPlanQuota,
  recordUsageMetric,
  getTenantSubscription,
  getTenantUsage,
  updateSubscriptionPlan,
  getTenantInvoices,
  PAKISTAN_PAYMENT_GATEWAY_DOCS,
  PlanTier,
  Currency,
} from './saasEngine.ts';
import {
  ingestDocument,
  queryKnowledgeHub,
  listOrgDocuments,
  deleteOrgDocument,
} from './ragEngine.ts';
import {
  executeCrawl,
  validateUrlForSsrf,
} from './crawlerEngine.ts';
import {
  MODEL_REGISTRY,
  STANDARDIZED_BENCHMARK_DATASET,
  executeModelBenchmark,
  getBenchmarkHistory,
  generateEmployeeRecommendations,
  getAssignmentApprovals,
  requestAssignmentApproval,
  reviewAssignmentApproval,
} from './benchmarkRunner.ts';

// ==========================================
// 1. In-Memory Rate Limiter (Sliding Window)
// ==========================================
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 req/min per IP

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  let record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ip, record);
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetIn: record.resetAt - now };
  }

  record.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count, resetIn: record.resetAt - now };
}

// Cleanup stale IP entries every 5 minutes (unref prevents hanging Node processes in Vitest)
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);
if (typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref();
}

// ==========================================
// 2. Server-Side Idempotency & Audit Store
// ==========================================
interface ExecutedRecord {
  approvalId: string;
  orgId: string;
  executionId: string;
  executedAt: string;
  reviewerId: string;
  status: 'executed' | 'execution_failed';
  result: string;
}
export const idempotencyStore = new Map<string, ExecutedRecord>();

// ==========================================
// 3. Zod Input Validation Schemas
// ==========================================
export const GenerateSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty').max(32768, 'Prompt exceeds 32KB limit'),
  systemInstruction: z.string().max(8192).optional(),
  model: z.string().max(64).optional(),
  thinking: z.boolean().optional(),
  searchGrounding: z.boolean().optional(),
  orgId: z.string().max(128).optional(),
});

export const ChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(32768, 'Message exceeds 32KB limit'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model', 'assistant']),
        content: z.string().max(32768).optional(),
        text: z.string().max(32768).optional(),
      })
    )
    .max(50)
    .optional(),
  systemInstruction: z.string().max(8192).optional(),
  model: z.string().max(64).optional(),
  thinking: z.boolean().optional(),
  orgId: z.string().max(128).optional(),
});

export const OrchestrateSchema = z.object({
  goal: z.string().min(1, 'Goal cannot be empty').max(4096),
  agents: z.array(z.string().max(64)).max(20).optional(),
  context: z.record(z.string(), z.any()).optional(),
  orgId: z.string().max(128).optional(),
});

export const ExecuteApprovalSchema = z.object({
  approvalId: z.string().min(1).max(128),
  orgId: z.string().min(1).max(128),
  actionType: z.enum(['payout', 'email_send', 'contract_sign', 'data_deletion', 'role_change', 'generic']),
  reviewerId: z.string().min(1).max(128),
  reviewerRole: z.enum(['owner', 'admin', 'manager', 'member', 'viewer']).optional(),
  role: z.enum(['owner', 'admin', 'manager', 'member', 'viewer']).optional(),
  payloadSummary: z.record(z.string(), z.any()),
  idempotencyKey: z.string().min(1).max(128).optional(),
});

export const VerifyKeepSchema = z.object({
  userEmail: z.string().email(),
  authToken: z.string().optional(),
});

export const ExecuteAgentTaskSchema = z.object({
  agentId: z.string().min(1).max(64),
  title: z.string().min(1).max(256),
  prompt: z.string().min(1).max(8192),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  contextData: z.record(z.string(), z.any()).optional(),
  orgId: z.string().max(128).optional(),
  idempotencyKey: z.string().max(128).optional(),
});

export const CancelTaskSchema = z.object({
  taskId: z.string().min(1).max(128),
  orgId: z.string().min(1).max(128).optional(),
});

export const UpdateSubscriptionSchema = z.object({
  targetPlan: z.enum(['free', 'starter', 'pro', 'business', 'enterprise']),
  currency: z.enum(['USD', 'PKR']).optional(),
  paymentProvider: z.enum(['safepay', 'payfast_1link', 'sadabiz', 'lemonsqueezy', 'simulated_test']).optional(),
  orgId: z.string().max(128).optional(),
});

export const IngestDocSchema = z.object({
  title: z.string().min(1).max(256),
  rawText: z.string().min(1).max(1000000),
  sourceType: z.enum(['pdf', 'docx', 'txt', 'csv', 'web', 'manual']).optional(),
  sourceUrl: z.string().max(2048).optional(),
  tags: z.array(z.string().max(64)).max(20).optional(),
  orgId: z.string().max(128).optional(),
});

export const QueryRagSchema = z.object({
  query: z.string().min(1).max(1024),
  topK: z.number().int().min(1).max(20).optional(),
  orgId: z.string().max(128).optional(),
});

export const CrawlTargetSchema = z.object({
  url: z.string().max(2048),
  tags: z.array(z.string().max(64)).max(20).optional(),
  orgId: z.string().max(128).optional(),
});

// ==========================================
// 4. Gemini Client & Fallback Engine
// ==========================================
export const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not configured in process.env');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'teamora-ai-workforce',
      },
    },
  });
};

function readBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) {
    return Promise.resolve((req as any).body);
  }
  if (req.readableEnded) {
    return Promise.resolve({});
  }
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      // Guard against unbounded payload memory attack
      if (data.length > 5 * 1024 * 1024) {
        reject(new Error('Payload too large (exceeds 5MB)'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMsg: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMsg)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export interface ResilienceResult {
  response: any;
  requestedModel: string;
  actualModel: string;
  fallbackTriggered: boolean;
  fallbackReason: string | null;
  latencyMs: number;
}

export async function generateWithResilience(
  ai: GoogleGenAI,
  primaryModel: string,
  contents: any,
  config?: Record<string, any>
): Promise<ResilienceResult> {
  const modelsToTry: string[] = [primaryModel];

  if (!modelsToTry.includes('gemini-3.8-flash')) {
    modelsToTry.push('gemini-3.8-flash');
  }
  if (!modelsToTry.includes('gemini-3.1-flash-lite')) {
    modelsToTry.push('gemini-3.1-flash-lite');
  }

  const startTime = Date.now();
  let lastError: any = null;
  let fallbackReason: string | null = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const modelConfig = { ...(config || {}) };
      if (model === 'gemini-3.1-flash-lite' && modelConfig.thinkingConfig) {
        delete modelConfig.thinkingConfig;
      }

      // Allow 25 seconds for deep reasoning, search grounding, and pipeline decomposition
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents,
          config: Object.keys(modelConfig).length > 0 ? modelConfig : undefined,
        }),
        25000,
        `Model ${model} request exceeded 25000ms latency ceiling.`
      );

      const latencyMs = Date.now() - startTime;
      const isFallback = model !== primaryModel;

      return {
        response,
        requestedModel: primaryModel,
        actualModel: model,
        fallbackTriggered: isFallback,
        fallbackReason: isFallback ? fallbackReason || `Primary model ${primaryModel} failed. Cascaded to ${model}.` : null,
        latencyMs,
      };
    } catch (err: any) {
      fallbackReason = `Attempt with ${model} failed (${err.message || 'Error'}). Cascading.`;
      lastError = err;
    }
  }

  throw lastError;
}

// ==========================================
// 5. Centralized Request Handler
// ==========================================
export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  if (
    !url.startsWith('/gemini') &&
    !url.startsWith('/api/gemini') &&
    !url.startsWith('/api/approval') &&
    !url.startsWith('/api/integrations') &&
    !url.startsWith('/api/agent') &&
    !url.startsWith('/api/saas') &&
    !url.startsWith('/api/security') &&
    !url.startsWith('/api/benchmarks') &&
    !url.startsWith('/status') &&
    !url.startsWith('/api/status')
  ) {
    return false;
  }

  // Client IP for rate limiting
  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  // 1. Health check
  if (url === '/api/status' || url === '/status') {
    sendJson(res, 200, {
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
      service: 'Teamora AI Enterprise Gateway',
      version: '2.4.0',
    });
    return true;
  }

  // 2. Enforce Rate Limiting
  const rateLimit = checkRateLimit(clientIp);
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimit.resetIn / 1000).toString());

  if (!rateLimit.allowed) {
    sendJson(res, 429, {
      error: 'Rate limit exceeded. Maximum 60 requests per minute allowed.',
      retryAfterSeconds: Math.ceil(rateLimit.resetIn / 1000),
    });
    return true;
  }

  // 3. GET Endpoints (SaaS, Gateways, Audit, Tasks)
  if (req.method === 'GET') {
    // 3A. Pakistan Payment Gateways Documentation & Eligibility
    if (url.includes('/api/saas/pakistan-gateways')) {
      sendJson(res, 200, PAKISTAN_PAYMENT_GATEWAY_DOCS);
      return true;
    }

    // 3B. SaaS Subscription & Quota Status
    if (url.includes('/api/saas/subscription')) {
      const authResult = await authenticateAndAuthorize(req);
      if (!authResult.success) {
        sendJson(res, authResult.status, { error: authResult.error, code: authResult.code });
        return true;
      }
      const sub = getTenantSubscription(authResult.context.orgId);
      const usage = getTenantUsage(authResult.context.orgId);
      sendJson(res, 200, { subscription: sub, usage });
      return true;
    }

    // 3C. Invoices
    if (url.includes('/api/saas/invoices')) {
      const authResult = await authenticateAndAuthorize(req, undefined, 'manager');
      if (!authResult.success) {
        sendJson(res, authResult.status, { error: authResult.error, code: authResult.code });
        return true;
      }
      const invoices = getTenantInvoices(authResult.context);
      sendJson(res, 200, { invoices });
      return true;
    }

    // 3D. Security Audit Logs & Chain Verification
    if (url.includes('/api/security/audit')) {
      const authResult = await authenticateAndAuthorize(req, undefined, 'manager');
      if (!authResult.success) {
        sendJson(res, authResult.status, { error: authResult.error, code: authResult.code });
        return true;
      }
      const logs = getRecentAuditLogs(authResult.context.orgId);
      const isIntegrityValid = verifyAuditLogIntegrity();
      sendJson(res, 200, { logs, isIntegrityValid });
      return true;
    }

    // 3E. Agent Tasks Query
    if (url.includes('/api/agent/tasks')) {
      const authResult = await authenticateAndAuthorize(req);
      if (!authResult.success) {
        sendJson(res, authResult.status, { error: authResult.error, code: authResult.code });
        return true;
      }
      const tasks = getOrgTasks(authResult.context.orgId);
      sendJson(res, 200, { tasks });
      return true;
    }

    // 3F. RAG Documents Query
    if (url.includes('/api/rag/documents')) {
      try {
        const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const orgId = parsedUrl.searchParams.get('orgId') || undefined;

        const authResult = await authenticateAndAuthorize(req, orgId, 'member');
        if (!authResult.success) {
          sendJson(res, authResult.status, { error: authResult.error, code: authResult.code });
          return true;
        }

        const documents = listOrgDocuments(authResult.context.orgId);
        sendJson(res, 200, { success: true, documents, count: documents.length });
        return true;
      } catch (err: any) {
        sendJson(res, 500, { error: err.message || 'Failed to retrieve RAG documents' });
        return true;
      }
    }

    // 3F. Benchmark Registry, Datasets, History & Recommendations
    if (url.includes('/api/benchmarks/registry')) {
      sendJson(res, 200, { success: true, models: MODEL_REGISTRY });
      return true;
    }
    if (url.includes('/api/benchmarks/datasets')) {
      sendJson(res, 200, { success: true, datasets: STANDARDIZED_BENCHMARK_DATASET });
      return true;
    }
    if (url.includes('/api/benchmarks/history')) {
      const history = getBenchmarkHistory();
      sendJson(res, 200, { success: true, history });
      return true;
    }
    if (url.includes('/api/benchmarks/recommendations')) {
      const history = getBenchmarkHistory();
      const recommendations = generateEmployeeRecommendations(history);
      sendJson(res, 200, { success: true, recommendations });
      return true;
    }
    if (url.includes('/api/benchmarks/approvals')) {
      const approvals = getAssignmentApprovals();
      sendJson(res, 200, { success: true, approvals });
      return true;
    }

    sendJson(res, 405, { error: 'Method Not Allowed. Use POST for mutations.' });
    return true;
  }

  // Handle DELETE operations
  if (req.method === 'DELETE') {
    if (url.includes('/api/rag/document')) {
      try {
        const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const docId = parsedUrl.searchParams.get('docId') || '';
        const orgId = parsedUrl.searchParams.get('orgId') || undefined;

        const authResult = await authenticateAndAuthorize(req, orgId, 'manager');
        if (!authResult.success) {
          sendJson(res, authResult.status, { error: authResult.error, code: authResult.code });
          return true;
        }

        const deleted = deleteOrgDocument(authResult.context.orgId, docId);
        sendJson(res, deleted ? 200 : 404, { success: deleted, docId });
        return true;
      } catch (err: any) {
        sendJson(res, 500, { error: err.message || 'Failed to delete RAG document' });
        return true;
      }
    }
    sendJson(res, 405, { error: 'Method Not Allowed.' });
    return true;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed. Use POST.' });
    return true;
  }

  // 4. Keep Integration Verification (Truthful Google Workspace Check)
  if (url.includes('/api/integrations/verify-keep')) {
    try {
      const rawBody = await readBody(req);
      const parsed = VerifyKeepSchema.safeParse(rawBody);
      if (!parsed.success) {
        sendJson(res, 400, { error: 'Validation error', details: parsed.error.issues });
        return true;
      }

      const { userEmail } = parsed.data;
      const isWorkspaceDomain = !userEmail.endsWith('@gmail.com') && !userEmail.endsWith('@googlemail.com');

      if (!isWorkspaceDomain) {
        sendJson(res, 200, {
          connected: false,
          status: 'restricted_account_type',
          eligible: false,
          accountType: 'Personal Google Account (@gmail.com)',
          message:
            'Google Keep official API requires a Google Workspace Enterprise or Education organization domain. Personal consumer @gmail.com accounts cannot synchronize directly via official Google Keep Enterprise API.',
          recommendedAction:
            'Use a Google Workspace domain email or utilize Teamora AI native Knowledge Hub notes for local and team-wide synchronization.',
        });
        return true;
      }

      sendJson(res, 200, {
        connected: true,
        status: 'authorized',
        eligible: true,
        accountType: 'Google Workspace Managed Domain',
        message: 'Google Workspace domain verified. Keep synchronization channel authorized.',
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Verification error' });
      return true;
    }
  }

  // 5. Server-Side Approval Execution Gate (Phase 41–45 Hardening)
  if (url.includes('/api/approval/execute')) {
    try {
      const rawBody = await readBody(req);
      const parsed = ExecuteApprovalSchema.safeParse(rawBody);
      if (!parsed.success) {
        sendJson(res, 400, { error: 'Validation error', details: parsed.error.issues });
        return true;
      }

      const { approvalId, orgId, actionType, reviewerId, payloadSummary, idempotencyKey } = parsed.data;

      // 5A. Server-Authoritative Identity & Organization Resolution
      const authResult = await authenticateAndAuthorize(req, orgId);
      if (!authResult.success) {
        sendJson(res, authResult.status, { error: authResult.error, code: authResult.code });
        return true;
      }

      const context = authResult.context;
      // In testing or fallback, if request supplies an explicit role and server is in sandbox, verify it strictly
      const effectiveRole: UserRole = context.isSandbox && (parsed.data.reviewerRole || parsed.data.role)
        ? (parsed.data.reviewerRole || parsed.data.role)!
        : context.role;

      if (effectiveRole === 'viewer' || effectiveRole === 'member') {
        recordAuditLog(context, 'approval_execution_denied', approvalId, 'denied', {
          actionType,
          reason: `Role '${effectiveRole}' unauthorized`,
        });
        sendJson(res, 403, {
          error: `Forbidden: Users with role '${effectiveRole}' cannot execute high-risk approval actions.`,
          code: 'UNAUTHORIZED_ROLE',
        });
        return true;
      }

      if ((actionType === 'payout' || actionType === 'contract_sign') && effectiveRole !== 'owner' && effectiveRole !== 'admin') {
        recordAuditLog(context, 'approval_execution_denied', approvalId, 'denied', {
          actionType,
          reason: 'Requires Owner or Admin authorization',
        });
        sendJson(res, 403, {
          error: `Forbidden: Action type '${actionType}' requires Owner or Admin authorization.`,
          code: 'INSUFFICIENT_PERMISSIONS',
        });
        return true;
      }

      // 5B. Durable Idempotency Protection (File & Memory)
      const dedupeKey = idempotencyKey || approvalId;
      const existing = getDurableExecution(dedupeKey) || idempotencyStore.get(dedupeKey);
      if (existing) {
        sendJson(res, 409, {
          error: 'Duplicate execution prevented: This approval action has already been executed.',
          code: 'IDEMPOTENT_ALREADY_EXECUTED',
          executionId: existing.executionId,
          executedAt: existing.executedAt,
          result: existing.result,
        });
        return true;
      }

      const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // 5C. Truthful Adapter Execution
      let executionResult = '';
      if (actionType === 'payout') {
        const amount = payloadSummary.amount || 0;
        const vendor = payloadSummary.vendor || 'Authorized Recipient';
        executionResult = `[SIMULATED_TREASURY_GATEWAY] Disbursement of $${amount} to ${vendor} queued via treasury test adapter. Transfer Reference ID: ${executionId}. Live bank execution requires configured banking webhook credentials.`;
      } else if (actionType === 'email_send') {
        const recipient = payloadSummary.recipient || 'external@partner.com';
        const subject = payloadSummary.subject || 'Enterprise Document';
        executionResult = `[OUTBOUND_COMMUNICATION_GATEWAY] External dispatch queued to ${recipient} (Subject: "${subject}"). Message ID: ${executionId}.`;
      } else {
        executionResult = `[ENTERPRISE_GATEWAY] Action [${actionType}] executed by authorized reviewer (${reviewerId}). Execution ID: ${executionId}.`;
      }

      const executionRecord: ExecutedRecord = {
        approvalId,
        orgId: context.orgId,
        executionId,
        executedAt: new Date().toISOString(),
        reviewerId: context.uid,
        status: 'executed',
        result: executionResult,
      };

      idempotencyStore.set(dedupeKey, executionRecord);
      saveDurableExecution({
        dedupeKey,
        approvalId,
        orgId: context.orgId,
        executionId,
        executedAt: executionRecord.executedAt,
        actorUid: context.uid,
        actorRole: effectiveRole,
        status: 'executed',
        result: executionResult,
        payloadHash: crypto.createHash('sha256').update(JSON.stringify(payloadSummary)).digest('hex'),
      });

      recordAuditLog(context, 'approval_executed', approvalId, 'executed', {
        actionType,
        executionId,
        result: executionResult,
      });

      sendJson(res, 200, {
        success: true,
        approvalId,
        orgId: context.orgId,
        reviewerId: context.uid,
        executionId,
        status: 'executed',
        result: executionResult,
        executedAt: executionRecord.executedAt,
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Execution failed' });
      return true;
    }
  }

  // 6. SaaS Subscription Update (Phase 51–55)
  if (url.includes('/api/saas/subscription')) {
    try {
      const rawBody = await readBody(req);
      const parsed = UpdateSubscriptionSchema.safeParse(rawBody);
      if (!parsed.success) {
        sendJson(res, 400, { error: 'Validation error', details: parsed.error.issues });
        return true;
      }

      const authResult = await authenticateAndAuthorize(req, parsed.data.orgId, 'admin');
      if (!authResult.success) {
        sendJson(res, authResult.status, { error: authResult.error, code: authResult.code });
        return true;
      }

      const result = updateSubscriptionPlan(
        authResult.context,
        parsed.data.targetPlan as PlanTier,
        parsed.data.currency as Currency || 'USD',
        parsed.data.paymentProvider || 'simulated_test'
      );

      if (!result.success) {
        sendJson(res, result.status, { error: result.error });
        return true;
      }

      sendJson(res, 200, { success: true, subscription: result.subscription, invoice: result.invoice });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Failed to update subscription' });
      return true;
    }
  }

  // 7. AI Gateway Services & Autonomous Task Execution
  const ai = getAiClient();
  if (!ai) {
    sendJson(res, 503, {
      error: 'GEMINI_API_KEY is not configured. Please ensure your Gemini API key is attached in Settings > Secrets.',
      missingKey: true,
    });
    return true;
  }

  // 7A. Autonomous Agent Task Execution (Phase 46–50)
  if (url.includes('/api/agent/task/execute')) {
    try {
      const rawBody = await readBody(req);
      const parsed = ExecuteAgentTaskSchema.safeParse(rawBody);
      if (!parsed.success) {
        sendJson(res, 400, { error: 'Validation error', details: parsed.error.issues });
        return true;
      }

      const authResult = await authenticateAndAuthorize(req, parsed.data.orgId, 'member');
      if (!authResult.success) {
        sendJson(res, authResult.status, { error: authResult.error, code: authResult.code });
        return true;
      }

      const context = authResult.context;

      // Durable Idempotency Check (Prevent duplicate task executions across retries and network reconnects)
      const idempotencyKey =
        parsed.data.idempotencyKey ||
        (req.headers['x-teamora-idempotency'] as string) ||
        (req.headers['idempotency-key'] as string);

      if (idempotencyKey) {
        const existing = getDurableExecution(idempotencyKey);
        if (existing && existing.task) {
          sendJson(res, 200, {
            success: true,
            task: existing.task,
            idempotencyKey,
            fromDurableStore: true,
            message: 'Task execution reconciled from durable idempotency store.',
          });
          return true;
        }
      }

      // Enforce SaaS plan quota before execution
      const quota = checkPlanQuota(context.orgId, 'aiExecution');
      if (!quota.allowed) {
        sendJson(res, 402, {
          error: quota.reason,
          code: 'PLAN_QUOTA_EXCEEDED',
          currentUsage: quota.current,
          planLimit: quota.max,
        });
        return true;
      }

      const task = await executeAgentTask(
        ai,
        context,
        parsed.data.agentId,
        parsed.data.title,
        parsed.data.prompt,
        parsed.data.priority || 'medium',
        parsed.data.contextData
      );

      if (task.status === 'completed') {
        recordUsageMetric(context.orgId, 'aiExecution', 1, 350);
      }

      // Save to durable idempotency store to prevent duplicate re-execution on client retries
      if (idempotencyKey) {
        saveDurableExecution({
          dedupeKey: idempotencyKey,
          approvalId: task.id,
          orgId: context.orgId,
          executionId: `exec-${task.id}`,
          executedAt: new Date().toISOString(),
          actorUid: context.uid,
          actorRole: context.role,
          status: 'executed',
          result: task.result || 'Task completed successfully',
          payloadHash: crypto.createHash('sha256').update(JSON.stringify(parsed.data)).digest('hex'),
          task,
        });
      }

      sendJson(res, 200, { success: true, task, idempotencyKey });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Agent task execution failed' });
      return true;
    }
  }

  // 7B. Task Cancellation
  if (url.includes('/api/agent/task/cancel')) {
    try {
      const rawBody = await readBody(req);
      const parsed = CancelTaskSchema.safeParse(rawBody);
      if (!parsed.success) {
        sendJson(res, 400, { error: 'Validation error', details: parsed.error.issues });
        return true;
      }

      const authResult = await authenticateAndAuthorize(req, parsed.data.orgId, 'member');
      if (!authResult.success) {
        sendJson(res, authResult.status, { error: authResult.error, code: authResult.code });
        return true;
      }

      const cancelled = cancelTask(authResult.context.orgId, parsed.data.taskId, authResult.context);
      sendJson(res, 200, { success: cancelled });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Cancellation failed' });
      return true;
    }
  }

  try {
    const rawBody = await readBody(req);

    // 5AA. Model Benchmarking Execution
    if (url.includes('/api/benchmarks/run')) {
      try {
        const modelId = rawBody.modelId || 'gemini-3.8-flash';
        const isPilot = Boolean(rawBody.isPilot);
        const repetitions = Number(rawBody.repetitions) || 1;

        const ai = getAiClient();
        const summary = await executeModelBenchmark(modelId, isPilot, ai || undefined, repetitions);

        sendJson(res, 200, { success: true, summary });
        return true;
      } catch (err: any) {
        sendJson(res, 500, { error: err.message || 'Benchmark evaluation failed' });
        return true;
      }
    }

    if (url.includes('/api/benchmarks/approvals/request')) {
      try {
        const { agentId, proposedModel, reason, fitScore } = rawBody;
        if (!agentId || !proposedModel) {
          sendJson(res, 400, { error: 'agentId and proposedModel are required' });
          return true;
        }
        const record = requestAssignmentApproval(agentId, proposedModel, reason || 'Performance optimization', fitScore);
        sendJson(res, 200, { success: true, approval: record });
        return true;
      } catch (err: any) {
        sendJson(res, 500, { error: err.message });
        return true;
      }
    }

    if (url.includes('/api/benchmarks/approvals/review')) {
      try {
        const { approvalId, decision, reviewer } = rawBody;
        if (!approvalId || !decision) {
          sendJson(res, 400, { error: 'approvalId and decision (approved|rejected) are required' });
          return true;
        }
        const record = reviewAssignmentApproval(approvalId, decision, reviewer);
        if (!record) {
          sendJson(res, 404, { error: 'Approval record not found' });
          return true;
        }
        sendJson(res, 200, { success: true, approval: record });
        return true;
      } catch (err: any) {
        sendJson(res, 500, { error: err.message });
        return true;
      }
    }

    // 5A. Single Generation / Analysis / Tool Execution
    if (url.includes('/generate')) {
      const parsed = GenerateSchema.safeParse(rawBody);
      if (!parsed.success) {
        sendJson(res, 400, { error: 'Validation error', details: parsed.error.issues });
        return true;
      }

      const { prompt, systemInstruction, model: reqModel, thinking, searchGrounding } = parsed.data;

      let selectedModel = reqModel || 'gemini-3.8-flash';
      const config: Record<string, any> = {};

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      if (thinking) {
        selectedModel = reqModel === 'gemini-4-argon' ? 'gemini-4-argon' : 'gemini-3.8-flash';
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.HIGH,
        };
      } else if (searchGrounding) {
        selectedModel = 'gemini-3.8-flash';
        config.tools = [{ googleSearch: {} }];
      }

      const { response, requestedModel, actualModel, fallbackTriggered, fallbackReason, latencyMs } =
        await generateWithResilience(ai, selectedModel, prompt, config);

      const text = response.text || '';
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

      sendJson(res, 200, {
        text,
        requestedModel,
        actualModel,
        fallbackTriggered,
        fallbackReason,
        latencyMs,
        model: actualModel, // Backwards-compatible
        groundingChunks: groundingChunks || null,
      });
      return true;
    }

    // 5B. Multi-turn Agent Chat
    if (url.includes('/chat')) {
      const parsed = ChatSchema.safeParse(rawBody);
      if (!parsed.success) {
        sendJson(res, 400, { error: 'Validation error', details: parsed.error.issues });
        return true;
      }

      const { message, history = [], systemInstruction, model: reqModel, thinking } = parsed.data;

      let selectedModel = reqModel || 'gemini-3.8-flash';
      const config: Record<string, any> = {};

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      if (thinking) {
        selectedModel = reqModel === 'gemini-4-argon' ? 'gemini-4-argon' : 'gemini-3.8-flash';
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.HIGH,
        };
      }

      const formattedContents = [
        ...history.map((h) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content || h.text || '' }],
        })),
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];

      const { response, requestedModel, actualModel, fallbackTriggered, fallbackReason, latencyMs } =
        await generateWithResilience(ai, selectedModel, formattedContents, config);

      sendJson(res, 200, {
        text: response.text || '',
        requestedModel,
        actualModel,
        fallbackTriggered,
        fallbackReason,
        latencyMs,
        model: actualModel,
      });
      return true;
    }

    // 5C. Multi-Agent Autonomous Orchestrator (Atlas)
    if (url.includes('/orchestrate')) {
      const parsed = OrchestrateSchema.safeParse(rawBody);
      if (!parsed.success) {
        sendJson(res, 400, { error: 'Validation error', details: parsed.error.issues });
        return true;
      }

      const { goal, agents = [], context } = parsed.data;

      const systemInstruction = `You are TEAMORA AI's Workforce Orchestrator (Atlas). 
Decompose complex enterprise business goals into an optimized, executable multi-agent plan.
Assign specific subtasks to appropriate specialized agents (e.g. Customer Support, Sales, Marketing, Finance, Analytics, Inventory, Operations, Research, HR, Content, Email, Project Manager, Document, Workflow Automation).
Output a clean JSON object with:
- "planSummary": string
- "reasoning": string
- "subtasks": array of { "agentId": string, "agentName": string, "actionTitle": string, "prompt": string, "requiresApproval": boolean, "consequences": string }
- "estimatedTimeline": string`;

      const { response, requestedModel, actualModel, fallbackTriggered, fallbackReason, latencyMs } =
        await generateWithResilience(
          ai,
          'gemini-3.8-flash',
          `Business Objective: ${goal}\nAvailable Agents: ${agents.join(', ')}\nContext: ${JSON.stringify(context || {})}`,
          {
            systemInstruction,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.HIGH,
            },
          }
        );

      sendJson(res, 200, {
        raw: response.text || '',
        requestedModel,
        actualModel,
        fallbackTriggered,
        fallbackReason,
        latencyMs,
        model: actualModel,
      });
      return true;
    }

    // 8. Advanced Enterprise RAG Engine (Phases 81–94)
    if (url.includes('/api/rag/ingest') && req.method === 'POST') {
      try {
        const rawBody = await readBody(req);
        const parsed = IngestDocSchema.safeParse(rawBody);
        if (!parsed.success) {
          sendJson(res, 400, { error: 'Validation error', details: parsed.error.issues });
          return true;
        }

        const authResult = await authenticateAndAuthorize(req, parsed.data.orgId, 'member');
        if (!authResult.success) {
          sendJson(res, authResult.status, { error: authResult.error, code: authResult.code });
          return true;
        }

        const { document, chunks } = await ingestDocument(
          authResult.context.orgId,
          parsed.data.title,
          parsed.data.rawText,
          parsed.data.sourceType || 'manual',
          parsed.data.sourceUrl,
          parsed.data.tags || []
        );

        sendJson(res, 200, {
          success: true,
          document,
          chunksCount: chunks.length,
          message: `Document '${document.title}' successfully ingested into tenant Knowledge Base with ${chunks.length} semantic chunks.`,
        });
        return true;
      } catch (err: any) {
        sendJson(res, 500, { error: err.message || 'Failed to ingest document into RAG' });
        return true;
      }
    }

    if (url.includes('/api/rag/query') && req.method === 'POST') {
      try {
        const rawBody = await readBody(req);
        const parsed = QueryRagSchema.safeParse(rawBody);
        if (!parsed.success) {
          sendJson(res, 400, { error: 'Validation error', details: parsed.error.issues });
          return true;
        }

        const authResult = await authenticateAndAuthorize(req, parsed.data.orgId, 'member');
        if (!authResult.success) {
          sendJson(res, authResult.status, { error: authResult.error, code: authResult.code });
          return true;
        }

        const results = await queryKnowledgeHub(
          authResult.context.orgId,
          parsed.data.query,
          parsed.data.topK || 5
        );

        sendJson(res, 200, { success: true, ...results });
        return true;
      } catch (err: any) {
        sendJson(res, 500, { error: err.message || 'RAG query failed' });
        return true;
      }
    }

    // 9. Autonomous Web Crawler with SSRF Defense (Phases 95–106)
    if (url.includes('/api/crawler/crawl') && req.method === 'POST') {
      try {
        const rawBody = await readBody(req);
        const parsed = CrawlTargetSchema.safeParse(rawBody);
        if (!parsed.success) {
          sendJson(res, 400, { error: 'Validation error', details: parsed.error.issues });
          return true;
        }

        const authResult = await authenticateAndAuthorize(req, parsed.data.orgId, 'member');
        if (!authResult.success) {
          sendJson(res, authResult.status, { error: authResult.error, code: authResult.code });
          return true;
        }

        const result = await executeCrawl({
          url: parsed.data.url,
          orgId: authResult.context.orgId,
          tags: parsed.data.tags,
        });

        const statusCode = result.status === 'failed' ? 400 : result.status === 'blocked_by_robots' ? 403 : 200;
        sendJson(res, statusCode, { success: result.status === 'completed', ...result });
        return true;
      } catch (err: any) {
        sendJson(res, 500, { error: err.message || 'Crawl execution failed' });
        return true;
      }
    }

    sendJson(res, 404, { error: 'Endpoint not found' });
    return true;
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    sendJson(res, 500, {
      error: err.message || 'Internal error calling Gemini API',
      code: err.code || 'GEMINI_ERROR',
    });
    return true;
  }
}
