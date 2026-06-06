import { useState } from 'react';
import { useNA } from '../store/store';
import { Icon } from './icons';
import { parseRemind } from '../utils/parseRemind';
import { formatWhen } from '../utils/formatWhen';
import { api } from '../api/client';
import type { Reminder } from '../types';

function NotifBanner() {
  const { notifPerm, requestNotif } = useNA();
  if (notifPerm === 'granted' || notifPerm === 'unsupported') return null;
  return (
    <div className="notif-banner">
      <Icon name="bell" size={18} />
      <span>Turn on desktop notifications so reminders reach you even when this tab is in the background.</span>
      <span className="spacer" />
      <button className="btn btn-outline" onClick={requestNotif} style={{ background: 'rgba(255,255,255,.6)' }}>Enable</button>
    </div>
  );
}

function Composer() {
  const { addReminder, pushToast } = useNA();
  const [text, setText] = useState('');
  const parsed = text.trim() ? parseRemind(/@remind/i.test(text) ? text : '@remind ' + text) : null;

  function commit() {
    if (!parsed || !parsed.complete) return;
    addReminder(parsed, 'Remind');
    pushToast({ label: 'Reminder set', source: 'Remind', when: parsed.when, repeat: parsed.repeat });
    setText('');
  }

  return (
    <div className="composer card">
      <div className="composer-row">
        <Icon name="bell" size={20} className="faint" />
        <input className="composer-input" value={text} placeholder="Remind me to… e.g. drink water at 3pm everyday"
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); }} />
        <button className="btn btn-primary" disabled={!parsed || !parsed.complete} onClick={commit}>Set reminder</button>
      </div>
      {parsed && (
        <div className="composer-preview">
          {parsed.complete ? (
            <span className="chip" style={{ background: 'var(--mk-pink-fill)', borderColor: '#f2bcd9', color: '#9a2f66' }}>
              <Icon name={parsed.repeat === 'daily' ? 'repeat' : 'clock'} size={14} />
              <strong>{parsed.label}</strong> · {formatWhen(parsed.when!, parsed.repeat!)}
            </span>
          ) : (
            <span className="faint" style={{ fontSize: 13 }}>Add a time — try "at 9am", "tomorrow 5pm", "in 20 min", "friday at noon", "everyday at 8am".</span>
          )}
        </div>
      )}
    </div>
  );
}

function ReminderRow({ r }: { r: Reminder }) {
  const { setReminders } = useNA();

  function toggle() {
    const enabled = !r.enabled;
    setReminders(list => list.map(x => x.id === r.id ? { ...x, enabled } : x));
    api.reminders.update(r.id, { enabled }).catch(() => {});
  }
  function del() {
    setReminders(list => list.filter(x => x.id !== r.id));
    api.reminders.remove(r.id).catch(() => {});
  }

  const past = r.repeat === 'once' && r.fired;
  return (
    <div className={'reminder-row' + (r.enabled ? '' : ' off')}>
      <button className={'rem-toggle' + (r.enabled ? ' on' : '')} onClick={toggle} title={r.enabled ? 'Disable' : 'Enable'}>
        {r.enabled && <Icon name="check" size={13} />}
      </button>
      <span className="recent-ic cdot-bg-pink" style={{ width: 30, height: 30 }}>
        <Icon name={r.repeat === 'daily' ? 'repeat' : 'clock'} size={15} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="rem-label">{r.label}</div>
        <div className="rem-meta faint">
          {past ? 'Done' : formatWhen(r.when, r.repeat)}
          {r.source && r.source !== 'Remind' ? ' · from ' + r.source : ''}
        </div>
      </div>
      <span className="spacer" />
      {r.repeat === 'daily' && <span className="chip" style={{ fontSize: 11.5, padding: '2px 9px' }}>Daily</span>}
      <button className="btn btn-ghost btn-danger btn-icon" onClick={del} title="Delete"><Icon name="trash" size={17} /></button>
    </div>
  );
}

export function Remind() {
  const { reminders } = useNA();
  const active = reminders.filter(r => !(r.repeat === 'once' && r.fired)).sort((a, b) => (a.when || 0) - (b.when || 0));
  const done = reminders.filter(r => r.repeat === 'once' && r.fired);

  return (
    <div className="na-pad" style={{ maxWidth: 720 }}>
      <h2 className="t-h2" style={{ marginBottom: 6 }}>Remind</h2>
      <p className="muted" style={{ marginTop: 0, marginBottom: 18 }}>
        Type <code className="t-code">@remind</code> in any doc or sticky note, or set one right here.
      </p>
      <NotifBanner />
      <Composer />
      <div style={{ height: 26 }} />
      <div className="row" style={{ marginBottom: 10 }}><h3 className="t-h3">Upcoming</h3></div>
      <div className="reminder-list card">
        {active.length === 0 && <div className="empty"><div className="big">All clear</div>Nothing scheduled.</div>}
        {active.map(r => <ReminderRow key={r.id} r={r} />)}
      </div>
      {done.length > 0 && (
        <>
          <div className="row" style={{ margin: '24px 0 10px' }}><h3 className="t-h3 faint">Done</h3></div>
          <div className="reminder-list card" style={{ opacity: .75 }}>
            {done.map(r => <ReminderRow key={r.id} r={r} />)}
          </div>
        </>
      )}
    </div>
  );
}
