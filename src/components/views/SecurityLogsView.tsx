import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  DatabaseBackup,
  RotateCcw,
} from 'lucide-react';

interface SnapshotMeta {
  snapshotId: string;
  createdAt: string;
  checksumSha256: string;
  byteSize: number;
  entityCounts: Record<string, number>;
}

export const SecurityLogsView: React.FC = () => {
  const {
    auditLogs,
    currentOrg,
    user,
    tasks,
    projects,
    documents,
    workflows,
    setBannerMessage,
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      'x-teamora-org': currentOrg.id,
      'x-teamora-sandbox': 'true',
      'x-teamora-uid': user?.uid || 'user-admin-002',
    }),
    [currentOrg.id, user?.uid]
  );

  const buildTenantDataset = () => ({
    organization: currentOrg,
    tasks: tasks.filter((t) => t.orgId === currentOrg.id),
    projects: projects.filter((p) => p.orgId === currentOrg.id),
    agentAssignments: [],
    knowledgeRecords: documents.filter((d) => d.orgId === currentOrg.id),
    workflows: workflows.filter((w) => w.orgId === currentOrg.id),
    reports: [],
    auditLogs: auditLogs.filter((l) => l.orgId === currentOrg.id),
  });

  const loadSnapshots = useCallback(async () => {
    try {
      const res = await fetch(`/api/backup/snapshots?orgId=${currentOrg.id}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.snapshots || []);
      }
    } catch {
      // Non-fatal on offline view
    }
  }, [authHeaders, currentOrg.id]);

  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  const handleCreateBackup = async () => {
    setIsWorking(true);
    try {
      const res = await fetch('/api/backup/snapshots', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          orgId: currentOrg.id,
          dataset: buildTenantDataset(),
          retentionDays: 30,
        }),
      });
      if (res.ok) {
        await loadSnapshots();
        setBannerMessage({
          title: `Immutable backup snapshot created for ${currentOrg.name}.`,
          type: 'success',
        });
      }
    } finally {
      setIsWorking(false);
    }
  };

  const handleVerifyLatestRestore = async () => {
    if (snapshots.length === 0) return;
    setIsWorking(true);
    try {
      const res = await fetch('/api/backup/restore-verify', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          orgId: currentOrg.id,
          snapshotId: snapshots[0].snapshotId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const r = data.report;
        setRestoreStatus(
          r.passed
            ? `Sandbox restore verified in ${r.measuredRtoMs}ms (${r.sandboxNamespace}) · Checksum & Tenant Isolation Valid`
            : `Restore check failed: ${r.failureReason || 'Integrity check failed'}`
        );
      }
    } finally {
      setIsWorking(false);
    }
  };

  const handleExportData = async (format: 'json' | 'csv') => {
    setIsWorking(true);
    try {
      const res = await fetch('/api/export/tenant-data', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          orgId: currentOrg.id,
          format,
          dataset: buildTenantDataset(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const pkg = data.exportPackage;
        const blob = new Blob([pkg.content], { type: pkg.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pkg.filename;
        a.click();
        URL.revokeObjectURL(url);
        setBannerMessage({
          title: `Exported ${pkg.filename} (${format.toUpperCase()}, SHA-256 verified).`,
          type: 'success',
        });
      } else {
        const err = await res.json();
        setBannerMessage({ title: err.error || 'Export blocked', type: 'warning' });
      }
    } finally {
      setIsWorking(false);
    }
  };

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2DBD0] dark:border-[#382F47] pb-4">
        <div>
          <p className="text-xs font-mono text-[#77717D] dark:text-[#AFA8B8]">
            Zero-Trust Governance / {currentOrg.name}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Security, Backup & Data Portability
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Tamper-evident audit logs, immutable checksummed snapshots, isolated sandbox restore verification, and multi-format tenant export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => handleExportData('json')}
            disabled={isWorking}
            className="px-3.5 py-2 rounded-lg border border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC] dark:bg-[#211B2C] text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:border-[#8B5CF6] whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => handleExportData('csv')}
            disabled={isWorking}
            className="px-3.5 py-2 rounded-lg border border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC] dark:bg-[#211B2C] text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:border-[#8B5CF6] whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={isWorking}
            className="px-3.5 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <DatabaseBackup className="w-3.5 h-3.5" />
            <span>Create Backup Snapshot</span>
          </button>
        </div>
      </div>

      {/* Security & Portability Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">Server-Side Secret Isolation</div>
            <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
              Secrets excluded from exports and client bundle
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">Firestore ABAC Rules</div>
            <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
              Default-deny tenant boundary protection
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FF806E]/15 text-[#FF806E] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">Backup Snapshots ({snapshots.length})</div>
            <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
              {snapshots[0]
                ? `Latest SHA-256: ${snapshots[0].checksumSha256.slice(0, 12)}...`
                : 'No snapshots created in current session'}
            </div>
          </div>
        </div>
      </div>

      {/* Sandbox Restore Verification Bar */}
      {snapshots.length > 0 && (
        <div className="p-4 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs">
            <div className="font-bold">Isolated Sandbox Restore Verification</div>
            <div className="text-[#77717D] dark:text-[#AFA8B8] font-mono text-[11px] tabular-nums">
              {restoreStatus ||
                `Latest snapshot ${snapshots[0].snapshotId} (${snapshots[0].byteSize} bytes)`}
            </div>
          </div>
          <button
            onClick={handleVerifyLatestRestore}
            disabled={isWorking}
            className="px-3.5 py-2 rounded-lg bg-[#211B2C] dark:bg-[#C7F36B] text-white dark:text-[#162700] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Verify Sandbox Restore</span>
          </button>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="p-4 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-[#77717D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit records by actor, action, or resource..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>
        <span className="text-xs font-mono text-[#77717D] dark:text-[#AFA8B8] tabular-nums whitespace-nowrap">
          {filteredLogs.length} Events
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F1E9] dark:bg-[#2C2438] border-b border-[#E2DBD0] dark:border-[#382F47] text-[#77717D] dark:text-[#AFA8B8] font-mono text-[11px]">
              <tr>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action Code</th>
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Resource</th>
                <th className="px-5 py-3">IP Address</th>
                <th className="px-5 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DBD0] dark:divide-[#382F47]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F5F1E9]/50 dark:hover:bg-[#2C2438]/50 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase ${
                        log.status === 'success'
                          ? 'text-[#10B981]'
                          : log.status === 'warning'
                          ? 'text-[#D97706]'
                          : 'text-[#FF806E]'
                      }`}
                    >
                      {log.status === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      <span>{log.status}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-xs text-[#8B5CF6]">{log.action}</td>
                  <td className="px-5 py-3.5 font-semibold">{log.actor}</td>
                  <td className="px-5 py-3.5 text-[#77717D] dark:text-[#AFA8B8] max-w-xs truncate">
                    {log.resource}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                    {log.ipAddress}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
