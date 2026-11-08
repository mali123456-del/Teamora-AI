import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { TEAMORA_AGENTS } from '../../data/agents.ts';
import {
  UsersRound,
  Workflow,
  TrendingUp,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle,
  Plus,
  Receipt,
  Package,
} from 'lucide-react';

export const MainDashboard: React.FC = () => {
  const {
    tasks,
    approvals,
    customers,
    invoices,
    inventory,
    formatCurrency,
    setActiveTab,
    setSelectedAgentId,
    currentOrg,
  } = useApp();

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const totalRevenue = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const lowStockCount = inventory.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Top Welcome & Quick Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#8B5CF6]/15 text-[#8B5CF6]">
            Workspace Operations Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Welcome, Executive Manager
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Organization: <strong className="text-[#8B5CF6]">{currentOrg.name}</strong> • 15 AI
            employees active across Leadership, Customer, Revenue, and Intelligence.
          </p>
        </div>

        {/* Quick Dispatch Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('orchestrator')}
            className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105"
          >
            <Workflow className="w-4 h-4" />
            <span>Launch 3D Orchestrator</span>
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className="px-4 py-2.5 rounded-xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] hover:border-[#8B5CF6] text-[#211B2C] dark:text-[#F5F1E9] font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Add CRM Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active AI Workforce */}
        <div
          onClick={() => setActiveTab('workforce')}
          className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm hover:border-[#8B5CF6] cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[#77717D] dark:text-[#AFA8B8] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              AI Workforce
            </span>
            <UsersRound className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="font-heading font-extrabold text-3xl text-[#211B2C] dark:text-[#F5F1E9]">
            15 / 15
          </div>
          <div className="text-[11px] text-[#10B981] font-mono mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            100% Operational Uptime
          </div>
        </div>

        {/* KPI 2: Paid Revenue */}
        <div
          onClick={() => setActiveTab('finance')}
          className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm hover:border-[#8B5CF6] cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[#77717D] dark:text-[#AFA8B8] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              Reconciled Revenue
            </span>
            <TrendingUp className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="font-heading font-extrabold text-3xl text-[#211B2C] dark:text-[#F5F1E9]">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] font-mono mt-1">
            Across {invoices.length} Enterprise Invoices
          </div>
        </div>

        {/* KPI 3: Safe Approval Gate */}
        <div
          onClick={() => setActiveTab('approvals')}
          className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm hover:border-[#FF806E] cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[#77717D] dark:text-[#AFA8B8] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              Human Safety Gate
            </span>
            <ShieldAlert className="w-4 h-4 text-[#FF806E]" />
          </div>
          <div className="font-heading font-extrabold text-3xl text-[#FF806E]">
            {pendingApprovals.length} Pending
          </div>
          <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] font-mono mt-1">
            Requires Manager Sign-off
          </div>
        </div>

        {/* KPI 4: Inventory & Operations */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm hover:border-[#8B5CF6] cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[#77717D] dark:text-[#AFA8B8] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              Inventory Health
            </span>
            <Package className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="font-heading font-extrabold text-3xl text-[#211B2C] dark:text-[#F5F1E9]">
            {lowStockCount > 0 ? `${lowStockCount} Low Stock` : 'Healthy'}
          </div>
          <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] font-mono mt-1">
            {inventory.length} Product SKUs Monitored
          </div>
        </div>
      </div>

      {/* Main Grid: 15 Agent Live Roster + Real-Time Task Execution Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Cols: Quick Agent Roster */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-extrabold text-lg text-[#211B2C] dark:text-[#F5F1E9]">
              Specialized Workforce Roster
            </h2>
            <button
              onClick={() => setActiveTab('workforce')}
              className="text-xs font-semibold text-[#8B5CF6] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All 15 Agents</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEAMORA_AGENTS.slice(0, 6).map((agent) => (
              <div
                key={agent.id}
                onClick={() => {
                  setSelectedAgentId(agent.id);
                  setActiveTab('agent-workspace');
                }}
                className="p-4 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] hover:border-[#8B5CF6] cursor-pointer transition-all flex items-start gap-3 shadow-xs"
              >
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${agent.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}
                >
                  {agent.name.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#211B2C] dark:text-[#F5F1E9] truncate">
                      {agent.name}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#C7F36B]/20 text-[#162700] dark:text-[#C7F36B] font-bold">
                      Ready
                    </span>
                  </div>
                  <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] truncate">
                    {agent.role}
                  </div>
                  <div className="text-[10px] text-[#8B5CF6] mt-1 font-mono font-medium">
                    {agent.metrics[0].label}: {agent.metrics[0].value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Cols: Real-Time Task Execution Stream */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-extrabold text-lg text-[#211B2C] dark:text-[#F5F1E9]">
              Recent Agent Activity
            </h2>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-xs font-semibold text-[#8B5CF6] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Task Center</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm space-y-3">
            {tasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#211B2C] dark:text-[#F5F1E9] truncate">
                    {task.title}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      task.status === 'completed'
                        ? 'bg-[#10B981]/20 text-[#10B981]'
                        : task.status === 'needs_approval'
                        ? 'bg-[#FF806E]/20 text-[#FF806E]'
                        : 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#77717D] dark:text-[#AFA8B8] font-mono">
                  <span>Agent: <strong className="text-[#8B5CF6]">{task.agentName}</strong></span>
                  <span>{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
