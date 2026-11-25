import { create } from 'zustand';
import {
  ActiveFilter,
  CompletionHistoryItem,
  Label,
  LayoutMode,
  PersistedAppData,
  Priority,
  Project,
  Recurrence,
  SortBy,
  Subtask,
  Task,
  TaskStatus,
  ThemeMode,
  TimerMode,
  ToastMessage,
  Workspace,
} from '../types/task';
import {
  createSeedData,
  CURRENT_SCHEMA_VERSION,
  STORAGE_KEY,
} from '../data/seedData';
import { getNextRecurringDate } from '../utils/dateParser';

const generateId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function loadPersistedData(): PersistedAppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedAppData>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.tasks) ||
      !Array.isArray(parsed.workspaces) ||
      parsed.workspaces.length === 0
    ) {
      const seed = createSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }

    // Version migration / graceful defaults
    const seed = createSeedData();
    return {
      version: CURRENT_SCHEMA_VERSION,
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      activeWorkspaceId:
        parsed.activeWorkspaceId &&
        parsed.workspaces.some((w) => w.id === parsed.activeWorkspaceId)
          ? parsed.activeWorkspaceId
          : parsed.workspaces[0].id,
      workspaces: parsed.workspaces,
      projects: Array.isArray(parsed.projects) ? parsed.projects : seed.projects,
      labels: Array.isArray(parsed.labels) ? parsed.labels : seed.labels,
      tasks: parsed.tasks,
      completionHistory: Array.isArray(parsed.completionHistory)
        ? parsed.completionHistory
        : [],
      focusSessionsCompleted:
        typeof parsed.focusSessionsCompleted === 'number'
          ? parsed.focusSessionsCompleted
          : 0,
      totalFocusMinutes:
        typeof parsed.totalFocusMinutes === 'number'
          ? parsed.totalFocusMinutes
          : 0,
    };
  } catch {
    const seed = createSeedData();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    } catch {
      // Ignore storage quota issues
    }
    return seed;
  }
}

function savePersistedData(state: PersistedAppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota issues
  }
}

function applyThemeClass(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

const TIMER_DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

interface TaskStoreState extends PersistedAppData {
  // UI State
  activeFilter: ActiveFilter;
  layoutMode: LayoutMode;
  sortBy: SortBy;
  priorityFilter: Priority | 'all';
  searchQuery: string;
  selectedTaskId: string | null;
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  commandPaletteOpen: boolean;
  quickAddModalOpen: boolean;
  shortcutsModalOpen: boolean;
  settingsModalOpen: boolean;
  projectModalOpen: boolean;
  editingProjectId: string | null;
  workspaceModalOpen: boolean;
  toasts: ToastMessage[];

  // Focus Timer State
  timerMode: TimerMode;
  timerSecondsLeft: number;
  timerRunning: boolean;
  focusedTaskId: string | null;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setActiveWorkspace: (workspaceId: string) => void;
  addWorkspace: (name: string) => void;

  setActiveFilter: (filter: ActiveFilter) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setSortBy: (sort: SortBy) => void;
  setPriorityFilter: (priority: Priority | 'all') => void;
  setSearchQuery: (q: string) => void;
  selectTask: (taskId: string | null) => void;
  toggleSidebar: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setQuickAddModalOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  openProjectModal: (projectId?: string | null) => void;
  closeProjectModal: () => void;
  setWorkspaceModalOpen: (open: boolean) => void;

  // Task CRUD
  addTask: (input: {
    title: string;
    description?: string;
    projectId?: string | null;
    priority?: Priority;
    status?: TaskStatus;
    dueDate?: string | null;
    dueTime?: string | null;
    recurrence?: Recurrence;
    estimatedMinutes?: number | null;
    labelIds?: string[];
  }) => Task;
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  toggleTaskComplete: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  duplicateTask: (taskId: string) => void;
  reorderTasks: (activeId: string, overId: string) => void;
  moveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;

  // Subtasks
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  // Projects & Labels
  addProject: (name: string, color: string, description?: string) => Project;
  updateProject: (projectId: string, patch: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  addLabel: (name: string, color: string) => Label;

  // Focus Timer
  setTimerMode: (mode: TimerMode) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
  startFocusOnTask: (taskId: string) => void;

  // Toasts
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Data Management
  exportDataJson: () => string;
  importDataJson: (jsonString: string) => boolean;
  resetToSeedData: () => void;
  clearAllTasks: () => void;
}

const initialData = loadPersistedData();
applyThemeClass(initialData.theme);

const persistSnapshot = (state: TaskStoreState) => {
  savePersistedData({
    version: CURRENT_SCHEMA_VERSION,
    theme: state.theme,
    activeWorkspaceId: state.activeWorkspaceId,
    workspaces: state.workspaces,
    projects: state.projects,
    labels: state.labels,
    tasks: state.tasks,
    completionHistory: state.completionHistory,
    focusSessionsCompleted: state.focusSessionsCompleted,
    totalFocusMinutes: state.totalFocusMinutes,
  });
};

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  ...initialData,

  // Default UI state
  activeFilter: { type: 'nav', view: 'today' },
  layoutMode: 'list',
  sortBy: 'manual',
  priorityFilter: 'all',
  searchQuery: '',
  selectedTaskId: null,
  sidebarCollapsed: false,
  mobileDrawerOpen: false,
  commandPaletteOpen: false,
  quickAddModalOpen: false,
  shortcutsModalOpen: false,
  settingsModalOpen: false,
  projectModalOpen: false,
  editingProjectId: null,
  workspaceModalOpen: false,
  toasts: [],

  // Focus Timer
  timerMode: 'focus',
  timerSecondsLeft: TIMER_DURATIONS.focus,
  timerRunning: false,
  focusedTaskId: null,

  setTheme: (theme) => {
    applyThemeClass(theme);
    set((state) => {
      const next = { ...state, theme };
      persistSnapshot(next);
      return { theme };
    });
  },

  toggleTheme: () => {
    const nextTheme: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },

  setActiveWorkspace: (workspaceId) => {
    set((state) => {
      const next = {
        ...state,
        activeWorkspaceId: workspaceId,
        activeFilter: { type: 'nav', view: 'today' } as ActiveFilter,
        selectedTaskId: null,
      };
      persistSnapshot(next);
      return {
        activeWorkspaceId: workspaceId,
        activeFilter: { type: 'nav', view: 'today' },
        selectedTaskId: null,
      };
    });
  },

  addWorkspace: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newWs: Workspace = {
      id: generateId('ws'),
      name: trimmed,
      icon: 'Briefcase',
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const workspaces = [...state.workspaces, newWs];
      const next = {
        ...state,
        workspaces,
        activeWorkspaceId: newWs.id,
        activeFilter: { type: 'nav', view: 'inbox' } as ActiveFilter,
      };
      persistSnapshot(next);
      return {
        workspaces,
        activeWorkspaceId: newWs.id,
        activeFilter: { type: 'nav', view: 'inbox' },
      };
    });
    get().pushToast({ message: `Created workspace "${trimmed}"`, type: 'success' });
  },

  setActiveFilter: (filter) =>
    set({ activeFilter: filter, mobileDrawerOpen: false }),
  setLayoutMode: (layoutMode) => set({ layoutMode }),
  setSortBy: (sortBy) => set({ sortBy }),
  setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  selectTask: (selectedTaskId) => set({ selectedTaskId }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileDrawerOpen: (mobileDrawerOpen) => set({ mobileDrawerOpen }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  setQuickAddModalOpen: (quickAddModalOpen) => set({ quickAddModalOpen }),
  setShortcutsModalOpen: (shortcutsModalOpen) => set({ shortcutsModalOpen }),
  setSettingsModalOpen: (settingsModalOpen) => set({ settingsModalOpen }),
  openProjectModal: (projectId = null) =>
    set({ projectModalOpen: true, editingProjectId: projectId }),
  closeProjectModal: () =>
    set({ projectModalOpen: false, editingProjectId: null }),
  setWorkspaceModalOpen: (workspaceModalOpen) => set({ workspaceModalOpen }),

  addTask: (input) => {
    const state = get();
    const wsTasks = state.tasks.filter(
      (t) => t.workspaceId === state.activeWorkspaceId
    );
    const minOrder =
      wsTasks.length > 0 ? Math.min(...wsTasks.map((t) => t.order)) - 1 : 0;

    const newTask: Task = {
      id: generateId('task'),
      workspaceId: state.activeWorkspaceId,
      projectId: input.projectId ?? null,
      title: input.title.trim(),
      description: input.description ?? '',
      status: input.status ?? 'todo',
      priority: input.priority ?? 'medium',
      dueDate: input.dueDate ?? null,
      dueTime: input.dueTime ?? null,
      recurrence: input.recurrence ?? 'none',
      estimatedMinutes: input.estimatedMinutes ?? null,
      labelIds: input.labelIds ?? [],
      subtasks: [],
      order: minOrder,
      createdAt: new Date().toISOString(),
      completedAt: input.status === 'done' ? new Date().toISOString() : null,
    };

    set((s) => {
      const tasks = [newTask, ...s.tasks];
      const next = { ...s, tasks };
      persistSnapshot(next);
      return { tasks };
    });

    return newTask;
  },

  updateTask: (taskId, patch) => {
    set((s) => {
      const tasks = s.tasks.map((t) =>
        t.id === taskId ? { ...t, ...patch } : t
      );
      const next = { ...s, tasks };
      persistSnapshot(next);
      return { tasks };
    });
  },

  toggleTaskComplete: (taskId) => {
    const state = get();
    const target = state.tasks.find((t) => t.id === taskId);
    if (!target) return;

    const nowDone = target.status !== 'done';
    const nowIso = new Date().toISOString();

    let updatedTasks = state.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: (nowDone ? 'done' : 'todo') as TaskStatus,
            completedAt: nowDone ? nowIso : null,
          }
        : t
    );

    let updatedHistory = [...state.completionHistory];
    let spawnedRecurringTask: Task | null = null;

    if (nowDone) {
      const histItem: CompletionHistoryItem = {
        id: generateId('ch'),
        taskId: target.id,
        title: target.title,
        projectId: target.projectId,
        priority: target.priority,
        completedAt: nowIso,
        focusMinutes: target.estimatedMinutes ?? 20,
      };
      updatedHistory = [histItem, ...updatedHistory].slice(0, 500);

      // Spawn next occurrence if recurring
      if (target.recurrence !== 'none') {
        const nextDue = getNextRecurringDate(target.dueDate, target.recurrence);
        spawnedRecurringTask = {
          ...target,
          id: generateId('task'),
          status: 'todo',
          dueDate: nextDue,
          completedAt: null,
          createdAt: nowIso,
          subtasks: target.subtasks.map((st) => ({
            ...st,
            id: generateId('sub'),
            completed: false,
          })),
        };
        updatedTasks = [spawnedRecurringTask, ...updatedTasks];
      }
    }

    set((s) => {
      const next = {
        ...s,
        tasks: updatedTasks,
        completionHistory: updatedHistory,
      };
      persistSnapshot(next);
      return {
        tasks: updatedTasks,
        completionHistory: updatedHistory,
      };
    });

    if (nowDone) {
      get().pushToast({
        message: spawnedRecurringTask
          ? `Completed "${target.title}" · Next occurrence scheduled`
          : `Completed "${target.title}"`,
        type: 'success',
        undoAction: () => {
          set((s) => {
            const reverted = s.tasks
              .filter((t) =>
                spawnedRecurringTask ? t.id !== spawnedRecurringTask.id : true
              )
              .map((t) =>
                t.id === taskId
                  ? { ...t, status: target.status, completedAt: null }
                  : t
              );
            const revertedHistory = s.completionHistory.filter(
              (h) => h.taskId !== taskId || h.completedAt !== nowIso
            );
            const next = {
              ...s,
              tasks: reverted,
              completionHistory: revertedHistory,
            };
            persistSnapshot(next);
            return { tasks: reverted, completionHistory: revertedHistory };
          });
        },
      });
    }
  },

  deleteTask: (taskId) => {
    const state = get();
    const target = state.tasks.find((t) => t.id === taskId);
    if (!target) return;

    set((s) => {
      const tasks = s.tasks.filter((t) => t.id !== taskId);
      const selectedTaskId =
        s.selectedTaskId === taskId ? null : s.selectedTaskId;
      const focusedTaskId = s.focusedTaskId === taskId ? null : s.focusedTaskId;
      const next = { ...s, tasks, selectedTaskId, focusedTaskId };
      persistSnapshot(next);
      return { tasks, selectedTaskId, focusedTaskId };
    });

    get().pushToast({
      message: `Deleted "${target.title}"`,
      type: 'warning',
      undoAction: () => {
        set((s) => {
          const tasks = [target, ...s.tasks];
          const next = { ...s, tasks };
          persistSnapshot(next);
          return { tasks };
        });
      },
    });
  },

  duplicateTask: (taskId) => {
    const state = get();
    const target = state.tasks.find((t) => t.id === taskId);
    if (!target) return;
    const copy: Task = {
      ...target,
      id: generateId('task'),
      title: `${target.title} (Copy)`,
      status: 'todo',
      completedAt: null,
      createdAt: new Date().toISOString(),
      subtasks: target.subtasks.map((st) => ({
        ...st,
        id: generateId('sub'),
      })),
    };
    set((s) => {
      const tasks = [copy, ...s.tasks];
      const next = { ...s, tasks, selectedTaskId: copy.id };
      persistSnapshot(next);
      return { tasks, selectedTaskId: copy.id };
    });
    get().pushToast({ message: 'Task duplicated', type: 'info' });
  },

  reorderTasks: (activeId, overId) => {
    if (activeId === overId) return;
    set((s) => {
      const sorted = [...s.tasks].sort((a, b) => a.order - b.order);
      const oldIndex = sorted.findIndex((t) => t.id === activeId);
      const newIndex = sorted.findIndex((t) => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return s;

      const [moved] = sorted.splice(oldIndex, 1);
      sorted.splice(newIndex, 0, moved);
      const reindexed = sorted.map((t, idx) => ({ ...t, order: idx }));

      const next = { ...s, tasks: reindexed };
      persistSnapshot(next);
      return { tasks: reindexed };
    });
  },

  moveTaskStatus: (taskId, newStatus) => {
    const state = get();
    const target = state.tasks.find((t) => t.id === taskId);
    if (!target || target.status === newStatus) return;

    if (newStatus === 'done' && target.status !== 'done') {
      get().toggleTaskComplete(taskId);
      return;
    }

    set((s) => {
      const tasks = s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              completedAt: newStatus === 'done' ? new Date().toISOString() : null,
            }
          : t
      );
      const next = { ...s, tasks };
      persistSnapshot(next);
      return { tasks };
    });
  },

  addSubtask: (taskId, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const newSub: Subtask = {
      id: generateId('sub'),
      title: trimmed,
      completed: false,
    };
    set((s) => {
      const tasks = s.tasks.map((t) =>
        t.id === taskId ? { ...t, subtasks: [...t.subtasks, newSub] } : t
      );
      const next = { ...s, tasks };
      persistSnapshot(next);
      return { tasks };
    });
  },

  toggleSubtask: (taskId, subtaskId) => {
    set((s) => {
      const tasks = s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
              ),
            }
          : t
      );
      const next = { ...s, tasks };
      persistSnapshot(next);
      return { tasks };
    });
  },

  deleteSubtask: (taskId, subtaskId) => {
    set((s) => {
      const tasks = s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.filter((st) => st.id !== subtaskId),
            }
          : t
      );
      const next = { ...s, tasks };
      persistSnapshot(next);
      return { tasks };
    });
  },

  addProject: (name, color, description = '') => {
    const state = get();
    const newProj: Project = {
      id: generateId('proj'),
      workspaceId: state.activeWorkspaceId,
      name: name.trim(),
      color,
      description: description.trim(),
      createdAt: new Date().toISOString(),
    };
    set((s) => {
      const projects = [...s.projects, newProj];
      const next = {
        ...s,
        projects,
        activeFilter: { type: 'project', projectId: newProj.id } as ActiveFilter,
      };
      persistSnapshot(next);
      return {
        projects,
        activeFilter: { type: 'project', projectId: newProj.id },
      };
    });
    get().pushToast({ message: `Project "${newProj.name}" created`, type: 'success' });
    return newProj;
  },

  updateProject: (projectId, patch) => {
    set((s) => {
      const projects = s.projects.map((p) =>
        p.id === projectId ? { ...p, ...patch } : p
      );
      const next = { ...s, projects };
      persistSnapshot(next);
      return { projects };
    });
  },

  deleteProject: (projectId) => {
    set((s) => {
      const projects = s.projects.filter((p) => p.id !== projectId);
      const tasks = s.tasks.map((t) =>
        t.projectId === projectId ? { ...t, projectId: null } : t
      );
      const activeFilter =
        s.activeFilter.type === 'project' &&
        s.activeFilter.projectId === projectId
          ? ({ type: 'nav', view: 'inbox' } as ActiveFilter)
          : s.activeFilter;
      const next = { ...s, projects, tasks, activeFilter };
      persistSnapshot(next);
      return { projects, tasks, activeFilter };
    });
    get().pushToast({ message: 'Project deleted · Tasks moved to Inbox', type: 'info' });
  },

  addLabel: (name, color) => {
    const newLabel: Label = {
      id: generateId('lbl'),
      name: name.trim().toLowerCase().replace(/\s+/g, '-'),
      color,
    };
    set((s) => {
      const labels = [...s.labels, newLabel];
      const next = { ...s, labels };
      persistSnapshot(next);
      return { labels };
    });
    return newLabel;
  },

  // Focus Timer
  setTimerMode: (mode) =>
    set({
      timerMode: mode,
      timerSecondsLeft: TIMER_DURATIONS[mode],
      timerRunning: false,
    }),

  toggleTimer: () => set((s) => ({ timerRunning: !s.timerRunning })),

  resetTimer: () =>
    set((s) => ({
      timerRunning: false,
      timerSecondsLeft: TIMER_DURATIONS[s.timerMode],
    })),

  tickTimer: () => {
    const s = get();
    if (!s.timerRunning) return;
    if (s.timerSecondsLeft > 1) {
      set({ timerSecondsLeft: s.timerSecondsLeft - 1 });
      return;
    }

    // Timer finished!
    const completedFocus = s.timerMode === 'focus';
    const nextSessions = completedFocus
      ? s.focusSessionsCompleted + 1
      : s.focusSessionsCompleted;
    const addedMinutes = completedFocus ? 25 : 0;
    const nextMinutes = s.totalFocusMinutes + addedMinutes;
    const nextMode: TimerMode = completedFocus ? 'shortBreak' : 'focus';

    set((state) => {
      const next = {
        ...state,
        timerRunning: false,
        timerMode: nextMode,
        timerSecondsLeft: TIMER_DURATIONS[nextMode],
        focusSessionsCompleted: nextSessions,
        totalFocusMinutes: nextMinutes,
      };
      persistSnapshot(next);
      return {
        timerRunning: false,
        timerMode: nextMode,
        timerSecondsLeft: TIMER_DURATIONS[nextMode],
        focusSessionsCompleted: nextSessions,
        totalFocusMinutes: nextMinutes,
      };
    });

    get().pushToast({
      message: completedFocus
        ? 'Focus session complete! Take a 5-minute break.'
        : 'Break finished. Ready to focus again.',
      type: 'success',
    });
  },

  startFocusOnTask: (taskId) => {
    set({
      focusedTaskId: taskId,
      timerMode: 'focus',
      timerSecondsLeft: TIMER_DURATIONS.focus,
      timerRunning: true,
    });
    const task = get().tasks.find((t) => t.id === taskId);
    if (task) {
      get().pushToast({
        message: `Focus timer started for "${task.title}"`,
        type: 'info',
      });
    }
  },

  pushToast: (toast) => {
    const id = generateId('toast');
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...toast, id }] }));
    setTimeout(() => {
      get().dismissToast(id);
    }, 5000);
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  exportDataJson: () => {
    const s = get();
    const payload: PersistedAppData = {
      version: CURRENT_SCHEMA_VERSION,
      theme: s.theme,
      activeWorkspaceId: s.activeWorkspaceId,
      workspaces: s.workspaces,
      projects: s.projects,
      labels: s.labels,
      tasks: s.tasks,
      completionHistory: s.completionHistory,
      focusSessionsCompleted: s.focusSessionsCompleted,
      totalFocusMinutes: s.totalFocusMinutes,
    };
    return JSON.stringify(payload, null, 2);
  },

  importDataJson: (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString) as Partial<PersistedAppData>;
      if (
        !parsed ||
        !Array.isArray(parsed.tasks) ||
        !Array.isArray(parsed.workspaces) ||
        parsed.workspaces.length === 0
      ) {
        return false;
      }
      const theme: ThemeMode = parsed.theme === 'light' ? 'light' : 'dark';
      applyThemeClass(theme);

      set((s) => {
        const next: TaskStoreState = {
          ...s,
          version: CURRENT_SCHEMA_VERSION,
          theme,
          activeWorkspaceId:
            parsed.activeWorkspaceId ?? parsed.workspaces![0].id,
          workspaces: parsed.workspaces!,
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          labels: Array.isArray(parsed.labels) ? parsed.labels : [],
          tasks: parsed.tasks!,
          completionHistory: Array.isArray(parsed.completionHistory)
            ? parsed.completionHistory
            : [],
          focusSessionsCompleted: parsed.focusSessionsCompleted ?? 0,
          totalFocusMinutes: parsed.totalFocusMinutes ?? 0,
          selectedTaskId: null,
        };
        persistSnapshot(next);
        return next;
      });
      get().pushToast({ message: 'Workspace backup imported', type: 'success' });
      return true;
    } catch {
      return false;
    }
  },

  resetToSeedData: () => {
    const seed = createSeedData();
    applyThemeClass(seed.theme);
    set((s) => {
      const next: TaskStoreState = {
        ...s,
        ...seed,
        selectedTaskId: null,
        activeFilter: { type: 'nav', view: 'today' },
      };
      persistSnapshot(next);
      return next;
    });
    get().pushToast({ message: 'Sample tasks restored', type: 'info' });
  },

  clearAllTasks: () => {
    set((s) => {
      const next: TaskStoreState = {
        ...s,
        tasks: [],
        completionHistory: [],
        selectedTaskId: null,
      };
      persistSnapshot(next);
      return {
        tasks: [],
        completionHistory: [],
        selectedTaskId: null,
      };
    });
    get().pushToast({ message: 'All tasks cleared', type: 'warning' });
  },
}));
