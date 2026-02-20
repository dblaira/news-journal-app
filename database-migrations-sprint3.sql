-- ============================================
-- Sprint 3: Notification Intelligence Layer
-- Run in Supabase SQL Editor
-- ============================================

-- Part A: New columns on entries table
ALTER TABLE entries ADD COLUMN IF NOT EXISTS landed_count INTEGER DEFAULT 0;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS snooze_count INTEGER DEFAULT 0;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ;

-- Part B: User notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  morning_time TEXT DEFAULT '07:00',
  midday_time TEXT DEFAULT '12:00',
  evening_time TEXT DEFAULT '18:00',
  timezone TEXT DEFAULT 'America/Los_Angeles',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
  ON user_notification_preferences FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role reads all preferences"
  ON user_notification_preferences FOR SELECT
  USING (auth.role() = 'service_role');

-- Part C: Data migrations for existing Connections

-- Set defaults for connections with no surface_conditions
UPDATE entries
SET surface_conditions = '{"time_windows":["morning","midday","evening"],"days_of_week":[0,1,2,3,4,5,6],"min_interval_hours":48,"priority":"normal"}'::jsonb
WHERE entry_type = 'connection' AND surface_conditions IS NULL;

-- Migrate legacy time_of_day to time_windows
UPDATE entries
SET surface_conditions = surface_conditions
  || jsonb_build_object('time_windows',
    CASE surface_conditions->>'time_of_day'
      WHEN 'morning' THEN '["morning"]'::jsonb
      WHEN 'afternoon' THEN '["midday"]'::jsonb
      WHEN 'evening' THEN '["evening"]'::jsonb
    END)
WHERE entry_type = 'connection'
  AND surface_conditions->>'time_of_day' IS NOT NULL
  AND surface_conditions->'time_windows' IS NULL;

-- Ensure all connections have min_interval_hours and priority defaults
UPDATE entries
SET surface_conditions = surface_conditions
  || '{"min_interval_hours":48}'::jsonb
WHERE entry_type = 'connection'
  AND surface_conditions IS NOT NULL
  AND surface_conditions->'min_interval_hours' IS NULL;

UPDATE entries
SET surface_conditions = surface_conditions
  || '{"priority":"normal"}'::jsonb
WHERE entry_type = 'connection'
  AND surface_conditions IS NOT NULL
  AND surface_conditions->'priority' IS NULL;
