import { useState } from 'react';
import { useNA } from '../store/store';
import { Icon } from './icons';
import { MarkdownEditor } from './Editor';
import { renderMarkdown } from '../utils/renderMarkdown';
import { uid } from '../utils/uid';
import { api } from '../api/client';
import { timeAgo } from './Home';
import type { Doc } from '../types';

const COLORS = ['blue','green','yellow','pink','violet','red','orange','slate'];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="row" style={{ gap: 4, alignItems: 'center' }}>
      <span className="faint" style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Card color</span>
      {COLORS.map(c => (
        <button key={c} aria-label={c} onClick={() => onChange(c)}
          className={'colorswatch cdot-bg-' + c + (value === c ? ' sel' : '')} />
      ))}
    </div>
  );
}

function DocsList() {
  const { docs, setDocs, go } = useNA();

  function add() {
    const id = uid();
    const doc: Doc = { id, title: 'Untitled doc', color: 'blue', body: '# Untitled\n\nStart writing…', updated: Date.now() };
    setDocs(d => [doc, ...d]);
    api.docs.create(doc).catch(() => {});
    go('docs', id);
  }

  return (
    <div className="na-pad">
      <div className="row" style={{ marginBottom: 18 }}>
        <h2 className="t-h2">Docs</h2>
        <span className="spacer" />
        <button className="btn btn-primary" onClick={add}><Icon name="plus" size={17} /> New doc</button>
      </div>
      {docs.length === 0 && <div className="empty"><div className="big">No docs yet</div>Make one to start writing.</div>}
      <div className="doc-grid">
        {docs.map(d => (
          <button key={d.id} className="card hover doc-tile" onClick={() => go('docs', d.id)}>
            <span className={'doc-tile-bar cdot-bg-' + d.color} />
            <span className="doc-tile-title">{d.title || 'Untitled'}</span>
            <span className="doc-tile-excerpt">{(d.body || '').replace(/[#*>\-\[\]`]/g, '').trim().slice(0, 120) || 'Empty'}</span>
            <span className="doc-tile-meta faint">{timeAgo(d.updated)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DocEditor({ id }: { id: string }) {
  const { docs, setDocs, go } = useNA();
  const doc = docs.find(d => d.id === id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: '', body: '', color: 'blue' });

  if (!doc) return <div className="na-pad"><div className="empty">Doc not found.</div></div>;

  function enterEdit() {
    setDraft({ title: doc!.title, body: doc!.body, color: doc!.color });
    setEditing(true);
  }

  function save() {
    const updated = Date.now();
    setDocs(list => list.map(d => d.id === id ? { ...d, ...draft, updated } : d));
    api.docs.update(id, { ...draft, updated }).catch(() => {});
    setEditing(false);
  }

  function exitEdit() { setEditing(false); }

  function del() {
    setDocs(list => list.filter(d => d.id !== id));
    api.docs.remove(id).catch(() => {});
    go('docs');
  }

  return (
    <div className="na-pad" style={{ maxWidth: 820 }}>
      <div className="row" style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost" onClick={() => go('docs')}><Icon name="chevronLeft" size={18} /> Docs</button>
        <span className="spacer" />
        {editing ? (
          <>
            <ColorPicker value={draft.color} onChange={c => setDraft(d => ({ ...d, color: c }))} />
            <button className="btn btn-ghost" onClick={exitEdit}>Cancel</button>
            <button className="btn btn-primary" onClick={save}><Icon name="check" size={16} /> Save</button>
          </>
        ) : (
          <>
            <button className="btn btn-outline" onClick={enterEdit}><Icon name="edit" size={16} /> Edit</button>
            <button className="btn btn-ghost btn-danger btn-icon" title="Delete" onClick={del}><Icon name="trash" size={18} /></button>
          </>
        )}
      </div>

      {editing ? (
        <>
          <input className="doc-title-input" value={draft.title} placeholder="Untitled doc"
            autoFocus
            onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Escape') exitEdit(); }} />
          <div style={{ height: 14 }} />
          <MarkdownEditor value={draft.body} onChange={b => setDraft(d => ({ ...d, body: b }))}
            onEsc={exitEdit}
            placeholder="Write in Markdown… try @remind review notes tomorrow at 9am"
            source="Doc" minHeight={420} />
        </>
      ) : (
        <>
          <h1 className="doc-view-title">{doc.title || 'Untitled'}</h1>
          <div className="md doc-view-body"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.body || '_Empty — click Edit to start writing._') }} />
        </>
      )}
    </div>
  );
}

export function Docs({ id }: { id?: string | null }) {
  return id ? <DocEditor id={id} /> : <DocsList />;
}

export { ColorPicker, COLORS };
