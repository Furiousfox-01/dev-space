export function formatWhen(ts: number | null, repeat: string): string {
  if (!ts) return 'no time set';
  const d = new Date(ts);
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (repeat === 'daily') return `Every day · ${time}`;
  const sameDay = d.toDateString() === now.toDateString();
  const tmrw = new Date(now); tmrw.setDate(now.getDate() + 1);
  const isTmrw = d.toDateString() === tmrw.toDateString();
  if (sameDay) return `Today · ${time}`;
  if (isTmrw) return `Tomorrow · ${time}`;
  return `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · ${time}`;
}
