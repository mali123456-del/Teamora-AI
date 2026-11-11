import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Header } from './components/layout/Header.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { PublicLandingPage } from './components/views/PublicLandingPage.tsx';
import { MainDashboard } from './components/views/MainDashboard.tsx';
import { CommandCenterView } from './components/views/CommandCenterView.tsx';
import { PersonalInboxView } from './components/views/PersonalInboxView.tsx';
import { WorkforceDirectory } from './components/views/WorkforceDirectory.tsx';
import { AgentWorkspace } from './components/views/AgentWorkspace.tsx';
import { OrchestrationCenter } from './components/views/OrchestrationCenter.tsx';
import { TaskCenter } from './components/views/TaskCenter.tsx';
import { ApprovalsCenter } from './components/views/ApprovalsCenter.tsx';
import { CrmView } from './components/views/CrmView.tsx';
import { InventoryView } from './components/views/InventoryView.tsx';
import { FinanceView } from './components/views/FinanceView.tsx';
import { ProjectsView } from './components/views/ProjectsView.tsx';
import { TeamCalendarView } from './components/views/TeamCalendarView.tsx';
import { ResourcePlanningView } from './components/views/ResourcePlanningView.tsx';
import { KnowledgeHubView } from './components/views/KnowledgeHubView.tsx';
import { AutomationStudioView } from './components/views/AutomationStudioView.tsx';
import { AnalyticsView } from './components/views/AnalyticsView.tsx';
import { BenchmarkingLabView } from './components/views/BenchmarkingLabView.tsx';
import { TeamSettingsView } from './components/views/TeamSettingsView.tsx';
import { IntegrationsView } from './components/views/IntegrationsView.tsx';
import { SubscriptionView } from './components/views/SubscriptionView.tsx';
import { SecurityLogsView } from './components/views/SecurityLogsView.tsx';
import { RagStudioView } from './components/views/RagStudioView.tsx';
import { SystemHealthView } from './components/views/SystemHealthView.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, bannerMessage, setBannerMessage } = useApp();

  const isPublicLanding = activeTab === 'landing';

  const renderActiveView = () => {
    switch (activeTab) {
      case 'landing':
        return <PublicLandingPage />;
      case 'dashboard':
        return <MainDashboard />;
      case 'command-center':
        return <CommandCenterView />;
      case 'inbox':
        return <PersonalInboxView />;
      case 'workforce':
        return <WorkforceDirectory />;
      case 'agent-workspace':
        return <AgentWorkspace />;
      case 'orchestrator':
        return <OrchestrationCenter />;
      case 'tasks':
        return <TaskCenter />;
      case 'approvals':
        return <ApprovalsCenter />;
      case 'crm':
        return <CrmView />;
      case 'inventory':
        return <InventoryView />;
      case 'finance':
        return <FinanceView />;
      case 'projects':
        return <ProjectsView />;
      case 'calendar':
        return <TeamCalendarView />;
      case 'resources':
        return <ResourcePlanningView />;
      case 'knowledge':
        return <KnowledgeHubView />;
      case 'rag-studio':
        return <RagStudioView />;
      case 'health':
        return <SystemHealthView />;
      case 'automation':
        return <AutomationStudioView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'benchmarks':
        return <BenchmarkingLabView />;
      case 'team':
        return <TeamSettingsView />;
      case 'integrations':
        return <IntegrationsView />;
      case 'subscriptions':
        return <SubscriptionView />;
      case 'security':
        return <SecurityLogsView />;
      default:
        return <MainDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Global Notification Banner */}
      {bannerMessage && (
        <div
          className={`py-2 px-4 text-xs font-semibold flex items-center justify-between transition-all ${
            bannerMessage.type === 'success'
              ? 'bg-[#10B981] text-white'
              : bannerMessage.type === 'warning'
              ? 'bg-[#FF806E] text-white'
              : 'bg-[#8B5CF6] text-white'
          }`}
        >
          <div className="flex items-center gap-2 max-w-5xl mx-auto flex-1">
            {bannerMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{bannerMessage.title}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="p-1 hover:opacity-75 cursor-pointer ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <Header isPublicView={isPublicLanding} />

      {/* Main Body */}
      {isPublicLanding ? (
        <main className="flex-1 overflow-x-hidden">
          <ErrorBoundary key={activeTab}>
            {renderActiveView()}
          </ErrorBoundary>
        </main>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <ErrorBoundary key={activeTab}>
              {renderActiveView()}
            </ErrorBoundary>
          </main>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
