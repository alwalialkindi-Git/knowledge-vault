-- ============================================================================
-- Migration 002: Resource Items (Chapters / Lessons / Videos)
-- ----------------------------------------------------------------------------
-- Creates the resource_items table used by the ItemsManager UI for tracking
-- chapters, lessons, or videos within a resource.
--
-- Where to run:
--   Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- Safe to run more than once (all DDL uses IF NOT EXISTS / IF EXISTS).
-- ============================================================================

-- 1. Create the resource_items table ------------------------------------------

CREATE TABLE IF NOT EXISTS resource_items (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id        uuid        NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  title              text        NOT NULL,
  description        text,
  item_type          text        NOT NULL DEFAULT 'lesson',
  url                text,
  estimated_minutes  integer,
  order_index        integer     NOT NULL DEFAULT 0,
  is_completed       boolean     NOT NULL DEFAULT false,
  completed_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resource_items_user_id
  ON resource_items (user_id);

CREATE INDEX IF NOT EXISTS idx_resource_items_resource_id
  ON resource_items (resource_id);

CREATE INDEX IF NOT EXISTS idx_resource_items_resource_order
  ON resource_items (resource_id, order_index);

-- 2. updated_at trigger -------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS resource_items_set_updated_at ON resource_items;
CREATE TRIGGER resource_items_set_updated_at
  BEFORE UPDATE ON resource_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. Grant table access to authenticated role ---------------------------------

GRANT ALL ON TABLE resource_items TO authenticated;

-- 4. RLS — each user owns their own items -------------------------------------

ALTER TABLE resource_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resource_items_owner_all" ON resource_items;
CREATE POLICY "resource_items_owner_all"
  ON resource_items
  FOR ALL
  TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
