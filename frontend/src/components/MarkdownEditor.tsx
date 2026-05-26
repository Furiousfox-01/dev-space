import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

const REMIND_SNIPPETS = [
  '@remind tomorrow 9am',
  '@remind tomorrow 5pm',
  '@remind in 30m',
  '@remind in 1h',
  '@remind in 2h',
  '@remind today 5pm',
  '@remind every day 08:00',
  '@remind every monday 09:00',
  '@remind every friday 17:00',
  '@remind 2026-06-01 09:00',
];

function remindCompletion(context: CompletionContext) {
  const word = context.matchBefore(/@remind\s*/);
  if (!word) return null;
  return {
    from: word.from,
    options: REMIND_SNIPPETS.map(s => ({ label: s, type: 'keyword' })),
  };
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}

export function MarkdownEditor({ value, onChange, readOnly }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        history(),
        drawSelection(),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        markdown(),
        oneDark,
        autocompletion({ override: [remindCompletion] }),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.editable.of(!readOnly),
        EditorView.theme({
          '&': { height: '100%', fontSize: '14px', fontFamily: "'Geist Mono', monospace" },
          '.cm-scroller': { overflow: 'auto', lineHeight: '1.7' },
          '.cm-content': { padding: '16px 20px', minHeight: '100%' },
          '.cm-focused': { outline: 'none' },
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. switching docs)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}
