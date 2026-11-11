import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  UsersRound,
  ListTodo,
  UserCheck,
  Package,
  Receipt,
  LayoutDashboard,
  Database,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { TEAMORA_AGENTS } from '../../data/agents.ts';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResultItem {
  id: string;
  category: 'Navigation' | 'AI Agent' | 'Task' | 'Customer' | 'Inventory' | 'Invoice';
  title: string;
  subtitle: string;
  targetTab: string;
  agentId?: string;
  icon: React.FC<{ className?: string }>;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { setActiveTab, setSelectedAgentId, tasks, customers, inventory, invoices } = useApp();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Aggregate searchable items
  const allSearchableItems: SearchResultItem[] = [
    // Navigation Views
    { id: 'nav-dash', category: 'Navigation', title: 'Main Dashboard', subtitle: 'Overview KPIs & activity', targetTab: 'dashboard', icon: LayoutDashboard },
    { id: 'nav-agents', category: 'Navigation', title: '15 AI Employees', subtitle: 'Workforce directory', targetTab: 'workforce', icon: UsersRound },
    { id: 'nav-tasks', category: 'Navigation', title: 'Task Center', subtitle: 'Task queues & execution status', targetTab: 'tasks', icon: ListTodo },
    { id: 'nav-approvals', category: 'Navigation', title: 'Approvals Gate', subtitle: 'Human-in-the-loop sign-offs', targetTab: 'approvals', icon: Sparkles },
    { id: 'nav-crm', category: 'Navigation', title: 'CRM & Customer Pipeline', subtitle: 'Leads, prospects & deals', targetTab: 'crm', icon: UserCheck },
    { id: 'nav-inventory', category: 'Navigation', title: 'Inventory & Stock Management', subtitle: 'SKU counts & thresholds', targetTab: 'inventory', icon: Package },
    { id: 'nav-finance', category: 'Navigation', title: 'Invoices & Financial Controller', subtitle: 'Revenue, expenses & invoices', targetTab: 'finance', icon: Receipt },
    { id: 'nav-rag', category: 'Navigation', title: 'RAG Studio & Crawler', subtitle: 'Vector search & document ingestion', targetTab: 'rag-studio', icon: Database },

    // 15 Canonical AI Agents
    ...TEAMORA_AGENTS.map((agent) => ({
      id: `agent-${agent.id}`,
      category: 'AI Agent' as const,
      title: `${agent.name} (${agent.role})`,
      subtitle: `${agent.department} · ${agent.capabilities.slice(0, 2).join(', ')}`,
      targetTab: 'agent-workspace',
      agentId: agent.id,
      icon: UsersRound,
    })),

    // Active Tasks
    ...tasks.map((task) => ({
      id: `task-${task.id}`,
      category: 'Task' as const,
      title: task.title,
      subtitle: `${task.agentName} · ${task.status} · Priority: ${task.priority}`,
      targetTab: 'tasks',
      icon: ListTodo,
    })),

    // Customers
    ...customers.map((cust) => ({
      id: `cust-${cust.id}`,
      category: 'Customer' as const,
      title: cust.name,
      subtitle: `${cust.company} · Status: ${cust.status}`,
      targetTab: 'crm',
      icon: UserCheck,
    })),

    // Inventory SKUs
    ...inventory.map((item) => ({
      id: `inv-${item.id}`,
      category: 'Inventory' as const,
      title: `${item.name} (${item.sku})`,
      subtitle: `Stock: ${item.stockQuantity} · Status: ${item.status}`,
      targetTab: 'inventory',
      icon: Package,
    })),

    // Invoices
    ...invoices.map((inv) => ({
      id: `invoice-${inv.id}`,
      category: 'Invoice' as const,
      title: `${inv.invoiceNumber} — ${inv.customerName}`,
      subtitle: `Amount: $${inv.amount.toLocaleString()} · Status: ${inv.status}`,
      targetTab: 'finance',
      icon: Receipt,
    })),
  ];

  // Filter based on user query
  const filteredItems = query.trim()
    ? allSearchableItems.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : allSearchableItems.slice(0, 6);

  const handleSelectItem = (item: SearchResultItem) => {
    setActiveTab(item.targetTab);
    if (item.agentId) {
      setSelectedAgentId(item.agentId);
    }
    onClose();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelectItem(filteredItems[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3 border-b border-[#E2DBD0] dark:border-[#382F47]">
          <Search className="w-5 h-5 text-[#8B5CF6] shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search workspaces, agents, tasks, customers, or invoices..."
            className="w-full bg-transparent text-sm text-[#211B2C] dark:text-[#F5F1E9] placeholder-[#77717D] dark:placeholder-[#AFA8B8] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#77717D] hover:text-[#211B2C] dark:hover:text-[#F5F1E9] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-[#E2DBD0]/50 dark:divide-[#382F47]/50 p-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center space-y-1">
              <Search className="w-6 h-6 mx-auto text-[#77717D]/40" />
              <p className="text-xs font-semibold text-[#211B2C] dark:text-[#F5F1E9]">No results found</p>
              <p className="text-[11px] text-[#77717D]">Try searching for "Atlas", "Invoice", "CRM", or "RAG"</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#8B5CF6]/15 dark:bg-[#8B5CF6]/25 text-[#8B5CF6]'
                      : 'hover:bg-[#F5F1E9]/60 dark:hover:bg-[#211B2C]/40 text-[#211B2C] dark:text-[#F5F1E9]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-[#EBE5DB]/60 dark:bg-[#211B2C] text-[#8B5CF6] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate text-[#211B2C] dark:text-[#F5F1E9]">
                        {item.title}
                      </div>
                      {/* Zero-Pill Unboxed Metadata */}
                      <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] truncate">
                        <span>{item.category}</span>
                        <span aria-hidden="true" className="mx-1">·</span>
                        <span>{item.subtitle}</span>
                      </div>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      isSelected ? 'text-[#8B5CF6] translate-x-1' : 'text-transparent'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2.5 bg-[#F5F1E9]/60 dark:bg-[#211B2C]/60 border-t border-[#E2DBD0] dark:border-[#382F47] flex items-center justify-between text-[11px] text-[#77717D]">
          <div className="flex items-center gap-3">
            <span>Use <kbd className="px-1.5 py-0.5 rounded bg-[#EBE5DB] dark:bg-[#2C2438] font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-[#EBE5DB] dark:bg-[#2C2438] font-mono text-[10px]">↓</kbd> to navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[#EBE5DB] dark:bg-[#2C2438] font-mono text-[10px]">↵</kbd> to select</span>
          </div>
          <span><kbd className="px-1.5 py-0.5 rounded bg-[#EBE5DB] dark:bg-[#2C2438] font-mono text-[10px]">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};
