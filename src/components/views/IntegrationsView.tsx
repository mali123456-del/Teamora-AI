import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Plug,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Lock,
  Plus,
} from 'lucide-react';

export const IntegrationsView: React.FC = () => {
  const { firebaseUser, loginGoogle, setBannerMessage } = useApp();
  const [keepNotes, setKeepNotes] = useState([
    {
      id: 'kn-1',
      title: 'Q3 Enterprise Architecture Notes',
      body: 'Verified zero-trust rules for Firestore and Gemini 4 Argon reasoning endpoints.',
      updatedAt: '2026-11-07 18:30',
    },
    {
      id: 'kn-2',
      title: 'Vanguard Follow-up Pipeline Checklist',
      body: 'Reach out to Indus Logistics and schedule executive demo with CEO.',
      updatedAt: '2026-11-07 16:45',
    },
  ]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteBody, setNewNoteBody] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncKeep = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setBannerMessage({
        title: 'Google Keep Workspace notes synchronized successfully.',
        type: 'success',
      });
    }, 1200);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle) return;

    setKeepNotes([
      {
        id: `kn-${Date.now()}`,
        title: newNoteTitle,
        body: newNoteBody,
        updatedAt: 'Just now',
      },
      ...keepNotes,
    ]);

    setNewNoteTitle('');
    setNewNoteBody('');
    setBannerMessage({
      title: 'Note added to synchronized Google Workspace Keep stream.',
      type: 'success',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#8B5CF6]/15 text-[#8B5CF6]">
            Ecosystem Connectivity
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Integrations & Google Workspace Keep
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Connect TEAMORA AI with Google Workspace, Google Keep, Slack, and external webhooks for seamless bidirectional automation.
          </p>
        </div>
      </div>

      {/* Featured: Google Workspace & Keep Integration Card */}
      <div className="p-6 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border-2 border-[#8B5CF6]/40 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xl">
              📝
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-lg text-[#211B2C] dark:text-[#F5F1E9]">
                  Google Keep & Workspace Suite
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10B981]/20 text-[#10B981]">
                  Connected
                </span>
              </div>
              <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">
                OAuth 2.0 authorized via Firebase Authentication. Scribe and Atlas can summarize, extract, and append notes to your Keep stream with user permission.
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncKeep}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Notes Now'}</span>
          </button>
        </div>

        {/* Google Keep Notes Stream & Quick Create */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-[#E2DBD0] dark:border-[#382F47]">
          {/* Notes list */}
          <div className="lg:col-span-7 space-y-3">
            <span className="text-[11px] font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
              Active Google Keep Stream ({keepNotes.length})
            </span>
            <div className="space-y-3">
              {keepNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-[#211B2C] dark:text-[#F5F1E9]">
                      {note.title}
                    </h4>
                    <span className="text-[10px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
                      {note.updatedAt}
                    </span>
                  </div>
                  <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">{note.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Create Note */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-3">
            <h4 className="font-bold text-xs text-[#211B2C] dark:text-[#F5F1E9]">
              Append Note via AI Agent
            </h4>
            <form onSubmit={handleCreateNote} className="space-y-2 text-xs">
              <input
                type="text"
                required
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Note Title..."
                className="w-full p-2.5 rounded-lg bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
              />
              <textarea
                value={newNoteBody}
                onChange={(e) => setNewNoteBody(e.target.value)}
                placeholder="Note body or extracted agent summary..."
                className="w-full h-20 p-2.5 rounded-lg bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[#211B2C] dark:bg-[#C7F36B] text-[#F5F1E9] dark:text-[#162700] font-bold cursor-pointer hover:opacity-90 transition-opacity"
              >
                Dispatch to Google Keep
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Additional Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">Slack Connect</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C7F36B]/20 text-[#162700] dark:text-[#C7F36B] font-bold">
              Ready
            </span>
          </div>
          <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">
            Receive agent approval alerts and task completion digests directly in your team's Slack channels.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">Outbound Webhooks</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] font-bold">
              Active
            </span>
          </div>
          <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">
            Emit signed HTTPS payloads to your custom API or backend whenever an agent completes a milestone.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">Gemini Server API</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-bold">
              Connected
            </span>
          </div>
          <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">
            Direct server-side integration with Gemini 4 Argon, 3.8 Flash, and Google Search Grounding tools.
          </p>
        </div>
      </div>
    </div>
  );
};
