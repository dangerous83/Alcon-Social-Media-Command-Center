# Alcon — Multi-Client Social Media Command Center

A single-page web app for managing social media across multiple client accounts,
with **real AI photo generation** for post visuals. All planning data lives in your
browser (IndexedDB) — no backend, no accounts.

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
  AI photo direction, pronunciation/style rules. Autosaves.
- **Content Calendar** — monthly grid, click a day to add a post; posts show as
  platform-colored chips.
- **Post Pipeline** — Kanban (Idea → Designing → For Review → Approved → Posted)
  with drag-and-drop. Same data as the calendar.
- **Notes** — free-text per client, autosaves.
- **Search** — find any post by title across all clients from the top bar.
- **Utilities** — duplicate any post; export a client's calendar to CSV.
- **Generate image (AI photo)** — inside the post editor: pick **📷 AI photo**
  (default) for a real, hyper-realistic photograph that matches the post's
  content, or **🎨 Brand graphic** for the local gradient design. The photo
  prompt is auto-built from the post title + caption (a content-aware scene
  library maps topics like cyber security, travel, logistics, finance… to
  matching photographic scenes), plus the client's brand colors, tone and the
  Brand Kit's "AI photo direction". The brand text overlay (logo, kicker,
  headline, footer) is composed on top locally at exact platform dimensions —
  or switch the overlay off for the pure photo. Images persist with the post
  and can be downloaded.
- **Graphic studio** (dashboard) — structured designed posts (logo → eyebrow →
  heading → bullets → CTA) over an **AI photo** background (default) or six
  local premium styles.
- **Visual autopilot** (dashboard) — one click generates a real, on-brand AI
  photo visual for **every post that has no image yet**, per client or across
  all clients, saving each post as it completes.
- **AI image engine settings** (⚙ in the top bar) — choose the photo engine:

  | Engine | Key needed | Notes |
  | --- | --- | --- |
  | Pollinations · FLUX (default) | none — free | Works out of the box, photorealistic FLUX model |
  | OpenAI · GPT Image | your OpenAI key | Highest quality |
  | Stability AI · Stable Image Core | your Stability key | Fast photographic model |
  | Together AI · FLUX.1 schnell | your Together key | Fast FLUX |

  A built-in **Test generation** button verifies your engine live. If a keyed
  engine fails or has no key, the app automatically falls back to the free one.
  API keys are stored only in your browser's localStorage and are sent only to
  the provider you selected — never anywhere else.

  > Photo generation needs an internet connection. The brand-graphic mode and
  > all other features keep working fully offline.

## Stack

React 18 · Vite · Tailwind CSS · [idb](https://github.com/jakearchibald/idb) (IndexedDB)

## Data

Everything is stored in the `alcon-command-center` IndexedDB database in your
browser profile. Clearing site data wipes it — export CSVs if you need a backup.
