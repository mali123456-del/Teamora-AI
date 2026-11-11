import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Inbox,
  CheckCircle2,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Search,
  Filter,
  Check,
  ChevronRight,
  MessageSquare,
  Sparkles,
  ListTodo,
  Calendar,
  User,
  ArrowRight,
  XCircle,
} from 'lucide-react';
import { ContextualDetailDrawer } from '../common/ContextualDetailDrawer.tsx';
import { AgentTask, ApprovalRequest } from '../../types/index.ts';

type InboxTab = 'all' | 'tasks' | 'approvals' | 'alerts';

export const PersonalInboxView: React.FC = () => {
  const {
    tasks,
    updateTask,
    approvals,
    executeApproval,
    resolveApproval,
    currentOrg,
    user,
    setBannerMessage,
    setActiveTab,
  } = useApp();

  const [activeInboxTab, setActiveInboxTab] = useState<InboxTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState<AgentTask | null>(null);
  const [selectedApprovalForDrawer, setSelectedApprovalForDrawer] = useState<ApprovalRequest | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Derived metrics
  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const myTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  const urgentItemsCount = myTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high').length + pendingApprovals.length;
  const completedTodayCount = tasks.filter((t) => t.status === 'completed').length;

  const handleToggleTaskStatus = (task: AgentTask) => {
    const nextStatus = task.status === 'completed' ? 'queued' : 'completed';
    updateTask(task.id, { status: nextStatus });
    setBannerMessage({
      title: nextStatus === 'completed' ? `Completed "${task.title}"` : `Reopened "${task.title}"`,
      type: 'success',
    });
  };

  const handleApprove = async (approvalId: string) => {
    const result = await executeApproval(approvalId);
    if (result.success) {
      setBannerMessage({
        title: 'Action successfully verified & executed',
        type: 'success',
      });
      if (selectedApprovalForDrawer?.id === approvalId) {
        setSelectedApprovalForDrawer(null);
      }
    }
  };

  const handleReject = async (approvalId: string) => {
    await resolveApproval(approvalId, 'rejected', 'Rejected by user from Personal Inbox');
    setBannerMessage({
      title: 'Action proposal rejected',
      type: 'info',
    });
    if (selectedApprovalForDrawer?.id === approvalId) {
      setSelectedApprovalForDrawer(null);
    }
  };

  const handleAddComment = (taskId: string) => {
    if (!newCommentText.trim() || !selectedTaskForDrawer) return;
    const existingComments = selectedTaskForDrawer.comments || [];
    const newComment = {
      id: `comm-${Date.now()}`,
      author: user?.displayName || 'User',
      role: user?.role || 'Member',
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };
    const updatedComments = [...existingComments, newComment];
    updateTask(taskId, { comments: updatedComments });
    setSelectedTaskForDrawer({
      ...selectedTaskForDrawer,
      comments: updatedComments,
    });
    setNewCommentText('');
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    if (!selectedTaskForDrawer) return;
    const subtasks = selectedTaskForDrawer.subtasks || [];
    const updated = subtasks.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st));
    updateTask(taskId, { subtasks: updated });
    setSelectedTaskForDrawer({
      ...selectedTaskForDrawer,
      subtasks: updated,
    });
  };

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskTitle.trim() || !selectedTaskForDrawer) return;
    const subtasks = selectedTaskForDrawer.subtasks || [];
    const newSubtask = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    const updated = [...subtasks, newSubtask];
    updateTask(taskId, { subtasks: updated });
    setSelectedTaskForDrawer({
      ...selectedTaskForDrawer,
      subtasks: updated,
    });
    setNewSubtaskTitle('');
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.agentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const filteredApprovals = pendingApprovals.filter((a) => {
    return (
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.agentName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2DBD0] dark:border-[#382F47]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#211B2C] dark:text-[#F5F1E9]">
              Personal Work Inbox
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#8B5CF6]/15 text-[#8B5CF6]">
              {currentOrg.name}
            </span>
          </div>
          <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] mt-1">
            Unified personal action items, agent task handoffs, and pending human-in-the-loop approvals.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-[#77717D]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF806E]" />
            <span className="font-semibold text-[#FF806E]">{urgentItemsCount}</span> Urgent
          </div>
          <span aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            <span className="font-semibold text-[#211B2C] dark:text-[#F5F1E9]">{myTasks.length}</span> Active Tasks
          </div>
          <span aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="font-semibold text-[#10B981]">{completedTodayCount}</span> Done
          </div>
        </div>
      </div>

      {/* Navigation Tabs and Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Segmented Filter Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EBE5DB]/60 dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47]">
          <button
            onClick={() => setActiveInboxTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              activeInboxTab === 'all'
                ? 'bg-[#FFFEFC] dark:bg-[#211B2C] text-[#211B2C] dark:text-[#F5F1E9] font-bold shadow-xs'
                : 'text-[#77717D] dark:text-[#AFA8B8] hover:text-[#211B2C]'
            }`}
          >
            All Action Items
          </button>
          <button
            onClick={() => setActiveInboxTab('tasks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeInboxTab === 'tasks'
                ? 'bg-[#FFFEFC] dark:bg-[#211B2C] text-[#211B2C] dark:text-[#F5F1E9] font-bold shadow-xs'
                : 'text-[#77717D] dark:text-[#AFA8B8] hover:text-[#211B2C]'
            }`}
          >
            <span>My Tasks</span>
            <span className="text-[10px] font-mono px-1 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] font-bold">
              {myTasks.length}
            </span>
          </button>
          <button
            onClick={() => setActiveInboxTab('approvals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeInboxTab === 'approvals'
                ? 'bg-[#FFFEFC] dark:bg-[#211B2C] text-[#211B2C] dark:text-[#F5F1E9] font-bold shadow-xs'
                : 'text-[#77717D] dark:text-[#AFA8B8] hover:text-[#211B2C]'
            }`}
          >
            <span>Approval Gates</span>
            {pendingApprovals.length > 0 && (
              <span className="text-[10px] font-mono px-1 rounded bg-[#FF806E] text-white font-bold">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        </div>

        {/* Search and Priority Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#77717D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search items or agents..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Main Inbox Feed */}
      <div className="space-y-4">
        {/* Approvals Section if in 'all' or 'approvals' tab */}
        {(activeInboxTab === 'all' || activeInboxTab === 'approvals') && filteredApprovals.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#FF806E]">
              <ShieldAlert className="w-4 h-4" />
              <span>Pending Human Approvals ({filteredApprovals.length})</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredApprovals.map((appr) => (
                <div
                  key={appr.id}
                  className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#FF806E]/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-[#FF806E]"
                >
                  <div
                    onClick={() => setSelectedApprovalForDrawer(appr)}
                    className="space-y-1 cursor-pointer flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#211B2C] dark:text-[#F5F1E9] hover:text-[#8B5CF6]">
                        {appr.title}
                      </span>
                      <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-[#FF806E]/15 text-[#FF806E] font-bold uppercase">
                        {appr.actionType.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] line-clamp-1">
                      {appr.consequences}
                    </p>
                    <div className="text-[10px] text-[#77717D] flex items-center gap-2 font-mono">
                      <span>Agent: {appr.agentName}</span>
                      <span aria-hidden="true">·</span>
                      <span>Requested: {new Date(appr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReject(appr.id)}
                      className="px-3 py-1.5 rounded-xl border border-[#E2DBD0] dark:border-[#382F47] hover:bg-[#EBE5DB] text-xs font-semibold text-[#77717D] cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(appr.id)}
                      className="px-4 py-1.5 rounded-xl bg-[#FF806E] hover:bg-[#E06755] text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Authorize Action
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks Section if in 'all' or 'tasks' tab */}
        {(activeInboxTab === 'all' || activeInboxTab === 'tasks') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#211B2C] dark:text-[#F5F1E9]">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-[#8B5CF6]" />
                <span>Task Stream & Directives ({filteredTasks.length})</span>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#77717D] space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto opacity-70" />
                <p className="font-semibold text-sm">Inbox is completely clear</p>
                <p>No active tasks matching your filter criteria.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E2DBD0] dark:divide-[#382F47] rounded-2xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs overflow-hidden">
                {filteredTasks.map((task) => {
                  const completedSubtasksCount = task.subtasks?.filter((s) => s.completed).length || 0;
                  const totalSubtasksCount = task.subtasks?.length || 0;

                  return (
                    <div
                      key={task.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-[#F5F1E9]/40 dark:hover:bg-[#211B2C]/40 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                            task.status === 'completed'
                              ? 'bg-[#10B981] border-[#10B981] text-white'
                              : 'border-[#77717D]/40 hover:border-[#8B5CF6]'
                          }`}
                        >
                          {task.status === 'completed' && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <div
                          onClick={() => setSelectedTaskForDrawer(task)}
                          className="space-y-1 min-w-0 flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-semibold ${
                                task.status === 'completed'
                                  ? 'line-through text-[#77717D]'
                                  : 'text-[#211B2C] dark:text-[#F5F1E9]'
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.priority === 'urgent' && (
                              <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-[#FF806E]/15 text-[#FF806E] font-bold uppercase">
                                Urgent
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] flex items-center gap-2 font-mono flex-wrap">
                            <span>Agent: {task.agentName}</span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">{task.status.replace('_', ' ')}</span>
                            {totalSubtasksCount > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>
                                  {completedSubtasksCount}/{totalSubtasksCount} subtasks
                                </span>
                              </>
                            )}
                            {task.comments && task.comments.length > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {task.comments.length}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedTaskForDrawer(task)}
                        className="p-1.5 rounded-lg text-[#77717D] hover:text-[#8B5CF6] hover:bg-[#EBE5DB] dark:hover:bg-[#211B2C] cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide-Over Contextual Detail Drawer for Tasks */}
      <ContextualDetailDrawer
        isOpen={Boolean(selectedTaskForDrawer)}
        onClose={() => setSelectedTaskForDrawer(null)}
        title={selectedTaskForDrawer?.title || 'Task Details'}
        badge={selectedTaskForDrawer?.status.replace('_', ' ').toUpperCase()}
      >
        {selectedTaskForDrawer && (
          <div className="space-y-6">
            {/* Status & Assignment metadata */}
            <div className="p-3.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#77717D]">Assigned Employee:</span>
                <span className="font-bold text-[#8B5CF6]">{selectedTaskForDrawer.agentName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#77717D]">Priority Level:</span>
                <span className="font-mono uppercase font-bold text-[#211B2C] dark:text-[#F5F1E9]">
                  {selectedTaskForDrawer.priority}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#77717D]">Created At:</span>
                <span className="font-mono text-[11px] text-[#77717D]">
                  {new Date(selectedTaskForDrawer.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Prompt */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-mono uppercase text-[#77717D]">Instruction Prompt:</h4>
              <div className="p-3 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] whitespace-pre-wrap">
                {selectedTaskForDrawer.prompt}
              </div>
            </div>

            {/* Subtasks Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#211B2C] dark:text-[#F5F1E9]">Subtasks Checklist</h4>
                <span className="text-xs font-mono text-[#77717D]">
                  {(selectedTaskForDrawer.subtasks || []).filter((s) => s.completed).length}/
                  {(selectedTaskForDrawer.subtasks || []).length}
                </span>
              </div>

              <div className="space-y-2">
                {(selectedTaskForDrawer.subtasks || []).map((subtask) => (
                  <div
                    key={subtask.id}
                    onClick={() => handleToggleSubtask(selectedTaskForDrawer.id, subtask.id)}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-[#F5F1E9]/60 dark:bg-[#211B2C]/60 border border-[#E2DBD0] dark:border-[#382F47] cursor-pointer hover:border-[#8B5CF6]"
                  >
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => {}}
                      className="cursor-pointer"
                    />
                    <span
                      className={`text-xs ${
                        subtask.completed ? 'line-through text-[#77717D]' : 'text-[#211B2C] dark:text-[#F5F1E9]'
                      }`}
                    >
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Subtask Form */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a new subtask..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                />
                <button
                  onClick={() => handleAddSubtask(selectedTaskForDrawer.id)}
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
                <span>Collaboration Comments ({(selectedTaskForDrawer.comments || []).length})</span>
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(selectedTaskForDrawer.comments || []).map((comm) => (
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

              {/* Add Comment */}
              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Post comment or handoff directive..."
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                />
                <button
                  onClick={() => handleAddComment(selectedTaskForDrawer.id)}
                  disabled={!newCommentText.trim()}
                  className="w-full py-1.5 rounded-xl bg-[#8B5CF6] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        )}
      </ContextualDetailDrawer>

      {/* Slide-Over Drawer for Approvals */}
      <ContextualDetailDrawer
        isOpen={Boolean(selectedApprovalForDrawer)}
        onClose={() => setSelectedApprovalForDrawer(null)}
        title={selectedApprovalForDrawer?.title || 'Approval Request'}
        badge="HUMAN-IN-THE-LOOP"
      >
        {selectedApprovalForDrawer && (
          <div className="space-y-5">
            <div className="p-3.5 rounded-xl bg-[#FF806E]/10 border border-[#FF806E]/30 space-y-2 text-xs">
              <div className="font-bold text-[#FF806E] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Executive Consequence Warning</span>
              </div>
              <p className="text-[#211B2C] dark:text-[#F5F1E9] leading-relaxed">
                {selectedApprovalForDrawer.consequences}
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-mono uppercase text-[#77717D]">Proposed Payload:</h4>
              <pre className="p-3 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-[11px] font-mono text-[#211B2C] dark:text-[#F5F1E9] overflow-x-auto">
                {JSON.stringify(selectedApprovalForDrawer.payloadSummary, null, 2)}
              </pre>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={() => handleReject(selectedApprovalForDrawer.id)}
                className="flex-1 py-2 rounded-xl border border-[#E2DBD0] dark:border-[#382F47] hover:bg-[#EBE5DB] text-xs font-semibold text-[#77717D] cursor-pointer"
              >
                Reject Request
              </button>
              <button
                onClick={() => handleApprove(selectedApprovalForDrawer.id)}
                className="flex-1 py-2 rounded-xl bg-[#FF806E] hover:bg-[#E06755] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Authorize Action
              </button>
            </div>
          </div>
        )}
      </ContextualDetailDrawer>
    </div>
  );
};
