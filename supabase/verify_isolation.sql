-- ===========================================================================
-- verify_isolation.sql — prove family isolation actually holds
-- ===========================================================================
--
-- ---------------------------------------------------------------------------
-- LOCAL THROWAWAY DATABASES ONLY. THIS SCRIPT WRITES.
-- ---------------------------------------------------------------------------
-- It inserts two families with test members, attacks the policies from one of
-- them, and rolls the whole thing back. Do NOT point it at production. The
-- read-only way to inspect production is supabase/dump_prod_state.sql.
--
-- Run it against a database built by scripts/rls_local_state.sh:
--
--   scripts/rls_local_state.sh --mode docker --verify
--
-- or by hand, against a local URL:
--
--   psql "postgresql://postgres:postgres@127.0.0.1:<port>/postgres" \
--     --no-psqlrc -f supabase/verify_isolation.sql
--
-- ---------------------------------------------------------------------------
-- WHY A SCRIPT AND NOT A CHECKLIST
-- ---------------------------------------------------------------------------
-- Every check below runs as the `authenticated` role with a JWT claim set, via
-- SET ROLE + SET LOCAL request.jwt.claims. That is the only way these results
-- mean anything.
--
-- Running the same queries in the Supabase dashboard SQL editor proves NOTHING:
-- the editor connects as an RLS-bypassing superuser-ish role, so every
-- "must return zero rows" check trivially returns whatever you ask for and
-- every write succeeds. A policy suite verified that way is unverified.
--
-- The whole script runs inside one transaction and ends with ROLLBACK, so it
-- leaves no rows behind even on a database you intend to keep.
--
-- Output: one row per check with pass = t/f. Any f is a failure. The final row
-- is a summary.
-- ===========================================================================

\set ON_ERROR_STOP on
\pset pager off

BEGIN;

-- Results land here. Created before SET ROLE and granted to authenticated, so
-- the checks (which run as that role) can record into it. Temp tables have no
-- RLS of their own, so this cannot perturb what is being measured.
CREATE TEMP TABLE rls_check (
  seq      serial,
  area     text,
  check_name text,
  expected text,
  actual   text,
  pass     boolean
);
-- Granted to anon as well, because section 6 records its results while acting
-- as that role. A temp table is invisible to any other session, so this grants
-- nothing beyond this script.
GRANT ALL ON rls_check TO authenticated, anon;
GRANT ALL ON SEQUENCE rls_check_seq_seq TO authenticated, anon;

-- --- fixtures --------------------------------------------------------------
-- Two families, one member each, with a row in every table the app uses.
-- Fixed UUIDs so the checks can reference them; all clearly fake.
-- Carol has an auth.users row and deliberately NO public.users row: she is the
-- just-signed-up state that section 5b exercises, and `users.id` carries a FK
-- to auth.users, so she has to exist here to be creatable there.
INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'alice@example.com'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'bob@example.com'),
  ('cccccccc-0000-0000-0000-00000000000c', 'carol@example.com');

INSERT INTO families (id, name, invite_code) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Family A', 'aaaacode'),
  ('22222222-0000-0000-0000-000000000002', 'Family B', 'bbbbcode');

INSERT INTO users (id, name, family_id, phone_number, bio) VALUES
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'Alice',
   '11111111-0000-0000-0000-000000000001', '555-0100', 'Alice bio'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'Bob',
   '22222222-0000-0000-0000-000000000002', '555-0200', 'Bob bio');

INSERT INTO activities (user_id, title) VALUES
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'A activity'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'B activity');

INSERT INTO picks (user_id, category, value, is_current) VALUES
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'movie', 'A movie', true),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'movie', 'B movie', true);

INSERT INTO interest_cards (user_id, category, description) VALUES
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'music', 'A music'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'music', 'B music');

INSERT INTO weekly_questions
  (id, family_id, question_text, week_start_date, week_number,
   assigned_user_id, status)
VALUES
  ('aa000000-0000-0000-0000-0000000000aa',
   '11111111-0000-0000-0000-000000000001', 'A question', '2026-09-14', 990,
   'aaaaaaaa-0000-0000-0000-00000000000a', 'active'),
  ('bb000000-0000-0000-0000-0000000000bb',
   '22222222-0000-0000-0000-000000000002', 'B question', '2026-09-14', 990,
   'bbbbbbbb-0000-0000-0000-00000000000b', 'active');

INSERT INTO question_answers (question_id, user_id, answer_text) VALUES
  ('aa000000-0000-0000-0000-0000000000aa',
   'aaaaaaaa-0000-0000-0000-00000000000a', 'A answer'),
  ('bb000000-0000-0000-0000-0000000000bb',
   'bbbbbbbb-0000-0000-0000-00000000000b', 'B answer');

INSERT INTO notification_preferences (user_id) VALUES
  ('aaaaaaaa-0000-0000-0000-00000000000a'),
  ('bbbbbbbb-0000-0000-0000-00000000000b')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, is_active) VALUES
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'https://push.example/a', 'pa', 'ka', true),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'https://push.example/b', 'pb', 'kb', true);

INSERT INTO notification_log
  (user_id, notification_type, title, body, delivery_method) VALUES
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'test', 'A', 'A', 'push'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'test', 'B', 'B', 'push');

-- ===========================================================================
-- Become Alice: a member of family A, holding a normal session.
-- ===========================================================================
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims =
  '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}';

-- --- 1. targeted cross-family reads: every one must return zero rows -------
DO $$
DECLARE
  b_family uuid := '22222222-0000-0000-0000-000000000002';
  b_user   uuid := 'bbbbbbbb-0000-0000-0000-00000000000b';
  n bigint;
BEGIN
  SELECT count(*) INTO n FROM users WHERE family_id = b_family;
  INSERT INTO rls_check VALUES (DEFAULT,'read','users of family B','0',n::text,n=0);

  SELECT count(*) INTO n FROM picks WHERE user_id = b_user;
  INSERT INTO rls_check VALUES (DEFAULT,'read','picks of B member','0',n::text,n=0);

  SELECT count(*) INTO n FROM interest_cards WHERE user_id = b_user;
  INSERT INTO rls_check VALUES (DEFAULT,'read','interest_cards of B member','0',n::text,n=0);

  SELECT count(*) INTO n FROM activities WHERE user_id = b_user;
  INSERT INTO rls_check VALUES (DEFAULT,'read','activities of B member','0',n::text,n=0);

  SELECT count(*) INTO n FROM weekly_questions WHERE family_id = b_family;
  INSERT INTO rls_check VALUES (DEFAULT,'read','weekly_questions of family B','0',n::text,n=0);

  SELECT count(*) INTO n FROM question_answers WHERE user_id = b_user;
  INSERT INTO rls_check VALUES (DEFAULT,'read','question_answers of B member','0',n::text,n=0);

  SELECT count(*) INTO n FROM notification_preferences WHERE user_id = b_user;
  INSERT INTO rls_check VALUES (DEFAULT,'read','notification_preferences of B','0',n::text,n=0);

  SELECT count(*) INTO n FROM push_subscriptions WHERE user_id = b_user;
  INSERT INTO rls_check VALUES (DEFAULT,'read','push_subscriptions of B','0',n::text,n=0);

  SELECT count(*) INTO n FROM notification_log WHERE user_id = b_user;
  INSERT INTO rls_check VALUES (DEFAULT,'read','notification_log of B','0',n::text,n=0);
END $$;

-- --- 2. unfiltered reads: the case the client migration creates ------------
-- A client can simply omit the filter, so what comes back IS the policy's
-- answer. Each of these must see family A's single row and nothing else.
DO $$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM users;
  INSERT INTO rls_check VALUES (DEFAULT,'unfiltered','select * from users','1',n::text,n=1);

  SELECT count(*) INTO n FROM picks;
  INSERT INTO rls_check VALUES (DEFAULT,'unfiltered','select * from picks','1',n::text,n=1);

  SELECT count(*) INTO n FROM activities;
  INSERT INTO rls_check VALUES (DEFAULT,'unfiltered','select * from activities','1',n::text,n=1);

  SELECT count(*) INTO n FROM interest_cards;
  INSERT INTO rls_check VALUES (DEFAULT,'unfiltered','select * from interest_cards','1',n::text,n=1);

  SELECT count(*) INTO n FROM weekly_questions;
  INSERT INTO rls_check VALUES (DEFAULT,'unfiltered','select * from weekly_questions','1',n::text,n=1);

  SELECT count(*) INTO n FROM question_answers;
  INSERT INTO rls_check VALUES (DEFAULT,'unfiltered','select * from question_answers','1',n::text,n=1);

  -- THE headline check. Before 11_rls_hardening.sql this returned every family
  -- in the database, invite codes included, to anyone holding the anon key.
  SELECT count(*) INTO n FROM families;
  INSERT INTO rls_check VALUES (DEFAULT,'unfiltered','select * from families','1',n::text,n=1);

  SELECT count(*) INTO n FROM families WHERE invite_code = 'bbbbcode';
  INSERT INTO rls_check
    VALUES (DEFAULT,'unfiltered','family B invite_code readable','0',n::text,n=0);
END $$;

-- --- 3. writes that must be refused ---------------------------------------
-- A policy denial on a write shows up two different ways: an INSERT or an
-- UPDATE that violates WITH CHECK raises 42501, while an UPDATE whose USING
-- clause matches no row simply reports zero rows affected and NO error. Both
-- count as "refused", so each check accepts either.
--
-- Each attack runs in its own subtransaction and is UNDONE either way. That
-- matters: on an unpatched database several of these SUCCEED, and a successful
-- attack that is left in place poisons every check after it. Joining family B
-- at check 1, for instance, silently changes what checks 2-6 are even
-- measuring. So each block ends by raising a sentinel, which rolls the
-- subtransaction back; the verdict is computed from the row count captured
-- before the raise.
--
-- attempt() takes the statement to run, the label to record it under, and
-- whether it is expected to affect rows. Keeping the plumbing in one function
-- is what stops six near-identical 12-line blocks from drifting apart.
CREATE OR REPLACE FUNCTION pg_temp.attempt(
  p_label text,
  p_sql   text
)
RETURNS void
LANGUAGE plpgsql
AS $fn$
DECLARE
  n int;
BEGIN
  BEGIN
    EXECUTE p_sql;
    GET DIAGNOSTICS n = ROW_COUNT;
    -- Undo whatever just happened, then report it.
    RAISE EXCEPTION 'rls_probe_rollback:%', n USING errcode = 'P0001';
  EXCEPTION
    WHEN insufficient_privilege THEN
      INSERT INTO rls_check
        VALUES (DEFAULT,'write-denied',p_label,'refused','42501 denied',true);
    WHEN raise_exception THEN
      IF SQLERRM LIKE 'rls_probe_rollback:%' THEN
        n := split_part(SQLERRM, ':', 2)::int;
        INSERT INTO rls_check
          VALUES (DEFAULT,'write-denied',p_label,'refused',
                  n || ' rows written', n = 0);
      ELSE
        -- An RPC refusing with its own error is also a refusal.
        INSERT INTO rls_check
          VALUES (DEFAULT,'write-denied',p_label,'refused',
                  SQLSTATE || ' ' || SQLERRM, true);
      END IF;
    WHEN OTHERS THEN
      INSERT INTO rls_check
        VALUES (DEFAULT,'write-denied',p_label,'refused',
                SQLSTATE || ' ' || SQLERRM, true);
  END;
END;
$fn$;

DO $probe$
BEGIN
  -- Defect B: join another family by writing your own family_id.
  PERFORM pg_temp.attempt(
    'self-assign into family B',
    $q$UPDATE users SET family_id = '22222222-0000-0000-0000-000000000002'
       WHERE id = auth.uid()$q$);

  -- Defect C: post an answer into another family's question.
  PERFORM pg_temp.attempt(
    'answer into family B question',
    $q$INSERT INTO question_answers (question_id, user_id, answer_text)
       VALUES ('bb000000-0000-0000-0000-0000000000bb', auth.uid(), 'INJECTED')$q$);

  -- Defect F: rewrite an already-active question, after answers exist.
  PERFORM pg_temp.attempt(
    'overwrite own family active question',
    $q$UPDATE weekly_questions SET question_text = 'OVERWRITTEN'
       WHERE id = 'aa000000-0000-0000-0000-0000000000aa'$q$);

  -- Defect E: create a question assigned to someone outside the family.
  PERFORM pg_temp.attempt(
    'question assigned outside family',
    $q$INSERT INTO weekly_questions
         (family_id, question_text, week_start_date, week_number,
          assigned_user_id, status)
       VALUES ('11111111-0000-0000-0000-000000000001', 'Q', '2026-09-21', 991,
               'bbbbbbbb-0000-0000-0000-00000000000b', 'pending')$q$);

  -- Forging a row owned by another family's member.
  PERFORM pg_temp.attempt(
    'activity on behalf of B member',
    $q$INSERT INTO activities (user_id, title)
       VALUES ('bbbbbbbb-0000-0000-0000-00000000000b', 'forged')$q$);

  -- Reading another family's invite code out of the row you are allowed to see.
  PERFORM pg_temp.attempt(
    'update another family''s name',
    $q$UPDATE families SET name = 'HIJACKED'
       WHERE id = '22222222-0000-0000-0000-000000000002'$q$);

  -- Joining a family you do hold the code for, while already in one. Only
  -- meaningful once 11_rls_hardening.sql has introduced the RPC; before that the
  -- function does not exist and the attempt is recorded as an error, which is
  -- also a refusal.
  PERFORM pg_temp.attempt(
    'join family B while in family A',
    $q$SELECT public.join_family_by_invite_code('bbbbcode')$q$);
END $probe$;

-- --- 4. writes that must still work ---------------------------------------
-- A policy set that denies everything is not correct, it is just broken. These
-- are the app's own operations and every one has to survive.
DO $$
DECLARE n int;
BEGIN
  UPDATE users SET bio = 'edited' WHERE id = auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO rls_check VALUES (DEFAULT,'write-allowed','edit own profile','1',n::text,n=1);

  -- Defect D: this silently affected zero rows before 11_rls_hardening.sql,
  -- which is why turning push off did not turn push off.
  UPDATE push_subscriptions SET is_active = false WHERE user_id = auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO rls_check VALUES (DEFAULT,'write-allowed',
    'deactivate own push subscription','1',n::text,n=1);

  INSERT INTO activities (user_id, title) VALUES (auth.uid(), 'mine');
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO rls_check VALUES (DEFAULT,'write-allowed','create own activity','1',n::text,n=1);

  INSERT INTO picks (user_id, category, value, is_current)
  VALUES (auth.uid(), 'book', 'A book', true);
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO rls_check VALUES (DEFAULT,'write-allowed','create own pick','1',n::text,n=1);

  UPDATE notification_preferences SET push_enabled = true WHERE user_id = auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO rls_check VALUES (DEFAULT,'write-allowed',
    'update own notification prefs','1',n::text,n=1);

  -- Answering one's OWN family's question must keep working — the tightened
  -- WITH CHECK in step 3 of 11_rls_hardening.sql could easily have broken it.
  UPDATE question_answers SET is_current = false WHERE user_id = auth.uid();
  INSERT INTO question_answers (question_id, user_id, answer_text)
  VALUES ('aa000000-0000-0000-0000-0000000000aa', auth.uid(), 'new answer');
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO rls_check VALUES (DEFAULT,'write-allowed',
    'answer own family question','1',n::text,n=1);

  -- The sanctioned lookup still resolves a code the caller holds. Wrapped
  -- because the function does not exist before 11_rls_hardening.sql, and a
  -- missing function should be reported as a failed check rather than abort
  -- the whole suite.
  BEGIN
    SELECT count(*) INTO n FROM public.family_by_invite_code('bbbbcode');
    INSERT INTO rls_check VALUES (DEFAULT,'write-allowed',
      'family_by_invite_code resolves a held code','1',n::text,n=1);
  EXCEPTION WHEN undefined_function THEN
    INSERT INTO rls_check VALUES (DEFAULT,'write-allowed',
      'family_by_invite_code resolves a held code','1','function absent',false);
  END;
END $$;

-- ===========================================================================
-- 5. Onboarding: a user with no family yet
-- ===========================================================================
-- current_family_id() is NULL and current_family_member_ids() is empty here, so
-- every family-scoped policy matches nothing. The user must still be able to
-- see their OWN rows, or onboarding dead-ends. 10_performance.sql:218-222
-- flagged this trap; `activities` was the table that actually fell into it.
--
-- Getting into this state requires dropping out of RLS: the `users` UPDATE
-- policy refuses to let a client clear its own family_id, which is the point of
-- step 2 of 11b_rls_hardening.sql. So the fixture is arranged as the table owner
-- and the role is then handed back. (That refusal is itself asserted as a
-- check, in section 3.)
RESET ROLE;
UPDATE users SET family_id = NULL
WHERE id = 'aaaaaaaa-0000-0000-0000-00000000000a';

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims =
  '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}';

DO $$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM users WHERE id = auth.uid();
  INSERT INTO rls_check VALUES (DEFAULT,'onboarding','own users row visible','1',n::text,n=1);

  SELECT count(*) INTO n FROM picks WHERE user_id = auth.uid();
  INSERT INTO rls_check VALUES (DEFAULT,'onboarding','own picks visible','>=1',n::text,n>=1);

  SELECT count(*) INTO n FROM interest_cards WHERE user_id = auth.uid();
  INSERT INTO rls_check VALUES (DEFAULT,'onboarding','own interest_cards visible','>=1',n::text,n>=1);

  SELECT count(*) INTO n FROM activities WHERE user_id = auth.uid();
  INSERT INTO rls_check VALUES (DEFAULT,'onboarding','own activities visible','>=1',n::text,n>=1);

  -- And the way out of onboarding has to work.
  BEGIN
    PERFORM public.join_family_by_invite_code('aaaacode');
    SELECT count(*) INTO n FROM users WHERE id = auth.uid()
      AND family_id = '11111111-0000-0000-0000-000000000001';
    INSERT INTO rls_check VALUES (DEFAULT,'onboarding','join by invite code works','1',n::text,n=1);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO rls_check VALUES (DEFAULT,'onboarding','join by invite code works',
      '1', SQLSTATE || ' ' || SQLERRM, false);
  END;
END $$;

-- ===========================================================================
-- 5b. Onboarding: the OTHER way in — create_family_with_owner
-- ===========================================================================
-- create-family/page.tsx calls nothing else now: the three statements it used
-- to issue (insert profile, insert family, point profile at it) were not a
-- transaction, and a failure after the second stranded a family with no members
-- and a user with no family. This exercises the replacement, including the
-- `needsProfile` path where signup never created the users row.
--
-- Deliberately a brand-new subject with NO users row at all, since that is the
-- case the function has to handle and the one the old client code got wrong.
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims =
  '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}';

DO $$
DECLARE
  n   bigint;
  fid uuid;
BEGIN
  -- 1. A user with no profile row gets both a profile and a family.
  BEGIN
    fid := public.create_family_with_owner('Family C', 'Carol');

    SELECT count(*) INTO n FROM users
     WHERE id = auth.uid() AND family_id = fid AND name = 'Carol';
    INSERT INTO rls_check VALUES (DEFAULT,'onboarding',
      'create_family_with_owner makes profile + family','1',n::text,n=1);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO rls_check VALUES (DEFAULT,'onboarding',
      'create_family_with_owner makes profile + family','1',
      SQLSTATE || ' ' || SQLERRM, false);
  END;

  -- 2. Calling it again must refuse rather than orphan the first family.
  BEGIN
    PERFORM public.create_family_with_owner('Family C2', 'Carol');
    INSERT INTO rls_check VALUES (DEFAULT,'write-denied',
      'create a second family while in one','refused','created', false);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO rls_check VALUES (DEFAULT,'write-denied',
      'create a second family while in one','refused',
      SQLSTATE || ' refused', SQLSTATE = '23505');
  END;

  -- 3. A blank name is rejected in the database, not only in the form.
  BEGIN
    PERFORM public.create_family_with_owner('   ', NULL);
    INSERT INTO rls_check VALUES (DEFAULT,'write-denied',
      'create a family with a blank name','refused','created', false);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO rls_check VALUES (DEFAULT,'write-denied',
      'create a family with a blank name','refused',
      SQLSTATE || ' refused', SQLSTATE IN ('22023','23505'));
  END;
END $$;

-- ===========================================================================
-- 6. Anonymous: the anon key with no session at all
-- ===========================================================================
-- This key is embedded in the client bundle and this repo is public, so treat
-- it as known to everyone. Nothing may be readable with it.
RESET ROLE;
SET LOCAL ROLE anon;
SET LOCAL request.jwt.claims = '';

DO $$
DECLARE
  t text;
  n bigint;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','families','activities','interest_cards','picks',
    'weekly_questions','question_answers','notification_preferences',
    'push_subscriptions','notification_log'
  ] LOOP
    BEGIN
      EXECUTE format('SELECT count(*) FROM public.%I', t) INTO n;
      INSERT INTO rls_check
        VALUES (DEFAULT,'anon','anon reads ' || t,'0',n::text,n=0);
    EXCEPTION WHEN OTHERS THEN
      -- An outright permission error is a stricter pass than zero rows.
      INSERT INTO rls_check
        VALUES (DEFAULT,'anon','anon reads ' || t,'0',SQLSTATE || ' denied',true);
    END;
  END LOOP;
END $$;

-- ===========================================================================
-- Results
-- ===========================================================================
RESET ROLE;

SELECT area, check_name, expected, actual, pass
FROM rls_check
ORDER BY seq;

SELECT
  count(*)                        AS checks,
  count(*) FILTER (WHERE pass)    AS passed,
  count(*) FILTER (WHERE NOT pass) AS failed,
  CASE WHEN count(*) FILTER (WHERE NOT pass) = 0
       THEN 'ALL CHECKS PASSED'
       ELSE '*** ' || count(*) FILTER (WHERE NOT pass) || ' FAILED - see pass=f above ***'
  END AS verdict
FROM rls_check;

-- Nothing is kept. The fixtures existed only for the duration of this script.
ROLLBACK;
