import React, { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { PRIORITY_CONFIG } from './PriorityBadge';
import { QuickAddBar } from './QuickAddBar';
import { TaskRow } from './TaskRow';

export const CalendarView: React.FC = () => {
  const { tasks, activeWorkspaceId, projects, selectTask } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month');

  const wsTasks = useMemo(
    () => tasks.filter((t) => t.workspaceId === activeWorkspaceId),
    [tasks, activeWorkspaceId]
  );

  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof wsTasks> = {};
    for (const t of wsTasks) {
      if (!t.dueDate) continue;
      if (!map[t.dueDate]) map[t.dueDate] = [];
      map[t.dueDate].push(t);
    }
    return map;
  }, [wsTasks]);

  const days = useMemo(() => {
    if (calendarMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentDate, calendarMode]);

  const handlePrev = () => {
    setCurrentDate((d) =>
      calendarMode === 'month' ? subMonths(d, 1) : subWeeks(d, 1)
    );
  };

  const handleNext = () => {
    setCurrentDate((d) =>
      calendarMode === 'month' ? addMonths(d, 1) : addWeeks(d, 1)
    );
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDayStr(format(now, 'yyyy-MM-dd'));
  };

  const selectedDayTasks = useMemo(
    () => tasksByDate[selectedDayStr] || [],
    [tasksByDate, selectedDayStr]
  );

  const selectedDateFormatted = useMemo(() => {
    const [y, m, d] = selectedDayStr.split('-').map(Number);
    return format(new Date(y, m - 1, d), 'EEEE, MMM d');
  }, [selectedDayStr]);

  return (
    <div className="space-y-5">
      {/* Calendar Header Controls */}
      <div className="surface-card rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold text-slate-900 dark:text-[#F1F5F9]">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous period"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/[0.08] text-[12px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next period"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setCalendarMode('month')}
              className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
                calendarMode === 'month'
                  ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setCalendarMode('week')}
              className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
                calendarMode === 'week'
                  ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Weekday Header */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div
              key={d}
              className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#64748B] py-1.5"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayTasks = tasksByDate[dayStr] || [];
            const isSelected = dayStr === selectedDayStr;
            const isCurrentMonth =
              calendarMode === 'week' || isSameMonth(day, currentDate);
            const todayFlag = isToday(day);

            return (
              <button
                key={dayStr}
                type="button"
                onClick={() => setSelectedDayStr(dayStr)}
                className={`text-left rounded-xl p-1.5 sm:p-2 border transition-all flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  calendarMode === 'week' ? 'min-h-[140px]' : 'min-h-[82px] sm:min-h-[96px]'
                } ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/[0.08] dark:bg-indigo-500/[0.14]'
                    : 'border-slate-200/60 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.15] hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                } ${!isCurrentMonth ? 'opacity-40' : ''}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`font-mono-tabular text-[12px] font-semibold w-6 h-6 rounded-full flex items-center justify-center ${
                      todayFlag
                        ? 'primary-gradient text-white'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="font-mono-tabular text-[10px] text-slate-400 dark:text-[#64748B]">
                      {dayTasks.filter((t) => t.status !== 'done').length || ''}
                    </span>
                  )}
                </div>

                <div className="mt-1 space-y-1 w-full overflow-hidden">
                  {dayTasks.slice(0, calendarMode === 'week' ? 5 : 2).map((t) => {
                    const proj = projects.find((p) => p.id === t.projectId);
                    const color =
                      proj?.color || PRIORITY_CONFIG[t.priority].dotColor;
                    return (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayStr(dayStr);
                          selectTask(t.id);
                        }}
                        className={`text-[11px] leading-tight px-1.5 py-0.5 rounded truncate flex items-center gap-1 ${
                          t.status === 'done'
                            ? 'line-through opacity-50 bg-slate-200/60 dark:bg-white/[0.04]'
                            : 'bg-slate-100 dark:bg-white/[0.07] text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="truncate">{t.title}</span>
                      </div>
                    );
                  })}
                  {dayTasks.length > (calendarMode === 'week' ? 5 : 2) && (
                    <div className="text-[10px] font-mono-tabular text-indigo-500 dark:text-indigo-400 px-1">
                      +{dayTasks.length - (calendarMode === 'week' ? 5 : 2)} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <CalIcon className="w-4 h-4 text-indigo-500" strokeWidth={1.5} />
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-[#F1F5F9]">
              {selectedDateFormatted}
            </h3>
          </div>
          <span className="font-mono-tabular text-[12px] text-slate-500 dark:text-[#94A3B8]">
            {selectedDayTasks.length}{' '}
            {selectedDayTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        <QuickAddBar defaultDueDate={selectedDayStr} compact />

        {selectedDayTasks.length === 0 ? (
          <div className="surface-card rounded-xl px-4 py-6 text-center text-[13px] text-slate-500 dark:text-[#94A3B8]">
            No tasks scheduled for {selectedDateFormatted}. Add one above to schedule it on this date.
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDayTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
