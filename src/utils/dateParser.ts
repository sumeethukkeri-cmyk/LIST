import * as chrono from 'chrono-node';
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isBefore,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
  startOfDay,
} from 'date-fns';
import { Label, Priority, Project, Recurrence } from '../types/task';

export interface ParsedTaskInput {
  cleanTitle: string;
  dueDate: string | null;
  dueTime: string | null;
  parsedDatePhrase: string | null;
  priority: Priority | null;
  projectId: string | null;
  matchedProjectName: string | null;
  labelIds: string[];
  recurrence: Recurrence | null;
  estimatedMinutes: number | null;
}

export function parseNaturalTaskInput(
  rawInput: string,
  projects: Project[],
  labels: Label[]
): ParsedTaskInput {
  let working = rawInput;
  let priority: Priority | null = null;
  let projectId: string | null = null;
  let matchedProjectName: string | null = null;
  const labelIds: string[] = [];
  let recurrence: Recurrence | null = null;
  let estimatedMinutes: number | null = null;

  // 1. Parse priority tokens (!1, !2, !3, !4, !urgent, !high, !medium, !low)
  const priorityRegex = /(?:^|\s)!(1|2|3|4|urgent|high|med|medium|low)(?=\s|$)/gi;
  working = working.replace(priorityRegex, (_, token: string) => {
    const t = token.toLowerCase();
    if (t === '1' || t === 'urgent') priority = 'urgent';
    else if (t === '2' || t === 'high') priority = 'high';
    else if (t === '3' || t === 'med' || t === 'medium') priority = 'medium';
    else if (t === '4' || t === 'low') priority = 'low';
    return ' ';
  });

  // 2. Parse duration estimate (~25m, ~1h, ~90m)
  const durationRegex = /(?:^|\s)~(\d+)(m|min|h|hr)(?=\s|$)/gi;
  working = working.replace(durationRegex, (_, numStr: string, unit: string) => {
    const val = parseInt(numStr, 10);
    if (!Number.isNaN(val) && val > 0) {
      estimatedMinutes = unit.toLowerCase().startsWith('h') ? val * 60 : val;
    }
    return ' ';
  });

  // 3. Parse recurrence tokens (every day, daily, every week, weekly, every month, monthly)
  const recurrenceRegex = /\b(every\s+day|daily|every\s+week|weekly|every\s+month|monthly)\b/i;
  const recMatch = working.match(recurrenceRegex);
  if (recMatch) {
    const phrase = recMatch[1].toLowerCase();
    if (phrase.includes('day') || phrase === 'daily') recurrence = 'daily';
    else if (phrase.includes('week') || phrase === 'weekly') recurrence = 'weekly';
    else if (phrase.includes('month') || phrase === 'monthly') recurrence = 'monthly';
    working = working.replace(recurrenceRegex, ' ');
  }

  // 4. Parse #Project tokens
  const hashRegex = /(?:^|\s)#([a-zA-Z0-9_-]+)/g;
  working = working.replace(hashRegex, (full, tag: string) => {
    const found = projects.find(
      (p) => p.name.toLowerCase().replace(/\s+/g, '') === tag.toLowerCase() ||
             p.name.toLowerCase().startsWith(tag.toLowerCase())
    );
    if (found) {
      projectId = found.id;
      matchedProjectName = found.name;
      return ' ';
    }
    return full;
  });

  // 5. Parse @label tokens
  const atRegex = /(?:^|\s)@([a-zA-Z0-9_-]+)/g;
  working = working.replace(atRegex, (full, tag: string) => {
    const found = labels.find(
      (l) => l.name.toLowerCase() === tag.toLowerCase() ||
             l.name.toLowerCase().startsWith(tag.toLowerCase())
    );
    if (found) {
      if (!labelIds.includes(found.id)) {
        labelIds.push(found.id);
      }
      return ' ';
    }
    return full;
  });

  // 6. Parse natural language dates via chrono-node
  let dueDate: string | null = null;
  let dueTime: string | null = null;
  let parsedDatePhrase: string | null = null;

  const results = chrono.parse(working, new Date(), { forwardDate: true });
  if (results.length > 0) {
    const first = results[0];
    const dateObj = first.start.date();
    dueDate = format(dateObj, 'yyyy-MM-dd');
    parsedDatePhrase = first.text;

    if (first.start.isCertain('hour')) {
      dueTime = format(dateObj, 'HH:mm');
    }

    // Remove the matched date text cleanly from the title
    const before = working.slice(0, first.index);
    const after = working.slice(first.index + first.text.length);
    working = `${before} ${after}`;
  }

  const cleanTitle = working.replace(/\s+/g, ' ').trim();

  return {
    cleanTitle,
    dueDate,
    dueTime,
    parsedDatePhrase,
    priority,
    projectId,
    matchedProjectName,
    labelIds,
    recurrence,
    estimatedMinutes,
  };
}

export function formatDueDateLabel(dueDate: string | null, dueTime: string | null = null): {
  label: string;
  isOverdue: boolean;
  isTodayDate: boolean;
  isSoon: boolean;
} {
  if (!dueDate) {
    return { label: 'No date', isOverdue: false, isTodayDate: false, isSoon: false };
  }

  const parsed = parseISO(dueDate);
  const todayStart = startOfDay(new Date());
  const isOverdue = isBefore(parsed, todayStart);
  const isTodayDate = isToday(parsed);

  let datePart = format(parsed, 'MMM d');
  if (isTodayDate) datePart = 'Today';
  else if (isTomorrow(parsed)) datePart = 'Tomorrow';
  else if (isYesterday(parsed)) datePart = 'Yesterday';

  const timePart = dueTime ? ` at ${formatTime12h(dueTime)}` : '';
  return {
    label: `${datePart}${timePart}`,
    isOverdue,
    isTodayDate,
    isSoon: isTodayDate || isTomorrow(parsed),
  };
}

export function formatTime12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function getNextRecurringDate(currentDateStr: string | null, recurrence: Recurrence): string | null {
  if (recurrence === 'none') return null;
  const base = currentDateStr ? parseISO(currentDateStr) : new Date();
  if (recurrence === 'daily') return format(addDays(base, 1), 'yyyy-MM-dd');
  if (recurrence === 'weekly') return format(addWeeks(base, 1), 'yyyy-MM-dd');
  if (recurrence === 'monthly') return format(addMonths(base, 1), 'yyyy-MM-dd');
  return null;
}

export function parseQuickDateExpression(text: string): { dueDate: string | null; dueTime: string | null } {
  const trimmed = text.trim();
  if (!trimmed) return { dueDate: null, dueTime: null };
  const results = chrono.parse(trimmed, new Date(), { forwardDate: true });
  if (results.length === 0) return { dueDate: null, dueTime: null };
  const first = results[0];
  const dateObj = first.start.date();
  return {
    dueDate: format(dateObj, 'yyyy-MM-dd'),
    dueTime: first.start.isCertain('hour') ? format(dateObj, 'HH:mm') : null,
  };
}
