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
} from 'lucide-react';

interface KanbanTask {
  id: string;
  title: string;
  assignee: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
}

export const ProjectsView: React.FC = () => {
  const { projects } = useApp();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'proj-1');

  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>([
    {
      id: 'kt-1',
      title: 'Configure Google Keep & OAuth Integration Scopes',
      assignee: 'Atlas (Workforce Manager)',
      status: 'done',
      priority: 'high',
      dueDate: '2026-11-08',
    },
    {
      id: 'kt-2',
      title: 'Synthesize Pakistani Logistics Market Benchmark',
      assignee: 'Scout (Research Agent)',
      status: 'done',
      priority: 'medium',
      dueDate: '2026-11-10',
    },
    {
      id: 'kt-3',
      title: 'Draft Enterprise Onboarding Guide & FAQ Portal',
      assignee: 'Echo (Customer Support Lead)',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-11-15',
    },
    {
      id: 'kt-4',
      title: 'Review ServerHub Cloud Invoice #SH-9082 Disbursal',
      assignee: 'Ledger (Finance Agent)',
      status: 'review',
      priority: 'high',
      dueDate: '2026-11-12',
    },
    {
      id: 'kt-5',
      title: 'Audit Smart Telemetry Beacon Low Stock Threshold',
      assignee: 'Stockwell (Inventory Agent)',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-11-20',
    },
  ]);

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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#8B5CF6]/15 text-[#8B5CF6]">
            Agile Project Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Projects & Sprint Kanban
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Directed by Chronos (Project Manager Agent). Drag and advance tasks across development stages.
          </p>
        </div>
      </div>

      {/* Project Selector Pills */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {projects.map((proj) => (
          <button
            key={proj.id}
            onClick={() => setSelectedProjectId(proj.id)}
            className={`p-4 rounded-xl border text-left min-w-[280px] transition-all cursor-pointer ${
              selectedProjectId === proj.id
                ? 'bg-[#FFFEFC] dark:bg-[#2C2438] border-[#8B5CF6] shadow-md ring-1 ring-[#8B5CF6]'
                : 'bg-[#FFFEFC]/60 dark:bg-[#211B2C] border-[#E2DBD0] dark:border-[#382F47]'
            }`}
          >
            <h3 className="font-bold text-xs text-[#211B2C] dark:text-[#F5F1E9] truncate">
              {proj.title}
            </h3>
            <div className="flex items-center justify-between text-[11px] text-[#77717D] dark:text-[#AFA8B8] mt-2 font-mono">
              <span>{proj.completedTasksCount} / {proj.tasksCount} Tasks</span>
              <span className="text-[#8B5CF6] font-bold">{proj.progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#EBE5DB] dark:bg-[#382F47] mt-1.5 overflow-hidden">
              <div
                className="h-full bg-[#8B5CF6] rounded-full"
                style={{ width: `${proj.progress}%` }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map((col) => {
          const tasksInCol = kanbanTasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm space-y-3 min-h-[380px]"
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

                    <div className="text-[10px] text-[#8B5CF6] font-mono font-medium">
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
    </div>
  );
};
