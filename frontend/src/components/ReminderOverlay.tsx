import { Reminder } from '../lib/api';

interface Props {
  reminders: Reminder[];
  onDismiss: (id: string) => void;
  onSnooze: (id: string, until: number) => void;
}

function tomorrowNineAm(): number {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.getTime();
}

function labelFromRaw(raw: string): string {
  return raw.replace(/@remind\s+/i, '').replace(/every\s+/i, '↻ ');
}

export function ReminderOverlay({ reminders, onDismiss, onSnooze }: Props) {
  if (reminders.length === 0) return null;

  return (
    <div className="reminder-overlay">
      {reminders.map(r => (
        <div key={r.id} className="reminder-card">
          <div className="reminder-icon">🔔</div>
          <div className="reminder-body">
            <div className="reminder-label">{labelFromRaw(r.raw_text)}</div>
            {r.recurrence && <div className="reminder-recur">Recurring</div>}
          </div>
          <div className="reminder-actions">
            <button onClick={() => onDismiss(r.id)} className="btn-done">Done</button>
            <button onClick={() => onSnooze(r.id, Date.now() + 10 * 60 * 1000)} className="btn-snooze">+10m</button>
            <button onClick={() => onSnooze(r.id, Date.now() + 60 * 60 * 1000)} className="btn-snooze">+1h</button>
            <button onClick={() => onSnooze(r.id, tomorrowNineAm())} className="btn-snooze">Tomorrow</button>
            <button onClick={() => onDismiss(r.id)} className="btn-close" title="Dismiss">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}
