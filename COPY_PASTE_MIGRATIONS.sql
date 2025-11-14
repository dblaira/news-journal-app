-- ============================================
-- COPY THIS ENTIRE FILE INTO SUPABASE SQL EDITOR
-- ============================================
-- Steps:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Click "New Query"
-- 3. Copy ALL content below (Ctrl/Cmd + A, then Ctrl/Cmd + C)
-- 4. Paste into SQL Editor (Ctrl/Cmd + V)
-- 5. Click "Run" button (or press Cmd/Ctrl + Enter)
-- ============================================

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

-- ============================================
-- DONE! You should see "Success. No rows returned"
-- ============================================

