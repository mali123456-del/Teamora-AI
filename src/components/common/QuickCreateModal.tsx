import React, { useState } from 'react';
import {
  X,
  Plus,
  ListTodo,
  UserCheck,
  Receipt,
  FileText,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { TEAMORA_AGENTS } from '../../data/agents.ts';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CreateType = 'task' | 'customer' | 'invoice' | 'expense' | 'document';

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({ isOpen, onClose }) => {
  const {
    addTask,
    addCustomer,
    addInvoice,
    addExpense,
    addDocument,
    currentOrg,
    setActiveTab,
    setBannerMessage,
  } = useApp();

  const [activeType, setActiveType] = useState<CreateType>('task');

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAgentId, setTaskAgentId] = useState(TEAMORA_AGENTS[0].id);
  const [taskPrompt, setTaskPrompt] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const [custName, setCustName] = useState('');
  const [custCompany, setCustCompany] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custValue, setCustValue] = useState(5000);

  const [invCustName, setInvCustName] = useState('');
  const [invAmount, setInvAmount] = useState(2500);

  const [expCategory, setExpCategory] = useState<'software' | 'marketing' | 'infrastructure' | 'operations'>('software');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState(500);

  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState<'contracts' | 'reports' | 'sop' | 'marketing' | 'research'>('sop');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeType === 'task') {
      const selectedAgent = TEAMORA_AGENTS.find((a) => a.id === taskAgentId) || TEAMORA_AGENTS[0];
      addTask({
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        title: taskTitle.trim() || 'New Agent Task',
        prompt: taskPrompt.trim() || taskTitle.trim(),
        status: 'queued',
        priority: taskPriority,
        createdBy: 'Sulaiman Khan',
      });
      setBannerMessage({ title: `Task created for ${selectedAgent.name}`, type: 'success' });
      setActiveTab('tasks');
    } else if (activeType === 'customer') {
      addCustomer({
        name: custName.trim() || 'New Lead',
        email: custEmail.trim() || 'lead@example.com',
        company: custCompany.trim() || 'Acme Corp',
        status: 'lead',
        value: Number(custValue) || 1000,
        currency: currentOrg.currency,
      });
      setBannerMessage({ title: `Lead ${custName} added to CRM`, type: 'success' });
      setActiveTab('crm');
    } else if (activeType === 'invoice') {
      addInvoice({
        invoiceNumber: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
        customerId: `cust-${Date.now()}`,
        customerName: invCustName.trim() || 'Acme Client',
        amount: Number(invAmount) || 1000,
        currency: currentOrg.currency,
        status: 'draft',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      setBannerMessage({ title: `Draft invoice generated`, type: 'success' });
      setActiveTab('finance');
    } else if (activeType === 'expense') {
      addExpense({
        category: expCategory,
        description: expDesc.trim() || 'Software subscription',
        amount: Number(expAmount) || 100,
        currency: currentOrg.currency,
        status: 'pending',
        submittedBy: 'Human Manager',
      });
      setBannerMessage({ title: `Expense submitted for review`, type: 'success' });
      setActiveTab('finance');
    } else if (activeType === 'document') {
      addDocument({
        name: docName.trim() || 'Standard Operating Procedure.pdf',
        size: '1.2 MB',
        type: 'pdf',
        category: docCategory,
        status: 'indexed',
        tags: [docCategory, 'quick-create'],
        summary: 'Ingested via Quick Create Omnibar.',
      });
      setBannerMessage({ title: `Document indexed into Knowledge Hub`, type: 'success' });
      setActiveTab('knowledge');
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2DBD0] dark:border-[#382F47]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            <h3 className="font-heading font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">
              Quick Create
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#77717D] hover:text-[#211B2C] dark:hover:text-[#F5F1E9] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-2 border-b border-[#E2DBD0] dark:border-[#382F47] bg-[#F5F1E9]/40 dark:bg-[#211B2C]/40 text-xs overflow-x-auto">
          {[
            { id: 'task', label: 'Agent Task', icon: ListTodo },
            { id: 'customer', label: 'Lead / Customer', icon: UserCheck },
            { id: 'invoice', label: 'Invoice', icon: Receipt },
            { id: 'expense', label: 'Expense', icon: DollarSign },
            { id: 'document', label: 'Document', icon: FileText },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveType(t.id as CreateType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#8B5CF6] text-white shadow-xs'
                    : 'text-[#77717D] dark:text-[#AFA8B8] hover:text-[#211B2C] dark:hover:text-[#F5F1E9]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-5 space-y-4">
          {activeType === 'task' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-[#77717D] uppercase mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Audit Q3 vendor cloud compute expenses"
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#77717D] uppercase mb-1">
                    Assignee Agent
                  </label>
                  <select
                    value={taskAgentId}
                    onChange={(e) => setTaskAgentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    {TEAMORA_AGENTS.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} — {agent.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#77717D] uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#77717D] uppercase mb-1">
                  Specific Objective / Prompt
                </label>
                <textarea
                  rows={3}
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                  placeholder="Provide instructions, target data, or deliverables..."
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
            </>
          )}

          {activeType === 'customer' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-[#77717D] uppercase mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Fatima Ali"
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#77717D] uppercase mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={custCompany}
                    onChange={(e) => setCustCompany(e.target.value)}
                    placeholder="e.g. Crescent Textiles Ltd"
                    className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#77717D] uppercase mb-1">
                    Estimated Deal Value ({currentOrg.currency})
                  </label>
                  <input
                    type="number"
                    value={custValue}
                    onChange={(e) => setCustValue(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>
            </>
          )}

          {activeType === 'invoice' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-[#77717D] uppercase mb-1">
                  Customer / Client Name
                </label>
                <input
                  type="text"
                  required
                  value={invCustName}
                  onChange={(e) => setInvCustName(e.target.value)}
                  placeholder="e.g. NovaTech Solutions"
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#77717D] uppercase mb-1">
                  Invoice Amount ({currentOrg.currency})
                </label>
                <input
                  type="number"
                  required
                  value={invAmount}
                  onChange={(e) => setInvAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
            </>
          )}

          {activeType === 'expense' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-[#77717D] uppercase mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="e.g. AWS Cloud Cluster Inference"
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#77717D] uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="software">Software</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="marketing">Marketing</option>
                    <option value="operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#77717D] uppercase mb-1">
                    Amount ({currentOrg.currency})
                  </label>
                  <input
                    type="number"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>
            </>
          )}

          {activeType === 'document' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-[#77717D] uppercase mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Enterprise Security Policy 2026.pdf"
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#77717D] uppercase mb-1">
                  Category
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="sop">Standard Operating Procedure (SOP)</option>
                  <option value="contracts">Contracts & Legal</option>
                  <option value="reports">Financial & Operational Reports</option>
                  <option value="marketing">Marketing & Brand</option>
                  <option value="research">Market Research</option>
                </select>
              </div>
            </>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2DBD0] dark:border-[#382F47]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#77717D] hover:bg-[#EBE5DB] dark:hover:bg-[#382F47] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
