-- Which migrations are already applied to this database?
--
-- Paste this whole file into the Supabase SQL Editor and run it. Every row
-- comes back with present = true or false. Apply the migrations in
-- supabase/migrations/ in numeric order, starting from the first step that
-- shows any false.
--
-- This only reads information_schema. It changes nothing.

with expected(step, migration, kind, obj) as (
  values
    ('01', '01_schema.sql',                   'table',  'families'),
    ('01', '01_schema.sql',                   'table',  'users'),
    ('01', '01_schema.sql',                   'table',  'activities'),
    ('02', '02_picks_and_interest_cards.sql', 'table',  'interest_cards'),
    ('02', '02_picks_and_interest_cards.sql', 'table',  'picks'),
    ('03', '03_profile_bio.sql',              'column', 'users.bio'),
    ('03', '03_profile_bio.sql',              'column', 'users.location'),
    ('03', '03_profile_bio.sql',              'column', 'users.occupation'),
    ('03', '03_profile_bio.sql',              'column', 'users.birthday'),
    ('04', '04_phone_number.sql',             'column', 'users.phone_number'),
    ('05', '05_interest_card_tags.sql',       'column', 'interest_cards.tags'),
    ('06', '06_picks_history.sql',            'column', 'picks.is_current'),
    ('06', '06_picks_history.sql',            'column', 'picks.archived_at'),
    ('07', '07_connect.sql',                  'table',  'weekly_questions'),
    ('07', '07_connect.sql',                  'table',  'question_answers'),
    ('07', '07_connect.sql',                  'table',  'preset_questions'),
    ('08', '08_connect_status.sql',           'column', 'weekly_questions.status'),
    ('08', '08_connect_status.sql',           'column', 'weekly_questions.suggested_question_text'),
    ('09', '09_notifications.sql',            'table',  'notification_preferences'),
    ('09', '09_notifications.sql',            'table',  'push_subscriptions'),
    ('09', '09_notifications.sql',            'table',  'notification_log')
)
select
  e.step,
  e.migration,
  e.kind,
  e.obj,
  case
    when e.kind = 'table' then exists (
      select 1 from information_schema.tables t
      where t.table_schema = 'public' and t.table_name = e.obj
    )
    else exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name  = split_part(e.obj, '.', 1)
        and c.column_name = split_part(e.obj, '.', 2)
    )
  end as present
from expected e
order by e.step, e.obj;


-- Second check: confirm Row Level Security is still enabled everywhere.
-- Every application table should report rls_enabled = true.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;
