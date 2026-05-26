import { useCallback, useEffect, useRef, useState } from 'react';
import { api, Doc } from './lib/api';
import { Sidebar } from './components/Sidebar';
import { EditorPane } from './components/EditorPane';
import { TrashView } from './components/TrashView';
import { CommandBar } from './components/CommandBar';
import { ReminderOverlay } from './components/ReminderOverlay';
import { useReminders } from './hooks/useReminders';

export default function App() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrash, setShowTrash] = useState(false);
  const [showCommandBar, setShowCommandBar] = useState(false);

  const { reminders, dismiss: dismissReminder, snooze: snoozeReminder } = useReminders();

  const loadDocs = useCallback(async (tag?: string | null, q?: string) => {
    const params: Parameters<typeof api.docs.list>[0] = {};
    if (tag) params.tag = tag;
    if (q) params.q = q;
    const result = await api.docs.list(params);
    setDocs(result);
  }, []);

  const loadTags = useCallback(async () => {
    const result = await api.tags.list();
    setTags(result);
  }, []);

  useEffect(() => {
    Promise.all([loadDocs(), loadTags()]).finally(() => setLoading(false));
  }, [loadDocs, loadTags]);

  const selectDoc = useCallback(async (id: string) => {
    setShowTrash(false);
    setActiveDocId(id);
    const full = await api.docs.get(id);
    setActiveDoc(full);
  }, []);

  const newDoc = useCallback(async (type: 'doc' | 'sheet') => {
    setShowTrash(false);
    const doc = await api.docs.create({ title: 'Untitled', type, content: '' });
    setDocs(prev => [doc, ...prev]);
    await selectDoc(doc.id);
  }, [selectDoc]);

  const handleUpdate = useCallback((updated: Doc) => {
    setActiveDoc(prev => prev ? { ...prev, ...updated } : updated);
    setDocs(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
    loadTags();
  }, [loadTags]);

  const handleTagFilter = useCallback((tag: string | null) => {
    setActiveTag(tag);
    loadDocs(tag);
  }, [loadDocs]);

  const handleSearch = useCallback((q: string) => {
    if (q.trim()) {
      loadDocs(activeTag, q);
    } else {
      loadDocs(activeTag);
    }
  }, [loadDocs, activeTag]);

  const handleNavigate = useCallback((docId: string) => {
    selectDoc(docId);
  }, [selectDoc]);

  const handleShowTrash = useCallback(() => {
    setShowTrash(true);
    setActiveDocId(null);
    setActiveDoc(null);
  }, []);

  const handleRestore = useCallback(async (_id: string) => {
    await loadDocs();
    await loadTags();
  }, [loadDocs, loadTags]);

  const handleGlobalKey = useCallback((e: KeyboardEvent) => {
    if (e.key === ':' && !showCommandBar && !showTrash &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      setShowCommandBar(true);
    }
  }, [showCommandBar, showTrash]);

  useGlobalKey(handleGlobalKey);

  if (loading) {
    return (
      <div className="app-loading">
        <span className="loading-text">loading workspace…</span>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        docs={docs}
        tags={tags}
        activeDocId={activeDocId}
        onSelect={selectDoc}
        onNew={newDoc}
        onTagFilter={handleTagFilter}
        onSearch={handleSearch}
        onShowTrash={handleShowTrash}
        activeTag={activeTag}
      />
      <main className="main-content">
        {showTrash ? (
          <TrashView onClose={() => setShowTrash(false)} onRestore={handleRestore} />
        ) : activeDoc ? (
          <EditorPane key={activeDoc.id} doc={activeDoc} onUpdate={handleUpdate} onNavigate={handleNavigate} />
        ) : (
          <div className="empty-state">
            <div className="empty-state-inner">
              <div className="empty-icon">◈</div>
              <p>Select a document or create a new one.</p>
              <div className="empty-actions">
                <button className="btn-primary" onClick={() => newDoc('doc')}>+ New Doc</button>
                <button className="btn-secondary" onClick={() => newDoc('sheet')}>+ New Sheet</button>
              </div>
            </div>
          </div>
        )}
      </main>
      <ReminderOverlay
        reminders={reminders}
        onDismiss={dismissReminder}
        onSnooze={snoozeReminder}
      />
      {showCommandBar && (
        <CommandBar
          onClose={() => setShowCommandBar(false)}
          onCreateDoc={() => newDoc('doc')}
          onNavigateBack={activeDocId ? () => { setActiveDocId(null); setActiveDoc(null); } : undefined}
        />
      )}
    </div>
  );
}

function useGlobalKey(handler: (e: KeyboardEvent) => void) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    const listener = (e: KeyboardEvent) => ref.current(e);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
}
