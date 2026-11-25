import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  GripVertical,
  Check,
  Calendar,
  Repeat,
  ListChecks,
  Play,
  Sun,
  Trash2,
  Clock,
} from 'lucide-react';
import { Task } from '../types/task';
import { useTaskStore } from '../store/useTaskStore';
import { formatDueDateLabel } from '../utils/dateParser';
import { PriorityIndicator, PRIORITY_CONFIG } from './PriorityBadge';
import { Tooltip } from './Tooltip';

interface TaskRowProps {
  task: Task;
  draggable?: boolean;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  draggable = false,
}) => {
  const {
    projects,
    labels,
    selectedTaskId,
    selectTask,
    toggleTaskComplete,
    deleteTask,
    updateTask,
    startFocusOnTask,
    focusedTaskId,
    timerRunning,
  } = useTaskStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !draggable,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedTaskId === task.id;
  const isDone = task.status === 'done';
  const isFocused = focusedTaskId === task.id && timerRunning;

  const project = projects.find((p) => p.id === task.projectId);
  const taskLabels = labels.filter((l) => task.labelIds.includes(l.id));
  const dueInfo = formatDueDateLabel(task.dueDate, task.dueTime);

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const priorityColor = PRIORITY_CONFIG[task.priority].dotColor;
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => selectTask(task.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            selectTask(task.id);
          }
        }
      }}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      className={`group relative flex items-start gap-3 px-3.5 py-3 rounded-xl border transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        isDragging
          ? 'opacity-60 scale-[1.01] z-30 shadow-xl border-indigo-500/50 bg-white dark:bg-[#141B2D]'
          : isSelected
          ? 'bg-indigo-500/[0.08] dark:bg-indigo-500/[0.12] border-indigo-500/40'
          : 'surface-card-interactive'
      }`}
    >
      {/* Drag Handle */}
      {draggable && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to reorder task"
          className="mt-0.5 -ml-1 p-1 rounded text-slate-400 opacity-40 group-hover:opacity-100 focus:opacity-100 hover:text-slate-700 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="w-4 h-4" strokeWidth={1.5} />
        </button>
      )}

      {/* Animated Checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleTaskComplete(task.id);
        }}
        aria-label={isDone ? `Mark "${task.title}" incomplete` : `Complete "${task.title}"`}
        className="mt-0.5 relative w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
        style={{
          border: isDone ? 'none' : `1.75px solid ${priorityColor}`,
          backgroundColor: isDone ? '#22C55E' : 'transparent',
        }}
      >
        {isDone && (
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="text-white flex items-center justify-center"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
          </motion.span>
        )}
      </button>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-[15px] font-semibold leading-snug break-words ${
              isDone
                ? 'line-through text-slate-400 dark:text-[#64748B]'
                : 'text-slate-900 dark:text-[#F1F5F9]'
            }`}
          >
            {task.title}
          </p>

          {/* Status Indicator for In Progress / Focusing */}
          {!isDone && (task.status === 'in_progress' || isFocused) && (
            <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap shrink-0">
              {isFocused ? 'Focusing' : 'In Progress'}
            </span>
          )}
        </div>

        {/* Clean Unboxed Metadata Row (Zero-Pill Discipline) */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-slate-500 dark:text-[#94A3B8]">
          <PriorityIndicator priority={task.priority} />

          {task.dueDate && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-white/15">
                ·
              </span>
              <span
                className={`inline-flex items-center gap-1 font-mono-tabular whitespace-nowrap ${
                  !isDone && dueInfo.isOverdue
                    ? 'text-[#EF4444] font-medium'
                    : !isDone && dueInfo.isTodayDate
                    ? 'text-[#22C55E] font-medium'
                    : ''
                }`}
              >
                <Calendar className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                <span>{dueInfo.label}</span>
              </span>
            </>
          )}

          {project && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-white/15">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className="w-2 h-2 rounded-xs shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span>{project.name}</span>
              </span>
            </>
          )}

          {totalSubtasks > 0 && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-white/15">
                ·
              </span>
              <span className="inline-flex items-center gap-1 font-mono-tabular whitespace-nowrap">
                <ListChecks className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                <span>
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </span>
            </>
          )}

          {task.recurrence !== 'none' && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-white/15">
                ·
              </span>
              <span className="inline-flex items-center gap-1 capitalize whitespace-nowrap">
                <Repeat className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                <span>{task.recurrence}</span>
              </span>
            </>
          )}

          {task.estimatedMinutes && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-white/15">
                ·
              </span>
              <span className="inline-flex items-center gap-1 font-mono-tabular whitespace-nowrap">
                <Clock className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                <span>{task.estimatedMinutes}m</span>
              </span>
            </>
          )}

          {taskLabels.length > 0 && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-white/15">
                ·
              </span>
              <span className="inline-flex items-center gap-2">
                {taskLabels.map((lbl) => (
                  <span
                    key={lbl.id}
                    className="whitespace-nowrap"
                    style={{ color: lbl.color }}
                  >
                    #{lbl.name}
                  </span>
                ))}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Hover / Focus Quick Actions */}
      <div
        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {!isDone && (
          <Tooltip content="Start Focus Timer" position="top">
            <button
              type="button"
              onClick={() => startFocusOnTask(task.id)}
              aria-label={`Start focus timer for ${task.title}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </Tooltip>
        )}
        {!isDone && task.dueDate !== todayStr && (
          <Tooltip content="Schedule for Today" position="top">
            <button
              type="button"
              onClick={() => updateTask(task.id, { dueDate: todayStr })}
              aria-label={`Schedule ${task.title} for today`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#22C55E] hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Sun className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </Tooltip>
        )}
        <Tooltip content="Delete task" position="top">
          <button
            type="button"
            onClick={() => deleteTask(task.id)}
            aria-label={`Delete ${task.title}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#EF4444] hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
