import React, { useMemo, useState } from 'react';
import { format, isToday } from 'date-fns';
import {
  Inbox,
  Sun,
  CalendarDays,
  CalendarRange,
  BarChart3,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Keyboard,
  Settings,
  Layers,
  Home,
  Briefcase,
  FolderKanban,
  Tag,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { NavView } from '../types/task';
import { Tooltip } from './Tooltip';

interface SidebarProps {
  onCloseMobile?: () => void;
  isDrawer?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onCloseMobile,
  isDrawer = false,
}) => {
  const {
    theme,
    toggleTheme,
    workspaces,
    activeWorkspaceId,
    setActiveWorkspace,
    setWorkspaceModalOpen,
    projects,
    labels,
    tasks,
    activeFilter,
    setActiveFilter,
    sidebarCollapsed,
    toggleSidebar,
    setCommandPaletteOpen,
    setShortcutsModalOpen,
    setSettingsModalOpen,
    openProjectModal,
  } = useTaskStore();

  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [labelsExpanded, setLabelsExpanded] = useState(false);

  const collapsed = isDrawer ? false : sidebarCollapsed;

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const wsTasks = useMemo(
    () => tasks.filter((t) => t.workspaceId === activeWorkspaceId),
    [tasks, activeWorkspaceId]
  );

  const wsProjects = useMemo(
    () => projects.filter((p) => p.workspaceId === activeWorkspaceId),
    [projects, activeWorkspaceId]
  );

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const counts = useMemo(() => {
    const active = wsTasks.filter((t) => t.status !== 'done');
    const inbox = active.filter((t) => t.projectId === null).length;
    const today = active.filter(
      (t) => t.dueDate && (t.dueDate <= todayStr || isToday(new Date(t.dueDate + 'T00:00:00')))
    ).length;
    const upcoming = active.filter((t) => t.dueDate !== null).length;
    const completed = wsTasks.filter((t) => t.status === 'done').length;

    const byProject: Record<string, number> = {};
    for (const p of wsProjects) {
      byProject[p.id] = active.filter((t) => t.projectId === p.id).length;
    }

    const byLabel: Record<string, number> = {};
    for (const l of labels) {
      byLabel[l.id] = active.filter((t) => t.labelIds.includes(l.id)).length;
    }

    return { inbox, today, upcoming, completed, byProject, byLabel };
  }, [wsTasks, wsProjects, labels, todayStr]);

  const navItems: {
    view: NavView;
    label: string;
    icon: React.FC<{ className?: string; strokeWidth?: number }>;
    count?: number;
  }[] = [
    { view: 'inbox', label: 'Inbox', icon: Inbox, count: counts.inbox },
    { view: 'today', label: 'Today', icon: Sun, count: counts.today },
    { view: 'upcoming', label: 'Upcoming', icon: CalendarRange, count: counts.upcoming },
    { view: 'calendar', label: 'Calendar', icon: CalendarDays },
    { view: 'analytics', label: 'Analytics', icon: BarChart3 },
    { view: 'completed', label: 'Completed', icon: CheckCircle2, count: counts.completed },
  ];

  const handleSelectNav = (view: NavView) => {
    setActiveFilter({ type: 'nav', view });
    onCloseMobile?.();
  };

  const renderWorkspaceIcon = (iconName: string) => {
    if (iconName === 'Home') return <Home className="w-4 h-4" strokeWidth={1.5} />;
    if (iconName === 'Briefcase') return <Briefcase className="w-4 h-4" strokeWidth={1.5} />;
    return <Layers className="w-4 h-4" strokeWidth={1.5} />;
  };

  return (
    <aside
      aria-label="Primary Sidebar"
      className={`surface-sidebar h-full flex flex-col border-r border-slate-200/80 dark:border-white/[0.08] select-none transition-[width] duration-200 ease-out ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
      {/* Top Brand Bar */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} h-14 shrink-0 border-b border-slate-200/70 dark:border-white/[0.06]`}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg primary-gradient flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
              T
            </div>
            <span className="font-bold text-[15px] tracking-tight text-slate-900 dark:text-[#F1F5F9] whitespace-nowrap">
              TaskFlow
            </span>
            <span className="primary-gradient text-[10px] font-bold tracking-wider uppercase text-white px-1.5 py-0.5 rounded-md leading-none shrink-0">
              PRO
            </span>
          </div>
        )}

        {isDrawer ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        ) : (
          <Tooltip
            content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            shortcut="["
            position="right"
          >
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <PanelLeftClose className="w-4 h-4" strokeWidth={1.5} />
              )}
            </button>
          </Tooltip>
        )}
      </div>

      {/* Workspace Switcher */}
      <div className={`px-3 pt-3 pb-2 relative ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <Tooltip content={`Workspace: ${activeWorkspace?.name}`} position="right">
            <button
              type="button"
              onClick={() => setWsDropdownOpen((v) => !v)}
              aria-label={`Switch workspace (${activeWorkspace?.name})`}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {renderWorkspaceIcon(activeWorkspace?.icon || 'Layers')}
            </button>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={() => setWsDropdownOpen((v) => !v)}
            aria-expanded={wsDropdownOpen}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.07] hover:bg-slate-200/60 dark:hover:bg-white/[0.07] transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-6 h-6 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                {renderWorkspaceIcon(activeWorkspace?.icon || 'Layers')}
              </span>
              <span className="text-[13px] font-semibold text-slate-900 dark:text-[#F1F5F9] truncate">
                {activeWorkspace?.name}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-[#94A3B8] shrink-0" strokeWidth={1.5} />
          </button>
        )}

        {wsDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setWsDropdownOpen(false)}
            />
            <div className="absolute left-3 right-3 top-full mt-1 z-40 surface-elevated rounded-xl p-1.5 min-w-[210px]">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                Workspaces
              </div>
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      setActiveWorkspace(ws.id);
                      setWsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isActive
                        ? 'bg-indigo-500/12 text-indigo-600 dark:text-indigo-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {renderWorkspaceIcon(ws.icon)}
                      <span className="truncate">{ws.name}</span>
                    </span>
                    {isActive && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />}
                  </button>
                );
              })}
              <div className="my-1 border-t border-slate-200 dark:border-white/[0.08]" />
              <button
                type="button"
                onClick={() => {
                  setWsDropdownOpen(false);
                  setWorkspaceModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Create workspace</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Search with ⌘K hint */}
      <div className={`px-3 pb-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <Tooltip content="Search & Commands" shortcut="⌘K" position="right">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Open search and command palette"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Search className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[13px] text-slate-500 dark:text-[#94A3B8] bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.15] hover:text-slate-800 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
              <span>Search tasks...</span>
            </span>
            <kbd className="font-mono-tabular text-[11px] px-1.5 py-0.5 rounded bg-white dark:bg-white/[0.07] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 shrink-0">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto px-2.5 space-y-5 pb-4">
        {/* Core Views */}
        <nav className="space-y-0.5" aria-label="Task Views">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeFilter.type === 'nav' && activeFilter.view === item.view;

            const buttonContent = (
              <button
                key={item.view}
                type="button"
                onClick={() => handleSelectNav(item.view)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center px-0 h-10' : 'justify-between px-3 py-2'
                } rounded-xl text-[13.5px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isActive
                    ? 'primary-gradient text-white shadow-sm'
                    : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] hover:bg-slate-100/90 dark:hover:bg-white/[0.05]'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : ''
                    }`}
                    strokeWidth={1.5}
                  />
                  {!collapsed && (
                    <span className="truncate whitespace-nowrap">{item.label}</span>
                  )}
                </span>
                {!collapsed && typeof item.count === 'number' && item.count > 0 && (
                  <span
                    className={`font-mono-tabular text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-slate-500 dark:text-[#94A3B8]'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );

            return collapsed ? (
              <Tooltip key={item.view} content={item.label} position="right">
                {buttonContent}
              </Tooltip>
            ) : (
              buttonContent
            );
          })}
        </nav>

        {/* Projects Section */}
        {!collapsed && (
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <button
                type="button"
                onClick={() => setProjectsExpanded((v) => !v)}
                className="flex items-center gap-1 section-label hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
              >
                {projectsExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                )}
                <span>Projects</span>
              </button>
              <Tooltip content="New project" position="right">
                <button
                  type="button"
                  onClick={() => openProjectModal(null)}
                  aria-label="Create new project"
                  className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </Tooltip>
            </div>

            {projectsExpanded && (
              <div className="space-y-0.5">
                {wsProjects.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => openProjectModal(null)}
                    className="w-full text-left px-3 py-2 text-[12px] text-slate-500 dark:text-[#94A3B8] hover:text-indigo-500 rounded-lg"
                  >
                    + Add your first project
                  </button>
                ) : (
                  wsProjects.map((project) => {
                    const isActive =
                      activeFilter.type === 'project' &&
                      activeFilter.projectId === project.id;
                    const count = counts.byProject[project.id] || 0;
                    return (
                      <div
                        key={project.id}
                        className={`group flex items-center justify-between rounded-xl transition-colors ${
                          isActive
                            ? 'primary-gradient-subtle text-indigo-700 dark:text-indigo-300 font-semibold'
                            : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] hover:bg-slate-100/90 dark:hover:bg-white/[0.05]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveFilter({ type: 'project', projectId: project.id });
                            onCloseMobile?.();
                          }}
                          className="flex-1 flex items-center gap-2.5 px-3 py-2 text-[13px] min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="truncate">{project.name}</span>
                        </button>
                        <div className="flex items-center pr-2 gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openProjectModal(project.id);
                            }}
                            aria-label={`Edit ${project.name}`}
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-opacity"
                          >
                            <Pencil className="w-3 h-3" strokeWidth={1.5} />
                          </button>
                          {count > 0 && (
                            <span className="font-mono-tabular text-[11px] text-slate-500 dark:text-[#94A3B8] px-1">
                              {count}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {collapsed && (
          <div className="flex flex-col items-center gap-1 pt-2 border-t border-slate-200/70 dark:border-white/[0.06]">
            <Tooltip content="New project" position="right">
              <button
                type="button"
                onClick={() => openProjectModal(null)}
                aria-label="New project"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]"
              >
                <FolderKanban className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </Tooltip>
          </div>
        )}

        {/* Labels Section */}
        {!collapsed && (
          <div>
            <button
              type="button"
              onClick={() => setLabelsExpanded((v) => !v)}
              className="flex items-center gap-1 px-2 mb-1.5 section-label hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
            >
              {labelsExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              )}
              <span>Labels</span>
            </button>
            {labelsExpanded && (
              <div className="space-y-0.5">
                {labels.map((label) => {
                  const isActive =
                    activeFilter.type === 'label' &&
                    activeFilter.labelId === label.id;
                  const count = counts.byLabel[label.id] || 0;
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => {
                        setActiveFilter({ type: 'label', labelId: label.id });
                        onCloseMobile?.();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isActive
                          ? 'primary-gradient-subtle text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] hover:bg-slate-100/90 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Tag
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: label.color }}
                          strokeWidth={1.5}
                        />
                        <span className="truncate">#{label.name}</span>
                      </span>
                      {count > 0 && (
                        <span className="font-mono-tabular text-[11px] text-slate-500 dark:text-[#94A3B8]">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Controls */}
      <div
        className={`border-t border-slate-200/70 dark:border-white/[0.06] p-2.5 flex ${
          collapsed ? 'flex-col items-center gap-1' : 'items-center justify-between gap-1'
        }`}
      >
        <Tooltip
          content={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
          shortcut="T"
          position={collapsed ? 'right' : 'top'}
        >
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[12.5px] font-medium text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" strokeWidth={1.5} />
            )}
            {!collapsed && <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
          </button>
        </Tooltip>

        <div className={`flex items-center ${collapsed ? 'flex-col gap-1' : 'gap-1'}`}>
          <Tooltip
            content="Keyboard shortcuts"
            shortcut="?"
            position={collapsed ? 'right' : 'top'}
          >
            <button
              type="button"
              onClick={() => setShortcutsModalOpen(true)}
              aria-label="Keyboard shortcuts"
              className="p-2 rounded-xl text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Keyboard className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </Tooltip>
          <Tooltip
            content="Data & Settings"
            position={collapsed ? 'right' : 'top'}
          >
            <button
              type="button"
              onClick={() => setSettingsModalOpen(true)}
              aria-label="Settings and data backup"
              className="p-2 rounded-xl text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Settings className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
};
