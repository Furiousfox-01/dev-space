# Markdown Workspace

A personal markdown workspace — docs, sheets, reminders, tagging, and search.
Built entirely on Cloudflare's free tier.

## Stack

- **Frontend**: React + Vite SPA, CodeMirror 6, deployed to Cloudflare Pages
- **Backend**: Hono on Cloudflare Workers
- **DB**: D1 (SQLite) — metadata, tags, reminders, FTS5 search
- **Blobs**: R2 — all markdown content
- **Cache**: KV — due reminders for frontend pickup
- **Scheduling**: Durable Object alarm — fires exactly when a reminder is due
- **Auth**: Cloudflare Access — pin your email, zero config

---

## Deploy (first time)

### 1. Install Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 2. Create Cloudflare resources

```bash
# D1 database
wrangler d1 create markdown-workspace-db
# → copy the database_id into worker/wrangler.toml

# KV namespace
wrangler kv:namespace create markdown-workspace-kv
# → copy the id into worker/wrangler.toml

# R2 bucket
wrangler r2 bucket create markdown-workspace-r2
# (no ID needed — bucket_name in wrangler.toml matches)
```

### 3. Update wrangler.toml

Open `worker/wrangler.toml` and fill in:
- `database_id` under `[[d1_databases]]`
- `id` under `[[kv_namespaces]]`

### 4. Run D1 migration

```bash
cd worker
npm install
npx wrangler d1 execute markdown-workspace-db --file=./schema.sql
```

### 5. Deploy the Worker

```bash
cd worker
npm run deploy
# → note the Worker URL: https://markdown-workspace-worker.YOUR_SUBDOMAIN.workers.dev
```

### 6. Deploy the Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local — set VITE_API_URL to your Worker URL from step 5
npm run build
npx wrangler pages deploy dist --project-name=markdown-workspace
```

### 7. Set up Cloudflare Access (auth)

1. Go to **Zero Trust → Access → Applications** in the Cloudflare dashboard
2. Click **Add an application → Self-hosted**
3. Set the application domain to your Pages URL (e.g. `markdown-workspace.pages.dev`)
4. Add a policy: allow your email address
5. Done — all traffic to the app requires login with your email

---

## Local Development

```bash
# Terminal 1 — Worker (port 8787)
cd worker && npm install && npm run dev

# Terminal 2 — Frontend (port 5173, proxies /api → 8787)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173

---

## Features

### Docs & Sheets
- Create markdown docs or sheet (table-focused) docs
- Auto-save with 1500ms debounce
- CodeMirror 6 editor with syntax highlighting

### Tags
- Add tags in the tag input (comma-separated)
- Filter by tag in the sidebar
- Tags indexed in FTS5 for search

### Search
- Searches title + tags via D1 FTS5
- Porter stemming (`tokenize = 'porter ascii'`)

### @remind Syntax
Add reminders anywhere in a document:

```markdown
@remind tomorrow 9am
@remind in 30m
@remind in 2h
@remind today 5pm
@remind 2026-06-01 09:30
@remind every monday 09:00
@remind every day 07:00
```

- Reminders are parsed on every save
- Editing/deleting a `@remind` line removes the reminder
- Recurrence auto-reschedules after firing
- Durable Object alarm fires exactly when due — no polling on the backend

### Reminder UI
A floating stack appears bottom-right when reminders are due:
- **Done** — dismiss permanently
- **+10m / +1h** — snooze
- **Tomorrow** — snooze to tomorrow 9am
- **✕** — dismiss

---

## Cost

| Service | Free limit | Expected daily |
|---|---|---|
| Workers | 100k req/day | ~100–300 |
| D1 | 5M reads/month | ~5k |
| R2 | 10 GB / 1M ops | <100 ops |
| KV | 100k reads/day | ~30 |
| DO alarms | 100k req/day | ~5–10 |
| Pages | Unlimited | — |

**Total: $0/month**

---

## Skipped (planned)

- Versioning (snapshot on every save + restore UI)
- Full content FTS (currently title+tags only)
- Web Push notifications
- Export to PDF/HTML
