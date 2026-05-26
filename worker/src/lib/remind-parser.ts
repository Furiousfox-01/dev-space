export interface ParsedReminder {
  raw: string;
  triggerAt: number;
  recurrence: string | null;
}

const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  const match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2] ?? '0');
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  return { hours, minutes };
}

function setTime(date: Date, hours: number, minutes: number): Date {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function nextWeekday(dayName: string, time: string): number | null {
  const targetDay = DAYS.indexOf(dayName.toLowerCase());
  if (targetDay === -1) return null;
  const parsed = parseTime(time);
  if (!parsed) return null;

  const now = new Date();
  const result = new Date(now);
  let daysUntil = targetDay - now.getDay();
  if (daysUntil <= 0) daysUntil += 7;
  result.setDate(now.getDate() + daysUntil);
  result.setHours(parsed.hours, parsed.minutes, 0, 0);
  return result.getTime();
}

export function parseReminders(markdown: string): ParsedReminder[] {
  const results: ParsedReminder[] = [];
  const lines = markdown.split('\n');
  const now = new Date();

  for (const line of lines) {
    const match = line.match(/@remind\s+(.+)/i);
    if (!match) continue;
    const raw = line.trim();
    const expr = match[1].trim();

    // @remind every monday 08:00
    const everyDay = expr.match(/^every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(\d{1,2}:\d{2}(?:\s*[ap]m)?)$/i);
    if (everyDay) {
      const triggerAt = nextWeekday(everyDay[1], everyDay[2]);
      if (triggerAt) {
        results.push({ raw, triggerAt, recurrence: expr });
      }
      continue;
    }

    // @remind every day 07:00
    const everyDayDaily = expr.match(/^every\s+day\s+(\d{1,2}:\d{2}(?:\s*[ap]m)?)$/i);
    if (everyDayDaily) {
      const parsed = parseTime(everyDayDaily[1]);
      if (parsed) {
        const trigger = setTime(now, parsed.hours, parsed.minutes);
        if (trigger.getTime() <= Date.now()) trigger.setDate(trigger.getDate() + 1);
        results.push({ raw, triggerAt: trigger.getTime(), recurrence: expr });
      }
      continue;
    }

    // @remind in 30m / in 2h
    const inMatch = expr.match(/^in\s+(\d+)(m|h)$/i);
    if (inMatch) {
      const amount = parseInt(inMatch[1]);
      const unit = inMatch[2].toLowerCase();
      const ms = unit === 'h' ? amount * 3600000 : amount * 60000;
      results.push({ raw, triggerAt: Date.now() + ms, recurrence: null });
      continue;
    }

    // @remind tomorrow 5pm
    const tomorrowMatch = expr.match(/^tomorrow\s+(.+)$/i);
    if (tomorrowMatch) {
      const parsed = parseTime(tomorrowMatch[1]);
      if (parsed) {
        const d = new Date(now);
        d.setDate(d.getDate() + 1);
        d.setHours(parsed.hours, parsed.minutes, 0, 0);
        results.push({ raw, triggerAt: d.getTime(), recurrence: null });
      }
      continue;
    }

    // @remind 2026-06-01 09:30
    const isoMatch = expr.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}(?:\s*[ap]m)?)$/i);
    if (isoMatch) {
      const parsed = parseTime(isoMatch[2]);
      if (parsed) {
        const d = new Date(isoMatch[1]);
        d.setHours(parsed.hours, parsed.minutes, 0, 0);
        results.push({ raw, triggerAt: d.getTime(), recurrence: null });
      }
      continue;
    }

    // @remind today 5pm
    const todayMatch = expr.match(/^today\s+(.+)$/i);
    if (todayMatch) {
      const parsed = parseTime(todayMatch[1]);
      if (parsed) {
        const d = setTime(now, parsed.hours, parsed.minutes);
        if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
        results.push({ raw, triggerAt: d.getTime(), recurrence: null });
      }
      continue;
    }
  }

  return results;
}

export function computeNextRecurrence(recurrence: string): number | null {
  const now = new Date();

  const everyDay = recurrence.match(/^every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(\d{1,2}:\d{2}(?:\s*[ap]m)?)$/i);
  if (everyDay) return nextWeekday(everyDay[1], everyDay[2]);

  const everyDayDaily = recurrence.match(/^every\s+day\s+(\d{1,2}:\d{2}(?:\s*[ap]m)?)$/i);
  if (everyDayDaily) {
    const parsed = parseTime(everyDayDaily[1]);
    if (parsed) {
      const d = setTime(now, parsed.hours, parsed.minutes);
      if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
      return d.getTime();
    }
  }

  return null;
}
