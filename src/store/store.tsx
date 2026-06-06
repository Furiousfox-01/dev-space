import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Doc, Sheet, Sticky, Reminder, Toast, Route, ParsedRemind } from '../types';
import { api as apiClient } from '../api/client';
import { uid } from '../utils/uid';
import { parseRemind } from '../utils/parseRemind';
import { renderMarkdown } from '../utils/renderMarkdown';
import { formatWhen } from '../utils/formatWhen';

const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);

function nextTime(h: number, m: number): number {
  const d = new Date(); d.setHours(h, m, 0, 0);
  if (d <= new Date()) d.setDate(d.getDate() + 1);
  return d.getTime();
}

const SEED = {
  docs: [
    { id: uid(), title: 'Welcome to NoteArea', color: 'blue', updated: Date.now() - 3600e3,
      body: '# Welcome 👋\n\n**NoteArea** is one calm, paper-like place for all your thinking. Everything here is **Markdown**.\n\n## Four tools, one home\n- **Docs** — long-form writing, full Markdown\n- **Sheets** — quick Markdown tables\n- **Sticky Notes** — tiny thoughts on a freeform board\n- **Remind** — type `@remind` anywhere\n\n> Tip: write `@remind submit draft tomorrow at 9am` right here and it becomes a reminder.\n\nHappy writing.' },
    { id: uid(), title: 'Project: Spring launch', color: 'green', updated: Date.now() - 86400e3,
      body: '# Spring launch\n\n## Goals\n1. Ship the new home screen\n2. Write the announcement\n3. Line up 3 beta testers\n\n## Notes\nKeep the copy *warm and plain*. No jargon.\n\n- [x] Draft outline\n- [ ] Review with team\n- [ ] @remind publish post friday at 10am' },
  ] as Doc[],
  sheets: [
    { id: uid(), title: 'Reading list', color: 'violet', updated: Date.now() - 7200e3,
      cols: ['Title', 'Author', 'Status'],
      rows: [['The Creative Act', 'Rick Rubin', 'Reading'], ['Thinking in Systems', 'Donella Meadows', 'Queued'], ['A Pattern Language', 'Christopher Alexander', 'Done']] },
  ] as Sheet[],
  stickies: [
    { id: uid(), x: 40,  y: 30,  w: 200, h: 150, z: 1, color: 'yellow', body: '**Buy:**\n- milk\n- coffee\n- sticky notes (meta)' },
    { id: uid(), x: 280, y: 70,  w: 210, h: 160, z: 2, color: 'pink',   body: 'Call the plumber re: *kitchen tap* 🔧\n\n@remind call plumber tomorrow at 11am' },
    { id: uid(), x: 130, y: 220, w: 210, h: 140, z: 3, color: 'blue',   body: 'Idea: a calmer home screen — fewer buttons, more space.' },
  ] as Sticky[],
  reminders: [
    { id: uid(), label: 'Stretch & water', when: nextTime(9, 0), repeat: 'daily' as const, enabled: true, fired: false, lastFiredDate: null, source: 'Remind' },
    { id: uid(), label: 'Review pull requests', when: nextTime(16, 30), repeat: 'once' as const, enabled: true, fired: false, lastFiredDate: null, source: 'Remind' },
  ] as Reminder[],
};

interface NAContext {
  docs: Doc[];
  setDocs: React.Dispatch<React.SetStateAction<Doc[]>>;
  sheets: Sheet[];
  setSheets: React.Dispatch<React.SetStateAction<Sheet[]>>;
  stickies: Sticky[];
  setStickies: React.Dispatch<React.SetStateAction<Sticky[]>>;
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  route: Route;
  setRoute: React.Dispatch<React.SetStateAction<Route>>;
  go: (name: string, id?: string | null) => void;
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  toggleTheme: () => void;
  toasts: Toast[];
  pushToast: (t: Omit<Toast, 'key'>) => void;
  dismissToast: (key: string) => void;
  addReminder: (parsed: ParsedRemind, source?: string) => Reminder;
  notifPerm: string;
  requestNotif: () => Promise<void>;
  parseRemind: typeof parseRemind;
  renderMarkdown: typeof renderMarkdown;
  formatWhen: typeof formatWhen;
  loading: boolean;
}

const NoteAreaContext = createContext<NAContext | null>(null);

export const useNA = (): NAContext => {
  const ctx = useContext(NoteAreaContext);
  if (!ctx) throw new Error('useNA must be used within NoteAreaProvider');
  return ctx;
};

export function NoteAreaProvider({ children }: { children: ReactNode }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [stickies, setStickies] = useState<Sticky[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<Route>({ name: 'home', id: null });
  const [theme, setTheme] = useState<string>(() => {
    try { return JSON.parse(localStorage.getItem('na_theme') || '"light"'); } catch { return 'light'; }
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifPerm, setNotifPerm] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { try { localStorage.setItem('na_theme', JSON.stringify(theme)); } catch {} }, [theme]);

  /* hydrate from API on mount; fall back to seed data in dev if API unavailable */
  useEffect(() => {
    Promise.all([
      apiClient.docs.list(),
      apiClient.sheets.list(),
      apiClient.stickies.list(),
      apiClient.reminders.list(),
    ]).then(([d, s, st, r]) => {
      if (d.length) setDocs(d); else setDocs(SEED.docs);
      if (s.length) setSheets(s); else setSheets(SEED.sheets);
      if (st.length) setStickies(st); else setStickies(SEED.stickies);
      if (r.length) setReminders(r); else setReminders(SEED.reminders);
    }).catch(() => {
      setDocs(SEED.docs);
      setSheets(SEED.sheets);
      setStickies(SEED.stickies);
      setReminders(SEED.reminders);
    }).finally(() => setLoading(false));
  }, []);

  const pushToast = useCallback((t: Omit<Toast, 'key'>) => {
    setToasts(ts => [...ts, { ...t, key: uid() }]);
  }, []);
  const dismissToast = useCallback((key: string) => {
    setToasts(ts => ts.filter(t => t.key !== key));
  }, []);

  const fire = useCallback((r: Reminder) => {
    pushToast({ label: r.label, source: r.source, when: r.when, repeat: r.repeat });
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('⏰ ' + r.label, { body: 'NoteArea reminder', silent: false });
      }
    } catch {}
  }, [pushToast]);

  /* scheduler: tick every 15s */
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const tk = todayKey();
      setReminders(list => {
        let changed = false;
        const next = list.map(r => {
          if (!r.enabled || !r.when) return r;
          if (r.repeat === 'daily') {
            const due = new Date(r.when); const today = new Date();
            today.setHours(due.getHours(), due.getMinutes(), 0, 0);
            if (now >= today.getTime() && r.lastFiredDate !== tk) {
              changed = true; fire(r); return { ...r, lastFiredDate: tk };
            }
          } else {
            if (!r.fired && now >= r.when) { changed = true; fire(r); return { ...r, fired: true }; }
          }
          return r;
        });
        return changed ? next : list;
      });
    };
    tick();
    const iv = setInterval(tick, 15000);
    return () => clearInterval(iv);
  }, [fire]);

  const addReminder = useCallback((parsed: ParsedRemind, source = 'Remind'): Reminder => {
    const r: Reminder = {
      id: uid(), label: parsed.label!, when: parsed.when ?? null,
      repeat: parsed.repeat ?? 'once', enabled: true, fired: false,
      lastFiredDate: null, source,
    };
    apiClient.reminders.create(r).catch(() => {});
    setReminders(list => [r, ...list]);
    return r;
  }, []);

  const requestNotif = useCallback(async () => {
    try {
      if (typeof Notification === 'undefined') return;
      const p = await Notification.requestPermission();
      setNotifPerm(p);
    } catch {}
  }, []);

  const ctx: NAContext = {
    docs, setDocs, sheets, setSheets, stickies, setStickies, reminders, setReminders,
    route, setRoute, go: (name, id = null) => setRoute({ name, id }),
    theme, setTheme, toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark'),
    toasts, pushToast, dismissToast,
    addReminder, notifPerm, requestNotif,
    parseRemind, renderMarkdown, formatWhen,
    loading,
  };

  return <NoteAreaContext.Provider value={ctx}>{children}</NoteAreaContext.Provider>;
}
