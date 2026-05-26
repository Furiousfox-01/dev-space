import { useMemo } from 'react';
import markdownit from 'markdown-it';

const md = markdownit({ html: false, linkify: true, typographer: true });

interface Props {
  content: string;
  onNavigate?: (docId: string) => void;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function stripEventHandlers(html: string): string {
  return html.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

function renderWikiLinks(html: string): string {
  const codeSpans: string[] = [];

  const withoutCode = html.replace(/(`+)(.+?)\1/g, (_match) => {
    codeSpans.push(_match);
    return `\x00CODE${codeSpans.length - 1}\x00`;
  });

  const withLinks = withoutCode.replace(
    /\[\[([^\]|]+)(?:\|([^\]|]+))?\]\]/g,
    (_match, id: string, label?: string) => {
      const text = escapeHtml(label ?? id);
      return `<a href="#" data-doc-id="${encodeURIComponent(id)}" class="wiki-link">${text}</a>`;
    }
  );

  return withLinks.replace(/\x00CODE(\d+)\x00/g, (_match, index: string) => codeSpans[parseInt(index)]);
}

export function MarkdownPreview({ content, onNavigate }: Props) {
  const html = useMemo(() => {
    const raw = md.render(content);
    return stripEventHandlers(renderWikiLinks(raw));
  }, [content]);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = (e.target as HTMLElement).closest('.wiki-link') as HTMLAnchorElement | null;
    if (target?.dataset.docId) {
      e.preventDefault();
      onNavigate?.(decodeURIComponent(target.dataset.docId));
    }
  }

  return (
    <div
      className="markdown-preview"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
