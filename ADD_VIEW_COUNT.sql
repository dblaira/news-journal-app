-- Migration: Add view_count column to entries table
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Add view_count column
ALTER TABLE entries 
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 2. Create index for optimized queries
CREATE INDEX IF NOT EXISTS idx_entries_view_count ON entries(view_count DESC, created_at DESC);

-- 3. Create RPC function for atomic view count increment
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

-- Done! The view_count feature should now work.
