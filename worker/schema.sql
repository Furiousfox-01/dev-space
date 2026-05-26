-- Docs table
CREATE TABLE IF NOT EXISTS docs (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'doc',   -- 'doc' | 'sheet'
  r2_key      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active',
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id      TEXT PRIMARY KEY,
  doc_id  TEXT NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
  name    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tags_doc  ON tags(doc_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id             TEXT PRIMARY KEY,
  doc_id         TEXT NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
  raw_text       TEXT NOT NULL,
  trigger_at     INTEGER NOT NULL,
  recurrence     TEXT,
  status         TEXT NOT NULL DEFAULT 'pending',
  snoozed_until  INTEGER,
  created_at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reminders_trigger ON reminders(trigger_at)
  WHERE status = 'pending';

-- Full-text search (title + tags only)
CREATE VIRTUAL TABLE IF NOT EXISTS docs_fts USING fts5(
  title,
  tags,
  content = '',
  tokenize = 'porter ascii'
);
