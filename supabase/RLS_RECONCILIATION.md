# RLS reconciliation

**Status:** unblocked. The production dump was taken on 2026-09-19 and answered
the open question decisively:

> **Production's policy set is byte-for-byte identical to `10_performance.sql`.**
> All 26 policies match on name, command, roles and full `USING` / `WITH CHECK`
> expression. Both `SECURITY DEFINER` helpers are correct — `STABLE`, with
> `search_path` pinned to `public, pg_temp`. RLS is enabled on all eleven
> managed tables and forced on none.

Two consequences, one of each kind:

* **Good:** problem (2) below is stale. Production drifted *before* migration 10
  ran; migration 10 then replaced the entire policy set, which is why prod now
  matches the files exactly. There is nothing to reconstruct. The name-drift
  risk that held migration 11 back is gone — prod's policy names are the names
  the fix drops, so every `DROP POLICY IF EXISTS` finds its target.
* **Bad:** every defect in section 3 was reproduced against a clean build of
  01-10, and production *is* 01-10. They are all live right now, including
  `anon` reading every invite code and any authenticated user moving themselves
  into any family.

The fix is split across two migrations so it can be deployed without a window in
which joining or onboarding is broken — see section 6.

**Why this document exists:** the app is moving its data layer into the client
(supabase-js + React Query, then React Native). Today the Next.js server is a
real gatekeeper — middleware verifies the session JWT, and page queries are
scoped server-side with `.eq('family_id', …)` / `.in('user_id', memberIds)`
computed from a server-verified `auth.uid()` the browser cannot reach. After the
move, **Row Level Security is the only thing standing between one family and
another.** And the committed migrations do not describe production.

---

## 1. The situation

Three separate problems, often conflated. They needed separating, because only
one of them was ever blocked on production — and the dump has now settled it.

| # | Problem | Status |
|---|---|---|
| 1 | **Migrations 01-09 produce a non-functional database.** `01_schema.sql:43-48` defines a self-referential `users` SELECT policy; reading `users` inside the policy *for* `users` aborts with `infinite recursion detected in policy for relation users`, on every table that joins through it. | Known. Fixed by `10_performance.sql`, which replaces the whole policy set and breaks the recursion with two `SECURITY DEFINER` helpers. Confirmed: 01-10 applies cleanly and every table is queryable. |
| 2 | **Production drifted from the files and was never committed back.** Production's RLS was hand-patched in the Supabase dashboard. Its live policy *names* are unknown, which is why `10_performance.sql` enumerates and drops whatever it finds rather than dropping by name. Nobody can reconstruct prod from this repo. | **Resolved — and it was stale.** The drift predates migration 10, which then replaced the entire policy set. The 2026-09-19 dump matches `10_performance.sql` byte-for-byte across all 26 policies. Section 4 is the runbook that produced this. |
| 3 | **The canonical set in `10_performance.sql` is itself insecure.** Eight defects, independent of any drift. Present in the files, reproducible from a clean build. | **Fixed and verified, not yet applied.** `11a_rls_rpcs.sql` + `11b_rls_hardening.sql`. Since prod *is* 10, all eight are live in production right now. |

Problem 3 is the surprise. The reconciliation was expected to be "find out what
prod has and write it down". It turned out the thing the repo *intends* is also
wrong — and since the dump showed production is exactly what the repo intends,
every one of the eight defects is live. Four of them need no migration at all to
exploit, because the affected write paths are already client-side.

### What is already client-side

Worth stating plainly, because it changes how urgent this is. Every user-facing
mutation except three already runs in the browser with the anon key:
`add/page.tsx`, `pick-editor.tsx`, `interest-card-editor.tsx`,
`profile-bio-editor.tsx`, `answer-form.tsx`, `question-selector.tsx`,
`notification-settings-content.tsx`, `create-family/page.tsx`,
`join/[code]/page.tsx`, `login-form.tsx`. Plus the reads in
`question-history.tsx`, `pick-history-dialog.tsx`, `join/[code]`,
`create-family` and `login-form`.

So RLS is *already* the only boundary for writes. The client migration does not
create this exposure; it extends it to the remaining reads and removes the last
server-side filters that were quietly compensating.

---

## 2. What the application actually requires from RLS

Derived from every `.from(...)` call site in `src/`. `self` = `auth.uid()`,
`family` = the caller's family via `public.current_family_id()`.

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|
| `users` | own row (**must work while `family_id IS NULL`**) + family members | own row, `family_id` NULL | own row, `family_id` **immutable** | own row | `select('*')` at `family/page.tsx:26` ships every member's `phone_number`, `birthday`, `bio`. Inside the family trust boundary, but replace with an explicit column list. |
| `families` | **own family only** | none — via RPC | none | none | Read by `getCurrentProfile`'s `families(name, invite_code)` embed and by the join flow. The join needs *one* lookup by code, never a listing. |
| `activities` | **own** + family | own | own | own | `own` matters: see defect F. |
| `picks` | own + family | own | own | own | `FOR ALL` own-row + family SELECT. History (`is_current = false`) uses the same policies. |
| `interest_cards` | own + family | own | own | own | `interest-card-editor.tsx` deletes all then re-inserts, so DELETE is required. |
| `weekly_questions` | family | family, asker must be a family member | **assigned asker only, while `status = 'pending'`** | none | Cron inserts via the service role and bypasses RLS. |
| `question_answers` | answers to family questions | own, **and the question must be in the caller's family** | same | none | |
| `preset_questions` | any caller with a `sub` | none | none | none | Seeded by migration; cron reads via service role. |
| `notification_preferences` | own | own | own | none | Three separate creation paths for one row — see "Also worth fixing". |
| `push_subscriptions` | own | own | **own — was missing** | own | |
| `notification_log` | own | **none, deliberately** | none | none | Written only by `send-push.ts` via the service role. Do **not** add an INSERT policy; a client writing its own notification log has no legitimate use. |

**Service-role paths that must never rely on RLS** (they bypass it, and would
return zero rows under any user's scope): `api/cron/rotate-questions` reads
*every* family; `lib/send-push.ts` reads a *different* user's preferences and
subscriptions and inserts into `notification_log`. Both must stay server-side.

---

## 3. Defects found by reading the migrations — and reproduced

Every item below was **executed** against a clean database built from
`supabase/migrations/01-10` by `scripts/rls_local_state.sh`, as the
`authenticated` role with a JWT claim set. Not inferred from the SQL.

Fixture: family A (Alice) and family B (Bob), one row per table each.

Severity is "what an attacker with an account gets", not how ugly the SQL is.

### A — `families` is world-readable, every invite code included · CRITICAL

`10_performance.sql:239` — `FOR SELECT USING (true)`, no role restriction, so it
applies to `anon`.

```
-- as anon, NO JWT AT ALL:
select count(*) from families;   -->  2      (every family in the database)
select id, name, invite_code from families;
  11111111-… | Family A | aaaacode
  22222222-… | Family B | bbbbcode
```

No account needed. The anon key ships in the browser bundle and **this repo is
public**, so treat every invite code in the product as published.
`invite_code` is `substring(md5(random()::text), 1, 8)` — it is the only secret
protecting family membership.

### B — any authenticated user can join any family · CRITICAL

`10_performance.sql:224` — one `FOR ALL` policy whose `WITH CHECK` is only
`id = auth.uid()`. That constrains *which row* you may write, and nothing about
*what you may write into it*.

```
-- as Alice (family A), holding a perfectly ordinary session:
update users set family_id = '<family B>' where id = auth.uid();   -->  1 row

-- Alice now reads family B:
select name, phone_number, bio from users;
  Bob   | 555-0002 | B bio
  Alice | 555-0001 | A bio
select title from activities;      -->  A activity, B activity
select answer_text from question_answers;  -->  B answer
```

No invite code required — just a family UUID, and (A) hands out every one of
them. **A + B together are one vulnerability: enumerate, then join.** Full read
access to any family's data for anyone with an account. This is the biggest
finding.

### C — cross-family answer injection · HIGH

`10_performance.sql:307` — `WITH CHECK (user_id = auth.uid())`. Right author,
*any question in the database*.

```
-- as Alice, into family B's question:
insert into question_answers (question_id, user_id, answer_text)
values ('<family B question>', auth.uid(), 'INJECTED by Alice');   -->  succeeded

-- then, as Bob:
select answer_text from question_answers;
  B answer
  INJECTED by Alice          <-- visible in family B's thread
```

Alice cannot read the thread back (the SELECT policy blocks that), but she can
write into it. Inbound content injection into a private family space. Live
today via `answer-form.tsx:48`. The UPDATE policy has the same gap, which
reaches the same end state by moving an existing answer.

### D — `push_subscriptions` has no UPDATE policy · HIGH (correctness)

Neither `09_notifications.sql:99-109` nor `10_performance.sql:334-344` defines
one. SELECT, INSERT, DELETE only.

```
-- as Bob, unsubscribing his own device:
select is_active from push_subscriptions;                    -->  t
update push_subscriptions set is_active = false
  where user_id = auth.uid();                                -->  NO ERROR
select is_active from push_subscriptions;                    -->  t   (unchanged)
```

Three call sites issue user-scoped UPDATEs against this table:
`api/push/subscribe/route.ts:37` (refresh rotated keys, reactivate),
`api/push/unsubscribe/route.ts:30` (`is_active = false`), and
`send-push.ts:161,176` — the last via the **service role**, which bypasses RLS,
which is why the gap was never noticed.

`supabase-js` returns no error for an UPDATE matching zero rows and both routes
check only `error`, so both return `{ success: true }` having done nothing.
Turning push off leaves it on; a device whose keys rotate never gets them
refreshed and every send to it fails.

**This one is also a probe.** If unsubscribe demonstrably works in production
today, production has a policy these files do not — which independently confirms
the drift. If it is *also* broken in production, that is a real user-facing bug
nobody has reported.

### E — `weekly_questions` INSERT accepts any `assigned_user_id` · MEDIUM

`10_performance.sql:289` constrains `family_id` and not the asker.

```
-- as Alice, creating a question for her OWN family:
insert into weekly_questions (family_id, …, assigned_user_id, status)
values ('<family A>', …, '<Bob, family B>', 'pending');      -->  succeeded
```

The asker is now someone outside the family: an unanswerable question, and a row
pointing at a stranger's user id.

### F — any member can overwrite an active weekly question · MEDIUM

`10_performance.sql:293` — `USING (family_id = current_family_id())`.

```
-- as Alice, on a question already answered:
update weekly_questions set question_text = 'OVERWRITTEN after answers existed'
  where id = '<family A active question>';                   -->  succeeded
```

Any member can rewrite any of their family's questions at any time, including
retroactively editing history under existing answers.
`connect-content.tsx:112` only offers this to the assigned user, so the policy
was broader than the product rule it was meant to encode. Live today via
`question-selector.tsx:31`.

### G — the onboarding trap is real, and it is `activities` · MEDIUM

`10_performance.sql:218-222` warns that splitting the `users` `FOR ALL` policy
could lock a new user out of onboarding. Measuring it narrowed the problem
considerably:

```
-- as Alice with family_id = NULL (signed up, no family yet):
select count(*) from users          where id = auth.uid();       -->  1
select count(*) from picks          where user_id = auth.uid();  -->  1
select count(*) from interest_cards where user_id = auth.uid();  -->  1
select count(*) from activities     where user_id = auth.uid();  -->  0   <-- !
```

`picks` and `interest_cards` are fine: their `FOR ALL` "manage own" policy also
covers SELECT. `activities` has **no own-row SELECT policy at all** — only a
family-scoped one, and with no family `current_family_member_ids()` is empty. So
a family-less user cannot see their own activities.

Invisible today because `(app)/layout.tsx:23` redirects family-less users to
`/create-family` before any screen reads `activities`. That redirect is
server-side, and relocating it is exactly what the client migration does. Fix
the policy; do not rely on render order.

This corrects the advice it was flagged under: only `activities` needs the
`OR user_id = auth.uid()` branch, not all three tables.

### H — `10_performance.sql`'s `REVOKE` on the helper functions does nothing

`10_performance.sql:98-101` intends to make the two `SECURITY DEFINER` helpers
callable only by `authenticated`. It does not work:

```
14 function-grant | current_family_id()         | anon | EXECUTE
14 function-grant | current_family_member_ids() | anon | EXECUTE
```

`REVOKE EXECUTE … FROM public` does not remove an **explicit** grant, and
Supabase's `ALTER DEFAULT PRIVILEGES` grants EXECUTE to `anon` and
`authenticated` by name at creation time. `anon` must be revoked by name.

Not a live hole — with no JWT, `auth.uid()` is NULL and both helpers return
nothing — but the `SECURITY DEFINER` surface reachable unauthenticated should be
empty, not merely harmless. Only the dump reveals this; the migration file reads
as though it were handled.

### What is NOT broken

Worth recording, because it narrows where to look. Row-level isolation itself
holds under 01-10. As Alice, every one of these returned **zero** rows:
`users where family_id = B`, `picks / interest_cards / activities /
question_answers / notification_preferences / push_subscriptions /
notification_log where user_id = Bob`, `weekly_questions where family_id = B`.
Unfiltered `select *` on each returned only family A's row.

So `current_family_id()` / `current_family_member_ids()` work, and the three
policies `family/page.tsx:45-60` says it does not trust —
`"Users can view family picks"`, `"...family interest cards"`,
`"Users can view family members"` — are correct as written. The explicit
`.in('user_id', memberIds)` filters can be dropped once the same is confirmed
against production.

Also fine: `notification_log` is SELECT-only by design; `preset_questions`
correctly denies `anon` (no `sub` → `auth.uid()` IS NULL); `activities`,
`weekly_questions` and `question_answers` UPDATE policies omit `WITH CHECK`,
which in Postgres means the `USING` expression is reused as the check — so rows
cannot be moved to another owner or family that way.

---

## 4. Runbook

You need a production connection string. Get it from the Supabase dashboard
under **Project Settings → Database → Connection string → URI**.

> **This repo is public and credentials have been committed to it before.** Pass
> the connection string on the command line only. Never paste it into a file
> here — not into a migration, not into a scratch note, not into a commit
> message. Every command below takes it as `"<PROD_CONNECTION_STRING>"`.
>
> The dump files the commands produce (`prod_state.txt`) contain no credentials,
> but they do describe your security model in full. `supabase/.rls-state/` is
> gitignored; keep `prod_state.txt` out of the repo too.

### Step 0 — is RLS even switched on? Do this first

Everything else is meaningless if it is not. `pg_policies` lists policies
whether or not the table enforces them, so a dashboard full of healthy-looking
policies proves nothing. `ALTER TABLE … DISABLE ROW LEVEL SECURITY` is the usual
panic fix for the recursion error in problem (1), and it is invisible in
`pg_policies`.

```bash
psql "<PROD_CONNECTION_STRING>" --no-psqlrc -c "
  select c.relname,
         c.relrowsecurity as rls_enabled,
         (select count(*) from pg_policies p
           where p.schemaname='public' and p.tablename=c.relname) as policies
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r'
  order by c.relrowsecurity, c.relname;"
```

All eleven managed tables must report `rls_enabled = t`: `users`, `families`,
`activities`, `interest_cards`, `picks`, `weekly_questions`,
`question_answers`, `preset_questions`, `notification_preferences`,
`push_subscriptions`, `notification_log`.

**If any says `f`, stop and report it.** That table is readable and writable in
full by anyone holding the anon key, which is in the client bundle of a public
repo. It is a live data exposure, not a migration problem, and it is more urgent
than everything else in this document.

### Step 1 — take the full production dump (read-only)

```bash
psql "<PROD_CONNECTION_STRING>" \
  --no-psqlrc --tuples-only --no-align --quiet \
  -v ON_ERROR_STOP=1 \
  -f supabase/dump_prod_state.sql > prod_state.txt
```

One statement, reads `pg_catalog` only, writes nothing — not even a temp table.
It captures every policy with full `USING` / `WITH CHECK`, per-table RLS
enabled/forced flags, table and column and function grants per role, schema
ACLs, default privileges, `SECURITY DEFINER` functions with their bodies and
pinned `search_path`, triggers, indexes, constraints, the complete column list,
views with their `security_invoker` setting, realtime publication membership,
and which roles hold `BYPASSRLS`. Output is one sorted line per fact.

No direct database access? Paste the file into the dashboard **SQL Editor** — it
is deliberately a single statement with one text column so the editor shows all
of it. Export as CSV, strip the header row and the quoting.

### Step 2 — if migration 10 has ever run on production, grab its audit log too

```bash
psql "<PROD_CONNECTION_STRING>" \
  --no-psqlrc --tuples-only --no-align --quiet \
  -f supabase/dump_rls_migration_log.sql > prod_rls_log.txt
```

`10_performance.sql` records every policy it destroys — name, command, roles,
permissive flag, full expressions, and whether RLS was even enabled — into
`rls_migration_log` before dropping it. **If that migration ran against
production, this table is the only surviving record of the hand-patched policy
set**, which is precisely what the repo is missing.

Erroring with `relation "rls_migration_log" does not exist` is a useful answer,
not a problem: it means migration 10 never ran there, and production is still on
whatever 01-09-plus-hand-patches produced. Either way, **do not drop that table**
until reconciliation is finished — `supabase/rollback_10.sql` needs it.

### Step 3 — build the same dump from the committed migrations

```bash
scripts/rls_local_state.sh                  # migrations 01-11
scripts/rls_local_state.sh --through 10     # the state before the hardening
```

Builds a throwaway database, applies the migrations in order, and writes
`supabase/.rls-state/local_state.txt` (and `local_state_10.txt`) in the same
format. Nothing touches a remote database.

`--mode cli` (the default when the Supabase CLI and Docker are both present)
uses the real Supabase local stack, so roles, schema ACLs and default privileges
match production and **grants are comparable**. `--mode docker` uses plain
`postgres:17-alpine` plus `scripts/supabase_shim.sql`; it is faster and needs no
image pulls, but the shim only approximates Supabase's role setup, so dump
sections 01-04 and any non-`public` schema are not comparable in that mode.
Sections 05, 07, 09, 10, 11, 12 and 13 are trustworthy either way.

### Step 4 — diff

```bash
diff -u prod_state.txt supabase/.rls-state/local_state_10.txt
```

`<` is production only; `>` is the migrations only. Compare against
`local_state_10.txt` first — that is "what the repo currently claims", and the
difference is exactly the undocumented drift. Then against `local_state.txt` to
see what applying the hardening would additionally change.

Or let the script do it and exit non-zero on any difference:

```bash
scripts/rls_local_state.sh --through 10 --diff prod_state.txt
```

Read it in this order:

1. **`05 table-rls`** — any `rls_enabled=false` in production. Step 0 again, in
   writing.
2. **`11 policy`** — the payload. A policy in prod with no counterpart in the
   migrations is undocumented hand-patching: decide whether it is load-bearing.
   A policy in the migrations with no counterpart in prod was never applied.
   Same name with a different body is the most dangerous case, because it looks
   fine in any name-only comparison.
3. **`06 table-grant` + `01 schema-acl`** — what `anon` can reach at all. RLS
   filters rows; grants decide whether the role may touch the table. `anon` with
   no `USAGE` on `public` cannot reach anything regardless of policies.
4. **`13 function` + `14 function-grant`** — do the two helpers exist, are they
   `SECURITY DEFINER` and `STABLE` with `search_path` pinned, and who can
   execute them. Most policies are useless without them.
5. **`15 view`** — anything here at all deserves a look. A view runs with its
   **owner's** rights, so a view over an RLS-protected table owned by a
   privileged role hands out everything the owner can see, unless its
   `reloptions` contains `security_invoker=true`.
6. **`02 role`** — any unexpected role with `bypassrls=true` ignores every
   policy in the file.
7. **`07 column`** — schema drift in either direction. Specifically: **does
   production have `users.interests`?** It is declared in
   `src/types/database.ts:39` and read at `(app)/profile/page.tsx:47`, and **no
   migration creates it**. Because the app reads `select('*')`, a missing column
   produces no error anywhere — just a silently undefined field. This settles it.

Some deparse-level noise is normal if prod and local are on different Postgres
majors; the `00 server` line tells you when to suspect that. The dump collapses
whitespace so formatting alone never shows as a difference, but it does not
rewrite expressions further — a difference in casts or aliases is reported
rather than hidden, because that is the kind of thing worth seeing.

### Step 5 — send back

- `prod_state.txt`
- `prod_rls_log.txt`, or the exact error if the table does not exist
- the step 0 output, even if everything says `t`
- the `diff -u` output
- one behavioural answer, because it disambiguates defect D better than any
  catalog query: **in production today, does turning push notifications off
  actually stop them arriving?**

With those, the reconciliation migration can be written to take production to a
known-good state without guessing at names.

---

## 5. Proving isolation — not just describing it

The dump describes the policy set. It cannot tell you what the policies *do*.

```bash
scripts/rls_local_state.sh --verify              # 01-11: 46/46 pass
scripts/rls_local_state.sh --through 10 --verify # 01-10: 11 fail
```

`supabase/verify_isolation.sql` seeds two families, then runs 46 checks as the
`authenticated` role with a real JWT claim: targeted cross-family reads that
must return zero rows, **unfiltered** reads that must return only the caller's
family (the case the client migration creates, since a client can simply omit
the filter), seven attacks that must be refused, seven ordinary operations that
must still succeed, the onboarding path with `family_id IS NULL`, and every
table read as bare `anon`.

Each attack runs in its own subtransaction and is undone either way — on an
unpatched database several of them succeed, and a successful attack left in place
poisons every check after it.

> **It must run as the `authenticated` role.** Running these queries in the
> Supabase dashboard SQL Editor proves **nothing**: the editor connects as an
> RLS-bypassing role, so every "must return zero rows" check trivially returns
> whatever you ask for and every write succeeds. A policy suite verified that way
> is unverified. The script sets `ROLE` and `request.jwt.claims` itself, which is
> why it has to be run through `psql` against a local database.

The suite **writes**, so it is local-only. It wraps everything in one
transaction ending in `ROLLBACK`, leaving no rows behind. Never point it at
production; the read-only way to inspect production is step 1.

That it fails 11 checks on 01-10 and passes 46 on 01-11 is what makes it worth
having: a suite that passes everywhere detects nothing.

---

## 6. The fix: `11a_rls_rpcs.sql` + `11b_rls_hardening.sql`

Written, applied, verified, and **deliberately not applied to production yet**.

| Defect | Fix |
|---|---|
| A | `families` SELECT narrowed to `id = public.current_family_id()`. New `family_by_invite_code(text)` RPC resolves one family from a code you already hold and does not return the code back out. No INSERT policy — families are created only via RPC, so every family has an owner. |
| B | The `users` `FOR ALL` policy split per command. UPDATE's `WITH CHECK` adds `family_id IS NOT DISTINCT FROM public.current_family_id()`. Because that helper is `STABLE`, inside an UPDATE it sees the statement snapshot and returns the row's *pre-update* `family_id` — so the new value must equal the old one, and `family_id` becomes immutable to any client write. Joining goes through `join_family_by_invite_code(text)`, which refuses if you already belong to a family. |
| C | `question_answers` INSERT **and** UPDATE `WITH CHECK` gain `question_id IN (select id from weekly_questions where family_id = public.current_family_id())`. |
| D | Adds the missing `push_subscriptions` UPDATE policy. |
| E | `weekly_questions` INSERT requires `assigned_user_id IN (select public.current_family_member_ids())`. |
| F | `weekly_questions` UPDATE narrowed to `assigned_user_id = auth.uid() AND status = 'pending'` — matching the rule the UI already enforces, and making an answered question unrewritable. |
| G | `activities` SELECT gains `user_id = auth.uid() OR …`. |
| H | `REVOKE EXECUTE … FROM anon` **by name** on both helpers. |

Every policy it creates is role-qualified `TO authenticated`. It is idempotent —
each section drops both the names it replaces and the names it is about to
create — verified by applying it three times in a row.

Rollback: `supabase/rollback_11b.sql`, tested. It restores `10_performance.sql`'s
set exactly, which reopens all eight holes; the file says so at the top.

### The two reasons it was held back, and where they stand

**1. Name drift — cleared.** It uses `DROP POLICY IF EXISTS "<exact name>"`. Had
production renamed a policy, the drop would silently do nothing and the stale
permissive policy would survive, OR'd with the new restrictive one, quietly
preserving the very hole the migration exists to close. The 2026-09-19 dump
settles it: all 26 policy names match `10_performance.sql` exactly, so every drop
finds its target. This was the trap `10_performance.sql:22-27` describes, and it
did not materialise.

**2. Client changes — handled by the 11a/11b split.** The `users` UPDATE policy
in 11b refuses a direct `family_id` write, so the call sites below break once it
is applied. Rather than coordinating one simultaneous deploy, 11a lands the RPCs
first: they are `SECURITY DEFINER`, so they work identically under migration 10's
policies and under 11b's. That gives a safe order with no broken window —

```
apply 11a   ->   deploy the client below   ->   apply 11b
 (additive)       (works either side)            (removes the old path)
```

— and each step is independently rollback-able. The call sites: 

| File | Today | Must become |
|---|---|---|
| `src/app/join/[code]/page.tsx:43` | `.from('families').select('*').eq('invite_code', code)` | `.rpc('family_by_invite_code', { p_code: code })` |
| `src/app/join/[code]/page.tsx:72` | `.from('users').update({ family_id }).eq('id', user.id)` | `.rpc('join_family_by_invite_code', { p_code: code })` |
| `src/app/create-family/page.tsx:61,71,80` | three statements: insert profile, insert family, update own `family_id` | one `.rpc('create_family_with_owner', { p_family_name, p_user_name })` |

The `create-family` change is worth making regardless: those three statements are
not a transaction, and a failure between the second and third leaves an orphaned
family row and the user in no family at all.

---

## 7. What must be true before a direct-to-Supabase client ships

Ordered. Each is checkable, and none of them is "we reviewed the policies".

1. **RLS enabled on all eleven tables in production.** Step 0. Non-negotiable —
   with it off, the anon key from the public bundle reads the whole table.
2. **`prod_state.txt` and the local dump reconciled**, and the remaining
   differences deliberate and committed as a migration. Until then nobody knows
   what production enforces.
3. **Defects A-H fixed in production**, and `--verify` passing against a local
   build of the exact migration set production is running. A + B are the ones
   that break family isolation outright.
4. **The `anon` role reaches nothing.** Dump section 06 + the `anon` block of the
   isolation suite. Assume the key is public, because it is.
5. **No `BYPASSRLS` role reachable from the client, and no view over an
   RLS-protected table without `security_invoker=true`.** Sections 02 and 15.
   Either one silently voids every policy.
6. **`admin.ts` and `send-push.ts` absent from every client bundle.** They hold
   the service-role key and the VAPID private key. Add a
   `no-restricted-imports` ESLint rule — nothing in the type system catches
   this, and the failure mode is a service-role key in a JS bundle on a public
   repo.
7. **The explicit `.in('user_id', memberIds)` filters deleted, not ported.**
   Once (2) and (3) hold, they are redundant; client-side they are worse than
   redundant, because a filter the client chooses is not a boundary and leaving
   it in makes it look like one. Delete them in the same commit that verifies
   RLS.
8. **`--verify` wired into CI** against the committed migrations, so a future
   policy edit cannot quietly reopen any of this.

### Also worth fixing while in here

Found while tracing the query paths; not RLS, but they bite the same client
migration.

- **`push_subscriptions.endpoint` is globally `UNIQUE`** (`09:44`) *and*
  `UNIQUE(user_id, endpoint)` (`09:57`). `api/push/subscribe/route.ts:29-33`
  checks for an existing row by `endpoint` **without** a `user_id` filter: under
  RLS it cannot see another user's row, takes the insert branch, and hits the
  global constraint — a 500 with no path to recovery. Family members share
  devices, so this is reachable. Make it an upsert on `(user_id, endpoint)`.
- **`interest-card-editor.tsx:101-122` deletes all cards then re-inserts**, not
  in a transaction. If the insert fails, every interest card the user had is
  gone and the only copy is React state in a component about to show an error.
- **`settings/notifications/page.tsx:26-40` performs a write during render**,
  with `dynamic = 'force-dynamic'`. Combined with `09:140-143` and
  `api/push/subscribe:86-91`, there are three creation paths for one row. Make
  it one upsert.
- **`connect/page.tsx:41-55` ends in `.single()`**, which errors on zero rows.
  Server-side the error is swallowed and the empty-state branch renders; in a
  React Query `queryFn` it becomes a rejected query and an error screen.
  `.maybeSingle()`.
- **`question-history.tsx:46` filters `.eq('is_current', false)`**, so a past
  question's history shows only answers that were later edited away, and a
  member who answered once and never edited does not appear at all. Looks like a
  bug; changes visible behaviour, so it needs a product call.

---

## 8. Files

| File | Purpose |
|---|---|
| `supabase/dump_prod_state.sql` | **Read-only.** Full security state of a database, one sorted line per fact. Run against prod. |
| `supabase/dump_rls_migration_log.sql` | **Read-only.** Migration 10's record of the policies it destroyed. Only if 10 has run. |
| `scripts/rls_local_state.sh` | Builds a throwaway DB from the migrations, dumps it in the same format, optionally diffs and verifies. `--help` for options. |
| `scripts/supabase_shim.sql` | Roles, `auth` schema and `auth.uid()` for `--mode docker`. Approximates Supabase; see its header for what is and is not comparable. |
| `supabase/verify_isolation.sql` | **Writes — local only.** 46 isolation checks as the `authenticated` role. Rolls itself back. |
| `supabase/migrations/11a_rls_rpcs.sql` | Adds the three join/create RPCs. **Additive — safe to apply to production at any time.** Contains no policy or table statement. |
| `supabase/migrations/11b_rls_hardening.sql` | The policy fix for defects A-H. Apply only after 11a is applied *and* the RPC client is deployed. |
| `supabase/rollback_11a.sql` | Drops the three RPCs. Run only after `rollback_11b.sql` — see its header. |
| `supabase/rollback_11b.sql` | Restores migration 10's policy set. Reopens all eight holes. |
| `supabase/audit_policies.sql` | Pre-existing. Read-only human-readable audit; superseded by `dump_prod_state.sql` for diffing, still handy for eyeballing. |
| `supabase/rollback_10.sql` | Pre-existing. Rebuilds the pre-migration-10 policy set from `rls_migration_log`. |

`supabase/.rls-state/` holds generated dumps and is gitignored.
