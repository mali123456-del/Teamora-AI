/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TEAMORA AI — Phase 375: Support, Feedback & Redacted Bug Report Engine
 * Tenant-isolated support ticket lifecycle, RBAC-gated internal triage notes,
 * and safe diagnostic bundle export without secret or cross-tenant leakage.
 */

import crypto from 'crypto';
import { VerifiedSecurityContext, recordAuditLog } from './security.ts';
import { redactSecrets, getEnvironmentConfigHealth } from './envConfig.ts';
import { getRealRuntimeTelemetry } from './observabilityEngine.ts';

export type SupportCategory = 'bug' | 'billing' | 'access' | 'feature_request' | 'onboarding';
export type SupportSeverity = 'low' | 'medium' | 'high' | 'urgent';
export type SupportTicketStatus = 'open' | 'in_review' | 'resolved' | 'closed';

export interface SupportTicketRecord {
  ticketId: string;
  orgId: string;
  reporterUid: string;
  reporterEmail: string;
  category: SupportCategory;
  severity: SupportSeverity;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  internalNotes: string[];
  resolutionSummary?: string;
  createdAt: string;
  updatedAt: string;
}

const ticketsStore: SupportTicketRecord[] = [];

export function createSupportTicket(
  context: VerifiedSecurityContext,
  input: {
    category: SupportCategory;
    severity: SupportSeverity;
    subject: string;
    description: string;
  }
): { success: true; ticket: Omit<SupportTicketRecord, 'internalNotes'> } | { success: false; status: number; error: string } {
  const subject = redactSecrets((input.subject || '').trim());
  const description = redactSecrets((input.description || '').trim());
  if (!subject || !description) {
    return { success: false, status: 400, error: 'Subject and description are required.' };
  }

  const now = new Date().toISOString();
  const ticket: SupportTicketRecord = {
    ticketId: `tkt-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    orgId: context.orgId,
    reporterUid: context.uid,
    reporterEmail: context.email,
    category: input.category || 'bug',
    severity: input.severity || 'medium',
    subject: subject.slice(0, 180),
    description: description.slice(0, 4000),
    status: 'open',
    internalNotes: [],
    createdAt: now,
    updatedAt: now,
  };

  ticketsStore.unshift(ticket);
  recordAuditLog(context, 'support_ticket_created', ticket.ticketId, 'executed', {
    category: ticket.category,
    severity: ticket.severity,
  });

  const { internalNotes: _hidden, ...publicView } = ticket;
  return { success: true, ticket: publicView };
}

export function listSupportTickets(context: VerifiedSecurityContext): Partial<SupportTicketRecord>[] {
  const canViewInternalNotes = context.role === 'owner' || context.role === 'admin';
  return ticketsStore
    .filter((t) => t.orgId === context.orgId)
    .map((t) => {
      if (canViewInternalNotes) {
        return { ...t };
      }
      const { internalNotes: _stripped, ...safeTicket } = t;
      return safeTicket;
    });
}

export function updateSupportTicketStatus(
  context: VerifiedSecurityContext,
  ticketId: string,
  updates: {
    status?: SupportTicketStatus;
    internalNote?: string;
    resolutionSummary?: string;
  }
): { success: true; ticket: Partial<SupportTicketRecord> } | { success: false; status: number; error: string } {
  if (context.role !== 'owner' && context.role !== 'admin' && context.role !== 'manager') {
    return {
      success: false,
      status: 403,
      error: `Forbidden: Role '${context.role}' cannot update support ticket status.`,
    };
  }

  const ticket = ticketsStore.find((t) => t.ticketId === ticketId);
  if (!ticket) {
    return { success: false, status: 404, error: 'Support ticket not found.' };
  }
  if (ticket.orgId !== context.orgId) {
    return {
      success: false,
      status: 403,
      error: 'Cross-tenant access denied: Ticket belongs to another organization.',
    };
  }

  if (updates.status) {
    ticket.status = updates.status;
  }
  if (updates.resolutionSummary) {
    ticket.resolutionSummary = redactSecrets(updates.resolutionSummary);
  }
  if (updates.internalNote) {
    if (context.role !== 'owner' && context.role !== 'admin') {
      return {
        success: false,
        status: 403,
        error: 'Forbidden: Internal staff notes require Owner or Admin role.',
      };
    }
    ticket.internalNotes.push(`[${context.email} @ ${new Date().toISOString()}] ${redactSecrets(updates.internalNote)}`);
  }

  ticket.updatedAt = new Date().toISOString();
  recordAuditLog(context, 'support_ticket_updated', ticket.ticketId, 'executed', {
    status: ticket.status,
  });

  const canViewInternalNotes = context.role === 'owner' || context.role === 'admin';
  if (canViewInternalNotes) return { success: true, ticket: { ...ticket } };
  const { internalNotes: _stripped, ...safeTicket } = ticket;
  return { success: true, ticket: safeTicket };
}

export function generateRedactedBugReport(
  context: VerifiedSecurityContext,
  clientSummary?: Record<string, any>
): Record<string, any> {
  const telemetry = getRealRuntimeTelemetry();
  const envHealth = getEnvironmentConfigHealth();

  return redactSecrets({
    reportVersion: '1.0',
    generatedAt: new Date().toISOString(),
    orgId: context.orgId,
    reporterRole: context.role,
    environment: envHealth.environment,
    billingMode: envHealth.billingMode,
    runtimeTelemetry: telemetry,
    clientDiagnostics: clientSummary || {},
  });
}

export function clearSupportTicketsForTests(): void {
  ticketsStore.length = 0;
}
