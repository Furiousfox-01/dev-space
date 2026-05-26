# Markdown Workspace — Glossary

## Domains & Aggregates

### Doc

A unit of user-authored content. Every doc has a **type** that determines its editing mode:

- **doc** — freeform markdown text.
- **sheet** — a structured markdown table edited as an interactive grid (*frontend-only distinction; at the data layer both are plain markdown*).

A doc's body is stored as a blob in R2 (`docs/{id}.md`); metadata (title, type, status, tags, version, timestamps) lives in D1.

- **id** — `UUID` (v4), generated server-side.
- **title** — freeform string, defaults to `"Untitled"`.
- **status** — `active` (visible and editable) or `archived` (soft-deleted, not exposed in normal views).
- **version** — integer, bumped on every update.
- **tags** — see [Tag](#tag).
- **created_at** / **updated_at** — Unix millisecond timestamps.

Docs are always single-author (personal tool). There is no multi-user, no collaboration, and no access control.

### Tag

A case-insensitive label attached to a Doc. Tags are flat (no hierarchy, no metadata, no color). They serve two purposes:

1. **Filtering** — list docs by tag via `GET /docs?tag=`.
2. **Discovery** — shared tags create implicit connections between related docs (the tag sidebar exposes all tags as clickable filters).

Tags are created and destroyed implicitly — adding/removing them in the doc editor is the only way to manage them. There is no standalone tag CRUD.

- **name** — lowercased, trimmed, deduplicated.
- **uniqueness** — scoped per doc (a doc can't have duplicate tags). The same tag name can appear on many docs.

### Reminder

A time-triggered notification that can be attached to a content entity (currently only **Doc**, see also future **Sticky** note). Reminders are defined inline via `@remind` syntax inside markdown and synced on every doc save.

A Reminder has its own lifecycle independent of its parent doc — it can fire, be snoozed, dismissed, or recur after the original doc is archived.

States: `pending` → `fired` (natural expiry) or `dismissed` (user dismisses). `pending` can be temporarily overridden by `snoozed_until`.

- **trigger_at** — Unix millisecond timestamp of the next firing.
- **recurrence** — optional expression string (e.g. `every monday 09:00`, `every day 07:00`). If set, the reminder reschedules automatically after firing.
- **raw_text** — the original `@remind` line from markdown, used for identity (if the line is edited or deleted, the reminder is updated or removed).
