# Family Pulse

A small private app for one family to keep up with each other — what everyone's
doing, what they're into right now, and a question a week to actually talk about.

Next.js 14 (App Router) · Supabase (Postgres + Auth + RLS) · Tailwind · deployed on Vercel.

## Features

- **Feed** — activities from everyone in the family, grouped by day, with a calendar view
- **Family** — member profiles, invite-by-code, SMS deep links to text someone directly
- **Profile** — interest cards with tags, and "picks" (current favourites) that keep a history as they change
- **Connect** — one question a week, rotated round-robin through family members; everyone answers, past weeks are archived

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

Open http://localhost:3000.

You'll need a Supabase project. Apply the migrations in `supabase/migrations/`
in numeric order — see [`supabase/README.md`](supabase/README.md). If you have an
existing database and don't know what's applied, run `supabase/check-schema.sql`
in the SQL Editor and it will tell you.

> Supabase pauses free-tier projects after about a week of inactivity. If the app
> can't reach the database after a break, check the dashboard first — it's usually
> just paused, not broken.

## Environment

Seven variables, all documented in [`.env.example`](.env.example). They need to be
set in Vercel as well as locally. Three are server-only secrets
(`SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`) — never move
them behind a `NEXT_PUBLIC_` prefix.

## Push notifications

See [`PUSH_NOTIFICATIONS_SETUP.md`](PUSH_NOTIFICATIONS_SETUP.md) for the full setup,
and `/test-notifications` in the running app for a diagnostic page.

**On iPhone, push only works if the app is installed to the Home Screen.** Open the
site in Safari → Share → Add to Home Screen, then launch it from that icon and enable
notifications from inside it. Notifications enabled in the Safari tab will not arrive.

## Scheduled jobs

`vercel.json` runs `/api/cron/rotate-questions` weekly (Sundays, midnight UTC) to pick
the next family member and open a new question. It authenticates with `CRON_SECRET`
and uses the Supabase service-role key, since a cron request has no user session.

To trigger it by hand:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app.vercel.app/api/cron/rotate-questions
```

## Notes

[`Learnings.md`](Learnings.md) is a working notebook on the parts that were genuinely
tricky — Row Level Security, Supabase auth vs. the application `users` table, service
workers and VAPID, and why environment variables have to be read lazily rather than at
module scope. Worth reading before changing any of those.
