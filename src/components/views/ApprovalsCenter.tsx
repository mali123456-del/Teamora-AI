import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  FileText,
  Mail,
  DollarSign,
  Play,
  RotateCw,
  Server,
} from 'lucide-react';

export const ApprovalsCenter: React.FC = () => {
  const { approvals, resolveApproval, executeApproval } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'executed' | 'rejected'>('all');
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [executingId, setExecutingId] = useState<string | null>(null);

  const filtered = approvals.filter((a) => {
    if (filter === 'pending') return a.status === 'pending';
    if (filter === 'approved') return a.status === 'approved';
    if (filter === 'executed') return a.status === 'executed';
    if (filter === 'rejected') return a.status === 'rejected';
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

  const handleExecute = async (id: string) => {
    setExecutingId(id);
    await executeApproval(id);
    setExecutingId(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Title & Safety Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#FF806E]/15 text-[#FF806E]">
            Zero-Trust Execution Gate · Phase 28 Architecture
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Safe Approvals & Execution Center
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Two-stage human-in-the-loop gate: Approval authorizes the policy, while Execution is a distinct server-verified external dispatch with verified audit receipts.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs">
          {(['all', 'pending', 'approved', 'executed', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors capitalize ${
                filter === tab
                  ? 'bg-[#8B5CF6] text-white font-semibold'
                  : 'text-[#77717D] dark:text-[#AFA8B8]'
              }`}
            >
              {tab} ({approvals.filter((a) => (tab === 'all' ? true : a.status === tab)).length})
            </button>
          ))}
        </div>
      </div>

      {/* Approvals List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-3">
          <ShieldCheck className="w-12 h-12 text-[#10B981] mx-auto" />
          <h3 className="font-bold text-base text-[#211B2C] dark:text-[#F5F1E9]">
            No Records in this Filter
          </h3>
          <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] max-w-md mx-auto">
            All operations are up to date. Autonomous agents are executing within standard safety boundaries.
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
                  : item.status === 'approved'
                  ? 'bg-[#FFFEFC] dark:bg-[#211B2C] border-[#C7F36B]/80 shadow-md'
                  : item.status === 'executed'
                  ? 'bg-[#FFFEFC]/80 dark:bg-[#211B2C]/80 border-[#10B981]/40'
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
                          ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
                          : item.status === 'executed'
                          ? 'bg-[#10B981]/20 text-[#10B981]'
                          : item.status === 'executing'
                          ? 'bg-[#C7F36B]/30 text-[#211B2C] dark:text-[#C7F36B]'
                          : item.status === 'execution_failed'
                          ? 'bg-[#EF4444]/20 text-[#EF4444]'
                          : 'bg-[#77717D]/20 text-[#77717D]'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
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

                  {/* Execution Result Box if Executed */}
                  {item.executionResult && (
                    <div className="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-xs text-[#211B2C] dark:text-[#F5F1E9] flex items-start gap-2 font-mono">
                      <Server className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[#10B981]">Gateway Output ({item.executionId}): </span>
                        <span>{item.executionResult}</span>
                      </div>
                    </div>
                  )}

                  {/* Payload Details */}
                  <div className="flex flex-wrap gap-3 text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
                    <span>Requesting Agent: <strong className="text-[#8B5CF6]">{item.agentName}</strong></span>
                    <span>Created: {new Date(item.createdAt).toLocaleTimeString()}</span>
                    {item.decidedBy && (
                      <span className="text-[#8B5CF6]">
                        Authorized by: <strong>{item.decidedBy}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Decision and Execution Action Buttons */}
                <div className="shrink-0 flex sm:flex-col lg:flex-row items-center gap-2">
                  {item.status === 'pending' && (
                    <>
                      <button
                        onClick={() => resolveApproval(item.id, 'approved')}
                        className="px-4 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-105"
                      >
                        <Check className="w-4 h-4" />
                        <span>Authorize Action</span>
                      </button>
                      <button
                        onClick={() => setRejectModalId(item.id)}
                        className="px-4 py-2.5 rounded-xl bg-[#FF806E] hover:bg-[#EA580C] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-105"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject & Abort</span>
                      </button>
                    </>
                  )}

                  {item.status === 'approved' && (
                    <button
                      disabled={executingId === item.id}
                      onClick={() => handleExecute(item.id)}
                      className="px-5 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-transform hover:scale-105 disabled:opacity-50"
                    >
                      {executingId === item.id ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>Executing via Gateway...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Dispatch via Gateway</span>
                        </>
                      )}
                    </button>
                  )}

                  {item.status === 'execution_failed' && (
                    <button
                      onClick={() => handleExecute(item.id)}
                      className="px-4 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>Retry Dispatch</span>
                    </button>
                  )}

                  {item.status === 'executed' && (
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-[#10B981] flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Executed & Verified
                      </span>
                    </div>
                  )}

                  {item.status === 'rejected' && (
                    <div className="text-right">
                      <span className="text-xs font-mono font-semibold text-[#FF806E]">
                        Aborted by Human Manager
                      </span>
                    </div>
                  )}
                </div>
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
