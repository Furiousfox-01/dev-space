interface Env { DB: D1Database; }

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { method } = ctx.request;
  const db = ctx.env.DB;

  if (method === 'GET') {
    const { results } = await db.prepare('SELECT * FROM stickies ORDER BY z ASC').all();
    return Response.json(results);
  }

  if (method === 'POST') {
    const body = await ctx.request.json() as Record<string, unknown>;
    await db.prepare('INSERT INTO stickies (id,body,x,y,w,h,z,color,updated) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(body.id, body.body, body.x, body.y, body.w, body.h, body.z, body.color, Date.now()).run();
    return Response.json(body, { status: 201 });
  }

  return new Response('Method not allowed', { status: 405 });
};
