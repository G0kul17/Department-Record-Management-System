-- ============================================================================
-- Migration 011: Add missing created_at column to activity_types
-- Description:
--   The activity_types table was originally created without a created_at column
--   (migration 008 defined it in CREATE TABLE but the live DB did not have it).
--   This migration adds the column with a sensible default so that INSERT/UPDATE
--   RETURNING id, name, created_at queries in the controller work correctly.
-- ============================================================================

ALTER TABLE activity_types
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'schema_version'
  ) THEN
    INSERT INTO schema_version (version, description)
    VALUES (11, 'Add missing created_at column to activity_types')
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;
