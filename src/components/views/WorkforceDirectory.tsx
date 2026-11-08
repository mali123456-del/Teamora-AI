import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { TEAMORA_AGENTS, AgentDefinition } from '../../data/agents.ts';
import {
  UsersRound,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Bot,
  Activity,
} from 'lucide-react';

export const WorkforceDirectory: React.FC = () => {
  const { setSelectedAgentId, setActiveTab } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');

  const departments = ['All', 'Leadership', 'Customer', 'Revenue', 'Operations', 'Finance', 'Intelligence', 'People', 'Productivity'];

  const filteredAgents = TEAMORA_AGENTS.filter((a) => {
    const matchDept = selectedDept === 'All' || a.department === selectedDept;
    const matchSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDept && matchSearch;
  });

  const handleLaunchAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setActiveTab('agent-workspace');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#8B5CF6]/15 text-[#8B5CF6]">
            Autonomous Workforce Roster
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            The 15 AI Employees
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Each agent possesses specialized departmental domain models, distinct permissions, and strict human safety boundaries.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('orchestrator')}
          className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all self-start sm:self-auto"
        >
          <Bot className="w-4 h-4" />
          <span>Launch 3D Orchestrator</span>
        </button>
      </div>

      {/* Search and Department Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#77717D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search agents by role, name or skill..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        {/* Department Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                selectedDept === dept
                  ? 'bg-[#8B5CF6] text-white font-semibold'
                  : 'bg-[#F5F1E9] dark:bg-[#2C2438] text-[#77717D] dark:text-[#AFA8B8] hover:text-[#211B2C] dark:hover:text-[#F5F1E9]'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Agents 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAgents.map((agent) => (
          <div
            key={agent.id}
            className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] hover:border-[#8B5CF6] transition-all shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Agent Badge & Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.avatarColor} text-white flex items-center justify-center font-bold text-base shadow-sm`}
                  >
                    {agent.name.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">{agent.name}</h3>
                    <div className="text-xs text-[#77717D] dark:text-[#AFA8B8]">{agent.role}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C7F36B]/20 text-[#162700] dark:text-[#C7F36B] font-bold">
                  {agent.department}
                </span>
              </div>

              <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] leading-relaxed line-clamp-3">
                {agent.description}
              </p>

              {/* Tools & Safety Gate */}
              <div className="space-y-2 pt-2 border-t border-[#E2DBD0] dark:border-[#382F47] text-xs">
                <div className="text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
                  <span>Preferred Model: </span>
                  <strong className="text-[#8B5CF6]">{agent.preferredModel}</strong>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-[#FF806E]">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Approval: {agent.requiresApprovalFor[0]}</span>
                </div>
              </div>
            </div>

            {/* Metrics & Launch Button */}
            <div className="pt-4 mt-4 border-t border-[#E2DBD0] dark:border-[#382F47] flex items-center justify-between gap-2">
              <div className="text-[11px] font-mono">
                <span className="text-[#10B981] font-bold">{agent.metrics[0].value}</span>
                <span className="text-[#77717D] dark:text-[#AFA8B8] ml-1">({agent.metrics[0].label})</span>
              </div>

              <button
                onClick={() => handleLaunchAgent(agent.id)}
                className="px-3.5 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <span>Launch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
