-- Interview Copilot — Supabase schema (SPEC v2.2)
-- Run in Supabase SQL Editor or via CLI

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  created_at  timestamptz default now()
);

-- Interview sessions
create table if not exists public.sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  source_lang   text not null default 'en',
  target_lang   text not null default 'vi',
  answer_style  text not null default 'STAR',
  profile_text  text,
  jd_text       text,
  status        text not null default 'active' check (status in ('active', 'ended')),
  started_at    timestamptz default now(),
  ended_at      timestamptz
);

-- Questions per session
create table if not exists public.questions (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.sessions(id) on delete cascade,
  question_type   text,
  transcript_raw  text not null,
  transcript_vi   text,
  ai_answer       text,
  answer_lang     text default 'en',
  created_at      timestamptz default now()
);

create index if not exists idx_sessions_user on public.sessions(user_id);
create index if not exists idx_questions_session on public.questions(session_id);
create index if not exists idx_sessions_status on public.sessions(status);
create index if not exists idx_sessions_started on public.sessions(started_at desc);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.questions enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can view own sessions"
  on public.sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions"
  on public.sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions"
  on public.sessions for update using (auth.uid() = user_id);

create policy "Users can view own questions"
  on public.questions for select using (
    exists (
      select 1 from public.sessions
      where sessions.id = questions.session_id
        and sessions.user_id = auth.uid()
    )
  );
create policy "Users can insert own questions"
  on public.questions for insert with check (
    exists (
      select 1 from public.sessions
      where sessions.id = questions.session_id
        and sessions.user_id = auth.uid()
    )
  );

-- Realtime — see 004_enable_realtime_questions.sql

-- Revoke public execute on trigger function — see 003_revoke_handle_new_user_execute.sql
