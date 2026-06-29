-- ============================================================================
-- Migration 001: User-managed Learning Domains
-- ----------------------------------------------------------------------------
-- Replaces the shared (seed-only) focus_areas lookup table with a per-user
-- learning_domains table. Existing resource data is migrated automatically.
--
-- Where to run:
--   Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- Safe to run more than once (all DDL uses IF NOT EXISTS / IF EXISTS).
-- ============================================================================

-- 1. Create the learning_domains table ----------------------------------------

CREATE TABLE IF NOT EXISTS learning_domains (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  icon        text,
  color       text,
  sort_order  integer     NOT NULL DEFAULT 0,
  is_archived boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_domains_user_sort
  ON learning_domains (user_id, sort_order);

-- 2. Grant table access to authenticated role ---------------------------------

GRANT ALL ON TABLE learning_domains TO authenticated;

-- 3. RLS — each user owns their own domains ------------------------------------

ALTER TABLE learning_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "learning_domains_owner_all" ON learning_domains;
CREATE POLICY "learning_domains_owner_all"
  ON learning_domains
  FOR ALL
  TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Add learning_domain_id to resources ---------------------------------------

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS learning_domain_id uuid
    REFERENCES learning_domains(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_resources_learning_domain_id
  ON resources (learning_domain_id);

-- 4. Migrate existing focus_area data ------------------------------------------
-- For each user who used a focus_area, create a personal copy as a
-- learning_domain and point their resources at it.

DO $$
BEGIN
  -- Temporary column to track which focus_area each migrated domain came from
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_domains' AND column_name = '_src'
  ) THEN
    ALTER TABLE learning_domains ADD COLUMN _src uuid;
  END IF;

  -- Insert one learning_domain per (user_id, focus_area) combination in use
  INSERT INTO learning_domains (user_id, name, color, sort_order, _src)
  SELECT DISTINCT r.user_id, fa.name_en, fa.color, fa.sort_order, fa.id
  FROM   resources r
  JOIN   focus_areas fa ON fa.id = r.focus_area_id
  WHERE  r.focus_area_id IS NOT NULL
  -- Skip if the same (user_id, focus_area) pair was already migrated
  ON CONFLICT DO NOTHING;

  -- Point resources at their new learning_domain
  UPDATE resources r
  SET    learning_domain_id = ld.id
  FROM   learning_domains ld
  WHERE  ld._src    = r.focus_area_id
    AND  ld.user_id = r.user_id
    AND  r.learning_domain_id IS NULL;

  -- Drop the temporary migration column
  ALTER TABLE learning_domains DROP COLUMN IF EXISTS _src;
END $$;

-- ============================================================================
-- Verification queries (run separately after the migration):
--
--   SELECT COUNT(*) FROM learning_domains;
--   SELECT r.title, ld.name
--   FROM resources r
--   LEFT JOIN learning_domains ld ON ld.id = r.learning_domain_id
--   LIMIT 20;
-- ============================================================================
