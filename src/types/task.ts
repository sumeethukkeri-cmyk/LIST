export type ThemeMode = 'dark' | 'light';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export type NavView =
  | 'inbox'
  | 'today'
  | 'upcoming'
  | 'calendar'
  | 'analytics'
  | 'completed';

export type ActiveFilter =
  | { type: 'nav'; view: NavView }
  | { type: 'project'; projectId: string }
  | { type: 'label'; labelId: string };

export type LayoutMode = 'list' | 'board';

export type SortBy = 'manual' | 'priority' | 'dueDate' | 'createdAt';

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  workspaceId: string;
  projectId: string | null; // null = Inbox
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null; // YYYY-MM-DD
  dueTime: string | null; // HH:mm
  recurrence: Recurrence;
  estimatedMinutes: number | null;
  labelIds: string[];
  subtasks: Subtask[];
  order: number;
  createdAt: string;
  completedAt: string | null;
}

export interface CompletionHistoryItem {
  id: string;
  taskId: string;
  title: string;
  projectId: string | null;
  priority: Priority;
  completedAt: string; // ISO string
  focusMinutes?: number;
}

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PersistedAppData {
  version: number;
  theme: ThemeMode;
  activeWorkspaceId: string;
  workspaces: Workspace[];
  projects: Project[];
  labels: Label[];
  tasks: Task[];
  completionHistory: CompletionHistoryItem[];
  focusSessionsCompleted: number;
  totalFocusMinutes: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  undoAction?: () => void;
}
