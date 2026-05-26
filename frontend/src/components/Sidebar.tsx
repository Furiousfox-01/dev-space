import { useState } from 'react';
import { Doc } from '../lib/api';
import { timeAgo } from '../lib/format';

interface Props {
  docs: Doc[];
  tags: string[];
  activeDocId: string | null;
  onSelect: (id: string) => void;
  onNew: (type: 'doc' | 'sheet') => void;
  onTagFilter: (tag: string | null) => void;
  onSearch: (q: string) => void;
  onShowTrash?: () => void;
  activeTag: string | null;
}

export function Sidebar({ docs, tags, activeDocId, onSelect, onNew, onTagFilter, onSearch, onShowTrash, activeTag }: Props) {
  const [searchVal, setSearchVal] = useState('');

  function handleSearch(val: string) {
    setSearchVal(val);
    onSearch(val);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">workspace</span>
        <div className="new-buttons">
          <button onClick={() => onNew('doc')} className="btn-new" title="New doc">+ doc</button>
          <button onClick={() => onNew('sheet')} className="btn-new" title="New sheet">+ sheet</button>
        </div>
      </div>

      <div className="search-wrap">
        <input
          className="search-input"
          placeholder="Search…"
          value={searchVal}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {tags.length > 0 && (
        <div className="tag-filters">
          <button
            className={`tag-chip ${activeTag === null ? 'active' : ''}`}
            onClick={() => onTagFilter(null)}
          >all</button>
          {tags.map(t => (
            <button
              key={t}
              className={`tag-chip ${activeTag === t ? 'active' : ''}`}
              onClick={() => onTagFilter(t)}
            >#{t}</button>
          ))}
        </div>
      )}

      <nav className="doc-list">
        {docs.length === 0 && (
          <div className="doc-list-empty">No documents yet.</div>
        )}
        {docs.map(doc => (
          <button
            key={doc.id}
            className={`doc-item ${activeDocId === doc.id ? 'active' : ''}`}
            onClick={() => onSelect(doc.id)}
          >
            <span className="doc-type-icon">{doc.type === 'sheet' ? '⊞' : '≡'}</span>
            <span className="doc-item-title">{doc.title || 'Untitled'}</span>
            <span className="doc-item-time">{timeAgo(doc.updated_at)}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="trash-link" onClick={onShowTrash}>🗑 trash</button>
      </div>
    </aside>
  );
}
