import React, { useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import {
  Plus,
  Calendar,
  Flag,
  Folder,
  Repeat,
  Clock,
  X,
  CornerDownLeft,
} from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { Priority, Recurrence } from '../types/task';
import { parseNaturalTaskInput, formatDueDateLabel } from '../utils/dateParser';
import { PRIORITY_CONFIG } from './PriorityBadge';

interface QuickAddBarProps {
  defaultProjectId?: string | null;
  defaultDueDate?: string | null;
  autoFocus?: boolean;
  onCreated?: () => void;
  compact?: boolean;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  defaultProjectId = null,
  defaultDueDate = null,
  autoFocus = false,
  onCreated,
  compact = false,
}) => {
  const { projects, labels, activeWorkspaceId, addTask } = useTaskStore();

  const wsProjects = useMemo(
    () => projects.filter((p) => p.workspaceId === activeWorkspaceId),
    [projects, activeWorkspaceId]
  );

  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(autoFocus);
  const [manualPriority, setManualPriority] = useState<Priority>('medium');
  const [manualProjectId, setManualProjectId] = useState<string | null>(
    defaultProjectId
  );
  const [manualDueDate, setManualDueDate] = useState<string | null>(
    defaultDueDate
  );
  const [manualRecurrence, setManualRecurrence] = useState<Recurrence>('none');
  const [ignoreParsedDate, setIgnoreParsedDate] = useState(false);

  // Sync defaults when view changes and input is empty
  React.useEffect(() => {
    if (!input) {
      setManualProjectId(defaultProjectId);
      setManualDueDate(defaultDueDate);
    }
  }, [defaultProjectId, defaultDueDate, input]);

  const parsed = useMemo(
    () => parseNaturalTaskInput(input, wsProjects, labels),
    [input, wsProjects, labels]
  );

  const effectiveDueDate =
    !ignoreParsedDate && parsed.dueDate ? parsed.dueDate : manualDueDate;
  const effectiveDueTime = !ignoreParsedDate ? parsed.dueTime : null;
  const effectivePriority = parsed.priority ?? manualPriority;
  const effectiveProjectId = parsed.projectId ?? manualProjectId;
  const effectiveRecurrence = parsed.recurrence ?? manualRecurrence;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const titleToUse = parsed.cleanTitle || input.trim();
    if (!titleToUse) return;

    addTask({
      title: titleToUse,
      projectId: effectiveProjectId,
      priority: effectivePriority,
      dueDate: effectiveDueDate,
      dueTime: effectiveDueTime,
      recurrence: effectiveRecurrence,
      estimatedMinutes: parsed.estimatedMinutes,
      labelIds: parsed.labelIds,
    });

    setInput('');
    setManualPriority('medium');
    setManualRecurrence('none');
    setManualProjectId(defaultProjectId);
    setManualDueDate(defaultDueDate);
    setIgnoreParsedDate(false);
    onCreated?.();
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const dueDisplay = formatDueDateLabel(effectiveDueDate, effectiveDueTime);
  const effectiveProject = wsProjects.find((p) => p.id === effectiveProjectId);

  const hasParsedPreview =
    input.trim().length > 0 &&
    (parsed.parsedDatePhrase ||
      parsed.priority ||
      parsed.projectId ||
      parsed.recurrence ||
      parsed.estimatedMinutes ||
      parsed.labelIds.length > 0);

  return (
    <form
      onSubmit={handleSubmit}
      className="surface-card rounded-xl transition-all duration-150 focus-within:border-indigo-500/50 dark:focus-within:border-indigo-400/50"
    >
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <span className="w-5 h-5 rounded-full primary-gradient text-white flex items-center justify-center shrink-0">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
        </span>
        <input
          type="text"
          value={input}
          autoFocus={autoFocus}
          onFocus={() => setExpanded(true)}
          onChange={(e) => {
            setInput(e.target.value);
            if (ignoreParsedDate) setIgnoreParsedDate(false);
          }}
          placeholder='Add a task... Try "Deploy release tomorrow at 3pm !1 #Q4 ~30m"'
          aria-label="New task title with natural language date support"
          className="flex-1 bg-transparent text-[14px] font-medium text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-none min-w-0"
        />
        {input.trim() && (
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg primary-gradient text-white text-[12px] font-semibold shadow-sm hover:opacity-95 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <span>Add</span>
            <CornerDownLeft className="w-3 h-3" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* Live Natural-Language Parsing Preview */}
      {hasParsedPreview && (
        <div className="px-3.5 pb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-600 dark:text-[#94A3B8]">
          <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
            Detected:
          </span>
          {parsed.parsedDatePhrase && !ignoreParsedDate && (
            <span className="inline-flex items-center gap-1 text-slate-800 dark:text-slate-200">
              <Calendar className="w-3 h-3 text-indigo-500" strokeWidth={1.5} />
              <span>{dueDisplay.label}</span>
              <button
                type="button"
                onClick={() => setIgnoreParsedDate(true)}
                aria-label="Clear detected date"
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white ml-0.5"
              >
                <X className="w-3 h-3" strokeWidth={1.5} />
              </button>
            </span>
          )}
          {parsed.priority && (
            <span className="inline-flex items-center gap-1">
              <Flag className="w-3 h-3" strokeWidth={1.5} />
              <span>Priority: {PRIORITY_CONFIG[parsed.priority].label}</span>
            </span>
          )}
          {parsed.matchedProjectName && (
            <span className="inline-flex items-center gap-1">
              <Folder className="w-3 h-3" strokeWidth={1.5} />
              <span>{parsed.matchedProjectName}</span>
            </span>
          )}
          {parsed.recurrence && (
            <span className="inline-flex items-center gap-1">
              <Repeat className="w-3 h-3" strokeWidth={1.5} />
              <span className="capitalize">{parsed.recurrence}</span>
            </span>
          )}
          {parsed.estimatedMinutes && (
            <span className="inline-flex items-center gap-1 font-mono-tabular">
              <Clock className="w-3 h-3" strokeWidth={1.5} />
              <span>{parsed.estimatedMinutes}m</span>
            </span>
          )}
        </div>
      )}

      {/* Quick Metadata Controls */}
      {(expanded || !compact) && (
        <div className="px-3.5 py-2 border-t border-slate-200/70 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[12px]">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Date Picker Shortcut */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02] px-2 py-1 gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-[#94A3B8]" strokeWidth={1.5} />
              <select
                aria-label="Due date preset"
                value={
                  effectiveDueDate === todayStr
                    ? 'today'
                    : effectiveDueDate === tomorrowStr
                    ? 'tomorrow'
                    : effectiveDueDate
                    ? 'custom'
                    : 'none'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  setIgnoreParsedDate(true);
                  if (val === 'today') setManualDueDate(todayStr);
                  else if (val === 'tomorrow') setManualDueDate(tomorrowStr);
                  else if (val === 'nextweek')
                    setManualDueDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
                  else if (val === 'none') setManualDueDate(null);
                }}
                className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="none" className="bg-white dark:bg-[#141B2D]">No date</option>
                <option value="today" className="bg-white dark:bg-[#141B2D]">Today</option>
                <option value="tomorrow" className="bg-white dark:bg-[#141B2D]">Tomorrow</option>
                <option value="nextweek" className="bg-white dark:bg-[#141B2D]">Next week</option>
                {effectiveDueDate &&
                  effectiveDueDate !== todayStr &&
                  effectiveDueDate !== tomorrowStr && (
                    <option value="custom" className="bg-white dark:bg-[#141B2D]">
                      {dueDisplay.label}
                    </option>
                  )}
              </select>
            </div>

            {/* Priority Selector */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02] px-2 py-1 gap-1.5">
              <Flag
                className={`w-3.5 h-3.5 ${PRIORITY_CONFIG[effectivePriority].colorClass}`}
                strokeWidth={1.5}
              />
              <select
                aria-label="Task priority"
                value={effectivePriority}
                onChange={(e) => setManualPriority(e.target.value as Priority)}
                className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="urgent" className="bg-white dark:bg-[#141B2D]">Urgent</option>
                <option value="high" className="bg-white dark:bg-[#141B2D]">High</option>
                <option value="medium" className="bg-white dark:bg-[#141B2D]">Medium</option>
                <option value="low" className="bg-white dark:bg-[#141B2D]">Low</option>
              </select>
            </div>

            {/* Project Selector */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02] px-2 py-1 gap-1.5">
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{
                  backgroundColor: effectiveProject?.color ?? '#64748B',
                }}
              />
              <select
                aria-label="Task project"
                value={effectiveProjectId ?? ''}
                onChange={(e) =>
                  setManualProjectId(e.target.value ? e.target.value : null)
                }
                className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[130px] truncate pr-1"
              >
                <option value="" className="bg-white dark:bg-[#141B2D]">Inbox</option>
                {wsProjects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-[#141B2D]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Recurrence Selector */}
            <div className="hidden sm:inline-flex items-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02] px-2 py-1 gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-slate-500 dark:text-[#94A3B8]" strokeWidth={1.5} />
              <select
                aria-label="Task recurrence"
                value={effectiveRecurrence}
                onChange={(e) =>
                  setManualRecurrence(e.target.value as Recurrence)
                }
                className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="none" className="bg-white dark:bg-[#141B2D]">Once</option>
                <option value="daily" className="bg-white dark:bg-[#141B2D]">Daily</option>
                <option value="weekly" className="bg-white dark:bg-[#141B2D]">Weekly</option>
                <option value="monthly" className="bg-white dark:bg-[#141B2D]">Monthly</option>
              </select>
            </div>
          </div>

          <span className="hidden lg:inline text-[11px] text-slate-400 dark:text-[#64748B]">
            Tokens: <code className="font-mono-tabular">!1–4</code>{' '}
            <code className="font-mono-tabular">#project</code>{' '}
            <code className="font-mono-tabular">~25m</code>
          </span>
        </div>
      )}
    </form>
  );
};
