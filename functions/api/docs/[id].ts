interface Env { DB: D1Database; }

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { method } = ctx.request;
  const id = ctx.params.id as string;
  const db = ctx.env.DB;

  if (method === 'PUT') {
    const body = await ctx.request.json() as Record<string, unknown>;
    const fields = Object.keys(body).map(k => `${k} = ?`).join(', ');
    await db.prepare(`UPDATE docs SET ${fields} WHERE id = ?`)
      .bind(...Object.values(body), id).run();
    return new Response(null, { status: 204 });
  }

  if (method === 'DELETE') {
    await db.prepare('DELETE FROM docs WHERE id = ?').bind(id).run();
    return new Response(null, { status: 204 });
  }

  return new Response('Method not allowed', { status: 405 });
};
