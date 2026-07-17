create table if not exists public.run_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  player_name text not null check (char_length(player_name) between 1 and 24),
  mode text not null check (mode in ('normal', 'hardcore', 'timed', 'oneLife')),
  completion_seconds integer not null check (completion_seconds >= 0),
  kills integer not null check (kills >= 0),
  bosses_defeated integer not null check (bosses_defeated >= 0),
  daily_streak integer not null check (daily_streak >= 0),
  completed_at timestamptz not null default now()
);

create index if not exists run_records_user_time_idx
  on public.run_records (user_id, completion_seconds, completed_at desc);

alter table public.run_records enable row level security;

create policy "read own run records"
  on public.run_records for select
  using (auth.uid() = user_id);

create policy "insert own run records"
  on public.run_records for insert
  with check (auth.uid() = user_id);

