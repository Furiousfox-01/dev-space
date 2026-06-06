interface Env { DB: D1Database; }

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { method } = ctx.request;
  const id = ctx.params.id as string;
  const db = ctx.env.DB;

  if (method === 'PUT') {
    const body = await ctx.request.json() as Record<string, unknown>;
    const serialized: Record<string, unknown> = { ...body };
    if (serialized.cols) serialized.cols = JSON.stringify(serialized.cols);
    if (serialized.rows) serialized.rows = JSON.stringify(serialized.rows);
    const fields = Object.keys(serialized).map(k => `${k} = ?`).join(', ');
    await db.prepare(`UPDATE sheets SET ${fields} WHERE id = ?`)
      .bind(...Object.values(serialized), id).run();
    return new Response(null, { status: 204 });
  }

  if (method === 'DELETE') {
    await db.prepare('DELETE FROM sheets WHERE id = ?').bind(id).run();
    return new Response(null, { status: 204 });
  }

  return new Response('Method not allowed', { status: 405 });
};
