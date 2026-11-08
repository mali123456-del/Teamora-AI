import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { TeamoraLogo } from '../common/TeamoraLogo.tsx';
import {
  Sun,
  Moon,
  Globe,
  Bell,
  ShieldAlert,
  LogIn,
  LogOut,
  Building2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  onOpenAuthModal?: () => void;
  isPublicView?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuthModal, isPublicView = false }) => {
  const {
    isDarkMode,
    toggleTheme,
    language,
    setLanguage,
    currency,
    setCurrency,
    user,
    firebaseUser,
    loginGoogle,
    logout,
    currentOrg,
    organizations,
    setCurrentOrg,
    approvals,
    setActiveTab,
  } = useApp();

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC]/95 dark:bg-[#211B2C]/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand or Org Selector */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab(isPublicView ? 'landing' : 'dashboard')}
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <TeamoraLogo size="md" />
          </button>

          {!isPublicView && (
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[#E2DBD0] dark:border-[#382F47]">
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-[#211B2C] dark:text-[#F5F1E9] bg-[#EBE5DB]/60 dark:bg-[#2C2438] hover:bg-[#EBE5DB] dark:hover:bg-[#382F47] transition-colors cursor-pointer">
                  <Building2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span className="font-semibold">{currentOrg.name}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono bg-[#8B5CF6]/15 text-[#8B5CF6]">
                    {currentOrg.plan}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#77717D]" />
                </button>
                {/* Org Switcher Dropdown */}
                <div className="absolute left-0 mt-1 w-64 bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] rounded-xl shadow-xl py-2 hidden group-hover:block z-50">
                  <div className="px-3 py-1 text-[11px] font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
                    Switch Organization
                  </div>
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => setCurrentOrg(org)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F5F1E9] dark:hover:bg-[#382F47] cursor-pointer ${
                        org.id === currentOrg.id ? 'font-bold text-[#8B5CF6]' : 'text-[#211B2C] dark:text-[#F5F1E9]'
                      }`}
                    >
                      <span className="truncate">{org.name}</span>
                      <span className="text-[10px] font-mono text-[#77717D] uppercase">{org.currency}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Action Tools: Language, Currency, Approvals Badge, Theme, Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
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
                  {firebaseUser.displayName || 'Authorized'}
                </span>
                <span className="text-[10px] text-[#77717D] font-mono">Firebase Auth</span>
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
            <button
              onClick={loginGoogle}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#211B2C] dark:bg-[#C7F36B] text-[#F5F1E9] dark:text-[#162700] text-xs font-semibold hover:opacity-90 shadow-sm cursor-pointer transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
