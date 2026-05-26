import { Hono } from 'hono';
import { Env, Reminder } from '../types';

const reminders = new Hono<{ Bindings: Env }>();

// GET /reminders/due  — reads from KV
reminders.get('/due', async (c) => {
  const { keys } = await c.env.KV.list({ prefix: 'reminder:' });
  const due: Reminder[] = [];

  for (const key of keys) {
    const val = await c.env.KV.get(key.name);
    if (val) {
      try {
        due.push(JSON.parse(val));
      } catch {
        // skip malformed
      }
    }
  }

  return c.json(due);
});

// PATCH /reminders/:id  — snooze or dismiss
reminders.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ status?: 'dismissed'; snoozed_until?: number }>();

  const row = await c.env.DB.prepare(`SELECT * FROM reminders WHERE id = ?`)
    .bind(id).first<Reminder>();
  if (!row) return c.json({ error: 'Not found' }, 404);

  if (body.status === 'dismissed') {
    await c.env.DB.prepare(`UPDATE reminders SET status = 'dismissed' WHERE id = ?`)
      .bind(id).run();
    await c.env.KV.delete(`reminder:${id}`);
    return c.json({ success: true });
  }

  if (body.snoozed_until) {
    await c.env.DB.prepare(`
      UPDATE reminders SET snoozed_until = ?, status = 'pending' WHERE id = ?
    `).bind(body.snoozed_until, id).run();
    await c.env.KV.delete(`reminder:${id}`);

    // Re-schedule the DO alarm
    const doId = c.env.REMINDER_SCHEDULER.idFromName('main');
    const stub = c.env.REMINDER_SCHEDULER.get(doId);
    await stub.scheduleNext();

    return c.json({ success: true });
  }

  return c.json({ error: 'Provide status=dismissed or snoozed_until' }, 400);
});

export default reminders;
