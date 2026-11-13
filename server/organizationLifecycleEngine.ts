/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TEAMORA AI — Phases 367–368: Organization Lifecycle, Team Invitations & Access Governance
 * Server-authoritative workspace settings, ownership transfer gates, workspace archival,
 * and expiration/seat-enforced team invitation lifecycle.
 */

import crypto from 'crypto';
import {
  VerifiedSecurityContext,
  UserRole,
  registerServerOrgMember,
  recordAuditLog,
} from './security.ts';
import { PLAN_ENTITLEMENTS, getTenantSubscription } from './saasEngine.ts';

export type WorkspaceStatus = 'active' | 'archived';

export interface WorkspaceLifecycleRecord {
  orgId: string;
  name: string;
  industry: string;
  timezone: string;
  status: WorkspaceStatus;
  ownerUid: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface OrgTeamMember {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'revoked';
  joinedAt: string;
  revokedAt?: string;
}

export interface TeamInvitationRecord {
  invitationId: string;
  orgId: string;
  email: string;
  role: Exclude<UserRole, 'owner'>;
  invitedBy: string;
  tokenHash: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

const workspacesStore = new Map<string, WorkspaceLifecycleRecord>();
const orgMembersStore = new Map<string, OrgTeamMember[]>();
const invitationsStore = new Map<string, TeamInvitationRecord[]>();

function ensureOrgSeeded(orgId: string): void {
  if (!workspacesStore.has(orgId)) {
    workspacesStore.set(orgId, {
      orgId,
      name: orgId === 'org-apex' ? 'Apex Global Enterprises' : `Workspace ${orgId}`,
      industry: 'Technology & Operations',
      timezone: 'UTC',
      status: 'active',
      ownerUid: orgId === 'org-apex' ? 'user-owner-001' : 'user-admin-002',
      updatedAt: new Date().toISOString(),
    });
  }
  if (!orgMembersStore.has(orgId)) {
    orgMembersStore.set(
      orgId,
      orgId === 'org-apex'
        ? [
            {
              uid: 'user-owner-001',
              name: 'Sulaiman Khan',
              email: 'owner@apexglobal.io',
              role: 'owner',
              status: 'active',
              joinedAt: '2026-01-15T08:00:00.000Z',
            },
            {
              uid: 'user-admin-002',
              name: 'Ayesha Siddiqui',
              email: 'admin@apexglobal.io',
              role: 'admin',
              status: 'active',
              joinedAt: '2026-02-01T09:00:00.000Z',
            },
            {
              uid: 'user-manager-003',
              name: 'Hamza Farooq',
              email: 'manager@apexglobal.io',
              role: 'manager',
              status: 'active',
              joinedAt: '2026-02-14T10:00:00.000Z',
            },
          ]
        : []
    );
  }
  if (!invitationsStore.has(orgId)) {
    invitationsStore.set(orgId, []);
  }
}

export function getOrgDirectorySnapshot(orgId: string): {
  workspace: WorkspaceLifecycleRecord;
  members: OrgTeamMember[];
  invitations: TeamInvitationRecord[];
  seatLimit: number;
  activeSeatsUsed: number;
} {
  ensureOrgSeeded(orgId);
  const workspace = workspacesStore.get(orgId)!;
  const members = orgMembersStore.get(orgId)!;
  const invites = invitationsStore.get(orgId)!;

  // Automatically mark expired pending invitations
  const now = Date.now();
  for (const inv of invites) {
    if (inv.status === 'pending' && new Date(inv.expiresAt).getTime() < now) {
      inv.status = 'expired';
    }
  }

  const sub = getTenantSubscription(orgId);
  const seatLimit = PLAN_ENTITLEMENTS[sub.plan].maxMembers;
  const activeSeatsUsed =
    members.filter((m) => m.status === 'active').length +
    invites.filter((i) => i.status === 'pending').length;

  return {
    workspace,
    members: [...members],
    invitations: [...invites],
    seatLimit,
    activeSeatsUsed,
  };
}

export function updateWorkspaceProfile(
  context: VerifiedSecurityContext,
  updates: { name?: string; industry?: string; timezone?: string }
): { success: true; workspace: WorkspaceLifecycleRecord } | { success: false; status: number; error: string } {
  if (context.role !== 'owner' && context.role !== 'admin') {
    return {
      success: false,
      status: 403,
      error: `Forbidden: Role '${context.role}' cannot update workspace profile.`,
    };
  }
  ensureOrgSeeded(context.orgId);
  const ws = workspacesStore.get(context.orgId)!;
  if (ws.status === 'archived') {
    return { success: false, status: 409, error: 'Cannot modify an archived workspace.' };
  }
  if (updates.name && updates.name.trim()) ws.name = updates.name.trim().slice(0, 120);
  if (updates.industry && updates.industry.trim()) ws.industry = updates.industry.trim().slice(0, 80);
  if (updates.timezone && updates.timezone.trim()) ws.timezone = updates.timezone.trim().slice(0, 64);
  ws.updatedAt = new Date().toISOString();

  recordAuditLog(context, 'org_profile_updated', context.orgId, 'executed', updates);
  return { success: true, workspace: ws };
}

export function transferWorkspaceOwnership(
  context: VerifiedSecurityContext,
  targetMemberUid: string
): { success: true; workspace: WorkspaceLifecycleRecord } | { success: false; status: number; error: string } {
  if (context.role !== 'owner') {
    return {
      success: false,
      status: 403,
      error: 'Forbidden: Only the current Organization Owner can transfer ownership.',
    };
  }
  ensureOrgSeeded(context.orgId);
  const ws = workspacesStore.get(context.orgId)!;
  const members = orgMembersStore.get(context.orgId)!;
  const target = members.find((m) => m.uid === targetMemberUid && m.status === 'active');
  if (!target) {
    return {
      success: false,
      status: 404,
      error: `Target active member '${targetMemberUid}' not found in organization '${context.orgId}'.`,
    };
  }

  for (const m of members) {
    if (m.uid === ws.ownerUid && m.uid !== target.uid && m.role === 'owner') {
      m.role = 'admin';
      registerServerOrgMember(context.orgId, m.uid, 'admin', m.email);
    }
  }
  target.role = 'owner';
  ws.ownerUid = target.uid;
  ws.updatedAt = new Date().toISOString();
  registerServerOrgMember(context.orgId, target.uid, 'owner', target.email);

  recordAuditLog(context, 'org_ownership_transferred', target.uid, 'executed', {
    newOwnerEmail: target.email,
  });
  return { success: true, workspace: ws };
}

export function archiveWorkspace(
  context: VerifiedSecurityContext,
  confirmationPhrase: string
): { success: true; workspace: WorkspaceLifecycleRecord } | { success: false; status: number; error: string } {
  if (context.role !== 'owner') {
    return {
      success: false,
      status: 403,
      error: 'Forbidden: Only Organization Owner can archive a workspace.',
    };
  }
  if (confirmationPhrase !== `ARCHIVE ${context.orgId}`) {
    return {
      success: false,
      status: 400,
      error: `Invalid confirmation phrase. Must match 'ARCHIVE ${context.orgId}'.`,
    };
  }
  ensureOrgSeeded(context.orgId);
  const ws = workspacesStore.get(context.orgId)!;
  ws.status = 'archived';
  ws.archivedAt = new Date().toISOString();
  ws.updatedAt = ws.archivedAt;

  recordAuditLog(context, 'org_workspace_archived', context.orgId, 'executed', {
    archivedAt: ws.archivedAt,
  });
  return { success: true, workspace: ws };
}

export function createTeamInvitation(
  context: VerifiedSecurityContext,
  email: string,
  role: Exclude<UserRole, 'owner'>,
  expiresInHours: number = 168
):
  | { success: true; invitation: TeamInvitationRecord; inviteToken: string }
  | { success: false; status: number; code: string; error: string } {
  if (context.role !== 'owner' && context.role !== 'admin') {
    return {
      success: false,
      status: 403,
      code: 'INVITE_FORBIDDEN',
      error: `Forbidden: Role '${context.role}' cannot invite workspace members.`,
    };
  }

  ensureOrgSeeded(context.orgId);
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return {
      success: false,
      status: 400,
      code: 'INVALID_EMAIL',
      error: 'Valid email address is required.',
    };
  }

  const snapshot = getOrgDirectorySnapshot(context.orgId);
  if (snapshot.activeSeatsUsed >= snapshot.seatLimit) {
    return {
      success: false,
      status: 402,
      code: 'SEAT_LIMIT_REACHED',
      error: `Plan seat limit reached (${snapshot.activeSeatsUsed}/${snapshot.seatLimit}). Upgrade plan before inviting more members.`,
    };
  }

  const alreadyActive = snapshot.members.some(
    (m) => m.email.toLowerCase() === normalizedEmail && m.status === 'active'
  );
  if (alreadyActive) {
    return {
      success: false,
      status: 409,
      code: 'ALREADY_MEMBER',
      error: `User '${normalizedEmail}' is already an active member of this workspace.`,
    };
  }

  const duplicatePending = snapshot.invitations.some(
    (i) => i.email.toLowerCase() === normalizedEmail && i.status === 'pending'
  );
  if (duplicatePending) {
    return {
      success: false,
      status: 409,
      code: 'DUPLICATE_INVITATION',
      error: `An active pending invitation already exists for '${normalizedEmail}'.`,
    };
  }

  const rawToken = crypto.randomBytes(16).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const now = Date.now();
  const expiresAt = new Date(now + expiresInHours * 3600 * 1000).toISOString();

  const invitation: TeamInvitationRecord = {
    invitationId: `inv-${now}-${crypto.randomBytes(3).toString('hex')}`,
    orgId: context.orgId,
    email: normalizedEmail,
    role,
    invitedBy: context.email,
    tokenHash,
    status: 'pending',
    createdAt: new Date(now).toISOString(),
    expiresAt,
  };

  invitationsStore.get(context.orgId)!.unshift(invitation);

  recordAuditLog(context, 'team_invitation_created', invitation.invitationId, 'executed', {
    inviteeEmail: normalizedEmail,
    assignedRole: role,
    expiresAt,
  });

  return { success: true, invitation, inviteToken: rawToken };
}

/**
 * Accepts an invitation ONLY when:
 * 1. Invitee identity is authenticated (`authenticatedUid` & `authenticatedEmail`),
 * 2. Token matches invitation hash,
 * 3. Invitation is still pending and NOT expired,
 * 4. Authenticated email matches invited email.
 */
export function acceptTeamInvitation(params: {
  orgId: string;
  invitationId: string;
  inviteToken: string;
  authenticatedUid: string | null;
  authenticatedEmail: string | null;
  displayName?: string;
}):
  | { success: true; member: OrgTeamMember }
  | { success: false; status: number; code: string; error: string } {
  if (!params.authenticatedUid || !params.authenticatedEmail) {
    return {
      success: false,
      status: 401,
      code: 'PRE_AUTH_ACCESS_DENIED',
      error: 'Authentication is required prior to accepting a workspace invitation.',
    };
  }

  ensureOrgSeeded(params.orgId);
  const invites = invitationsStore.get(params.orgId)!;
  const invite = invites.find((i) => i.invitationId === params.invitationId);
  if (!invite) {
    return { success: false, status: 404, code: 'INVITATION_NOT_FOUND', error: 'Invitation not found.' };
  }

  if (invite.status !== 'pending') {
    return {
      success: false,
      status: 409,
      code: `INVITATION_${invite.status.toUpperCase()}`,
      error: `Invitation cannot be accepted (current status: ${invite.status}).`,
    };
  }

  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    invite.status = 'expired';
    return {
      success: false,
      status: 410,
      code: 'INVITATION_EXPIRED',
      error: 'Invitation link has expired. Request a new invitation from your workspace Admin.',
    };
  }

  const providedHash = crypto.createHash('sha256').update(params.inviteToken).digest('hex');
  if (providedHash !== invite.tokenHash) {
    return { success: false, status: 403, code: 'INVALID_INVITE_TOKEN', error: 'Invalid invitation token.' };
  }

  if (params.authenticatedEmail.trim().toLowerCase() !== invite.email.toLowerCase()) {
    return {
      success: false,
      status: 403,
      code: 'INVITEE_EMAIL_MISMATCH',
      error: `Authenticated email '${params.authenticatedEmail}' does not match invited email '${invite.email}'.`,
    };
  }

  invite.status = 'accepted';
  invite.acceptedAt = new Date().toISOString();

  const member: OrgTeamMember = {
    uid: params.authenticatedUid,
    name: params.displayName || invite.email.split('@')[0],
    email: invite.email,
    role: invite.role,
    status: 'active',
    joinedAt: invite.acceptedAt,
  };

  orgMembersStore.get(params.orgId)!.push(member);
  registerServerOrgMember(params.orgId, member.uid, member.role, member.email);

  return { success: true, member };
}

export function cancelTeamInvitation(
  context: VerifiedSecurityContext,
  invitationId: string
): { success: true; invitation: TeamInvitationRecord } | { success: false; status: number; error: string } {
  if (context.role !== 'owner' && context.role !== 'admin') {
    return { success: false, status: 403, error: 'Forbidden: Requires Owner or Admin.' };
  }
  ensureOrgSeeded(context.orgId);
  const invite = invitationsStore.get(context.orgId)!.find((i) => i.invitationId === invitationId);
  if (!invite) return { success: false, status: 404, error: 'Invitation not found.' };
  invite.status = 'cancelled';
  recordAuditLog(context, 'team_invitation_cancelled', invitationId, 'executed', { email: invite.email });
  return { success: true, invitation: invite };
}

export function revokeMemberAccess(
  context: VerifiedSecurityContext,
  targetUid: string
): { success: true; member: OrgTeamMember } | { success: false; status: number; error: string } {
  if (context.role !== 'owner' && context.role !== 'admin') {
    return { success: false, status: 403, error: 'Forbidden: Requires Owner or Admin.' };
  }
  ensureOrgSeeded(context.orgId);
  const member = orgMembersStore.get(context.orgId)!.find((m) => m.uid === targetUid);
  if (!member) return { success: false, status: 404, error: 'Member not found.' };
  if (member.role === 'owner') {
    return { success: false, status: 400, error: 'Cannot revoke workspace Owner. Transfer ownership first.' };
  }
  member.status = 'revoked';
  member.revokedAt = new Date().toISOString();
  recordAuditLog(context, 'team_member_revoked', targetUid, 'executed', { email: member.email });
  return { success: true, member };
}

export function updateMemberRole(
  context: VerifiedSecurityContext,
  targetUid: string,
  newRole: Exclude<UserRole, 'owner'>
): { success: true; member: OrgTeamMember } | { success: false; status: number; error: string } {
  if (context.role !== 'owner' && context.role !== 'admin') {
    return { success: false, status: 403, error: 'Forbidden: Requires Owner or Admin.' };
  }
  ensureOrgSeeded(context.orgId);
  const member = orgMembersStore.get(context.orgId)!.find((m) => m.uid === targetUid && m.status === 'active');
  if (!member) return { success: false, status: 404, error: 'Active member not found.' };
  if (member.role === 'owner') {
    return { success: false, status: 400, error: 'Cannot downgrade Owner role directly.' };
  }
  member.role = newRole;
  registerServerOrgMember(context.orgId, member.uid, newRole, member.email);
  recordAuditLog(context, 'team_member_role_updated', targetUid, 'executed', { newRole });
  return { success: true, member };
}
