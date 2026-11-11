import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  FolderKanban,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  LayoutList,
  Columns3,
  GitCommit,
  TrendingUp,
  AlertTriangle,
  Bot,
  Check,
} from 'lucide-react';
import { TEAMORA_AGENTS } from '../../data/agents.ts';

interface KanbanTask {
  id: string;
  projectId: string;
  title: string;
  assignee: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
}

type ProjectViewMode = 'kanban' | 'list' | 'timeline';

export const ProjectsView: React.FC = () => {
  const { projects, setBannerMessage } = useApp();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'proj-1');
  const [viewMode, setViewMode] = useState<ProjectViewMode>('kanban');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState(TEAMORA_AGENTS[0]?.name || 'Atlas');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-11-25');
  const [isRebalanced, setIsRebalanced] = useState(false);

  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>([
    {
      id: 'kt-1',
      projectId: 'proj-1',
      title: 'Configure Google Keep & OAuth Integration Scopes',
      assignee: 'Atlas (Workforce Manager)',
      status: 'done',
      priority: 'high',
      dueDate: '2026-11-08',
    },
    {
      id: 'kt-2',
      projectId: 'proj-1',
      title: 'Synthesize Pakistani Logistics Market Benchmark',
      assignee: 'Scout (Research Agent)',
      status: 'done',
      priority: 'medium',
      dueDate: '2026-11-10',
    },
    {
      id: 'kt-3',
      projectId: 'proj-1',
      title: 'Draft Enterprise Onboarding Guide & FAQ Portal',
      assignee: 'Echo (Customer Support Lead)',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-11-15',
    },
    {
      id: 'kt-4',
      projectId: 'proj-2',
      title: 'Review ServerHub Cloud Invoice #SH-9082 Disbursal',
      assignee: 'Ledger (Finance Agent)',
      status: 'review',
      priority: 'high',
      dueDate: '2026-11-12',
    },
    {
      id: 'kt-5',
      projectId: 'proj-2',
      title: 'Audit Smart Telemetry Beacon Low Stock Threshold',
      assignee: 'Stockwell (Inventory Agent)',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-11-20',
    },
    {
      id: 'kt-6',
      projectId: 'proj-3',
      title: 'Design Anti-Slop Component Layout Standards',
      assignee: 'Aura (Brand Strategist)',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-11-18',
    },
  ]);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const columns: Array<{ id: KanbanTask['status']; label: string; color: string }> = [
    { id: 'todo', label: 'To Do', color: 'border-l-4 border-slate-400' },
    { id: 'in_progress', label: 'In Progress', color: 'border-l-4 border-[#8B5CF6]' },
    { id: 'review', label: 'Review & Approvals', color: 'border-l-4 border-[#FF806E]' },
    { id: 'done', label: 'Done', color: 'border-l-4 border-[#10B981]' },
  ];

  const moveTask = (taskId: string, newStatus: KanbanTask['status']) => {
    setKanbanTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: KanbanTask = {
      id: `kt-${Date.now()}`,
      projectId: selectedProjectId,
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee,
      status: 'todo',
      priority: newTaskPriority,
      dueDate: newTaskDueDate,
    };

    setKanbanTasks((prev) => [...prev, newTask]);
    setNewTaskTitle('');
    setIsAddingTask(false);
    setBannerMessage({
      title: `Task "${newTask.title}" added to project`,
      type: 'success',
    });
  };

  const handleApplyRebalance = () => {
    setKanbanTasks((prev) =>
      prev.map((t) =>
        t.id === 'kt-5' ? { ...t, assignee: 'Chronos (Project Manager)' } : t
      )
    );
    setIsRebalanced(true);
    setBannerMessage({
      title: 'Workload rebalanced across workforce successfully',
      type: 'success',
    });
  };

  const projectTasks = kanbanTasks.filter((t) => t.projectId === selectedProjectId);

  // Compute dynamic health status
  const getProjectHealth = (proj: typeof activeProject) => {
    if (!proj) return { label: 'Planning', color: 'text-slate-500 bg-slate-500/10' };
    if (proj.progress >= 70) return { label: 'On Track', color: 'text-[#10B981] bg-[#10B981]/15' };
    if (proj.progress >= 35) return { label: 'In Flight', color: 'text-[#8B5CF6] bg-[#8B5CF6]/15' };
    return { label: 'Needs Focus', color: 'text-[#FF806E] bg-[#FF806E]/15' };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2DBD0] dark:border-[#382F47]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#211B2C] dark:text-[#F5F1E9]">
              Project Portfolio & Work Management
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#8B5CF6]/15 text-[#8B5CF6]">
              Phases 234–237
            </span>
          </div>
          <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] mt-1">
            Directed by Chronos (Project Manager Agent). Multi-view Kanban, milestone tracking, and autonomous workload balancing.
          </p>
        </div>

        {/* View Switchers & Add Task */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-[#EBE5DB]/60 dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47]">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-[#FFFEFC] dark:bg-[#211B2C] text-[#8B5CF6] shadow-xs'
                  : 'text-[#77717D] hover:text-[#211B2C]'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-[#FFFEFC] dark:bg-[#211B2C] text-[#8B5CF6] shadow-xs'
                  : 'text-[#77717D] hover:text-[#211B2C]'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-[#FFFEFC] dark:bg-[#211B2C] text-[#8B5CF6] shadow-xs'
                  : 'text-[#77717D] hover:text-[#211B2C]'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          <button
            onClick={() => setIsAddingTask(true)}
            className="px-3 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Workload Balancing Suggestion Banner (Phase 237) */}
      {!isRebalanced && (
        <div className="p-4 rounded-2xl bg-[#C7F36B]/15 border border-[#C7F36B]/40 dark:border-[#C7F36B]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#8B5CF6] shrink-0" />
            <div>
              <span className="font-bold text-[#211B2C] dark:text-[#F5F1E9]">
                Chronos AI Workload Optimization:
              </span>{' '}
              <span className="text-[#77717D] dark:text-[#AFA8B8]">
                Stockwell currently has heavy SKU auditing load. Suggest reassigning "Audit Smart Telemetry Beacon" to Chronos for 24% faster milestone completion.
              </span>
            </div>
          </div>
          <button
            onClick={handleApplyRebalance}
            className="px-3 py-1.5 rounded-xl bg-[#211B2C] dark:bg-[#F5F1E9] text-[#F5F1E9] dark:text-[#211B2C] font-bold text-xs shrink-0 cursor-pointer hover:opacity-90"
          >
            Apply Rebalance
          </button>
        </div>
      )}

      {/* Project Selector Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map((proj) => {
          const health = getProjectHealth(proj);
          const isSelected = selectedProjectId === proj.id;
          return (
            <div
              key={proj.id}
              onClick={() => setSelectedProjectId(proj.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-3 ${
                isSelected
                  ? 'bg-[#FFFEFC] dark:bg-[#2C2438] border-[#8B5CF6] shadow-sm ring-1 ring-[#8B5CF6]'
                  : 'bg-[#FFFEFC]/60 dark:bg-[#211B2C] border-[#E2DBD0] dark:border-[#382F47] hover:border-[#8B5CF6]/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-xs text-[#211B2C] dark:text-[#F5F1E9] line-clamp-1">
                  {proj.title}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${health.color}`}>
                  {health.label}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#77717D] dark:text-[#AFA8B8] font-mono">
                <span>{proj.completedTasksCount} / {proj.tasksCount} Tasks</span>
                <span className="text-[#8B5CF6] font-bold">{proj.progress}%</span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-[#EBE5DB] dark:bg-[#382F47] overflow-hidden">
                <div
                  className="h-full bg-[#8B5CF6] rounded-full transition-all duration-300"
                  style={{ width: `${proj.progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Active View Rendering */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const tasksInCol = projectTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs space-y-3 min-h-[400px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#E2DBD0] dark:border-[#382F47]">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#211B2C] dark:text-[#F5F1E9]">
                    {col.label}
                  </span>
                  <span className="w-5 h-5 rounded-full bg-[#F5F1E9] dark:bg-[#2C2438] text-[10px] font-mono font-bold flex items-center justify-center">
                    {tasksInCol.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {tasksInCol.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs space-y-2 text-xs ${col.color}`}
                    >
                      <div className="font-semibold text-[#211B2C] dark:text-[#F5F1E9] leading-snug">
                        {task.title}
                      </div>

                      <div className="text-[10px] text-[#8B5CF6] font-mono font-medium truncate">
                        Assignee: {task.assignee}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#77717D] dark:text-[#AFA8B8] font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {task.dueDate}
                        </span>
                        <span className="uppercase font-bold text-[#FF806E]">
                          {task.priority}
                        </span>
                      </div>

                      {/* Quick Move Buttons */}
                      <div className="pt-2 border-t border-[#E2DBD0] dark:border-[#382F47] flex justify-end gap-1">
                        {col.id !== 'todo' && (
                          <button
                            onClick={() =>
                              moveTask(
                                task.id,
                                col.id === 'done'
                                  ? 'review'
                                  : col.id === 'review'
                                  ? 'in_progress'
                                  : 'todo'
                              )
                            }
                            className="px-2 py-0.5 rounded bg-[#EBE5DB] dark:bg-[#382F47] text-[10px] font-mono hover:text-[#8B5CF6] cursor-pointer"
                          >
                            ← Prev
                          </button>
                        )}
                        {col.id !== 'done' && (
                          <button
                            onClick={() =>
                              moveTask(
                                task.id,
                                col.id === 'todo'
                                  ? 'in_progress'
                                  : col.id === 'in_progress'
                                  ? 'review'
                                  : 'done'
                              )
                            }
                            className="px-2 py-0.5 rounded bg-[#8B5CF6] text-white text-[10px] font-mono font-bold cursor-pointer hover:bg-[#7C3AED]"
                          >
                            Next →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F1E9] dark:bg-[#2C2438] border-b border-[#E2DBD0] dark:border-[#382F47] text-[#77717D] dark:text-[#AFA8B8] font-mono uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Task Description</th>
                  <th className="px-5 py-3.5">Assigned Employee</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DBD0] dark:divide-[#382F47]">
                {projectTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F5F1E9]/60 dark:hover:bg-[#2C2438]/50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="capitalize font-mono text-[10px] px-2 py-0.5 rounded bg-[#8B5CF6]/15 text-[#8B5CF6] font-bold">
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#211B2C] dark:text-[#F5F1E9]">
                      {t.title}
                    </td>
                    <td className="px-5 py-3.5 text-[#8B5CF6] font-medium font-mono">
                      {t.assignee}
                    </td>
                    <td className="px-5 py-3.5 font-mono uppercase text-[10px]">
                      {t.priority}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-[#77717D]">
                      {t.dueDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="p-6 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">
              Sprint Roadmap & Milestone Horizon
            </h3>
            <span className="text-xs font-mono text-[#77717D]">Deadline: {activeProject.deadline}</span>
          </div>

          <div className="space-y-4">
            {projectTasks.map((task, idx) => (
              <div key={task.id} className="flex items-center gap-4 text-xs">
                <div className="w-24 text-[10px] font-mono text-[#77717D] shrink-0">
                  {task.dueDate}
                </div>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 ${
                      task.status === 'done'
                        ? 'bg-[#10B981] border-[#10B981]'
                        : task.status === 'in_progress'
                        ? 'bg-[#8B5CF6] border-[#8B5CF6]'
                        : 'border-[#77717D]/60'
                    }`}
                  />
                  {idx < projectTasks.length - 1 && (
                    <div className="w-0.5 h-8 bg-[#E2DBD0] dark:bg-[#382F47]" />
                  )}
                </div>
                <div className="flex-1 p-3 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] flex items-center justify-between">
                  <span className="font-semibold text-[#211B2C] dark:text-[#F5F1E9] truncate">
                    {task.title}
                  </span>
                  <span className="text-[10px] font-mono text-[#8B5CF6] shrink-0 font-medium ml-2">
                    {task.assignee}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-heading font-bold text-base text-[#211B2C] dark:text-[#F5F1E9]">
              Add New Project Task
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#77717D] mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Audit API authentication latency..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#77717D] mb-1">
                  Assignee
                </label>
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                >
                  {TEAMORA_AGENTS.map((agent) => (
                    <option key={agent.id} value={`${agent.name} (${agent.role})`}>
                      {agent.name} — {agent.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#77717D] mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#77717D] mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-4 py-2 rounded-xl border border-[#E2DBD0] dark:border-[#382F47] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#8B5CF6] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
