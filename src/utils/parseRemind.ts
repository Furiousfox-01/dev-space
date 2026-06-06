import type { ParsedRemind } from '../types';

const WEEKDAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

export function parseRemind(text: string, now = new Date()): ParsedRemind {
  if (!text) return { found: false };
  const m = text.match(/@remind\b/i);
  if (!m) return { found: false };

  let rest = text.slice(m.index! + m[0].length).trim();
  const original = rest;
  let repeat: 'once' | 'daily' = 'once';
  let when: Date | null = null;
  let dateSet = false, timeSet = false;
  const strip: (string | undefined)[] = [];

  const rec = rest.match(/\b(every\s?day|everyday|daily|each\s?day)\b/i);
  if (rec) { repeat = 'daily'; strip.push(rec[0]); }

  let due = new Date(now);
  due.setSeconds(0, 0);

  const rel = rest.match(/\bin\s+(\d+)\s*(min(?:ute)?s?|hours?|hrs?|h|m)\b/i);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const unit = rel[2].toLowerCase();
    if (unit.startsWith('h')) due.setHours(due.getHours() + n);
    else due.setMinutes(due.getMinutes() + n);
    dateSet = true; timeSet = true;
    strip.push(rel[0]);
  }

  if (!dateSet) {
    if (/\btomorrow\b|\btmrw\b/i.test(rest)) {
      due.setDate(due.getDate() + 1); dateSet = true;
      strip.push((rest.match(/\btomorrow\b|\btmrw\b/i) || [])[0]);
    } else if (/\btoday\b|\btonight\b/i.test(rest)) {
      dateSet = true; strip.push((rest.match(/\btoday\b|\btonight\b/i) || [])[0]);
    } else {
      const wd = rest.match(new RegExp('\\b(?:on\\s+)?(' + WEEKDAYS.join('|') + ')\\b', 'i'));
      if (wd) {
        const target = WEEKDAYS.indexOf(wd[1].toLowerCase());
        let diff = (target - due.getDay() + 7) % 7;
        if (diff === 0) diff = 7;
        due.setDate(due.getDate() + diff); dateSet = true;
        strip.push(wd[0]);
      } else {
        const md1 = rest.match(new RegExp('\\b(' + MONTHS.join('|') + ')[a-z]*\\s+(\\d{1,2})\\b', 'i'));
        const md2 = rest.match(new RegExp('\\b(\\d{1,2})\\s+(' + MONTHS.join('|') + ')[a-z]*\\b', 'i'));
        let mo = -1, day = -1, raw: string | undefined;
        if (md1) { mo = MONTHS.indexOf(md1[1].slice(0,3).toLowerCase()); day = parseInt(md1[2],10); raw = md1[0]; }
        else if (md2) { mo = MONTHS.indexOf(md2[2].slice(0,3).toLowerCase()); day = parseInt(md2[1],10); raw = md2[0]; }
        if (mo >= 0 && day > 0) {
          due.setMonth(mo, day);
          if (due < now) due.setFullYear(due.getFullYear() + 1);
          dateSet = true; strip.push(raw);
        }
      }
    }
  }

  if (!timeSet) {
    if (/\bnoon\b/i.test(rest)) { due.setHours(12,0,0,0); timeSet = true; strip.push('noon'); }
    else if (/\bmidnight\b/i.test(rest)) { due.setHours(0,0,0,0); timeSet = true; strip.push('midnight'); }
    else {
      const t = rest.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
      if (t && (t[3] || t[2] || /\bat\b/i.test(t[0]))) {
        let hr = parseInt(t[1], 10);
        const min = t[2] ? parseInt(t[2], 10) : 0;
        const ap = t[3] ? t[3].toLowerCase() : null;
        if (ap === 'pm' && hr < 12) hr += 12;
        if (ap === 'am' && hr === 12) hr = 0;
        if (hr >= 0 && hr <= 23 && min >= 0 && min <= 59) {
          due.setHours(hr, min, 0, 0); timeSet = true; strip.push(t[0]);
        }
      }
    }
  }

  if (!dateSet && timeSet) {
    if (due <= now && repeat === 'once') due.setDate(due.getDate() + 1);
  }

  when = (timeSet || dateSet) ? due : null;

  let label = original;
  strip.filter(Boolean).forEach(s => { label = label.replace(s!, ' '); });
  label = label.replace(/\b(at|on|every|this|next)\b/gi, ' ')
               .replace(/\s+/g, ' ').trim()
               .replace(/^[-–:,.\s]+|[-–:,.\s]+$/g, '');

  return {
    found: true,
    label: label || 'Reminder',
    when: when ? when.getTime() : null,
    repeat,
    timeHHMM: when ? `${String(when.getHours()).padStart(2,'0')}:${String(when.getMinutes()).padStart(2,'0')}` : null,
    complete: !!when,
    raw: original,
  };
}
