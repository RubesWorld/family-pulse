-- Emergency rollback for 11_rls_rpcs.sql.
--
-- Drops the three RPCs that 11 adds. There is almost never a reason to run
-- this: 11 is purely additive, and dropping these while a deployed client
-- still calls them turns joining and family creation into a hard error.
--
-- Order matters if you are rolling back the whole change: run
-- rollback_12.sql FIRST. 12's `users` UPDATE policy refuses a direct
-- family_id write, so with 12 still applied and these functions gone there is
-- no way to join a family at all.
--
-- Safe order:  rollback_12.sql  ->  redeploy the pre-RPC client  ->  this file.

BEGIN;

DROP FUNCTION IF EXISTS public.create_family_with_owner(text, text);
DROP FUNCTION IF EXISTS public.join_family_by_invite_code(text);
DROP FUNCTION IF EXISTS public.family_by_invite_code(text);

COMMIT;
