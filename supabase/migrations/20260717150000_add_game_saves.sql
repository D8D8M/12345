create table if not exists public.game_saves (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slot smallint not null check (slot between 0 and 3),
  save_data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, slot)
);

alter table public.game_saves enable row level security;

create policy "read own game saves"
  on public.game_saves for select
  using (auth.uid() = user_id);

create policy "insert own game saves"
  on public.game_saves for insert
  with check (auth.uid() = user_id);

create policy "update own game saves"
  on public.game_saves for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own game saves"
  on public.game_saves for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.game_saves to authenticated;
