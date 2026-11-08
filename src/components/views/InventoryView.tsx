import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Package,
  AlertTriangle,
  Plus,
  Minus,
  RefreshCw,
  Search,
  CheckCircle2,
  TrendingDown,
  Building,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { inventory, updateStock, formatCurrency, addTask } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const categories = ['All', 'Hardware', 'Sensors', 'Servers'];

  const filtered = inventory.filter((item) => {
    const matchCat = filterCategory === 'All' || item.category === filterCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleTriggerRestock = (item: (typeof inventory)[0]) => {
    addTask({
      agentId: 'inventory-agent',
      agentName: 'Stockwell',
      title: `Draft Supplier Purchase Order for ${item.name} (${item.sku})`,
      prompt: `Generate a purchase order for 250 units of ${item.name} to supplier ${item.supplier}. Validate lead times.`,
      status: 'needs_approval',
      priority: 'high',
      requiresApproval: true,
      createdBy: 'Inventory Controller',
      modelUsed: 'gemini-3.8-flash',
      result: `Restock purchase order #PO-${Date.now().toString().slice(-4)} prepared. Awaiting managerial disbursement sign-off in Approvals Gate.`,
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#D97706]/15 text-[#D97706]">
            Supply Chain & Warehouse
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Products & Inventory Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Supervised by Stockwell (Inventory Controller). Real-time SKU tracking, safety stock buffer triggers, and automated supplier reorders.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#77717D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search SKUs, product name, or suppliers..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase cursor-pointer transition-colors ${
                filterCategory === cat
                  ? 'bg-[#8B5CF6] text-white font-semibold'
                  : 'bg-[#F5F1E9] dark:bg-[#2C2438] text-[#77717D] dark:text-[#AFA8B8]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F1E9] dark:bg-[#2C2438] border-b border-[#E2DBD0] dark:border-[#382F47] text-[#77717D] dark:text-[#AFA8B8] font-mono uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3.5">SKU & Product</th>
                <th className="px-5 py-3.5">Stock Status</th>
                <th className="px-5 py-3.5">Current Qty</th>
                <th className="px-5 py-3.5">Min Threshold</th>
                <th className="px-5 py-3.5">Unit Price</th>
                <th className="px-5 py-3.5">Supplier</th>
                <th className="px-5 py-3.5 text-right">Adjust Stock / Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DBD0] dark:divide-[#382F47]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#F5F1E9]/50 dark:hover:bg-[#2C2438]/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-[10px] font-mono font-bold text-[#8B5CF6] uppercase">
                      {item.sku}
                    </span>
                    <div className="font-bold text-xs text-[#211B2C] dark:text-[#F5F1E9]">
                      {item.name}
                    </div>
                    <span className="text-[10px] text-[#77717D] dark:text-[#AFA8B8]">{item.category}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        item.status === 'in_stock'
                          ? 'bg-[#10B981]/20 text-[#10B981]'
                          : item.status === 'low_stock'
                          ? 'bg-[#D97706]/20 text-[#D97706]'
                          : 'bg-[#FF806E]/20 text-[#FF806E]'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono font-extrabold text-xs text-[#211B2C] dark:text-[#F5F1E9]">
                    {item.stockQuantity} units
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-[#77717D] dark:text-[#AFA8B8]">
                    {item.minThreshold} units
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-xs text-[#10B981]">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-5 py-4 text-[#77717D] dark:text-[#AFA8B8]">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      <span>{item.supplier}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => updateStock(item.id, -1)}
                        className="p-1.5 rounded-lg bg-[#EBE5DB] dark:bg-[#382F47] hover:bg-[#FF806E] hover:text-white cursor-pointer transition-colors"
                        title="Deduct 1 Unit"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => updateStock(item.id, 10)}
                        className="px-2 py-1 rounded-lg bg-[#EBE5DB] dark:bg-[#382F47] hover:bg-[#10B981] hover:text-white font-mono text-[10px] font-bold cursor-pointer transition-colors"
                        title="Add 10 Units"
                      >
                        +10
                      </button>
                      {item.status !== 'in_stock' && (
                        <button
                          onClick={() => handleTriggerRestock(item)}
                          className="px-2.5 py-1 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Restock</span>
                        </button>
                      )}
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
