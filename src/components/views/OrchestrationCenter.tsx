import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { TeamoraWorkforceCanvas } from '../three/TeamoraWorkforceCanvas.tsx';
import { TEAMORA_AGENTS } from '../../data/agents.ts';
import { orchestrateWorkforce } from '../../lib/gemini.ts';
import {
  Workflow,
  Sparkles,
  Play,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Layers,
  BrainCircuit,
  Eye,
  Send,
} from 'lucide-react';

export const OrchestrationCenter: React.FC = () => {
  const { addTask, user, setSelectedAgentId, setActiveTab } = useApp();
  const [goalInput, setGoalInput] = useState('');
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<{
    summary?: string;
    subtasks?: Array<{
      agentId: string;
      agentName: string;
      title: string;
      prompt: string;
      requiresApproval: boolean;
      consequences?: string;
    }>;
    rawText?: string;
  } | null>(null);

  const sampleGoals = [
    'Expand Enterprise Sales into Pakistan logistics firms with PKR localized billing and outreach',
    'Execute Q3 Product Launch: Coordinate Marketing ad campaign, Content release notes, and Support FAQs',
    'Audit annual software licenses, flag redundancies > $500, and simulate 90-day cash flow runway',
  ];

  const handleRunOrchestrator = async (targetGoal?: string) => {
    const goal = targetGoal || goalInput.trim();
    if (!goal || isOrchestrating) return;

    setIsOrchestrating(true);
    setGeneratedPlan(null);

    try {
      const availableAgentNames = TEAMORA_AGENTS.map((a) => `${a.name} (${a.role})`);
      const response = await orchestrateWorkforce({
        goal,
        agents: availableAgentNames,
        context: {
          organization: 'Apex Global Enterprises',
          currentQuarter: 'Q3',
          safetyPolicy: 'Strict human approval on payments, contracts, and external emails',
        },
      });

      if (response.raw) {
        // Try parsing JSON if formatted, or display formatted markdown
        let parsed: any = null;
        try {
          const jsonMatch = response.raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          // Fallback to text
        }

        if (parsed && parsed.subtasks) {
          setGeneratedPlan({
            summary: parsed.planSummary || parsed.reasoning,
            subtasks: parsed.subtasks.map((st: any) => ({
              agentId: st.agentId || 'workforce-manager',
              agentName: st.agentName || 'Agent',
              title: st.actionTitle || st.title || 'Subtask',
              prompt: st.prompt || 'Execute subtask',
              requiresApproval: !!st.requiresApproval,
              consequences: st.consequences,
            })),
            rawText: response.raw,
          });

          // Deploy subtasks to Task Center
          parsed.subtasks.forEach((st: any) => {
            addTask({
              agentId: st.agentId || 'workforce-manager',
              agentName: st.agentName || 'Agent',
              title: st.actionTitle || st.title || 'Decomposed Subtask',
              prompt: st.prompt || 'Decomposed by Orchestrator',
              status: st.requiresApproval ? 'needs_approval' : 'completed',
              priority: 'high',
              requiresApproval: st.requiresApproval,
              createdBy: 'Orchestrator (Atlas)',
              modelUsed: 'gemini-4-argon (Thinking HIGH)',
              result: `Subtask assigned and staged. ${st.requiresApproval ? 'Waiting for human sign-off in Approvals Gate.' : 'Autonomous execution complete.'}`,
            });
          });
        } else {
          setGeneratedPlan({
            rawText: response.raw,
          });
        }
      }
    } catch (err) {
      console.error('Orchestration error:', err);
    } finally {
      setIsOrchestrating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#8B5CF6]/15 text-[#8B5CF6]">
            Multi-Agent Neural Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Workforce Orchestration Center
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Real-time 3D simulation of connected agents, inter-departmental dependencies, and autonomous pipeline decomposition.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#C7F36B]" />
            <span>15 Synchronized Agents</span>
          </div>
        </div>
      </div>

      {/* 3D Neural Workforce Canvas */}
      <div className="h-[460px] sm:h-[500px] w-full rounded-2xl overflow-hidden border border-[#E2DBD0] dark:border-[#382F47] shadow-xl relative bg-[#211B2C]">
        <TeamoraWorkforceCanvas
          onSelectAgent={(agentId) => {
            setSelectedAgentId(agentId);
            setActiveTab('agent-workspace');
          }}
        />
      </div>

      {/* Autonomous Pipeline Decomposition Engine */}
      <div className="p-6 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#8B5CF6] text-white flex items-center justify-center">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-lg text-[#211B2C] dark:text-[#F5F1E9]">
              Autonomous Goal Orchestrator (Powered by Gemini 4 Argon)
            </h2>
            <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">
              Input a strategic business objective. Atlas (Workforce Manager) will evaluate dependencies, delegate subtasks across specialized agents, and stage human approval requirements.
            </p>
          </div>
        </div>

        {/* Input box */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="e.g. Launch Pakistani e-commerce expansion with localized PKR payments, customer support and supplier contracts..."
              className="flex-1 px-4 py-3 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs sm:text-sm text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
            />
            <button
              onClick={() => handleRunOrchestrator()}
              disabled={isOrchestrating || !goalInput.trim()}
              className="px-6 py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md transition-all shrink-0"
            >
              {isOrchestrating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Reasoning...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Orchestrate Pipeline</span>
                </>
              )}
            </button>
          </div>

          {/* Preset sample objectives */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8]">Try Sample Objective:</span>
            {sampleGoals.map((g, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setGoalInput(g);
                  handleRunOrchestrator(g);
                }}
                className="px-3 py-1 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-[11px] text-[#211B2C] dark:text-[#F5F1E9] hover:border-[#8B5CF6] transition-colors cursor-pointer"
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Generated Pipeline Deliverables */}
        {generatedPlan && (
          <div className="p-5 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-[#8B5CF6] uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                Multi-Agent Execution Pipeline Decomposed
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C7F36B] text-[#162700] font-bold">
                Auto-Deployed to Tasks
              </span>
            </div>

            {generatedPlan.summary && (
              <p className="text-xs text-[#211B2C] dark:text-[#F5F1E9] leading-relaxed italic bg-[#FFFEFC] dark:bg-[#211B2C] p-3 rounded-lg border border-[#E2DBD0] dark:border-[#382F47]">
                "{generatedPlan.summary}"
              </p>
            )}

            {generatedPlan.subtasks && generatedPlan.subtasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {generatedPlan.subtasks.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#211B2C] dark:text-[#F5F1E9]">
                        {st.title}
                      </span>
                      {st.requiresApproval ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF806E]/20 text-[#FF806E] flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          Needs Approval
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/20 text-[#10B981]">
                          Autonomous
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                      Assigned Agent: <strong className="text-[#8B5CF6]">{st.agentName}</strong>
                    </div>

                    <p className="text-xs text-[#211B2C] dark:text-[#F5F1E9] line-clamp-2">
                      {st.prompt}
                    </p>

                    {st.consequences && (
                      <div className="text-[10px] text-[#FF806E] font-mono">
                        Consequences: {st.consequences}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs whitespace-pre-wrap font-mono p-4 rounded-lg bg-[#211B2C] text-[#F5F1E9] overflow-x-auto">
                {generatedPlan.rawText}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
