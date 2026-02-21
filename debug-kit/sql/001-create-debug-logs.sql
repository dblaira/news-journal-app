-- Debug Kit: Create debug_logs table
-- Run this FIRST in Supabase SQL Editor

create table if not exists public.debug_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  level text not null check (level in ('info', 'warn', 'error', 'debug')),
  page text not null,
  message text not null,
  metadata jsonb default '{}'::jsonb,
  session_id text
);

create index if not exists debug_logs_user_id_idx on public.debug_logs(user_id);
create index if not exists debug_logs_created_at_idx on public.debug_logs(created_at desc);
create index if not exists debug_logs_level_idx on public.debug_logs(level);
create index if not exists debug_logs_session_id_idx on public.debug_logs(session_id);
