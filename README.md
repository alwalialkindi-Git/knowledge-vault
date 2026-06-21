# My Learning Vault

A private, bilingual (English + Arabic / full RTL) personal learning manager.
Catalog books, videos, courses, articles, and notes; track progress; capture
notes, takeaways, quotes, and action items; and review your key takeaways with
spaced repetition. Single-user and private by design — not a SaaS.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn-style UI
+ Supabase (Auth · Postgres · Storage) + Prisma**, deployable on **Vercel**.

---

## Features

- **Dashboard** — continue-learning list, due-for-review panel, and quick stats
  (total / in-progress / completed resources, due review cards).
- **Library** — add resources manually, paste a URL, or upload a PDF; filter by
  focus area, type, and status; search by title.
- **Resource detail** — progress ring with editable units, status control,
  PDF open/download, and full metadata.
- **Notes** — Notes, Key takeaways, Quotes, and Action items, each with basic
  rich text (bold / italic / lists), an optional page-or-timestamp location,
  and edit/delete. Mixed Arabic/English content is supported.
- **Review** — one-card-at-a-time spaced repetition over flagged takeaways.
- **Bilingual + RTL** — switch English ⇄ Arabic anywhere; the whole UI mirrors.
- **PWA** — installable on phone and desktop.
- **Export** — download all your data as JSON from Settings.
- **Private** — Row-Level Security plus a private file bucket keep everything
  scoped to you.

---

## Prerequisites

- Node.js 18.18+ (20+ recommended)
- A free Supabase project (Database + Auth + Storage)

---

## Setup

### 1. Install
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in from the Supabase dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings → API
- `DATABASE_URL` (pooled, port 6543, `?pgbouncer=true`) and `DIRECT_URL`
  (direct, port 5432) — Project Settings → Database → Connection string

### 3. Create the database schema
Apply all migrations, generate the client, and seed the 10 focus areas:
```bash
npm run db:deploy     # creates tables, enums, action-item fields, updated_at defaults
npm run db:generate
npm run db:seed       # inserts the 10 focus areas (EN + AR)
```
(Prefer Prisma to author migrations itself? Delete `prisma/migrations` and run
`npm run db:migrate -- --name init` instead.)

### 4. Apply security + storage policies
In the Supabase dashboard → **SQL Editor**, run each of these once:
- `supabase/policies.sql` — Row-Level Security on all content tables
- `supabase/storage.sql` — the private `resource-files` bucket and its policies

Both are idempotent and safe to re-run.

### 5. Run
```bash
npm run dev
```
Open http://localhost:3000 — you'll be sent to `/login`. Choose **Create
account**, enter an email + password, and sign in. (If email confirmation is on
in Supabase, confirm first, or disable it under Authentication → Providers →
Email for personal use.)

---

## Usage guide

- **Add a resource:** Library → Add resource. Title and type are required;
  everything else (focus area, status, author, URL, units, priority, PDF) is
  optional. URLs are stored as-is.
- **Track progress:** open a resource, set completed/total units, and save —
  the ring and dashboard update.
- **Take notes:** on a resource, use the Notes / Takeaways / Quotes / Action
  items sections. The toolbar adds **bold**, *italic*, and bullet lists; the
  location field holds a page number or timestamp.
- **Flag for review:** tap the star on a takeaway to add it to the review queue.
- **Review:** open Review for a one-card-at-a-time session. **Remembered**
  advances the interval (1 → 3 → 7 → 16 → 35 → 70 days); **Forgot** resets to 1.
- **Switch language:** the toggle is in the sidebar (desktop), the top bar
  (mobile), and Settings.
- **Install as an app:** use your browser's Install / Add to Home Screen.
- **Back up:** Settings → Data → Export backup downloads a JSON file with your
  resources, notes, and review cards.

---

## Security model

- Every content table (`resources`, `notes`, `review_cards`) has RLS policies
  scoping rows to `auth.uid()`. `focus_areas` is read-only for signed-in users.
- The app reads and writes through the Supabase client using your session, so
  policies are enforced on every query. Each insert stamps `user_id`.
- PDFs live in a **private** bucket under `<your-id>/...`; storage policies
  restrict each object to its owner, and downloads use short-lived signed URLs.

---

## Project scripts

- `npm run dev` — start the dev server
- `npm run build` — production build (runs `prisma generate` first)
- `npm run start` — run the production build
- `npm run db:migrate` / `db:deploy` / `db:seed` / `db:studio` / `db:generate`

---

## Migrations included

1. `…_init` — tables, enums, indexes
2. `…_notes_action_items` — `action_item` note type + action-item fields
3. `…_write_defaults` — `updated_at` default + trigger (required for
   Supabase-client writes)

---

## Not included yet

AI features (PDF summaries, auto-generated takeaways/cards), notifications, and
deep analytics. The schema already carries `source = 'ai'` and `ai_summary`
seams for the AI layer when you want it.
