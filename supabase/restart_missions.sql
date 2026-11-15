-- NOVACARE — restart every active mission on day 1 (today).
-- Run in the Supabase SQL editor AFTER supabase/setup.sql. Nothing is deleted here: each crew
-- member's app archives what was recorded before (Settings → Raw data still exports it), starts the
-- mission again on day 1, and puts the mission loadout in the ship inventory.
-- Running it again on a later day restarts the missions again from that day.
insert into public.mission_epochs (code, started_at)
select code, now() from (
  select code from public.mission_directory
  union select code from public.mission_members
  union select crew_code from public.crew_status where crew_code is not null and crew_code <> ''
  union select 'NOVA-1'
) m
on conflict (code) do update set started_at = excluded.started_at;

select code, started_at from public.mission_epochs order by code;
