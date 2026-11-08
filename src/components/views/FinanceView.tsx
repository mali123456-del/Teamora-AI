import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Wallet,
  Receipt,
  Plus,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Search,
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const { invoices, expenses, addInvoice, addExpense, formatCurrency, updateInvoiceStatus, customers } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'expenses'>('invoices');
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // New Invoice Form
  const [invForm, setInvForm] = useState({
    customerId: customers[0]?.id || 'cust-1',
    customerName: customers[0]?.name || 'NovaTech Solutions',
    amount: 5000,
    dueDate: '2026-11-30',
  });

  // New Expense Form
  const [expForm, setExpForm] = useState({
    category: 'infrastructure' as const,
    description: '',
    amount: 1200,
  });

  const totalInvoiced = invoices.reduce((acc, i) => acc + i.amount, 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((acc, i) => acc + i.amount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === invForm.customerId);
    addInvoice({
      invoiceNumber: `INV-2026-${Date.now().toString().slice(-3)}`,
      customerId: invForm.customerId,
      customerName: cust?.name || invForm.customerName,
      amount: Number(invForm.amount) || 0,
      currency: 'USD',
      status: 'sent',
      dueDate: invForm.dueDate,
    });
    setShowAddInvoiceModal(false);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.description) return;
    addExpense({
      category: expForm.category,
      description: expForm.description,
      amount: Number(expForm.amount) || 0,
      currency: 'USD',
      status: 'pending',
      submittedBy: 'Finance Controller',
    });
    setExpForm({ category: 'infrastructure', description: '', amount: 1200 });
    setShowAddExpenseModal(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#10B981]/15 text-[#10B981]">
            Ledger & Treasury Architecture
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Finance, Invoices & Expenses
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Supervised by Ledger (Finance Agent). Strict audit accuracy, automated reconciliations, and PKR / USD conversions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'invoices' ? (
            <button
              onClick={() => setShowAddInvoiceModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm">
          <span className="text-xs font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
            Collected Revenue
          </span>
          <div className="font-heading font-extrabold text-3xl text-[#10B981] mt-1">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] font-mono mt-1">
            Total Invoiced: {formatCurrency(totalInvoiced)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm">
          <span className="text-xs font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
            Operational Expenses
          </span>
          <div className="font-heading font-extrabold text-3xl text-[#FF806E] mt-1">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] font-mono mt-1">
            {expenses.length} Itemized Disbursements
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm">
          <span className="text-xs font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
            Net Operating Margin
          </span>
          <div className="font-heading font-extrabold text-3xl text-[#8B5CF6] mt-1">
            {formatCurrency(Math.max(0, totalPaid - totalExpenses))}
          </div>
          <div className="text-[11px] text-[#10B981] font-mono mt-1">
            Positive Cash-Flow Velocity
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-[#E2DBD0] dark:border-[#382F47] text-xs font-bold gap-6">
        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`pb-3 border-b-2 cursor-pointer transition-colors ${
            activeSubTab === 'invoices'
              ? 'border-[#8B5CF6] text-[#8B5CF6]'
              : 'border-transparent text-[#77717D] dark:text-[#AFA8B8]'
          }`}
        >
          Customer Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`pb-3 border-b-2 cursor-pointer transition-colors ${
            activeSubTab === 'expenses'
              ? 'border-[#8B5CF6] text-[#8B5CF6]'
              : 'border-transparent text-[#77717D] dark:text-[#AFA8B8]'
          }`}
        >
          Operational Expenses ({expenses.length})
        </button>
      </div>

      {/* Invoices List */}
      {activeSubTab === 'invoices' ? (
        <div className="rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F1E9] dark:bg-[#2C2438] border-b border-[#E2DBD0] dark:border-[#382F47] text-[#77717D] dark:text-[#AFA8B8] font-mono uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DBD0] dark:divide-[#382F47]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F5F1E9]/50 dark:hover:bg-[#2C2438]/50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-[#8B5CF6]">{inv.invoiceNumber}</td>
                    <td className="px-5 py-4 font-semibold text-[#211B2C] dark:text-[#F5F1E9]">
                      {inv.customerName}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-[#10B981]/20 text-[#10B981]'
                            : inv.status === 'sent'
                            ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                            : 'bg-[#FF806E]/20 text-[#FF806E]'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-xs text-[#211B2C] dark:text-[#F5F1E9]">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                      {inv.dueDate}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {inv.status !== 'paid' ? (
                        <button
                          onClick={() => updateInvoiceStatus(inv.id, 'paid')}
                          className="px-2.5 py-1 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[10px] cursor-pointer"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-[#10B981] font-semibold">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Expenses List */
        <div className="rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F1E9] dark:bg-[#2C2438] border-b border-[#E2DBD0] dark:border-[#382F47] text-[#77717D] dark:text-[#AFA8B8] font-mono uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DBD0] dark:divide-[#382F47]">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#F5F1E9]/50 dark:hover:bg-[#2C2438]/50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold uppercase text-[10px] text-[#8B5CF6]">
                      {exp.category}
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#211B2C] dark:text-[#F5F1E9]">
                      {exp.description}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-xs text-[#FF806E]">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#10B981]/20 text-[#10B981]">
                        {exp.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                      {exp.submittedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-heading font-bold text-base text-[#211B2C] dark:text-[#F5F1E9]">
              Generate Enterprise Invoice
            </h3>
            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                  Recipient Customer *
                </label>
                <select
                  value={invForm.customerId}
                  onChange={(e) => setInvForm({ ...invForm, customerId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                  Invoice Amount (USD) *
                </label>
                <input
                  type="number"
                  required
                  value={invForm.amount}
                  onChange={(e) => setInvForm({ ...invForm, amount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={invForm.dueDate}
                  onChange={(e) => setInvForm({ ...invForm, dueDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#77717D] dark:text-[#AFA8B8] hover:bg-[#EBE5DB] dark:hover:bg-[#382F47] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8B5CF6] text-white hover:bg-[#7C3AED] cursor-pointer"
                >
                  Create & Send Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-heading font-bold text-base text-[#211B2C] dark:text-[#F5F1E9]">
              Record Operational Expense
            </h3>
            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                  Category
                </label>
                <select
                  value={expForm.category}
                  onChange={(e) => setExpForm({ ...expForm, category: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
                >
                  <option value="infrastructure">Infrastructure & Cloud</option>
                  <option value="marketing">Marketing & Growth</option>
                  <option value="software">Software & SaaS</option>
                  <option value="operations">Operations & Logistics</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  value={expForm.description}
                  onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                  placeholder="e.g. OpenAI/Anthropic API fallback compute"
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                  Amount (USD) *
                </label>
                <input
                  type="number"
                  required
                  value={expForm.amount}
                  onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#77717D] dark:text-[#AFA8B8] hover:bg-[#EBE5DB] dark:hover:bg-[#382F47] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8B5CF6] text-white hover:bg-[#7C3AED] cursor-pointer"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
