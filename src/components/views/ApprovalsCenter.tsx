import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  FileText,
  Mail,
  DollarSign,
  Clock,
  Sparkles,
} from 'lucide-react';

export const ApprovalsCenter: React.FC = () => {
  const { approvals, resolveApproval, formatCurrency } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = approvals.filter((a) => {
    if (filter === 'pending') return a.status === 'pending';
    if (filter === 'resolved') return a.status !== 'pending';
    return true;
  });

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'payout':
      case 'refund':
        return <DollarSign className="w-4 h-4 text-[#10B981]" />;
      case 'email_send':
        return <Mail className="w-4 h-4 text-[#38BDF8]" />;
      default:
        return <FileText className="w-4 h-4 text-[#8B5CF6]" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Title & Safety Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#FF806E]/15 text-[#FF806E]">
            Zero-Trust Execution Gate
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Safe Approvals Center
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Irreversible agent operations (financial payouts, contract signings, external emails) are strictly paused until authorized by a verified human manager.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              filter === 'all'
                ? 'bg-[#8B5CF6] text-white font-semibold'
                : 'text-[#77717D] dark:text-[#AFA8B8]'
            }`}
          >
            All Requests ({approvals.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              filter === 'pending'
                ? 'bg-[#FF806E] text-white font-semibold'
                : 'text-[#77717D] dark:text-[#AFA8B8]'
            }`}
          >
            Pending ({approvals.filter((a) => a.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              filter === 'resolved'
                ? 'bg-[#10B981] text-white font-semibold'
                : 'text-[#77717D] dark:text-[#AFA8B8]'
            }`}
          >
            Resolved ({approvals.filter((a) => a.status !== 'pending').length})
          </button>
        </div>
      </div>

      {/* Approvals List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-3">
          <ShieldCheck className="w-12 h-12 text-[#10B981] mx-auto" />
          <h3 className="font-bold text-base text-[#211B2C] dark:text-[#F5F1E9]">
            All Operations Cleared
          </h3>
          <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] max-w-md mx-auto">
            No pending operations requiring human intervention. Autonomous agents are executing within standard safety boundaries.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-6 rounded-2xl border transition-all ${
                item.status === 'pending'
                  ? 'bg-[#FFFEFC] dark:bg-[#211B2C] border-[#FF806E]/60 shadow-lg'
                  : 'bg-[#FFFEFC]/60 dark:bg-[#211B2C]/60 border-[#E2DBD0] dark:border-[#382F47]'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left: Summary, Consequences, Agent */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#EBE5DB] dark:bg-[#382F47] flex items-center justify-center">
                      {getActionIcon(item.actionType)}
                    </div>
                    <span className="font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">
                      {item.title}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        item.status === 'pending'
                          ? 'bg-[#FF806E]/20 text-[#FF806E]'
                          : item.status === 'approved'
                          ? 'bg-[#10B981]/20 text-[#10B981]'
                          : 'bg-[#77717D]/20 text-[#77717D]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] leading-relaxed">
                    {item.description}
                  </p>

                  {/* Warning / Consequence Box */}
                  <div className="p-3 rounded-xl bg-[#FF806E]/10 border border-[#FF806E]/20 text-xs text-[#211B2C] dark:text-[#F5F1E9] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#FF806E] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#FF806E]">Irreversible Action: </span>
                      <span>{item.consequences}</span>
                    </div>
                  </div>

                  {/* Payload Details */}
                  <div className="flex flex-wrap gap-3 text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
                    <span>Requesting Agent: <strong className="text-[#8B5CF6]">{item.agentName}</strong></span>
                    <span>Created: {new Date(item.createdAt).toLocaleTimeString()}</span>
                    {item.decidedBy && (
                      <span className="text-[#10B981]">
                        Decided by: <strong>{item.decidedBy}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Decision Action Buttons */}
                {item.status === 'pending' ? (
                  <div className="flex sm:flex-col lg:flex-row items-center gap-3 shrink-0">
                    <button
                      onClick={() => resolveApproval(item.id, 'approved')}
                      className="px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-105"
                    >
                      <Check className="w-4 h-4" />
                      <span>Authorize Action</span>
                    </button>
                    <button
                      onClick={() => setRejectModalId(item.id)}
                      className="px-5 py-2.5 rounded-xl bg-[#FF806E] hover:bg-[#EA580C] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-105"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject & Abort</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-semibold text-[#77717D] dark:text-[#AFA8B8]">
                      Archived to Audit Log
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-heading font-bold text-base text-[#211B2C] dark:text-[#F5F1E9]">
              Confirm Action Rejection
            </h3>
            <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">
              State the reasoning for aborting this autonomous action. The agent will log the note and cancel the execution pipeline.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Budget ceiling reached; postpone until Q4..."
              className="w-full h-24 p-3 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#FF806E]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#77717D] dark:text-[#AFA8B8] hover:bg-[#EBE5DB] dark:hover:bg-[#382F47] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resolveApproval(rejectModalId, 'rejected', rejectReason);
                  setRejectModalId(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF806E] text-white hover:bg-[#EA580C] cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
