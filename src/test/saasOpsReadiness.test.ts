import { describe, it, expect, beforeEach } from 'vitest';
import {
  redactSecrets,
  validateServerEnvironment,
  detectClientSecretLeaks,
  isOriginAllowed,
} from '../../server/envConfig.ts';
import {
  recordTelemetryRequest,
  getRealRuntimeTelemetry,
  getStructuredLogs,
  triggerOrDeduplicateAlert,
  acknowledgeOperationalAlert,
  resolveOperationalAlert,
  createIncident,
  transitionIncidentState,
  resetObservabilityStateForTests,
} from '../../server/observabilityEngine.ts';
import {
  createBackupSnapshot,
  verifySnapshotIntegrity,
  verifyIsolatedRestore,
  exportTenantData,
  getSnapshotById,
  clearBackupStateForTests,
} from '../../server/backupRecoveryEngine.ts';
import {
  createTeamInvitation,
  acceptTeamInvitation,
  cancelTeamInvitation,
  revokeMemberAccess,
  archiveWorkspace,
  transferWorkspaceOwnership,
  getOrgDirectorySnapshot,
} from '../../server/organizationLifecycleEngine.ts';
import {
  enforceFeatureEntitlement,
  scheduleSubscriptionCancellation,
  signBillingWebhookPayload,
  verifyBillingWebhookSignature,
  processBillingWebhookEvent,
  updateSubscriptionPlan,
} from '../../server/saasEngine.ts';
import {
  createSupportTicket,
  listSupportTickets,
  updateSupportTicketStatus,
  generateRedactedBugReport,
  clearSupportTicketsForTests,
} from '../../server/supportEngine.ts';
import {
  listReleaseFeatureFlags,
  updateReleaseFlag,
  rollbackReleaseFlags,
  resetReleaseFlagsForTests,
} from '../../server/releaseConfig.ts';
import type { VerifiedSecurityContext } from '../../server/security.ts';

const ownerCtx: VerifiedSecurityContext = {
  uid: 'user-owner-001',
  email: 'owner@apexglobal.io',
  emailVerified: true,
  orgId: 'org-apex',
  role: 'owner',
  isSandbox: true,
  ipAddress: '127.0.0.1',
};

const adminCtx: VerifiedSecurityContext = {
  uid: 'user-admin-002',
  email: 'admin@apexglobal.io',
  emailVerified: true,
  orgId: 'org-apex',
  role: 'admin',
  isSandbox: true,
  ipAddress: '127.0.0.1',
};

const managerCtx: VerifiedSecurityContext = {
  uid: 'user-manager-003',
  email: 'manager@apexglobal.io',
  emailVerified: true,
  orgId: 'org-apex',
  role: 'manager',
  isSandbox: true,
  ipAddress: '127.0.0.1',
};

const memberCtx: VerifiedSecurityContext = {
  uid: 'user-member-004',
  email: 'member@apexglobal.io',
  emailVerified: true,
  orgId: 'org-apex',
  role: 'member',
  isSandbox: true,
  ipAddress: '127.0.0.1',
};

const competitorCtx: VerifiedSecurityContext = {
  uid: 'user-competitor-999',
  email: 'owner@competitor.io',
  emailVerified: true,
  orgId: 'org-b-competitor',
  role: 'owner',
  isSandbox: true,
  ipAddress: '127.0.0.1',
};

describe('Phases 351–355: Environment, Secrets Redaction & Origin Security', () => {
  it('redacts API keys, Bearer JWTs, and sensitive object keys recursively', () => {
    const raw = {
      geminiApiKey: 'AIzaSyFakeKeyValue1234567890abcd',
      authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.payload123.sig456',
      note: 'Secret leaked string AIzaSyAnotherLeakKey9876543210 inside prose',
    };
    const safe = redactSecrets(raw) as any;
    expect(safe.geminiApiKey).toBe('[REDACTED]');
    expect(safe.authorization).toBe('[REDACTED]');
    expect(safe.note).not.toContain('AIzaSyAnotherLeakKey');
    expect(safe.note).toContain('[REDACTED_API_KEY]');
  });

  it('detects unsafe VITE_ secret prefixes if misconfigured', () => {
    const clean = detectClientSecretLeaks({ VITE_PUBLIC_APP_NAME: 'Teamora' });
    expect(clean).toHaveLength(0);

    const leaked = detectClientSecretLeaks({ VITE_GEMINI_API_KEY: 'AIzaTest' });
    expect(leaked).toContain('VITE_GEMINI_API_KEY');
  });

  it('flags missing staging isolation honestly when STAGING_FIREBASE_PROJECT_ID is absent', () => {
    const report = validateServerEnvironment({ APP_ENV: 'staging', GEMINI_API_KEY: 'AIzaTestKey123456' });
    expect(report.environment).toBe('staging');
    expect(report.stagingIsolationReady).toBe(false);
    expect(report.readyForStaging).toBe(false);
  });

  it('enforces ALLOWED_ORIGINS strictly in production mode', () => {
    expect(
      isOriginAllowed('https://app.teamora.ai', {
        APP_ENV: 'production',
        ALLOWED_ORIGINS: 'https://app.teamora.ai',
      })
    ).toBe(true);
    expect(
      isOriginAllowed('https://evil.example.com', {
        APP_ENV: 'production',
        ALLOWED_ORIGINS: 'https://app.teamora.ai',
      })
    ).toBe(false);
  });
});

describe('Phases 356–360: Observability, Alert Deduplication & Incident Workflow', () => {
  beforeEach(() => {
    resetObservabilityStateForTests();
  });

  it('records redacted structured logs and calculates real RSS, error rate & p50/p95 latency', () => {
    recordTelemetryRequest({
      requestId: 'req-1',
      correlationId: 'corr-1',
      orgId: 'org-apex',
      endpoint: '/api/saas/subscription?token=AIzaSySecretToken123456789',
      method: 'GET',
      statusCode: 200,
      durationMs: 25,
    });
    recordTelemetryRequest({
      requestId: 'req-2',
      correlationId: 'corr-2',
      orgId: 'org-apex',
      endpoint: '/api/agent/task/execute',
      method: 'POST',
      statusCode: 500,
      durationMs: 120,
    });

    const telemetry = getRealRuntimeTelemetry();
    expect(telemetry.memory.rssMb).toBeGreaterThan(0);
    expect(telemetry.requests.totalRequests).toBe(2);
    expect(telemetry.requests.errorRequests).toBe(1);
    expect(telemetry.requests.p50LatencyMs).toBe(25);
    expect(telemetry.requests.p95LatencyMs).toBe(120);

    const logs = getStructuredLogs({ orgId: 'org-apex' });
    expect(logs.length).toBe(2);
    expect(JSON.stringify(logs)).not.toContain('AIzaSySecretToken');
  });

  it('deduplicates repeated operational alerts within window and supports ack/resolve', () => {
    const first = triggerOrDeduplicateAlert({
      ruleId: 'HIGH_ERROR_RATE',
      orgId: 'org-apex',
      title: 'High Error Rate',
      message: 'Spike 1',
      severity: 'high',
    });
    const second = triggerOrDeduplicateAlert({
      ruleId: 'HIGH_ERROR_RATE',
      orgId: 'org-apex',
      title: 'High Error Rate',
      message: 'Spike 2',
      severity: 'high',
    });

    expect(first.deduplicated).toBe(false);
    expect(second.deduplicated).toBe(true);
    expect(second.alert.occurrenceCount).toBe(2);

    const acked = acknowledgeOperationalAlert(first.alert.id, 'admin@apexglobal.io');
    expect(acked?.status).toBe('acknowledged');
    const resolved = resolveOperationalAlert(first.alert.id, 'admin@apexglobal.io');
    expect(resolved?.status).toBe('resolved');
  });

  it('enforces valid incident lifecycle transitions and blocks invalid state jumps', () => {
    const inc = createIncident({
      orgId: 'org-apex',
      title: 'Upstream Model Timeout Spike',
      severity: 'high',
      owner: 'admin@apexglobal.io',
    });
    expect(inc.state).toBe('DETECTED');

    const badJump = transitionIncidentState({
      incidentId: inc.id,
      targetState: 'CLOSED',
      actor: 'admin@apexglobal.io',
      note: 'Skip straight to closed',
    });
    expect(badJump.success).toBe(false);

    const inv = transitionIncidentState({
      incidentId: inc.id,
      targetState: 'INVESTIGATING',
      actor: 'admin@apexglobal.io',
      note: 'Checking latency logs',
    });
    expect(inv.success).toBe(true);
    const res = transitionIncidentState({
      incidentId: inc.id,
      targetState: 'RESOLVED',
      actor: 'admin@apexglobal.io',
      note: 'Fallback model mitigated timeouts',
      recoveryAction: 'Routed to gemini-3.1-flash-lite',
    });
    expect(res.success).toBe(true);
    const closed = transitionIncidentState({
      incidentId: inc.id,
      targetState: 'CLOSED',
      actor: 'owner@apexglobal.io',
      note: 'Post-incident review complete',
    });
    expect(closed.success).toBe(true);
  });
});

describe('Phases 361–365: Backup Integrity, Sandbox Restore & Tenant Data Export', () => {
  beforeEach(() => {
    clearBackupStateForTests();
  });

  it('creates checksummed immutable snapshots and detects payload tampering', () => {
    const snap = createBackupSnapshot(adminCtx, {
      organization: { id: 'org-apex', name: 'Apex Global', secretKey: 'should-be-stripped' },
      tasks: [{ id: 't1', orgId: 'org-apex', title: 'Audit Q3', status: 'completed' }],
    });

    expect(snap.checksumSha256).toHaveLength(64);
    expect((snap.payload.organization as any).secretKey).toBeUndefined();
    expect(verifySnapshotIntegrity(snap.snapshotId).valid).toBe(true);

    // Mutate stored payload to simulate corruption
    const stored = getSnapshotById(snap.snapshotId)!;
    stored.payload.tasks.push({ id: 'tampered', orgId: 'org-apex' });
    expect(verifySnapshotIntegrity(snap.snapshotId).valid).toBe(false);
  });

  it('performs isolated sandbox restore verification and blocks cross-tenant restores', () => {
    const snap = createBackupSnapshot(adminCtx, {
      organization: { id: 'org-apex', name: 'Apex Global' },
      tasks: [{ id: 't1', orgId: 'org-apex', title: 'Task 1' }],
      projects: [{ id: 'p1', orgId: 'org-apex', title: 'Project 1' }],
    });

    const crossTenant = verifyIsolatedRestore(competitorCtx, snap.snapshotId);
    expect(crossTenant.success).toBe(false);

    const verified = verifyIsolatedRestore(adminCtx, snap.snapshotId, 'sandbox-verify-test');
    expect(verified.success).toBe(true);
    if (verified.success) {
      expect(verified.report.passed).toBe(true);
      expect(verified.report.verifiedCounts.tasks).toBe(1);
      expect(verified.report.verifiedCounts.projects).toBe(1);
    }
  });

  it('exports JSON and CSV without sensitive fields, neutralizes CSV formulas, and enforces RBAC', () => {
    const blockedRole = exportTenantData(memberCtx, {}, 'json');
    expect(blockedRole.success).toBe(false);

    const blockedCrossTenant = exportTenantData(adminCtx, {}, 'json', 'org-b-competitor');
    expect(blockedCrossTenant.success).toBe(false);

    const csvRes = exportTenantData(
      managerCtx,
      {
        organization: { id: 'org-apex', name: 'Apex Global', passwordHash: 'secret_hash' },
        tasks: [{ id: 't1', orgId: 'org-apex', title: '=CMD|calc', status: 'queued' }],
      },
      'csv'
    );
    expect(csvRes.success).toBe(true);
    if (csvRes.success) {
      expect(csvRes.exportPackage.content).not.toContain('secret_hash');
      expect(csvRes.exportPackage.content).toContain("'=CMD|calc"); // CSV injection neutralized
    }
  });
});

describe('Phases 366–370: Org Lifecycle, Team Invitations, Entitlements & Billing Webhooks', () => {
  it('enforces invitation expiration, duplicate rejection, pre-auth denial, and revocation', () => {
    const inviteRes = createTeamInvitation(adminCtx, 'new.hire@apexglobal.io', 'manager', 24);
    expect(inviteRes.success).toBe(true);
    if (!inviteRes.success) return;

    // Duplicate pending invitation blocked
    const dupRes = createTeamInvitation(adminCtx, 'new.hire@apexglobal.io', 'member');
    expect(dupRes.success).toBe(false);

    // Pre-auth denial
    const unauthAccept = acceptTeamInvitation({
      orgId: 'org-apex',
      invitationId: inviteRes.invitation.invitationId,
      inviteToken: inviteRes.inviteToken,
      authenticatedUid: null,
      authenticatedEmail: null,
    });
    expect(unauthAccept.success).toBe(false);

    // Email mismatch blocked
    const mismatchAccept = acceptTeamInvitation({
      orgId: 'org-apex',
      invitationId: inviteRes.invitation.invitationId,
      inviteToken: inviteRes.inviteToken,
      authenticatedUid: 'uid-wrong',
      authenticatedEmail: 'other@apexglobal.io',
    });
    expect(mismatchAccept.success).toBe(false);

    // Valid acceptance succeeds
    const validAccept = acceptTeamInvitation({
      orgId: 'org-apex',
      invitationId: inviteRes.invitation.invitationId,
      inviteToken: inviteRes.inviteToken,
      authenticatedUid: 'uid-newhire-1',
      authenticatedEmail: 'new.hire@apexglobal.io',
    });
    expect(validAccept.success).toBe(true);

    // Revoke access cleanly
    const revoked = revokeMemberAccess(adminCtx, 'uid-newhire-1');
    expect(revoked.success).toBe(true);

    // Expired invitation rejected
    const expiredInvite = createTeamInvitation(adminCtx, 'expired.user@apexglobal.io', 'viewer', -1);
    expect(expiredInvite.success).toBe(true);
    if (expiredInvite.success) {
      const acceptExpired = acceptTeamInvitation({
        orgId: 'org-apex',
        invitationId: expiredInvite.invitation.invitationId,
        inviteToken: expiredInvite.inviteToken,
        authenticatedUid: 'uid-exp',
        authenticatedEmail: 'expired.user@apexglobal.io',
      });
      expect(acceptExpired.success).toBe(false);
    }

    // Cancel pending invite cleanly
    const cancelPending = createTeamInvitation(adminCtx, 'cancel.me@apexglobal.io', 'member', 24);
    expect(cancelPending.success).toBe(true);
    if (cancelPending.success) {
      const cancelled = cancelTeamInvitation(adminCtx, cancelPending.invitation.invitationId);
      expect(cancelled.success).toBe(true);
    }
  });

  it('requires Owner confirmation phrase for archival and permits data export even after cancellation', () => {
    const orgId = 'org-test-lifecycle';
    const subCtx: VerifiedSecurityContext = { ...ownerCtx, orgId };
    updateSubscriptionPlan(subCtx, 'pro', 'USD', 'simulated_test');
    expect(enforceFeatureEntitlement(orgId, 'orchestrator3d').allowed).toBe(true);

    scheduleSubscriptionCancellation(subCtx, true);
    expect(enforceFeatureEntitlement(orgId, 'orchestrator3d').allowed).toBe(false);
    expect(enforceFeatureEntitlement(orgId, 'auditExport').allowed).toBe(true);

    const exportAfterCancel = exportTenantData(subCtx, { organization: { id: orgId, name: 'Test Org' } }, 'json');
    expect(exportAfterCancel.success).toBe(true);

    const badArchive = archiveWorkspace(subCtx, 'WRONG PHRASE');
    expect(badArchive.success).toBe(false);
    const goodArchive = archiveWorkspace(subCtx, `ARCHIVE ${orgId}`);
    expect(goodArchive.success).toBe(true);
    expect(getOrgDirectorySnapshot(orgId).workspace.status).toBe('archived');
  });

  it('enforces HMAC-SHA256 webhook signature verification and idempotent event reconciliation', () => {
    const secret = 'test_webhook_secret_370';
    const payload = {
      eventId: 'evt-bill-001',
      eventType: 'invoice.paid' as const,
      orgId: 'org-apex',
    };
    const raw = JSON.stringify(payload);
    const validSig = signBillingWebhookPayload(raw, secret);

    expect(verifyBillingWebhookSignature(raw, 'bad_signature', secret)).toBe(false);
    expect(verifyBillingWebhookSignature(raw, validSig, secret)).toBe(true);

    const invalidWebhook = processBillingWebhookEvent(payload, raw, 'invalid', secret);
    expect(invalidWebhook.success).toBe(false);
    expect(invalidWebhook.status).toBe(401);

    const first = processBillingWebhookEvent(payload, raw, validSig, secret);
    expect(first.success).toBe(true);
    expect(first.deduplicated).toBe(false);
    expect(first.billingMode).toBe('sandbox');

    const replay = processBillingWebhookEvent(payload, raw, validSig, secret);
    expect(replay.success).toBe(true);
    expect(replay.deduplicated).toBe(true);
  });

  it('gates ownership transfer strictly to current Owner within same org', () => {
    const nonOwnerAttempt = transferWorkspaceOwnership(adminCtx, 'user-admin-002');
    expect(nonOwnerAttempt.success).toBe(false);
    const crossTenantAttempt = transferWorkspaceOwnership(ownerCtx, 'user-competitor-999');
    expect(crossTenantAttempt.success).toBe(false);
  });
});

describe('Phases 371–380: Support Operations, Multi-Persona Acceptance & Release Rollback', () => {
  beforeEach(() => {
    clearSupportTicketsForTests();
    resetReleaseFlagsForTests();
  });

  it('isolates support tickets by org, redacts secrets, and hides internal notes from members/viewers', () => {
    const created = createSupportTicket(memberCtx, {
      category: 'bug',
      severity: 'high',
      subject: 'Webhook issue with AIzaSyLeakedSecret123456',
      description: 'Bearer eyJhbGci.token.sig appeared in log',
    });
    expect(created.success).toBe(true);
    if (!created.success) return;
    expect(created.ticket.subject).not.toContain('AIzaSyLeakedSecret');

    updateSupportTicketStatus(adminCtx, created.ticket.ticketId, {
      status: 'in_review',
      internalNote: 'Internal triage: escalate to SRE on-call.',
    });

    const memberView = listSupportTickets(memberCtx);
    expect(memberView).toHaveLength(1);
    expect(memberView[0].internalNotes).toBeUndefined();

    const adminView = listSupportTickets(adminCtx);
    expect(adminView[0].internalNotes).toHaveLength(1);

    // Cross-tenant support isolation
    expect(listSupportTickets(competitorCtx)).toHaveLength(0);
    const crossUpdate = updateSupportTicketStatus(competitorCtx, created.ticket.ticketId, {
      status: 'closed',
    });
    expect(crossUpdate.success).toBe(false);

    const bugReport = generateRedactedBugReport(memberCtx, { route: 'help-support' });
    expect(JSON.stringify(bugReport)).not.toContain('AIza');
  });

  it('prevents live payment flag activation in sandbox and rolls back flags cleanly without DB mutation', () => {
    const blockedLive = updateReleaseFlag(adminCtx, 'live_payment_charging', true);
    expect(blockedLive.success).toBe(false);

    const toggled = updateReleaseFlag(adminCtx, 'ops_telemetry_console', false, 'internal_canary');
    expect(toggled.success).toBe(true);
    if (!toggled.success) return;

    const rolledBack = rollbackReleaseFlags(adminCtx, toggled.revision.revisionId);
    expect(rolledBack.success).toBe(true);
    const currentFlag = listReleaseFeatureFlags().find((f) => f.key === 'ops_telemetry_console');
    expect(currentFlag?.enabled).toBe(true);
    expect(currentFlag?.cohort).toBe('general_availability');
  });
});
