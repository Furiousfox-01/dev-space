import { useNA } from '../store/store';
import { Icon } from './icons';

const THEMES = [
  { id: 'light', label: 'Sand',  desc: 'Clean off-white',  bg: '#F8F6EF', surface: '#FFFFFF', brand: '#F7CB46', ink: '#1A1A1A' },
  { id: 'dark',  label: 'Dark',  desc: 'Pure black',       bg: '#111110', surface: '#1C1C1A', brand: '#F7CB46', ink: '#EBEBEB' },
  { id: 'sepia', label: 'Sepia', desc: 'Warm parchment',   bg: '#F2ECD8', surface: '#FAF6EC', brand: '#C8844F', ink: '#3D2B1A' },
  { id: 'dim',   label: 'Dim',   desc: 'Soft dark',        bg: '#1E2030', surface: '#252837', brand: '#F7CB46', ink: '#CDD6F4' },
] as const;

function ThemeSwatch({ t }: { t: typeof THEMES[number] }) {
  const { theme, setTheme } = useNA();
  const active = theme === t.id;
  return (
    <button
      className={'theme-swatch' + (active ? ' active' : '')}
      onClick={() => setTheme(t.id)}
      style={{ borderColor: active ? t.brand : undefined }}
    >
      <div className="theme-preview" style={{ background: t.bg }}>
        <div style={{ height: 10, background: t.surface, borderBottom: `1.5px solid ${t.ink}20`, display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.brand }} />
          <div style={{ flex: 1, height: 2, background: t.ink, opacity: 0.2, borderRadius: 1 }} />
        </div>
        <div style={{ padding: '10px 10px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ height: 7, width: '75%', background: t.ink, opacity: 0.7, borderRadius: 1 }} />
          <div style={{ height: 4, width: '90%', background: t.ink, opacity: 0.2, borderRadius: 1 }} />
          <div style={{ height: 4, width: '65%', background: t.ink, opacity: 0.2, borderRadius: 1 }} />
          <div style={{ marginTop: 4, height: 18, width: 48, background: t.brand, border: `1.5px solid ${t.ink}`, borderRadius: 0 }} />
        </div>
      </div>
      <div className="theme-info">
        <div className="theme-name" style={{ color: 'var(--ink)' }}>
          {active && <Icon name="check" size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
          {t.label}
        </div>
        <div className="theme-desc">{t.desc}</div>
      </div>
    </button>
  );
}

export function Settings() {
  return (
    <div className="na-pad" style={{ maxWidth: 680 }}>
      <h2 className="t-h2" style={{ marginBottom: 6 }}>Settings</h2>
      <p className="muted" style={{ marginTop: 0, marginBottom: 32, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        Customize how NoteArea looks and feels.
      </p>

      <section className="settings-section">
        <h3 className="t-h3" style={{ marginBottom: 16 }}>Theme</h3>
        <div className="theme-grid">
          {THEMES.map(t => <ThemeSwatch key={t.id} t={t} />)}
        </div>
      </section>
    </div>
  );
}
