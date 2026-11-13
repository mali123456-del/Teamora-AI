/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TEAMORA AI — Phases 356–360: Application Observability, Alerting & Incident Management
 * Structured redacted telemetry, real process metrics, latency percentiles, deduplicated alerting,
 * and strict state-machine incident lifecycle management.
 */

import crypto from 'crypto';
import { redactSecrets } from './envConfig.ts';

export type TelemetryLevel = 'debug' | 'info' | 'warn' | 'error';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export type IncidentState =
  | 'DETECTED'
  | 'INVESTIGATING'
  | 'IDENTIFIED'
  | 'MITIGATING'
  | 'MONITORING'
  | 'RESOLVED'
  | 'CLOSED';

export interface StructuredLogEntry {
  id: string;
  timestamp: string;
  requestId: string;
  correlationId: string;
  orgId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  level: TelemetryLevel;
  category: string;
  errorCategory?: string;
  message: string;
}

export interface AlertRuleThreshold {
  ruleId: string;
  name: string;
  severity: AlertSeverity;
  thresholdDescription: string;
  dedupeWindowMs: number;
}

export interface OperationalAlert {
  id: string;
  ruleId: string;
  dedupeKey: string;
  orgId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  occurrenceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface IncidentTimelineEvent {
  timestamp: string;
  fromState: IncidentState | null;
  toState: IncidentState;
  actor: string;
  note: string;
}

export interface OperationalIncident {
  id: string;
  orgId: string;
  title: string;
  severity: AlertSeverity;
  state: IncidentState;
  linkedAlertId?: string;
  rootCause: string;
  recoveryActions: string[];
  owner: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  timeline: IncidentTimelineEvent[];
}

export interface RealRuntimeTelemetry {
  measuredAt: string;
  uptimeSeconds: number;
  nodeVersion: string;
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
    externalMb: number;
    ceilingMb: number;
    withinBudget: boolean;
  };
  requests: {
    totalRequests: number;
    errorRequests: number;
    errorRatePercent: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
  };
  providerStatus: {
    geminiKeyConfigured: boolean;
    rateLimitMaxPerMinute: number;
  };
  operations: {
    activeAlerts: number;
    criticalAlerts: number;
    openIncidents: number;
    structuredLogsBuffered: number;
  };
}

export const DEFAULT_ALERT_RULES: AlertRuleThreshold[] = [
  {
    ruleId: 'HIGH_ERROR_RATE',
    name: 'API Error Rate Exceeded 5%',
    severity: 'high',
    thresholdDescription: '5xx/error ratio > 5% over active request window',
    dedupeWindowMs: 5 * 60 * 1000,
  },
  {
    ruleId: 'ELEVATED_P95_LATENCY',
    name: 'Elevated P95 API Latency',
    severity: 'medium',
    thresholdDescription: 'P95 response latency > 3000ms',
    dedupeWindowMs: 5 * 60 * 1000,
  },
  {
    ruleId: 'MEMORY_CEILING_WARNING',
    name: 'Node RSS Approaching Hardware Ceiling',
    severity: 'high',
    thresholdDescription: 'Process RSS exceeds 220 MB threshold on 8GB Latitude profile',
    dedupeWindowMs: 10 * 60 * 1000,
  },
  {
    ruleId: 'PROVIDER_UNAVAILABLE',
    name: 'AI Provider Configuration or Outage',
    severity: 'critical',
    thresholdDescription: 'Missing GEMINI_API_KEY or repeated upstream provider failure',
    dedupeWindowMs: 5 * 60 * 1000,
  },
  {
    ruleId: 'BACKUP_OR_INTEGRITY_FAILURE',
    name: 'Backup Checksum or Audit Chain Anomaly',
    severity: 'critical',
    thresholdDescription: 'Backup checksum mismatch or audit chain tamper detection',
    dedupeWindowMs: 5 * 60 * 1000,
  },
];

const INCIDENT_TRANSITIONS: Record<IncidentState, IncidentState[]> = {
  DETECTED: ['INVESTIGATING', 'IDENTIFIED', 'MITIGATING', 'RESOLVED'],
  INVESTIGATING: ['IDENTIFIED', 'MITIGATING', 'RESOLVED'],
  IDENTIFIED: ['MITIGATING', 'MONITORING', 'RESOLVED'],
  MITIGATING: ['MONITORING', 'RESOLVED'],
  MONITORING: ['RESOLVED', 'INVESTIGATING'],
  RESOLVED: ['CLOSED', 'INVESTIGATING'],
  CLOSED: [],
};

const MAX_LOG_BUFFER = 500;
const MAX_LATENCY_SAMPLES = 250;

const logBuffer: StructuredLogEntry[] = [];
const latencySamples: number[] = [];
const alertsStore: OperationalAlert[] = [];
const incidentsStore: OperationalIncident[] = [];

let totalRequestsCount = 0;
let errorRequestsCount = 0;

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return Math.round(sorted[idx] * 100) / 100;
}

export function recordStructuredLog(entry: Omit<StructuredLogEntry, 'id' | 'timestamp'>): StructuredLogEntry {
  const safeEndpoint = redactSecrets(entry.endpoint.split('?')[0]);
  const safeMessage = redactSecrets(entry.message);
  const record: StructuredLogEntry = {
    id: `slog-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    timestamp: new Date().toISOString(),
    requestId: entry.requestId,
    correlationId: entry.correlationId,
    orgId: entry.orgId || 'system',
    endpoint: safeEndpoint,
    method: entry.method,
    statusCode: entry.statusCode,
    durationMs: Math.max(0, Math.round(entry.durationMs * 100) / 100),
    level: entry.level,
    category: entry.category,
    errorCategory: entry.errorCategory,
    message: safeMessage,
  };

  logBuffer.unshift(record);
  if (logBuffer.length > MAX_LOG_BUFFER) {
    logBuffer.length = MAX_LOG_BUFFER;
  }

  return record;
}

export function recordTelemetryRequest(params: {
  requestId: string;
  correlationId: string;
  orgId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  errorCategory?: string;
  message?: string;
}): StructuredLogEntry {
  totalRequestsCount += 1;
  const isError = params.statusCode >= 500;
  if (isError) {
    errorRequestsCount += 1;
  }

  latencySamples.push(params.durationMs);
  if (latencySamples.length > MAX_LATENCY_SAMPLES) {
    latencySamples.shift();
  }

  const level: TelemetryLevel =
    params.statusCode >= 500 ? 'error' : params.statusCode >= 400 ? 'warn' : 'info';

  const log = recordStructuredLog({
    requestId: params.requestId,
    correlationId: params.correlationId,
    orgId: params.orgId,
    endpoint: params.endpoint,
    method: params.method,
    statusCode: params.statusCode,
    durationMs: params.durationMs,
    level,
    category: 'http_api',
    errorCategory: params.errorCategory,
    message: params.message || `${params.method} ${params.endpoint.split('?')[0]} -> ${params.statusCode}`,
  });

  // Auto-evaluate threshold alerts without flooding (deduped)
  if (totalRequestsCount >= 10) {
    const errorRate = (errorRequestsCount / totalRequestsCount) * 100;
    if (errorRate > 5) {
      triggerOrDeduplicateAlert({
        ruleId: 'HIGH_ERROR_RATE',
        orgId: params.orgId,
        title: 'API 5xx Error Rate Above Threshold',
        message: `Observed 5xx error rate ${errorRate.toFixed(1)}% exceeds 5.0% threshold.`,
        severity: 'high',
      });
    }
  }

  if (params.durationMs > 5000) {
    triggerOrDeduplicateAlert({
      ruleId: 'ELEVATED_P95_LATENCY',
      orgId: params.orgId,
      title: 'Slow Endpoint Execution Detected',
      message: `Endpoint ${params.endpoint.split('?')[0]} completed in ${Math.round(params.durationMs)}ms (>5000ms).`,
      severity: 'medium',
    });
  }

  return log;
}

export function getStructuredLogs(options?: {
  orgId?: string;
  level?: TelemetryLevel;
  limit?: number;
}): StructuredLogEntry[] {
  let result = logBuffer;
  if (options?.orgId) {
    result = result.filter((l) => l.orgId === options.orgId || l.orgId === 'system');
  }
  if (options?.level) {
    result = result.filter((l) => l.level === options.level);
  }
  const limit = Math.min(200, Math.max(1, options?.limit || 100));
  return result.slice(0, limit);
}

/**
 * Triggers an operational alert or deduplicates within the rule's dedupeWindowMs.
 */
export function triggerOrDeduplicateAlert(params: {
  ruleId: string;
  orgId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  dedupeWindowMs?: number;
}): { alert: OperationalAlert; deduplicated: boolean } {
  const rule = DEFAULT_ALERT_RULES.find((r) => r.ruleId === params.ruleId);
  const windowMs = params.dedupeWindowMs ?? rule?.dedupeWindowMs ?? 5 * 60 * 1000;
  const dedupeKey = `${params.ruleId}:${params.orgId}`;
  const now = Date.now();

  const existing = alertsStore.find(
    (a) =>
      a.dedupeKey === dedupeKey &&
      a.status !== 'resolved' &&
      now - new Date(a.lastSeenAt).getTime() <= windowMs
  );

  if (existing) {
    existing.occurrenceCount += 1;
    existing.lastSeenAt = new Date(now).toISOString();
    existing.message = redactSecrets(params.message);
    return { alert: existing, deduplicated: true };
  }

  const created: OperationalAlert = {
    id: `alert-${now}-${crypto.randomBytes(3).toString('hex')}`,
    ruleId: params.ruleId,
    dedupeKey,
    orgId: params.orgId,
    title: redactSecrets(params.title),
    message: redactSecrets(params.message),
    severity: params.severity,
    status: 'active',
    occurrenceCount: 1,
    firstSeenAt: new Date(now).toISOString(),
    lastSeenAt: new Date(now).toISOString(),
  };

  alertsStore.unshift(created);
  return { alert: created, deduplicated: false };
}

export function listOperationalAlerts(orgId?: string): OperationalAlert[] {
  if (!orgId) return [...alertsStore];
  return alertsStore.filter((a) => a.orgId === orgId || a.orgId === 'system');
}

export function acknowledgeOperationalAlert(alertId: string, actor: string): OperationalAlert | null {
  const alert = alertsStore.find((a) => a.id === alertId);
  if (!alert) return null;
  if (alert.status === 'active') {
    alert.status = 'acknowledged';
    alert.acknowledgedBy = actor;
    alert.acknowledgedAt = new Date().toISOString();
  }
  return alert;
}

export function resolveOperationalAlert(alertId: string, actor: string): OperationalAlert | null {
  const alert = alertsStore.find((a) => a.id === alertId);
  if (!alert) return null;
  alert.status = 'resolved';
  alert.resolvedBy = actor;
  alert.resolvedAt = new Date().toISOString();
  return alert;
}

export function createIncident(params: {
  orgId: string;
  title: string;
  severity: AlertSeverity;
  owner: string;
  rootCause?: string;
  linkedAlertId?: string;
}): OperationalIncident {
  const now = new Date().toISOString();
  const incident: OperationalIncident = {
    id: `inc-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    orgId: params.orgId,
    title: redactSecrets(params.title),
    severity: params.severity,
    state: 'DETECTED',
    linkedAlertId: params.linkedAlertId,
    rootCause: redactSecrets(params.rootCause || 'Under active investigation'),
    recoveryActions: [],
    owner: params.owner,
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        timestamp: now,
        fromState: null,
        toState: 'DETECTED',
        actor: params.owner,
        note: 'Incident opened for triage.',
      },
    ],
  };

  incidentsStore.unshift(incident);
  return incident;
}

export function transitionIncidentState(params: {
  incidentId: string;
  targetState: IncidentState;
  actor: string;
  note: string;
  rootCause?: string;
  recoveryAction?: string;
}): { success: true; incident: OperationalIncident } | { success: false; error: string } {
  const incident = incidentsStore.find((i) => i.id === params.incidentId);
  if (!incident) {
    return { success: false, error: `Incident '${params.incidentId}' not found.` };
  }

  const allowedNext = INCIDENT_TRANSITIONS[incident.state] || [];
  if (!allowedNext.includes(params.targetState)) {
    return {
      success: false,
      error: `Invalid state transition from '${incident.state}' to '${params.targetState}'. Allowed: ${
        allowedNext.join(', ') || 'none'
      }.`,
    };
  }

  const now = new Date().toISOString();
  const prevState = incident.state;
  incident.state = params.targetState;
  incident.updatedAt = now;

  if (params.rootCause) {
    incident.rootCause = redactSecrets(params.rootCause);
  }
  if (params.recoveryAction) {
    incident.recoveryActions.push(redactSecrets(params.recoveryAction));
  }
  if (params.targetState === 'RESOLVED') {
    incident.resolvedAt = now;
  }
  if (params.targetState === 'CLOSED') {
    incident.closedAt = now;
  }

  incident.timeline.push({
    timestamp: now,
    fromState: prevState,
    toState: params.targetState,
    actor: params.actor,
    note: redactSecrets(params.note),
  });

  return { success: true, incident };
}

export function listIncidents(orgId?: string): OperationalIncident[] {
  if (!orgId) return [...incidentsStore];
  return incidentsStore.filter((i) => i.orgId === orgId || i.orgId === 'system');
}

export function getRealRuntimeTelemetry(): RealRuntimeTelemetry {
  const mem = process.memoryUsage();
  const rssMb = Math.round((mem.rss / (1024 * 1024)) * 100) / 100;
  const heapUsedMb = Math.round((mem.heapUsed / (1024 * 1024)) * 100) / 100;
  const heapTotalMb = Math.round((mem.heapTotal / (1024 * 1024)) * 100) / 100;
  const externalMb = Math.round((mem.external / (1024 * 1024)) * 100) / 100;
  const ceilingMb = 256;

  const errorRatePercent =
    totalRequestsCount > 0 ? Math.round((errorRequestsCount / totalRequestsCount) * 10000) / 100 : 0;

  const activeAlerts = alertsStore.filter((a) => a.status !== 'resolved');
  const openIncidents = incidentsStore.filter((i) => i.state !== 'CLOSED');

  return {
    measuredAt: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime() * 10) / 10,
    nodeVersion: process.version,
    memory: {
      rssMb,
      heapUsedMb,
      heapTotalMb,
      externalMb,
      ceilingMb,
      withinBudget: rssMb <= ceilingMb,
    },
    requests: {
      totalRequests: totalRequestsCount,
      errorRequests: errorRequestsCount,
      errorRatePercent,
      p50LatencyMs: percentile(latencySamples, 50),
      p95LatencyMs: percentile(latencySamples, 95),
    },
    providerStatus: {
      geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
      rateLimitMaxPerMinute: 60,
    },
    operations: {
      activeAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter((a) => a.severity === 'critical').length,
      openIncidents: openIncidents.length,
      structuredLogsBuffered: logBuffer.length,
    },
  };
}

export function resetObservabilityStateForTests(): void {
  logBuffer.length = 0;
  latencySamples.length = 0;
  alertsStore.length = 0;
  incidentsStore.length = 0;
  totalRequestsCount = 0;
  errorRequestsCount = 0;
}
