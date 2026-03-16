-- Ontology Formalization: new table + new column on extractions
-- Run in Supabase SQL Editor

-- 1. Create ontology_categories table
CREATE TABLE IF NOT EXISTS ontology_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  parent_name TEXT NOT NULL,
  child_label TEXT NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, child_label, version)
);

CREATE INDEX IF NOT EXISTS idx_ontology_user ON ontology_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_ontology_parent ON ontology_categories(user_id, parent_name);

-- RLS: users can only see/modify their own ontology
ALTER TABLE ontology_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ontology"
  ON ontology_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ontology"
  ON ontology_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ontology"
  ON ontology_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ontology"
  ON ontology_categories FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Add parent_category column to extractions
ALTER TABLE extractions ADD COLUMN IF NOT EXISTS parent_category TEXT;
CREATE INDEX IF NOT EXISTS idx_extractions_parent_cat ON extractions(parent_category);
