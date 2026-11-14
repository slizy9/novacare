-- NOVACARE — run this BEFORE setup.sql if setup.sql fails with
--   "operator does not exist: uuid = bigint"
-- That error means the project already has tables called profiles, missions,
-- crew_status, alerts or inventory from something else, with different columns.
-- This script deletes nothing: it renames each conflicting table to <name>_old
-- so setup.sql can create the NOVACARE versions. Safe to re-run.

do $$
declare
  t   record;
begin
  for t in
    select * from (values
      ('profiles',    'crew_code'),
      ('missions',    'user_id'),
      ('crew_status', 'user_id'),
      ('alerts',      'crew_code'),
      ('inventory',   'crew_code')
    ) as v(tbl, needed_col)
  loop
    if to_regclass('public.' || t.tbl) is not null
       and not exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = t.tbl and column_name = t.needed_col)
       -- profiles.crew_code is added by setup.sql, so also check its id type
       or (t.tbl = 'profiles' and exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'profiles'
           and column_name = 'id' and data_type <> 'uuid'))
    then
      if to_regclass('public.' || t.tbl || '_old') is not null then
        raise exception 'public.%_old already exists; rename or drop it first', t.tbl;
      end if;
      execute format('alter table public.%I rename to %I', t.tbl, t.tbl || '_old');
      raise notice 'renamed public.% to public.%_old', t.tbl, t.tbl;
    end if;
  end loop;
end $$;
