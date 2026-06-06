import { useState, useRef, useMemo, useEffect } from 'react';
import { Icon } from './icons';
import { useNA } from '../store/store';
import { parseRemind } from '../utils/parseRemind';
import { formatWhen } from '../utils/formatWhen';

function scanReminders(text: string) {
  if (!text) return [];
  const out: ReturnType<typeof parseRemind>[] = [];
  const re = /@remind\b[^\n]*/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const parsed = parseRemind(m[0]);
    if (parsed.found) out.push({ ...parsed, snippet: m[0].trim() } as typeof parsed & { snippet: string });
  }
  return out;
}

export function RemindStrip({ text, source }: { text: string; source: string }) {
  const { addReminder, pushToast } = useNA();
  const found = useMemo(() => scanReminders(text), [text]);
  const [added, setAdded] = useState<Record<string, boolean>>({});

  if (!found.length) return null;
  return (
    <div className="remind-strip">
      {found.map((f, i) => {
        const key = (f as any).snippet + i;
        const already = added[key];
        return (
          <span className="remind-found" key={key}>
            <Icon name="bell" size={15} />
            <span>{f.label}{f.when ? ' · ' + formatWhen(f.when!, f.repeat!) : ' · set a time'}</span>
            {!already && f.complete && (
              <button className="btn btn-primary" onClick={() => {
                addReminder(f, source);
                setAdded(a => ({ ...a, [key]: true }));
                pushToast({ label: 'Reminder set', source, when: f.when, repeat: f.repeat });
              }}>Add</button>
            )}
            {already && <Icon name="check" size={15} />}
            {!f.complete && <em style={{ opacity: .7, fontWeight: 600 }}>needs a time</em>}
          </span>
        );
      })}
    </div>
  );
}

const TOOLBAR = [
  { icon: 'h1' as const,     label: 'Heading',  wrap: ['## ', ''],      line: true },
  { icon: 'bold' as const,   label: 'Bold',     wrap: ['**', '**'],     line: false },
  { icon: 'italic' as const, label: 'Italic',   wrap: ['*', '*'],       line: false },
  { icon: 'list' as const,   label: 'List',     wrap: ['- ', ''],       line: true },
  { icon: 'check' as const,  label: 'Checkbox', wrap: ['- [ ] ', ''],   line: true },
  { icon: 'quote' as const,  label: 'Quote',    wrap: ['> ', ''],       line: true },
  { icon: 'link' as const,   label: 'Link',     wrap: ['[', '](url)'],  line: false },
];

interface MarkdownEditorProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  source?: string;
  toolbar?: boolean;
  autoFocus?: boolean;
  onEsc?: () => void;
}

export function MarkdownEditor({
  value, onChange, placeholder, minHeight = 360,
  source = 'Doc', toolbar = true, autoFocus = false, onEsc,
}: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function applyWrap(w: string[], lineMode: boolean) {
    const el = ref.current; if (!el) return;
    const start = el.selectionStart, end = el.selectionEnd;
    const val = value || '';
    if (lineMode) {
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      onChange(val.slice(0, lineStart) + w[0] + val.slice(lineStart));
      requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = end + w[0].length; });
    } else {
      const sel = val.slice(start, end) || '';
      onChange(val.slice(0, start) + w[0] + sel + w[1] + val.slice(end));
      requestAnimationFrame(() => {
        el.focus();
        el.selectionStart = start + w[0].length;
        el.selectionEnd = start + w[0].length + sel.length;
      });
    }
  }

  useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, [autoFocus]);

  return (
    <div>
      {toolbar && (
        <div className="row" style={{ marginBottom: 10, gap: 2, flexWrap: 'wrap' }}>
          {TOOLBAR.map(t => (
            <button key={t.label} className="btn btn-ghost btn-icon" title={t.label}
              onMouseDown={(e) => { e.preventDefault(); applyWrap(t.wrap, t.line); }}>
              <Icon name={t.icon} size={18} />
            </button>
          ))}
        </div>
      )}
      <textarea ref={ref} className="field mono-edit" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') onEsc?.(); }}
        style={{ minHeight, resize: 'vertical', lineHeight: 1.7, fontSize: 15.5 }} />
      <RemindStrip text={value} source={source} />
    </div>
  );
}
