-- NOVACARE — remove one person from every mission, leaving everyone else as they are.
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- STEP 1 (look first, deletes nothing): run only this query. It lists every account named
-- Ramiro Aguilar, with its email and missions. Check they are all his (for example, an account
-- he created twice).
select p.id, p.name, p.email, p.role, p.created_at,
       (select string_agg(m.code, ', ') from public.mission_members m where m.user_id = p.id) as missions
from public.profiles p
where p.name ilike '%ramiro%aguilar%'
order by p.created_at;

-- STEP 2 (deletes, cannot be undone): run everything below.
-- It removes EVERY account that STEP 1 listed. If one of them is someone else, keep only the
-- email(s) to delete in the line marked "ONLY THESE EMAILS" and remove the -- at its start.
begin;

create temp table target on commit drop as
  select id from public.profiles
  where name ilike '%ramiro%aguilar%'
  -- and email in ('first@example.com', 'second@example.com')   -- ONLY THESE EMAILS
  ;

do $$
declare n int := (select count(*) from target);
begin
  if n = 0 then raise exception 'No Ramiro Aguilar found. Nothing was deleted.'; end if;
  if n > 3 then raise exception 'Found % accounts — too many, check STEP 1. Nothing was deleted.', n; end if;
  raise notice 'Removing % account(s) named Ramiro Aguilar from every mission.', n;
end $$;

-- his status card in every crew (what crewmates and guests see)
delete from public.crew_status where user_id in (select id from target);
-- his membership in every mission
delete from public.mission_members where user_id in (select id from target);
-- emergencies and help requests he sent or that were about him
delete from public.alerts
  where from_user in (select id from target)
     or about_id in (select id::text from target);
-- his own health record (readings, follow-ups, medical profile)
delete from public.missions where user_id in (select id from target);
-- he no longer has a mission open
update public.profiles set crew_code = null where id in (select id from target);

commit;

-- Missions he created stay, with their other crew members; only he leaves them.
-- His accounts still exist. If he signs in again on a device that still has his data, the app can
-- upload it again. To remove him for good, also delete the accounts: Authentication → Users →
-- find each email → Delete user (this removes the profile too).
