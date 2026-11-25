import React, { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import {
  ChevronDown,
  ChevronRight,
  CalendarClock,
  CheckCircle2,
  Inbox,
  Plus,
} from 'lucide-react';
import { Task } from '../types/task';
import { useTaskStore } from '../store/useTaskStore';
import { TaskRow } from './TaskRow';

interface TaskListViewProps {
  tasks: Task[];
  onFocusQuickAdd?: () => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onFocusQuickAdd,
}) => {
  const { activeFilter, sortBy, reorderTasks, updateTask, pushToast } =
    useTaskStore();

  const [showCompletedToday, setShowCompletedToday] = useState(false);
  const [overdueExpanded, setOverdueExpanded] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isDragEnabled = sortBy === 'manual';

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTasks(String(active.id), String(over.id));
    }
  };

  // Grouping logic depending on active view
  const isTodayView =
    activeFilter.type === 'nav' && activeFilter.view === 'today';
  const isUpcomingView =
    activeFilter.type === 'nav' && activeFilter.view === 'upcoming';
  const isCompletedView =
    activeFilter.type === 'nav' && activeFilter.view === 'completed';

  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.status !== 'done' && t.dueDate && t.dueDate < todayStr
      ),
    [tasks, todayStr]
  );

  const todayActiveTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.status !== 'done' && t.dueDate === todayStr
      ),
    [tasks, todayStr]
  );

  const todayDoneTasks = useMemo(
    () => tasks.filter((t) => t.status === 'done'),
    [tasks]
  );

  const handleRescheduleAllOverdue = () => {
    overdueTasks.forEach((t) => updateTask(t.id, { dueDate: todayStr }));
    pushToast({
      message: `Rescheduled ${overdueTasks.length} overdue ${
        overdueTasks.length === 1 ? 'task' : 'tasks'
      } to Today`,
      type: 'success',
    });
  };

  // Upcoming chronological grouping
  const upcomingGroups = useMemo(() => {
    if (!isUpcomingView) return [];
    const active = tasks.filter((t) => t.status !== 'done' && t.dueDate);
    const map = new Map<string, Task[]>();

    for (const t of active) {
      const key = t.dueDate! < todayStr ? 'overdue' : t.dueDate!;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }

    const keys = Array.from(map.keys()).sort((a, b) => {
      if (a === 'overdue') return -1;
      if (b === 'overdue') return 1;
      return a.localeCompare(b);
    });

    return keys.map((key) => {
      let label = key;
      if (key === 'overdue') {
        label = 'Overdue';
      } else {
        const d = parseISO(key);
        if (isToday(d)) label = `Today · ${format(d, 'MMM d')}`;
        else if (isTomorrow(d)) label = `Tomorrow · ${format(d, 'MMM d')}`;
        else label = format(d, 'EEEE · MMM d');
      }
      return { key, label, items: map.get(key)! };
    });
  }, [isUpcomingView, tasks, todayStr]);

  if (tasks.length === 0) {
    return (
      <div className="surface-card rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
          {isCompletedView ? (
            <CheckCircle2 className="w-6 h-6" strokeWidth={1.5} />
          ) : (
            <Inbox className="w-6 h-6" strokeWidth={1.5} />
          )}
        </div>
        <div className="max-w-sm">
          <h3 className="text-[16px] font-semibold text-slate-900 dark:text-[#F1F5F9]">
            {isCompletedView ? 'No completed tasks yet' : 'Clear slate here'}
          </h3>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-[#94A3B8]">
            {isCompletedView
              ? 'Tasks you check off will appear here with completion timestamps.'
              : 'Capture a task above using natural language like "Review roadmap tomorrow at 10am !2".'}
          </p>
        </div>
        {!isCompletedView && onFocusQuickAdd && (
          <button
            type="button"
            onClick={onFocusQuickAdd}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl primary-gradient text-white text-[13px] font-semibold shadow-sm hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Create first task</span>
          </button>
        )}
      </div>
    );
  }

  // TODAY VIEW WITH OVERDUE + TODAY + COMPLETED SECTIONS
  if (isTodayView) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          {overdueTasks.length > 0 && (
            <section aria-label="Overdue tasks" className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => setOverdueExpanded((v) => !v)}
                  className="flex items-center gap-1.5 section-label text-[#EF4444] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                >
                  {overdueExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                  )}
                  <span>Overdue</span>
                  <span className="font-mono-tabular text-[12px] ml-1">
                    ({overdueTasks.length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleRescheduleAllOverdue}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <CalendarClock className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Reschedule to Today</span>
                </button>
              </div>
              {overdueExpanded && (
                <SortableContext
                  items={overdueTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {overdueTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        draggable={isDragEnabled}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </section>
          )}

          <section aria-label="Due today" className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="section-label">
                Due Today{' '}
                <span className="font-mono-tabular">
                  ({todayActiveTasks.length})
                </span>
              </h2>
            </div>
            {todayActiveTasks.length === 0 ? (
              <div className="surface-card rounded-xl px-4 py-6 text-center text-[13px] text-slate-500 dark:text-[#94A3B8]">
                All scheduled tasks for today are complete.
              </div>
            ) : (
              <SortableContext
                items={todayActiveTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {todayActiveTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      draggable={isDragEnabled}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </section>

          {todayDoneTasks.length > 0 && (
            <section aria-label="Completed today" className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCompletedToday((v) => !v)}
                className="flex items-center gap-1.5 px-1 section-label hover:text-slate-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
              >
                {showCompletedToday ? (
                  <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                )}
                <span>Completed</span>
                <span className="font-mono-tabular">
                  ({todayDoneTasks.length})
                </span>
              </button>
              {showCompletedToday && (
                <div className="space-y-2">
                  {todayDoneTasks.map((task) => (
                    <TaskRow key={task.id} task={task} draggable={false} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </DndContext>
    );
  }

  // UPCOMING GROUPED BY DAY
  if (isUpcomingView) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          {upcomingGroups.map((group) => (
            <section key={group.key} className="space-y-2">
              <h2
                className={`section-label px-1 ${
                  group.key === 'overdue' ? '!text-[#EF4444]' : ''
                }`}
              >
                {group.label}{' '}
                <span className="font-mono-tabular">({group.items.length})</span>
              </h2>
              <SortableContext
                items={group.items.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {group.items.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      draggable={isDragEnabled}
                    />
                  ))}
                </div>
              </SortableContext>
            </section>
          ))}
        </div>
      </DndContext>
    );
  }

  // STANDARD LIST (Inbox, Project, Label, Completed)
  const activeList = isCompletedView
    ? tasks
    : tasks.filter((t) => t.status !== 'done');
  const doneList = isCompletedView
    ? []
    : tasks.filter((t) => t.status === 'done');

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-5">
        <SortableContext
          items={activeList.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {activeList.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                draggable={isDragEnabled && !isCompletedView}
              />
            ))}
          </div>
        </SortableContext>

        {doneList.length > 0 && (
          <section className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCompletedToday((v) => !v)}
              className="flex items-center gap-1.5 px-1 section-label hover:text-slate-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
            >
              {showCompletedToday ? (
                <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              )}
              <span>Completed</span>
              <span className="font-mono-tabular">({doneList.length})</span>
            </button>
            {showCompletedToday && (
              <div className="space-y-2">
                {doneList.map((task) => (
                  <TaskRow key={task.id} task={task} draggable={false} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </DndContext>
  );
};
