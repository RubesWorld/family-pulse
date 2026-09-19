-- ===========================================================================
-- dump_rls_migration_log.sql — recover the pre-migration-10 policy set
-- ===========================================================================
--
-- READ-ONLY. One SELECT. Companion to supabase/dump_prod_state.sql.
--
-- Run this ONLY if 10_performance.sql has already been applied to the database
-- you are dumping. If it has not, `rls_migration_log` does not exist and this
-- errors with `relation "rls_migration_log" does not exist` — which is itself a
-- useful answer, not a problem.
--
--   psql "<PROD_CONNECTION_STRING>" \
--     --no-psqlrc --tuples-only --no-align --quiet \
--     -f supabase/dump_rls_migration_log.sql > prod_rls_log.txt
--
-- Why it is worth running: migration 10 drops every policy it finds on the
-- managed tables and records each one — name, command, roles, permissive flag,
-- full USING and WITH CHECK, and whether RLS was even enabled — before
-- destroying it. If that migration ran against production, this table is the
-- ONLY surviving record of the hand-patched policy set, and it is exactly the
-- thing the repo is missing. It is also the input supabase/rollback_10.sql
-- needs, so do not drop the table until reconciliation is finished.
--
-- Read it alongside migration 10's own section 7 query, which reports each
-- logged policy as unchanged / replaced / REMOVED. Anything marked REMOVED was
-- a production-only rule that no longer exists.
--
-- `run` groups the rows by invocation: migration 10 is idempotent and may have
-- been applied more than once, and only the EARLIEST run saw the genuinely
-- original hand-made policies. Later runs recorded migration 10's own output.
-- ===========================================================================

SELECT
  to_char(l.ran_at, 'YYYY-MM-DD HH24:MI:SSOF')
    || ' | run=' || dense_rank() OVER (ORDER BY l.ran_at)
    || ' | ' || l.table_name
    || ' | ' || l.policy_name
    || ' | cmd=' || COALESCE(l.cmd, '(null)')
    || ' | ' || COALESCE(l.permissive, '(null)')
    || ' | roles=' || COALESCE(l.roles::text, '{}')
    || ' | rls_was_enabled=' || COALESCE(l.rls_was_enabled::text, '(null)')
    || ' | using=' || COALESCE(regexp_replace(l.using_expr, '\s+', ' ', 'g'), '(none)')
    || ' | check=' || COALESCE(regexp_replace(l.check_expr, '\s+', ' ', 'g'), '(none)')
    AS line
FROM rls_migration_log l
ORDER BY l.ran_at, l.table_name COLLATE "C", l.policy_name COLLATE "C";
