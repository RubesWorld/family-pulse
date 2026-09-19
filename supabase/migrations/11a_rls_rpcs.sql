-- Migration 11a: the join/create RPCs
--
-- ---------------------------------------------------------------------------
-- SAFE TO APPLY TO PRODUCTION AT ANY TIME. Nothing calls these yet, and they
-- change no existing behaviour: they only ADD three functions.
-- ---------------------------------------------------------------------------
--
-- This is the first half of what was one migration. It was split because the
-- two halves break each other if deployed out of order:
--
--   11a (this file)  adds the RPCs.          Additive. No behaviour change.
--   [deploy client]  switches to the RPCs.   Works under 10's policies AND 11b's.
--   11b              tightens the policies.  Breaks any client still writing
--                                            users.family_id directly.
--
-- Applying 11a first means the client has somewhere to land before 11b removes
-- the old path, so there is no window in which joining or onboarding is broken.
--
-- These are all SECURITY DEFINER and therefore bypass RLS, which is why they
-- work identically before and after 11b.
--
-- Verified against production's dump (2026-09-19): prod's policy set is
-- byte-for-byte 10_performance.sql, so the names 11b drops are the names that
-- are actually there.
--
-- Rollback: supabase/rollback_11a.sql
--
-- Idempotent: CREATE OR REPLACE throughout.

BEGIN;

-- ===========================================================================
-- Defect A+B — families was world-readable and anyone could join any family
-- ===========================================================================
--
-- Reproduced: as `anon`, with NO JWT at all, `select id, name, invite_code from
-- families` returned every family. The anon key ships in the browser bundle of
-- a public repo, so every invite code in the product was effectively published.
-- Then, as any authenticated user,
--   update users set family_id = '<other family>' where id = auth.uid()
-- succeeded, after which that family's members, phone numbers, bios, picks,
-- activities, interest cards and answers were all readable.
--
-- The two together are one vulnerability: enumerate, then join.
--
-- The fix separates the two capabilities that `USING (true)` had conflated:
-- "look up ONE family by a code I already hold" and "list all families". Only
-- the first is a product requirement, and it does not need a SELECT policy at
-- all — it needs a function that takes the code as an argument, which is not
-- something a caller can turn into a listing.
--
-- 11b is what removes the old path. This file only builds the new one.

-- Look up one family by invite code, without granting the ability to browse.
--
-- SECURITY DEFINER because `families` is no longer readable before you belong
-- to it. The reach is deliberately minimal: it returns at most one row, only
-- ever the row whose invite_code was supplied, and it does NOT return the
-- invite_code back out — a caller learns nothing it did not already know.
-- There is no way to enumerate with it: the argument must be guessed against
-- the full 8-hex-character space, and each guess is one round trip.
CREATE OR REPLACE FUNCTION public.family_by_invite_code(p_code text)
RETURNS TABLE (id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT f.id, f.name
  FROM public.families f
  WHERE f.invite_code = p_code
  LIMIT 1
$$;

-- Join a family by invite code. The ONLY sanctioned way for a client to set
-- users.family_id, now that the UPDATE policy in step 2 refuses to.
--
-- Everything the old client-side flow got to decide is decided here instead:
-- the code must be valid, and the caller may only move their own row, and only
-- when they are not already in a family. That last condition is what stops this
-- from being a family-hopping primitive — leaving a family is not a feature the
-- app offers, so re-joining is not one either.
CREATE OR REPLACE FUNCTION public.join_family_by_invite_code(p_code text)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_family_id uuid;
  v_current   uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING errcode = '28000';
  END IF;

  SELECT family_id INTO v_current FROM public.users WHERE id = v_uid;
  IF v_current IS NOT NULL THEN
    RAISE EXCEPTION 'already a member of a family' USING errcode = '23505';
  END IF;

  SELECT f.id INTO v_family_id
  FROM public.families f
  WHERE f.invite_code = p_code;

  IF v_family_id IS NULL THEN
    -- Deliberately the same message whether the code is malformed or simply
    -- not in use, so failures carry no information about which codes exist.
    RAISE EXCEPTION 'invalid invite code' USING errcode = '22023';
  END IF;

  UPDATE public.users SET family_id = v_family_id WHERE id = v_uid;

  RETURN v_family_id;
END;
$$;

-- Create a family and put the caller in it, atomically.
--
-- Replaces create-family/page.tsx's three separate client statements (insert
-- profile, insert family, update own family_id), where a failure between the
-- second and third left an orphaned family row behind and the user in none.
-- `families` has no INSERT policy after this migration, so this function is the
-- only way to create one, which also means every family has an owner.
CREATE OR REPLACE FUNCTION public.create_family_with_owner(
  p_family_name text,
  p_user_name   text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_family_id uuid;
  v_current   uuid;
  v_exists    boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING errcode = '28000';
  END IF;

  IF COALESCE(btrim(p_family_name), '') = '' THEN
    RAISE EXCEPTION 'family name is required' USING errcode = '22023';
  END IF;

  SELECT true, family_id INTO v_exists, v_current
  FROM public.users WHERE id = v_uid;

  IF v_current IS NOT NULL THEN
    RAISE EXCEPTION 'already a member of a family' USING errcode = '23505';
  END IF;

  -- The profile row may not exist yet: login-form.tsx creates it right after
  -- signup, but create-family/page.tsx also handles the case where it does not
  -- (it sets needsProfile and asks for a name). Both paths land here.
  IF v_exists IS NOT TRUE THEN
    INSERT INTO public.users (id, name)
    VALUES (v_uid, COALESCE(NULLIF(btrim(p_user_name), ''), 'User'));
  ELSIF NULLIF(btrim(p_user_name), '') IS NOT NULL THEN
    UPDATE public.users SET name = btrim(p_user_name) WHERE id = v_uid;
  END IF;

  INSERT INTO public.families (name)
  VALUES (btrim(p_family_name))
  RETURNING id INTO v_family_id;

  UPDATE public.users SET family_id = v_family_id WHERE id = v_uid;

  RETURN v_family_id;
END;
$$;

-- Only `authenticated` may call these. `REVOKE FROM public` alone is NOT
-- enough: Supabase's ALTER DEFAULT PRIVILEGES grants EXECUTE to anon and
-- authenticated *explicitly* at creation time, and revoking from PUBLIC does
-- not touch an explicit grant. Verified — after 10_performance.sql, dump
-- section 14 still showed `current_family_id() | anon | EXECUTE` despite that
-- migration's REVOKE. So anon is revoked by name, here and in step 6.
REVOKE EXECUTE ON FUNCTION public.family_by_invite_code(text)            FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.join_family_by_invite_code(text)       FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.create_family_with_owner(text, text)   FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.family_by_invite_code(text)            TO authenticated;
GRANT  EXECUTE ON FUNCTION public.join_family_by_invite_code(text)       TO authenticated;
GRANT  EXECUTE ON FUNCTION public.create_family_with_owner(text, text)   TO authenticated;

COMMIT;
