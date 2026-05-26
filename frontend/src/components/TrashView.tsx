import { useCallback, useEffect, useState } from 'react';
import { api, Doc } from '../lib/api';
import { timeAgo } from '../lib/format';

interface Props {
  onClose: () => void;
  onRestore: (id: string) => void;
}

export function TrashView({ onClose, onRestore }: Props) {
  const [items, setItems] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.docs.list({ archived: true }).then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const handleRestore = useCallback(async (id: string) => {
    await api.docs.restore(id);
    setItems(prev => prev.filter(d => d.id !== id));
    onRestore(id);
  }, [onRestore]);

  const handlePermanentDelete = useCallback(async (id: string, title: string) => {
    if (!window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    await api.docs.permanentDelete(id);
    setItems(prev => prev.filter(d => d.id !== id));
  }, []);

  if (loading) {
    return <div className="trash-view"><div className="trash-loading">Loading…</div></div>;
  }

  return (
    <div className="trash-view">
      <div className="trash-header">
        <button className="trash-back" onClick={onClose}>← Back to docs</button>
        <span className="trash-title">Trash</span>
      </div>
      {items.length === 0 ? (
        <div className="trash-empty">Trash is empty.</div>
      ) : (
        <div className="trash-list">
          {items.map(doc => (
            <div key={doc.id} className="trash-item">
              <div className="trash-item-info">
                <span className="trash-item-title">{doc.title || 'Untitled'}</span>
                {doc.tags.length > 0 && (
                  <span className="trash-item-tags">{doc.tags.map(t => `#${t}`).join(' ')}</span>
                )}
                <span className="trash-item-time">{timeAgo(doc.updated_at)}</span>
              </div>
              <div className="trash-item-actions">
                <button className="trash-restore-btn" onClick={() => handleRestore(doc.id)}>Restore</button>
                <button className="trash-delete-btn" onClick={() => handlePermanentDelete(doc.id, doc.title)}>Delete permanently</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
