import { Hono } from 'hono';
import { Env } from '../types';

const tags = new Hono<{ Bindings: Env }>();
const search = new Hono<{ Bindings: Env }>();

// GET /tags
tags.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT DISTINCT name FROM tags ORDER BY name ASC`
  ).all<{ name: string }>();
  return c.json(results.map(r => r.name));
});

// GET /search?q=
search.get('/', async (c) => {
  const q = c.req.query('q')?.trim();
  if (!q) return c.json([]);

  const { results } = await c.env.DB.prepare(`
    SELECT d.id, d.title, d.type, d.status, d.updated_at,
           GROUP_CONCAT(t.name) as tag_list
    FROM docs d
    JOIN docs_fts ON docs_fts.rowid = d.rowid
    LEFT JOIN tags t ON t.doc_id = d.id
    WHERE docs_fts MATCH ?
      AND d.status = 'active'
    GROUP BY d.id
    ORDER BY rank
    LIMIT 20
  `).bind(q).all<{ id: string; title: string; type: string; status: string; updated_at: number; tag_list: string | null }>();

  return c.json(results.map(r => ({
    ...r,
    tags: r.tag_list ? r.tag_list.split(',') : []
  })));
});

export { tags, search };
