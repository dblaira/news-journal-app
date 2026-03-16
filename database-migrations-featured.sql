-- Featured Entry: add boolean column to entries
-- Run in Supabase SQL Editor

ALTER TABLE entries ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_entries_featured ON entries(user_id, featured)
  WHERE featured = TRUE;
