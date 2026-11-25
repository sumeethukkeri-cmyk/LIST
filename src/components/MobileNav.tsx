import React from 'react';
import {
  Inbox,
  Sun,
  CalendarRange,
  CalendarDays,
  BarChart3,
  Plus,
} from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { NavView } from '../types/task';

export const MobileNav: React.FC = () => {
  const activeFilter = useTaskStore((s) => s.activeFilter);
  const setActiveFilter = useTaskStore((s) => s.setActiveFilter);
  const setQuickAddModalOpen = useTaskStore((s) => s.setQuickAddModalOpen);

  const tabs: {
    view: NavView;
    label: string;
    icon: React.FC<{ className?: string; strokeWidth?: number }>;
  }[] = [
    { view: 'inbox', label: 'Inbox', icon: Inbox },
    { view: 'today', label: 'Today', icon: Sun },
    { view: 'upcoming', label: 'Upcoming', icon: CalendarRange },
    { view: 'calendar', label: 'Calendar', icon: CalendarDays },
    { view: 'analytics', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <>
      {/* Floating '+' Action Button */}
      <button
        type="button"
        onClick={() => setQuickAddModalOpen(true)}
        aria-label="Create new task"
        className="md:hidden fixed right-4 bottom-20 z-30 w-13 h-13 rounded-full primary-gradient text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
      >
        <Plus className="w-6 h-6" strokeWidth={2} />
      </button>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 h-16 surface-sidebar border-t border-slate-200 dark:border-white/[0.08] px-1 flex items-center justify-around"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeFilter.type === 'nav' && activeFilter.view === tab.view;
          return (
            <button
              key={tab.view}
              type="button"
              onClick={() => setActiveFilter({ type: 'nav', view: tab.view })}
              className={`min-w-[56px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 dark:text-[#94A3B8]'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-[11px] leading-none whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
