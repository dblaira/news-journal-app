-- Debug Kit: Create debug_feedback table
-- Run this in Supabase SQL Editor

create table if not exists public.debug_feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  category text not null check (category in ('bug', 'design', 'feature', 'observation')),
  message text not null,
  page text not null,
  metadata jsonb default '{}'::jsonb,
  resolved boolean default false
);

alter table public.debug_feedback enable row level security;

create policy "Users can insert their own feedback"
  on public.debug_feedback for insert
  with check (auth.uid() = user_id);

create policy "Users can read their own feedback"
  on public.debug_feedback for select
  using (auth.uid() = user_id);

create policy "Users can update their own feedback"
  on public.debug_feedback for update
  using (auth.uid() = user_id);

create policy "Users can delete their own feedback"
  on public.debug_feedback for delete
  using (auth.uid() = user_id);

create index if not exists debug_feedback_user_id_idx on public.debug_feedback(user_id);
create index if not exists debug_feedback_created_at_idx on public.debug_feedback(created_at desc);
create index if not exists debug_feedback_category_idx on public.debug_feedback(category);
