import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Sun,
  Moon,
  Inbox,
  CalendarRange,
  CalendarDays,
  BarChart3,
  CheckCircle2,
  Plus,
  LayoutGrid,
  List,
  Keyboard,
  Play,
  Folder,
  ArrowRight,
} from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { PRIORITY_CONFIG } from './PriorityBadge';

interface CommandItem {
  id: string;
  group: 'Actions' | 'Views' | 'Projects' | 'Tasks';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    tasks,
    projects,
    activeWorkspaceId,
    theme,
    toggleTheme,
    layoutMode,
    setLayoutMode,
    setActiveFilter,
    selectTask,
    setQuickAddModalOpen,
    setShortcutsModalOpen,
    toggleTimer,
  } = useTaskStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [commandPaletteOpen]);

  const wsProjects = useMemo(
    () => projects.filter((p) => p.workspaceId === activeWorkspaceId),
    [projects, activeWorkspaceId]
  );

  const wsTasks = useMemo(
    () => tasks.filter((t) => t.workspaceId === activeWorkspaceId),
    [tasks, activeWorkspaceId]
  );

  const allItems = useMemo<CommandItem[]>(() => {
    const close = () => setCommandPaletteOpen(false);

    const actions: CommandItem[] = [
      {
        id: 'act-new-task',
        group: 'Actions',
        title: 'Create New Task',
        subtitle: 'Open quick-add with natural language dates',
        icon: <Plus className="w-4 h-4 text-indigo-500" strokeWidth={1.5} />,
        shortcut: 'N',
        onSelect: () => {
          close();
          setQuickAddModalOpen(true);
        },
      },
      {
        id: 'act-theme',
        group: 'Actions',
        title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`,
        icon:
          theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" strokeWidth={1.5} />
          ),
        shortcut: 'T',
        onSelect: () => {
          toggleTheme();
          close();
        },
      },
      {
        id: 'act-layout',
        group: 'Actions',
        title: `Switch to ${layoutMode === 'list' ? 'Board (Kanban)' : 'List'} Layout`,
        icon:
          layoutMode === 'list' ? (
            <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
          ) : (
            <List className="w-4 h-4" strokeWidth={1.5} />
          ),
        shortcut: 'V',
        onSelect: () => {
          setLayoutMode(layoutMode === 'list' ? 'board' : 'list');
          close();
        },
      },
      {
        id: 'act-timer',
        group: 'Actions',
        title: 'Start / Pause Focus Timer',
        icon: <Play className="w-4 h-4 text-[#22C55E]" strokeWidth={1.5} />,
        onSelect: () => {
          toggleTimer();
          close();
        },
      },
      {
        id: 'act-shortcuts',
        group: 'Actions',
        title: 'View Keyboard Shortcuts',
        icon: <Keyboard className="w-4 h-4" strokeWidth={1.5} />,
        shortcut: '?',
        onSelect: () => {
          close();
          setShortcutsModalOpen(true);
        },
      },
    ];

    const views: CommandItem[] = [
      {
        id: 'view-inbox',
        group: 'Views',
        title: 'Go to Inbox',
        icon: <Inbox className="w-4 h-4" strokeWidth={1.5} />,
        shortcut: 'G I',
        onSelect: () => {
          setActiveFilter({ type: 'nav', view: 'inbox' });
          close();
        },
      },
      {
        id: 'view-today',
        group: 'Views',
        title: 'Go to Today',
        icon: <Sun className="w-4 h-4" strokeWidth={1.5} />,
        shortcut: 'G T',
        onSelect: () => {
          setActiveFilter({ type: 'nav', view: 'today' });
          close();
        },
      },
      {
        id: 'view-upcoming',
        group: 'Views',
        title: 'Go to Upcoming',
        icon: <CalendarRange className="w-4 h-4" strokeWidth={1.5} />,
        shortcut: 'G U',
        onSelect: () => {
          setActiveFilter({ type: 'nav', view: 'upcoming' });
          close();
        },
      },
      {
        id: 'view-calendar',
        group: 'Views',
        title: 'Go to Calendar',
        icon: <CalendarDays className="w-4 h-4" strokeWidth={1.5} />,
        shortcut: 'G C',
        onSelect: () => {
          setActiveFilter({ type: 'nav', view: 'calendar' });
          close();
        },
      },
      {
        id: 'view-analytics',
        group: 'Views',
        title: 'Go to Analytics',
        icon: <BarChart3 className="w-4 h-4" strokeWidth={1.5} />,
        shortcut: 'G A',
        onSelect: () => {
          setActiveFilter({ type: 'nav', view: 'analytics' });
          close();
        },
      },
      {
        id: 'view-completed',
        group: 'Views',
        title: 'Go to Completed Archive',
        icon: <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />,
        onSelect: () => {
          setActiveFilter({ type: 'nav', view: 'completed' });
          close();
        },
      },
    ];

    const projItems: CommandItem[] = wsProjects.map((p) => ({
      id: `proj-${p.id}`,
      group: 'Projects',
      title: p.name,
      subtitle: 'Project',
      icon: (
        <Folder className="w-4 h-4" style={{ color: p.color }} strokeWidth={1.5} />
      ),
      onSelect: () => {
        setActiveFilter({ type: 'project', projectId: p.id });
        close();
      },
    }));

    const taskItems: CommandItem[] = wsTasks.map((t) => {
      const cfg = PRIORITY_CONFIG[t.priority];
      const Icon = cfg.icon;
      const pName = wsProjects.find((p) => p.id === t.projectId)?.name || 'Inbox';
      return {
        id: `task-${t.id}`,
        group: 'Tasks',
        title: t.title,
        subtitle: `${pName} · ${cfg.label}${t.status === 'done' ? ' · Done' : ''}`,
        icon: <Icon className={`w-4 h-4 ${cfg.colorClass}`} strokeWidth={1.5} />,
        onSelect: () => {
          selectTask(t.id);
          close();
        },
      };
    });

    return [...actions, ...views, ...projItems, ...taskItems];
  }, [
    wsProjects,
    wsTasks,
    theme,
    layoutMode,
    setCommandPaletteOpen,
    setQuickAddModalOpen,
    toggleTheme,
    setLayoutMode,
    toggleTimer,
    setShortcutsModalOpen,
    setActiveFilter,
    selectTask,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems.slice(0, 14);
    return allItems
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
          item.group.toLowerCase().includes(q)
      )
      .slice(0, 16);
  }, [allItems, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!commandPaletteOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) =>
        filtered.length ? (i - 1 + filtered.length) % filtered.length : 0
      );
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].onSelect();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCommandPaletteOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        onClick={() => setCommandPaletteOpen(false)}
      />
      <div className="relative z-10 w-full max-w-xl surface-elevated rounded-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-white/[0.08]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, jump to views, or run commands..."
            className="flex-1 bg-transparent text-[14px] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="font-mono-tabular text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.08] text-slate-500 dark:text-slate-300">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[55vh] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-slate-500 dark:text-[#94A3B8]">
              No matching tasks or commands for "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const active = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={item.onSelect}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    active
                      ? 'bg-indigo-500/12 text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-medium truncate">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[11.5px] text-slate-500 dark:text-[#94A3B8] truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400 dark:text-[#64748B]">
                      {item.group}
                    </span>
                    {item.shortcut ? (
                      <kbd className="font-mono-tabular text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.08] text-slate-500 dark:text-slate-300">
                        {item.shortcut}
                      </kbd>
                    ) : (
                      active && (
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500" strokeWidth={1.5} />
                      )
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
