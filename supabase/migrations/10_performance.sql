-- Migration: Performance — indexes and RLS policy rewrite
--
-- ---------------------------------------------------------------------------
-- READ THIS BEFORE RUNNING. Run supabase/audit_policies.sql first.
-- ---------------------------------------------------------------------------
--
-- This migration replaces every RLS policy on the app's tables. It grants the
-- same access as the policy set in 01-09 — no table becomes more or less
-- visible — but it does not trust the live database to match those files,
-- because it demonstrably does not.
--
-- Why: the `users` SELECT policy in 01_schema.sql is self-referential —
--
--   family_id in (select family_id from users where id = auth.uid())
--
-- Reading `users` inside the policy *for* `users` re-enters the same policy and
-- Postgres aborts the statement with "infinite recursion detected in policy for
-- relation users". Applying 01-09 to a clean Postgres 17 and querying as the
-- `authenticated` role fails on every single table. Since the live app works,
-- production was patched outside these migration files at some point, and the
-- real policy names there are unknown.
--
-- So rather than `DROP POLICY IF EXISTS "<exact name>"` — which silently does
-- nothing if the live policy was renamed, leaving a stale policy OR'd together
-- with the new one and quietly widening access — step 2 below enumerates the
-- policies that actually exist and drops them by name, logging each one. The
-- end state is identical no matter what drift is present.
--
-- Everything here is idempotent and safe to re-run.
--
-- ---------------------------------------------------------------------------
-- THIS MIGRATION MAY TURN RLS BACK ON. Check audit section 0 first.
-- ---------------------------------------------------------------------------
-- Step 3 runs ENABLE ROW LEVEL SECURITY on every app table. If production
-- currently has RLS *disabled* on one of them — the usual panic fix for the
-- recursion error, and invisible in pg_policies, which keeps listing policies
-- that are no longer enforced — then this is not a no-op. It starts enforcing
-- rules that have been dormant.
--
-- That is the correct end state: with RLS off, anyone holding the public anon
-- key can read the whole table. But it is a real behavior change, so exercise
-- login, feed, family, connect and profile right after applying, rather than
-- assuming silence means success. The recursion that likely caused RLS to be
-- switched off in the first place is fixed here by the SECURITY DEFINER
-- helpers, so enabling it should now be safe.
--
-- The two real performance problems being fixed:
--
-- 1. Missing indexes. `activities` had none at all, and `users.family_id` had
--    none despite being the column nearly every policy and page filters on.
--
-- 2. Bare `auth.uid()` in policy bodies. Postgres cannot prove a call like that
--    is constant, so it re-evaluated it once per candidate row. Wrapping it as
--    `(select auth.uid())` turns it into a one-time InitPlan. The family-scoping
--    policies went further and ran a correlated self-join against RLS-protected
--    `users`; the helpers below collapse that to one hashed subplan per
--    statement — and incidentally remove the recursion.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Helper functions
-- ---------------------------------------------------------------------------
--
-- STABLE, so Postgres evaluates them once per statement rather than once per
-- row. SECURITY DEFINER, so reading `users` does not re-enter the `users`
-- policy — this is what breaks the recursion.
--
-- SECURITY DEFINER bypasses RLS, so each function's reach is deliberately no
-- wider than what the policy it serves already granted:
--   * current_family_id()         reads only the caller's own row.
--   * current_family_member_ids() returns only the caller's own family.
-- Neither takes an argument, so a caller has nothing to manipulate.
--
-- search_path is pinned so a caller cannot shadow `public.users` with a
-- same-named table in a schema earlier on their own search_path.

CREATE OR REPLACE FUNCTION public.current_family_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT family_id FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_family_member_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id FROM public.users WHERE family_id = public.current_family_id()
$$;

REVOKE EXECUTE ON FUNCTION public.current_family_id() FROM public;
REVOKE EXECUTE ON FUNCTION public.current_family_member_ids() FROM public;
GRANT EXECUTE ON FUNCTION public.current_family_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_family_member_ids() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Clear existing policies on the managed tables
-- ---------------------------------------------------------------------------
--
-- Every DROP is recorded in the table `rls_migration_log`, AND announced via
-- RAISE NOTICE. The table matters because the Supabase dashboard SQL editor
-- frequently does not surface notices — and this audit trail is the whole point,
-- so it must not depend on the client showing log output.
--
-- The final statement of this migration selects that log. READ IT: any policy
-- listed there that is NOT recreated in step 4 was a hand-made production policy
-- this migration has removed, and that needs a decision rather than a shrug.
--
-- Drop the table whenever you're done with it:  DROP TABLE rls_migration_log;

-- Captures enough to RECREATE each dropped policy, not merely describe it:
-- cmd and roles are as load-bearing as the expressions. supabase/rollback_10.sql
-- reconstructs the old policy set from these rows.
CREATE TABLE IF NOT EXISTS rls_migration_log (
  id            bigserial PRIMARY KEY,
  ran_at        timestamptz NOT NULL DEFAULT now(),
  table_name    text        NOT NULL,
  policy_name   text        NOT NULL,
  cmd           text,
  roles         text[],
  permissive    text,
  using_expr    text,
  check_expr    text,
  rls_was_enabled boolean
);

-- Older runs of this migration created the table without these columns.
ALTER TABLE rls_migration_log ADD COLUMN IF NOT EXISTS cmd text;
ALTER TABLE rls_migration_log ADD COLUMN IF NOT EXISTS roles text[];
ALTER TABLE rls_migration_log ADD COLUMN IF NOT EXISTS permissive text;
ALTER TABLE rls_migration_log ADD COLUMN IF NOT EXISTS rls_was_enabled boolean;

-- This table lives in `public`, so PostgREST would otherwise expose it over the
-- API. RLS on with zero policies denies anon and authenticated outright; the
-- service role bypasses RLS and can still read it, as can the SQL editor.
-- It describes the shape of your security rules — not a thing to serve publicly.
ALTER TABLE rls_migration_log ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  p record;
  managed text[] := ARRAY[
    'users', 'families', 'activities', 'interest_cards', 'picks',
    'weekly_questions', 'question_answers', 'preset_questions',
    'notification_preferences', 'push_subscriptions', 'notification_log'
  ];
BEGIN
  FOR p IN
    SELECT pol.tablename, pol.policyname, pol.cmd, pol.roles,
           pol.permissive, pol.qual, pol.with_check,
           c.relrowsecurity AS rls_on
    FROM pg_policies pol
    JOIN pg_class c ON c.relname = pol.tablename
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = pol.schemaname
    WHERE pol.schemaname = 'public' AND pol.tablename = ANY(managed)
    ORDER BY pol.tablename, pol.policyname
  LOOP
    -- Capture the full definition before destroying it, so the old policy can be
    -- reconstructed by supabase/rollback_10.sql. rls_was_enabled records whether
    -- the table was actually enforcing anything, which step 3 below changes.
    INSERT INTO rls_migration_log (
      table_name, policy_name, cmd, roles, permissive,
      using_expr, check_expr, rls_was_enabled
    )
    VALUES (
      p.tablename, p.policyname, p.cmd, p.roles::text[], p.permissive,
      p.qual, p.with_check, p.rls_on
    );

    RAISE NOTICE 'dropping pre-existing policy on %: %', p.tablename, p.policyname;
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Make sure RLS is on everywhere (no-op where it already is)
-- ---------------------------------------------------------------------------

ALTER TABLE users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE families                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities               ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_cards           ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_answers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log         ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4. The canonical policy set
-- ---------------------------------------------------------------------------
-- One policy per (table, command) combination that 01-09 defined, granting the
-- same rows. Anything listed by step 2 but absent here was not in 01-09.

-- users ---------------------------------------------------------------------
--
-- These match PRODUCTION's policies, not 01_schema.sql's. The audit showed
-- production had been hand-edited to a stricter and differently-shaped set, and
-- production is the thing that must not regress:
--
--   * 01_schema.sql allowed `family_id IS NULL` rows to be read by ANYONE. That
--     branch is deliberately NOT reproduced here. A user who has signed up but
--     not yet joined a family has family_id NULL, and under the 01_schema rule
--     every such row was world-readable to any authenticated caller. Production
--     had already tightened this to `family_id IS NOT NULL AND ...`; restoring
--     the old branch would have widened access.
--
--   * Production replaced the separate INSERT and UPDATE policies with a single
--     FOR ALL policy, which also covers SELECT and DELETE of one's own row.
--     Keeping FOR ALL preserves two things the split version would have broken:
--     deleting your own profile, and reading your own row while family_id is
--     still NULL (no family yet) — which the stricter SELECT policy above
--     would otherwise deny, locking a new user out of onboarding.

CREATE POLICY "Users can do everything with own profile"
  ON users FOR ALL
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can view family members"
  ON users FOR SELECT
  USING (
    family_id IS NOT NULL
    AND family_id = public.current_family_id()
  );

-- families ------------------------------------------------------------------
-- Intentionally unrestricted: joining by invite code requires looking up a
-- family before you belong to it. Unchanged from 01_schema.sql.
CREATE POLICY "Anyone can view families"
  ON families FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create families"
  ON families FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- activities ----------------------------------------------------------------
CREATE POLICY "Users can view family activities"
  ON activities FOR SELECT
  USING (user_id IN (SELECT public.current_family_member_ids()));

CREATE POLICY "Users can create activities"
  ON activities FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own activities"
  ON activities FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own activities"
  ON activities FOR DELETE
  USING (user_id = (select auth.uid()));

-- interest_cards ------------------------------------------------------------
CREATE POLICY "Users can view family interest cards"
  ON interest_cards FOR SELECT
  USING (user_id IN (SELECT public.current_family_member_ids()));

CREATE POLICY "Users can manage own interest cards"
  ON interest_cards FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- picks ---------------------------------------------------------------------
CREATE POLICY "Users can view family picks"
  ON picks FOR SELECT
  USING (user_id IN (SELECT public.current_family_member_ids()));

CREATE POLICY "Users can manage own picks"
  ON picks FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- weekly_questions ----------------------------------------------------------
CREATE POLICY "Users can view family questions"
  ON weekly_questions FOR SELECT
  USING (family_id = public.current_family_id());

CREATE POLICY "Users can create questions for family"
  ON weekly_questions FOR INSERT
  WITH CHECK (family_id = public.current_family_id());

CREATE POLICY "Users can update family questions"
  ON weekly_questions FOR UPDATE
  USING (family_id = public.current_family_id());

-- question_answers ----------------------------------------------------------
CREATE POLICY "Users can view family answers"
  ON question_answers FOR SELECT
  USING (
    question_id IN (
      SELECT id FROM weekly_questions
      WHERE family_id = public.current_family_id()
    )
  );

CREATE POLICY "Users can create own answers"
  ON question_answers FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own answers"
  ON question_answers FOR UPDATE
  USING (user_id = (select auth.uid()));

-- preset_questions ----------------------------------------------------------
CREATE POLICY "Authenticated users can view preset questions"
  ON preset_questions FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- notification_preferences --------------------------------------------------
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- push_subscriptions --------------------------------------------------------
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (user_id = (select auth.uid()));

-- notification_log ----------------------------------------------------------
-- SELECT only, as before. Writes go through the service-role client, which
-- bypasses RLS.
CREATE POLICY "Users can view own notification log"
  ON notification_log FOR SELECT
  USING (user_id = (select auth.uid()));

COMMIT;

-- ---------------------------------------------------------------------------
-- 5. Indexes
-- ---------------------------------------------------------------------------
-- Outside the transaction so a failure here cannot roll back the policy work.

-- The hottest missing index in the app: every family-scoping policy and almost
-- every page filters users by family_id.
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);

-- `activities` had no indexes whatsoever.
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);

-- Serves the feed's `order by created_at desc limit N`.
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- Serves the profile page's "my recent activities".
CREATE INDEX IF NOT EXISTS idx_activities_user_created
  ON activities(user_id, created_at DESC);

-- 06_picks_history.sql indexed archived picks on created_at, but the feed's
-- previous-value lookup sorts by archived_at, so that index could not serve the
-- sort and Postgres fell back to sorting in memory.
CREATE INDEX IF NOT EXISTS idx_picks_history_archived
  ON picks(user_id, category, archived_at DESC)
  WHERE is_current = false;

-- ---------------------------------------------------------------------------
-- 6. Refresh planner statistics so the new indexes are used immediately
-- ---------------------------------------------------------------------------

ANALYZE users;
ANALYZE activities;
ANALYZE picks;
ANALYZE interest_cards;
ANALYZE weekly_questions;
ANALYZE question_answers;

-- ---------------------------------------------------------------------------
-- 7. The drift audit — READ THIS OUTPUT
-- ---------------------------------------------------------------------------
-- Every policy this migration destroyed, with its original definition.
-- `recreated = false` means production had a policy that is NOT part of the
-- canonical set above: a hand-made rule that is now gone. Decide whether it was
-- load-bearing; the using_expr / check_expr columns are enough to rebuild it.
--
-- This is the last statement so that clients which show only the final result
-- set (the Supabase dashboard among them) display it.

-- `outcome` compares DEFINITIONS, not just names. An earlier version of this
-- query only checked whether a policy of the same name existed afterwards, which
-- reported "recreated" for policies whose body had been completely rewritten --
-- reassuring in exactly the case that deserves attention.
SELECT
  l.table_name,
  l.policy_name,
  CASE
    WHEN p.policyname IS NULL THEN 'REMOVED - nothing replaced it, review this'
    WHEN COALESCE(p.qual, '')       = COALESCE(l.using_expr, '')
     AND COALESCE(p.with_check, '') = COALESCE(l.check_expr, '')
     AND COALESCE(p.cmd, '')        = COALESCE(l.cmd, '')
      THEN 'unchanged'
    ELSE 'replaced - same name, new definition'
  END AS outcome,
  l.rls_was_enabled AS rls_was_on_before,
  c.relrowsecurity  AS rls_on_now,
  l.using_expr      AS old_using,
  p.qual            AS new_using,
  l.check_expr      AS old_check,
  p.with_check      AS new_check
FROM rls_migration_log l
LEFT JOIN pg_policies p
  ON p.schemaname = 'public'
 AND p.tablename  = l.table_name
 AND p.policyname = l.policy_name
LEFT JOIN pg_class c ON c.relname = l.table_name
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
WHERE l.ran_at = (SELECT max(ran_at) FROM rls_migration_log)
ORDER BY
  CASE
    WHEN p.policyname IS NULL THEN 0   -- anything removed sorts to the top
    WHEN COALESCE(p.qual, '') = COALESCE(l.using_expr, '')
     AND COALESCE(p.with_check, '') = COALESCE(l.check_expr, '') THEN 2
    ELSE 1
  END,
  l.table_name, l.policy_name;
