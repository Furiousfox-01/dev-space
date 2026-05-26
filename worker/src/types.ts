export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  KV: KVNamespace;
  REMINDER_SCHEDULER: DurableObjectNamespace;
}

export interface Doc {
  id: string;
  title: string;
  type: 'doc' | 'sheet';
  r2_key: string;
  status: 'active' | 'archived';
  version: number;
  created_at: number;
  updated_at: number;
}

export interface Tag {
  id: string;
  doc_id: string;
  name: string;
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
