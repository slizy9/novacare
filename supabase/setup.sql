-- NOVACARE — database setup for Supabase.
-- Run once in your project: SQL Editor → New query → paste → Run.

-- 1) Registered crew members (filled automatically on every sign-up).
--    Passwords are NOT here: Supabase Auth stores them hashed in auth.users.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text,
  email      text,
  crew_code  text not null default 'NOVA-1',
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists crew_code text not null default 'NOVA-1';
-- The crew role is chosen once at sign-up and cannot be changed afterwards.
alter table public.profiles add column if not exists role text;
update public.profiles p set role = coalesce(nullif(u.raw_user_meta_data ->> 'role', ''), 'Flight Engineer')
  from auth.users u where u.id = p.id and p.role is null;
alter table public.profiles enable row level security;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, crew_code, role)
  values (new.id, new.raw_user_meta_data ->> 'name', new.email,
          coalesce(nullif(new.raw_user_meta_data ->> 'crew', ''), 'NOVA-1'),
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

-- 3) Crew sharing. Crew members with the same mission code can see each other's
--    status summary and emergency alerts — nothing from other missions.
create or replace function public.my_crew()
returns text language sql stable security definer set search_path = public as $$
  select crew_code from public.profiles where id = auth.uid()
$$;

drop policy if exists "read crew profiles" on public.profiles;
create policy "read crew profiles" on public.profiles for select using (crew_code = public.my_crew());

create table if not exists public.crew_status (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  crew_code  text not null,
  name       text,
  role       text,
  summary    jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.crew_status enable row level security;
drop policy if exists "read crew status" on public.crew_status;
create policy "read crew status" on public.crew_status for select using (crew_code = public.my_crew());
drop policy if exists "insert own status" on public.crew_status;
create policy "insert own status" on public.crew_status for insert with check (auth.uid() = user_id and crew_code = public.my_crew());
drop policy if exists "update own status" on public.crew_status;
create policy "update own status" on public.crew_status for update using (auth.uid() = user_id) with check (auth.uid() = user_id and crew_code = public.my_crew());

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
create policy "read crew alerts" on public.alerts for select using (crew_code = public.my_crew());
drop policy if exists "raise crew alerts" on public.alerts;
create policy "raise crew alerts" on public.alerts for insert with check (crew_code = public.my_crew() and from_user = auth.uid());
drop policy if exists "resolve crew alerts" on public.alerts;
create policy "resolve crew alerts" on public.alerts for update using (crew_code = public.my_crew()) with check (crew_code = public.my_crew());

-- Ship inventory: what the crew has on board, shared by everyone on the same mission code.
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
create policy "read crew inventory" on public.inventory for select using (crew_code = public.my_crew());
drop policy if exists "add crew inventory" on public.inventory;
create policy "add crew inventory" on public.inventory for insert with check (crew_code = public.my_crew());
drop policy if exists "update crew inventory" on public.inventory;
create policy "update crew inventory" on public.inventory for update using (crew_code = public.my_crew()) with check (crew_code = public.my_crew());

-- Role lock: the role stored at sign-up wins. Users cannot change it on their
-- profile, and the role shown to the crew always comes from the profile.
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
