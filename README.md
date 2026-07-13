# Alcon — Multi-Client Social Media Command Center

A fully local, single-page web app for managing social media across multiple client
accounts. All data lives in your browser (IndexedDB) — no backend, no accounts.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## What's inside

- **Client sidebar** — switch workspaces, add/edit/delete clients (5 preloaded:
  ITSEC, SecureVisa, ILS, Dubinex, Power Media).
- **Dashboard** — posts this month, waiting for review, due this week, per-client counts.
- **Brand Kit** (per client) — brand colors, fonts, logo URL, tone of voice,
  pronunciation/style rules. Autosaves.
- **Content Calendar** — monthly grid, click a day to add a post; posts show as
  platform-colored chips.
- **Post Pipeline** — Kanban (Idea → Designing → For Review → Approved → Posted)
  with drag-and-drop. Same data as the calendar.
- **Notes** — free-text per client, autosaves.
- **Search** — find any post by title across all clients from the top bar.
- **Utilities** — duplicate any post; export a client's calendar to CSV.
- **Generate image** — inside the post editor: prompt box, "auto-fill from
  caption + brand", platform size presets, and a local brand-graphic composer
  that renders a designed PNG (brand-color gradients, Space Grotesk headline,
  logo slot) at exact platform dimensions. Images persist with the post and can
  be downloaded.

  > The generator runs entirely in the browser (canvas) so it works offline and
  > without API keys. Each "Regenerate" produces a new seeded layout variation.

## Stack

React 18 · Vite · Tailwind CSS · [idb](https://github.com/jakearchibald/idb) (IndexedDB)

## Data

Everything is stored in the `alcon-command-center` IndexedDB database in your
browser profile. Clearing site data wipes it — export CSVs if you need a backup.
