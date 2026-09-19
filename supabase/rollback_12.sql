-- Emergency rollback for 12_rls_hardening.sql.
--
-- Restores 10_performance.sql's policy set exactly, by recreating it from
-- source rather than from a log. That is possible here — and it is why this
-- file is so much simpler than rollback_10.sql — because migration 12 only
-- ever runs AFTER migration 10, so the state it replaced is known: it is
-- whatever 10_performance.sql section 4 creates. No drift to reconstruct.
--
-- ---------------------------------------------------------------------------
-- WHAT THIS GIVES YOU BACK, INCLUDING THE BAD PARTS
-- ---------------------------------------------------------------------------
-- migration 12 closed eight defects. Running this REOPENS ALL OF THEM:
--
--   * every family's invite_code becomes readable with the bare anon key
--   * any authenticated user can move themselves into any family
--   * answers can be injected into other families' questions
--   * push_subscriptions UPDATEs silently affect zero rows again
--   * any member can rewrite an active weekly question
--   * a family-less user cannot see their own activities
--
-- This is a get-the-app-working-again lever for the case where migration 11
-- broke a flow in production and the fix is not obvious at 11pm. It is not a
-- resting place. If you run it, the client changes migration 12 required
-- (join/[code] and create-family calling the RPCs) must be reverted too, or
-- joining a family stops working entirely — those pages will be calling
-- functions that this file leaves in place but that nothing grants meaning to.
--
-- More likely than a rollback: migration 12 did exactly what it says and a
-- client page was not updated alongside it. Check that first.
--
-- Safe to re-run. Runs in one transaction.

BEGIN;

-- --- families --------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own family" ON families;

CREATE POLICY "Anyone can view families"
  ON families FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create families"
  ON families FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- --- users -----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile"   ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;
DROP POLICY IF EXISTS "Users can view family members" ON users;

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

-- --- activities ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view family activities" ON activities;
DROP POLICY IF EXISTS "Users can create activities"      ON activities;
DROP POLICY IF EXISTS "Users can update own activities"  ON activities;
DROP POLICY IF EXISTS "Users can delete own activities"  ON activities;

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

-- --- weekly_questions ------------------------------------------------------
DROP POLICY IF EXISTS "Assigned user can set their pending question" ON weekly_questions;
DROP POLICY IF EXISTS "Users can view family questions"              ON weekly_questions;
DROP POLICY IF EXISTS "Users can create questions for family"        ON weekly_questions;
DROP POLICY IF EXISTS "Users can update family questions"            ON weekly_questions;

CREATE POLICY "Users can view family questions"
  ON weekly_questions FOR SELECT
  USING (family_id = public.current_family_id());

CREATE POLICY "Users can create questions for family"
  ON weekly_questions FOR INSERT
  WITH CHECK (family_id = public.current_family_id());

CREATE POLICY "Users can update family questions"
  ON weekly_questions FOR UPDATE
  USING (family_id = public.current_family_id());

-- --- question_answers ------------------------------------------------------
DROP POLICY IF EXISTS "Users can create own answers" ON question_answers;
DROP POLICY IF EXISTS "Users can update own answers" ON question_answers;

CREATE POLICY "Users can create own answers"
  ON question_answers FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own answers"
  ON question_answers FOR UPDATE
  USING (user_id = (select auth.uid()));

-- --- push_subscriptions ----------------------------------------------------
-- Dropping this is what re-breaks unsubscribe. Migration 09 and 10 never had
-- it; removing it restores that state faithfully, bug included.
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;

-- --- helper function grants ------------------------------------------------
-- migration 12 revoked EXECUTE from anon by name (REVOKE FROM PUBLIC alone did
-- not do it, because Supabase's default privileges grant anon explicitly).
-- Restoring migration 10's state means putting that grant back.
GRANT EXECUTE ON FUNCTION public.current_family_id()         TO anon;
GRANT EXECUTE ON FUNCTION public.current_family_member_ids() TO anon;

COMMIT;

-- The three RPCs migration 12 added are deliberately LEFT IN PLACE:
-- family_by_invite_code, join_family_by_invite_code, create_family_with_owner.
-- Nothing breaks by keeping them — with `families` readable again the client
-- does not need them — and keeping them means re-applying migration 12 later
-- does not have to recreate them. To remove:
--   DROP FUNCTION IF EXISTS public.create_family_with_owner(text, text);
--   DROP FUNCTION IF EXISTS public.join_family_by_invite_code(text);
--   DROP FUNCTION IF EXISTS public.family_by_invite_code(text);

-- What the restored state looks like.
SELECT
  tablename,
  policyname,
  cmd,
  roles::text AS roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'families', 'activities', 'weekly_questions',
                    'question_answers', 'push_subscriptions')
ORDER BY tablename, policyname;
