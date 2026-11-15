-- NOVACARE — database setup for Supabase.
-- Run in your project: SQL Editor → New query → paste → Run.
-- Safe to re-run: it creates what is missing and updates the rules.

-- 1) Registered crew members (filled automatically on every sign-up).
--    Passwords are NOT here: Supabase Auth stores them hashed in auth.users.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text,
  email      text,
  crew_code  text,
  created_at timestamptz not null default now()
);
-- crew_code = the mission the person has open right now (empty until they create or join one).
alter table public.profiles add column if not exists crew_code text;
alter table public.profiles alter column crew_code drop not null;
alter table public.profiles alter column crew_code drop default;
-- The crew role is chosen once at sign-up and cannot be changed afterwards.
alter table public.profiles add column if not exists role text;
update public.profiles p set role = coalesce(nullif(u.raw_user_meta_data ->> 'role', ''), 'Flight Engineer')
  from auth.users u where u.id = p.id and p.role is null;
alter table public.profiles enable row level security;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, crew_code, role)
  values (new.id, new.raw_user_meta_data ->> 'name', new.email,
          nullif(new.raw_user_meta_data ->> 'crew', ''),
          coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'Flight Engineer'))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2) Each crew member's mission data (readings, routine, settings) as one JSON document.
create table if not exists public.missions (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.missions enable row level security;
drop policy if exists "read own mission" on public.missions;
create policy "read own mission" on public.missions for select using (auth.uid() = user_id);
drop policy if exists "insert own mission" on public.missions;
create policy "insert own mission" on public.missions for insert with check (auth.uid() = user_id);
drop policy if exists "update own mission" on public.missions;
create policy "update own mission" on public.missions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) Missions and who is on them.
--    mission_directory: every mission people create, visible to everyone (also guests),
--    so anyone can find a mission and join it.
create table if not exists public.mission_directory (
  code          text primary key,
  name          text not null,
  env           text not null default 'iss',
  mission_days  int not null default 180,
  created_by    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  creator_name  text,
  created_at    timestamptz not null default now()
);
alter table public.mission_directory enable row level security;
drop policy if exists "anyone can see missions" on public.mission_directory;
create policy "anyone can see missions" on public.mission_directory for select to anon, authenticated using (true);
drop policy if exists "create own missions" on public.mission_directory;
create policy "create own missions" on public.mission_directory for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "edit own missions" on public.mission_directory;
create policy "edit own missions" on public.mission_directory for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists "delete own missions" on public.mission_directory;
create policy "delete own missions" on public.mission_directory for delete to authenticated using (created_by = auth.uid());

--    mission_members: one row per person per mission they created or joined.
--    A person only appears in (and only sees) the missions they are a member of.
create table if not exists public.mission_members (
  code       text not null,
  user_id    uuid not null references auth.users (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (code, user_id)
);
create index if not exists mission_members_user_idx on public.mission_members (user_id);
alter table public.mission_members enable row level security;
drop policy if exists "see own memberships" on public.mission_members;
create policy "see own memberships" on public.mission_members for select to authenticated using (user_id = auth.uid());
drop policy if exists "join missions" on public.mission_members;
create policy "join missions" on public.mission_members for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "leave missions" on public.mission_members;
create policy "leave missions" on public.mission_members for delete to authenticated using (user_id = auth.uid());

create or replace function public.is_member(c text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mission_members where code = c and user_id = auth.uid())
$$;
create or replace function public.shares_mission(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mission_members a join public.mission_members b on a.code = b.code
                 where a.user_id = auth.uid() and b.user_id = other)
$$;
revoke execute on function public.is_member(text) from anon;
revoke execute on function public.shares_mission(uuid) from anon;

drop policy if exists "read crew profiles" on public.profiles;
create policy "read crew profiles" on public.profiles for select using (public.shares_mission(id));

-- 4) Crew sharing. Each person keeps one status summary per mission they are on.
--    Crewmates on the same mission see each other's summary and emergency alerts.
create table if not exists public.crew_status (
  user_id    uuid not null references auth.users (id) on delete cascade,
  crew_code  text not null,
  name       text,
  role       text,
  summary    jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, crew_code)
);
-- Older installs keyed crew_status by user only: switch to one row per person per mission.
do $$
begin
  if exists (select 1 from pg_constraint c where c.conrelid = 'public.crew_status'::regclass and c.contype = 'p'
             and array_length(c.conkey, 1) = 1) then
    execute (select format('alter table public.crew_status drop constraint %I', conname)
             from pg_constraint where conrelid = 'public.crew_status'::regclass and contype = 'p');
    alter table public.crew_status add primary key (user_id, crew_code);
  end if;
end $$;
alter table public.crew_status enable row level security;
drop policy if exists "read crew status" on public.crew_status;
create policy "read crew status" on public.crew_status for select using (public.is_member(crew_code));
drop policy if exists "insert own status" on public.crew_status;
create policy "insert own status" on public.crew_status for insert with check (auth.uid() = user_id and public.is_member(crew_code));
drop policy if exists "update own status" on public.crew_status;
create policy "update own status" on public.crew_status for update using (auth.uid() = user_id) with check (auth.uid() = user_id and public.is_member(crew_code));
drop policy if exists "remove own status" on public.crew_status;
create policy "remove own status" on public.crew_status for delete using (auth.uid() = user_id);

-- Existing people keep the missions they were already on.
insert into public.mission_members (code, user_id)
  select crew_code, user_id from public.crew_status where crew_code is not null and crew_code <> ''
  on conflict do nothing;

-- Showcase mission NOVA-1: guests see its real crew, without medical history.
create or replace function public.showcase_crew()
returns table (user_id uuid, name text, role text, summary jsonb, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.user_id, c.name, c.role, c.summary - 'med', c.updated_at
  from public.crew_status c where c.crew_code = 'NOVA-1' order by c.updated_at desc limit 30
$$;
grant execute on function public.showcase_crew() to anon, authenticated;

create table if not exists public.alerts (
  id          uuid primary key,
  crew_code   text not null,
  from_user   uuid references auth.users (id) on delete set null,
  from_name   text,
  about_id    text,
  about_name  text,
  type        text not null,
  note        text,
  md          int,
  status      text not null default 'active' check (status in ('active', 'resolved')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.alerts enable row level security;
drop policy if exists "read crew alerts" on public.alerts;
create policy "read crew alerts" on public.alerts for select using (public.is_member(crew_code));
drop policy if exists "raise crew alerts" on public.alerts;
create policy "raise crew alerts" on public.alerts for insert with check (public.is_member(crew_code) and from_user = auth.uid());
drop policy if exists "resolve crew alerts" on public.alerts;
create policy "resolve crew alerts" on public.alerts for update using (public.is_member(crew_code)) with check (public.is_member(crew_code));

-- Ship inventory: what the crew has on board, shared by everyone on the same mission.
-- Removed items are kept with deleted = true so the removal reaches every device.
create table if not exists public.inventory (
  id          text primary key,
  crew_code   text not null,
  name        text not null,
  category    text not null default 'other',
  qty         numeric not null default 0,
  unit        text,
  min_qty     numeric not null default 0,
  note        text,
  updated_by  text,
  md          int,
  deleted     boolean not null default false,
  updated_at  timestamptz not null default now()
);
create index if not exists inventory_crew_idx on public.inventory (crew_code);
alter table public.inventory enable row level security;
drop policy if exists "read crew inventory" on public.inventory;
create policy "read crew inventory" on public.inventory for select using (public.is_member(crew_code));
drop policy if exists "add crew inventory" on public.inventory;
create policy "add crew inventory" on public.inventory for insert with check (public.is_member(crew_code));
drop policy if exists "update crew inventory" on public.inventory;
create policy "update crew inventory" on public.inventory for update using (public.is_member(crew_code)) with check (public.is_member(crew_code));

-- The old single-mission helper is no longer used by any rule.
drop function if exists public.my_crew();

-- 5) Role lock: the role stored at sign-up wins. Users cannot change it on their
--    profile, and the role shown to the crew always comes from the profile.
create or replace function public.keep_profile_role()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.role is not null then new.role := old.role; end if;
  return new;
end; $$;
drop trigger if exists profiles_keep_role on public.profiles;
create trigger profiles_keep_role before update on public.profiles
  for each row execute procedure public.keep_profile_role();

create or replace function public.crew_status_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.role := coalesce((select role from public.profiles where id = new.user_id), new.role);
  return new;
end; $$;
drop trigger if exists crew_status_role on public.crew_status;
create trigger crew_status_role before insert or update on public.crew_status
  for each row execute procedure public.crew_status_role();
revoke execute on function public.crew_status_role() from anon, authenticated;
revoke execute on function public.keep_profile_role() from anon, authenticated;
