import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, CheckCircle2, Circle, Clock, ListChecks, PlayCircle } from 'lucide-react';
import { Task, TaskStatus } from '../types/task';
import { useTaskStore } from '../store/useTaskStore';
import { formatDueDateLabel } from '../utils/dateParser';
import { PriorityIndicator } from './PriorityBadge';

interface BoardViewProps {
  tasks: Task[];
}

const COLUMNS: {
  id: TaskStatus;
  title: string;
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  accentClass: string;
}[] = [
  { id: 'todo', title: 'To Do', icon: Circle, accentClass: 'text-slate-400' },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: PlayCircle,
    accentClass: 'text-indigo-500 dark:text-indigo-400',
  },
  {
    id: 'done',
    title: 'Done',
    icon: CheckCircle2,
    accentClass: 'text-[#22C55E]',
  },
];

const KanbanCard: React.FC<{ task: Task; isOverlay?: boolean }> = ({
  task,
  isOverlay = false,
}) => {
  const { projects, selectedTaskId, selectTask } = useTaskStore();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      disabled: isOverlay,
    });

  const style: React.CSSProperties | undefined = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const project = projects.find((p) => p.id === task.projectId);
  const dueInfo = formatDueDateLabel(task.dueDate, task.dueTime);
  const completedSub = task.subtasks.filter((s) => s.completed).length;

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      onClick={() => selectTask(task.id)}
      className={`p-3.5 rounded-xl border cursor-grab active:cursor-grabbing transition-all select-none ${
        isDragging
          ? 'opacity-30'
          : isOverlay
          ? 'shadow-2xl border-indigo-500/60 bg-white dark:bg-[#141B2D] rotate-1'
          : selectedTaskId === task.id
          ? 'bg-indigo-500/[0.08] dark:bg-indigo-500/[0.12] border-indigo-500/40'
          : 'surface-card-interactive'
      }`}
    >
      <p
        className={`text-[14px] font-semibold leading-snug ${
          task.status === 'done'
            ? 'line-through text-slate-400 dark:text-[#64748B]'
            : 'text-slate-900 dark:text-[#F1F5F9]'
        }`}
      >
        {task.title}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500 dark:text-[#94A3B8]">
        <PriorityIndicator priority={task.priority} compact />

        {task.dueDate && (
          <>
            <span aria-hidden="true">·</span>
            <span
              className={`inline-flex items-center gap-1 font-mono-tabular ${
                task.status !== 'done' && dueInfo.isOverdue
                  ? 'text-[#EF4444] font-medium'
                  : ''
              }`}
            >
              <Calendar className="w-3 h-3" strokeWidth={1.5} />
              <span>{dueInfo.label}</span>
            </span>
          </>
        )}

        {project && (
          <>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-xs"
                style={{ backgroundColor: project.color }}
              />
              <span className="truncate max-w-[90px]">{project.name}</span>
            </span>
          </>
        )}

        {task.subtasks.length > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-mono-tabular">
              <ListChecks className="w-3 h-3" strokeWidth={1.5} />
              <span>
                {completedSub}/{task.subtasks.length}
              </span>
            </span>
          </>
        )}

        {task.estimatedMinutes && (
          <>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-mono-tabular">
              <Clock className="w-3 h-3" strokeWidth={1.5} />
              <span>{task.estimatedMinutes}m</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
};

const KanbanColumn: React.FC<{
  column: (typeof COLUMNS)[number];
  tasks: Task[];
}> = ({ column, tasks }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const Icon = column.icon;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl p-3 border transition-colors min-h-[340px] ${
        isOver
          ? 'border-indigo-500/50 bg-indigo-500/[0.04]'
          : 'border-slate-200/70 dark:border-white/[0.06] bg-slate-100/50 dark:bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${column.accentClass}`} strokeWidth={1.5} />
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            {column.title}
          </h3>
        </div>
        <span className="font-mono-tabular text-[12px] font-medium text-slate-500 dark:text-[#94A3B8]">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 space-y-2.5">
        {tasks.length === 0 ? (
          <div className="h-24 rounded-xl border border-dashed border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-[12px] text-slate-400 dark:text-[#64748B]">
            Drop tasks here
          </div>
        ) : (
          tasks.map((task) => <KanbanCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
};

export const BoardView: React.FC<BoardViewProps> = ({ tasks }) => {
  const moveTaskStatus = useTaskStore((s) => s.moveTaskStatus);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const found = tasks.find((t) => t.id === event.active.id);
    setActiveTask(found || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const targetStatus = over.id as TaskStatus;
    if (
      targetStatus === 'todo' ||
      targetStatus === 'in_progress' ||
      targetStatus === 'done'
    ) {
      moveTaskStatus(String(active.id), targetStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={tasks.filter((t) => t.status === col.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};
