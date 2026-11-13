/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TEAMORA AI — Phases 113, 146–148 & 356–360: System Health & Production Operations Console
 * Displays real server runtime telemetry (RSS/Heap, uptime, p50/p95 latency, error rate),
 * deduplicated alerting, incident lifecycle state machine, redacted structured logs,
 * environment config health, SHA-256 audit log verification, and 15-agent runtime status.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { TEAMORA_AGENTS } from '../../data/agents.ts';
import {
  Activity,
  Cpu,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  HardDrive,
  Gauge,
  Server,
  Terminal,
  CheckCircle2,
  Bell,
  Clock,
  FileWarning,
  Wrench,
} from 'lucide-react';

interface TelemetrySnapshot {
  measuredAt: string;
  uptimeSeconds: number;
  nodeVersion: string;
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
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

interface EnvHealthSummary {
  environment: string;
  billingMode: string;
  hasGeminiApiKey: boolean;
  stagingIsolationReady: boolean;
  clientSecretLeakDetected: boolean;
  firebaseProjectId: string | null;
  warnings: string[];
  blockers: string[];
  checks: { key: string; status: 'ok' | 'warning' | 'blocker'; message: string }[];
}

interface OpsAlert {
  id: string;
  ruleId: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'acknowledged' | 'resolved';
  occurrenceCount: number;
  lastSeenAt: string;
}

interface OpsIncident {
  id: string;
  title: string;
  severity: string;
  state: string;
  rootCause: string;
  recoveryActions: string[];
  owner: string;
  createdAt: string;
  updatedAt: string;
}

interface StructuredLogItem {
  id: string;
  timestamp: string;
  correlationId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  level: string;
  message: string;
}

type OpsTab = 'telemetry' | 'incidents' | 'logs' | 'config';

const NEXT_INCIDENT_STATE: Record<string, string | null> = {
  DETECTED: 'INVESTIGATING',
  INVESTIGATING: 'IDENTIFIED',
  IDENTIFIED: 'MITIGATING',
  MITIGATING: 'MONITORING',
  MONITORING: 'RESOLVED',
  RESOLVED: 'CLOSED',
  CLOSED: null,
};

export const SystemHealthView: React.FC = () => {
  const { currentOrg, tasks, user, setBannerMessage } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<OpsTab>('telemetry');
  const [fps, setFps] = useState(60);
  const [telemetry, setTelemetry] = useState<TelemetrySnapshot | null>(null);
  const [envHealth, setEnvHealth] = useState<EnvHealthSummary | null>(null);
  const [alerts, setAlerts] = useState<OpsAlert[]>([]);
  const [incidents, setIncidents] = useState<OpsIncident[]>([]);
  const [logs, setLogs] = useState<StructuredLogItem[]>([]);
  const [auditIntegrity, setAuditIntegrity] = useState<{
    valid: boolean;
    entriesCount: number;
    headHash?: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newIncidentTitle, setNewIncidentTitle] = useState('');

  // Browser rendering FPS measurement
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const measure = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.min(60, Math.round((frameCount * 1000) / (now - lastTime))));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(measure);
    };

    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, []);

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      'x-teamora-org': currentOrg.id,
      'x-teamora-sandbox': 'true',
      'x-teamora-uid': user?.uid || 'user-admin-002',
    }),
    [currentOrg.id, user?.uid]
  );

  const fetchOperationsData = useCallback(async () => {
    setIsRefreshing(true);
    setLoadError(null);
    try {
      const headers = authHeaders();
      const [metricsRes, alertsRes, incRes, logsRes, auditRes] = await Promise.all([
        fetch(`/api/ops/metrics?orgId=${currentOrg.id}`, { headers }),
        fetch(`/api/ops/alerts?orgId=${currentOrg.id}`, { headers }),
        fetch(`/api/ops/incidents?orgId=${currentOrg.id}`, { headers }),
        fetch(`/api/ops/logs?orgId=${currentOrg.id}&limit=40`, { headers }),
        fetch(`/api/security/audit?orgId=${currentOrg.id}`, { headers }),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setTelemetry(data.telemetry);
        setEnvHealth(data.envHealth);
      } else {
        setLoadError('Unable to load server telemetry snapshot.');
      }
      if (alertsRes.ok) {
        const aData = await alertsRes.json();
        setAlerts(aData.alerts || []);
      }
      if (incRes.ok) {
        const iData = await incRes.json();
        setIncidents(iData.incidents || []);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setLogs(lData.logs || []);
      }
      if (auditRes.ok) {
        const sData = await auditRes.json();
        setAuditIntegrity({
          valid: sData.isIntegrityValid,
          entriesCount: (sData.logs || []).length,
          headHash: sData.logs?.[sData.logs.length - 1]?.entryHash,
        });
      }
    } catch (err: any) {
      setLoadError(err.message || 'Failed to fetch runtime telemetry.');
    } finally {
      setIsRefreshing(false);
    }
  }, [authHeaders, currentOrg.id]);

  useEffect(() => {
    fetchOperationsData();
  }, [fetchOperationsData]);

  const handleAlertAction = async (action: 'trigger' | 'acknowledge' | 'resolve', alertId?: string) => {
    try {
      const res = await fetch('/api/ops/alerts/action', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          orgId: currentOrg.id,
          action,
          alertId,
          ruleId: 'MANUAL_DIAGNOSTIC',
          title: 'Diagnostic Threshold Check',
          message: 'Operator triggered diagnostic alert verification.',
          severity: 'medium',
        }),
      });
      if (res.ok) {
        await fetchOperationsData();
        setBannerMessage({ title: `Alert action '${action}' recorded.`, type: 'info' });
      }
    } catch {
      setBannerMessage({ title: 'Failed to execute alert action.', type: 'warning' });
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentTitle.trim()) return;
    const res = await fetch('/api/ops/incidents/action', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        orgId: currentOrg.id,
        action: 'create',
        title: newIncidentTitle.trim(),
        severity: 'high',
      }),
    });
    if (res.ok) {
      setNewIncidentTitle('');
      await fetchOperationsData();
      setBannerMessage({ title: 'Incident opened in DETECTED state.', type: 'info' });
    }
  };

  const handleAdvanceIncident = async (incidentId: string, nextState: string) => {
    const res = await fetch('/api/ops/incidents/action', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        orgId: currentOrg.id,
        action: 'transition',
        incidentId,
        targetState: nextState,
        note: `Operator advanced incident workflow to ${nextState}`,
      }),
    });
    if (res.ok) {
      await fetchOperationsData();
    }
  };

  const activeTasksCount = tasks.filter((t) => t.status === 'running').length;
  const queuedTasksCount = tasks.filter((t) => t.status === 'queued').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2DBD0] dark:border-[#382F47] pb-4">
        <div>
          <p className="text-xs font-mono text-[#77717D] dark:text-[#AFA8B8]">
            Operations & Reliability / {currentOrg.name} ·{' '}
            {telemetry ? `Measured ${new Date(telemetry.measuredAt).toLocaleTimeString()}` : 'Collecting...'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Operations & Observability Console
          </h1>
        </div>

        <button
          onClick={fetchOperationsData}
          disabled={isRefreshing}
          className="px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {loadError && (
        <div className="p-3 rounded-xl bg-[#FF806E]/15 border border-[#FF806E]/40 text-xs text-[#211B2C] dark:text-[#F5F1E9] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF806E] shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Segmented Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Operations Console Sections"
        className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#EBE5DB]/70 dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47]"
      >
        {(
          [
            { id: 'telemetry', label: 'Runtime Telemetry' },
            { id: 'incidents', label: `Alerts & Incidents (${alerts.filter((a) => a.status !== 'resolved').length})` },
            { id: 'logs', label: `Structured Logs (${logs.length})` },
            { id: 'config', label: 'Environment & Security' },
          ] as { id: OpsTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeSubTab === tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === tab.id
                ? 'bg-[#FFFEFC] dark:bg-[#211B2C] text-[#211B2C] dark:text-[#F5F1E9] shadow-xs'
                : 'text-[#77717D] dark:text-[#AFA8B8] hover:text-[#211B2C] dark:hover:text-[#F5F1E9]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: RUNTIME TELEMETRY */}
      {activeSubTab === 'telemetry' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#77717D] dark:text-[#AFA8B8]">
                <span className="font-semibold">Server Process RSS</span>
                <HardDrive className="w-4 h-4 text-[#10B981]" />
              </div>
              <div className="text-2xl font-extrabold font-mono tabular-nums">
                {telemetry ? `${telemetry.memory.rssMb} MB` : '—'}
              </div>
              <div className="text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8] tabular-nums">
                Heap: {telemetry ? `${telemetry.memory.heapUsedMb} / ${telemetry.memory.heapTotalMb} MB` : '—'}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#77717D] dark:text-[#AFA8B8]">
                <span className="font-semibold">API Latency (P50 / P95)</span>
                <Clock className="w-4 h-4 text-[#8B5CF6]" />
              </div>
              <div className="text-2xl font-extrabold font-mono tabular-nums">
                {telemetry ? `${telemetry.requests.p50LatencyMs} / ${telemetry.requests.p95LatencyMs} ms` : '—'}
              </div>
              <div className="text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8] tabular-nums">
                Requests: {telemetry?.requests.totalRequests ?? 0} · Error Rate:{' '}
                {telemetry?.requests.errorRatePercent ?? 0}%
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#77717D] dark:text-[#AFA8B8]">
                <span className="font-semibold">Client Frame Rate & Tasks</span>
                <Activity className="w-4 h-4 text-[#8B5CF6]" />
              </div>
              <div className="text-2xl font-extrabold font-mono tabular-nums">{fps} FPS</div>
              <div className="text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8] tabular-nums">
                {activeTasksCount} Running · {queuedTasksCount} Queued
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#77717D] dark:text-[#AFA8B8]">
                <span className="font-semibold">Gateway & Provider</span>
                <Gauge className="w-4 h-4 text-[#FF806E]" />
              </div>
              <div className="text-2xl font-extrabold font-mono tabular-nums">
                {telemetry ? `${telemetry.providerStatus.rateLimitMaxPerMinute} req/m` : '60 req/m'}
              </div>
              <div className="text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
                Gemini Key: {telemetry?.providerStatus.geminiKeyConfigured ? 'Configured' : 'Missing'} · Uptime{' '}
                {telemetry ? `${telemetry.uptimeSeconds}s` : '—'}
              </div>
            </div>
          </div>

          {/* 15 Agent Runtime Matrix */}
          <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Server className="w-4 h-4 text-[#8B5CF6]" />
                15 Canonical AI Employees Runtime Registry
              </h2>
              <span className="text-xs font-mono text-[#77717D] dark:text-[#AFA8B8] tabular-nums">
                {TEAMORA_AGENTS.length} / 15 Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TEAMORA_AGENTS.map((agent) => (
                <div
                  key={agent.id}
                  className="p-3 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{agent.name}</div>
                    <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] truncate">{agent.role}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-mono font-semibold text-[#10B981] tabular-nums">
                      {agent.uptime}
                    </div>
                    <div className="text-[10px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
                      {agent.preferredModel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALERTS & INCIDENTS */}
      {activeSubTab === 'incidents' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Alerts Panel */}
          <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#FF806E]" />
                Operational Alerts (Deduplicated)
              </h2>
              <button
                onClick={() => handleAlertAction('trigger')}
                className="px-3 py-1.5 rounded-lg bg-[#211B2C] dark:bg-[#C7F36B] text-white dark:text-[#162700] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
              >
                Run Alert Check
              </button>
            </div>

            {alerts.length === 0 ? (
              <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] py-4">
                No active operational alerts recorded for this organization.
              </p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold">{alert.title}</div>
                        <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                          {alert.severity.toUpperCase()} · {alert.status.toUpperCase()} · Hits:{' '}
                          <span className="font-mono tabular-nums">{alert.occurrenceCount}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {alert.status === 'active' && (
                          <button
                            onClick={() => handleAlertAction('acknowledge', alert.id)}
                            className="px-2 py-1 rounded text-[11px] font-semibold bg-[#8B5CF6] text-white cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alert.status !== 'resolved' && (
                          <button
                            onClick={() => handleAlertAction('resolve', alert.id)}
                            className="px-2 py-1 rounded text-[11px] font-semibold bg-[#10B981] text-white cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incident Lifecycle Panel */}
          <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-[#8B5CF6]" />
              Incident Lifecycle Tracker
            </h2>

            <form onSubmit={handleCreateIncident} className="flex gap-2">
              <input
                type="text"
                value={newIncidentTitle}
                onChange={(e) => setNewIncidentTitle(e.target.value)}
                placeholder="Log operational incident summary..."
                className="flex-1 px-3 py-2 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-[#8B5CF6] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
              >
                Open Incident
              </button>
            </form>

            {incidents.length === 0 ? (
              <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] py-4">
                Zero open operational incidents. Lifecycle tracks DETECTED through CLOSED.
              </p>
            ) : (
              <div className="space-y-3">
                {incidents.map((inc) => {
                  const nextState = NEXT_INCIDENT_STATE[inc.state];
                  return (
                    <div
                      key={inc.id}
                      className="p-3 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold">{inc.title}</div>
                          <div className="text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
                            State: <span className="text-[#8B5CF6] font-semibold">{inc.state}</span> · Owner:{' '}
                            {inc.owner}
                          </div>
                        </div>
                        {nextState && (
                          <button
                            onClick={() => handleAdvanceIncident(inc.id, nextState)}
                            className="px-2.5 py-1 rounded text-[11px] font-semibold bg-[#8B5CF6] text-white cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                          >
                            <Wrench className="w-3 h-3" />
                            <span>Move to {nextState}</span>
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">Root cause: {inc.rootCause}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STRUCTURED LOGS */}
      {activeSubTab === 'logs' && (
        <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#8B5CF6]" />
              Redacted Structured Request Logs
            </h2>
            <span className="text-xs font-mono text-[#77717D] dark:text-[#AFA8B8]">
              Secrets & tokens automatically masked
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2DBD0] dark:border-[#382F47] text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
                <tr>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Level</th>
                  <th className="py-2 pr-4">Method & Path</th>
                  <th className="py-2 pr-4 text-right">Status</th>
                  <th className="py-2 pr-4 text-right">Duration</th>
                  <th className="py-2">Correlation ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DBD0]/60 dark:divide-[#382F47]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[#77717D]">
                      No structured telemetry entries yet. Click Refresh Telemetry to capture API requests.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F5F1E9]/60 dark:hover:bg-[#2C2438]/60">
                      <td className="py-2 pr-4 font-mono tabular-nums whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 pr-4 font-mono uppercase">{log.level}</td>
                      <td className="py-2 pr-4 font-mono">
                        {log.method} {log.endpoint}
                      </td>
                      <td className="py-2 pr-4 font-mono tabular-nums text-right">{log.statusCode}</td>
                      <td className="py-2 pr-4 font-mono tabular-nums text-right">{log.durationMs}ms</td>
                      <td className="py-2 font-mono text-[#77717D] dark:text-[#AFA8B8]">{log.correlationId}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ENVIRONMENT & CRYPTOGRAPHIC AUDIT */}
      {activeSubTab === 'config' && (
        <div className="space-y-6">
          {envHealth && (
            <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold">
                  Environment & Secrets Configuration ({envHealth.environment} · Billing: {envHealth.billingMode})
                </h2>
                <span className="text-xs font-mono text-[#77717D] dark:text-[#AFA8B8]">
                  Project: {envHealth.firebaseProjectId || 'unconfigured'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {envHealth.checks.map((chk) => (
                  <div
                    key={chk.key}
                    className="p-3 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold">{chk.key}</span>
                      <span
                        className={
                          chk.status === 'ok'
                            ? 'text-[#10B981]'
                            : chk.status === 'warning'
                            ? 'text-[#D97706]'
                            : 'text-[#FF806E]'
                        }
                      >
                        {chk.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">{chk.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Audit Trail Verification */}
          <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  Cryptographic Audit Log Integrity (SHA-256 Chain)
                </h2>
                <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] mt-0.5">
                  Verifies server-side audit entries have not been altered out of order.
                </p>
              </div>
              <button
                onClick={fetchOperationsData}
                className="px-3.5 py-2 rounded-lg bg-[#8B5CF6] text-white font-semibold text-xs cursor-pointer whitespace-nowrap shrink-0"
              >
                Verify Chain
              </button>
            </div>

            {auditIntegrity && (
              <div className="p-4 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Chain Status</span>
                  <span className="font-bold text-[#10B981] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {auditIntegrity.valid ? 'Verified Intact' : 'Tampering Detected'}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] text-[#77717D] dark:text-[#AFA8B8] tabular-nums">
                  <span>Entries: {auditIntegrity.entriesCount}</span>
                  <span>Head: {auditIntegrity.headHash ? `${auditIntegrity.headHash.slice(0, 16)}...` : 'Genesis'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
