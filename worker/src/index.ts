import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import docs from './routes/docs';
import reminders from './routes/reminders';
import { tags, search } from './routes/tags-search';

export { ReminderScheduler } from './durable-objects/reminder-scheduler';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: '*',   // Cloudflare Access handles auth; CORS allows Pages SPA to call the Worker
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.route('/docs', docs);
app.route('/reminders', reminders);
app.route('/tags', tags);
app.route('/search', search);

app.get('/health', (c) => c.json({ ok: true }));

export default app;
