import { DurableObject } from 'cloudflare:workers';
import { Env, Reminder } from '../types';
import { computeNextRecurrence } from '../lib/remind-parser';

export class ReminderScheduler extends DurableObject {
  env: Env;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.env = env;
  }

  async scheduleNext(): Promise<void> {
    const now = Date.now();
    const result = await this.env.DB.prepare(`
      SELECT * FROM reminders
      WHERE status = 'pending'
        AND (snoozed_until IS NULL OR snoozed_until <= ?)
      ORDER BY trigger_at ASC
      LIMIT 1
    `).bind(now).first<Reminder>();

    if (result) {
      await this.ctx.storage.setAlarm(result.trigger_at);
    }
  }

  async alarm(): Promise<void> {
    const now = Date.now();

    // Fetch all due reminders
    const { results: due } = await this.env.DB.prepare(`
      SELECT * FROM reminders
      WHERE status = 'pending'
        AND trigger_at <= ?
        AND (snoozed_until IS NULL OR snoozed_until <= ?)
    `).bind(now, now).all<Reminder>();

    for (const r of due) {
      // Write to KV for frontend pickup (24h TTL)
      await this.env.KV.put(
        `reminder:${r.id}`,
        JSON.stringify(r),
        { expirationTtl: 60 * 60 * 24 }
      );

      if (r.recurrence) {
        // Compute next trigger for recurring reminders
        const nextTrigger = computeNextRecurrence(r.recurrence);
        if (nextTrigger) {
          await this.env.DB.prepare(`
            UPDATE reminders SET trigger_at = ?, status = 'pending', snoozed_until = NULL
            WHERE id = ?
          `).bind(nextTrigger, r.id).run();
        } else {
          await this.env.DB.prepare(`UPDATE reminders SET status = 'fired' WHERE id = ?`)
            .bind(r.id).run();
        }
      } else {
        await this.env.DB.prepare(`UPDATE reminders SET status = 'fired' WHERE id = ?`)
          .bind(r.id).run();
      }
    }

    // Also handle snoozed reminders that are now due
    const { results: snoozed } = await this.env.DB.prepare(`
      SELECT * FROM reminders
      WHERE status = 'pending'
        AND snoozed_until IS NOT NULL
        AND snoozed_until <= ?
    `).bind(now).all<Reminder>();

    for (const r of snoozed) {
      await this.env.KV.put(
        `reminder:${r.id}`,
        JSON.stringify(r),
        { expirationTtl: 60 * 60 * 24 }
      );
      await this.env.DB.prepare(`
        UPDATE reminders SET snoozed_until = NULL WHERE id = ?
      `).bind(r.id).run();
    }

    await this.scheduleNext();
  }
}
