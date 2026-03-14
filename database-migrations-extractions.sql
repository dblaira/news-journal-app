-- Extraction Pipeline: extractions table
-- Run this in Supabase SQL Editor

-- 1. Create the extractions table
CREATE TABLE extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  confidence DECIMAL(2,1) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  source_text TEXT,
  batch_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies (same pattern as entries)
CREATE POLICY "Users can view their own extractions"
  ON extractions FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own extractions"
  ON extractions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own extractions"
  ON extractions FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own extractions"
  ON extractions FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 4. Indexes
CREATE INDEX idx_extractions_entry_id ON extractions (entry_id);
CREATE INDEX idx_extractions_category ON extractions (category);
CREATE INDEX idx_extractions_batch_id ON extractions (batch_id);
CREATE INDEX idx_extractions_user_created ON extractions (user_id, created_at DESC);
