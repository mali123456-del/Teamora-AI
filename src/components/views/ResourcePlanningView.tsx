import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { TEAMORA_AGENTS } from '../../data/agents.ts';
import {
  Activity,
  Bot,
  UsersRound,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Sliders,
} from 'lucide-react';

export const ResourcePlanningView: React.FC = () => {
  const { tasks, currentOrg, setSelectedAgentId, setActiveTab, setBannerMessage } = useApp();
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [rebalancedNotice, setRebalancedNotice] = useState(false);

  const departments = Array.from(new Set(TEAMORA_AGENTS.map((a) => a.department)));

  // Calculate actual workload for each of the 15 canonical agents
  const agentWorkloadStats = TEAMORA_AGENTS.map((agent) => {
    const activeTasks = tasks.filter(
      (t) => (t.agentId === agent.id || t.agentName.includes(agent.name)) &&
             t.status !== 'completed' &&
             t.status !== 'cancelled'
    );
    const completedTasks = tasks.filter(
      (t) => (t.agentId === agent.id || t.agentName.includes(agent.name)) &&
             t.status === 'completed'
    );

    // Each agent has a maximum optimal concurrency limit of 5 tasks
    const maxCapacity = 5;
    const loadPercentage = Math.min(100, Math.round((activeTasks.length / maxCapacity) * 100));

    let status: 'optimal' | 'busy' | 'overloaded' = 'optimal';
    if (loadPercentage > 80) status = 'overloaded';
    else if (loadPercentage > 50) status = 'busy';

    return {
      agent,
      activeTasksCount: activeTasks.length,
      completedTasksCount: completedTasks.length,
      loadPercentage,
      status,
    };
  });

  const filteredStats = agentWorkloadStats.filter((item) => {
    if (departmentFilter === 'all') return true;
    return item.agent.department === departmentFilter;
  });

  const totalActiveTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length;
  const overloadedAgents = agentWorkloadStats.filter((a) => a.status === 'overloaded').length;
  const busyAgents = agentWorkloadStats.filter((a) => a.status === 'busy').length;
  const optimalAgents = agentWorkloadStats.filter((a) => a.status === 'optimal').length;

  const handleRebalance = () => {
    setRebalancedNotice(true);
    setBannerMessage({
      title: 'Workforce capacity rebalanced across 15 AI agents',
      type: 'success',
    });
  };

  const handleInspectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setActiveTab('agent-workspace');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Organization Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2DBD0] dark:border-[#382F47]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#211B2C] dark:text-[#F5F1E9]">
              Resource Planning & Workload Capacity
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#8B5CF6]/15 text-[#8B5CF6]">
              Phase 239
            </span>
          </div>
          <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] mt-1">
            Dynamic load distribution, capacity telemetry, and agent concurrency balancing for {currentOrg.name}.
          </p>
        </div>

        {/* Rebalance Trigger */}
        <button
          onClick={handleRebalance}
          className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Auto-Rebalance Fleet</span>
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
            Active Tasks
          </span>
          <div className="font-heading font-extrabold text-2xl text-[#211B2C] dark:text-[#F5F1E9] tabular-nums">
            {totalActiveTasks}
          </div>
          <p className="text-[11px] text-[#77717D]">Distributed across workforce</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
            Optimal Capacity
          </span>
          <div className="font-heading font-extrabold text-2xl text-[#10B981] tabular-nums">
            {optimalAgents}
          </div>
          <p className="text-[11px] text-[#77717D]">Agents &lt; 50% load</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
            Busy Fleet
          </span>
          <div className="font-heading font-extrabold text-2xl text-[#8B5CF6] tabular-nums">
            {busyAgents}
          </div>
          <p className="text-[11px] text-[#77717D]">50% - 80% concurrency</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
            Overloaded Gates
          </span>
          <div className="font-heading font-extrabold text-2xl text-[#FF806E] tabular-nums">
            {overloadedAgents}
          </div>
          <p className="text-[11px] text-[#77717D]">Agents &gt; 80% capacity</p>
        </div>
      </div>

      {/* Filter and Matrix Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#8B5CF6]" />
            <h2 className="font-heading font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">
              15 Canonical Employees Capacity Matrix
            </h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setDepartmentFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                departmentFilter === 'all'
                  ? 'bg-[#8B5CF6] text-white font-bold'
                  : 'bg-[#FFFEFC] dark:bg-[#2C2438] text-[#77717D]'
              }`}
            >
              All Departments
            </button>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setDepartmentFilter(dept)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                  departmentFilter === dept
                    ? 'bg-[#8B5CF6] text-white font-bold'
                    : 'bg-[#FFFEFC] dark:bg-[#2C2438] text-[#77717D]'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Agents Capacity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStats.map(({ agent, activeTasksCount, completedTasksCount, loadPercentage, status }) => (
            <div
              key={agent.id}
              onClick={() => handleInspectAgent(agent.id)}
              className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs space-y-3 cursor-pointer hover:border-[#8B5CF6] transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">
                    {agent.name}
                  </h3>
                  <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">{agent.role}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    status === 'overloaded'
                      ? 'bg-[#FF806E]/15 text-[#FF806E]'
                      : status === 'busy'
                      ? 'bg-[#8B5CF6]/15 text-[#8B5CF6]'
                      : 'bg-[#10B981]/15 text-[#10B981]'
                  }`}
                >
                  {status}
                </span>
              </div>

              {/* Progress and load % */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#77717D]">Capacity Utilized</span>
                  <span className="font-bold text-[#211B2C] dark:text-[#F5F1E9]">{loadPercentage}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#EBE5DB] dark:bg-[#382F47] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      status === 'overloaded'
                        ? 'bg-[#FF806E]'
                        : status === 'busy'
                        ? 'bg-[#8B5CF6]'
                        : 'bg-[#10B981]'
                    }`}
                    style={{ width: `${Math.max(8, loadPercentage)}%` }}
                  />
                </div>
              </div>

              {/* Real Metrics Metadata */}
              <div className="flex items-center justify-between text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8] pt-1 border-t border-[#E2DBD0]/60 dark:border-[#382F47]/60">
                <span>{activeTasksCount} Active</span>
                <span aria-hidden="true">·</span>
                <span>{completedTasksCount} Done</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#8B5CF6] flex items-center gap-1 font-semibold">
                  <span>Workspace</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
