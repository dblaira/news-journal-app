-- Correlation Analyses: stores computed correlations and Claude interpretations
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS correlation_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date_range_start TEXT NOT NULL,
  date_range_end TEXT NOT NULL,
  total_weeks INTEGER NOT NULL,
  total_extractions INTEGER NOT NULL,
  correlations JSONB NOT NULL DEFAULT '[]',
  anomaly_weeks JSONB NOT NULL DEFAULT '[]',
  category_stats JSONB NOT NULL DEFAULT '[]',
  interpretation JSONB DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_correlation_analyses_user
  ON correlation_analyses(user_id, created_at DESC);

ALTER TABLE correlation_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own correlation analyses"
  ON correlation_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own correlation analyses"
  ON correlation_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own correlation analyses"
  ON correlation_analyses FOR DELETE
  USING (auth.uid() = user_id);
