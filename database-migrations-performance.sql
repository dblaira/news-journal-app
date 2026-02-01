-- Performance & Security Fixes Migration
-- Run these SQL commands in your Supabase SQL Editor
-- Generated: 2026-02-01

-- =============================================================================
-- FIX 1: RLS PERFORMANCE OPTIMIZATION (auth_rls_initplan)
-- Problem: auth.uid() is re-evaluated for each row, causing slow queries at scale
-- Solution: Wrap in (select auth.uid()) to evaluate once per query
-- =============================================================================

-- Drop existing entries policies
DROP POLICY IF EXISTS "Users can view their own entries" ON entries;
DROP POLICY IF EXISTS "Users can insert their own entries" ON entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON entries;

-- Recreate with optimized pattern
CREATE POLICY "Users can view their own entries"
  ON entries FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own entries"
  ON entries FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own entries"
  ON entries FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own entries"
  ON entries FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Drop existing weekly_themes policies
DROP POLICY IF EXISTS "Users can view own weekly themes" ON weekly_themes;
DROP POLICY IF EXISTS "Users can insert own weekly themes" ON weekly_themes;
DROP POLICY IF EXISTS "Users can update own weekly themes" ON weekly_themes;
DROP POLICY IF EXISTS "Users can delete own weekly themes" ON weekly_themes;

-- Recreate with optimized pattern
CREATE POLICY "Users can view own weekly themes"
  ON weekly_themes FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own weekly themes"
  ON weekly_themes FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own weekly themes"
  ON weekly_themes FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own weekly themes"
  ON weekly_themes FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =============================================================================
-- FIX 2: FUNCTION SEARCH_PATH SECURITY
-- Problem: increment_entry_view_count has mutable search_path (security risk)
-- Solution: Set search_path explicitly in function definition
-- =============================================================================

CREATE OR REPLACE FUNCTION increment_entry_view_count(entry_id UUID, owner_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- =============================================================================
-- VERIFICATION QUERIES (run to confirm fixes)
-- =============================================================================

-- Check entries policies (should show optimized pattern)
-- SELECT policyname, qual FROM pg_policies WHERE tablename = 'entries';

-- Check weekly_themes policies
-- SELECT policyname, qual FROM pg_policies WHERE tablename = 'weekly_themes';

-- Check function definition
-- SELECT prosrc FROM pg_proc WHERE proname = 'increment_entry_view_count';
