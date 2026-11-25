import React, { useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import {
  Menu,
  Plus,
  LayoutGrid,
  List,
  ArrowUpDown,
  Filter,
  Search,
  Sun,
  Moon,
} from 'lucide-react';
import { useTaskStore } from './store/useTaskStore';
import { Priority, SortBy } from './types/task';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { QuickAddBar } from './components/QuickAddBar';
import { TaskListView } from './components/TaskListView';
import { BoardView } from './components/BoardView';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { RightPanel } from './components/RightPanel';
import { CommandPalette } from './components/CommandPalette';
import { Modals } from './components/Modals';
import { ToastContainer } from './components/ToastContainer';
import { ProgressRing } from './components/ProgressRing';
import { Tooltip } from './components/Tooltip';

const PRIORITY_RANK: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function App() {
  const {
    theme,
    toggleTheme,
    tasks,
    projects,
    labels,
    activeWorkspaceId,
    activeFilter,
    layoutMode,
    setLayoutMode,
    sortBy,
    setSortBy,
    priorityFilter,
    setPriorityFilter,
    searchQuery,
    setSearchQuery,
    selectedTaskId,
    selectTask,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    commandPaletteOpen,
    setCommandPaletteOpen,
    quickAddModalOpen,
    setQuickAddModalOpen,
    shortcutsModalOpen,
    setShortcutsModalOpen,
    settingsModalOpen,
    setSettingsModalOpen,
    projectModalOpen,
    closeProjectModal,
    workspaceModalOpen,
    setWorkspaceModalOpen,
    toggleSidebar,
    timerRunning,
    timerSecondsLeft,
    tickTimer,
  } = useTaskStore();

  const quickAddContainerRef = useRef<HTMLDivElement>(null);

  // Focus timer 1s tick
  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      tickTimer();
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, tickTimer]);

  // Update document title when focus timer is active
  useEffect(() => {
    if (timerRunning) {
      const m = Math.floor(timerSecondsLeft / 60);
      const s = timerSecondsLeft % 60;
      document.title = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} — TaskFlow Pro`;
    } else {
      document.title = 'TaskFlow Pro — Smart Task Manager';
    }
  }, [timerRunning, timerSecondsLeft]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // Cmd/Ctrl + K always opens Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
        return;
      }

      if (e.key === 'Escape') {
        if (commandPaletteOpen) setCommandPaletteOpen(false);
        else if (quickAddModalOpen) setQuickAddModalOpen(false);
        else if (shortcutsModalOpen) setShortcutsModalOpen(false);
        else if (settingsModalOpen) setSettingsModalOpen(false);
        else if (projectModalOpen) closeProjectModal();
        else if (workspaceModalOpen) setWorkspaceModalOpen(false);
        else if (mobileDrawerOpen) setMobileDrawerOpen(false);
        else if (selectedTaskId) selectTask(null);
        return;
      }

      if (isEditing) return;

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setQuickAddModalOpen(true);
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        toggleTheme();
      } else if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setLayoutMode(layoutMode === 'list' ? 'board' : 'list');
      } else if (e.key === '[') {
        e.preventDefault();
        toggleSidebar();
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    commandPaletteOpen,
    quickAddModalOpen,
    shortcutsModalOpen,
    settingsModalOpen,
    projectModalOpen,
    workspaceModalOpen,
    mobileDrawerOpen,
    selectedTaskId,
    layoutMode,
    setCommandPaletteOpen,
    setQuickAddModalOpen,
    setShortcutsModalOpen,
    setSettingsModalOpen,
    closeProjectModal,
    setWorkspaceModalOpen,
    setMobileDrawerOpen,
    selectTask,
    toggleTheme,
    setLayoutMode,
    toggleSidebar,
  ]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const wsTasks = useMemo(
    () => tasks.filter((t) => t.workspaceId === activeWorkspaceId),
    [tasks, activeWorkspaceId]
  );

  // Header Metadata
  const viewHeader = useMemo(() => {
    if (activeFilter.type === 'project') {
      const proj = projects.find((p) => p.id === activeFilter.projectId);
      return {
        title: proj?.name || 'Project',
        subtitle: proj?.description || 'Project workspace',
        color: proj?.color,
      };
    }
    if (activeFilter.type === 'label') {
      const lbl = labels.find((l) => l.id === activeFilter.labelId);
      return {
        title: lbl ? `#${lbl.name}` : 'Label',
        subtitle: 'Filtered by label',
        color: lbl?.color,
      };
    }

    switch (activeFilter.view) {
      case 'inbox':
        return {
          title: 'Inbox',
          subtitle: 'Unassigned tasks waiting to be organized',
        };
      case 'today':
        return {
          title: 'Today',
          subtitle: format(new Date(), 'EEEE, MMMM d'),
        };
      case 'upcoming':
        return {
          title: 'Upcoming',
          subtitle: 'Scheduled tasks ordered chronologically',
        };
      case 'calendar':
        return {
          title: 'Calendar',
          subtitle: 'Monthly and weekly schedule overview',
        };
      case 'analytics':
        return {
          title: 'Analytics',
          subtitle: 'Velocity, streaks, and deep focus breakdown',
        };
      case 'completed':
        return {
          title: 'Completed',
          subtitle: 'Archive of finished tasks',
        };
    }
  }, [activeFilter, projects, labels]);

  // Filtered & Sorted Tasks for current view
  const visibleTasks = useMemo(() => {
    let list = wsTasks;

    if (activeFilter.type === 'project') {
      list = list.filter((t) => t.projectId === activeFilter.projectId);
    } else if (activeFilter.type === 'label') {
      list = list.filter((t) => t.labelIds.includes(activeFilter.labelId));
    } else {
      switch (activeFilter.view) {
        case 'inbox':
          list = list.filter((t) => t.projectId === null);
          break;
        case 'today':
          list = list.filter(
            (t) =>
              (t.dueDate && t.dueDate <= todayStr) ||
              (t.status === 'done' &&
                t.completedAt &&
                format(new Date(t.completedAt), 'yyyy-MM-dd') === todayStr)
          );
          break;
        case 'upcoming':
          list = list.filter((t) => t.dueDate !== null && t.status !== 'done');
          break;
        case 'completed':
          list = list.filter((t) => t.status === 'done');
          break;
        default:
          break;
      }
    }

    if (priorityFilter !== 'all') {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'priority') {
        const diff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        return diff !== 0 ? diff : a.order - b.order;
      }
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return a.order - b.order;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === 'createdAt') {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return a.order - b.order;
    });

    return sorted;
  }, [wsTasks, activeFilter, priorityFilter, searchQuery, sortBy, todayStr]);

  // Progress Ring Stats for Today or Project view
  const headerProgress = useMemo(() => {
    if (activeFilter.type === 'nav' && activeFilter.view === 'today') {
      const relevant = wsTasks.filter(
        (t) =>
          t.dueDate === todayStr ||
          (t.status === 'done' &&
            t.completedAt &&
            format(new Date(t.completedAt), 'yyyy-MM-dd') === todayStr)
      );
      const done = relevant.filter((t) => t.status === 'done').length;
      return relevant.length > 0 ? Math.round((done / relevant.length) * 100) : 0;
    }
    if (activeFilter.type === 'project') {
      const relevant = wsTasks.filter(
        (t) => t.projectId === activeFilter.projectId
      );
      const done = relevant.filter((t) => t.status === 'done').length;
      return relevant.length > 0 ? Math.round((done / relevant.length) * 100) : 0;
    }
    return null;
  }, [activeFilter, wsTasks, todayStr]);

  const isCalendar =
    activeFilter.type === 'nav' && activeFilter.view === 'calendar';
  const isAnalytics =
    activeFilter.type === 'nav' && activeFilter.view === 'analytics';
  const isCompleted =
    activeFilter.type === 'nav' && activeFilter.view === 'completed';

  const defaultQuickAddProject =
    activeFilter.type === 'project' ? activeFilter.projectId : null;
  const defaultQuickAddDueDate =
    activeFilter.type === 'nav' && activeFilter.view === 'today'
      ? todayStr
      : null;

  const focusInlineQuickAdd = () => {
    const input = quickAddContainerRef.current?.querySelector('input');
    if (input) {
      input.focus();
    } else {
      setQuickAddModalOpen(true);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden surface-canvas flex text-slate-900 dark:text-[#F1F5F9]">
      {/* Desktop Left Sidebar */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar />
      </div>

      {/* Tablet / Mobile Drawer Sidebar */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 h-full">
            <Sidebar
              isDrawer
              onCloseMobile={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Center Content Column */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Utility Bar */}
        <header className="h-14 px-4 sm:px-6 border-b border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {/* Quick Inline Search Filter */}
            {!isAnalytics && !isCalendar && (
              <div className="relative flex items-center w-full max-w-xs sm:w-64">
                <Search
                  className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none"
                  strokeWidth={1.5}
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter current view..."
                  aria-label="Filter tasks in current view"
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-[13px] bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.07] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-none focus:border-indigo-500/60"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Tooltip
              content={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              shortcut="T"
              position="bottom"
            >
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/[0.06]"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600" strokeWidth={1.5} />
                )}
              </button>
            </Tooltip>

            <button
              type="button"
              onClick={() => setQuickAddModalOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl primary-gradient text-white text-[13px] font-semibold shadow-sm hover:opacity-95 active:scale-[0.98] transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span>Add Task</span>
            </button>
          </div>
        </header>

        {/* Scrollable Workspace Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-28 md:pb-10">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {headerProgress !== null && (
                  <ProgressRing value={headerProgress} size={46} strokeWidth={4} />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    {viewHeader.color && (
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: viewHeader.color }}
                      />
                    )}
                    <h1 className="text-[28px] font-bold tracking-tight leading-tight text-slate-900 dark:text-[#F1F5F9] truncate">
                      {viewHeader.title}
                    </h1>
                  </div>
                  <p className="mt-0.5 text-[13px] text-slate-500 dark:text-[#94A3B8]">
                    {viewHeader.subtitle}
                  </p>
                </div>
              </div>

              {/* View Controls (List/Board, Priority Filter, Sort) */}
              {!isCalendar && !isAnalytics && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Priority Filter */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.07] text-[12px]">
                    <Filter
                      className="w-3.5 h-3.5 text-slate-400"
                      strokeWidth={1.5}
                    />
                    <select
                      aria-label="Filter by priority"
                      value={priorityFilter}
                      onChange={(e) =>
                        setPriorityFilter(e.target.value as Priority | 'all')
                      }
                      className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="all" className="bg-white dark:bg-[#141B2D]">
                        All priorities
                      </option>
                      <option value="urgent" className="bg-white dark:bg-[#141B2D]">
                        Urgent
                      </option>
                      <option value="high" className="bg-white dark:bg-[#141B2D]">
                        High
                      </option>
                      <option value="medium" className="bg-white dark:bg-[#141B2D]">
                        Medium
                      </option>
                      <option value="low" className="bg-white dark:bg-[#141B2D]">
                        Low
                      </option>
                    </select>
                  </div>

                  {/* Sort Order */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.07] text-[12px]">
                    <ArrowUpDown
                      className="w-3.5 h-3.5 text-slate-400"
                      strokeWidth={1.5}
                    />
                    <select
                      aria-label="Sort tasks"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortBy)}
                      className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="manual" className="bg-white dark:bg-[#141B2D]">
                        Manual order
                      </option>
                      <option value="priority" className="bg-white dark:bg-[#141B2D]">
                        Priority
                      </option>
                      <option value="dueDate" className="bg-white dark:bg-[#141B2D]">
                        Due date
                      </option>
                      <option value="createdAt" className="bg-white dark:bg-[#141B2D]">
                        Newest
                      </option>
                    </select>
                  </div>

                  {/* List vs Board Toggle */}
                  {!isCompleted && (
                    <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.07]">
                      <Tooltip content="List view" shortcut="V" position="bottom">
                        <button
                          type="button"
                          onClick={() => setLayoutMode('list')}
                          aria-label="List view"
                          className={`p-1.5 rounded-lg transition-colors ${
                            layoutMode === 'list'
                              ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs'
                              : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <List className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </Tooltip>
                      <Tooltip content="Board view" shortcut="V" position="bottom">
                        <button
                          type="button"
                          onClick={() => setLayoutMode('board')}
                          aria-label="Kanban board view"
                          className={`p-1.5 rounded-lg transition-colors ${
                            layoutMode === 'board'
                              ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs'
                              : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Inline Quick-Add Bar on task list views */}
            {!isCalendar && !isAnalytics && !isCompleted && (
              <div ref={quickAddContainerRef}>
                <QuickAddBar
                  defaultProjectId={defaultQuickAddProject}
                  defaultDueDate={defaultQuickAddDueDate}
                  compact
                />
              </div>
            )}

            {/* Main View Switcher */}
            {isCalendar ? (
              <CalendarView />
            ) : isAnalytics ? (
              <AnalyticsView />
            ) : layoutMode === 'board' && !isCompleted ? (
              <BoardView tasks={visibleTasks} />
            ) : (
              <TaskListView
                tasks={visibleTasks}
                onFocusQuickAdd={focusInlineQuickAdd}
              />
            )}
          </div>
        </div>
      </main>

      {/* Right Contextual Panel (3rd Column on Desktop / Drawer on Tablet & Mobile) */}
      <RightPanel />

      {/* Mobile Bottom Tab Bar + Floating '+' */}
      <MobileNav />

      {/* Overlays & Notifications */}
      <CommandPalette />
      <Modals />
      <ToastContainer />
    </div>
  );
}

export default App;
