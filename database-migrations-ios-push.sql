-- iOS Push Tokens table for APNs device registration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ios_push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_token TEXT NOT NULL,
  device_name TEXT,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, device_token)
);

-- Enable Row Level Security
ALTER TABLE ios_push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users can manage their own iOS tokens"
  ON ios_push_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read all tokens (for cron job)
CREATE POLICY "Service role can read all iOS tokens"
  ON ios_push_tokens
  FOR SELECT
  USING (true);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_ios_push_tokens_user_id ON ios_push_tokens(user_id);
