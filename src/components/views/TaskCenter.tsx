import React, { useState, useEffect } from 'react';
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
  WifiOff,
  Database,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Plus,
  Check,
} from 'lucide-react';
import { getCachedTasksForOrg, OfflineTaskRecord } from '../../lib/indexedDbService.ts';
import { syncEngine, SyncEngineStatus } from '../../lib/syncEngine.ts';
import { ContextualDetailDrawer } from '../common/ContextualDetailDrawer.tsx';

export const TaskCenter: React.FC = () => {
  const { tasks: appTasks, currentOrg, updateTask, user, setBannerMessage } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [cachedTasks, setCachedTasks] = useState<OfflineTaskRecord[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncEngineStatus>(syncEngine.getStatus());

  const loadCachedTasks = async () => {
    try {
      const records = await getCachedTasksForOrg(currentOrg.id);
      setCachedTasks(records);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadCachedTasks();
    const unsub = syncEngine.subscribe((status) => {
      setSyncStatus(status);
      loadCachedTasks();
    });
    return unsub;
  }, [currentOrg.id]);

  // Combine and deduplicate tasks (indexedDB cached tasks override or supplement memory tasks)
  const taskMap = new Map<string, any>();
  for (const t of appTasks) {
    taskMap.set(t.id, t);
  }
  for (const ct of cachedTasks) {
    taskMap.set(ct.id, {
      ...taskMap.get(ct.id),
      ...ct,
    });
  }
  const mergedTasks = Array.from(taskMap.values());

  const filteredTasks = mergedTasks.filter((t) => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchSearch =
      (t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.agentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.prompt || '').toLowerCase().includes(searchTerm.toLowerCase());
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
                  <td className="px-5 py-4 font-semibold text-[#211B2C] dark:text-[#F5F1E9] max-w-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">{t.title}</span>
                      {t.syncStatus === 'pending_create' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#FFF8E7] dark:bg-[#2A2315] text-[#8A6A1C] dark:text-[#E8C56B] border border-[#F3E2B8] shrink-0">
                          Offline Draft
                        </span>
                      )}
                      {t.syncStatus === 'conflict' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#FF806E]/20 text-[#FF806E] border border-[#FF806E]/30 font-bold shrink-0">
                          Conflict
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#8B5CF6] font-semibold">{t.agentName}</td>
                  <td className="px-5 py-4 uppercase font-mono text-[10px]">{t.priority}</td>
                  <td className="px-5 py-4 font-mono text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                    {t.localDraft ? 'Pending Server Sync' : t.modelUsed || 'gemini-3.8-flash'}
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

      {/* Slide-Over Contextual Detail Drawer */}
      <ContextualDetailDrawer
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.title || 'Task Details'}
        badge={selectedTask?.status?.replace('_', ' ').toUpperCase()}
      >
        {selectedTask && (
          <div className="space-y-6">
            {/* Status Transition Control */}
            <div className="p-3.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#77717D]">Status Transition:</span>
                <select
                  value={selectedTask.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as any;
                    updateTask(selectedTask.id, { status: newStatus });
                    setSelectedTask({ ...selectedTask, status: newStatus });
                    setBannerMessage({
                      title: `Task status updated to ${newStatus.replace('_', ' ')}`,
                      type: 'success',
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs font-semibold text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="queued">Queued</option>
                  <option value="planning">Planning</option>
                  <option value="running">Running</option>
                  <option value="needs_approval">Needs Approval</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#77717D]">Assigned Employee:</span>
                <span className="font-bold text-[#8B5CF6]">{selectedTask.agentName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#77717D]">Priority:</span>
                <span className="font-mono uppercase font-bold text-[#211B2C] dark:text-[#F5F1E9]">
                  {selectedTask.priority}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#77717D]">Model / Telemetry:</span>
                <span className="font-mono text-[11px] text-[#77717D]">
                  {selectedTask.modelUsed || 'gemini-3.8-flash'}
                </span>
              </div>
            </div>

            {/* Prompt */}
            <div className="space-y-1.5">
              <span className="font-mono text-[10px] uppercase text-[#77717D] dark:text-[#AFA8B8]">
                Original Directive:
              </span>
              <div className="p-3 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] whitespace-pre-wrap">
                {selectedTask.prompt}
              </div>
            </div>

            {/* Result Deliverable */}
            <div className="space-y-1.5">
              <span className="font-mono text-[10px] uppercase text-[#77717D] dark:text-[#AFA8B8]">
                Agent Output Deliverable:
              </span>
              <div className="p-4 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs leading-relaxed whitespace-pre-wrap font-sans text-[#211B2C] dark:text-[#F5F1E9]">
                {selectedTask.result || 'Execution ongoing or pending.'}
              </div>
            </div>

            {/* Subtasks Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#211B2C] dark:text-[#F5F1E9]">Subtasks Checklist</h4>
                <span className="text-xs font-mono text-[#77717D]">
                  {(selectedTask.subtasks || []).filter((s: any) => s.completed).length}/
                  {(selectedTask.subtasks || []).length}
                </span>
              </div>

              <div className="space-y-2">
                {(selectedTask.subtasks || []).map((st: any) => (
                  <div
                    key={st.id}
                    onClick={() => {
                      const updated = (selectedTask.subtasks || []).map((item: any) =>
                        item.id === st.id ? { ...item, completed: !item.completed } : item
                      );
                      updateTask(selectedTask.id, { subtasks: updated });
                      setSelectedTask({ ...selectedTask, subtasks: updated });
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-[#F5F1E9]/60 dark:bg-[#211B2C]/60 border border-[#E2DBD0] dark:border-[#382F47] cursor-pointer hover:border-[#8B5CF6]"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => {}}
                      className="cursor-pointer"
                    />
                    <span
                      className={`text-xs ${
                        st.completed ? 'line-through text-[#77717D]' : 'text-[#211B2C] dark:text-[#F5F1E9]'
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Subtask */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add actionable subtask..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                />
                <button
                  onClick={() => {
                    if (!newSubtaskTitle.trim()) return;
                    const updated = [
                      ...(selectedTask.subtasks || []),
                      { id: `sub-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false },
                    ];
                    updateTask(selectedTask.id, { subtasks: updated });
                    setSelectedTask({ ...selectedTask, subtasks: updated });
                    setNewSubtaskTitle('');
                  }}
                  disabled={!newSubtaskTitle.trim()}
                  className="px-3 py-1.5 rounded-xl bg-[#8B5CF6] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Comments Thread */}
            <div className="space-y-3 pt-2 border-t border-[#E2DBD0] dark:border-[#382F47]">
              <h4 className="text-xs font-bold text-[#211B2C] dark:text-[#F5F1E9] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>Task Comments & Activity ({(selectedTask.comments || []).length})</span>
              </h4>

              <div className="space-y-2 max-h-44 overflow-y-auto">
                {(selectedTask.comments || []).map((comm: any) => (
                  <div
                    key={comm.id}
                    className="p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#77717D]">
                      <span className="font-bold text-[#211B2C] dark:text-[#F5F1E9]">{comm.author}</span>
                      <span className="font-mono">{new Date(comm.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-[#211B2C] dark:text-[#F5F1E9]">{comm.content}</p>
                  </div>
                ))}
              </div>

              {/* Post Comment Input */}
              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Add comment, feedback or review note..."
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                />
                <button
                  onClick={() => {
                    if (!newCommentText.trim()) return;
                    const updated = [
                      ...(selectedTask.comments || []),
                      {
                        id: `comm-${Date.now()}`,
                        author: user?.displayName || 'User',
                        role: user?.role || 'Member',
                        content: newCommentText.trim(),
                        createdAt: new Date().toISOString(),
                      },
                    ];
                    updateTask(selectedTask.id, { comments: updated });
                    setSelectedTask({ ...selectedTask, comments: updated });
                    setNewCommentText('');
                  }}
                  disabled={!newCommentText.trim()}
                  className="w-full py-1.5 rounded-xl bg-[#8B5CF6] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Post Comment
                </button>
              </div>
            </div>

            {/* Citations */}
            {selectedTask.groundingChunks && selectedTask.groundingChunks.length > 0 && (
              <div className="p-3 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 space-y-2 text-xs">
                <span className="font-bold text-[#06B6D4] flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Google Search Grounded Citations:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.groundingChunks.map((c: any, i: number) =>
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

            {/* Conflict Resolution Controls */}
            {selectedTask.syncStatus === 'conflict' && (
              <div className="p-3.5 rounded-xl bg-[#FFF8E7] dark:bg-[#2A2315] border border-[#F3E2B8] dark:border-[#4D3F20] space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#8A6A1C] dark:text-[#E8C56B]">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Synchronization Conflict Detected</span>
                </div>
                <p className="text-[11px] text-[#8A6A1C] dark:text-[#E8C56B]">
                  This task was modified offline while the server had a newer state. Choose how to reconcile this record:
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={async () => {
                      await syncEngine.resolveConflict(selectedTask.id, 'keep_local');
                      setSelectedTask(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#8B5CF6] text-white text-xs font-bold hover:bg-[#7C3AED] cursor-pointer shadow-sm"
                  >
                    Force Overwrite (Keep Local)
                  </button>
                  <button
                    onClick={async () => {
                      await syncEngine.resolveConflict(selectedTask.id, 'accept_server');
                      setSelectedTask(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#EBE5DB] dark:bg-[#382F47] text-xs font-semibold hover:opacity-90 cursor-pointer"
                  >
                    Accept Server Version
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </ContextualDetailDrawer>
    </div>
  );
};
