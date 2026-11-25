import React, { useMemo } from 'react';
import { format, parseISO, subDays, startOfDay } from 'date-fns';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
} from 'recharts';
import { CheckCircle2, Flame, Target, Timer } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { PRIORITY_CONFIG } from './PriorityBadge';
import { Priority } from '../types/task';

export const AnalyticsView: React.FC = () => {
  const {
    tasks,
    projects,
    activeWorkspaceId,
    completionHistory,
    totalFocusMinutes,
    focusSessionsCompleted,
    theme,
  } = useTaskStore();

  const wsTasks = useMemo(
    () => tasks.filter((t) => t.workspaceId === activeWorkspaceId),
    [tasks, activeWorkspaceId]
  );

  const wsProjects = useMemo(
    () => projects.filter((p) => p.workspaceId === activeWorkspaceId),
    [projects, activeWorkspaceId]
  );

  // 14-day completion trend
  const dailyTrendData = useMemo(() => {
    const today = startOfDay(new Date());
    const days: { dateKey: string; label: string; completed: number; focus: number }[] = [];

    for (let i = 13; i >= 0; i--) {
      const d = subDays(today, i);
      const key = format(d, 'yyyy-MM-dd');
      const items = completionHistory.filter(
        (h) => format(parseISO(h.completedAt), 'yyyy-MM-dd') === key
      );
      days.push({
        dateKey: key,
        label: format(d, 'MMM d'),
        completed: items.length,
        focus: items.reduce((acc, item) => acc + (item.focusMinutes || 0), 0),
      });
    }
    return days;
  }, [completionHistory]);

  // Calculate streak (consecutive days with >= 1 completed task ending today or yesterday)
  const streak = useMemo(() => {
    const daySet = new Set(
      completionHistory.map((h) =>
        format(parseISO(h.completedAt), 'yyyy-MM-dd')
      )
    );
    let count = 0;
    let cursor = startOfDay(new Date());
    if (!daySet.has(format(cursor, 'yyyy-MM-dd'))) {
      cursor = subDays(cursor, 1);
    }
    while (daySet.has(format(cursor, 'yyyy-MM-dd'))) {
      count++;
      cursor = subDays(cursor, 1);
    }
    return count;
  }, [completionHistory]);

  const completedLast7Days = useMemo(
    () =>
      dailyTrendData.slice(-7).reduce((sum, d) => sum + d.completed, 0),
    [dailyTrendData]
  );

  const totalTasks = wsTasks.length;
  const doneTasks = wsTasks.filter((t) => t.status === 'done').length;
  const completionRate =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // By Project Data
  const projectBreakdown = useMemo(() => {
    const data = wsProjects.map((p) => {
      const pTasks = wsTasks.filter((t) => t.projectId === p.id);
      return {
        name: p.name,
        active: pTasks.filter((t) => t.status !== 'done').length,
        completed: pTasks.filter((t) => t.status === 'done').length,
        color: p.color,
      };
    });
    const inboxTasks = wsTasks.filter((t) => t.projectId === null);
    if (inboxTasks.length > 0) {
      data.push({
        name: 'Inbox',
        active: inboxTasks.filter((t) => t.status !== 'done').length,
        completed: inboxTasks.filter((t) => t.status === 'done').length,
        color: '#64748B',
      });
    }
    return data;
  }, [wsProjects, wsTasks]);

  // By Priority Data
  const priorityBreakdown = useMemo(() => {
    const priorities: Priority[] = ['urgent', 'high', 'medium', 'low'];
    return priorities.map((p) => ({
      name: PRIORITY_CONFIG[p].label,
      count: wsTasks.filter((t) => t.status !== 'done' && t.priority === p)
        .length,
      color: PRIORITY_CONFIG[p].dotColor,
    }));
  }, [wsTasks]);

  const axisColor = theme === 'dark' ? '#94A3B8' : '#64748B';
  const gridColor =
    theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#141B2D' : '#FFFFFF',
    borderColor:
      theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.1)',
    borderRadius: '12px',
    fontSize: '12px',
    color: theme === 'dark' ? '#F1F5F9' : '#0F172A',
  };

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="surface-card rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#94A3B8]">
            <span className="text-[12px] font-medium">7-Day Completed</span>
            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" strokeWidth={1.5} />
          </div>
          <p className="mt-2 text-[24px] font-bold font-mono-tabular text-slate-900 dark:text-[#F1F5F9]">
            {completedLast7Days}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-[#94A3B8]">
            tasks shipped this week
          </p>
        </div>

        <div className="surface-card rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#94A3B8]">
            <span className="text-[12px] font-medium">Completion Rate</span>
            <Target className="w-4 h-4 text-indigo-500" strokeWidth={1.5} />
          </div>
          <p className="mt-2 text-[24px] font-bold font-mono-tabular text-slate-900 dark:text-[#F1F5F9]">
            {completionRate}%
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-[#94A3B8] font-mono-tabular">
            {doneTasks} of {totalTasks} workspace tasks
          </p>
        </div>

        <div className="surface-card rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#94A3B8]">
            <span className="text-[12px] font-medium">Current Streak</span>
            <Flame className="w-4 h-4 text-[#F59E0B]" strokeWidth={1.5} />
          </div>
          <p className="mt-2 text-[24px] font-bold font-mono-tabular text-slate-900 dark:text-[#F1F5F9]">
            {streak}d
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-[#94A3B8]">
            consecutive active days
          </p>
        </div>

        <div className="surface-card rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#94A3B8]">
            <span className="text-[12px] font-medium">Deep Focus</span>
            <Timer className="w-4 h-4 text-violet-500" strokeWidth={1.5} />
          </div>
          <p className="mt-2 text-[24px] font-bold font-mono-tabular text-slate-900 dark:text-[#F1F5F9]">
            {Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-[#94A3B8] font-mono-tabular">
            {focusSessionsCompleted} Pomodoro sessions
          </p>
        </div>
      </div>

      {/* 14-Day Trend Area Chart */}
      <div className="surface-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-[#F1F5F9]">
              14-Day Completion Velocity
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-[#94A3B8]">
              Daily completed tasks across your workspace
            </p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dailyTrendData}
              margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
            >
              <defs>
                <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: axisColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: axisColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke="#6366F1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#velocityGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface-card rounded-2xl p-5">
          <h3 className="text-[15px] font-semibold text-slate-900 dark:text-[#F1F5F9] mb-1">
            Active Workload by Priority
          </h3>
          <p className="text-[12px] text-slate-500 dark:text-[#94A3B8] mb-4">
            Open tasks grouped by urgency level
          </p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={priorityBreakdown}
                margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: axisColor, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Open Tasks" radius={[6, 6, 0, 0]}>
                  {priorityBreakdown.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5">
          <h3 className="text-[15px] font-semibold text-slate-900 dark:text-[#F1F5F9] mb-1">
            Project Progress
          </h3>
          <p className="text-[12px] text-slate-500 dark:text-[#94A3B8] mb-4">
            Completed vs remaining tasks per project
          </p>
          <div className="space-y-3.5 max-h-52 overflow-y-auto pr-1">
            {projectBreakdown.map((p) => {
              const total = p.active + p.completed;
              const pct = total > 0 ? Math.round((p.completed / total) * 100) : 0;
              return (
                <div key={p.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="truncate">{p.name}</span>
                    </span>
                    <span className="font-mono-tabular text-[12px] text-slate-500 dark:text-[#94A3B8]">
                      {p.completed}/{total} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200/80 dark:bg-white/[0.07] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: p.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
