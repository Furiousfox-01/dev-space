import { useNA } from '../store/store';
import { Icon } from './icons';
import { TOOLS, type Tool } from './icons';
import { formatWhen } from '../utils/formatWhen';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Still up?';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(ts: number) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

function ToolCard({ tool }: { tool: Tool }) {
  const { go } = useNA();
  return (
    <button className="card hover toolcard" onClick={() => go(tool.key)}>
      <span className={'toolcard-ic cdot-bg-' + tool.color}>
        <Icon name={tool.icon} size={24} />
      </span>
      <span className="toolcard-body">
        <span className="toolcard-title">{tool.label}</span>
        <span className="toolcard-blurb">{tool.blurb}</span>
      </span>
    </button>
  );
}

export function Home() {
  const { docs, sheets, reminders, go } = useNA();
  const g = greeting();
  const recents = [
    ...docs.map(d => ({ kind: 'docs', id: d.id, title: d.title, color: d.color, updated: d.updated })),
    ...sheets.map(s => ({ kind: 'sheets', id: s.id, title: s.title, color: s.color, updated: s.updated })),
  ].sort((a, b) => b.updated - a.updated).slice(0, 6);

  const upcoming = reminders.filter(r => r.enabled).sort((a, b) => (a.when || 0) - (b.when || 0)).slice(0, 4);

  return (
    <div className="na-pad">
      <div className="home-hero">
        <div className="home-hello t-display">{/[.?!]$/.test(g) ? g : g + '.'}</div>
        <div className="home-sub muted">What do you want to capture today?</div>
      </div>

      <div className="tool-grid">
        {TOOLS.map(t => <ToolCard key={t.key} tool={t} />)}
      </div>

      <div className="home-cols">
        <section className="home-col">
          <div className="row" style={{ marginBottom: 12 }}>
            <h3 className="t-h3">Recent</h3>
          </div>
          <div className="recent-list card">
            {recents.length === 0 && <div className="empty"><div className="big">Nothing yet</div>Create your first note.</div>}
            {recents.map(r => {
              const icon = r.kind === 'docs' ? 'doc' : 'sheet';
              return (
                <button key={r.kind + r.id} className="recent-item" onClick={() => go(r.kind, r.id)}>
                  <span className={'recent-ic cdot-bg-' + r.color}><Icon name={icon} size={17} /></span>
                  <span className="recent-title">{r.title}</span>
                  <span className="spacer" />
                  <span className="recent-meta faint">{timeAgo(r.updated)}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="home-col">
          <div className="row" style={{ marginBottom: 12 }}>
            <h3 className="t-h3">Upcoming reminders</h3>
            <span className="spacer" />
            <button className="btn btn-ghost" onClick={() => go('remind')} style={{ fontSize: 13 }}>View all</button>
          </div>
          <div className="recent-list card">
            {upcoming.length === 0 && <div className="empty"><div className="big">All clear</div>No reminders set.</div>}
            {upcoming.map(r => (
              <div className="recent-item" key={r.id} style={{ cursor: 'default' }}>
                <span className="recent-ic cdot-bg-pink"><Icon name={r.repeat === 'daily' ? 'repeat' : 'clock'} size={16} /></span>
                <span className="recent-title">{r.label}</span>
                <span className="spacer" />
                <span className="recent-meta faint">{formatWhen(r.when, r.repeat)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export { timeAgo };
