-- ===========================================================================
-- dump_prod_state.sql — capture the AUTHORITATIVE security state of a database
-- ===========================================================================
--
-- READ-ONLY. One SELECT statement. It reads pg_catalog only and writes nothing,
-- not even a temp table.
--
-- Why this exists: supabase/migrations/01-10 do not describe production.
-- Production's RLS was hand-patched in the Supabase dashboard and never
-- committed, so nobody can reconstruct it from this repo. This script captures
-- what is actually there, in a form that diffs cleanly against the same script
-- run on a database built from the committed migrations. See
-- supabase/RLS_RECONCILIATION.md for the runbook.
--
-- ---------------------------------------------------------------------------
-- HOW TO RUN IT
-- ---------------------------------------------------------------------------
--
-- Preferred (psql). The flags are what make the output diffable — one bare
-- line per fact, no headers, no row counts, no padding:
--
--   psql "<PROD_CONNECTION_STRING>" \
--     --no-psqlrc --tuples-only --no-align --quiet \
--     -v ON_ERROR_STOP=1 \
--     -f supabase/dump_prod_state.sql > prod_state.txt
--
-- Get <PROD_CONNECTION_STRING> from the Supabase dashboard under
-- Project Settings -> Database -> Connection string -> URI, and pass it on the
-- command line only. NEVER paste it into a file in this repo: the repo is
-- public and credentials have been committed to it before.
--
-- Fallback (Supabase dashboard SQL Editor) if you cannot reach the database
-- directly: paste this whole file in and run it. It is deliberately a single
-- statement with a single text column so the editor shows all of it. Export as
-- CSV, then strip the header row and the quoting before diffing.
--
-- ---------------------------------------------------------------------------
-- WHAT IT COVERS
-- ---------------------------------------------------------------------------
--
--   00 server        Postgres version. Expect this line to differ; see below.
--   01 schema-acl    USAGE/CREATE on each schema. If `anon` has no USAGE on
--                    public, nothing in public is reachable with the anon key.
--   02 role          anon / authenticated / service_role / authenticator and
--                    friends, with BYPASSRLS and SUPERUSER. A role with
--                    BYPASSRLS ignores every policy in this file.
--   03 role-member   Role grants between them. Membership inherits privileges.
--   04 default-acl   ALTER DEFAULT PRIVILEGES. This is why a brand-new table in
--                    public is already readable by anon on Supabase, and it
--                    applies to any reconciliation migration you write later.
--   05 table-rls     Per table: owner, RLS enabled, RLS FORCEd. A policy listed
--                    in section 11 is NOT enforced unless RLS is enabled here.
--   06 table-grant   Table privileges per grantee. RLS filters rows; grants
--                    decide whether the role may touch the table at all.
--   07 column        Full column list with types, nullability, defaults. Needed
--                    because the app queries `select('*')`, which silently
--                    returns nothing for a column that does not exist — schema
--                    drift in either direction is invisible at runtime.
--   08 column-grant  Column-level privileges, if any were ever granted.
--   09 constraint    Every constraint definition (PK/FK/UNIQUE/CHECK).
--   10 index         Every index definition, including partial unique indexes,
--                    which carry real invariants (one current pick per
--                    category, one current answer per question).
--   11 policy        Every RLS policy with its FULL USING and WITH CHECK
--                    expressions, command, permissive/restrictive, and roles.
--                    This is the payload. Covers every non-system schema, not
--                    just public, because a hand-patch could be anywhere.
--   12 trigger       Non-internal triggers with definitions.
--   13 function      Functions in public: signature, return type, volatility,
--                    SECURITY DEFINER/INVOKER, pinned search_path, owner, and
--                    the normalized body. A SECURITY DEFINER function is an
--                    intentional RLS bypass, so its body is security-critical.
--                    Also counts SECURITY DEFINER functions outside public.
--   14 function-grant EXECUTE per role. A SECURITY DEFINER function executable
--                    by `anon` is a privilege escalation path.
--   15 view          Views and matviews in public, with owner and reloptions.
--                    A view owned by a privileged role reads its base tables
--                    with the OWNER's rights, bypassing their RLS, unless
--                    security_invoker=true (Postgres 15+). Classic hole.
--   16 publication   Realtime publication membership. If the native client
--                    subscribes to changes, this decides what gets streamed,
--                    and Realtime only applies RLS when RLS is enabled.
--   17 sequence-grant Sequence privileges (an ungranted sequence breaks
--                    inserts; an over-granted one leaks little but is drift).
--
-- Intentionally NOT covered: row counts and table sizes. They change on their
-- own and would be pure diff noise. Storage buckets are also out, because this
-- app makes no Supabase Storage calls — add a section if that changes. Any
-- policy on storage.objects still shows up in section 11.
--
-- ---------------------------------------------------------------------------
-- READING THE DIFF
-- ---------------------------------------------------------------------------
--
-- Expression text comes from Postgres' deparser, so it is normalized by the
-- server, not by you: `auth.uid()` may come back as `auth.uid()` and a
-- subquery as `( SELECT auth.uid() AS uid)`. This script collapses runs of
-- whitespace so formatting alone never shows up as a difference, but it does
-- NOT rewrite expressions any further — a difference in casts or aliases is
-- reported rather than hidden, because that is exactly the kind of thing worth
-- looking at.
--
-- Two consequences:
--   * If prod and the local rebuild are on different Postgres major versions,
--     expect a handful of deparse-only differences. The `00 server` line tells
--     you when to suspect that.
--   * In `--mode docker` (see scripts/rls_local_state.sh) the local database is
--     a plain Postgres with a hand-written Supabase shim, so sections 01-04 and
--     any non-public schema in section 11 will differ wholesale. Only sections
--     05, 07, 09, 10, 11 (public), 12 and 13 are meaningful in that mode.
--
-- ===========================================================================

WITH
-- 00 -----------------------------------------------------------------------
server AS (
  SELECT '00 server | postgres ' || current_setting('server_version') AS line
),

-- 01 -----------------------------------------------------------------------
schema_acl AS (
  SELECT
    '01 schema-acl | ' || n.nspname
      || ' | owner=' || pg_get_userbyid(n.nspowner)
      || ' | ' || (CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)
      || ' | ' || a.privilege_type AS line
  FROM pg_namespace n
  CROSS JOIN LATERAL aclexplode(COALESCE(n.nspacl, acldefault('n', n.nspowner))) a
  WHERE n.nspname NOT LIKE 'pg\_%'
    AND n.nspname <> 'information_schema'
),

-- 02 -----------------------------------------------------------------------
-- Every non-system role. `rolbypassrls = true` means that role ignores RLS
-- entirely, which makes every policy below irrelevant for it.
roles AS (
  SELECT
    '02 role | ' || r.rolname
      || ' | super=' || r.rolsuper
      || ' | bypassrls=' || r.rolbypassrls
      || ' | canlogin=' || r.rolcanlogin
      || ' | inherit=' || r.rolinherit
      || ' | createrole=' || r.rolcreaterole AS line
  FROM pg_roles r
  WHERE r.rolname NOT LIKE 'pg\_%'
),

-- 03 -----------------------------------------------------------------------
role_members AS (
  SELECT
    '03 role-member | ' || pg_get_userbyid(m.member)
      || ' | is member of | ' || pg_get_userbyid(m.roleid)
      || ' | admin_option=' || m.admin_option AS line
  FROM pg_auth_members m
  WHERE pg_get_userbyid(m.roleid)  NOT LIKE 'pg\_%'
    AND pg_get_userbyid(m.member)  NOT LIKE 'pg\_%'
),

-- 04 -----------------------------------------------------------------------
-- ALTER DEFAULT PRIVILEGES. Governs what a table created by a future
-- reconciliation migration is automatically granted, which is easy to forget
-- and is how a new table ends up anon-readable without anyone asking for it.
default_acl AS (
  SELECT
    '04 default-acl | grantor=' || pg_get_userbyid(d.defaclrole)
      || ' | schema=' || COALESCE(dn.nspname, '(all)')
      || ' | objtype=' || d.defaclobjtype::text
      || ' | ' || (CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)
      || ' | ' || a.privilege_type AS line
  FROM pg_default_acl d
  LEFT JOIN pg_namespace dn ON dn.oid = d.defaclnamespace
  CROSS JOIN LATERAL aclexplode(d.defaclacl) a
),

-- 05 -----------------------------------------------------------------------
-- The most important three facts about each table. `rls_enabled=false` with
-- policies present in section 11 is the silent failure mode: the dashboard
-- keeps listing the policies and none of them are enforced.
table_rls AS (
  SELECT
    '05 table-rls | ' || c.relname
      || ' | owner=' || pg_get_userbyid(c.relowner)
      || ' | rls_enabled=' || c.relrowsecurity
      || ' | rls_forced=' || c.relforcerowsecurity
      || ' | policies=' || (
           SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid
         ) AS line
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p')
),

-- 06 -----------------------------------------------------------------------
-- COALESCE to acldefault() so a table whose ACL was never touched reports its
-- implicit owner-only grants explicitly, instead of vanishing from the dump.
table_grant AS (
  SELECT
    '06 table-grant | ' || c.relname
      || ' | ' || (CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)
      || ' | ' || a.privilege_type AS line
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p', 'v', 'm')
),

-- 07 -----------------------------------------------------------------------
-- The app reads with select('*'), so a column that exists in one database and
-- not the other produces no error anywhere — just a silently undefined field.
-- `users.interests` is read by src/app/(app)/profile/page.tsx and declared in
-- src/types/database.ts, yet no migration creates it. This section settles
-- whether production has it.
columns AS (
  SELECT
    '07 column | ' || c.relname
      || ' | ' || lpad(att.attnum::text, 3, '0')
      || ' | ' || att.attname
      || ' | ' || format_type(att.atttypid, att.atttypmod)
      || ' | notnull=' || att.attnotnull
      || ' | default=' || COALESCE(
           regexp_replace(pg_get_expr(ad.adbin, ad.adrelid), '\s+', ' ', 'g'),
           '(none)'
         )
      || ' | identity=' || COALESCE(NULLIF(att.attidentity::text, ''), '-')
      || ' | generated=' || COALESCE(NULLIF(att.attgenerated::text, ''), '-') AS line
  FROM pg_attribute att
  JOIN pg_class c ON c.oid = att.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_attrdef ad ON ad.adrelid = att.attrelid AND ad.adnum = att.attnum
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p', 'v', 'm')
    AND att.attnum > 0
    AND NOT att.attisdropped
),

-- 08 -----------------------------------------------------------------------
column_grant AS (
  SELECT
    '08 column-grant | ' || c.relname
      || ' | ' || att.attname
      || ' | ' || (CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)
      || ' | ' || a.privilege_type AS line
  FROM pg_attribute att
  JOIN pg_class c ON c.oid = att.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL aclexplode(att.attacl) a
  WHERE n.nspname = 'public'
    AND att.attnum > 0
    AND NOT att.attisdropped
    AND att.attacl IS NOT NULL
),

-- 09 -----------------------------------------------------------------------
constraints AS (
  SELECT
    '09 constraint | ' || c.relname
      || ' | ' || con.conname
      || ' | ' || con.contype::text
      || ' | ' || regexp_replace(pg_get_constraintdef(con.oid), '\s+', ' ', 'g') AS line
  FROM pg_constraint con
  JOIN pg_class c ON c.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
),

-- 10 -----------------------------------------------------------------------
indexes AS (
  SELECT
    '10 index | ' || i.tablename
      || ' | ' || i.indexname
      || ' | ' || regexp_replace(i.indexdef, '\s+', ' ', 'g') AS line
  FROM pg_indexes i
  WHERE i.schemaname = 'public'
),

-- 11 -----------------------------------------------------------------------
-- THE PAYLOAD. Full USING and WITH CHECK text, verbatim apart from whitespace
-- collapsing. `roles={public}` means the policy also applies to `anon` — the
-- key that ships in the client bundle.
--
-- Not restricted to `public`: production was hand-patched, and a policy could
-- have been added anywhere.
policies AS (
  SELECT
    '11 policy | ' || pol.schemaname || '.' || pol.tablename
      || ' | ' || pol.policyname
      || ' | cmd=' || pol.cmd
      || ' | ' || pol.permissive
      || ' | roles=' || COALESCE(pol.roles::text, '{}')
      || ' | using=' || COALESCE(regexp_replace(pol.qual, '\s+', ' ', 'g'), '(none)')
      || ' | check=' || COALESCE(regexp_replace(pol.with_check, '\s+', ' ', 'g'), '(none)') AS line
  FROM pg_policies pol
  WHERE pol.schemaname NOT LIKE 'pg\_%'
    AND pol.schemaname <> 'information_schema'
),

-- 12 -----------------------------------------------------------------------
-- tgisinternal excludes the triggers Postgres creates to implement foreign
-- keys and deferred constraints, which are already covered by section 09.
triggers AS (
  SELECT
    '12 trigger | ' || c.relname
      || ' | ' || t.tgname
      || ' | enabled=' || t.tgenabled::text
      || ' | ' || regexp_replace(pg_get_triggerdef(t.oid), '\s+', ' ', 'g') AS line
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND NOT t.tgisinternal
),

-- 13 -----------------------------------------------------------------------
-- Body included, whitespace-collapsed. For a SECURITY DEFINER function the
-- body IS the security boundary, so "a function by that name exists" is not
-- enough to conclude anything.
functions AS (
  SELECT
    '13 function | ' || p.proname
      || '(' || pg_get_function_identity_arguments(p.oid) || ')'
      || ' | returns=' || pg_get_function_result(p.oid)
      || ' | lang=' || l.lanname
      || ' | ' || (CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END)
      || ' | volatility=' || (CASE p.provolatile
                                WHEN 'i' THEN 'IMMUTABLE'
                                WHEN 's' THEN 'STABLE'
                                ELSE 'VOLATILE' END)
      || ' | leakproof=' || p.proleakproof
      || ' | owner=' || pg_get_userbyid(p.proowner)
      || ' | config=' || COALESCE(p.proconfig::text, '(none)')
      || ' | body=' || regexp_replace(COALESCE(p.prosrc, ''), '\s+', ' ', 'g') AS line
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l ON l.oid = p.prolang
  WHERE n.nspname = 'public'
),

-- Supabase ships plenty of SECURITY DEFINER functions in auth/storage/etc.
-- Listing them all would bury the signal, so this reports only a per-schema
-- count. A number that moves is worth a look; the bodies are not.
secdef_elsewhere AS (
  SELECT
    '13 function-secdef-outside-public | ' || n.nspname
      || ' | count=' || count(*) AS line
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prosecdef
    AND n.nspname NOT IN ('public', 'pg_catalog', 'information_schema')
    AND n.nspname NOT LIKE 'pg\_%'
  GROUP BY n.nspname
),

-- 14 -----------------------------------------------------------------------
-- EXECUTE on a SECURITY DEFINER function is a grant of the definer's rights.
-- `PUBLIC` here includes anon; migration 10 revokes PUBLIC and grants only
-- `authenticated` for exactly that reason.
function_grant AS (
  SELECT
    '14 function-grant | ' || p.proname
      || '(' || pg_get_function_identity_arguments(p.oid) || ')'
      || ' | ' || (CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)
      || ' | ' || a.privilege_type AS line
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
  WHERE n.nspname = 'public'
),

-- 15 -----------------------------------------------------------------------
-- A view runs its query with the rights of the view's OWNER, not the caller,
-- so a view over an RLS-protected table hands out everything the owner can see
-- unless reloptions contains security_invoker=true. If anything shows up here,
-- check that option before trusting section 11.
views AS (
  SELECT
    '15 view | ' || c.relname
      || ' | kind=' || c.relkind::text
      || ' | owner=' || pg_get_userbyid(c.relowner)
      || ' | reloptions=' || COALESCE(c.reloptions::text, '(none)')
      || ' | definition=' || regexp_replace(
           COALESCE(pg_get_viewdef(c.oid, true), ''), '\s+', ' ', 'g'
         ) AS line
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('v', 'm')
),

-- 16 -----------------------------------------------------------------------
-- What Realtime is allowed to stream. Relevant the moment the native client
-- opens a subscription instead of polling.
publications AS (
  SELECT
    '16 publication | ' || p.pubname
      || ' | allrows=' || p.puballtables
      || ' | insert=' || p.pubinsert
      || ' | update=' || p.pubupdate
      || ' | delete=' || p.pubdelete
      || ' | truncate=' || p.pubtruncate AS line
  FROM pg_publication p
),
publication_tables AS (
  SELECT
    '16 publication-table | ' || pt.pubname
      || ' | ' || pt.schemaname || '.' || pt.tablename AS line
  FROM pg_publication_tables pt
),

-- 17 -----------------------------------------------------------------------
sequence_grant AS (
  SELECT
    '17 sequence-grant | ' || c.relname
      || ' | ' || (CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)
      || ' | ' || a.privilege_type AS line
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('S', c.relowner))) a
  WHERE n.nspname = 'public'
    AND c.relkind = 'S'
)

SELECT line FROM (
            SELECT line FROM server
  UNION ALL SELECT line FROM schema_acl
  UNION ALL SELECT line FROM roles
  UNION ALL SELECT line FROM role_members
  UNION ALL SELECT line FROM default_acl
  UNION ALL SELECT line FROM table_rls
  UNION ALL SELECT line FROM table_grant
  UNION ALL SELECT line FROM columns
  UNION ALL SELECT line FROM column_grant
  UNION ALL SELECT line FROM constraints
  UNION ALL SELECT line FROM indexes
  UNION ALL SELECT line FROM policies
  UNION ALL SELECT line FROM triggers
  UNION ALL SELECT line FROM functions
  UNION ALL SELECT line FROM secdef_elsewhere
  UNION ALL SELECT line FROM function_grant
  UNION ALL SELECT line FROM views
  UNION ALL SELECT line FROM publications
  UNION ALL SELECT line FROM publication_tables
  UNION ALL SELECT line FROM sequence_grant
) all_lines
-- Sorted with an explicit, locale-independent collation. Without this the
-- server's lc_collate decides the order, and prod and local can disagree on
-- where `_` and `.` sort, which scrambles the diff for no reason.
ORDER BY line COLLATE "C";
