import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { TeamoraLogo } from '../common/TeamoraLogo.tsx';
import {
  Sun,
  Moon,
  Globe,
  ShieldAlert,
  LogIn,
  LogOut,
  Building2,
  ChevronDown,
  Plus,
  Info,
  ShieldCheck,
  Mic,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  Menu,
} from 'lucide-react';
import { CurrencyCode } from '../../types/index.ts';
import { VoiceCommandModal } from '../common/VoiceCommandModal.tsx';
import { syncEngine, SyncEngineStatus } from '../../lib/syncEngine.ts';
import { NotificationBell } from '../common/NotificationBell.tsx';
import { GlobalSearchModal } from '../common/GlobalSearchModal.tsx';
import { QuickCreateModal } from '../common/QuickCreateModal.tsx';

interface HeaderProps {
  onOpenAuthModal?: () => void;
  isPublicView?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isPublicView = false }) => {
  const {
    isDarkMode,
    toggleTheme,
    language,
    setLanguage,
    currency,
    setCurrency,
    user,
    firebaseUser,
    isDemoMode,
    toggleDemoMode,
    loginGoogle,
    logout,
    currentOrg,
    organizations,
    setCurrentOrg,
    createOrganization,
    approvals,
    setActiveTab,
    isMobileNavOpen,
    setIsMobileNavOpen,
  } = useApp();

  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCurrency, setNewOrgCurrency] = useState<CurrencyCode>('USD');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncEngineStatus>(syncEngine.getStatus());

  // Global Cmd+K / Ctrl+K listener for instant search access
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((status) => {
      setSyncStatus(status);
    });
    return unsubscribe;
  }, [currentOrg.id]);

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    await createOrganization(newOrgName.trim(), 'pro', newOrgCurrency);
    setNewOrgName('');
    setShowCreateOrgModal(false);
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC]/95 dark:bg-[#211B2C]/95 backdrop-blur-md transition-colors">
      {/* Demo Sandbox Top Advisory Banner if in Demo Mode */}
      {isDemoMode && !firebaseUser && (
        <div className="bg-[#8B5CF6]/15 dark:bg-[#8B5CF6]/25 border-b border-[#8B5CF6]/30 px-4 py-1 text-center text-xs flex items-center justify-center gap-2 text-[#211B2C] dark:text-[#F5F1E9]">
          <Info className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>
            <strong>Demo Sandbox Mode:</strong> Changes are held in isolated memory session.
          </span>
          <button
            onClick={loginGoogle}
            className="underline font-bold text-[#8B5CF6] hover:text-[#7C3AED] cursor-pointer"
          >
            Sign in with Google
          </button>
          <span>to enable cloud persistence and real multi-tenant synchronization.</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand or Org Selector */}
        <div className="flex items-center gap-3 sm:gap-4">
          {!isPublicView && (
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="md:hidden p-1.5 rounded-lg text-[#211B2C] dark:text-[#F5F1E9] hover:bg-[#EBE5DB] dark:hover:bg-[#2C2438] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5 text-[#8B5CF6]" />
            </button>
          )}

          <button
            onClick={() => setActiveTab(isPublicView ? 'landing' : 'dashboard')}
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <TeamoraLogo size="md" />
          </button>

          {!isPublicView && (
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[#E2DBD0] dark:border-[#382F47] relative">
              <button
                onClick={() => setIsOrgDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-[#211B2C] dark:text-[#F5F1E9] bg-[#EBE5DB]/60 dark:bg-[#2C2438] hover:bg-[#EBE5DB] dark:hover:bg-[#382F47] transition-colors cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span className="font-semibold">{currentOrg.name}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono bg-[#8B5CF6]/15 text-[#8B5CF6]">
                  {currentOrg.plan}
                </span>
                <ChevronDown className="w-3 h-3 text-[#77717D]" />
              </button>

              {/* Org Switcher Dropdown */}
              {isOrgDropdownOpen && (
                <div className="absolute left-4 top-12 w-64 bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] rounded-xl shadow-xl py-2 z-50">
                  <div className="px-3 py-1 text-[11px] font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
                    Switch Workspace
                  </div>
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        setCurrentOrg(org);
                        setIsOrgDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F5F1E9] dark:hover:bg-[#382F47] cursor-pointer ${
                        org.id === currentOrg.id
                          ? 'font-bold text-[#8B5CF6]'
                          : 'text-[#211B2C] dark:text-[#F5F1E9]'
                      }`}
                    >
                      <span className="truncate">{org.name}</span>
                      <span className="text-[10px] font-mono text-[#77717D] uppercase">{org.currency}</span>
                    </button>
                  ))}
                  <div className="pt-1 mt-1 border-t border-[#E2DBD0] dark:border-[#382F47] px-2">
                    <button
                      onClick={() => {
                        setIsOrgDropdownOpen(false);
                        setShowCreateOrgModal(true);
                      }}
                      className="w-full py-1.5 px-2 rounded-lg text-xs font-semibold text-[#8B5CF6] hover:bg-[#8B5CF6]/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Organization</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Action Tools: Language, Currency, Approvals Badge, Theme, Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Offline / Online & IndexedDB Sync Status Indicator */}
          {!isPublicView && (
            <button
              onClick={() => syncEngine.triggerSync(currentOrg.id)}
              disabled={syncStatus.connectivity === 'offline' || syncStatus.isSyncing}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer ${
                syncStatus.connectivity === 'offline'
                  ? 'bg-[#FF806E]/15 border-[#FF806E]/30 text-[#FF806E]'
                  : syncStatus.pendingCount > 0
                  ? 'bg-[#FFF8E7] dark:bg-[#2A2315] border-[#F3E2B8] dark:border-[#4D3F20] text-[#8A6A1C] dark:text-[#E8C56B]'
                  : 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]'
              }`}
              title={
                syncStatus.connectivity === 'offline'
                  ? 'Offline mode: Changes will cache in IndexedDB and synchronize when online'
                  : syncStatus.pendingCount > 0
                  ? `${syncStatus.pendingCount} pending offline changes. Click to synchronize now.`
                  : 'Cloud synchronized via Firestore'
              }
            >
              {syncStatus.connectivity === 'offline' ? (
                <WifiOff className="w-3.5 h-3.5" />
              ) : syncStatus.isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wifi className="w-3.5 h-3.5" />
              )}
              <span>
                {syncStatus.connectivity === 'offline'
                  ? 'Offline'
                  : syncStatus.isSyncing
                  ? 'Syncing...'
                  : syncStatus.pendingCount > 0
                  ? `Sync (${syncStatus.pendingCount})`
                  : 'Synced'}
              </span>
            </button>
          )}

          {/* Global Omnibar Search (Cmd+K) */}
          {!isPublicView && (
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#E2DBD0] dark:border-[#382F47] bg-[#EBE5DB]/40 dark:bg-[#2C2438] text-xs text-[#77717D] dark:text-[#AFA8B8] hover:text-[#211B2C] dark:hover:text-[#F5F1E9] transition-colors cursor-pointer"
              title="Global Omnibar Search (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span className="text-[11px]">Search...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.2 text-[9px] font-mono bg-[#FFFEFC] dark:bg-[#211B2C] rounded border border-[#E2DBD0] dark:border-[#382F47]">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Quick Create Button */}
          {!isPublicView && (
            <button
              onClick={() => setIsQuickCreateOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#8B5CF6] text-white text-xs font-semibold hover:bg-[#7C3AED] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              title="Quick Create (Task, Customer, Invoice, Document)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>
          )}

          {/* Voice Intelligence Command Trigger Button */}
          {!isPublicView && (
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="p-2 rounded-lg text-[#8B5CF6] bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 transition-colors cursor-pointer relative"
              title="Open Voice Command Assistant (Web Speech)"
            >
              <Mic className="w-4 h-4" />
              <span className="sr-only">Voice Commands</span>
            </button>
          )}

          {/* Activity Alerts & Notification Center */}
          {!isPublicView && (
            <NotificationBell orgId={currentOrg.id} onNavigate={setActiveTab} />
          )}

          {/* Pending Approvals Badge (Safe Execution Gate) */}
          {!isPublicView && (
            <button
              onClick={() => setActiveTab('approvals')}
              className="relative p-2 rounded-lg text-[#211B2C] dark:text-[#F5F1E9] hover:bg-[#EBE5DB] dark:hover:bg-[#2C2438] transition-colors cursor-pointer"
              title="Safe Approval Center"
            >
              <ShieldAlert className="w-5 h-5 text-[#FF806E]" />
              {pendingApprovalsCount > 0 && (
                <span className="absolute top-1 right-1 px-1.5 py-0.2 text-[10px] font-bold text-white bg-[#FF806E] rounded-full animate-bounce">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          )}

          {/* Currency Switcher (USD / PKR) */}
          <div className="flex items-center rounded-lg border border-[#E2DBD0] dark:border-[#382F47] p-0.5 bg-[#EBE5DB]/40 dark:bg-[#2C2438]">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2 py-1 text-[11px] font-mono font-semibold rounded cursor-pointer transition-colors ${
                currency === 'USD'
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#77717D] dark:text-[#AFA8B8] hover:text-[#211B2C] dark:hover:text-[#F5F1E9]'
              }`}
            >
              USD
            </button>
            <button
              onClick={() => setCurrency('PKR')}
              className={`px-2 py-1 text-[11px] font-mono font-semibold rounded cursor-pointer transition-colors ${
                currency === 'PKR'
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#77717D] dark:text-[#AFA8B8] hover:text-[#211B2C] dark:hover:text-[#F5F1E9]'
              }`}
            >
              PKR
            </button>
          </div>

          {/* Language Switcher (EN / اردو - RTL) */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E2DBD0] dark:border-[#382F47] text-xs font-semibold text-[#211B2C] dark:text-[#F5F1E9] bg-[#FFFEFC] dark:bg-[#2C2438] hover:border-[#8B5CF6] transition-colors cursor-pointer"
            title={language === 'en' ? 'Switch to Urdu (اردو) with RTL layout' : 'Switch to English (LTR)'}
          >
            <Globe className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>{language === 'en' ? 'EN' : 'اردو'}</span>
          </button>

          {/* Theme Switcher (Warm Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[#211B2C] dark:text-[#F5F1E9] hover:bg-[#EBE5DB] dark:hover:bg-[#2C2438] transition-colors cursor-pointer"
            title={isDarkMode ? 'Switch to Warm Ivory Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-[#C7F36B]" /> : <Moon className="w-4 h-4 text-[#8B5CF6]" />}
          </button>

          {/* User Sign-In Profile / Google Sign-In */}
          {firebaseUser ? (
            <div className="flex items-center gap-2 pl-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-[#211B2C] dark:text-[#F5F1E9] truncate max-w-[120px]">
                  {firebaseUser.displayName || firebaseUser.email}
                </span>
                <span className="text-[10px] text-[#10B981] font-mono flex items-center gap-1 justify-end">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              </div>
              {firebaseUser.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt={firebaseUser.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-[#8B5CF6]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center font-bold text-xs">
                  {firebaseUser.displayName?.[0] || 'U'}
                </div>
              )}
              <button
                onClick={logout}
                className="p-1.5 text-[#77717D] hover:text-[#FF806E] cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleDemoMode}
                className="hidden sm:inline-flex text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] hover:text-[#8B5CF6] px-2 py-1 cursor-pointer"
              >
                {isDemoMode ? 'Exit Demo' : 'Demo Sandbox'}
              </button>
              <button
                onClick={loginGoogle}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#211B2C] dark:bg-[#C7F36B] text-[#F5F1E9] dark:text-[#162700] text-xs font-semibold hover:opacity-90 shadow-sm cursor-pointer transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with Google</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create New Organization Modal */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-heading font-bold text-base text-[#211B2C] dark:text-[#F5F1E9]">
              Create New Business Organization
            </h3>
            <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">
              Create an isolated multi-tenant workspace with dedicated agent permissions, invoices, inventory, and audit logs.
            </p>
            <form onSubmit={handleCreateOrg} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#77717D] uppercase mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Acme Global Logistics"
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#77717D] uppercase mb-1">
                  Primary Currency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewOrgCurrency('USD')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                      newOrgCurrency === 'USD'
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#8B5CF6]'
                        : 'border-[#E2DBD0] dark:border-[#382F47] text-[#77717D]'
                    }`}
                  >
                    USD ($) Global
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewOrgCurrency('PKR')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                      newOrgCurrency === 'PKR'
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#8B5CF6]'
                        : 'border-[#E2DBD0] dark:border-[#382F47] text-[#77717D]'
                    }`}
                  >
                    PKR (₨) Pakistan
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateOrgModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#77717D] hover:bg-[#EBE5DB] dark:hover:bg-[#382F47] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white cursor-pointer"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Voice Command Assistant Modal */}
      <VoiceCommandModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      {/* Global Omnibar Search Modal (Cmd+K) */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* Quick Create Modal */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
      />
    </header>
  );
};
