import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Search, LifeBuoy, BookOpen, Download, Send, Sparkles } from 'lucide-react';

interface HelpArticle {
  id: string;
  category: string;
  title: string;
  summary: string;
  steps: string[];
}

interface SupportTicketItem {
  ticketId: string;
  category: string;
  severity: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'help-onboarding',
    category: 'Getting Started',
    title: 'Multi-Tenant Workspace Setup & Onboarding',
    summary: 'Switch organizations, set English LTR or اردو RTL, select USD/PKR currency, and launch your first Atlas task.',
    steps: [
      'Use the workspace switcher in the top header to select or create a tenant organization.',
      'Click "Open Setup Wizard" above anytime to resume or walk through initial onboarding.',
      'High-impact AI outputs (payouts, contracts, external emails) always wait in Approvals Gate before execution.',
    ],
  },
  {
    id: 'help-approvals',
    category: 'Governance & Safety',
    title: 'Understanding the Two-Stage Approvals Gate',
    summary: 'Why human sign-off and server execution are decoupled with SHA-256 receipts.',
    steps: [
      'Stage 1: Manager, Admin, or Owner approves or rejects a flagged AI action request.',
      'Stage 2: Clicking Execute sends an idempotent request to /api/approval/execute which records a verifiable receipt.',
    ],
  },
  {
    id: 'help-offline',
    category: 'Offline & Sync',
    title: 'Offline IndexedDB Queue & Conflict Resolution',
    summary: 'How offline drafts queue reliably and reconcile without duplicate task execution.',
    steps: [
      'Offline drafts are saved in IndexedDB with deterministic keys (idemp-task-<id>).',
      'When connectivity resumes, click the Sync indicator or wait for automatic background replay.',
    ],
  },
  {
    id: 'help-export',
    category: 'Billing & Portability',
    title: 'Exporting Organization Data (JSON & CSV)',
    summary: 'Managers, Admins, and Owners can export schema-versioned tenant data anytime.',
    steps: [
      'Open Security & Audit Logs from the sidebar.',
      'Click Export JSON or Export CSV. Sensitive secrets are automatically omitted from downloads.',
    ],
  },
];

export const HelpSupportView: React.FC = () => {
  const { currentOrg, user, setBannerMessage, setIsOnboardingOpen } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [category, setCategory] = useState<'bug' | 'billing' | 'access' | 'feature_request' | 'onboarding'>('bug');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      'x-teamora-org': currentOrg.id,
      'x-teamora-sandbox': 'true',
      'x-teamora-uid': user?.uid || 'user-admin-002',
    }),
    [currentOrg.id, user?.uid]
  );

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/tickets?orgId=${currentOrg.id}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {
      // Non-fatal
    }
  }, [authHeaders, currentOrg.id]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          orgId: currentOrg.id,
          category,
          severity,
          subject: subject.trim(),
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubject('');
        setDescription('');
        await loadTickets();
        setBannerMessage({
          title: `Support ticket ${data.ticket.ticketId} submitted for ${currentOrg.name}.`,
          type: 'success',
        });
      } else {
        setBannerMessage({ title: data.error || 'Could not submit ticket.', type: 'warning' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadDiagnostics = async () => {
    const res = await fetch(`/api/support/bug-report?orgId=${currentOrg.id}`, { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data.report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teamora-${currentOrg.id}-diagnostic-report.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBannerMessage({ title: 'Downloaded redacted diagnostic bundle.', type: 'info' });
    }
  };

  const filteredArticles = HELP_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2DBD0] dark:border-[#382F47] pb-4">
        <div>
          <p className="text-xs font-mono text-[#77717D] dark:text-[#AFA8B8]">
            Documentation & Support / {currentOrg.name}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Help Center & Support Operations
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#8B5CF6] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Setup Wizard</span>
          </button>
          <button
            onClick={handleDownloadDiagnostics}
            className="px-3.5 py-2 rounded-lg border border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC] dark:bg-[#211B2C] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Diagnostic JSON</span>
          </button>
        </div>
      </div>

      {/* Knowledge & FAQ Search */}
      <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#8B5CF6]" />
            Workspace Guides & Troubleshooting
          </h2>
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-[#77717D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Search help guides"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className="p-4 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-2"
            >
              <div className="text-[11px] font-mono text-[#8B5CF6]">{art.category}</div>
              <h3 className="text-sm font-bold">{art.title}</h3>
              <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">{art.summary}</p>
              <ul className="text-xs space-y-1 list-disc pl-4 pt-1 text-[#211B2C] dark:text-[#F5F1E9]">
                {art.steps.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Support Ticket Creation & History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleSubmitTicket}
          className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-4 text-xs"
        >
          <h2 className="text-sm font-bold flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-[#8B5CF6]" />
            Submit Support Request or Feedback
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#77717D] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47]"
              >
                <option value="bug">Bug Report</option>
                <option value="billing">Billing & Plans</option>
                <option value="access">Team Access / RBAC</option>
                <option value="onboarding">Onboarding Assistance</option>
                <option value="feature_request">Feature Feedback</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#77717D] mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full p-2 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#77717D] mb-1">Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Concise summary of issue or feedback"
              className="w-full p-2.5 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#77717D] mb-1">Details</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Steps to reproduce, expected behavior, or product feedback..."
              className="w-full p-2.5 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Request</span>
          </button>
        </form>

        <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-4">
          <h2 className="text-sm font-bold">Organization Ticket History ({tickets.length})</h2>
          {tickets.length === 0 ? (
            <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">
              No open support requests for {currentOrg.name}.
            </p>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.ticketId}
                  className="p-3 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{t.subject}</span>
                    <span className="font-mono uppercase text-[11px] text-[#8B5CF6]">{t.status}</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
                    {t.ticketId} · {t.category} · {t.severity}
                  </div>
                  <p className="text-[#77717D] dark:text-[#AFA8B8]">{t.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
