-- ============================================
-- METADATA CAPTURE + ENRICHMENT MIGRATIONS
-- Run these in your Supabase SQL Editor
-- ============================================

-- 1. Add metadata column to entries table
ALTER TABLE entries ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Index for querying by metadata fields (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_entries_metadata ON entries USING gin(metadata);

-- 2. User's custom vocabulary and preferences
CREATE TABLE IF NOT EXISTS user_metadata_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL, -- 'location_label', 'activity', 'mood', 'time_label', 'energy_label'
  value TEXT NOT NULL,           -- The custom label/value
  metadata JSONB DEFAULT '{}',   -- Additional data (e.g., coordinates for locations)
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, preference_type, value)
);

-- 3. Learned location labels (coordinate → name mapping)
CREATE TABLE IF NOT EXISTS user_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,                    -- "home", "work", "gym", "Newport Beach"
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  radius_meters INTEGER DEFAULT 200,      -- How close counts as "same place"
  is_area BOOLEAN DEFAULT FALSE,          -- TRUE for cities/neighborhoods, FALSE for specific spots
  entry_count INTEGER DEFAULT 1,          -- How many entries from here
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast location lookups
CREATE INDEX IF NOT EXISTS idx_user_locations_coords 
ON user_locations(user_id, latitude, longitude);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE user_metadata_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Policies for user_metadata_preferences
CREATE POLICY "Users can view their own preferences"
ON user_metadata_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON user_metadata_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON user_metadata_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
ON user_metadata_preferences FOR DELETE
USING (auth.uid() = user_id);

-- Policies for user_locations
CREATE POLICY "Users can view their own locations"
ON user_locations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own locations"
ON user_locations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations"
ON user_locations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations"
ON user_locations FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- EXAMPLE QUERIES (for reference)
-- ============================================

-- Entries from "home"
-- SELECT * FROM entries WHERE metadata->'location'->>'label' = 'home';

-- Morning entries
-- SELECT * FROM entries WHERE metadata->>'time_of_day' = 'morning';

-- High energy entries
-- SELECT * FROM entries WHERE metadata->'enrichment'->>'energy' = 'high';

-- Entries with specific activity
-- SELECT * FROM entries WHERE metadata->'enrichment'->>'activity' = 'after workout';

-- Entries by mood (contains)
-- SELECT * FROM entries WHERE metadata->'enrichment'->'mood' ? 'focused';

