import { useState, useRef } from 'react';
import { useNA } from '../store/store';
import { Icon } from './icons';
import { RemindStrip } from './Editor';
import { renderMarkdown } from '../utils/renderMarkdown';
import { uid } from '../utils/uid';
import { api } from '../api/client';
import type { Sticky } from '../types';

const STICKY_TINT: Record<string, string> = {
  yellow: 'var(--mk-yellow-fill)', pink: 'var(--mk-pink-fill)', blue: 'var(--mk-blue-fill)',
  green: 'var(--mk-green-fill)', violet: 'var(--mk-violet-fill)', orange: 'var(--mk-orange-fill)',
  red: 'var(--mk-red-fill)', slate: 'var(--mk-slate-fill)',
};

interface StickyCardProps {
  note: Sticky;
  onChange: (p: Partial<Sticky>) => void;
  onDelete: (id: string) => void;
  onFront: (id: string) => void;
}

function StickyCard({ note, onChange, onDelete, onFront }: StickyCardProps) {
  const [editing, setEditing] = useState(false);
  const [draftBody, setDraftBody] = useState('');

  function startDrag(e: React.PointerEvent) {
    if (editing) return;
    if ((e.target as HTMLElement).closest('.sticky-act') || (e.target as HTMLElement).closest('textarea')) return;
    onFront(note.id);
    const startX = e.clientX, startY = e.clientY, ox = note.x, oy = note.y;
    function move(ev: PointerEvent) {
      onChange({ x: Math.max(0, ox + ev.clientX - startX), y: Math.max(0, oy + ev.clientY - startY) });
    }
    function up() { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  }

  function startResize(e: React.PointerEvent) {
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY, ow = note.w, oh = note.h;
    function move(ev: PointerEvent) {
      onChange({ w: Math.max(150, ow + ev.clientX - startX), h: Math.max(110, oh + ev.clientY - startY) });
    }
    function up() { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  }

  function enterEdit() {
    setDraftBody(note.body);
    setEditing(true);
  }

  function saveEdit() {
    onChange({ body: draftBody });
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  return (
    <div className="sticky" onPointerDown={startDrag}
      style={{ left: note.x, top: note.y, width: note.w, height: note.h, background: STICKY_TINT[note.color] || STICKY_TINT.yellow, zIndex: note.z || 1 }}>
      <div className="sticky-bar">
        <div className="sticky-colors sticky-act">
          {['yellow','pink','blue','green','violet','orange'].map(c => (
            <button key={c} className={'sticky-cdot cdot-bg-' + c + (note.color === c ? ' on' : '')}
              onClick={() => onChange({ color: c })} aria-label={c} />
          ))}
        </div>
        <div className="spacer" />
        {editing ? (
          <>
            <button className="sticky-act sticky-iconbtn" title="Save (Enter)" onMouseDown={e => { e.preventDefault(); saveEdit(); }}>
              <Icon name="check" size={14} />
            </button>
            <button className="sticky-act sticky-iconbtn" title="Cancel (Esc)" onMouseDown={e => { e.preventDefault(); cancelEdit(); }}>
              <Icon name="x" size={14} />
            </button>
          </>
        ) : (
          <button className="sticky-act sticky-iconbtn" title="Edit" onClick={enterEdit}>
            <Icon name="edit" size={14} />
          </button>
        )}
        <button className="sticky-act sticky-iconbtn" title="Delete" onClick={() => onDelete(note.id)}>
          <Icon name="trash" size={14} />
        </button>
      </div>
      {editing ? (
        <textarea className="sticky-edit" autoFocus value={draftBody}
          placeholder="Markdown…"
          onChange={e => setDraftBody(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') cancelEdit();
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEdit();
          }} />
      ) : (
        <div className="sticky-body md" onDoubleClick={enterEdit}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(note.body || '_Empty — double-click to edit_') }} />
      )}
      <div className="sticky-resize sticky-act" onPointerDown={startResize} />
    </div>
  );
}

export function Stickies() {
  const { stickies, setStickies } = useNA();
  const topZ = useRef(10);

  function add() {
    const colors = ['yellow','pink','blue','green','violet','orange'];
    const n: Sticky = {
      id: uid(),
      x: 60 + Math.round(Math.random() * 120), y: 60 + Math.round(Math.random() * 80),
      w: 210, h: 150, color: colors[Math.floor(Math.random() * colors.length)],
      body: 'New note', z: ++topZ.current,
    };
    setStickies(s => [...s, n]);
    api.stickies.create(n).catch(() => {});
  }

  function patch(id: string, p: Partial<Sticky>) {
    setStickies(list => list.map(n => n.id === id ? { ...n, ...p } : n));
    api.stickies.update(id, p).catch(() => {});
  }
  function del(id: string) {
    setStickies(list => list.filter(n => n.id !== id));
    api.stickies.remove(id).catch(() => {});
  }
  function front(id: string) { topZ.current += 1; patch(id, { z: topZ.current }); }

  const allText = stickies.map(s => s.body).join('\n');

  return (
    <div className="na-main-inner">
      <div className="na-topbar">
        <div className="title">Sticky Notes</div>
        <span className="spacer" />
        <button className="btn btn-primary" onClick={add}><Icon name="plus" size={17} /> New note</button>
      </div>
      <div className="sticky-board">
        <div className="sticky-board-hint faint">Drag to move · drag corner to resize · double-click or pencil to edit</div>
        {stickies.map(n => (
          <StickyCard key={n.id} note={n}
            onChange={p => patch(n.id, p)} onDelete={del} onFront={front} />
        ))}
        <div className="sticky-remind-dock">
          <RemindStrip text={allText} source="Sticky" />
        </div>
      </div>
    </div>
  );
}
