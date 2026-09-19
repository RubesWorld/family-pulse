-- ===========================================================================
-- supabase_shim.sql — the minimum Supabase-shaped scaffolding the committed
-- migrations need in order to apply to a plain Postgres.
-- ===========================================================================
--
-- Used only by `scripts/rls_local_state.sh --mode docker`. In `--mode cli` the
-- real Supabase local stack provides all of this properly and this file is not
-- touched.
--
-- What the migrations depend on that plain Postgres does not have:
--   * the `auth` schema and `auth.users`, referenced by users.id's FK (01)
--   * `auth.uid()`, used by every policy in 01-10
--   * the `anon` / `authenticated` / `service_role` roles, which 10 grants to
--   * schema and default privileges that make tables in `public` reachable by
--     those roles at all
--
-- ---------------------------------------------------------------------------
-- WHAT THIS IS NOT
-- ---------------------------------------------------------------------------
-- An approximation, deliberately. It reproduces the *shape* of Supabase's
-- setup, not its exact grants: the real platform also creates supabase_admin,
-- supabase_auth_admin, supabase_storage_admin, authenticator, dashboard_user,
-- pgsodium and realtime roles, a large auth schema, and its own set of default
-- privileges. Sections 01-04 of supabase/dump_prod_state.sql (schema ACLs,
-- roles, role memberships, default privileges) are therefore MEANINGLESS in
-- docker mode and will differ from production wholesale.
--
-- Sections that ARE trustworthy in docker mode: 05 table-rls, 07 column,
-- 09 constraint, 10 index, 11 policy (public only), 12 trigger, 13 function.
-- That is enough to answer "do the committed policies match production's?",
-- which is the question. For grants, use --mode cli.
-- ===========================================================================

-- --- roles -----------------------------------------------------------------
-- NOLOGIN: nothing connects as these here. On Supabase, PostgREST connects as
-- `authenticator` and SET ROLEs to one of these per request based on the JWT.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    -- BYPASSRLS is the whole point of the service role, and it is why
    -- src/lib/supabase/admin.ts can write notification_log with no policy
    -- granting INSERT to anyone.
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD 'postgres';
    GRANT anon, authenticated, service_role TO authenticator;
  END IF;
END $$;

-- --- auth schema -----------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- Only the columns the app's schema actually references. `users.id` in
-- 01_schema.sql has `references auth.users(id) on delete cascade`, so this
-- table has to exist with a PK on id before migration 01 can apply.
CREATE TABLE IF NOT EXISTS auth.users (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- --- auth helpers ----------------------------------------------------------
-- Reads the request's JWT claims out of a GUC, exactly as the real ones do.
-- Behaviour that matters for testing policies: with no GUC set, auth.uid()
-- returns NULL, which is the anonymous case. To act as a user in psql:
--
--   SET ROLE authenticated;
--   SET request.jwt.claims = '{"sub":"<some-uuid>","role":"authenticated"}';
--   SELECT * FROM users;          -- now subject to RLS as that user
--   RESET ROLE; RESET request.jwt.claims;
--
-- That is the fastest way to prove a policy actually denies what you think it
-- denies, which is the only test that counts before shipping a direct client.
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb,
    '{}'::jsonb
  )
$$;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() ->> 'sub', '')::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() ->> 'role', '')
$$;

CREATE OR REPLACE FUNCTION auth.email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() ->> 'email', '')
$$;

GRANT EXECUTE ON FUNCTION auth.jwt(), auth.uid(), auth.role(), auth.email()
  TO anon, authenticated, service_role;

-- --- public schema access --------------------------------------------------
-- Mirrors the shape of what Supabase sets up for a new project: the API roles
-- can see `public`, and tables created there are automatically granted to them.
-- This is why RLS is load-bearing rather than optional on Supabase — without a
-- policy, the GRANT alone would expose the table.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
