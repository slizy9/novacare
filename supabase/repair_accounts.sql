-- NOVACARE — repair accounts and reset the alert log.
-- Run in Supabase: SQL Editor → New query → paste → Run. Safe to run more than once.

-- 1) Let each person recreate their own profile row (the app does it on sign-in).
drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- 2) Bring back any profile row that was deleted by hand, for every account that still exists
--    in Authentication → Users. Those people can sign in again right away.
insert into public.profiles (id, name, email, crew_code, role)
select u.id,
       coalesce(nullif(u.raw_user_meta_data ->> 'name', ''), split_part(u.email, '@', 1)),
       u.email,
       nullif(u.raw_user_meta_data ->> 'crew', ''),
       coalesce(nullif(u.raw_user_meta_data ->> 'role', ''), 'Flight Engineer')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- 3) Reset the log: remove every emergency and help request recorded so far.
delete from public.alerts;

-- To free an email completely so that person can register from zero, delete the account in
-- Authentication → Users (not only in the profiles table). Their data is removed with it.
