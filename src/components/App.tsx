import { useState, useEffect } from 'react';
import { NoteAreaProvider, useNA } from '../store/store';
import { Icon, TOOLS } from './icons';
import { formatWhen } from '../utils/formatWhen';
import { Home } from './Home';
import { Docs } from './Docs';
import { Sheets } from './Sheets';
import { Stickies } from './Stickies';
import { Remind } from './Remind';
import { Settings } from './Settings';

function Toasts() {
  const { toasts, dismissToast } = useNA();
  useEffect(() => {
    const timers = toasts.map(t => setTimeout(() => dismissToast(t.key), 8000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismissToast]);
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div className="toast" key={t.key}>
          <span className="tbell"><Icon name="bell" size={16} /></span>
          <div style={{ minWidth: 0 }}>
            <div className="tlabel">{'⏰ ' + t.label}</div>
            <div className="tmeta">{t.source ? t.source + ' · ' : ''}{formatWhen(t.when ?? null, t.repeat ?? 'once')}</div>
          </div>
          <button className="tclose" onClick={() => dismissToast(t.key)}><Icon name="x" size={16} /></button>
        </div>
      ))}
    </div>
  );
}

function Sidebar({ onNav }: { onNav?: () => void }) {
  const { route, go, reminders } = useNA();
  const due = reminders.filter(r => r.enabled).length;
  const items = [{ key: 'home', label: 'Home', icon: 'home' as const }, ...TOOLS];
  return (
    <aside className="na-side">
      <div className="na-brand">
        <img src="/mark.svg" alt="" />
        <span className="wm">NoteArea</span>
      </div>
      <nav className="na-nav">
        {items.map(it => (
          <button key={it.key} className={'na-navitem' + (route.name === it.key ? ' active' : '')}
            onClick={() => { go(it.key); onNav?.(); }}>
            <Icon name={it.icon} size={19} />
            {it.label}
            {it.key === 'remind' && due > 0 && <span className="nav-badge">{due}</span>}
          </button>
        ))}
      </nav>
      <div className="na-side-foot">
        <button className={'na-navitem' + (route.name === 'settings' ? ' active' : '')}
          onClick={() => { go('settings'); onNav?.(); }}>
          <Icon name="settings" size={19} />
          Settings
        </button>
      </div>
    </aside>
  );
}

const TITLES: Record<string, string> = {
  home: 'Home', docs: 'Docs', sheets: 'Sheets', stickies: 'Sticky Notes', remind: 'Remind', settings: 'Settings',
};

function Routed() {
  const { route } = useNA();
  switch (route.name) {
    case 'home':     return <Home />;
    case 'docs':     return <Docs id={route.id} />;
    case 'sheets':   return <Sheets id={route.id} />;
    case 'remind':   return <Remind />;
    case 'settings': return <Settings />;
    default:         return <Home />;
  }
}

function Shell() {
  const { route, loading } = useNA();
  const [menu, setMenu] = useState(false);
  const isStickies = route.name === 'stickies';

  if (loading) {
    return (
      <div className="na-app" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span className="faint">Loading…</span>
      </div>
    );
  }

  return (
    <div className={'na-app' + (menu ? ' menu-open' : '')}>
      {menu && <div className="na-scrim" onClick={() => setMenu(false)} />}
      <Sidebar onNav={() => setMenu(false)} />
      <main className="na-main">
        {isStickies ? (
          <Stickies />
        ) : (
          <>
            <div className="na-topbar">
              <button className="btn btn-ghost btn-icon na-menu-btn" onClick={() => setMenu(true)}>
                <Icon name="more" size={20} />
              </button>
              <div className="title">{TITLES[route.name] || 'NoteArea'}</div>
            </div>
            <div className="na-scroll"><Routed /></div>
          </>
        )}
      </main>
      <Toasts />
    </div>
  );
}

export function App() {
  return (
    <NoteAreaProvider>
      <Shell />
    </NoteAreaProvider>
  );
}
