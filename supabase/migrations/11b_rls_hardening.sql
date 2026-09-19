-- Migration 11b: RLS hardening — close the family-isolation holes
--
-- ---------------------------------------------------------------------------
-- DO NOT APPLY UNTIL 11a IS APPLIED *AND* THE CLIENT USING THE RPCs IS
-- DEPLOYED. This file removes the old path; the client must already be on the
-- new one. Read supabase/RLS_RECONCILIATION.md.
-- ---------------------------------------------------------------------------
--
-- Second half of the split described in 11a_rls_rpcs.sql. Order:
--   11a -> deploy client -> 11b
--
-- Fixes eight defects in the canonical policy set defined by
-- 10_performance.sql. They are defects in the FILES, not drift: every one was
-- reproduced against a clean database built from 01-10 by
-- scripts/rls_local_state.sh, and then confirmed to exist in production —
-- the 2026-09-19 dump is byte-for-byte identical to 10_performance.sql across
-- all 26 policies, so every defect reproduced locally is live.
--
-- That dump also cleared the name-drift risk this file's DROP statements carry:
-- production's policy names match these exactly, so every drop finds its
-- target and no stale permissive policy survives to be OR'd with a new one.
--
-- The client changes that must already be deployed (RLS_RECONCILIATION.md §6):
--   * join/[code]/page.tsx   -> family_by_invite_code() + join_family_by_invite_code()
--   * create-family/page.tsx -> create_family_with_owner()
-- because the `users` UPDATE policy below refuses a direct family_id change.
--
-- Rollback: supabase/rollback_11b.sql restores 10_performance.sql's policy set,
-- which reopens every hole. The client on the new RPCs keeps working after a
-- rollback, because 11a's functions stay.
--
-- Every statement is idempotent: each section drops both the policy names it
-- replaces AND the names it is about to create, so re-running is a no-op
-- rather than a "policy already exists" failure.

BEGIN;

-- ===========================================================================
-- 1. Defect A — narrow `families` to the caller's own
-- ===========================================================================
-- The RPCs from 11a are how a client now reaches a family it does not yet
-- belong to. With those in place, the table itself can close.

-- Now narrow the table itself. After this, a client can read exactly one
-- family: its own. getCurrentProfile()'s `families(name, invite_code)` embed
-- still works, because by then current_family_id() is the caller's family.
DROP POLICY IF EXISTS "Anyone can view families"                on families;
DROP POLICY IF EXISTS "Authenticated users can create families" on families;
DROP POLICY IF EXISTS "Users can view own family"               on families;

CREATE POLICY "Users can view own family"
  ON families FOR SELECT
  TO authenticated
  USING (id = public.current_family_id());

-- No INSERT policy: create_family_with_owner() is the only way in. A direct
-- insert would create a family with nobody in it and no way to reach it.

-- ===========================================================================
-- 2. Defect B (continued) — pin down users.family_id
-- ===========================================================================
--
-- 10_performance.sql:224 had ONE `FOR ALL` policy whose WITH CHECK was just
-- `id = auth.uid()`, which constrains WHICH row you may write but nothing about
-- WHAT you may write into it. family_id was therefore freely assignable.
--
-- Split by command so UPDATE can be constrained without affecting the others.
-- The comment at 10_performance.sql:218-222 warns that splitting this policy
-- breaks two things; both are preserved below, deliberately:
--   * own-row SELECT while family_id IS NULL  -> the SELECT policy here is
--     `id = auth.uid()` with no family condition, so a brand-new user can read
--     their own row during onboarding.
--   * deleting your own profile               -> explicit DELETE policy below.

DROP POLICY IF EXISTS "Users can do everything with own profile" on users;
DROP POLICY IF EXISTS "Users can view own profile"               on users;
DROP POLICY IF EXISTS "Users can insert own profile"             on users;
DROP POLICY IF EXISTS "Users can update own profile"             on users;
DROP POLICY IF EXISTS "Users can delete own profile"             on users;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

-- family_id is omitted from what a client may set, so it defaults to NULL.
-- Joining goes through the RPCs in step 1.
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    id = (select auth.uid())
    AND family_id IS NULL
  );

-- The load-bearing clause is the second one. current_family_id() is STABLE, so
-- inside an UPDATE it is evaluated against the statement's snapshot and returns
-- the row's PRE-UPDATE family_id. Requiring the new value to equal it means
-- family_id cannot be changed by any direct client UPDATE — only by the
-- SECURITY DEFINER functions above, which bypass RLS.
--
-- IS NOT DISTINCT FROM rather than `=`, so NULL = NULL holds: a user with no
-- family must still be able to edit their own name and bio.
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (
    id = (select auth.uid())
    AND family_id IS NOT DISTINCT FROM public.current_family_id()
  );

CREATE POLICY "Users can delete own profile"
  ON users FOR DELETE
  TO authenticated
  USING (id = (select auth.uid()));

-- Unchanged from 10_performance.sql:229 apart from the role qualification.
DROP POLICY IF EXISTS "Users can view family members" on users;

CREATE POLICY "Users can view family members"
  ON users FOR SELECT
  TO authenticated
  USING (
    family_id IS NOT NULL
    AND family_id = public.current_family_id()
  );

-- ===========================================================================
-- 3. Defect C — cross-family answer injection
-- ===========================================================================
--
-- Reproduced: as a member of family A,
--   insert into question_answers (question_id, user_id, answer_text)
--   values ('<family B question>', auth.uid(), 'INJECTED');
-- succeeded, and the row was then visible to family B. The attacker cannot
-- read the thread back, but they can write into it — inbound content injection
-- into a private family space.
--
-- 10_performance.sql:307 checked only `user_id = auth.uid()`: the right author,
-- but any question in the database.
--
-- The UPDATE policy gets the same clause. Without it, a user could move their
-- own existing answer onto another family's question, which reaches the same
-- end state by a different route.

DROP POLICY IF EXISTS "Users can create own answers" on question_answers;
DROP POLICY IF EXISTS "Users can update own answers" on question_answers;

CREATE POLICY "Users can create own answers"
  ON question_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    AND question_id IN (
      SELECT id FROM weekly_questions
      WHERE family_id = public.current_family_id()
    )
  );

CREATE POLICY "Users can update own answers"
  ON question_answers FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (
    user_id = (select auth.uid())
    AND question_id IN (
      SELECT id FROM weekly_questions
      WHERE family_id = public.current_family_id()
    )
  );

-- ===========================================================================
-- 4. Defect D — push_subscriptions had no UPDATE policy
-- ===========================================================================
--
-- Reproduced: `update push_subscriptions set is_active = false where user_id =
-- auth.uid()` returned NO ERROR and changed NOTHING. 09 and 10 both define only
-- SELECT, INSERT and DELETE.
--
-- Three call sites issue user-scoped UPDATEs against this table:
--   src/app/api/push/subscribe/route.ts:37    refresh rotated keys, reactivate
--   src/app/api/push/unsubscribe/route.ts:30  is_active = false
--   (src/lib/send-push.ts:161,176 also update, but via the service role, which
--    bypasses RLS — those have always worked, which is why the gap went unseen)
--
-- Both routes check only `error`, and supabase-js reports no error for an
-- UPDATE that matches zero rows, so both return success having done nothing.
-- Symptoms: turning push off leaves it on; a device whose keys rotate never
-- gets them refreshed and every send to it fails.
--
-- NOTE: if this table's UPDATEs demonstrably work in production today, then
-- production has a policy these files do not — record it before applying.

DROP POLICY IF EXISTS "Users can update own push subscriptions" on push_subscriptions;

CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ===========================================================================
-- 5. Defect E+F — weekly_questions was writable too broadly
-- ===========================================================================
--
-- Reproduced twice, as a member of family A:
--
--   E. INSERT with assigned_user_id set to a member of family B succeeded.
--      10_performance.sql:289 constrained family_id but not assigned_user_id,
--      so the asker could be someone outside the family — an unanswerable
--      question, and a row referencing a stranger's user id.
--
--   F. UPDATE of an already-active question's text succeeded, after answers
--      existed. 10_performance.sql:293 was `USING (family_id =
--      current_family_id())`: any member could rewrite any of their family's
--      questions at any time, including retroactively editing history.
--      connect-content.tsx:112 only offers this to the assigned user, so the
--      policy was broader than the product rule it was meant to encode.
--
-- The cron job (api/cron/rotate-questions) is unaffected: it uses the service
-- role, which bypasses RLS.

DROP POLICY IF EXISTS "Users can create questions for family" on weekly_questions;
DROP POLICY IF EXISTS "Users can update family questions"     on weekly_questions;
DROP POLICY IF EXISTS "Users can view family questions"       on weekly_questions;
DROP POLICY IF EXISTS "Assigned user can set their pending question" on weekly_questions;

CREATE POLICY "Users can view family questions"
  ON weekly_questions FOR SELECT
  TO authenticated
  USING (family_id = public.current_family_id());

CREATE POLICY "Users can create questions for family"
  ON weekly_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id = public.current_family_id()
    AND assigned_user_id IN (SELECT public.current_family_member_ids())
  );

-- Narrowed to the assigned asker, and to questions still awaiting a choice.
-- Once status is 'active' the question is settled and nobody may rewrite it —
-- which is what stops an answered question from being changed under the
-- answers. `WITH CHECK` keeps the row inside the family and on the same asker.
CREATE POLICY "Assigned user can set their pending question"
  ON weekly_questions FOR UPDATE
  TO authenticated
  USING (
    family_id = public.current_family_id()
    AND assigned_user_id = (select auth.uid())
    AND status = 'pending'
  )
  WITH CHECK (
    family_id = public.current_family_id()
    AND assigned_user_id = (select auth.uid())
  );

-- ===========================================================================
-- 6. Onboarding trap — `activities` hid the caller's own rows
-- ===========================================================================
--
-- Reproduced: with family_id set to NULL, the caller could still read their own
-- `picks` and `interest_cards` rows — those tables have a `FOR ALL` own-row
-- policy that also covers SELECT — but `activities` returned ZERO of their own
-- rows. Its only SELECT policy is family-scoped, and with no family
-- current_family_member_ids() is empty.
--
-- RLS_RECONCILIATION.md section 3 has the measurement. This is narrower than
-- the "add it to all three tables" advice it was flagged under: picks and
-- interest_cards already work. Only activities needs it.
--
-- Today the (app) layout redirects family-less users to /create-family before
-- any screen reads activities, so it is invisible. That redirect is server-side
-- and is exactly the kind of thing the client migration relocates, so fix the
-- policy rather than relying on render order.

DROP POLICY IF EXISTS "Users can view family activities" on activities;
DROP POLICY IF EXISTS "Users can create activities"      on activities;
DROP POLICY IF EXISTS "Users can update own activities"  on activities;
DROP POLICY IF EXISTS "Users can delete own activities"  on activities;

CREATE POLICY "Users can view family activities"
  ON activities FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR user_id IN (SELECT public.current_family_member_ids())
  );

CREATE POLICY "Users can create activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- WITH CHECK spelled out rather than left to default to USING, so it is
-- obvious that an activity cannot be reassigned to another user.
CREATE POLICY "Users can update own activities"
  ON activities FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own activities"
  ON activities FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ===========================================================================
-- 7. Revoke the helper functions from anon, for real this time
-- ===========================================================================
--
-- 10_performance.sql:98-101 intended this and did not achieve it, for the
-- reason given in step 1: an explicit grant from ALTER DEFAULT PRIVILEGES
-- survives REVOKE ... FROM PUBLIC. Confirmed in dump section 14.
--
-- Not a live hole — with no JWT, auth.uid() is NULL and both helpers return
-- nothing — but the SECURITY DEFINER surface reachable by an unauthenticated
-- caller should be empty, not merely harmless.
REVOKE EXECUTE ON FUNCTION public.current_family_id()         FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.current_family_member_ids() FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.current_family_id()         TO authenticated;
GRANT  EXECUTE ON FUNCTION public.current_family_member_ids() TO authenticated;

-- ===========================================================================
-- 8. Tables not touched, and why
-- ===========================================================================
-- interest_cards, picks           - `FOR ALL` own-row + family SELECT. Correct.
-- preset_questions                - SELECT for any caller with a `sub`. Correct.
-- notification_preferences        - own-row SELECT/INSERT/UPDATE. Correct.
-- notification_log                - SELECT only; writes are service-role by
--                                   design. Do NOT add an INSERT policy.
--
-- Their policies are still `TO public` rather than `TO authenticated`. That is
-- cosmetic: each one reduces to `<column> = auth.uid()`, which is NULL for
-- anon, so they already return nothing. Role-qualifying the remainder belongs
-- in the reconciliation migration written once the prod dump is in hand — that
-- migration rewrites every policy anyway, and doing it twice invites exactly
-- the name-drift problem this file warns about at the top.

COMMIT;

-- ===========================================================================
-- 9. Verify
-- ===========================================================================
-- Shows the end state. Every policy this migration created should be listed
-- with roles={authenticated}, and `families` should have exactly one policy.
--
-- This does NOT prove the holes are closed — for that, run the isolation suite
-- in RLS_RECONCILIATION.md section 5 as the `authenticated` role. The SQL
-- editor runs as an RLS-bypassing role and will report success regardless.

SELECT
  tablename,
  policyname,
  cmd,
  roles::text AS roles,
  COALESCE(qual, '-')       AS using_expr,
  COALESCE(with_check, '-') AS check_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'families', 'activities', 'weekly_questions',
                    'question_answers', 'push_subscriptions')
