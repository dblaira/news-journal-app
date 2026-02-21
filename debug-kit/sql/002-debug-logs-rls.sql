-- Debug Kit: Row Level Security for debug_logs
-- Run this SECOND in Supabase SQL Editor (after 001-create-debug-logs.sql)

alter table public.debug_logs enable row level security;

create policy "Users can insert their own debug logs"
  on public.debug_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can read their own debug logs"
  on public.debug_logs for select
  using (auth.uid() = user_id);

create policy "Users can delete their own debug logs"
  on public.debug_logs for delete
  using (auth.uid() = user_id);
