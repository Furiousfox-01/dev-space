interface Env { DB: D1Database; }

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { method } = ctx.request;
  const db = ctx.env.DB;

  if (method === 'GET') {
    const { results } = await db.prepare('SELECT * FROM docs ORDER BY updated DESC').all();
    return Response.json(results);
  }

  if (method === 'POST') {
    const body = await ctx.request.json() as Record<string, unknown>;
    await db.prepare('INSERT INTO docs (id,title,body,color,updated) VALUES (?,?,?,?,?)')
      .bind(body.id, body.title, body.body, body.color, body.updated).run();
    return Response.json(body, { status: 201 });
  }

  return new Response('Method not allowed', { status: 405 });
};
