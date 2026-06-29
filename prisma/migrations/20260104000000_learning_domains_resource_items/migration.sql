-- Migration 4: learning_domains and resource_items
-- -----------------------------------------------------------------------
-- This migration records schema additions that were applied to Supabase
-- via supabase/migrations/001_learning_domains.sql and
-- supabase/migrations/002_resource_items.sql.
--
-- All statements are idempotent (IF NOT EXISTS) so this migration is safe
-- to run even if the tables already exist from the Supabase SQL files.
-- -----------------------------------------------------------------------

-- learning_domains: per-user domain tags (replaces shared focus_areas)
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

-- Foreign key from resources to learning_domains
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS learning_domain_id uuid
    REFERENCES learning_domains(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_resources_learning_domain_id
  ON resources (learning_domain_id);

-- resource_items: chapters / lessons / videos within a resource
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
