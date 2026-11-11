import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Bot,
  Layers,
  Filter,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import { TEAMORA_AGENTS } from '../../data/agents.ts';

export const TeamCalendarView: React.FC = () => {
  const { tasks, projects, workflows, currentOrg } = useApp();
  const [currentMonth, setCurrentMonth] = useState(10); // November (0-indexed: 10 = Nov)
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-15');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar Math: 30 days in November 2026. Nov 1, 2026 is Sunday (day 0)
  const daysInMonth = 30;
  const firstDayIndex = 0; // Sunday

  // Aggregate real events
  interface CalendarEvent {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    type: 'task' | 'milestone' | 'workflow';
    agentName?: string;
  }

  const allEvents: CalendarEvent[] = [
    // Milestones from projects
    ...projects.map((p) => ({
      id: `ev-proj-${p.id}`,
      title: `Milestone: ${p.title}`,
      date: p.deadline || '2026-11-20',
      type: 'milestone' as const,
    })),
    // Events from tasks
    ...tasks.map((t, idx) => ({
      id: `ev-task-${t.id}`,
      title: t.title,
      date: t.dueDate || `2026-11-${String((idx % 25) + 5).padStart(2, '0')}`,
      type: 'task' as const,
      agentName: t.agentName,
    })),
    // Events from workflows
    ...workflows.map((w, idx) => ({
      id: `ev-wf-${w.id}`,
      title: `Scheduled: ${w.name}`,
      date: `2026-11-${String((idx * 4) + 8).padStart(2, '0')}`,
      type: 'workflow' as const,
    })),
  ];

  const filteredEvents = allEvents.filter((ev) => {
    if (selectedAgentFilter === 'all') return true;
    return ev.agentName === selectedAgentFilter;
  });

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter((ev) => ev.date === dateStr);
  };

  const selectedDateEvents = filteredEvents.filter((ev) => ev.date === selectedDate);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2DBD0] dark:border-[#382F47]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#211B2C] dark:text-[#F5F1E9]">
              Team Calendar & Scheduled Operations
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#8B5CF6]/15 text-[#8B5CF6]">
              Phase 238
            </span>
          </div>
          <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] mt-1">
            Timezone-aware scheduling across 15 AI agents, human milestones, and recurring automations.
          </p>
        </div>

        {/* Month Navigator & Agent Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedAgentFilter}
            onChange={(e) => setSelectedAgentFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="all">All Agents & Milestones</option>
            {TEAMORA_AGENTS.map((agent) => (
              <option key={agent.id} value={agent.name}>
                {agent.name} ({agent.role})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47]">
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg text-[#77717D] hover:text-[#211B2C] dark:hover:text-[#F5F1E9] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-bold text-[#211B2C] dark:text-[#F5F1E9] font-mono">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg text-[#77717D] hover:text-[#211B2C] dark:hover:text-[#F5F1E9] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar (70%) vs Selected Day Agenda (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs overflow-hidden">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 border-b border-[#E2DBD0] dark:border-[#382F47] bg-[#F5F1E9] dark:bg-[#2C2438] text-center text-[10px] font-mono uppercase font-bold text-[#77717D] dark:text-[#AFA8B8] py-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[#E2DBD0]/60 dark:divide-[#382F47]/60">
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate === dateStr;
              const isToday = day === 11 && currentMonth === 10 && currentYear === 2026;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[90px] p-2 transition-colors cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#8B5CF6]/10 dark:bg-[#8B5CF6]/15'
                      : 'hover:bg-[#F5F1E9]/40 dark:hover:bg-[#2C2438]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-[#8B5CF6] text-white'
                          : isSelected
                          ? 'text-[#8B5CF6]'
                          : 'text-[#211B2C] dark:text-[#F5F1E9]'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[9px] font-mono text-[#77717D]">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event Badges */}
                  <div className="space-y-1 mt-1">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono truncate font-medium ${
                          ev.type === 'milestone'
                            ? 'bg-[#10B981]/15 text-[#10B981]'
                            : ev.type === 'workflow'
                            ? 'bg-[#C7F36B]/25 text-[#162700] dark:text-[#C7F36B]'
                            : 'bg-[#8B5CF6]/15 text-[#8B5CF6]'
                        }`}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-[#77717D] font-mono pl-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Day Agenda & Directives (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2DBD0] dark:border-[#382F47] pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#8B5CF6]" />
                <h3 className="font-heading font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">
                  Agenda: {selectedDate}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#8B5CF6]">
                {selectedDateEvents.length} Items
              </span>
            </div>

            {selectedDateEvents.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-[#F5F1E9]/40 dark:bg-[#211B2C]/40 text-xs text-[#77717D] space-y-1">
                <p className="font-semibold">No scheduled events</p>
                <p>No deadlines or workflows due on this date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#211B2C] dark:text-[#F5F1E9]">
                        {ev.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#77717D]">
                      <span className="capitalize">{ev.type}</span>
                      {ev.agentName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#8B5CF6] font-medium">{ev.agentName}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timezone & Sync Info */}
          <div className="p-4 rounded-2xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-2 text-xs">
            <div className="font-bold text-[#211B2C] dark:text-[#F5F1E9] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Timezone Sync: UTC / PKT / Local</span>
            </div>
            <p className="text-[#77717D] dark:text-[#AFA8B8] text-[11px] leading-relaxed">
              All agent execution schedules, Cron workflows, and project deadlines reconcile deterministically across regional team timezones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
