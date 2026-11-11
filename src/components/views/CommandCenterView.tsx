import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { TEAMORA_AGENTS } from '../../data/agents.ts';
import {
  ShieldAlert,
  ArrowRight,
  Send,
  Sparkles,
  Bot,
  Activity,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const CommandCenterView: React.FC = () => {
  const {
    tasks,
    approvals,
    projects,
    currentOrg,
    executeApproval,
    addTask,
    setActiveTab,
    setSelectedAgentId,
    setBannerMessage,
  } = useApp();

  const [quickPrompt, setQuickPrompt] = useState('');
  const [selectedAgentIdLocal, setSelectedAgentIdLocal] = useState('workforce-manager');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive real statistics
  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const activeTasks = tasks.filter((t) => t.status === 'running' || t.status === 'planning');
  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' || t.priority === 'high');
  const completedToday = tasks.filter((t) => t.status === 'completed').length;

  const handleQuickDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const agent = TEAMORA_AGENTS.find((a) => a.id === selectedAgentIdLocal) || TEAMORA_AGENTS[0];

    try {
      addTask({
        agentId: agent.id,
        agentName: agent.name,
        title: quickPrompt.trim(),
        prompt: quickPrompt.trim(),
        status: 'queued',
        priority: 'medium',
        createdBy: 'Command Center',
      });
      setQuickPrompt('');
      setBannerMessage({
        title: `Mission objective dispatched to ${agent.name}`,
        type: 'success',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteApproval = async (id: string) => {
    const res = await executeApproval(id);
    if (res.success) {
      setBannerMessage({
        title: 'Action successfully verified & executed',
        type: 'success',
      });
    }
  };

  const navigateToAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setActiveTab('agent-workspace');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Context Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2DBD0] dark:border-[#382F47]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#211B2C] dark:text-[#F5F1E9]">
              Executive Command Center
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#8B5CF6]/15 text-[#8B5CF6]">
              {currentOrg.name}
            </span>
          </div>
          <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] mt-1">
            Real-time workforce mission control, approval gates, and priority orchestration.
          </p>
        </div>

        {/* Live Operational Health Bar */}
        <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-[#77717D]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="font-semibold text-[#211B2C] dark:text-[#F5F1E9]">{completedToday}</span> Done Today
          </div>
          <span aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            <span className="font-semibold text-[#211B2C] dark:text-[#F5F1E9]">{activeTasks.length}</span> Active Runs
          </div>
          <span aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF806E]" />
            <span className="font-semibold text-[#FF806E]">{pendingApprovals.length}</span> Gates Open
          </div>
        </div>
      </div>

      {/* Quick Dispatch Omnibar */}
      <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs">
        <form onSubmit={handleQuickDispatch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-xs font-bold text-[#211B2C] dark:text-[#F5F1E9]">Dispatch To:</span>
            <select
              value={selectedAgentIdLocal}
              onChange={(e) => setSelectedAgentIdLocal(e.target.value)}
              className="p-1.5 rounded-lg bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs font-medium text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
            >
              {TEAMORA_AGENTS.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} — {agent.department}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 w-full">
            <input
              type="text"
              required
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              placeholder="Enter immediate mission objective or cross-agent directive..."
              className="w-full px-3 py-2 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !quickPrompt.trim()}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Launch Task</span>
          </button>
        </form>
      </div>

      {/* Main Grid: Priority Deck (60%) vs Fleet Health (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Urgent Approvals & Active Tasks (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Urgent Approvals Gate */}
          <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#FF806E]" />
                <h2 className="font-heading font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">
                  Urgent Human Approvals Deck
                </h2>
                {pendingApprovals.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold bg-[#FF806E]/15 text-[#FF806E]">
                    {pendingApprovals.length} Pending
                  </span>
                )}
              </div>
              <button
                onClick={() => setActiveTab('approvals')}
                className="text-xs text-[#8B5CF6] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-[#F5F1E9]/40 dark:bg-[#211B2C]/40 text-xs text-[#77717D]">
                All approval gates clear. No pending human sign-offs.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.slice(0, 3).map((appr) => (
                  <div
                    key={appr.id}
                    className="p-3.5 rounded-xl border border-[#FF806E]/30 bg-[#FF806E]/5 dark:bg-[#FF806E]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="text-xs font-semibold text-[#211B2C] dark:text-[#F5F1E9] truncate">
                        {appr.title}
                      </div>
                      <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] line-clamp-1">
                        {appr.consequences}
                      </div>
                      {/* Zero-Pill Unboxed Metadata */}
                      <div className="text-[10px] text-[#77717D] flex items-center gap-1.5 font-mono">
                        <span>Agent: {appr.agentName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{appr.actionType.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleExecuteApproval(appr.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#FF806E] hover:bg-[#E06755] text-white text-xs font-bold shrink-0 cursor-pointer shadow-xs transition-colors"
                    >
                      Authorize Action
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* High-Priority Tasks Pipeline */}
          <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#8B5CF6]" />
                <h2 className="font-heading font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">
                  High-Priority Task Pipeline
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('tasks')}
                className="text-xs text-[#8B5CF6] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Task Center</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {urgentTasks.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-[#F5F1E9]/40 dark:bg-[#211B2C]/40 text-xs text-[#77717D]">
                No urgent tasks in queue. Operations running normally.
              </div>
            ) : (
              <div className="divide-y divide-[#E2DBD0]/60 dark:divide-[#382F47]/60">
                {urgentTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setActiveTab('tasks')}
                    className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs font-semibold text-[#211B2C] dark:text-[#F5F1E9] truncate">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] flex items-center gap-1.5 font-mono">
                        <span>{task.agentName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{task.status}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#FF806E] font-semibold uppercase">{task.priority}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#77717D] shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 15-Agent Fleet Matrix & Project Health (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 15 Canonical AI Agents Fleet Matrix */}
          <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#8B5CF6]" />
                <h2 className="font-heading font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">
                  15 AI Employees Fleet
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('workforce')}
                className="text-xs text-[#8B5CF6] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Directory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {TEAMORA_AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => navigateToAgent(agent.id)}
                  className="p-2.5 rounded-xl border border-[#E2DBD0] dark:border-[#382F47] bg-[#F5F1E9]/40 dark:bg-[#211B2C]/40 hover:border-[#8B5CF6] text-left transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#211B2C] dark:text-[#F5F1E9] truncate">
                      {agent.name}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  </div>
                  <p className="text-[10px] text-[#77717D] dark:text-[#AFA8B8] truncate">
                    {agent.department}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Project Portfolio Trajectory */}
          <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
                <h2 className="font-heading font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">
                  Project Trajectory
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('projects')}
                className="text-xs text-[#8B5CF6] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Projects</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#211B2C] dark:text-[#F5F1E9] truncate">
                      {proj.title}
                    </span>
                    <span className="font-mono tabular-nums text-[#77717D]">
                      {proj.progress}%
                    </span>
                  </div>
                  {/* Clean hairline progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-[#EBE5DB] dark:bg-[#382F47] overflow-hidden">
                    <div
                      className="h-full bg-[#8B5CF6] rounded-full transition-all duration-300"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
