import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Server,
  Key,
} from 'lucide-react';

export const SecurityLogsView: React.FC = () => {
  const { auditLogs, logAuditAction } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#10B981]/15 text-[#10B981]">
            Zero-Trust Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Security & Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Tamper-evident system log tracking multi-agent operations, human approval decisions, and authentication events.
          </p>
        </div>
      </div>

      {/* Security Invariant Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#211B2C] dark:text-[#F5F1E9]">
              Server-Side Secret Isolation
            </div>
            <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
              GEMINI_API_KEY never leaks to client bundle
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#211B2C] dark:text-[#F5F1E9]">
              Firestore Hardened Rules
            </div>
            <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
              ABAC & Zero-Trust default-deny active
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF806E]/20 text-[#FF806E] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#211B2C] dark:text-[#F5F1E9]">
              Human-in-the-Loop Gate
            </div>
            <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
              Payouts & emails require sign-off
            </div>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-[#77717D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit records by actor, action, or resource..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>
        <span className="text-[10px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
          {filteredLogs.length} Traceable Events
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F1E9] dark:bg-[#2C2438] border-b border-[#E2DBD0] dark:border-[#382F47] text-[#77717D] dark:text-[#AFA8B8] font-mono uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Action Code</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Resource</th>
                <th className="px-5 py-3.5">IP Address</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DBD0] dark:divide-[#382F47]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F5F1E9]/50 dark:hover:bg-[#2C2438]/50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        log.status === 'success'
                          ? 'bg-[#10B981]/20 text-[#10B981]'
                          : log.status === 'warning'
                          ? 'bg-[#FF806E]/20 text-[#FF806E]'
                          : 'bg-[#FF806E] text-white'
                      }`}
                    >
                      {log.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
                      {log.status === 'warning' && <AlertTriangle className="w-3 h-3" />}
                      <span>{log.status}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-xs text-[#8B5CF6]">
                    {log.action}
                  </td>
                  <td className="px-5 py-4 font-semibold text-[#211B2C] dark:text-[#F5F1E9]">
                    {log.actor}
                  </td>
                  <td className="px-5 py-4 text-[#77717D] dark:text-[#AFA8B8] max-w-xs truncate">
                    {log.resource}
                  </td>
                  <td className="px-5 py-4 font-mono text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                    {log.ipAddress}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
