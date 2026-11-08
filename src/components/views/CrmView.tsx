import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  DollarSign,
  TrendingUp,
  Trash2,
  Edit2,
  Sparkles,
} from 'lucide-react';

export const CrmView: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, formatCurrency } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lead' | 'prospect' | 'customer' | 'churned'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    status: 'lead' as const,
    value: 5000,
    phone: '',
    notes: '',
    assignedAgent: 'Vanguard',
  });

  const filtered = customers.filter((c) => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    addCustomer({
      name: formData.name,
      email: formData.email,
      company: formData.company || 'Independent',
      status: formData.status,
      value: Number(formData.value) || 0,
      currency: 'USD',
      phone: formData.phone,
      notes: formData.notes,
      assignedAgent: formData.assignedAgent,
    });

    setFormData({
      name: '',
      email: '',
      company: '',
      status: 'lead',
      value: 5000,
      phone: '',
      notes: '',
      assignedAgent: 'Vanguard',
    });
    setShowAddModal(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#8B5CF6]/15 text-[#8B5CF6]">
            Revenue & Client Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            CRM: Customers & Leads
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Manage enterprise sales pipeline, client profiles, deal values, and Vanguard lead engagement.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client / Lead</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#77717D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by contact, company, or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'lead', 'prospect', 'customer', 'churned'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase cursor-pointer transition-colors ${
                statusFilter === status
                  ? 'bg-[#8B5CF6] text-white font-semibold'
                  : 'bg-[#F5F1E9] dark:bg-[#2C2438] text-[#77717D] dark:text-[#AFA8B8]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F1E9] dark:bg-[#2C2438] border-b border-[#E2DBD0] dark:border-[#382F47] text-[#77717D] dark:text-[#AFA8B8] font-mono uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Contact & Company</th>
                <th className="px-5 py-3.5">Pipeline Status</th>
                <th className="px-5 py-3.5">Deal Value</th>
                <th className="px-5 py-3.5">Assigned Agent</th>
                <th className="px-5 py-3.5">Notes</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DBD0] dark:divide-[#382F47]">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[#F5F1E9]/50 dark:hover:bg-[#2C2438]/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-xs text-[#211B2C] dark:text-[#F5F1E9]">{c.name}</div>
                    <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">{c.company}</div>
                    <div className="text-[10px] text-[#8B5CF6] font-mono mt-0.5">{c.email}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <select
                      value={c.status}
                      onChange={(e) => updateCustomer(c.id, { status: e.target.value as any })}
                      className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
                    >
                      <option value="lead">Lead</option>
                      <option value="prospect">Prospect</option>
                      <option value="customer">Customer</option>
                      <option value="churned">Churned</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-xs text-[#10B981]">
                    {formatCurrency(c.value)}
                  </td>
                  <td className="px-5 py-4 font-semibold text-[#8B5CF6]">
                    {c.assignedAgent || 'Vanguard'}
                  </td>
                  <td className="px-5 py-4 text-[#77717D] dark:text-[#AFA8B8] max-w-xs truncate">
                    {c.notes || '—'}
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => deleteCustomer(c.id)}
                      className="p-1.5 text-[#77717D] hover:text-[#FF806E] transition-colors cursor-pointer"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-heading font-bold text-base text-[#211B2C] dark:text-[#F5F1E9]">
              Add New Client / Sales Lead
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                  Contact Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Bilal Ahmed"
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="bilal@company.com"
                    className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Indus Logistics"
                    className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                    Estimated Deal Value (USD)
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="lead">Lead</option>
                    <option value="prospect">Prospect</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                  Opportunity Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Key requirements, budget cycles, and pain points..."
                  className="w-full h-20 p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#77717D] dark:text-[#AFA8B8] hover:bg-[#EBE5DB] dark:hover:bg-[#382F47] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8B5CF6] text-white hover:bg-[#7C3AED] cursor-pointer"
                >
                  Save to CRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
