import React from 'react';
import { AlertCircle, ArrowUp, Minus, ArrowDown } from 'lucide-react';
import { Priority } from '../types/task';

export const PRIORITY_CONFIG: Record<
  Priority,
  {
    label: string;
    shortLabel: string;
    colorClass: string;
    dotColor: string;
    icon: React.FC<{ className?: string; strokeWidth?: number }>;
  }
> = {
  urgent: {
    label: 'Urgent',
    shortLabel: 'P1',
    colorClass: 'text-[#EF4444]',
    dotColor: '#EF4444',
    icon: AlertCircle,
  },
  high: {
    label: 'High',
    shortLabel: 'P2',
    colorClass: 'text-[#F59E0B]',
    dotColor: '#F59E0B',
    icon: ArrowUp,
  },
  medium: {
    label: 'Medium',
    shortLabel: 'P3',
    colorClass: 'text-indigo-500 dark:text-indigo-400',
    dotColor: '#6366F1',
    icon: Minus,
  },
  low: {
    label: 'Low',
    shortLabel: 'P4',
    colorClass: 'text-slate-500 dark:text-slate-400',
    dotColor: '#64748B',
    icon: ArrowDown,
  },
};

export const PriorityIndicator: React.FC<{
  priority: Priority;
  compact?: boolean;
}> = ({ priority, compact = false }) => {
  const cfg = PRIORITY_CONFIG[priority];
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[12px] font-medium whitespace-nowrap shrink-0 ${cfg.colorClass}`}
      title={`Priority: ${cfg.label}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
      <span>{compact ? cfg.shortLabel : cfg.label}</span>
    </span>
  );
};
