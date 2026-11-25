import React, { useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import {
  X,
  CheckCircle2,
  Circle,
  Calendar,
  Flag,
  Folder,
  Repeat,
  Clock,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Tag,
  Sparkles,
  Check,
} from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { Priority, Recurrence, TaskStatus, TimerMode } from '../types/task';
import { formatDueDateLabel, parseQuickDateExpression } from '../utils/dateParser';
import { PRIORITY_CONFIG } from './PriorityBadge';
import { ProgressRing } from './ProgressRing';
import { Tooltip } from './Tooltip';

export const RightPanel: React.FC = () => {
  const {
    tasks,
    projects,
    labels,
    activeWorkspaceId,
    selectedTaskId,
    selectTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    duplicateTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    timerMode,
    timerSecondsLeft,
    timerRunning,
    focusedTaskId,
    focusSessionsCompleted,
    setTimerMode,
    toggleTimer,
    resetTimer,
    startFocusOnTask,
  } = useTaskStore();

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [nlpDateInput, setNlpDateInput] = useState('');

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  );

  const wsProjects = useMemo(
    () => projects.filter((p) => p.workspaceId === activeWorkspaceId),
    [projects, activeWorkspaceId]
  );

  const wsTasks = useMemo(
    () => tasks.filter((t) => t.workspaceId === activeWorkspaceId),
    [tasks, activeWorkspaceId]
  );

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const todayStats = useMemo(() => {
    const todayItems = wsTasks.filter(
      (t) =>
        t.dueDate === todayStr ||
        (t.status === 'done' &&
          t.completedAt &&
          format(new Date(t.completedAt), 'yyyy-MM-dd') === todayStr)
    );
    const doneCount = todayItems.filter((t) => t.status === 'done').length;
    const totalCount = todayItems.length;
    const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    return { doneCount, totalCount, pct };
  }, [wsTasks, todayStr]);

  const topPriorityTasks = useMemo(() => {
    const rank: Record<Priority, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    return wsTasks
      .filter((t) => t.status !== 'done')
      .sort((a, b) => rank[a.priority] - rank[b.priority])
      .slice(0, 4);
  }, [wsTasks]);

  const focusedTask = useMemo(
    () => tasks.find((t) => t.id === focusedTaskId) || null,
    [tasks, focusedTaskId]
  );

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleNlpDateApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !nlpDateInput.trim()) return;
    const res = parseQuickDateExpression(nlpDateInput);
    if (res.dueDate) {
      updateTask(selectedTask.id, {
        dueDate: res.dueDate,
        dueTime: res.dueTime,
      });
      setNlpDateInput('');
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newSubtaskTitle.trim()) return;
    addSubtask(selectedTask.id, newSubtaskTitle);
    setNewSubtaskTitle('');
  };

  const panelContent = selectedTask ? (
    <div className="flex flex-col h-full">
      {/* Inspector Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200/70 dark:border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleTaskComplete(selectedTask.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              selectedTask.status === 'done'
                ? 'bg-emerald-500/15 text-[#22C55E]'
                : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/[0.1]'
            }`}
          >
            {selectedTask.status === 'done' ? (
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            ) : (
              <Circle className="w-3.5 h-3.5" strokeWidth={1.75} />
            )}
            <span>{selectedTask.status === 'done' ? 'Completed' : 'Mark Complete'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip content="Focus on this task" position="bottom">
            <button
              type="button"
              onClick={() => startFocusOnTask(selectedTask.id)}
              aria-label="Start focus timer on this task"
              className="p-1.5 rounded-lg text-slate-500 dark:text-[#94A3B8] hover:text-indigo-500 hover:bg-indigo-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Play className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </Tooltip>
          <Tooltip content="Duplicate task" position="bottom">
            <button
              type="button"
              onClick={() => duplicateTask(selectedTask.id)}
              aria-label="Duplicate task"
              className="p-1.5 rounded-lg text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Copy className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </Tooltip>
          <Tooltip content="Delete task" position="bottom">
            <button
              type="button"
              onClick={() => deleteTask(selectedTask.id)}
              aria-label="Delete task"
              className="p-1.5 rounded-lg text-slate-500 dark:text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </Tooltip>
          <Tooltip content="Close inspector" shortcut="Esc" position="bottom">
            <button
              type="button"
              onClick={() => selectTask(null)}
              aria-label="Close task details"
              className="p-1.5 rounded-lg text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Title & Notes */}
        <div className="space-y-2">
          <input
            type="text"
            value={selectedTask.title}
            onChange={(e) =>
              updateTask(selectedTask.id, { title: e.target.value })
            }
            aria-label="Task title"
            className="w-full bg-transparent text-[16px] font-semibold text-slate-900 dark:text-[#F1F5F9] focus:outline-none border-b border-transparent focus:border-indigo-500/50 pb-1"
          />
          <textarea
            value={selectedTask.description}
            onChange={(e) =>
              updateTask(selectedTask.id, { description: e.target.value })
            }
            rows={3}
            placeholder="Add notes, links, or acceptance criteria..."
            aria-label="Task notes"
            className="w-full bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] rounded-xl px-3 py-2 text-[13px] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-none focus:border-indigo-500/50 resize-none"
          />
        </div>

        {/* Status Segmented Control */}
        <div className="space-y-1.5">
          <label className="section-label block">Status</label>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
            {(
              [
                { value: 'todo', label: 'To Do' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'done', label: 'Done' },
              ] as { value: TaskStatus; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  if (opt.value === 'done' && selectedTask.status !== 'done') {
                    toggleTaskComplete(selectedTask.id);
                  } else {
                    updateTask(selectedTask.id, {
                      status: opt.value,
                      completedAt:
                        opt.value === 'done' ? new Date().toISOString() : null,
                    });
                  }
                }}
                className={`py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
                  selectedTask.status === opt.value
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule / Due Date */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="section-label">Schedule</label>
            {selectedTask.dueDate && (
              <span className="text-[12px] font-mono-tabular text-indigo-600 dark:text-indigo-400">
                {formatDueDateLabel(selectedTask.dueDate, selectedTask.dueTime).label}
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Today', date: todayStr },
              {
                label: 'Tomorrow',
                date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
              },
              {
                label: '+7d',
                date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
              },
              { label: 'Clear', date: null },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() =>
                  updateTask(selectedTask.id, {
                    dueDate: chip.date,
                    dueTime: chip.date ? selectedTask.dueTime : null,
                  })
                }
                className={`py-1.5 px-2 rounded-lg text-[12px] font-medium border transition-colors ${
                  selectedTask.dueDate === chip.date
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={selectedTask.dueDate || ''}
              onChange={(e) =>
                updateTask(selectedTask.id, {
                  dueDate: e.target.value || null,
                })
              }
              aria-label="Due date"
              className="px-2.5 py-1.5 rounded-lg text-[12px] font-mono-tabular bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="time"
              value={selectedTask.dueTime || ''}
              onChange={(e) =>
                updateTask(selectedTask.id, {
                  dueTime: e.target.value || null,
                })
              }
              aria-label="Due time"
              className="px-2.5 py-1.5 rounded-lg text-[12px] font-mono-tabular bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <form onSubmit={handleNlpDateApply} className="flex gap-1.5">
            <input
              type="text"
              value={nlpDateInput}
              onChange={(e) => setNlpDateInput(e.target.value)}
              placeholder='Type e.g. "next Friday 2pm"'
              aria-label="Natural language date"
              className="flex-1 px-2.5 py-1.5 rounded-lg text-[12px] bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 rounded-lg text-[12px] font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.1]"
            >
              Set
            </button>
          </form>
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <label className="section-label block">Priority</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['urgent', 'high', 'medium', 'low'] as Priority[]).map((p) => {
              const cfg = PRIORITY_CONFIG[p];
              const Icon = cfg.icon;
              const active = selectedTask.priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateTask(selectedTask.id, { priority: p })}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-[11px] font-medium transition-colors ${
                    active
                      ? 'border-indigo-500/60 bg-indigo-500/10 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${cfg.colorClass}`} strokeWidth={1.5} />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Project, Recurrence, Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[12px] font-medium text-slate-500 dark:text-[#94A3B8] flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Project</span>
            </label>
            <select
              value={selectedTask.projectId ?? ''}
              onChange={(e) =>
                updateTask(selectedTask.id, {
                  projectId: e.target.value || null,
                })
              }
              className="w-full px-2.5 py-1.5 rounded-lg text-[12.5px] bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="" className="bg-white dark:bg-[#141B2D]">Inbox</option>
              {wsProjects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-[#141B2D]">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-medium text-slate-500 dark:text-[#94A3B8] flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Repeat</span>
            </label>
            <select
              value={selectedTask.recurrence}
              onChange={(e) =>
                updateTask(selectedTask.id, {
                  recurrence: e.target.value as Recurrence,
                })
              }
              className="w-full px-2.5 py-1.5 rounded-lg text-[12.5px] bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="none" className="bg-white dark:bg-[#141B2D]">None</option>
              <option value="daily" className="bg-white dark:bg-[#141B2D]">Daily</option>
              <option value="weekly" className="bg-white dark:bg-[#141B2D]">Weekly</option>
              <option value="monthly" className="bg-white dark:bg-[#141B2D]">Monthly</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[12px] font-medium text-slate-500 dark:text-[#94A3B8] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Estimated Minutes</span>
          </label>
          <input
            type="number"
            min={0}
            max={480}
            step={5}
            value={selectedTask.estimatedMinutes ?? ''}
            onChange={(e) =>
              updateTask(selectedTask.id, {
                estimatedMinutes: e.target.value
                  ? parseInt(e.target.value, 10)
                  : null,
              })
            }
            placeholder="e.g. 25"
            className="w-full px-2.5 py-1.5 rounded-lg text-[12.5px] font-mono-tabular bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Labels */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-slate-500 dark:text-[#94A3B8] flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Labels</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {labels.map((lbl) => {
              const active = selectedTask.labelIds.includes(lbl.id);
              return (
                <button
                  key={lbl.id}
                  type="button"
                  onClick={() => {
                    const nextLabels = active
                      ? selectedTask.labelIds.filter((id) => id !== lbl.id)
                      : [...selectedTask.labelIds, lbl.id];
                    updateTask(selectedTask.id, { labelIds: nextLabels });
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium border transition-colors ${
                    active
                      ? 'border-indigo-500/50 bg-indigo-500/12 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: lbl.color }}
                  />
                  <span>#{lbl.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subtasks */}
        <div className="space-y-2.5 pt-2 border-t border-slate-200/70 dark:border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="section-label">Subtasks</span>
            {selectedTask.subtasks.length > 0 && (
              <span className="font-mono-tabular text-[12px] text-slate-500 dark:text-[#94A3B8]">
                {selectedTask.subtasks.filter((s) => s.completed).length}/
                {selectedTask.subtasks.length}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {selectedTask.subtasks.map((st) => (
              <div
                key={st.id}
                className="group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-white/[0.04]"
              >
                <button
                  type="button"
                  onClick={() => toggleSubtask(selectedTask.id, st.id)}
                  className="flex items-center gap-2 text-left flex-1 min-w-0"
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      st.completed
                        ? 'bg-[#22C55E] border-[#22C55E] text-white'
                        : 'border-slate-300 dark:border-white/25'
                    }`}
                  >
                    {st.completed && <Check className="w-3 h-3" strokeWidth={2.5} />}
                  </span>
                  <span
                    className={`text-[13px] truncate ${
                      st.completed
                        ? 'line-through text-slate-400 dark:text-[#64748B]'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {st.title}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteSubtask(selectedTask.id, st.id)}
                  aria-label={`Remove subtask ${st.title}`}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-slate-400 hover:text-[#EF4444]"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSubtask} className="flex gap-1.5">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Add a subtask step..."
              aria-label="New subtask"
              className="flex-1 px-2.5 py-1.5 rounded-lg text-[12.5px] bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              aria-label="Add subtask"
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.1]"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </form>
        </div>
      </div>
    </div>
  ) : (
    // Default 3rd-column view: Focus Timer & Daily Momentum
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-5">
      {/* Daily Progress Summary */}
      <div className="surface-card rounded-2xl p-4 flex items-center gap-4">
        <ProgressRing value={todayStats.pct} size={64} strokeWidth={5} />
        <div className="min-w-0">
          <div className="section-label">Daily Momentum</div>
          <p className="mt-0.5 text-[15px] font-semibold text-slate-900 dark:text-[#F1F5F9]">
            {todayStats.doneCount} of {todayStats.totalCount} done today
          </p>
          <p className="text-[12px] text-slate-500 dark:text-[#94A3B8]">
            {todayStats.totalCount === 0
              ? 'Schedule tasks for today to track progress'
              : todayStats.doneCount === todayStats.totalCount
              ? 'All scheduled tasks complete'
              : `${todayStats.totalCount - todayStats.doneCount} remaining on your radar`}
          </p>
        </div>
      </div>

      {/* Pomodoro Focus Timer */}
      <div className="surface-card rounded-2xl p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="section-label">Focus Timer</span>
          <span className="font-mono-tabular text-[12px] text-slate-500 dark:text-[#94A3B8]">
            {focusSessionsCompleted} sessions
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04]">
          {(
            [
              { mode: 'focus', label: 'Focus' },
              { mode: 'shortBreak', label: 'Break' },
              { mode: 'longBreak', label: 'Rest' },
            ] as { mode: TimerMode; label: string }[]
          ).map((m) => (
            <button
              key={m.mode}
              type="button"
              onClick={() => setTimerMode(m.mode)}
              className={`py-1 rounded-lg text-[12px] font-medium transition-colors ${
                timerMode === m.mode
                  ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="py-3 text-center">
          <div className="font-mono-tabular text-[40px] font-bold tracking-tight text-slate-900 dark:text-[#F1F5F9] leading-none">
            {formatTimer(timerSecondsLeft)}
          </div>
          <p className="mt-2 text-[12px] text-slate-500 dark:text-[#94A3B8] truncate px-2">
            {focusedTask
              ? `Working on: ${focusedTask.title}`
              : 'Select any task to link a focus session'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={toggleTimer}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl primary-gradient text-white text-[13px] font-semibold shadow-sm hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            {timerRunning ? (
              <>
                <Pause className="w-4 h-4" strokeWidth={1.75} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" strokeWidth={1.75} />
                <span>Start Focus</span>
              </>
            )}
          </button>
          <Tooltip content="Reset timer" position="top">
            <button
              type="button"
              onClick={resetTimer}
              aria-label="Reset focus timer"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Priority Queue */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="section-label">Up Next by Priority</span>
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" strokeWidth={1.5} />
        </div>

        {topPriorityTasks.length === 0 ? (
          <div className="surface-card rounded-xl p-4 text-[12.5px] text-slate-500 dark:text-[#94A3B8] text-center">
            No open tasks in this workspace.
          </div>
        ) : (
          <div className="space-y-1.5">
            {topPriorityTasks.map((t) => {
              const cfg = PRIORITY_CONFIG[t.priority];
              const Icon = cfg.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTask(t.id)}
                  className="w-full text-left surface-card-interactive rounded-xl p-3 flex items-start gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Icon
                    className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.colorClass}`}
                    strokeWidth={1.5}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {t.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-[#94A3B8] font-mono-tabular">
                      {cfg.label}
                      {t.dueDate
                        ? ` · ${formatDueDateLabel(t.dueDate, t.dueTime).label}`
                        : ''}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop 3rd Column */}
      <aside
        aria-label="Task Inspector and Focus Panel"
        className="hidden xl:flex flex-col w-[340px] shrink-0 border-l border-slate-200/80 dark:border-white/[0.08] surface-sidebar h-full"
      >
        {panelContent}
      </aside>

      {/* Tablet / Mobile Slide-over Drawer when a task is selected */}
      {selectedTask && (
        <div className="xl:hidden fixed inset-0 z-40 flex justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => selectTask(null)}
          />
          <aside className="relative z-50 w-full max-w-md h-full surface-sidebar border-l border-slate-200 dark:border-white/[0.08] shadow-2xl">
            {panelContent}
          </aside>
        </div>
      )}
    </>
  );
};
