interface Env { DB: D1Database; }

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { method } = ctx.request;
  const id = ctx.params.id as string;
  const db = ctx.env.DB;

  if (method === 'PUT') {
    const body = await ctx.request.json() as Record<string, unknown>;
    const serialized: Record<string, unknown> = { ...body };
    if ('enabled' in serialized) serialized.enabled = serialized.enabled ? 1 : 0;
    if ('fired' in serialized) serialized.fired = serialized.fired ? 1 : 0;
    if ('lastFiredDate' in serialized) { serialized.last_fired_date = serialized.lastFiredDate; delete serialized.lastFiredDate; }
    const fields = Object.keys(serialized).map(k => `"${k}" = ?`).join(', ');
    await db.prepare(`UPDATE reminders SET ${fields} WHERE id = ?`)
      .bind(...Object.values(serialized), id).run();
    return new Response(null, { status: 204 });
  }

  if (method === 'DELETE') {
    await db.prepare('DELETE FROM reminders WHERE id = ?').bind(id).run();
    return new Response(null, { status: 204 });
  }

  return new Response('Method not allowed', { status: 405 });
};
