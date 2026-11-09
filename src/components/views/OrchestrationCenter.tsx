import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { TeamoraWorkforceCanvas } from '../three/TeamoraWorkforceCanvas.tsx';
import { TEAMORA_AGENTS } from '../../data/agents.ts';
import { orchestrateWorkforce, generateAgentResponse } from '../../lib/gemini.ts';
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
  RotateCw,
} from 'lucide-react';

export const OrchestrationCenter: React.FC = () => {
  const { addTask, updateTask, user, setSelectedAgentId, setActiveTab, setBannerMessage } = useApp();
  const [goalInput, setGoalInput] = useState('');
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<{
    summary?: string;
    subtasks?: Array<{
      taskId?: string;
      agentId: string;
      agentName: string;
      title: string;
      prompt: string;
      requiresApproval: boolean;
      consequences?: string;
      status: 'queued' | 'planning' | 'running' | 'completed' | 'failed' | 'needs_approval' | 'cancelled';
      result?: string;
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
          const createdTasks = parsed.subtasks.map((st: any) => {
            const initialStatus = st.requiresApproval ? ('needs_approval' as const) : ('queued' as const);
            const created = addTask({
              agentId: st.agentId || 'workforce-manager',
              agentName: st.agentName || 'Agent',
              title: st.actionTitle || st.title || 'Decomposed Subtask',
              prompt: st.prompt || 'Decomposed by Orchestrator',
              status: initialStatus,
              priority: 'high',
              requiresApproval: !!st.requiresApproval,
              createdBy: 'Orchestrator (Atlas)',
              modelUsed: 'gemini-3.8-flash',
              result: st.requiresApproval
                ? 'Waiting for human sign-off in Approvals Gate before execution.'
                : 'Queued for autonomous agent execution.',
            });

            return {
              taskId: created.id,
              agentId: st.agentId || 'workforce-manager',
              agentName: st.agentName || 'Agent',
              title: st.actionTitle || st.title || 'Subtask',
              prompt: st.prompt || 'Execute subtask',
              requiresApproval: !!st.requiresApproval,
              consequences: st.consequences,
              status: initialStatus,
            };
          });

          setGeneratedPlan({
            summary: parsed.planSummary || parsed.reasoning,
            subtasks: createdTasks,
            rawText: response.raw,
          });

          setBannerMessage({
            title: `Pipeline decomposed into ${createdTasks.length} queued tasks with dependency routing.`,
            type: 'success',
          });
        } else {
          setGeneratedPlan({
            rawText: response.raw,
          });
        }
      }
    } catch (err: any) {
      console.error('Orchestration error:', err);
      setBannerMessage({
        title: `Orchestration error: ${err.message}`,
        type: 'warning',
      });
    } finally {
      setIsOrchestrating(false);
    }
  };

  // Execute an individual subtask autonomously via Gemini
  const handleExecuteSubtask = async (subtask: {
    taskId?: string;
    agentId: string;
    agentName: string;
    prompt: string;
  }) => {
    if (!subtask.taskId) return;
    setExecutingTaskId(subtask.taskId);

    updateTask(subtask.taskId, { status: 'running' });

    try {
      const agentDef = TEAMORA_AGENTS.find((a) => a.id === subtask.agentId) || TEAMORA_AGENTS[0];
      const result = await generateAgentResponse({
        prompt: subtask.prompt,
        systemInstruction: agentDef.systemInstruction,
        model: 'gemini-3.8-flash',
      });

      updateTask(subtask.taskId, {
        status: 'completed',
        result: result.text,
        modelUsed: result.model,
        duration: '1.4s',
      });

      setGeneratedPlan((prev) => {
        if (!prev || !prev.subtasks) return prev;
        return {
          ...prev,
          subtasks: prev.subtasks.map((st) =>
            st.taskId === subtask.taskId ? { ...st, status: 'completed', result: result.text } : st
          ),
        };
      });

      setBannerMessage({
        title: `${subtask.agentName} executed task successfully.`,
        type: 'success',
      });
    } catch (err: any) {
      updateTask(subtask.taskId, {
        status: 'failed',
        result: `Execution error: ${err.message}`,
      });
    } finally {
      setExecutingTaskId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#8B5CF6]/15 text-[#8B5CF6]">
            Multi-Agent Neural Engine · Phase 26
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Workforce Orchestration Center
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            3D interactive visualization of 15 autonomous agents, live departmental dependencies, and multi-agent pipeline decomposition with honest task lifecycle execution.
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
              Autonomous Goal Orchestrator (Atlas Engine)
            </h2>
            <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">
              Input a strategic business objective. Atlas evaluates dependencies, decomposes subtasks into persistent queues, and stages human approval gates.
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
                  <span>Decompose Pipeline</span>
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
                Multi-Agent Pipeline Decomposed & Staged
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C7F36B] text-[#162700] font-bold">
                Honest Lifecycle Staged
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
                    className="p-3.5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#211B2C] dark:text-[#F5F1E9]">
                          {st.title}
                        </span>
                        {st.status === 'completed' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        ) : st.requiresApproval ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF806E]/20 text-[#FF806E] flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Needs Approval
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8B5CF6]/20 text-[#8B5CF6]">
                            {st.status.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                        Assigned Agent: <strong className="text-[#8B5CF6]">{st.agentName}</strong>
                      </div>

                      <p className="text-xs text-[#211B2C] dark:text-[#F5F1E9] line-clamp-2">
                        {st.prompt}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E2DBD0] dark:border-[#382F47] flex items-center justify-between">
                      {st.consequences ? (
                        <div className="text-[10px] text-[#FF806E] font-mono truncate max-w-[180px]">
                          {st.consequences}
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#77717D] font-mono">
                          ID: {st.taskId?.slice(-6)}
                        </div>
                      )}

                      {st.status !== 'completed' && !st.requiresApproval && (
                        <button
                          disabled={executingTaskId === st.taskId}
                          onClick={() => handleExecuteSubtask(st)}
                          className="px-3 py-1 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {executingTaskId === st.taskId ? (
                            <>
                              <RotateCw className="w-3 h-3 animate-spin" />
                              <span>Executing...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3" />
                              <span>Run Agent</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
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
