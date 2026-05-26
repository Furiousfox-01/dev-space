const BASE = import.meta.env.VITE_API_URL ?? '/api';

export interface Doc {
  id: string;
  title: string;
  type: 'doc' | 'sheet';
  r2_key: string;
  status: 'active' | 'archived';
  version: number;
  created_at: number;
  updated_at: number;
  tags: string[];
  content?: string;
}

export interface Reminder {
  id: string;
  doc_id: string;
  raw_text: string;
  trigger_at: number;
  recurrence: string | null;
  status: 'pending' | 'fired' | 'dismissed';
  snoozed_until: number | null;
  created_at: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  docs: {
    list: (params?: { type?: string; tag?: string; q?: string; archived?: boolean }) => {
      const p = new URLSearchParams();
      if (params?.type) p.set('type', params.type);
      if (params?.tag) p.set('tag', params.tag);
      if (params?.q) p.set('q', params.q);
      if (params?.archived) p.set('archived', 'true');
      return request<Doc[]>(`/docs?${p}`);
    },
    get: (id: string) => request<Doc>(`/docs/${id}`),
    create: (data: { title: string; type?: 'doc' | 'sheet'; content?: string; tags?: string[] }) =>
      request<Doc>('/docs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { title?: string; content?: string; tags?: string[] }) =>
      request<Doc>(`/docs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/docs/${id}`, { method: 'DELETE' }),
    restore: (id: string) =>
      request<Doc>(`/docs/${id}/restore`, { method: 'POST' }),
    permanentDelete: (id: string) =>
      request<{ success: boolean }>(`/docs/${id}/permanent`, { method: 'DELETE' }),
  },

  reminders: {
    due: () => request<Reminder[]>('/reminders/due'),
    dismiss: (id: string) =>
      request<{ success: boolean }>(`/reminders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'dismissed' }),
      }),
    snooze: (id: string, until: number) =>
      request<{ success: boolean }>(`/reminders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ snoozed_until: until }),
      }),
  },

  tags: {
    list: () => request<string[]>('/tags'),
  },

  search: {
    query: (q: string) => request<Doc[]>(`/search?q=${encodeURIComponent(q)}`),
  },
};
