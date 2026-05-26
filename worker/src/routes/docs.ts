import { Hono } from 'hono';
import { Env, Doc } from '../types';
import { parseReminders } from '../lib/remind-parser';

const docs = new Hono<{ Bindings: Env }>();

function uuid(): string {
  return crypto.randomUUID();
}

function docWithTagsQuery(): string {
  return `SELECT d.*, GROUP_CONCAT(t.name) as tag_list FROM docs d
    LEFT JOIN tags t ON t.doc_id = d.id`;
}

function formatDocRow(row: Doc & { tag_list: string | null }) {
  return { ...row, tags: row.tag_list ? row.tag_list.split(',') : [] };
}

async function syncReminders(env: Env, docId: string, content: string): Promise<void> {
  const parsed = parseReminders(content);
  const now = Date.now();
  let changed = false;

  // Fetch existing reminders for this doc
  const { results: existing } = await env.DB.prepare(
    `SELECT id, raw_text, status FROM reminders WHERE doc_id = ?`
  ).bind(docId).all<{ id: string; raw_text: string; status: string }>();

  const existingMap = new Map(existing.map(r => [r.raw_text, r]));
  const parsedRaws = new Set(parsed.map(p => p.raw));

  // Delete reminders whose raw_text no longer exists
  for (const [raw, row] of existingMap) {
    if (!parsedRaws.has(raw)) {
      await env.DB.prepare(`DELETE FROM reminders WHERE id = ?`).bind(row.id).run();
      changed = true;
    }
  }

  // Insert new reminders
  for (const p of parsed) {
    if (!existingMap.has(p.raw)) {
      await env.DB.prepare(`
        INSERT INTO reminders (id, doc_id, raw_text, trigger_at, recurrence, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?)
      `).bind(uuid(), docId, p.raw, p.triggerAt, p.recurrence ?? null, now).run();
      changed = true;
    }
  }

  if (changed) {
    await notifyScheduler(env);
  }
}

async function syncFts(env: Env, docId: string, title: string): Promise<void> {
  const { results: tagRows } = await env.DB.prepare(
    `SELECT name FROM tags WHERE doc_id = ?`
  ).bind(docId).all<{ name: string }>();
  const tagStr = tagRows.map(t => t.name).join(' ');

  // Delete old FTS entry using docId stored in content column trick
  await env.DB.prepare(`DELETE FROM docs_fts WHERE rowid = (SELECT rowid FROM docs WHERE id = ?)`)
    .bind(docId).run();
  await env.DB.prepare(`
    INSERT INTO docs_fts(rowid, title, tags)
    SELECT rowid, ?, ? FROM docs WHERE id = ?
  `).bind(title, tagStr, docId).run();
}

async function notifyScheduler(env: Env): Promise<void> {
  const id = env.REMINDER_SCHEDULER.idFromName('main');
  const stub = env.REMINDER_SCHEDULER.get(id);
  await stub.scheduleNext();
}

// POST /docs
docs.post('/', async (c) => {
  const body = await c.req.json<{ title: string; type?: 'doc' | 'sheet'; content?: string; tags?: string[] }>();
  const now = Date.now();
  const id = uuid();
  const r2Key = `docs/${id}.md`;
  const content = body.content ?? '';
  const title = body.title?.trim() || 'Untitled';
  const type = body.type ?? 'doc';
  const tags = body.tags ?? [];

  await c.env.R2.put(r2Key, content);

  await c.env.DB.prepare(`
    INSERT INTO docs (id, title, type, r2_key, status, version, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'active', 1, ?, ?)
  `).bind(id, title, type, r2Key, now, now).run();

  for (const tag of tags) {
    await c.env.DB.prepare(`INSERT INTO tags (id, doc_id, name) VALUES (?, ?, ?)`)
      .bind(uuid(), id, tag.toLowerCase().trim()).run();
  }

  await syncReminders(c.env, id, content);
  await syncFts(c.env, id, title);

  return c.json({ id, title, type, r2_key: r2Key, status: 'active', version: 1, created_at: now, updated_at: now, tags, content }, 201);
});

// GET /docs
docs.get('/', async (c) => {
  const type = c.req.query('type');
  const tag = c.req.query('tag');
  const archived = c.req.query('archived') === 'true';
  const q = c.req.query('q');

  let query = `${docWithTagsQuery()} WHERE d.status = ?`;
  const params: (string | number)[] = [archived ? 'archived' : 'active'];

  if (type) { query += ` AND d.type = ?`; params.push(type); }
  if (tag) { query += ` AND d.id IN (SELECT doc_id FROM tags WHERE name = ?)`; params.push(tag.toLowerCase()); }
  if (q) {
    query += ` AND d.id IN (
      SELECT d2.id FROM docs d2
      JOIN docs_fts ON docs_fts.rowid = d2.rowid
      WHERE docs_fts MATCH ?
    )`;
    params.push(q);
  }

  query += ` GROUP BY d.id ORDER BY d.updated_at DESC`;

  const stmt = c.env.DB.prepare(query);
  const { results } = await stmt.bind(...params).all<Doc & { tag_list: string | null }>();

  return c.json(results.map(formatDocRow));
});

// GET /docs/:id
docs.get('/:id', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(
    `${docWithTagsQuery()} WHERE d.id = ? GROUP BY d.id`
  ).bind(id).first<Doc & { tag_list: string | null }>();

  if (!row) return c.json({ error: 'Not found' }, 404);

  const obj = await c.env.R2.get(row.r2_key);
  const content = obj ? await obj.text() : '';

  return c.json({ ...formatDocRow(row), content });
});

// PUT /docs/:id
docs.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ title?: string; content?: string; tags?: string[] }>();
  const now = Date.now();

  const row = await c.env.DB.prepare(`SELECT * FROM docs WHERE id = ?`).bind(id).first<Doc>();
  if (!row) return c.json({ error: 'Not found' }, 404);

  const title = body.title?.trim() ?? row.title;
  const content = body.content ?? '';

  await c.env.R2.put(row.r2_key, content);
  await c.env.DB.prepare(`
    UPDATE docs SET title = ?, updated_at = ?, version = version + 1 WHERE id = ?
  `).bind(title, now, id).run();

  if (body.tags !== undefined) {
    await c.env.DB.prepare(`DELETE FROM tags WHERE doc_id = ?`).bind(id).run();
    for (const tag of body.tags) {
      await c.env.DB.prepare(`INSERT INTO tags (id, doc_id, name) VALUES (?, ?, ?)`)
        .bind(uuid(), id, tag.toLowerCase().trim()).run();
    }
  }

  await syncReminders(c.env, id, content);
  await syncFts(c.env, id, title);

  const updated = await c.env.DB.prepare(
    `${docWithTagsQuery()} WHERE d.id = ? GROUP BY d.id`
  ).bind(id).first<Doc & { tag_list: string | null }>();

  if (!updated) return c.json({ error: 'Not found' }, 404);
  return c.json({ ...formatDocRow(updated), content });
});

docs.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`UPDATE docs SET status = 'archived', updated_at = ? WHERE id = ?`).bind(Date.now(), id).run();
  return c.json({ success: true });
});

docs.post('/:id/restore', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(`SELECT * FROM docs WHERE id = ?`).bind(id).first<Doc>();
  if (!row) return c.json({ error: 'Not found' }, 404);
  if (row.status !== 'archived') return c.json({ error: 'Doc is not archived' }, 400);

  const now = Date.now();
  await c.env.DB.prepare(`UPDATE docs SET status = 'active', updated_at = ? WHERE id = ?`).bind(now, id).run();

  const obj = await c.env.R2.get(row.r2_key);
  const content = obj ? await obj.text() : '';
  await syncReminders(c.env, id, content);
  await syncFts(c.env, id, row.title);

  const updated = await c.env.DB.prepare(
    `${docWithTagsQuery()} WHERE d.id = ? GROUP BY d.id`
  ).bind(id).first<Doc & { tag_list: string | null }>();
  if (!updated) return c.json({ error: 'Not found' }, 404);
  return c.json({ ...formatDocRow(updated), content });
});

docs.delete('/:id/permanent', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(`SELECT * FROM docs WHERE id = ?`).bind(id).first<Doc>();
  if (!row) return c.json({ error: 'Not found' }, 404);

  const { results: reminderRows } = await c.env.DB.prepare(
    `SELECT id FROM reminders WHERE doc_id = ?`
  ).bind(id).all<{ id: string }>();
  await Promise.all(reminderRows.map(r => c.env.KV.delete(`reminder:${r.id}`)));

  await c.env.R2.delete(row.r2_key);

  // Atomic cleanup: tags → reminders → FTS → doc (no PRAGMA foreign_keys dependency)
  await c.env.DB.batch([
    c.env.DB.prepare(`DELETE FROM tags WHERE doc_id = ?`).bind(id),
    c.env.DB.prepare(`DELETE FROM reminders WHERE doc_id = ?`).bind(id),
    c.env.DB.prepare(`DELETE FROM docs_fts WHERE rowid = (SELECT rowid FROM docs WHERE id = ?)`).bind(id),
    c.env.DB.prepare(`DELETE FROM docs WHERE id = ?`).bind(id),
  ]);

  return c.json({ success: true });
});

export default docs;
