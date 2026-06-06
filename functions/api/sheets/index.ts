interface Env { DB: D1Database; }

interface SheetRow { id: string; title: string; cols: string; rows: string; color: string; updated: number; }

function parse(r: SheetRow) {
  return { ...r, cols: JSON.parse(r.cols), rows: JSON.parse(r.rows) };
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { method } = ctx.request;
  const db = ctx.env.DB;

  if (method === 'GET') {
    const { results } = await db.prepare('SELECT * FROM sheets ORDER BY updated DESC').all<SheetRow>();
    return Response.json(results.map(parse));
  }

  if (method === 'POST') {
    const body = await ctx.request.json() as Record<string, unknown>;
    await db.prepare('INSERT INTO sheets (id,title,cols,rows,color,updated) VALUES (?,?,?,?,?,?)')
      .bind(body.id, body.title, JSON.stringify(body.cols), JSON.stringify(body.rows), body.color, body.updated).run();
    return Response.json(body, { status: 201 });
  }

  return new Response('Method not allowed', { status: 405 });
};
