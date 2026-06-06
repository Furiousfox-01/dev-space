import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true } as object);

export function renderMarkdown(md: string): string {
  if (!md) return '';
  try {
    return marked.parse(md) as string;
  } catch {
    return md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
  }
}
