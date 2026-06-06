import type { Doc, Sheet, Sticky, Reminder } from '../types';

type Updater<T> = Partial<T>;

function crud<T extends { id: string }>(base: string) {
  return {
    async list(): Promise<T[]> {
      const r = await fetch(base);
      if (!r.ok) throw new Error(`GET ${base} failed`);
      return r.json();
    },
    async create(item: T): Promise<T> {
      const r = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!r.ok) throw new Error(`POST ${base} failed`);
      return r.json();
    },
    async update(id: string, patch: Updater<T>): Promise<void> {
      const r = await fetch(`${base}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error(`PUT ${base}/${id} failed`);
    },
    async remove(id: string): Promise<void> {
      const r = await fetch(`${base}/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error(`DELETE ${base}/${id} failed`);
    },
  };
}

export const api = {
  docs:      crud<Doc>('/api/docs'),
  sheets:    crud<Sheet>('/api/sheets'),
  stickies:  crud<Sticky>('/api/stickies'),
  reminders: crud<Reminder>('/api/reminders'),
};
