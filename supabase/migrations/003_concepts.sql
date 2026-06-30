-- ============================================================================
-- Migration 003: Concepts & Concept Links
-- ----------------------------------------------------------------------------
-- Adds the Knowledge Graph foundation: user-owned concepts and a polymorphic
-- link table connecting concepts to resources, notes, and resource_items.
--
-- Where to run:
--   Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- Prerequisites:
--   Run AFTER 002_resource_items.sql — concept_links references resource_items.
--   The set_updated_at() function must exist (created in 002).
--
-- Safe to run more than once (all DDL uses IF NOT EXISTS / IF EXISTS).
-- ============================================================================

-- 1. concepts -----------------------------------------------------------------
--    A named knowledge node belonging to a single user.
--    Never nested inside a domain, resource, or any other entity.

CREATE TABLE IF NOT EXISTS concepts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT concepts_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_concepts_user_id ON concepts (user_id);

DROP TRIGGER IF EXISTS concepts_set_updated_at ON concepts;
CREATE TRIGGER concepts_set_updated_at
  BEFORE UPDATE ON concepts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. concept_links ------------------------------------------------------------
--    Connects a concept to exactly one target entity per row.
--    The CHECK constraint ensures exactly one FK column is non-null.
--    CASCADE deletes keep the table clean automatically when any target is removed.

CREATE TABLE IF NOT EXISTS concept_links (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  concept_id       uuid        NOT NULL REFERENCES concepts(id)       ON DELETE CASCADE,
  note_id          uuid                 REFERENCES notes(id)          ON DELETE CASCADE,
  resource_id      uuid                 REFERENCES resources(id)      ON DELETE CASCADE,
  resource_item_id uuid                 REFERENCES resource_items(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT concept_links_one_target CHECK (
    (note_id          IS NOT NULL)::int +
    (resource_id      IS NOT NULL)::int +
    (resource_item_id IS NOT NULL)::int = 1
  ),
  CONSTRAINT concept_links_unique_note     UNIQUE (concept_id, note_id),
  CONSTRAINT concept_links_unique_resource UNIQUE (concept_id, resource_id),
  CONSTRAINT concept_links_unique_item     UNIQUE (concept_id, resource_item_id)
);

CREATE INDEX IF NOT EXISTS idx_concept_links_concept_id
  ON concept_links (concept_id);

CREATE INDEX IF NOT EXISTS idx_concept_links_user_id
  ON concept_links (user_id);

CREATE INDEX IF NOT EXISTS idx_concept_links_note_id
  ON concept_links (note_id) WHERE note_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_concept_links_resource_id
  ON concept_links (resource_id) WHERE resource_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_concept_links_resource_item_id
  ON concept_links (resource_item_id) WHERE resource_item_id IS NOT NULL;

-- 3. Grant access to authenticated role ---------------------------------------

GRANT ALL ON TABLE concepts      TO authenticated;
GRANT ALL ON TABLE concept_links TO authenticated;

-- 4. Row-Level Security -------------------------------------------------------
--    Each user can only see and modify their own concepts and links.
--    No anon access. No service-role bypass from the client.

ALTER TABLE concepts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "concepts_owner_all"      ON concepts;
DROP POLICY IF EXISTS "concept_links_owner_all" ON concept_links;

CREATE POLICY "concepts_owner_all"
  ON concepts FOR ALL TO authenticated
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "concept_links_owner_all"
  ON concept_links FOR ALL TO authenticated
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
