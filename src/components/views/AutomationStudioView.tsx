import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  GitBranch,
  Play,
  Pause,
  Plus,
  Zap,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AutomationStudioView: React.FC = () => {
  const { workflows, toggleWorkflowStatus, runWorkflowNow } = useApp();
  const [selectedWf, setSelectedWf] = useState<(typeof workflows)[0]>(workflows[0]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#C7F36B]/20 text-[#162700] dark:text-[#C7F36B]">
            Event-Driven Architecture
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Automation Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Supervised by Synapse (Workflow Automation Agent). Build multi-step trigger, condition, and action pipelines with integrated human approval gates.
          </p>
        </div>

        <button
          onClick={() => runWorkflowNow(selectedWf.id)}
          className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all self-start sm:self-auto"
        >
          <Play className="w-4 h-4" />
          <span>Execute Selected Workflow</span>
        </button>
      </div>

      {/* Grid: Workflow List on Left, Visual Flow Canvas on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 4 Cols: Workflows List */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-[10px] font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
            Active Workflows ({workflows.length})
          </span>
          {workflows.map((wf) => (
            <div
              key={wf.id}
              onClick={() => setSelectedWf(wf)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                selectedWf.id === wf.id
                  ? 'bg-[#FFFEFC] dark:bg-[#2C2438] border-[#8B5CF6] shadow-md ring-1 ring-[#8B5CF6]'
                  : 'bg-[#FFFEFC]/70 dark:bg-[#211B2C] border-[#E2DBD0] dark:border-[#382F47] hover:border-[#8B5CF6]/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-xs text-[#211B2C] dark:text-[#F5F1E9] leading-snug">
                  {wf.name}
                </h3>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                    wf.status === 'active'
                      ? 'bg-[#10B981]/20 text-[#10B981]'
                      : 'bg-[#77717D]/20 text-[#77717D]'
                  }`}
                >
                  {wf.status}
                </span>
              </div>

              <p className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] line-clamp-2">
                {wf.description}
              </p>

              <div className="pt-2 border-t border-[#E2DBD0] dark:border-[#382F47] flex items-center justify-between text-[10px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
                <span>{wf.stepsCount} Nodes</span>
                <span>{wf.executionsCount} Runs</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWorkflowStatus(wf.id);
                  }}
                  className="font-bold text-[#8B5CF6] hover:underline"
                >
                  {wf.status === 'active' ? 'Pause' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right 8 Cols: Visual Node Flow Pipeline Canvas */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2DBD0] dark:border-[#382F47]">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#8B5CF6] font-bold">
                Visual Flow Inspector
              </span>
              <h2 className="font-heading font-extrabold text-base text-[#211B2C] dark:text-[#F5F1E9]">
                {selectedWf.name}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleWorkflowStatus(selectedWf.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F5F1E9] dark:bg-[#2C2438] hover:text-[#8B5CF6] cursor-pointer flex items-center gap-1.5"
              >
                {selectedWf.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{selectedWf.status === 'active' ? 'Pause Pipeline' : 'Resume Pipeline'}</span>
              </button>
            </div>
          </div>

          {/* Visual Step Nodes */}
          <div className="space-y-4">
            {/* Step 1: Trigger Node */}
            <div className="p-4 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border-l-4 border-l-[#C7F36B] border border-[#E2DBD0] dark:border-[#382F47] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-[#C7F36B] dark:text-[#C7F36B] flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  Step 1: Event Trigger
                </span>
                <span className="text-[10px] font-mono text-[#77717D] dark:text-[#AFA8B8]">Webhook / DB Event</span>
              </div>
              <h4 className="font-bold text-xs text-[#211B2C] dark:text-[#F5F1E9]">{selectedWf.trigger}</h4>
              <p className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                Listens continuously for state changes in Cloud Firestore or inbound webhooks.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-[#8B5CF6]/50" />
            </div>

            {/* Step 2: Agent Action Node */}
            <div className="p-4 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border-l-4 border-l-[#8B5CF6] border border-[#E2DBD0] dark:border-[#382F47] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-[#8B5CF6] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Step 2: AI Agent Execution
                </span>
                <span className="text-[10px] font-mono text-[#77717D] dark:text-[#AFA8B8]">Gemini Reasoning</span>
              </div>
              <h4 className="font-bold text-xs text-[#211B2C] dark:text-[#F5F1E9]">
                Specialized Agent Processing
              </h4>
              <p className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                Dispatches contextual payload to assigned agent, synthesizes draft deliverable or proposal.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-[#8B5CF6]/50" />
            </div>

            {/* Step 3: Human Safety Gate Node */}
            <div className="p-4 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border-l-4 border-l-[#FF806E] border border-[#E2DBD0] dark:border-[#382F47] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-[#FF806E] flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Step 3: Human Approval Gate
                </span>
                <span className="text-[10px] font-mono text-[#FF806E] font-bold">Mandatory Protection</span>
              </div>
              <h4 className="font-bold text-xs text-[#211B2C] dark:text-[#F5F1E9]">
                Manager Sign-Off Required Before Outbound Dispatch
              </h4>
              <p className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                Stops execution until authorized in Safe Approvals Center. Prevents irreversible actions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
