import { useCallback, useEffect, useRef, useState } from 'react';
import { Doc, api } from '../lib/api';
import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownPreview } from './MarkdownPreview';

interface Props {
  doc: Doc;
  onUpdate: (doc: Doc) => void;
  onNavigate?: (docId: string) => void;
}

const AUTOSAVE_DELAY = 2000;

export function EditorPane({ doc, onUpdate, onNavigate }: Props) {
  const [title, setTitle] = useState(doc.title);
  const [content, setContent] = useState(doc.content ?? '');
  const [tagInput, setTagInput] = useState(doc.tags.join(', '));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ title: string; content: string; tags: string[] } | null>(null);

  useEffect(() => {
    setTitle(doc.title);
    setContent(doc.content ?? '');
    setTagInput(doc.tags.join(', '));
    setSaved(false);
  }, [doc.id]);

  const save = useCallback(async (t: string, c: string, tags: string[]) => {
    setSaving(true);
    try {
      const updated = await api.docs.update(doc.id, { title: t, content: c, tags });
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSaving(false);
    }
  }, [doc.id, onUpdate]);

  const scheduleSave = useCallback((t: string, c: string, rawTags: string) => {
    const tags = rawTags.split(',').map(s => s.trim()).filter(Boolean);
    pendingRef.current = { title: t, content: c, tags };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (pendingRef.current) {
        const { title, content, tags } = pendingRef.current;
        pendingRef.current = null;
        save(title, content, tags);
      }
    }, AUTOSAVE_DELAY);
  }, [save]);

  const handleTitle = (val: string) => {
    setTitle(val);
    scheduleSave(val, content, tagInput);
  };

  const handleContent = (val: string) => {
    setContent(val);
    scheduleSave(title, val, tagInput);
  };

  const handleTags = (val: string) => {
    setTagInput(val);
    scheduleSave(title, content, val);
  };

  const insertTable = () => {
    const table = '\n| Column 1 | Column 2 | Column 3 |\n|---|---|---|\n| | | |\n';
    handleContent(content + table);
  };

  const insertRemind = () => {
    const remind = '\n@remind tomorrow 9am\n';
    handleContent(content + remind);
  };

  return (
    <div className="editor-pane">
      <div className="editor-topbar">
        <input
          className="title-input"
          value={title}
          onChange={e => handleTitle(e.target.value)}
          placeholder="Untitled"
        />
        <div className="editor-meta">
          <input
            className="tag-input"
            value={tagInput}
            onChange={e => handleTags(e.target.value)}
            placeholder="tags: work, ideas…"
          />
          <div className="save-indicator">
            {saving ? <span className="saving">saving…</span> : saved ? <span className="saved">✓ saved</span> : null}
          </div>
        </div>
        <div className="editor-toolbar">
          <button onClick={insertTable} className="toolbar-btn" title="Insert table">⊞ table</button>
          <button onClick={insertRemind} className="toolbar-btn" title="Insert @remind">🔔 remind</button>
          <button
            onClick={() => setPreview(v => !v)}
            className={`toolbar-btn ${preview ? 'active' : ''}`}
            title="Toggle preview"
          >
            {preview ? '✎ edit' : 'preview'}
          </button>
        </div>
      </div>
      <div className="editor-body">
        {preview ? (
          <MarkdownPreview content={content} onNavigate={onNavigate} />
        ) : (
          <MarkdownEditor value={content} onChange={handleContent} />
        )}
      </div>
    </div>
  );
}
