/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TEAMORA AI — Phases 376–378: Release Candidate, Feature Flags & Non-Destructive Rollback
 * Provides reversible feature flag toggles, canary rollout targeting, and audited rollback
 * without mutating or destroying customer business databases.
 */

import { VerifiedSecurityContext, recordAuditLog } from './security.ts';

export type RolloutCohort = 'internal_canary' | 'staged_beta' | 'general_availability' | 'disabled';

export interface ReleaseFeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  cohort: RolloutCohort;
  versionTag: string;
  updatedAt: string;
  updatedBy: string;
}

export interface RollbackRevisionSnapshot {
  revisionId: string;
  createdAt: string;
  actor: string;
  reason: string;
  flagsState: Record<string, { enabled: boolean; cohort: RolloutCohort }>;
}

const DEFAULT_FLAGS: ReleaseFeatureFlag[] = [
  {
    key: 'ops_telemetry_console',
    description: 'Live server telemetry, alerting & incident lifecycle UI',
    enabled: true,
    cohort: 'general_availability',
    versionTag: 'rc-351-380.1',
    updatedAt: '2026-11-13T00:00:00.000Z',
    updatedBy: 'release-manager',
  },
  {
    key: 'tenant_backup_portability',
    description: 'Checksummed backup snapshots & JSON/CSV export',
    enabled: true,
    cohort: 'general_availability',
    versionTag: 'rc-351-380.1',
    updatedAt: '2026-11-13T00:00:00.000Z',
    updatedBy: 'release-manager',
  },
  {
    key: 'customer_onboarding_wizard',
    description: 'Resumable 7-step multilingual customer onboarding modal',
    enabled: true,
    cohort: 'general_availability',
    versionTag: 'rc-351-380.1',
    updatedAt: '2026-11-13T00:00:00.000Z',
    updatedBy: 'release-manager',
  },
  {
    key: 'live_payment_charging',
    description: 'Real monetary billing charges (strictly disabled until merchant keys & explicit approval)',
    enabled: false,
    cohort: 'disabled',
    versionTag: 'rc-351-380.1',
    updatedAt: '2026-11-13T00:00:00.000Z',
    updatedBy: 'release-manager',
  },
];

const featureFlags = new Map<string, ReleaseFeatureFlag>(DEFAULT_FLAGS.map((f) => [f.key, { ...f }]));
const revisionHistory: RollbackRevisionSnapshot[] = [];

function snapshotCurrentFlags(actor: string, reason: string): RollbackRevisionSnapshot {
  const flagsState: Record<string, { enabled: boolean; cohort: RolloutCohort }> = {};
  for (const [k, v] of featureFlags.entries()) {
    flagsState[k] = { enabled: v.enabled, cohort: v.cohort };
  }
  const snap: RollbackRevisionSnapshot = {
    revisionId: `rev-${Date.now()}`,
    createdAt: new Date().toISOString(),
    actor,
    reason,
    flagsState,
  };
  revisionHistory.unshift(snap);
  if (revisionHistory.length > 25) revisionHistory.length = 25;
  return snap;
}

export function listReleaseFeatureFlags(): ReleaseFeatureFlag[] {
  return Array.from(featureFlags.values());
}

export function updateReleaseFlag(
  context: VerifiedSecurityContext,
  key: string,
  enabled: boolean,
  cohort?: RolloutCohort
): { success: true; flag: ReleaseFeatureFlag; revision: RollbackRevisionSnapshot } | { success: false; status: number; error: string } {
  if (context.role !== 'owner' && context.role !== 'admin') {
    return { success: false, status: 403, error: 'Forbidden: Requires Owner or Admin.' };
  }
  const flag = featureFlags.get(key);
  if (!flag) {
    return { success: false, status: 404, error: `Feature flag '${key}' not found.` };
  }
  if (key === 'live_payment_charging' && enabled && (process.env.BILLING_MODE || 'sandbox') !== 'live') {
    return {
      success: false,
      status: 409,
      error: 'Cannot enable live_payment_charging while BILLING_MODE is sandbox.',
    };
  }

  const revision = snapshotCurrentFlags(context.email, `Pre-change checkpoint before updating ${key}`);
  flag.enabled = enabled;
  if (cohort) flag.cohort = cohort;
  flag.updatedAt = new Date().toISOString();
  flag.updatedBy = context.email;

  recordAuditLog(context, 'release_flag_updated', key, 'executed', {
    enabled,
    cohort: flag.cohort,
    checkpointRevisionId: revision.revisionId,
  });

  return { success: true, flag: { ...flag }, revision };
}

export function rollbackReleaseFlags(
  context: VerifiedSecurityContext,
  revisionId?: string
): { success: true; restoredRevisionId: string; flags: ReleaseFeatureFlag[] } | { success: false; status: number; error: string } {
  if (context.role !== 'owner' && context.role !== 'admin') {
    return { success: false, status: 403, error: 'Forbidden: Requires Owner or Admin.' };
  }

  const target = revisionId
    ? revisionHistory.find((r) => r.revisionId === revisionId)
    : revisionHistory[0];

  if (!target) {
    // Roll back to safe initial baseline defaults cleanly
    for (const def of DEFAULT_FLAGS) {
      featureFlags.set(def.key, {
        ...def,
        updatedAt: new Date().toISOString(),
        updatedBy: context.email,
      });
    }
    recordAuditLog(context, 'release_flags_rolled_back', 'baseline-defaults', 'executed', {});
    return { success: true, restoredRevisionId: 'baseline-defaults', flags: listReleaseFeatureFlags() };
  }

  for (const [k, state] of Object.entries(target.flagsState)) {
    const flag = featureFlags.get(k);
    if (flag) {
      flag.enabled = state.enabled;
      flag.cohort = state.cohort;
      flag.updatedAt = new Date().toISOString();
      flag.updatedBy = context.email;
    }
  }

  recordAuditLog(context, 'release_flags_rolled_back', target.revisionId, 'executed', {
    reason: target.reason,
  });

  return { success: true, restoredRevisionId: target.revisionId, flags: listReleaseFeatureFlags() };
}

export function resetReleaseFlagsForTests(): void {
  featureFlags.clear();
  for (const def of DEFAULT_FLAGS) {
    featureFlags.set(def.key, { ...def });
  }
  revisionHistory.length = 0;
}
