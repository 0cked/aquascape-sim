-- 001_initial_schema.sql
-- Bootstrap schema for AquascapeSim.

create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Builds (saved aquascapes)
create table if not exists public.builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  name text not null,
  description text,
  scene_data jsonb not null,
  thumbnail_url text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists builds_user_id_idx on public.builds (user_id);
create index if not exists builds_is_public_idx on public.builds (is_public);

alter table public.builds enable row level security;

drop policy if exists "Public builds are readable" on public.builds;
create policy "Public builds are readable"
  on public.builds
  for select
  using (is_public = true);

drop policy if exists "Users can read own builds" on public.builds;
create policy "Users can read own builds"
  on public.builds
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own builds" on public.builds;
create policy "Users can insert own builds"
  on public.builds
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own builds" on public.builds;
create policy "Users can update own builds"
  on public.builds
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own builds" on public.builds;
create policy "Users can delete own builds"
  on public.builds
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_builds_updated_at on public.builds;
create trigger set_builds_updated_at
  before update on public.builds
  for each row execute procedure public.set_updated_at();

-- Asset catalog (reference list of available assets)
create table if not exists public.asset_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  model_url text,
  thumbnail_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.asset_catalog enable row level security;

drop policy if exists "Asset catalog is readable by all" on public.asset_catalog;
create policy "Asset catalog is readable by all"
  on public.asset_catalog
  for select
  using (true);

