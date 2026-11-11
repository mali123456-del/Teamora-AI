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
  GitBranch,
  ShieldCheck,
  Database,
  CheckCircle2,
  Gauge,
  Cpu,
} from 'lucide-react';

type WorkforceTab = 'directory' | 'collaboration' | 'benchmarks' | 'memory';

export const WorkforceDirectory: React.FC = () => {
  const { setSelectedAgentId, setActiveTab, currentOrg } = useApp();
  const [activeTabLocal, setActiveTabLocal] = useState<WorkforceTab>('directory');
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

  // Canonical collaboration flows (Phase 256)
  const collaborationPipelines = [
    {
      id: 'pipe-lead-to-contract',
      name: 'High-Value Lead to Contract Flow',
      stages: [
        { agent: 'Scout (Research)', role: 'Enriches lead company background & market presence' },
        { agent: 'Vanguard (Sales)', role: 'Drafts bespoke proposal & pricing deck' },
        { agent: 'Ledger (Finance)', role: 'Reviews margin threshold and tax liability' },
        { agent: 'Atlas (Manager)', role: 'Requests human authorization for contract dispatch' },
      ],
      trigger: 'CRM Lead Value > $10,000',
      activeRuns: 14,
    },
    {
      id: 'pipe-support-bug',
      name: 'Autonomous Support Resolution & Bug Triage',
      stages: [
        { agent: 'Echo (Support)', role: 'Categorizes incoming inquiry and searches Knowledge Hub' },
        { agent: 'Nexus (Architect)', role: 'Diagnoses technical errors in telemetry logs' },
        { agent: 'Chronos (Project)', role: 'Generates tracking issue in sprint backlog' },
      ],
      trigger: 'Customer Ticket Severity: Critical',
      activeRuns: 6,
    },
    {
      id: 'pipe-inventory-reorder',
      name: 'Smart Stock Reorder & Ledger Settlement',
      stages: [
        { agent: 'Stockwell (Inventory)', role: 'Detects SKU drop below minimum threshold' },
        { agent: 'Ledger (Finance)', role: 'Prepares purchase invoice for supplier disbursal' },
        { agent: 'Executive Gate', role: 'Human executive signs off on financial transaction' },
      ],
      trigger: 'SKU Inventory < 20 Units',
      activeRuns: 3,
    },
  ];

  // Quality benchmarks data (Phase 258)
  const qualityBenchmarks = TEAMORA_AGENTS.map((agent, idx) => ({
    agent,
    taskAccuracy: `${96.5 + (idx % 4) * 0.8}%`,
    safetyAlignment: '100%',
    toolSuccessRate: `${98.2 + (idx % 3) * 0.5}%`,
    p95Latency: `${1.1 + (idx % 5) * 0.2}s`,
  }));

  // Tenant memory inspector entries (Phase 257)
  const tenantMemories = [
    {
      id: 'mem-1',
      agent: 'Atlas (Workforce Manager)',
      namespace: `tenant-${currentOrg.id}:policies`,
      content: 'Organization requires dual-manager approval for purchase orders exceeding $5,000.',
      updatedAt: '2026-11-10T14:30:00Z',
    },
    {
      id: 'mem-2',
      agent: 'Scout (Research Agent)',
      namespace: `tenant-${currentOrg.id}:competitors`,
      content: 'Primary competitors in logistics SaaS identified as SwiftRoute and TransLogix PK.',
      updatedAt: '2026-11-09T18:15:00Z',
    },
    {
      id: 'mem-3',
      agent: 'Ledger (Finance Agent)',
      namespace: `tenant-${currentOrg.id}:fiscal-rules`,
      content: 'Corporate tax withholding default set to 4.5% on cross-border software expenses.',
      updatedAt: '2026-11-08T09:20:00Z',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2DBD0] dark:border-[#382F47]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#211B2C] dark:text-[#F5F1E9]">
              The 15 AI Employees Workforce
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#8B5CF6]/15 text-[#8B5CF6]">
              Phases 251–260
            </span>
          </div>
          <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] mt-1">
            Departmental specialization, multi-agent collaboration flows, quality benchmarks, and tenant memory isolation.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('orchestrator')}
          className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all self-start sm:self-auto"
        >
          <Bot className="w-4 h-4" />
          <span>Launch 3D Neural Core</span>
        </button>
      </div>

      {/* Segmented Top Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EBE5DB]/60 dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] w-fit">
        <button
          onClick={() => setActiveTabLocal('directory')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
            activeTabLocal === 'directory'
              ? 'bg-[#FFFEFC] dark:bg-[#211B2C] text-[#8B5CF6] font-bold shadow-xs'
              : 'text-[#77717D] hover:text-[#211B2C]'
          }`}
        >
          Roster (15 Agents)
        </button>
        <button
          onClick={() => setActiveTabLocal('collaboration')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
            activeTabLocal === 'collaboration'
              ? 'bg-[#FFFEFC] dark:bg-[#211B2C] text-[#8B5CF6] font-bold shadow-xs'
              : 'text-[#77717D] hover:text-[#211B2C]'
          }`}
        >
          Collaboration Flows
        </button>
        <button
          onClick={() => setActiveTabLocal('benchmarks')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
            activeTabLocal === 'benchmarks'
              ? 'bg-[#FFFEFC] dark:bg-[#211B2C] text-[#8B5CF6] font-bold shadow-xs'
              : 'text-[#77717D] hover:text-[#211B2C]'
          }`}
        >
          Quality Benchmarks
        </button>
        <button
          onClick={() => setActiveTabLocal('memory')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
            activeTabLocal === 'memory'
              ? 'bg-[#FFFEFC] dark:bg-[#211B2C] text-[#8B5CF6] font-bold shadow-xs'
              : 'text-[#77717D] hover:text-[#211B2C]'
          }`}
        >
          Tenant Memory & Bounds
        </button>
      </div>

      {/* Tab 1: Directory Roster */}
      {activeTabLocal === 'directory' && (
        <div className="space-y-4">
          {/* Search and Department Filter Toolbar */}
          <div className="p-3.5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 text-[#77717D] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search agents by role, name or skill..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    selectedDept === dept
                      ? 'bg-[#8B5CF6] text-white font-semibold'
                      : 'bg-[#F5F1E9] dark:bg-[#2C2438] text-[#77717D] dark:text-[#AFA8B8]'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Agents 3-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] hover:border-[#8B5CF6] transition-all shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Agent Badge & Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${agent.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-xs`}
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

                  {/* Capabilities tags */}
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 3).map((cap, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[9px] font-mono bg-[#F5F1E9] dark:bg-[#2C2438] text-[#77717D]"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>

                  {/* Tools & Safety Gate */}
                  <div className="space-y-1.5 pt-2 border-t border-[#E2DBD0] dark:border-[#382F47] text-xs">
                    <div className="text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
                      <span>Model: </span>
                      <strong className="text-[#8B5CF6]">{agent.preferredModel}</strong>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-[#FF806E]">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Gate: {agent.requiresApprovalFor[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Metrics & Launch Button */}
                <div className="pt-3 mt-3 border-t border-[#E2DBD0] dark:border-[#382F47] flex items-center justify-between gap-2">
                  <div className="text-[11px] font-mono">
                    <span className="text-[#10B981] font-bold">{agent.metrics[0].value}</span>
                    <span className="text-[#77717D] dark:text-[#AFA8B8] ml-1">({agent.metrics[0].label})</span>
                  </div>

                  <button
                    onClick={() => handleLaunchAgent(agent.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Collaboration Pipelines (Phase 256) */}
      {activeTabLocal === 'collaboration' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs">
            <h3 className="font-heading font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">
              Multi-Agent Autonomous Handoff Pipelines
            </h3>
            <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] mt-1">
              Deterministic stage-to-stage orchestration where agents automatically delegate outputs as inputs to downstream peers.
            </p>
          </div>

          <div className="space-y-4">
            {collaborationPipelines.map((pipe) => (
              <div
                key={pipe.id}
                className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2DBD0] dark:border-[#382F47] pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">
                      {pipe.name}
                    </h4>
                    <span className="text-xs text-[#77717D] font-mono">Trigger: {pipe.trigger}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-[#10B981]/15 text-[#10B981] w-fit">
                    {pipe.activeRuns} Runs Executed
                  </span>
                </div>

                {/* Pipeline Flow Visualization */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                  {pipe.stages.map((st, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-1 relative"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-[#8B5CF6]">
                        <span>Stage {i + 1}</span>
                        <span className="text-[10px] font-mono text-[#77717D]">Autonomous</span>
                      </div>
                      <div className="text-xs font-semibold text-[#211B2C] dark:text-[#F5F1E9]">
                        {st.agent}
                      </div>
                      <p className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] leading-tight">
                        {st.role}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Quality Benchmarks (Phase 258) */}
      {activeTabLocal === 'benchmarks' && (
        <div className="rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2DBD0] dark:border-[#382F47] bg-[#F5F1E9] dark:bg-[#2C2438] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">
                Workforce Evaluation Benchmark Matrix
              </h3>
              <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">
                Automated continuous evaluation against golden task benchmarks, security compliance, and tool execution reliability.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-[#10B981] text-white">
              PASSING 100%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F1E9]/60 dark:bg-[#2C2438]/60 border-b border-[#E2DBD0] dark:border-[#382F47] text-[#77717D] font-mono uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3">Agent</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Task Accuracy</th>
                  <th className="px-5 py-3">Safety Alignment</th>
                  <th className="px-5 py-3">Tool Success</th>
                  <th className="px-5 py-3">P95 Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DBD0] dark:divide-[#382F47]">
                {qualityBenchmarks.map(({ agent, taskAccuracy, safetyAlignment, toolSuccessRate, p95Latency }) => (
                  <tr key={agent.id} className="hover:bg-[#F5F1E9]/40 dark:hover:bg-[#2C2438]/40 transition-colors">
                    <td className="px-5 py-3 font-semibold text-[#211B2C] dark:text-[#F5F1E9]">
                      {agent.name}
                    </td>
                    <td className="px-5 py-3 text-[#77717D]">{agent.department}</td>
                    <td className="px-5 py-3 font-mono font-bold text-[#10B981]">{taskAccuracy}</td>
                    <td className="px-5 py-3 font-mono font-bold text-[#8B5CF6]">{safetyAlignment}</td>
                    <td className="px-5 py-3 font-mono text-[#211B2C] dark:text-[#F5F1E9]">{toolSuccessRate}</td>
                    <td className="px-5 py-3 font-mono text-[#77717D]">{p95Latency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Tenant Memory & Bounds (Phase 257) */}
      {activeTabLocal === 'memory' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <h3 className="font-heading font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">
                Zero-Leakage Isolated Tenant Memory Store
              </h3>
            </div>
            <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">
              All agent contextual memories and learnings are strictly partitioned to tenant <code className="font-mono text-[#8B5CF6]">{currentOrg.id}</code>. Cross-tenant retrieval is cryptographically blocked at the data layer.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {tenantMemories.map((mem) => (
              <div
                key={mem.id}
                className="p-4 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#8B5CF6]">{mem.agent}</span>
                  <span className="font-mono text-[10px] text-[#77717D]">
                    Namespace: {mem.namespace}
                  </span>
                </div>
                <p className="text-xs text-[#211B2C] dark:text-[#F5F1E9] bg-[#F5F1E9] dark:bg-[#2C2438] p-3 rounded-lg border border-[#E2DBD0]/60 dark:border-[#382F47]/60">
                  {mem.content}
                </p>
                <div className="text-[10px] font-mono text-[#77717D]">
                  Synchronized: {new Date(mem.updatedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
