-- V3 Database Migrations
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Create weekly_themes table
CREATE TABLE IF NOT EXISTS weekly_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  theme_content TEXT NOT NULL,
  entry_ids UUID[] NOT NULL,
  week_start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add indexes for weekly_themes
CREATE INDEX IF NOT EXISTS idx_weekly_themes_user_id ON weekly_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_themes_week_start ON weekly_themes(user_id, week_start_date);

-- 3. Add photo fields to entries table
ALTER TABLE entries 
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_processed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS week_theme_id UUID REFERENCES weekly_themes(id) ON DELETE SET NULL;

-- 4. Create index for week_theme_id
CREATE INDEX IF NOT EXISTS idx_entries_week_theme_id ON entries(week_theme_id);

-- 5. Enable Row Level Security (RLS) for weekly_themes
ALTER TABLE weekly_themes ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for weekly_themes
-- Policy: Users can only see their own weekly themes
CREATE POLICY "Users can view own weekly themes"
  ON weekly_themes FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own weekly themes
CREATE POLICY "Users can insert own weekly themes"
  ON weekly_themes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own weekly themes
CREATE POLICY "Users can update own weekly themes"
  ON weekly_themes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own weekly themes
CREATE POLICY "Users can delete own weekly themes"
  ON weekly_themes FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create storage bucket for entry photos (run in Supabase Storage UI or via API)
-- The bucket should be named 'entry-photos' with public access or RLS policies

-- 8. Storage policy for entry-photos bucket (if using RLS)
-- Users can upload photos to their own folder
-- Users can read photos from their own folder
-- Note: Adjust these policies based on your storage setup preferences

-- 9. Add view_count column to entries table for tracking popularity
ALTER TABLE entries 
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 10. Create index for view_count to optimize trending queries
CREATE INDEX IF NOT EXISTS idx_entries_view_count ON entries(view_count DESC, created_at DESC);

-- 10b. Create RPC function for atomic view count increment
-- This prevents race conditions when multiple requests try to increment simultaneously
CREATE OR REPLACE FUNCTION increment_entry_view_count(entry_id UUID, owner_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE entries
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = entry_id AND user_id = owner_id;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;

-- =============================================================================
-- V4 UNIFIED ENTRY SYSTEM MIGRATIONS
-- Adds support for entry types: story, action, note
-- Run these SQL commands in your Supabase SQL Editor
-- =============================================================================

-- 11. Add entry_type column with default 'story' for backward compatibility
-- Using TEXT with CHECK constraint instead of enum for flexibility
ALTER TABLE entries 
  ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'story' 
    CHECK (entry_type IN ('story', 'action', 'note'));

-- 12. Add action-specific columns
ALTER TABLE entries 
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 13. Create indexes for efficient querying by type and due date
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(user_id, entry_type);
CREATE INDEX IF NOT EXISTS idx_entries_incomplete_actions ON entries(user_id, due_date) 
  WHERE entry_type = 'action' AND completed_at IS NULL;

-- 14. Update existing entries to have entry_type = 'story' (in case default didn't apply)
UPDATE entries SET entry_type = 'story' WHERE entry_type IS NULL;

