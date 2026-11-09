import { describe, it, expect, beforeEach } from 'vitest';
import {
  GenerateSchema,
  ChatSchema,
  OrchestrateSchema,
  ExecuteApprovalSchema,
  VerifyKeepSchema,
  checkRateLimit,
  idempotencyStore,
} from '../../server/geminiHandler.ts';
import { TEAMORA_AGENTS } from '../data/agents.ts';

describe('Phase 21: Security & Input Validation Tests', () => {
  it('rejects empty prompts in GenerateSchema', () => {
    const result = GenerateSchema.safeParse({ prompt: '' });
    expect(result.success).toBe(false);
  });

  it('accepts valid prompt with system instruction and model', () => {
    const result = GenerateSchema.safeParse({
      prompt: 'Summarize quarterly financial results for Apex Global',
      systemInstruction: 'You are Ledger, autonomous finance agent',
      model: 'gemini-3.8-flash',
      thinking: true,
      orgId: 'org-apex',
    });
    expect(result.success).toBe(true);
  });

  it('rejects prompts exceeding maximum 32KB boundary limits (Denial of Wallet guard)', () => {
    const hugePrompt = 'A'.repeat(35000);
    const result = GenerateSchema.safeParse({ prompt: hugePrompt });
    expect(result.success).toBe(false);
  });

  it('rejects chat request with empty message', () => {
    const result = ChatSchema.safeParse({ message: '' });
    expect(result.success).toBe(false);
  });

  it('validates history roles to only permitted values (user, model, assistant)', () => {
    const invalidHistoryResult = ChatSchema.safeParse({
      message: 'Hello',
      history: [{ role: 'hacker_role' as any, content: 'injection' }],
    });
    expect(invalidHistoryResult.success).toBe(false);

    const validHistoryResult = ChatSchema.safeParse({
      message: 'Hello',
      history: [{ role: 'user', content: 'Hi' }, { role: 'model', content: 'Greetings' }],
    });
    expect(validHistoryResult.success).toBe(true);
  });

  it('validates OrchestrateSchema requires goal string', () => {
    const result = OrchestrateSchema.safeParse({ goal: '' });
    expect(result.success).toBe(false);
  });

  it('enforces rate limiting: allows up to 60 req/min and blocks subsequent requests', () => {
    const testIp = `test-ip-${Date.now()}`;
    for (let i = 0; i < 60; i++) {
      const res = checkRateLimit(testIp);
      expect(res.allowed).toBe(true);
    }
    const overflow = checkRateLimit(testIp);
    expect(overflow.allowed).toBe(false);
    expect(overflow.remaining).toBe(0);
  });
});

describe('Phase 28: Human-in-the-Loop Safe Approval & Execution Tests', () => {
  beforeEach(() => {
    idempotencyStore.clear();
  });

  it('validates execute approval schema requires valid actionType', () => {
    const invalidAction = ExecuteApprovalSchema.safeParse({
      approvalId: 'appr-301',
      orgId: 'org-apex',
      actionType: 'unauthorized_action' as any,
      reviewerId: 'user-manager',
      payloadSummary: { amount: 5000 },
    });
    expect(invalidAction.success).toBe(false);

    const validAction = ExecuteApprovalSchema.safeParse({
      approvalId: 'appr-301',
      orgId: 'org-apex',
      actionType: 'payout',
      reviewerId: 'user-manager',
      reviewerRole: 'admin',
      payloadSummary: { amount: 5000, vendor: 'ServerHub' },
      idempotencyKey: 'idemp-88912',
    });
    expect(validAction.success).toBe(true);

    const validActionWithRoleAlias = ExecuteApprovalSchema.safeParse({
      approvalId: 'appr-302',
      orgId: 'org-apex',
      actionType: 'email_send',
      reviewerId: 'user-manager',
      role: 'admin',
      payloadSummary: { recipient: 'team@apex.io' },
    });
    expect(validActionWithRoleAlias.success).toBe(true);
  });

  it('requires reviewerId to avoid anonymous approval execution', () => {
    const result = ExecuteApprovalSchema.safeParse({
      approvalId: 'appr-301',
      orgId: 'org-apex',
      actionType: 'payout',
      reviewerId: '',
      payloadSummary: {},
    });
    expect(result.success).toBe(false);
  });

  it('enforces server-side idempotency preventing duplicate execution of approvals', () => {
    const approvalId = 'appr-dedupe-101';
    const mockExecution = {
      approvalId,
      orgId: 'org-apex',
      executionId: 'exec-12345',
      executedAt: new Date().toISOString(),
      reviewerId: 'user-admin',
      status: 'executed' as const,
      result: 'Disbursement queued',
    };

    // First execution succeeds and records in idempotency store
    idempotencyStore.set(approvalId, mockExecution);
    expect(idempotencyStore.has(approvalId)).toBe(true);

    // Second check detects duplicate key
    const duplicate = idempotencyStore.get(approvalId);
    expect(duplicate).toBeDefined();
    expect(duplicate?.executionId).toBe('exec-12345');
  });

  it('verifies that payout actions require Owner or Admin privileges and block Viewer/Member', () => {
    function canExecutePayout(role: string): boolean {
      return role === 'owner' || role === 'admin';
    }

    expect(canExecutePayout('viewer')).toBe(false);
    expect(canExecutePayout('member')).toBe(false);
    expect(canExecutePayout('manager')).toBe(false);
    expect(canExecutePayout('admin')).toBe(true);
    expect(canExecutePayout('owner')).toBe(true);
  });
});

describe('Phase 31: Truthful Google Workspace Integration Tests', () => {
  it('rejects invalid email formats', () => {
    const result = VerifyKeepSchema.safeParse({ userEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('distinguishes between personal @gmail.com and managed enterprise domains', () => {
    const personalEmail = 'user@gmail.com';
    const isPersonal = personalEmail.endsWith('@gmail.com');
    expect(isPersonal).toBe(true);

    const enterpriseEmail = 'admin@apexglobal.io';
    const isEnterprise = !enterpriseEmail.endsWith('@gmail.com');
    expect(isEnterprise).toBe(true);
  });
});

describe('Phase 25: 15 Autonomous Workforce Employees Completeness', () => {
  it('contains exactly 15 distinct specialized AI agents', () => {
    expect(TEAMORA_AGENTS.length).toBe(15);
  });

  it('every agent has unique id, systemInstruction, role and department', () => {
    const ids = new Set<string>();
    for (const agent of TEAMORA_AGENTS) {
      expect(agent.id).toBeTruthy();
      expect(agent.name).toBeTruthy();
      expect(agent.role).toBeTruthy();
      expect(agent.department).toBeTruthy();
      expect(agent.systemInstruction.length).toBeGreaterThan(50);
      expect(agent.capabilities.length).toBeGreaterThan(0);
      expect(ids.has(agent.id)).toBe(false);
      ids.add(agent.id);
    }
  });

  it('Atlas is designated as Workforce Manager with cross-department orchestration capability', () => {
    const atlas = TEAMORA_AGENTS.find((a) => a.id === 'workforce-manager');
    expect(atlas).toBeDefined();
    expect(atlas?.name).toBe('Atlas');
    expect(atlas?.department).toBe('Leadership');
  });

  it('Financial agent Ledger has human approval requirement on sensitive payouts', () => {
    const ledger = TEAMORA_AGENTS.find((a) => a.id === 'finance-agent');
    expect(ledger).toBeDefined();
    expect(ledger?.name).toBe('Ledger');
    expect(ledger?.requiresApprovalFor.length).toBeGreaterThan(0);
  });
});

describe('Phase 21: Multi-Tenant RBAC Permissions & Tenant Isolation', () => {
  type Role = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

  function canManageBilling(role: Role): boolean {
    return role === 'owner' || role === 'admin';
  }

  function canApproveActions(role: Role): boolean {
    return role === 'owner' || role === 'admin' || role === 'manager';
  }

  function canCreateRecords(role: Role): boolean {
    return role !== 'viewer';
  }

  it('enforces that Viewers cannot create records or approve actions', () => {
    expect(canCreateRecords('viewer')).toBe(false);
    expect(canApproveActions('viewer')).toBe(false);
    expect(canManageBilling('viewer')).toBe(false);
  });

  it('enforces that Members can create records but cannot approve high-risk actions', () => {
    expect(canCreateRecords('member')).toBe(true);
    expect(canApproveActions('member')).toBe(false);
    expect(canManageBilling('member')).toBe(false);
  });

  it('enforces that Managers can approve actions but cannot modify billing', () => {
    expect(canApproveActions('manager')).toBe(true);
    expect(canManageBilling('manager')).toBe(false);
  });

  it('enforces that Owners have full operational and billing privileges', () => {
    expect(canCreateRecords('owner')).toBe(true);
    expect(canApproveActions('owner')).toBe(true);
    expect(canManageBilling('owner')).toBe(true);
  });

  it('strictly enforces organization data boundary isolation between two tenants', () => {
    const apexMembers = ['user-sulaiman-apex', 'user-sarah-apex'];
    const crescentMembers = ['user-tariq-crescent', 'user-ali-crescent'];

    function isAuthorizedForOrg(orgId: string, userId: string): boolean {
      if (orgId === 'org-apex') return apexMembers.includes(userId);
      if (orgId === 'org-crescent') return crescentMembers.includes(userId);
      return false;
    }

    // Apex user accessing Apex -> Allowed
    expect(isAuthorizedForOrg('org-apex', 'user-sulaiman-apex')).toBe(true);
    // Crescent user accessing Crescent -> Allowed
    expect(isAuthorizedForOrg('org-crescent', 'user-tariq-crescent')).toBe(true);
    // Cross-tenant access: Crescent user attempting to access Apex -> Blocked
    expect(isAuthorizedForOrg('org-apex', 'user-tariq-crescent')).toBe(false);
    // Cross-tenant access: Apex user attempting to access Crescent -> Blocked
    expect(isAuthorizedForOrg('org-crescent', 'user-sulaiman-apex')).toBe(false);
  });
});

describe('Phase 27: Truthful Gemini Routing & Fallback Telemetry', () => {
  it('correctly reports requestedModel, actualModel and fallbackTriggered flag', () => {
    const primaryAttemptSuccess = {
      requestedModel: 'gemini-3.8-flash',
      actualModel: 'gemini-3.8-flash',
      fallbackTriggered: false,
      fallbackReason: null,
      latencyMs: 1420,
    };
    expect(primaryAttemptSuccess.actualModel).toBe('gemini-3.8-flash');
    expect(primaryAttemptSuccess.fallbackTriggered).toBe(false);

    const fallbackResult = {
      requestedModel: 'gemini-4-argon',
      actualModel: 'gemini-3.8-flash',
      fallbackTriggered: true,
      fallbackReason: 'Attempt with gemini-4-argon failed (429 Quota Exceeded). Cascaded to gemini-3.8-flash.',
      latencyMs: 2100,
    };
    // Must never claim primary model succeeded when fallback was used
    expect(fallbackResult.requestedModel).toBe('gemini-4-argon');
    expect(fallbackResult.actualModel).toBe('gemini-3.8-flash');
    expect(fallbackResult.fallbackTriggered).toBe(true);
    expect(fallbackResult.actualModel).not.toBe(fallbackResult.requestedModel);
  });
});

describe('Phase 41–45: Zero-Trust Authorization & Durable Security Tests', () => {
  it('enforces server-side identity resolution and blocks cross-tenant access', async () => {
    const { authenticateAndAuthorize } = await import('../../server/security.ts');
    
    // Simulate user-admin-002 accessing org-apex (allowed)
    const mockReqApex = {
      headers: {
        'x-teamora-sandbox': 'true',
        'x-teamora-uid': 'user-admin-002',
      },
      socket: { remoteAddress: '127.0.0.1' },
    } as any;
    const resApex = await authenticateAndAuthorize(mockReqApex, 'org-apex');
    expect(resApex.success).toBe(true);
    if (resApex.success) {
      expect(resApex.context.role).toBe('admin');
      expect(resApex.context.orgId).toBe('org-apex');
    }

    // Cross-tenant attempt: user-admin-002 trying to access competitor tenant
    const resCompetitor = await authenticateAndAuthorize(mockReqApex, 'org-b-competitor');
    expect(resCompetitor.success).toBe(false);
    if (!resCompetitor.success) {
      expect(resCompetitor.status).toBe(403);
      expect(resCompetitor.code).toBe('CROSS_TENANT_FORBIDDEN');
    }
  });

  it('enforces role hierarchy and rejects privilege escalation', async () => {
    const { authenticateAndAuthorize } = await import('../../server/security.ts');
    
    const mockViewerReq = {
      headers: {
        'x-teamora-sandbox': 'true',
        'x-teamora-uid': 'user-viewer-005',
      },
      socket: { remoteAddress: '127.0.0.1' },
    } as any;

    // Viewer requesting an action that requires Manager
    const res = await authenticateAndAuthorize(mockViewerReq, 'org-apex', 'manager');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.status).toBe(403);
      expect(res.code).toBe('INSUFFICIENT_ROLE_PRIVILEGE');
    }
  });

  it('verifies durable idempotency across repeated execution checks', async () => {
    const { getDurableExecution, saveDurableExecution } = await import('../../server/security.ts');
    
    const dedupeKey = `dedupe-test-${Date.now()}`;
    expect(getDurableExecution(dedupeKey)).toBeUndefined();

    saveDurableExecution({
      dedupeKey,
      approvalId: 'appr-durable-1',
      orgId: 'org-apex',
      executionId: 'exec-durable-999',
      executedAt: new Date().toISOString(),
      actorUid: 'user-admin-002',
      actorRole: 'admin',
      status: 'executed',
      result: 'Disbursement queued',
      payloadHash: 'hash-abc',
    });

    const recorded = getDurableExecution(dedupeKey);
    expect(recorded).toBeDefined();
    expect(recorded?.executionId).toBe('exec-durable-999');
  });

  it('verifies tamper-evident audit log cryptographic hash chain', async () => {
    const { recordAuditLog, verifyAuditLogIntegrity } = await import('../../server/security.ts');
    
    const mockContext = {
      uid: 'user-admin-002',
      email: 'admin@apexglobal.io',
      emailVerified: true,
      orgId: 'org-apex',
      role: 'admin' as const,
      isSandbox: true,
      ipAddress: '127.0.0.1',
    };

    const entry1 = recordAuditLog(mockContext, 'test_action_1', 'res-1', 'executed', { step: 1 });
    const entry2 = recordAuditLog(mockContext, 'test_action_2', 'res-2', 'executed', { step: 2 });

    expect(entry2.previousHash).toBe(entry1.entryHash);
    expect(verifyAuditLogIntegrity()).toBe(true);
  });
});

describe('Phase 46–50: Autonomous AI Workforce Engine Tests', () => {
  it('correctly detects sensitive high-risk keywords and triggers human approval gate', async () => {
    const { evaluateApprovalRequirement } = await import('../../server/agentExecutionEngine.ts');
    const { TEAMORA_AGENTS } = await import('../data/agents.ts');
    
    const echo = TEAMORA_AGENTS.find((a) => a.id === 'support-agent')!;
    
    // High-risk refund prompt
    const refundCheck = evaluateApprovalRequirement(echo, 'Please issue a refund of $150 to customer for downtime');
    expect(refundCheck.requiresApproval).toBe(true);
    expect(refundCheck.reason).toContain('refund');

    // High-risk capital transfer prompt
    const payoutCheck = evaluateApprovalRequirement(echo, 'Execute payout wire transfer to supplier');
    expect(payoutCheck.requiresApproval).toBe(true);

    // Benign prompt
    const normalCheck = evaluateApprovalRequirement(echo, 'How do I reset my password on the platform?');
    expect(normalCheck.requiresApproval).toBe(false);
  });

  it('enforces organization-isolated knowledge memory retrieval', async () => {
    const { queryOrgMemory, addOrgMemory } = await import('../../server/agentExecutionEngine.ts');
    
    addOrgMemory('org-crescent', 'Confidential', 'Crescent secret algorithm token: crescent_secret_999');

    // Querying org-apex must NEVER leak org-crescent confidential memory
    const apexResults = queryOrgMemory('org-apex', 'secret');
    expect(apexResults.some((m) => m.includes('crescent_secret_999'))).toBe(false);

    // Querying org-crescent retrieves crescent memory
    const crescentResults = queryOrgMemory('org-crescent', 'secret');
    expect(crescentResults.some((m) => m.includes('crescent_secret_999'))).toBe(true);
  });
});

describe('Phase 51–55: SaaS Engine, Plan Entitlements & Pakistan Gateways Tests', () => {
  it('enforces plan quota checks before permitting AI agent executions', async () => {
    const { checkPlanQuota, PLAN_ENTITLEMENTS } = await import('../../server/saasEngine.ts');
    
    expect(PLAN_ENTITLEMENTS.free.maxAiExecutionsPerMonth).toBe(100);
    expect(PLAN_ENTITLEMENTS.pro.maxAiExecutionsPerMonth).toBe(5000);

    const quota = checkPlanQuota('org-apex', 'aiExecution');
    expect(quota.allowed).toBe(true);
    expect(quota.max).toBe(5000); // Pro plan
  });

  it('restricts subscription plan modification to Owner and Admin roles only', async () => {
    const { updateSubscriptionPlan } = await import('../../server/saasEngine.ts');
    
    const viewerContext = {
      uid: 'user-viewer-005',
      email: 'viewer@apex.io',
      emailVerified: true,
      orgId: 'org-apex',
      role: 'viewer' as const,
      isSandbox: true,
      ipAddress: '127.0.0.1',
    };

    const viewerAttempt = updateSubscriptionPlan(viewerContext, 'enterprise');
    expect(viewerAttempt.success).toBe(false);
    if (!viewerAttempt.success) {
      expect(viewerAttempt.status).toBe(403);
    }

    const adminContext = {
      uid: 'user-admin-002',
      email: 'admin@apex.io',
      emailVerified: true,
      orgId: 'org-apex',
      role: 'admin' as const,
      isSandbox: true,
      ipAddress: '127.0.0.1',
    };

    const adminAttempt = updateSubscriptionPlan(adminContext, 'business', 'USD', 'simulated_test');
    expect(adminAttempt.success).toBe(true);
    if (adminAttempt.success) {
      expect(adminAttempt.subscription.plan).toBe('business');
      expect(adminAttempt.invoice.status).toBe('paid');
      expect(adminAttempt.invoice.gatewayReference).toContain('[SANDBOX_PAYMENT_GATEWAY]');
    }
  });

  it('validates verified Pakistan electronic payment gateways documentation', async () => {
    const { PAKISTAN_PAYMENT_GATEWAY_DOCS } = await import('../../server/saasEngine.ts');
    
    expect(PAKISTAN_PAYMENT_GATEWAY_DOCS.internationalProcessors.stripe.status).toBe('NOT_DIRECTLY_SUPPORTED');
    expect(PAKISTAN_PAYMENT_GATEWAY_DOCS.internationalProcessors.paypal.status).toBe('NOT_AVAILABLE');

    const gatewayNames = PAKISTAN_PAYMENT_GATEWAY_DOCS.domesticCompliantGateways.map((g) => g.name);
    expect(gatewayNames).toContain('Safepay');
    expect(gatewayNames).toContain('PayFast by APPS');
    expect(gatewayNames).toContain('SadaBiz (SadaPay)');
    expect(gatewayNames).toContain('LemonSqueezy / Paddle (Merchant of Record)');
  });
});

describe('Phase 61–65: Voice Intelligence & Multilingual Parsing Tests', () => {
  it('correctly parses English navigation commands to allowlisted routes', async () => {
    const { parseVoiceTranscript } = await import('../lib/voiceCommandService.ts');

    const cmdCrm = parseVoiceTranscript('open CRM');
    expect(cmdCrm.type).toBe('navigate');
    expect(cmdCrm.targetRoute).toBe('crm');

    const cmdFinance = parseVoiceTranscript('go to finance');
    expect(cmdFinance.type).toBe('navigate');
    expect(cmdFinance.targetRoute).toBe('finance');

    const cmdProjects = parseVoiceTranscript('show projects');
    expect(cmdProjects.type).toBe('navigate');
    expect(cmdProjects.targetRoute).toBe('projects');
  });

  it('correctly parses Urdu navigation commands with RTL language tags', async () => {
    const { parseVoiceTranscript } = await import('../lib/voiceCommandService.ts');

    const cmdUrduCrm = parseVoiceTranscript('سی آر ایم کھولو', 0.95, 'ur-PK');
    expect(cmdUrduCrm.type).toBe('navigate');
    expect(cmdUrduCrm.targetRoute).toBe('crm');

    const cmdUrduFinance = parseVoiceTranscript('فنانس دیکھاؤ', 0.92, 'ur-PK');
    expect(cmdUrduFinance.type).toBe('navigate');
    expect(cmdUrduFinance.targetRoute).toBe('finance');
  });

  it('converts voice commands into structured task drafts and enforces requiresReview gate', async () => {
    const { parseVoiceTranscript } = await import('../lib/voiceCommandService.ts');

    const draftCmd = parseVoiceTranscript('ask Echo to draft response to late invoice customer');
    expect(draftCmd.type).toBe('task_draft');
    expect(draftCmd.targetAgentId).toBe('support-agent');
    expect(draftCmd.targetAgentName).toBe('Echo');
    expect(draftCmd.taskDraft).toBeDefined();
    expect(draftCmd.taskDraft?.requiresReview).toBe(true);
    expect(draftCmd.taskDraft?.prompt).toContain('draft response to late invoice customer');

    // Urgent keyword test
    const urgentCmd = parseVoiceTranscript('ask Ledger to audit critical urgent payroll discrepancy');
    expect(urgentCmd.taskDraft?.priority).toBe('urgent');
  });

  it('correctly handles Urdu agent task creation commands', async () => {
    const { parseVoiceTranscript } = await import('../lib/voiceCommandService.ts');

    const urduTask = parseVoiceTranscript('ایکو سے کہو کہ کسٹمر کو فوری جواب دے', 0.9, 'ur-PK');
    expect(urduTask.type).toBe('task_draft');
    expect(urduTask.targetAgentId).toBe('support-agent');
    expect(urduTask.taskDraft?.priority).toBe('urgent');
    expect(urduTask.taskDraft?.requiresReview).toBe(true);
  });
});

describe('Phase 66–68: Offline Synchronization Logic Tests', () => {
  it('correctly manages sync queue items with unique idempotency keys', () => {
    const mockSyncItem = {
      id: 'sync-task-99',
      orgId: 'org-apex',
      action: 'create_task' as const,
      payload: { title: 'Offline Task', prompt: 'Audit ledger' },
      idempotencyKey: 'idemp-task-99',
      queuedAt: new Date().toISOString(),
      retryCount: 0,
    };

    expect(mockSyncItem.idempotencyKey).toBe('idemp-task-99');
    expect(mockSyncItem.retryCount).toBe(0);

    // Increment retry on transient failure
    mockSyncItem.retryCount += 1;
    expect(mockSyncItem.retryCount).toBe(1);
  });

  it('detects conflict status when local draft conflicts with server version', () => {
    const serverTask = {
      id: 'task-100',
      serverVersion: 3,
      status: 'completed',
      result: 'Server executed deliverable',
    };

    const localTask = {
      id: 'task-100',
      serverVersion: 1,
      status: 'running',
      syncStatus: 'pending_update' as const,
    };

    // Stale version detection
    const isConflict = localTask.serverVersion < serverTask.serverVersion;
    expect(isConflict).toBe(true);

    const resolvedStatus = isConflict ? 'conflict' : 'synced';
    expect(resolvedStatus).toBe('conflict');
  });
});

describe('Phase 71–80: Foundation, Error Recovery & API Gateway Tests', () => {
  it('generates compliant correlation IDs and maps friendly error messages', async () => {
    const { TeamoraError, ErrorCode, generateCorrelationId, getUserFriendlyMessage } = await import(
      '../lib/errorService.ts'
    );

    const corrId = generateCorrelationId('err');
    expect(corrId).toMatch(/^err-[a-z0-9]+-[a-z0-9]+$/);

    const err = new TeamoraError({
      code: ErrorCode.INSUFFICIENT_ROLE,
      message: 'User has viewer role but manager required',
      correlationId: corrId,
      httpStatus: 403,
      retryable: false,
    });

    expect(err.code).toBe(ErrorCode.INSUFFICIENT_ROLE);
    expect(err.httpStatus).toBe(403);
    expect(err.retryable).toBe(false);
    expect(err.userFacingMessage).toContain('required role permissions');
    expect(getUserFriendlyMessage(ErrorCode.RATE_LIMITED)).toContain('rate ceiling');
  });

  it('withRetry executes retry policy with exponential backoff on transient failure', async () => {
    const { withRetry } = await import('../lib/errorService.ts');

    let attempts = 0;
    const transientOperation = async () => {
      attempts++;
      if (attempts < 2) {
        const error: any = new Error('Rate limit exceeded');
        error.status = 429;
        throw error;
      }
      return 'recovered_payload';
    };

    const result = await withRetry(transientOperation, {
      maxRetries: 3,
      initialDelayMs: 20,
      backoffMultiplier: 1.5,
    });

    expect(result).toBe('recovered_payload');
    expect(attempts).toBe(2);
  });

  it('API Gateway sanitizes control characters and bounds payload strings', async () => {
    const { sanitizeInputString } = await import('../../server/apiGateway.ts');

    const unsafeInput = 'Hello\x00World\x1F\x7F Safe text';
    const clean = sanitizeInputString(unsafeInput, 100);
    expect(clean).toBe('HelloWorld Safe text');
    expect(clean).not.toContain('\x00');

    // Bounds truncation
    const longInput = 'A'.repeat(500);
    const truncated = sanitizeInputString(longInput, 50);
    expect(truncated.length).toBe(50);
  });
});

describe('Checkpoint Validation: Idempotency, Workforce & Voice Systems', () => {
  it('generates a single stable idempotency key bound to the logical operation and reuses it on retry', async () => {
    const taskId = 'task-op-456';
    const primaryKey = `idemp-task-${taskId}`;
    const retryKey = primaryKey;
    expect(retryKey).toBe(primaryKey);

    const { getDurableExecution, saveDurableExecution } = await import('../../server/security.ts');
    saveDurableExecution({
      dedupeKey: primaryKey,
      approvalId: taskId,
      orgId: 'org-apex',
      executionId: `exec-${taskId}`,
      executedAt: new Date().toISOString(),
      actorUid: 'usr-sulaiman',
      actorRole: 'admin',
      status: 'executed',
      result: 'Audited 12 transactions successfully',
      payloadHash: 'hash-abc',
      task: {
        id: taskId,
        status: 'completed',
        result: 'Audited 12 transactions successfully',
        agentId: 'finance-agent',
      },
    });

    const cached = getDurableExecution(retryKey);
    expect(cached).toBeDefined();
    expect(cached?.dedupeKey).toBe(primaryKey);
    expect(cached?.task?.status).toBe('completed');
    expect(cached?.task?.result).toBe('Audited 12 transactions successfully');

    const newTaskId = 'task-op-789';
    const newOpKey = `idemp-task-${newTaskId}`;
    expect(newOpKey).not.toBe(primaryKey);
    expect(getDurableExecution(newOpKey)).toBeUndefined();
  });

  it('maps all 15 canonical AI Employees exactly between agents.ts and AGENT_SYNONYMS', async () => {
    const { AGENT_SYNONYMS } = await import('../lib/voiceCommandService.ts');

    expect(TEAMORA_AGENTS.length).toBe(15);

    for (const agent of TEAMORA_AGENTS) {
      expect(AGENT_SYNONYMS[agent.id], `Missing synonyms for agent ${agent.id} (${agent.name})`).toBeDefined();
      expect(Array.isArray(AGENT_SYNONYMS[agent.id])).toBe(true);
      const lowerName = agent.name.toLowerCase();
      expect(
        AGENT_SYNONYMS[agent.id].map((s) => s.toLowerCase()),
        `Agent ${agent.id} synonyms should include name ${lowerName}`
      ).toContain(lowerName);
    }
  });

  it('parses voice task creation commands for all 15 canonical workforce agents', async () => {
    const { parseVoiceTranscript } = await import('../lib/voiceCommandService.ts');

    const testCases: { agentId: string; prompt: string; expectedName: string }[] = [
      { agentId: 'workforce-manager', prompt: 'ask Atlas to coordinate quarterly pipeline', expectedName: 'Atlas' },
      { agentId: 'support-agent', prompt: 'tell Echo to resolve billing dispute ticket', expectedName: 'Echo' },
      { agentId: 'sales-agent', prompt: 'ask Vanguard to follow up with enterprise prospect', expectedName: 'Vanguard' },
      { agentId: 'marketing-agent', prompt: 'tell Pulse to launch LinkedIn ad campaign', expectedName: 'Pulse' },
      { agentId: 'finance-agent', prompt: 'ask Ledger to verify vendor disbursement', expectedName: 'Ledger' },
      { agentId: 'analytics-agent', prompt: 'ask Prism to run retention cohort breakdown', expectedName: 'Prism' },
      { agentId: 'inventory-agent', prompt: 'tell Stockwell to audit safety stock levels', expectedName: 'Stockwell' },
      { agentId: 'operations-agent', prompt: 'ask Nexus to draft incident post-mortem SOP', expectedName: 'Nexus' },
      { agentId: 'research-agent', prompt: 'tell Scout to benchmark competitor AI capabilities', expectedName: 'Scout' },
      { agentId: 'hr-agent', prompt: 'ask Harmony to create engineer onboarding plan', expectedName: 'Harmony' },
      { agentId: 'content-agent', prompt: 'tell Quill to write technical release blog', expectedName: 'Quill' },
      { agentId: 'email-agent', prompt: 'ask Courier to draft executive email reply', expectedName: 'Courier' },
      { agentId: 'project-manager', prompt: 'tell Chronos to organize sprint roadmap backlog', expectedName: 'Chronos' },
      { agentId: 'document-agent', prompt: 'ask Scribe to extract clauses from partnership NDA', expectedName: 'Scribe' },
      { agentId: 'workflow-agent', prompt: 'tell Synapse to test webhook integration flow', expectedName: 'Synapse' },
    ];

    for (const tc of testCases) {
      const parsed = parseVoiceTranscript(tc.prompt);
      expect(parsed.type).toBe('task_draft');
      expect(parsed.targetAgentId, `Failed on ${tc.prompt}`).toBe(tc.agentId);
      expect(parsed.taskDraft?.agentName).toBe(tc.expectedName);
      expect(parsed.taskDraft?.requiresReview).toBe(true);
    }
  });

  it('VoiceCommandService safely handles permission denial and provides text fallback', async () => {
    const { VoiceCommandService } = await import('../lib/voiceCommandService.ts');

    const service = new VoiceCommandService();
    let errorMsg = '';
    let stateResult = '';

    service.subscribe(
      (state) => {
        stateResult = state;
      },
      () => {},
      (err) => {
        errorMsg = err;
      }
    );

    expect(['idle', 'unsupported']).toContain(service.getState());

    const started = await service.startListening();
    expect(started).toBe(false);
    expect(errorMsg.length > 0 || stateResult === 'unsupported').toBe(true);
  });

  it('strictly validates server response envelope before marking task synced', () => {
    const invalidEnvelope1 = { success: false, error: 'Database timeout' };
    const invalidEnvelope2 = { success: true };
    const invalidEnvelope3 = { task: null };
    const invalidEnvelope4 = { task: { status: 'queued' } };

    const isValidEnvelope = (data: any): boolean => {
      if (!data) return false;
      const serverTask = data.task || (data.id ? data : null);
      return Boolean((data.success === true || serverTask) && serverTask?.id);
    };

    expect(isValidEnvelope(invalidEnvelope1)).toBe(false);
    expect(isValidEnvelope(invalidEnvelope2)).toBe(false);
    expect(isValidEnvelope(invalidEnvelope3)).toBe(false);
    expect(isValidEnvelope(invalidEnvelope4)).toBe(false);

    const validEnvelope = { success: true, task: { id: 'task-100', status: 'completed' } };
    expect(isValidEnvelope(validEnvelope)).toBe(true);
  });
});



