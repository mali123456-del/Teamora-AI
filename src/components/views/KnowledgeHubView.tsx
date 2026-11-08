import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Files,
  Upload,
  Search,
  FileText,
  CheckCircle2,
  Tag,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react';

export const KnowledgeHubView: React.FC = () => {
  const { documents, addDocument } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'reports' as const,
    size: '1.2 MB',
    type: 'pdf' as const,
    tags: 'AI, Operations, Strategy',
    summary: '',
  });

  const categories = ['All', 'contracts', 'reports', 'sop', 'marketing', 'research'];

  const filtered = documents.filter((doc) => {
    const matchCat = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.summary && doc.summary.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.name) return;

    addDocument({
      name: uploadForm.name,
      category: uploadForm.category,
      size: uploadForm.size,
      type: uploadForm.type,
      tags: uploadForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      summary: uploadForm.summary || 'Automatically indexed by Scribe (Document Agent).',
      status: 'indexed',
    });

    setUploadForm({
      name: '',
      category: 'reports',
      size: '1.2 MB',
      type: 'pdf',
      tags: 'AI, Operations, Strategy',
      summary: '',
    });
    setShowUploadModal(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#14B8A6]/15 text-[#14B8A6]">
            Semantic Vector Vault
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Knowledge Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Curated by Scribe (Document Agent). Upload PDFs, contracts, and SOPs for multi-agent semantic search and instant context retrieval.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
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
            placeholder="Search documents by keyword or semantic tag..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#8B5CF6] text-white font-semibold'
                  : 'bg-[#F5F1E9] dark:bg-[#2C2438] text-[#77717D] dark:text-[#AFA8B8]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] hover:border-[#8B5CF6] transition-all shadow-sm flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#14B8A6]/20 text-[#14B8A6] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-[#211B2C] dark:text-[#F5F1E9] truncate">
                      {doc.name}
                    </h3>
                    <div className="text-[10px] text-[#77717D] dark:text-[#AFA8B8] font-mono">
                      {doc.size} • {doc.type.toUpperCase()}
                    </div>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold bg-[#10B981]/20 text-[#10B981] flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  {doc.status}
                </span>
              </div>

              {doc.summary && (
                <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] leading-relaxed line-clamp-3">
                  {doc.summary}
                </p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {doc.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-[#F5F1E9] dark:bg-[#2C2438] text-[10px] font-mono text-[#8B5CF6]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2DBD0] dark:border-[#382F47] flex items-center justify-between text-[10px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
              <span>Category: {doc.category}</span>
              <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-heading font-bold text-base text-[#211B2C] dark:text-[#F5F1E9]">
              Index Document into Knowledge Hub
            </h3>
            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  placeholder="e.g. Q4_Executive_Strategy_Memo.pdf"
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                    Category
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
                  >
                    <option value="reports">Reports</option>
                    <option value="contracts">Contracts</option>
                    <option value="sop">SOP Guidelines</option>
                    <option value="research">Research</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                    Format
                  </label>
                  <select
                    value={uploadForm.type}
                    onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
                  >
                    <option value="pdf">PDF</option>
                    <option value="docx">DOCX</option>
                    <option value="markdown">Markdown</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                  Semantic Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  placeholder="Legal, Finance, SLA"
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                  Executive Abstract / Key Context
                </label>
                <textarea
                  value={uploadForm.summary}
                  onChange={(e) => setUploadForm({ ...uploadForm, summary: e.target.value })}
                  placeholder="Key summary points and context for autonomous agents..."
                  className="w-full h-20 p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#77717D] dark:text-[#AFA8B8] hover:bg-[#EBE5DB] dark:hover:bg-[#382F47] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8B5CF6] text-white hover:bg-[#7C3AED] cursor-pointer"
                >
                  Confirm & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
