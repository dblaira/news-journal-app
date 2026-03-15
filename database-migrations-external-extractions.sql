-- External Extractions: schema changes for multi-domain extraction pipeline
-- Run this in Supabase SQL Editor

-- 1. Make entry_id nullable (external data has no journal entry)
ALTER TABLE extractions ALTER COLUMN entry_id DROP NOT NULL;

-- 2. Re-create the foreign key without NOT NULL (allows null entry_id)
ALTER TABLE extractions DROP CONSTRAINT IF EXISTS extractions_entry_id_fkey;
ALTER TABLE extractions ADD CONSTRAINT extractions_entry_id_fkey
  FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE;

-- 3. Add new columns for external extraction metadata
ALTER TABLE extractions ADD COLUMN IF NOT EXISTS source_domain TEXT DEFAULT 'journal';
ALTER TABLE extractions ADD COLUMN IF NOT EXISTS time_window_start DATE;
ALTER TABLE extractions ADD COLUMN IF NOT EXISTS time_window_end DATE;
ALTER TABLE extractions ADD COLUMN IF NOT EXISTS batch_size INTEGER;

-- 4. Indexes for filtering by domain and time window
CREATE INDEX IF NOT EXISTS idx_extractions_source_domain ON extractions (source_domain);
CREATE INDEX IF NOT EXISTS idx_extractions_time_window ON extractions (time_window_start, time_window_end);
