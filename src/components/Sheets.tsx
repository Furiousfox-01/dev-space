import { useState } from 'react';
import { useNA } from '../store/store';
import { Icon } from './icons';
import { ColorPicker } from './Docs';
import { uid } from '../utils/uid';
import { api } from '../api/client';
import { timeAgo } from './Home';
import type { Sheet } from '../types';

function toMarkdownTable(cols: string[], rows: string[][]): string {
  const head = '| ' + cols.join(' | ') + ' |';
  const sep = '| ' + cols.map(() => '---').join(' | ') + ' |';
  const body = rows.map(r => '| ' + cols.map((_, i) => (r[i] ?? '').toString().replace(/\|/g, '\\|')).join(' | ') + ' |').join('\n');
  return [head, sep, body].join('\n');
}

function SheetsList() {
  const { sheets, setSheets, go } = useNA();

  function add() {
    const id = uid();
    const sheet: Sheet = { id, title: 'Untitled sheet', color: 'green',
      cols: ['Column A', 'Column B', 'Column C'],
      rows: [['','',''],['','','']], updated: Date.now() };
    setSheets(s => [sheet, ...s]);
    api.sheets.create(sheet).catch(() => {});
    go('sheets', id);
  }

  return (
    <div className="na-pad">
      <div className="row" style={{ marginBottom: 18 }}>
        <h2 className="t-h2">Sheets</h2>
        <span className="spacer" />
        <button className="btn btn-primary" onClick={add}><Icon name="plus" size={17} /> New sheet</button>
      </div>
      {sheets.length === 0 && <div className="empty"><div className="big">No sheets yet</div>Make a quick table.</div>}
      <div className="doc-grid">
        {sheets.map(s => (
          <button key={s.id} className="card hover doc-tile" onClick={() => go('sheets', s.id)}>
            <span className={'doc-tile-bar cdot-bg-' + s.color} />
            <span className="doc-tile-title">{s.title || 'Untitled'}</span>
            <span className="doc-tile-excerpt">{s.cols.join(' · ')} — {s.rows.length} rows</span>
            <span className="doc-tile-meta faint">{timeAgo(s.updated)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SheetEditor({ id }: { id: string }) {
  const { sheets, setSheets, go } = useNA();
  const sheet = sheets.find(s => s.id === id);
  const [showMd, setShowMd] = useState(false);
  if (!sheet) return <div className="na-pad"><div className="empty">Sheet not found.</div></div>;

  function patch(p: Partial<Sheet>) {
    const updated = Date.now();
    setSheets(list => list.map(s => s.id === id ? { ...s, ...p, updated } : s));
    api.sheets.update(id, { ...p, updated }).catch(() => {});
  }
  function setCell(r: number, c: number, v: string) { const rows = sheet!.rows.map(row => row.slice()); rows[r][c] = v; patch({ rows }); }
  function setCol(c: number, v: string) { const cols = sheet!.cols.slice(); cols[c] = v; patch({ cols }); }
  function addRow() { patch({ rows: [...sheet!.rows, sheet!.cols.map(() => '')] }); }
  function addCol() { patch({ cols: [...sheet!.cols, 'Column ' + String.fromCharCode(65 + sheet!.cols.length)], rows: sheet!.rows.map(r => [...r, '']) }); }
  function delRow(r: number) { patch({ rows: sheet!.rows.filter((_, i) => i !== r) }); }
  function delCol(c: number) { patch({ cols: sheet!.cols.filter((_, i) => i !== c), rows: sheet!.rows.map(r => r.filter((_, i) => i !== c)) }); }
  function del() { setSheets(list => list.filter(s => s.id !== id)); api.sheets.remove(id).catch(() => {}); go('sheets'); }

  return (
    <div className="na-pad">
      <div className="row" style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost" onClick={() => go('sheets')}><Icon name="chevronLeft" size={18} /> Sheets</button>
        <span className="spacer" />
        <ColorPicker value={sheet.color} onChange={c => patch({ color: c })} />
        <button className="btn btn-outline" onClick={() => setShowMd(v => !v)}>
          <Icon name="table" size={16} /> {showMd ? 'Grid' : 'Markdown'}
        </button>
        <button className="btn btn-ghost btn-danger btn-icon" title="Delete" onClick={del}><Icon name="trash" size={18} /></button>
      </div>
      <input className="doc-title-input" value={sheet.title} placeholder="Untitled sheet"
        onChange={e => patch({ title: e.target.value })} />
      <div style={{ height: 18 }} />
      {showMd ? (
        <pre className="md-source">{toMarkdownTable(sheet.cols, sheet.rows)}</pre>
      ) : (
        <div className="sheet-wrap">
          <table className="sheet">
            <thead>
              <tr>
                <th className="sheet-corner" />
                {sheet.cols.map((c, ci) => (
                  <th key={ci}>
                    <div className="sheet-colhead">
                      <input value={c} onChange={e => setCol(ci, e.target.value)} />
                      <button className="sheet-del" title="Delete column" onClick={() => delCol(ci)}><Icon name="x" size={13} /></button>
                    </div>
                  </th>
                ))}
                <th className="sheet-add"><button onClick={addCol} title="Add column"><Icon name="plus" size={15} /></button></th>
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((row, ri) => (
                <tr key={ri}>
                  <td className="sheet-rownum">
                    <span>{ri + 1}</span>
                    <button className="sheet-del" title="Delete row" onClick={() => delRow(ri)}><Icon name="x" size={12} /></button>
                  </td>
                  {sheet.cols.map((_, ci) => (
                    <td key={ci}><input value={row[ci] ?? ''} onChange={e => setCell(ri, ci, e.target.value)} /></td>
                  ))}
                  <td />
                </tr>
              ))}
              <tr>
                <td className="sheet-add"><button onClick={addRow} title="Add row"><Icon name="plus" size={15} /></button></td>
                <td colSpan={sheet.cols.length + 1} className="faint" style={{ paddingLeft: 12, fontSize: 13 }}>Add row</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function Sheets({ id }: { id?: string | null }) {
  return id ? <SheetEditor id={id} /> : <SheetsList />;
}
