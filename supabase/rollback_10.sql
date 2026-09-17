-- Emergency rollback for 10_performance.sql.
--
-- Restores the exact policy set that existed before that migration ran, using
-- the definitions it recorded in rls_migration_log -- including each policy's
-- command and roles, which is why it can rebuild them rather than just describe
-- them. Also restores each table's original RLS on/off state.
--
-- Run this only if the app misbehaves after migration 10. The likely symptom is
-- pages rendering empty: that means the new policies are denying rows the app
-- expects, not that data was lost. Nothing in migration 10 touches table data.
--
-- Single statement blocks throughout, so it runs in the Supabase dashboard SQL
-- editor. Safe to re-run: it drops whatever is present before recreating.
--
-- NOTE: this deliberately restores the PREVIOUS state, including its problems.
-- If a table had RLS switched off before, it will be switched off again, and
-- that table becomes readable by anyone with the anon key. This is a
-- get-the-app-working-again lever, not a good resting place.

BEGIN;

DO $$
DECLARE
  r        record;
  latest   timestamptz;
  n_pol    int := 0;
  n_rls    int := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rls_migration_log'
  ) THEN
    RAISE EXCEPTION
      'rls_migration_log does not exist -- migration 10 never ran here, nothing to roll back';
  END IF;

  -- Roll back only the most recent run of the migration.
  SELECT max(ran_at) INTO latest FROM rls_migration_log;
  IF latest IS NULL THEN
    RAISE EXCEPTION 'rls_migration_log is empty -- nothing to roll back';
  END IF;

  RAISE NOTICE 'restoring the policy set captured at %', latest;

  -- Clear whatever migration 10 installed on the affected tables.
  FOR r IN
    SELECT DISTINCT table_name FROM rls_migration_log WHERE ran_at = latest
  LOOP
    DECLARE
      p record;
    BEGIN
      FOR p IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = r.table_name
      LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, r.table_name);
      END LOOP;
    END;
  END LOOP;

  -- Recreate the originals.
  FOR r IN
    SELECT * FROM rls_migration_log WHERE ran_at = latest
    ORDER BY table_name, policy_name
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s %s %s',
      r.policy_name,
      r.table_name,
      COALESCE(NULLIF(r.permissive, ''), 'PERMISSIVE'),
      CASE upper(COALESCE(r.cmd, 'ALL'))
        WHEN 'SELECT' THEN 'SELECT'
        WHEN 'INSERT' THEN 'INSERT'
        WHEN 'UPDATE' THEN 'UPDATE'
        WHEN 'DELETE' THEN 'DELETE'
        ELSE 'ALL'
      END,
      -- roles came out of pg_policies as a text[]; {public} means TO public.
      CASE
        WHEN r.roles IS NULL OR array_length(r.roles, 1) IS NULL THEN 'public'
        ELSE (SELECT string_agg(quote_ident(x), ', ') FROM unnest(r.roles) AS x)
      END,
      CASE WHEN r.using_expr IS NOT NULL THEN 'USING (' || r.using_expr || ')' ELSE '' END,
      CASE WHEN r.check_expr IS NOT NULL THEN 'WITH CHECK (' || r.check_expr || ')' ELSE '' END
    );
    n_pol := n_pol + 1;
    RAISE NOTICE 'restored %.%', r.table_name, r.policy_name;
  END LOOP;

  -- Restore each table's original RLS on/off state.
  FOR r IN
    SELECT DISTINCT table_name, bool_or(rls_was_enabled) AS was_on
    FROM rls_migration_log
    WHERE ran_at = latest
    GROUP BY table_name
  LOOP
    IF r.was_on IS FALSE THEN
      EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.table_name);
      RAISE WARNING
        'RLS left DISABLED on %, matching its pre-migration state -- that table is readable by anyone with the anon key',
        r.table_name;
      n_rls := n_rls + 1;
    ELSE
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.table_name);
    END IF;
  END LOOP;

  RAISE NOTICE 'rollback complete: % policies restored, % tables returned to RLS-disabled', n_pol, n_rls;
END $$;

COMMIT;

-- The helper functions migration 10 added are left in place: nothing references
-- them once the old policies are back, they are harmless, and keeping them means
-- re-running migration 10 later does not have to recreate them. To remove:
--   DROP FUNCTION IF EXISTS public.current_family_member_ids();
--   DROP FUNCTION IF EXISTS public.current_family_id();
-- The indexes are likewise left alone -- they only make queries faster and are
-- not part of the policy change.

-- What the restored state looks like.
SELECT
  c.relname                                   AS table_name,
  c.relrowsecurity                            AS rls_enabled,
  (SELECT count(*) FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (SELECT DISTINCT table_name FROM rls_migration_log)
ORDER BY c.relname;
