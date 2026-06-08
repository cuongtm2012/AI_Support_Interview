-- Per-user API keys (Deepgram, DeepSeek) — BYOK tied to auth account

create table if not exists public.user_api_keys (
  user_id           uuid primary key references public.profiles(id) on delete cascade,
  deepgram_api_key  text,
  deepseek_api_key  text,
  updated_at        timestamptz not null default now()
);

alter table public.user_api_keys enable row level security;

create policy "Users can view own api keys"
  on public.user_api_keys for select
  using (auth.uid() = user_id);

create policy "Users can insert own api keys"
  on public.user_api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can update own api keys"
  on public.user_api_keys for update
  using (auth.uid() = user_id);
