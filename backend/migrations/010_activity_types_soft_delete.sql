-- ============================================================================
-- Migration 010: Support soft deletion for activity types
-- Description:
--   1) Adds is_active flag to activity_types
--   2) Marks existing rows active by default
--   3) Preserves historical achievement records while hiding deleted titles
-- ============================================================================

ALTER TABLE activity_types
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE activity_types
   SET is_active = TRUE
 WHERE is_active IS NULL;

CREATE INDEX IF NOT EXISTS idx_activity_types_is_active
  ON activity_types(is_active);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'schema_version'
  ) THEN
    INSERT INTO schema_version (version, description)
    VALUES (10, 'Add soft-delete support for activity types')
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;