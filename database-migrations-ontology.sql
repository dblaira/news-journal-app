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

-- 3. Personal axiom foundation
DO $$ BEGIN
  CREATE TYPE ontology_axiom_status AS ENUM ('candidate', 'confirmed', 'rejected', 'retired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ontology_axiom_scope AS ENUM ('personal', 'starter_hypothesis', 'demo');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ontology_relationship_type AS ENUM (
    'supports',
    'predicts',
    'conflicts_with',
    'follows',
    'amplifies',
    'inhibits',
    'correlates_with'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS ontology_axioms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  antecedent TEXT NOT NULL,
  consequent TEXT NOT NULL,
  confidence NUMERIC(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  status ontology_axiom_status NOT NULL DEFAULT 'candidate',
  scope ontology_axiom_scope NOT NULL DEFAULT 'personal',
  relationship_type ontology_relationship_type NOT NULL DEFAULT 'predicts',
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_entry_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
  evidence_count INTEGER NOT NULL DEFAULT 0 CHECK (evidence_count >= 0),
  sources TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ
);

ALTER TABLE ontology_axioms
  ADD COLUMN IF NOT EXISTS status ontology_axiom_status NOT NULL DEFAULT 'candidate',
  ADD COLUMN IF NOT EXISTS scope ontology_axiom_scope NOT NULL DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS relationship_type ontology_relationship_type NOT NULL DEFAULT 'predicts',
  ADD COLUMN IF NOT EXISTS provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS evidence_entry_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS evidence_count INTEGER NOT NULL DEFAULT 0 CHECK (evidence_count >= 0),
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retired_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ontology_axioms_user_id ON ontology_axioms(user_id);
CREATE INDEX IF NOT EXISTS idx_ontology_axioms_user_status ON ontology_axioms(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ontology_axioms_scope_status ON ontology_axioms(scope, status) WHERE user_id IS NULL;

ALTER TABLE ontology_axioms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ontology_axioms_select_own_or_global" ON ontology_axioms;
CREATE POLICY "ontology_axioms_select_own_or_global"
  ON ontology_axioms FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR (user_id IS NULL AND scope = 'starter_hypothesis')
  );

DROP POLICY IF EXISTS "ontology_axioms_insert_own" ON ontology_axioms;
CREATE POLICY "ontology_axioms_insert_own"
  ON ontology_axioms FOR INSERT
  WITH CHECK (
    user_id IS NOT NULL
    AND (SELECT auth.uid()) = user_id
    AND scope = 'personal'
  );

DROP POLICY IF EXISTS "ontology_axioms_update_own" ON ontology_axioms;
CREATE POLICY "ontology_axioms_update_own"
  ON ontology_axioms FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND scope = 'personal'
  );

DROP POLICY IF EXISTS "ontology_axioms_delete_own" ON ontology_axioms;
CREATE POLICY "ontology_axioms_delete_own"
  ON ontology_axioms FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

UPDATE ontology_axioms
SET
  status = 'confirmed',
  scope = 'demo',
  provenance = provenance || '{"corpus":"adam_example","purpose":"benchmark"}'::jsonb,
  confirmed_at = COALESCE(confirmed_at, created_at)
WHERE user_id IS NULL
  AND name IN ('Learning Master Key', 'Exercise-Sleep Synergy', 'Belief to Entertainment Lag', 'Zero Negative Impact');

-- 4. Knowledge graph migration path
-- Confirmed personal axioms can be projected as:
--   concept:{slug(antecedent)} -[relationship_type, confidence, axiom_id]-> concept:{slug(consequent)}
-- Keep evidence_entry_ids, evidence_count, and provenance populated so a future Neo4j,
-- RDF/OWL, or GraphRAG export can trace each edge back to the user's record.
