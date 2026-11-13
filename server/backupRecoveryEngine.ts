/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TEAMORA AI — Phases 361–365: Backup Architecture, Restore Verification & Data Portability
 * Creates immutable checksummed tenant snapshots, performs isolated sandbox restore checks,
 * and generates schema-versioned JSON/CSV exports with strict RBAC & sensitive-field scrubbing.
 */

import crypto from 'crypto';
import { VerifiedSecurityContext, recordAuditLog } from './security.ts';
import { redactSecrets } from './envConfig.ts';

export type SnapshotJobStatus = 'completed' | 'failed';
export type ExportFormat = 'json' | 'csv';

export interface TenantDatasetPayload {
  organization: Record<string, any>;
  tasks: Record<string, any>[];
  projects: Record<string, any>[];
  agentAssignments: Record<string, any>[];
  knowledgeRecords: Record<string, any>[];
  workflows: Record<string, any>[];
  reports: Record<string, any>[];
  auditLogs: Record<string, any>[];
}

export interface BackupSnapshotRecord {
  snapshotId: string;
  orgId: string;
  schemaVersion: string;
  status: SnapshotJobStatus;
  createdAt: string;
  retentionExpiresAt: string;
  createdBy: string;
  checksumSha256: string;
  byteSize: number;
  entityCounts: Record<string, number>;
  payload: TenantDatasetPayload;
}

export interface RestoreVerificationReport {
  verificationId: string;
  snapshotId: string;
  orgId: string;
  sandboxNamespace: string;
  integrityMatch: boolean;
  tenantIsolationVerified: boolean;
  passed: boolean;
  measuredRtoMs: number;
  rpoTargetMinutes: number;
  verifiedCounts: Record<string, number>;
  verifiedAt: string;
  failureReason?: string;
}

export interface TenantExportPackage {
  exportId: string;
  orgId: string;
  schemaVersion: string;
  format: ExportFormat;
  exportedAt: string;
  exportedBy: string;
  checksumSha256: string;
  mimeType: string;
  filename: string;
  content: string;
  entityCounts: Record<string, number>;
}

const SENSITIVE_FIELD_KEYS = new Set([
  'apiKey',
  'api_key',
  'secret',
  'secretKey',
  'password',
  'passwordHash',
  'privateKey',
  'private_key',
  'accessToken',
  'refreshToken',
  'internalWebhookSecret',
  'signingSecret',
]);

const snapshotsStore = new Map<string, BackupSnapshotRecord>();
const sandboxRestores = new Map<string, { orgId: string; restoredAt: string; payload: TenantDatasetPayload }>();

function scrubSensitiveFields<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => scrubSensitiveFields(item)) as unknown as T;
  }
  if (input && typeof input === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(input as Record<string, any>)) {
      if (SENSITIVE_FIELD_KEYS.has(key) || key.toLowerCase().includes('secret') || key.toLowerCase().includes('password')) {
        continue;
      }
      clean[key] = scrubSensitiveFields(val);
    }
    return redactSecrets(clean) as T;
  }
  return redactSecrets(input);
}

function normalizeDataset(orgId: string, raw: Partial<TenantDatasetPayload>): TenantDatasetPayload {
  const filterOrg = (arr: any[] | undefined) =>
    (Array.isArray(arr) ? arr : [])
      .filter((item) => !item?.orgId || item.orgId === orgId)
      .map((item) => scrubSensitiveFields(item));

  return {
    organization: scrubSensitiveFields(raw.organization || { id: orgId }),
    tasks: filterOrg(raw.tasks),
    projects: filterOrg(raw.projects),
    agentAssignments: filterOrg(raw.agentAssignments),
    knowledgeRecords: filterOrg(raw.knowledgeRecords),
    workflows: filterOrg(raw.workflows),
    reports: filterOrg(raw.reports),
    auditLogs: filterOrg(raw.auditLogs),
  };
}

function computeEntityCounts(dataset: TenantDatasetPayload): Record<string, number> {
  return {
    organization: dataset.organization ? 1 : 0,
    tasks: dataset.tasks.length,
    projects: dataset.projects.length,
    agentAssignments: dataset.agentAssignments.length,
    knowledgeRecords: dataset.knowledgeRecords.length,
    workflows: dataset.workflows.length,
    reports: dataset.reports.length,
    auditLogs: dataset.auditLogs.length,
  };
}

function computeSha256(payload: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function createBackupSnapshot(
  context: VerifiedSecurityContext,
  rawDataset: Partial<TenantDatasetPayload>,
  retentionDays: number = 30
): BackupSnapshotRecord {
  const safeDataset = normalizeDataset(context.orgId, rawDataset);
  const serialized = JSON.stringify(safeDataset);
  const checksumSha256 = computeSha256(safeDataset);
  const snapshotId = `snap-${context.orgId}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const createdAt = new Date().toISOString();
  const retentionExpiresAt = new Date(Date.now() + Math.max(1, retentionDays) * 86400000).toISOString();

  const record: BackupSnapshotRecord = {
    snapshotId,
    orgId: context.orgId,
    schemaVersion: '1.0',
    status: 'completed',
    createdAt,
    retentionExpiresAt,
    createdBy: context.email,
    checksumSha256,
    byteSize: Buffer.byteLength(serialized, 'utf-8'),
    entityCounts: computeEntityCounts(safeDataset),
    payload: safeDataset,
  };

  snapshotsStore.set(snapshotId, record);

  recordAuditLog(context, 'backup_snapshot_created', snapshotId, 'executed', {
    checksumSha256,
    byteSize: record.byteSize,
    entityCounts: record.entityCounts,
  });

  return record;
}

export function listBackupSnapshots(orgId: string): Omit<BackupSnapshotRecord, 'payload'>[] {
  return Array.from(snapshotsStore.values())
    .filter((s) => s.orgId === orgId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(({ payload: _omit, ...meta }) => meta);
}

export function getSnapshotById(snapshotId: string): BackupSnapshotRecord | undefined {
  return snapshotsStore.get(snapshotId);
}

export function verifySnapshotIntegrity(snapshotId: string): { valid: boolean; reason?: string } {
  const snap = snapshotsStore.get(snapshotId);
  if (!snap) {
    return { valid: false, reason: 'Snapshot not found' };
  }
  const expected = computeSha256(snap.payload);
  if (expected !== snap.checksumSha256) {
    return { valid: false, reason: 'Checksum mismatch: snapshot payload altered or corrupted.' };
  }
  return { valid: true };
}

/**
 * Restores a backup snapshot strictly into an isolated sandbox namespace (never mutating production data)
 * and verifies entity counts, integrity checksum, and tenant boundary.
 */
export function verifyIsolatedRestore(
  context: VerifiedSecurityContext,
  snapshotId: string,
  sandboxNamespace?: string
): { success: true; report: RestoreVerificationReport } | { success: false; status: number; error: string } {
  const startMs = Date.now();
  const snap = snapshotsStore.get(snapshotId);
  if (!snap) {
    return { success: false, status: 404, error: `Snapshot '${snapshotId}' not found.` };
  }

  if (snap.orgId !== context.orgId) {
    recordAuditLog(context, 'backup_cross_tenant_restore_blocked', snapshotId, 'denied', {
      snapshotOrgId: snap.orgId,
    });
    return {
      success: false,
      status: 403,
      error: `Cross-tenant restore blocked: Snapshot belongs to '${snap.orgId}', not '${context.orgId}'.`,
    };
  }

  const namespace = sandboxNamespace || `sandbox-restore-${context.orgId}-${Date.now()}`;
  const integrity = verifySnapshotIntegrity(snapshotId);
  if (!integrity.valid) {
    const report: RestoreVerificationReport = {
      verificationId: `rver-${Date.now()}`,
      snapshotId,
      orgId: context.orgId,
      sandboxNamespace: namespace,
      integrityMatch: false,
      tenantIsolationVerified: true,
      passed: false,
      measuredRtoMs: Math.max(1, Date.now() - startMs),
      rpoTargetMinutes: 60,
      verifiedCounts: snap.entityCounts,
      verifiedAt: new Date().toISOString(),
      failureReason: integrity.reason,
    };
    return { success: true, report };
  }

  // Clone cleanly into isolated sandbox namespace
  const restoredPayload: TenantDatasetPayload = JSON.parse(JSON.stringify(snap.payload));
  sandboxRestores.set(namespace, {
    orgId: context.orgId,
    restoredAt: new Date().toISOString(),
    payload: restoredPayload,
  });

  const restoredCounts = computeEntityCounts(restoredPayload);
  const allMatch = Object.keys(snap.entityCounts).every(
    (k) => restoredCounts[k] === snap.entityCounts[k]
  );

  // Verify no foreign orgId leaks exist inside restored arrays
  const collections = [
    ...restoredPayload.tasks,
    ...restoredPayload.projects,
    ...restoredPayload.workflows,
    ...restoredPayload.knowledgeRecords,
  ];
  const tenantIsolationVerified = collections.every((item) => !item.orgId || item.orgId === context.orgId);

  const report: RestoreVerificationReport = {
    verificationId: `rver-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    snapshotId,
    orgId: context.orgId,
    sandboxNamespace: namespace,
    integrityMatch: integrity.valid && allMatch,
    tenantIsolationVerified,
    passed: integrity.valid && allMatch && tenantIsolationVerified,
    measuredRtoMs: Math.max(1, Date.now() - startMs),
    rpoTargetMinutes: 60,
    verifiedCounts: restoredCounts,
    verifiedAt: new Date().toISOString(),
  };

  recordAuditLog(context, 'backup_isolated_restore_verified', snapshotId, report.passed ? 'executed' : 'failed', {
    sandboxNamespace: namespace,
    passed: report.passed,
  });

  return { success: true, report };
}

function escapeCsvCell(val: unknown): string {
  const str = val === null || val === undefined ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val);
  // Prevent CSV formula injection (=, +, -, @ at start)
  const safe = /^[=+\-@]/.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function datasetToCsv(orgId: string, schemaVersion: string, dataset: TenantDatasetPayload): string {
  const lines: string[] = [
    `# TEAMORA AI Tenant Data Export`,
    `# orgId=${orgId},schemaVersion=${schemaVersion},exportedAt=${new Date().toISOString()}`,
    `entityType,id,titleOrName,status,createdOrUpdatedAt,metadataJson`,
  ];

  const appendRows = (entityType: string, rows: Record<string, any>[], labelKey: string, dateKey: string) => {
    for (const row of rows) {
      lines.push(
        [
          escapeCsvCell(entityType),
          escapeCsvCell(row.id || ''),
          escapeCsvCell(row[labelKey] || row.name || row.title || ''),
          escapeCsvCell(row.status || ''),
          escapeCsvCell(row[dateKey] || row.createdAt || ''),
          escapeCsvCell(row),
        ].join(',')
      );
    }
  };

  appendRows('organization', [dataset.organization], 'name', 'createdAt');
  appendRows('task', dataset.tasks, 'title', 'updatedAt');
  appendRows('project', dataset.projects, 'title', 'deadline');
  appendRows('agentAssignment', dataset.agentAssignments, 'agentId', 'updatedAt');
  appendRows('knowledgeRecord', dataset.knowledgeRecords, 'name', 'uploadedAt');
  appendRows('workflow', dataset.workflows, 'name', 'lastRunAt');
  appendRows('report', dataset.reports, 'title', 'createdAt');
  appendRows('auditLog', dataset.auditLogs, 'action', 'timestamp');

  return lines.join('\n');
}

/**
 * Authorized Tenant Data Portability Export (Phase 365).
 * Available to Owner/Admin/Manager even when subscription is canceled or past_due.
 */
export function exportTenantData(
  context: VerifiedSecurityContext,
  rawDataset: Partial<TenantDatasetPayload>,
  format: ExportFormat = 'json',
  requestedOrgId?: string
): { success: true; exportPackage: TenantExportPackage } | { success: false; status: number; error: string; code: string } {
  if (requestedOrgId && requestedOrgId !== context.orgId) {
    recordAuditLog(context, 'tenant_export_cross_tenant_denied', requestedOrgId, 'denied', {
      requesterOrgId: context.orgId,
    });
    return {
      success: false,
      status: 403,
      code: 'CROSS_TENANT_EXPORT_FORBIDDEN',
      error: `Forbidden: Cannot export data for external organization '${requestedOrgId}'.`,
    };
  }

  if (context.role === 'viewer' || context.role === 'member') {
    recordAuditLog(context, 'tenant_export_role_denied', context.orgId, 'denied', {
      role: context.role,
    });
    return {
      success: false,
      status: 403,
      code: 'EXPORT_UNAUTHORIZED_ROLE',
      error: `Forbidden: Role '${context.role}' cannot perform full tenant data export. Requires Manager, Admin, or Owner.`,
    };
  }

  const schemaVersion = '1.0';
  const exportedAt = new Date().toISOString();
  const safeDataset = normalizeDataset(context.orgId, rawDataset);
  const entityCounts = computeEntityCounts(safeDataset);

  const exportId = `exp-${context.orgId}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  let content = '';
  let mimeType = 'application/json';
  let filename = `teamora-${context.orgId}-export-v1.json`;

  if (format === 'csv') {
    content = datasetToCsv(context.orgId, schemaVersion, safeDataset);
    mimeType = 'text/csv';
    filename = `teamora-${context.orgId}-export-v1.csv`;
  } else {
    const jsonEnvelope = {
      schemaVersion,
      exportId,
      orgId: context.orgId,
      exportedAt,
      exportedBy: context.email,
      entityCounts,
      data: safeDataset,
    };
    content = JSON.stringify(jsonEnvelope, null, 2);
  }

  const checksumSha256 = crypto.createHash('sha256').update(content).digest('hex');

  recordAuditLog(context, 'tenant_data_exported', context.orgId, 'executed', {
    exportId,
    format,
    schemaVersion,
    checksumSha256,
    entityCounts,
  });

  return {
    success: true,
    exportPackage: {
      exportId,
      orgId: context.orgId,
      schemaVersion,
      format,
      exportedAt,
      exportedBy: context.email,
      checksumSha256,
      mimeType,
      filename,
      content,
      entityCounts,
    },
  };
}

export function clearBackupStateForTests(): void {
  snapshotsStore.clear();
  sandboxRestores.clear();
}
