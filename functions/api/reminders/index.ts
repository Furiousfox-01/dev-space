interface Env { DB: D1Database; }

interface ReminderRow {
  id: string; label: string; when: number | null; repeat: string;
  enabled: number; fired: number; last_fired_date: string | null; source: string; created_at: number;
}

function parse(r: ReminderRow) {
  return { ...r, enabled: r.enabled === 1, fired: r.fired === 1, lastFiredDate: r.last_fired_date };
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { method } = ctx.request;
  const db = ctx.env.DB;

  if (method === 'GET') {
    const { results } = await db.prepare('SELECT * FROM reminders ORDER BY "when" ASC').all<ReminderRow>();
    return Response.json(results.map(parse));
  }

  if (method === 'POST') {
    const body = await ctx.request.json() as Record<string, unknown>;
    await db.prepare('INSERT INTO reminders (id,label,"when",repeat,enabled,fired,last_fired_date,source,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(body.id, body.label, body.when, body.repeat, body.enabled ? 1 : 0, body.fired ? 1 : 0, body.lastFiredDate ?? null, body.source, Date.now()).run();
    return Response.json(body, { status: 201 });
  }

  return new Response('Method not allowed', { status: 405 });
};
