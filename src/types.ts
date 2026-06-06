export interface Doc {
  id: string;
  title: string;
  body: string;
  color: string;
  updated: number;
}

export interface Sheet {
  id: string;
  title: string;
  cols: string[];
  rows: string[][];
  color: string;
  updated: number;
}

export interface Sticky {
  id: string;
  body: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  color: string;
}

export interface Reminder {
  id: string;
  label: string;
  when: number | null;
  repeat: 'once' | 'daily';
  enabled: boolean;
  fired: boolean;
  lastFiredDate: string | null;
  source: string;
}

export interface Toast {
  key: string;
  label: string;
  source?: string;
  when?: number | null;
  repeat?: string;
}

export interface Route {
  name: string;
  id: string | null;
}

export interface ParsedRemind {
  found: boolean;
  label?: string;
  when?: number | null;
  repeat?: 'once' | 'daily';
  timeHHMM?: string | null;
  complete?: boolean;
  raw?: string;
}
