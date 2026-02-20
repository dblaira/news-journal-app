-- ============================================
-- Push Notifications Migration
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Ensure connection-related columns exist on entries table
-- (These may already exist if added previously)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entries' AND column_name = 'connection_type') THEN
    ALTER TABLE entries ADD COLUMN connection_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entries' AND column_name = 'surface_conditions') THEN
    ALTER TABLE entries ADD COLUMN surface_conditions JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entries' AND column_name = 'last_surfaced_at') THEN
    ALTER TABLE entries ADD COLUMN last_surfaced_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entries' AND column_name = 'surface_count') THEN
    ALTER TABLE entries ADD COLUMN surface_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 2. Push Subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  device_name TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Service role needs to read all subscriptions for cron
CREATE POLICY "Service role reads all push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.role() = 'service_role');

-- 3. Notification Responses table
CREATE TABLE IF NOT EXISTS notification_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  connection_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('landed', 'snooze', 'opened')),
  surfaced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_responses_connection
  ON notification_responses(connection_id);

CREATE INDEX IF NOT EXISTS idx_notification_responses_user
  ON notification_responses(user_id, responded_at DESC);

ALTER TABLE notification_responses ENABLE ROW LEVEL SECURITY;

-- Responses can be inserted without auth (from service worker)
CREATE POLICY "Anyone can insert notification responses"
  ON notification_responses FOR INSERT
  WITH CHECK (true);

-- Users can read their own responses
CREATE POLICY "Users read own notification responses"
  ON notification_responses FOR SELECT
  USING (auth.uid() = user_id);

-- Service role reads all for analytics
CREATE POLICY "Service role reads all notification responses"
  ON notification_responses FOR SELECT
  USING (auth.role() = 'service_role');
