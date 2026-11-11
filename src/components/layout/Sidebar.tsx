import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  LayoutDashboard,
  UsersRound,
  Workflow,
  ListTodo,
  ShieldAlert,
  UserCheck,
  Package,
  Receipt,
  FolderKanban,
  Files,
  GitBranch,
  ChartNoAxesCombined,
  ShieldCheck,
  CreditCard,
  Sliders,
  Sparkles,
  Plug,
  Database,
  Activity,
  Inbox,
  Calendar,
  Layers,
  Gauge,
  X,
} from 'lucide-react';
import { TeamoraLogo } from '../common/TeamoraLogo.tsx';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    approvals,
    setSelectedAgentId,
    isMobileNavOpen,
    setIsMobileNavOpen,
  } = useApp();
  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;

  const navSections = [
    {
      title: 'Workforce Core',
      items: [
        { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
        { id: 'command-center', label: 'Command Center', icon: Activity, badge: 'Live' },
        { id: 'inbox', label: 'Personal Inbox', icon: Inbox },
        { id: 'workforce', label: '15 AI Employees', icon: UsersRound, badge: '15 Active' },
        { id: 'orchestrator', label: 'Orchestrator (3D)', icon: Workflow, isNew: true },
        { id: 'tasks', label: 'Task Center', icon: ListTodo },
        {
          id: 'approvals',
          label: 'Approvals Gate',
          icon: ShieldAlert,
          alertCount: pendingApprovalsCount,
        },
      ],
    },
    {
      title: 'Business Operations',
      items: [
        { id: 'crm', label: 'CRM & Leads', icon: UserCheck },
        { id: 'inventory', label: 'Inventory & SKUs', icon: Package },
        { id: 'finance', label: 'Invoices & Expenses', icon: Receipt },
        { id: 'projects', label: 'Projects & Kanban', icon: FolderKanban },
        { id: 'calendar', label: 'Team Calendar', icon: Calendar },
        { id: 'resources', label: 'Resource Planning', icon: Layers },
        { id: 'knowledge', label: 'Knowledge Hub', icon: Files },
        { id: 'rag-studio', label: 'RAG Studio & Crawler', icon: Database, badge: 'RAG' },
        { id: 'automation', label: 'Automation Studio', icon: GitBranch },
      ],
    },
    {
      title: 'Governance & Growth',
      items: [
        { id: 'benchmarks', label: 'AI Model Benchmarking', icon: Gauge, badge: 'AI Lab' },
        { id: 'analytics', label: 'Analytics & Insights', icon: ChartNoAxesCombined },
        { id: 'health', label: 'System Health & Metrics', icon: Activity },
        { id: 'team', label: 'Team & Permissions', icon: UsersRound },
        { id: 'integrations', label: 'Integrations & Keep', icon: Plug },
        { id: 'subscriptions', label: 'Subscription & Plans', icon: CreditCard },
        { id: 'security', label: 'Security & Audit Logs', icon: ShieldCheck },
      ],
    },
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    if (id !== 'agent-workspace') {
      setSelectedAgentId(null);
    }
    setIsMobileNavOpen(false);
  };

  const renderNavContent = () => (
    <>
      <div className="space-y-6">
        {navSections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-[#77717D] dark:text-[#AFA8B8]">
              {sec.title}
            </div>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#8B5CF6] text-white font-semibold shadow-sm'
                        : 'text-[#211B2C] dark:text-[#F5F1E9] hover:bg-[#EBE5DB]/60 dark:hover:bg-[#2C2438]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-white' : 'text-[#8B5CF6] dark:text-[#A78BFA]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.alertCount !== undefined && item.alertCount > 0 ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-[#FF806E] rounded-full">
                        {item.alertCount}
                      </span>
                    ) : item.badge ? (
                      <span
                        className={`px-1.5 py-0.2 text-[9px] font-mono rounded font-semibold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-[#C7F36B]/25 text-[#162700] dark:bg-[#C7F36B]/20 dark:text-[#C7F36B]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : item.isNew ? (
                      <span className="px-1.5 py-0.2 text-[9px] font-mono rounded font-bold bg-[#C7F36B] text-[#162700]">
                        3D
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status Banner */}
      <div className="pt-4 border-t border-[#E2DBD0] dark:border-[#382F47] mt-4 px-2">
        <div className="p-3 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#211B2C] dark:text-[#F5F1E9] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C7F36B]" />
              Teamora Core
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#C7F36B] text-[#162700] font-bold">
              ONLINE
            </span>
          </div>
          <p className="text-[10px] text-[#77717D] dark:text-[#AFA8B8] leading-tight">
            Gemini 4 Argon & 3.8 Flash intelligence active. 15 agents ready.
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 shrink-0 border-r border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC] dark:bg-[#211B2C] hidden md:flex flex-col justify-between overflow-y-auto select-none py-4 px-3">
        {renderNavContent()}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-150"
          onClick={() => setIsMobileNavOpen(false)}
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
          <aside
            className="relative w-72 max-w-[85%] bg-[#FFFEFC] dark:bg-[#211B2C] border-r border-[#E2DBD0] dark:border-[#382F47] h-full flex flex-col justify-between overflow-y-auto select-none py-4 px-3 shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2DBD0] dark:border-[#382F47]">
              <TeamoraLogo size="sm" />
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-[#77717D] hover:text-[#211B2C] dark:hover:text-[#F5F1E9] hover:bg-[#EBE5DB] dark:hover:bg-[#2C2438] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
};
