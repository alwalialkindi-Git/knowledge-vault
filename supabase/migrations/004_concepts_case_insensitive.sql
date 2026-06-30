-- ============================================================================
-- Migration 004: Case-insensitive concept name deduplication
-- ----------------------------------------------------------------------------
-- Replaces the case-sensitive UNIQUE (user_id, name) constraint created in 003
-- with a functional unique index on (user_id, LOWER(name)).
--
-- Effect: "AI", "Ai", "ai" are treated as the same concept.
-- The original casing of the first-created name is preserved.
--
-- Safe to run more than once (DROP CONSTRAINT IF EXISTS, CREATE INDEX IF NOT EXISTS).
-- ============================================================================

ALTER TABLE concepts DROP CONSTRAINT IF EXISTS concepts_user_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_concepts_user_name_lower
  ON concepts (user_id, LOWER(name));
