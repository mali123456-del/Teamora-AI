import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  ShieldAlert,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  Sparkles,
} from 'lucide-react';

export const TaskCenter: React.FC = () => {
  const { tasks, addTask, user } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<(typeof tasks)[0] | null>(null);

  const filteredTasks = tasks.filter((t) => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#8B5CF6]/15 text-[#8B5CF6]">
            Execution Queue & Audit
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Task Center
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Real-time multi-agent execution feed, priority pipelines, model telemetry, and outcome verification.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#77717D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks, prompts, or agents..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'completed', 'needs_approval', 'running', 'queued'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase cursor-pointer transition-colors ${
                filterStatus === status
                  ? 'bg-[#8B5CF6] text-white font-semibold'
                  : 'bg-[#F5F1E9] dark:bg-[#2C2438] text-[#77717D] dark:text-[#AFA8B8]'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Task Table */}
      <div className="rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F1E9] dark:bg-[#2C2438] border-b border-[#E2DBD0] dark:border-[#382F47] text-[#77717D] dark:text-[#AFA8B8] font-mono uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Task Title</th>
                <th className="px-5 py-3.5">Agent</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Model / Telemetry</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DBD0] dark:divide-[#382F47]">
              {filteredTasks.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className="hover:bg-[#F5F1E9]/60 dark:hover:bg-[#2C2438]/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        t.status === 'completed'
                          ? 'bg-[#10B981]/20 text-[#10B981]'
                          : t.status === 'needs_approval'
                          ? 'bg-[#FF806E]/20 text-[#FF806E]'
                          : 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
                      }`}
                    >
                      {t.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                      {t.status === 'needs_approval' && <ShieldAlert className="w-3 h-3" />}
                      {t.status === 'running' && <Clock className="w-3 h-3 animate-spin" />}
                      <span>{t.status.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-[#211B2C] dark:text-[#F5F1E9] max-w-xs truncate">
                    {t.title}
                  </td>
                  <td className="px-5 py-4 text-[#8B5CF6] font-semibold">{t.agentName}</td>
                  <td className="px-5 py-4 uppercase font-mono text-[10px]">{t.priority}</td>
                  <td className="px-5 py-4 font-mono text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                    {t.modelUsed || 'gemini-3.8-flash'}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                    {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Result Inspection Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#8B5CF6] font-bold">
                  Task #{selectedTask.id}
                </span>
                <h3 className="font-heading font-extrabold text-lg text-[#211B2C] dark:text-[#F5F1E9]">
                  {selectedTask.title}
                </h3>
                <div className="text-xs text-[#77717D] dark:text-[#AFA8B8]">
                  Assigned to <strong className="text-[#8B5CF6]">{selectedTask.agentName}</strong> •{' '}
                  {selectedTask.modelUsed}
                </div>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#EBE5DB] dark:bg-[#382F47] cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Prompt */}
            <div className="p-3 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-1 text-xs">
              <span className="font-mono text-[10px] uppercase text-[#77717D] dark:text-[#AFA8B8]">
                Original Prompt:
              </span>
              <p className="text-[#211B2C] dark:text-[#F5F1E9]">{selectedTask.prompt}</p>
            </div>

            {/* Result Deliverable */}
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-[#77717D] dark:text-[#AFA8B8]">
                Agent Output Deliverable:
              </span>
              <div className="p-4 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs leading-relaxed whitespace-pre-wrap font-sans text-[#211B2C] dark:text-[#F5F1E9]">
                {selectedTask.result || 'No output recorded.'}
              </div>
            </div>

            {/* Grounding sources */}
            {selectedTask.groundingChunks && selectedTask.groundingChunks.length > 0 && (
              <div className="p-3 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 space-y-2 text-xs">
                <span className="font-bold text-[#06B6D4] flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Google Search Grounded Citations:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.groundingChunks.map((c, i) =>
                    c.web ? (
                      <a
                        key={i}
                        href={c.web.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-md bg-[#FFFEFC] dark:bg-[#2C2438] text-[11px] text-[#06B6D4] underline flex items-center gap-1"
                      >
                        <span>{c.web.title}</span>
                      </a>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
