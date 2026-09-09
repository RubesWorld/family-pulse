# Database

## Applying migrations

Run the files in `migrations/` in numeric order in the Supabase SQL Editor.
They are ordered by the commit that introduced them, which is the order they
were originally applied.

| # | File | What it adds |
|---|------|--------------|
| 01 | `01_schema.sql` | `families`, `users`, `activities` + base RLS policies |
| 02 | `02_picks_and_interest_cards.sql` | `interest_cards`, `picks` |
| 03 | `03_profile_bio.sql` | `users.location`, `.occupation`, `.birthday`, `.bio` |
| 04 | `04_phone_number.sql` | `users.phone_number` (for SMS deep links) |
| 05 | `05_interest_card_tags.sql` | `interest_cards.tags` |
| 06 | `06_picks_history.sql` | `picks.is_current`, `.archived_at`, archive trigger |
| 07 | `07_connect.sql` | `weekly_questions`, `question_answers`, `preset_questions` |
| 08 | `08_connect_status.sql` | `weekly_questions.status`, `.suggested_question_text` |
| 09 | `09_notifications.sql` | `notification_preferences`, `push_subscriptions`, `notification_log` |

Everything from 03 onward uses `IF NOT EXISTS`, so re-running those is safe.
**01 and 02 are not idempotent** — they use bare `CREATE TABLE` and will error
on an existing database. That error is harmless; it just means the step was
already applied.

## Figuring out what's already applied

If you don't know what state a database is in, run `check-schema.sql` in the
SQL Editor. It reports, per migration, whether each table and column exists,
and confirms RLS is still enabled on every table. It only reads metadata.

## Seed data

`seed/` holds sample families for local testing. All of it is placeholder —
`555` phone numbers and `example.com` addresses, no real contact details.
Creating users is awkward because `users` references `auth.users`; see
`Learnings.md` for the workaround these scripts use.

## A note on file 05

It was originally committed as `supabase-migration-remove-picks-add-tags.sql`,
but it only ever added the `tags` column — it never removed picks. Renamed to
match what it actually does.
