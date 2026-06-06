export type IconName =
  | 'doc' | 'sheet' | 'sticky' | 'bell' | 'home' | 'plus' | 'search' | 'trash'
  | 'check' | 'clock' | 'more' | 'x' | 'chevronLeft' | 'drag' | 'eye' | 'edit'
  | 'bold' | 'italic' | 'h1' | 'list' | 'quote' | 'link' | 'table' | 'sun' | 'moon' | 'repeat';

const PATHS: Record<IconName, React.ReactNode> = {
  doc: <><path d="M7 3.5h6.5L18 8v12.5H7z"/><path d="M13 3.5V8h5"/><path d="M9.5 12.5h6M9.5 16h4"/></>,
  sheet: <><rect x="4.5" y="5" width="15" height="14" rx="1.5"/><path d="M4.5 9.5h15M4.5 14h15M9.5 5v14M14.5 5v14"/></>,
  sticky: <><path d="M5 5h14v9.5L14.5 19H5z"/><path d="M19 14.5H14.5V19"/></>,
  bell: <><path d="M6.5 16c1-1 1.2-2.4 1.2-4.3 0-2.6 1.5-4.7 4.3-4.7s4.3 2.1 4.3 4.7c0 1.9.2 3.3 1.2 4.3z"/><path d="M10.3 19a1.9 1.9 0 0 0 3.4 0"/><path d="M12 5v1.7"/></>,
  home: <><path d="M4.5 11 12 5l7.5 6"/><path d="M6.5 9.8V19h11V9.8"/></>,
  plus: <><path d="M12 5.5v13M5.5 12h13"/></>,
  search: <><circle cx="11" cy="11" r="6"/><path d="m20 20-3.6-3.6"/></>,
  trash: <><path d="M5.5 7h13M9.5 7V5.5h5V7M7 7l.8 12h8.4L17 7"/></>,
  check: <><path d="m5 12.5 4.5 4.5L19 7"/></>,
  clock: <><circle cx="12" cy="12" r="7.5"/><path d="M12 7.5V12l3 2"/></>,
  more: <><circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/></>,
  x: <><path d="M6 6l12 12M18 6 6 18"/></>,
  chevronLeft: <><path d="M14.5 6 9 12l5.5 6"/></>,
  drag: <><circle cx="9" cy="7" r="1.1"/><circle cx="15" cy="7" r="1.1"/><circle cx="9" cy="12" r="1.1"/><circle cx="15" cy="12" r="1.1"/><circle cx="9" cy="17" r="1.1"/><circle cx="15" cy="17" r="1.1"/></>,
  eye: <><path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
  edit: <><path d="M15.5 5.5 18.5 8.5 9 18l-3.5.5L6 15z"/></>,
  bold: <><path d="M7.5 5.5h5a3 3 0 0 1 0 6h-5zM7.5 11.5h5.5a3.2 3.2 0 0 1 0 6.5H7.5z"/></>,
  italic: <><path d="M11 5.5h6M7 18.5h6M14 5.5 10 18.5"/></>,
  h1: <><path d="M4 6v12M4 12h7M11 6v12"/><path d="M16 9.5 18.5 8v10"/></>,
  list: <><path d="M9 7h10M9 12h10M9 17h10"/><circle cx="5" cy="7" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="17" r="1"/></>,
  quote: <><path d="M9 7c-2 .8-3 2.4-3 5v5h4v-5H7c0-1.6.7-2.6 2-3zM18 7c-2 .8-3 2.4-3 5v5h4v-5h-3c0-1.6.7-2.6 2-3z"/></>,
  link: <><path d="M10 14a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5L11 8"/><path d="M14 10a3.5 3.5 0 0 0-5 0l-2.5 2.5a3.5 3.5 0 0 0 5 5L13 16"/></>,
  table: <><rect x="4.5" y="6" width="15" height="12" rx="1"/><path d="M4.5 10.5h15M10 6v12"/></>,
  sun: <><circle cx="12" cy="12" r="3.5"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18"/></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a6.5 6.5 0 1 0 10.5 10.5z"/>,
  repeat: <><path d="M5 9a5 5 0 0 1 5-4h6l-2-2M19 15a5 5 0 0 1-5 4H8l2 2"/></>,
};

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 20, stroke = 1.8, className = '', style = {} }: IconProps) {
  const p = PATHS[name];
  if (!p) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={'na-icon ' + className} style={style} aria-hidden="true">
      {p}
    </svg>
  );
}

export interface Tool { key: string; label: string; icon: IconName; color: string; blurb: string; }

export const TOOLS: Tool[] = [
  { key: 'docs',     label: 'Docs',         icon: 'doc',    color: 'blue',   blurb: 'Long-form Markdown writing' },
  { key: 'sheets',   label: 'Sheets',       icon: 'sheet',  color: 'green',  blurb: 'Quick Markdown tables' },
  { key: 'stickies', label: 'Sticky Notes', icon: 'sticky', color: 'yellow', blurb: 'Freeform board of small notes' },
  { key: 'remind',   label: 'Remind',       icon: 'bell',   color: 'pink',   blurb: 'Type @remind anywhere' },
];
