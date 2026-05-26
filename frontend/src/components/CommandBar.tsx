import { useEffect, useRef, useState } from 'react';

interface Props {
  onClose: () => void;
  onCreateDoc: () => void;
  onSave?: () => void;
  onNavigateBack?: () => void;
}

type Match =
  | { kind: 'exact'; label: string }
  | { kind: 'unknown' }
  | { kind: 'help'; commands: { key: string; desc: string }[] }
  | null;

const COMMANDS = [
  { key: ':w', desc: 'Save current doc' },
  { key: ':q', desc: 'Go back' },
  { key: ':wq', desc: 'Save and go back' },
  { key: ':new', desc: 'Create a new doc' },
  { key: ':help', desc: 'Show available commands' },
];

function matchCommand(input: string): Match {
  const trimmed = input.trim();
  if (trimmed === ':w' || trimmed === ':wq' || trimmed === ':new') {
    return { kind: 'exact', label: trimmed };
  }
  if (trimmed === ':q') {
    return { kind: 'exact', label: trimmed };
  }
  if (trimmed === ':help') {
    return { kind: 'help', commands: COMMANDS };
  }
  if (trimmed.length > 1 && !COMMANDS.some(c => c.key === trimmed)) {
    return { kind: 'unknown' };
  }
  return null;
}

export function CommandBar({ onClose, onCreateDoc, onSave, onNavigateBack }: Props) {
  const [input, setInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'Enter') {
      const match = matchCommand(input);
      if (!match || match.kind === 'unknown') {
        if (input.trim()) setMessage('Unknown command');
        return;
      }

      if (match.kind === 'help') {
        setMessage(null);
        return;
      }

      if (match.label === ':w') {
        onSave?.();
        onClose();
      } else if (match.label === ':q') {
        onNavigateBack?.();
        onClose();
      } else if (match.label === ':wq') {
        onSave?.();
        onNavigateBack?.();
        onClose();
      } else if (match.label === ':new') {
        onCreateDoc();
        onClose();
      }
    }
  }

  const match = matchCommand(input);

  return (
    <div className="command-bar-backdrop" onClick={onClose}>
      <div className="command-bar" onClick={e => e.stopPropagation()}>
        <div className="command-bar-input-wrap">
          <span className="command-bar-prefix">:</span>
          <input
            ref={inputRef}
            className="command-bar-input"
            value={input}
            onChange={e => { setInput(e.target.value); setMessage(null); }}
            onKeyDown={handleKeyDown}
            placeholder="type a command…"
          />
        </div>
        {(message || match?.kind === 'help' || match?.kind === 'unknown') && (
          <div className="command-bar-hint">
            {match?.kind === 'help' ? (
              <div className="command-bar-help">
                {COMMANDS.map(c => (
                  <span key={c.key} className="command-bar-help-item">
                    <span className="command-bar-help-key">{c.key}</span>
                    <span className="command-bar-help-desc">{c.desc}</span>
                  </span>
                ))}
              </div>
            ) : message ? (
              <span className="command-bar-msg">{message}</span>
            ) : match?.kind === 'unknown' ? (
              <span className="command-bar-msg">Unknown command</span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
