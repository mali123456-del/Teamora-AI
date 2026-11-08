import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  ChartNoAxesCombined,
  TrendingUp,
  Activity,
  Zap,
  UsersRound,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { formatCurrency, tasks, invoices, customers } = useApp();

  const totalInvoiced = invoices.reduce((acc, i) => acc + i.amount, 0);

  const agentThroughput = [
    { name: 'Echo (Support)', tasks: 184, rate: '99.2%', dept: 'Customer' },
    { name: 'Vanguard (Sales)', tasks: 92, rate: '94.8%', dept: 'Revenue' },
    { name: 'Atlas (Orchestrator)', tasks: 64, rate: '98.5%', dept: 'Leadership' },
    { name: 'Ledger (Finance)', tasks: 78, rate: '100%', dept: 'Finance' },
    { name: 'Scout (Research)', tasks: 56, rate: '99.1%', dept: 'Intelligence' },
    { name: 'Quill (Content)', tasks: 110, rate: '97.4%', dept: 'Productivity' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#6366F1]/15 text-[#6366F1]">
            Business Intelligence & Metrics
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Analytics & Autonomous Insights
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Curated by Prism (Business Intelligence Agent). Real-time telemetry, agent task velocity, and conversion attribution.
          </p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm">
          <span className="text-xs font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
            Monthly Task Velocity
          </span>
          <div className="font-heading font-extrabold text-3xl text-[#211B2C] dark:text-[#F5F1E9] mt-1">
            {tasks.length * 140}
          </div>
          <div className="text-[11px] text-[#10B981] font-mono mt-1">+28.4% vs last cycle</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm">
          <span className="text-xs font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
            Autonomous Resolution
          </span>
          <div className="font-heading font-extrabold text-3xl text-[#8B5CF6] mt-1">
            91.4%
          </div>
          <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] font-mono mt-1">Without human edit</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm">
          <span className="text-xs font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
            Pipeline Velocity
          </span>
          <div className="font-heading font-extrabold text-3xl text-[#10B981] mt-1">
            {formatCurrency(totalInvoiced)}
          </div>
          <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] font-mono mt-1">
            {customers.length} Qualified Clients
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm">
          <span className="text-xs font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
            Safety Compliance
          </span>
          <div className="font-heading font-extrabold text-3xl text-[#C7F36B] dark:text-[#C7F36B] text-[#162700]">
            100%
          </div>
          <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] font-mono mt-1">Zero bypass events</div>
        </div>
      </div>

      {/* Agent Throughput Table */}
      <div className="p-6 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm space-y-4">
        <h2 className="font-heading font-extrabold text-base text-[#211B2C] dark:text-[#F5F1E9]">
          Agent Productivity & Accuracy Scorecard
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F1E9] dark:bg-[#2C2438] border-b border-[#E2DBD0] dark:border-[#382F47] text-[#77717D] dark:text-[#AFA8B8] font-mono uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3">Agent</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Tasks Completed (30D)</th>
                <th className="px-5 py-3">Quality Score</th>
                <th className="px-5 py-3 text-right">Throughput Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DBD0] dark:divide-[#382F47]">
              {agentThroughput.map((ag, idx) => (
                <tr key={idx} className="hover:bg-[#F5F1E9]/50 dark:hover:bg-[#2C2438]/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-[#211B2C] dark:text-[#F5F1E9]">{ag.name}</td>
                  <td className="px-5 py-4 font-mono text-[11px] text-[#77717D] dark:text-[#AFA8B8]">{ag.dept}</td>
                  <td className="px-5 py-4 font-mono text-xs">{ag.tasks} tasks</td>
                  <td className="px-5 py-4 font-mono font-bold text-xs text-[#10B981]">{ag.rate}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="w-32 h-2 rounded-full bg-[#EBE5DB] dark:bg-[#382F47] ml-auto overflow-hidden">
                      <div
                        className="h-full bg-[#8B5CF6] rounded-full"
                        style={{ width: `${Math.min(100, (ag.tasks / 200) * 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
