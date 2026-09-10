-- READ-ONLY audit. Changes nothing. Run this against production FIRST.
--
-- Written as ONE statement so it works in the Supabase dashboard SQL editor,
-- which accepts plain SQL only (no psql backslash commands) and displays just
-- the final result set. Everything comes back in a single table, ordered by
-- section — sort or filter the `section` column to read it.
--
-- Why this audit exists: the checked-in migrations (01-09) define a `users`
-- SELECT policy that is self-referential —
--
--   family_id in (select family_id from users where id = auth.uid())
--
-- Reading `users` inside the policy *for* `users` re-enters that same policy,
-- and Postgres aborts with "infinite recursion detected in policy for relation
-- users". Applying 01-09 to a clean database produces one where no query
-- succeeds at all as the `authenticated` role. Since the live app works,
-- production must have been patched by hand outside these files. This shows
-- what is actually there, so the drift is known before anything is rewritten.
--
-- Section guide:
--   0. RLS ENABLED?           whether RLS is actually switched on, per table
--   1. live policy            every RLS policy currently on the app tables
--   2. unwrapped auth.uid()   policies paying per-row re-evaluation
--   3. function               helper functions (a prior hand-fix may have added one)
--   4. index                  existing indexes on the hot tables
--   5. table size             approximate row counts and on-disk size
--
-- Read section 0 FIRST. A policy listed in pg_policies is NOT necessarily being
-- enforced: `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` leaves every policy
-- listed and visible while enforcing none of them. That is a common panic fix
-- for the recursion error described above, and it silently makes the table
-- world-readable to anyone holding the anon key.

WITH rls_enabled AS (
  SELECT
    '0. RLS ENABLED?'  AS section,
    c.relname::text    AS object,
    CASE WHEN c.relrowsecurity
         THEN 'yes - enforced'
         ELSE '*** NO - POLICIES LISTED BUT NOT ENFORCED ***'
    END                AS name,
    (SELECT count(*)::text
       FROM pg_policies p
      WHERE p.schemaname = 'public'
        AND p.tablename  = c.relname) || ' policies defined' AS detail_a,
    CASE WHEN c.relforcerowsecurity THEN 'FORCE on (applies to owner too)' ELSE '' END AS detail_b,
    ''                 AS detail_c
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
),
live_policies AS (
  SELECT
    '1. live policy'                         AS section,
    tablename::text                          AS object,
    policyname::text                         AS name,
    cmd::text                                AS detail_a,
    COALESCE(qual, '(no USING clause)')      AS detail_b,
    COALESCE(with_check, '(no CHECK clause)') AS detail_c
  FROM pg_policies
  WHERE schemaname = 'public'
),
unwrapped AS (
  SELECT
    '2. unwrapped auth.uid()' AS section,
    tablename::text           AS object,
    policyname::text          AS name,
    cmd::text                 AS detail_a,
    're-evaluated per row; should be (select auth.uid())' AS detail_b,
    COALESCE(qual, '') || ' ' || COALESCE(with_check, '') AS detail_c
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (COALESCE(qual, '') || COALESCE(with_check, '')) ~* 'auth\.uid\(\)'
    AND (COALESCE(qual, '') || COALESCE(with_check, '')) !~* '\(\s*select\s+auth\.uid\(\)'
),
functions AS (
  SELECT
    '3. function'                                   AS section,
    n.nspname::text                                 AS object,
    p.proname::text                                 AS name,
    pg_get_function_identity_arguments(p.oid)       AS detail_a,
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS detail_b,
    CASE p.provolatile
      WHEN 'i' THEN 'IMMUTABLE'
      WHEN 's' THEN 'STABLE'
      WHEN 'v' THEN 'VOLATILE'
    END                                             AS detail_c
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
),
indexes AS (
  SELECT
    '4. index'        AS section,
    tablename::text   AS object,
    indexname::text   AS name,
    indexdef::text    AS detail_a,
    ''                AS detail_b,
    ''                AS detail_c
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('users', 'activities', 'picks', 'interest_cards',
                      'weekly_questions', 'question_answers')
),
sizes AS (
  SELECT
    '5. table size'                                       AS section,
    relname::text                                         AS object,
    n_live_tup::text || ' rows (approx)'                  AS name,
    pg_size_pretty(pg_total_relation_size(relid))          AS detail_a,
    ''                                                     AS detail_b,
    ''                                                     AS detail_c
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
)
SELECT * FROM rls_enabled
UNION ALL SELECT * FROM live_policies
UNION ALL SELECT * FROM unwrapped
UNION ALL SELECT * FROM functions
UNION ALL SELECT * FROM indexes
UNION ALL SELECT * FROM sizes
ORDER BY section, object, name;
