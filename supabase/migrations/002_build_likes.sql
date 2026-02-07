-- 002_build_likes.sql
-- Adds build likes for the public gallery.

create table if not exists public.build_likes (
  build_id uuid not null references public.builds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (build_id, user_id)
);

create index if not exists build_likes_build_id_idx on public.build_likes (build_id);
create index if not exists build_likes_user_id_idx on public.build_likes (user_id);

alter table public.build_likes enable row level security;

drop policy if exists "Likes are readable for public builds" on public.build_likes;
create policy "Likes are readable for public builds"
  on public.build_likes
  for select
  using (
    exists (
      select 1
      from public.builds b
      where b.id = build_id
        and b.is_public = true
    )
  );

drop policy if exists "Users can like public builds" on public.build_likes;
create policy "Users can like public builds"
  on public.build_likes
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.builds b
      where b.id = build_id
        and b.is_public = true
    )
  );

drop policy if exists "Users can unlike builds they liked" on public.build_likes;
create policy "Users can unlike builds they liked"
  on public.build_likes
  for delete
  using (auth.uid() = user_id);

