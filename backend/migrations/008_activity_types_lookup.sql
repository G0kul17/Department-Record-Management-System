-- ============================================================================
-- Migration 008: Normalize activity types into a lookup table
-- Description:
--   1) Adds activity_types reference table
--   2) Replaces free-text activity_type columns with activity_type_id FKs
--      in projects, achievements, and activity_coordinators
--   3) Migrates existing data and enforces integrity with NOT NULL + FK
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Reference table for allowed activity types
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS activity_types_name_unique_ci
  ON activity_types (LOWER(TRIM(name)));

-- Seed required defaults
INSERT INTO activity_types (name) VALUES ('project') ON CONFLICT DO NOTHING;
INSERT INTO activity_types (name) VALUES ('achievement') ON CONFLICT DO NOTHING;
INSERT INTO activity_types (name) VALUES ('hackathon entry progress') ON CONFLICT DO NOTHING;

-- Backfill allowed values from legacy free-text columns when they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_coordinators' AND column_name = 'activity_type'
  ) THEN
    INSERT INTO activity_types (name)
    SELECT DISTINCT TRIM(activity_type)
      FROM activity_coordinators
     WHERE activity_type IS NOT NULL
       AND TRIM(activity_type) <> ''
    ON CONFLICT DO NOTHING;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'activity_type'
  ) THEN
    INSERT INTO activity_types (name)
    SELECT DISTINCT TRIM(activity_type)
      FROM projects
     WHERE activity_type IS NOT NULL
       AND TRIM(activity_type) <> ''
    ON CONFLICT DO NOTHING;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'achievements' AND column_name = 'activity_type'
  ) THEN
    INSERT INTO activity_types (name)
    SELECT DISTINCT TRIM(activity_type)
      FROM achievements
     WHERE activity_type IS NOT NULL
       AND TRIM(activity_type) <> ''
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Add FK columns
-- ----------------------------------------------------------------------------
ALTER TABLE projects ADD COLUMN IF NOT EXISTS activity_type_id INTEGER;
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS activity_type_id INTEGER;
ALTER TABLE activity_coordinators ADD COLUMN IF NOT EXISTS activity_type_id INTEGER;

-- ----------------------------------------------------------------------------
-- 3. Backfill FK columns from legacy free-text columns
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'activity_type'
  ) THEN
    UPDATE projects p
       SET activity_type_id = at.id
      FROM activity_types at
     WHERE p.activity_type_id IS NULL
       AND p.activity_type IS NOT NULL
       AND LOWER(TRIM(at.name)) = LOWER(TRIM(p.activity_type));
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'achievements' AND column_name = 'activity_type'
  ) THEN
    UPDATE achievements a
       SET activity_type_id = at.id
      FROM activity_types at
     WHERE a.activity_type_id IS NULL
       AND a.activity_type IS NOT NULL
       AND LOWER(TRIM(at.name)) = LOWER(TRIM(a.activity_type));
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_coordinators' AND column_name = 'activity_type'
  ) THEN
    UPDATE activity_coordinators ac
       SET activity_type_id = at.id
      FROM activity_types at
     WHERE ac.activity_type_id IS NULL
       AND ac.activity_type IS NOT NULL
       AND LOWER(TRIM(at.name)) = LOWER(TRIM(ac.activity_type));
  END IF;
END $$;

-- Fallbacks for old rows with null/blank legacy activity values
UPDATE projects
   SET activity_type_id = (
     SELECT id FROM activity_types WHERE LOWER(TRIM(name)) = 'project' LIMIT 1
   )
 WHERE activity_type_id IS NULL;

UPDATE achievements
   SET activity_type_id = (
     SELECT id FROM activity_types WHERE LOWER(TRIM(name)) = 'achievement' LIMIT 1
   )
 WHERE activity_type_id IS NULL;

-- activity_coordinators.activity_type was NOT NULL historically, so this should
-- only affect malformed legacy rows.
UPDATE activity_coordinators
   SET activity_type_id = (
     SELECT id FROM activity_types WHERE LOWER(TRIM(name)) = 'project' LIMIT 1
   )
 WHERE activity_type_id IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Constraints and indexes
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_projects_activity_type_id'
      AND conrelid = 'projects'::regclass
  ) THEN
    ALTER TABLE projects
      ADD CONSTRAINT fk_projects_activity_type_id
      FOREIGN KEY (activity_type_id) REFERENCES activity_types(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_achievements_activity_type_id'
      AND conrelid = 'achievements'::regclass
  ) THEN
    ALTER TABLE achievements
      ADD CONSTRAINT fk_achievements_activity_type_id
      FOREIGN KEY (activity_type_id) REFERENCES activity_types(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_activity_coordinators_activity_type_id'
      AND conrelid = 'activity_coordinators'::regclass
  ) THEN
    ALTER TABLE activity_coordinators
      ADD CONSTRAINT fk_activity_coordinators_activity_type_id
      FOREIGN KEY (activity_type_id) REFERENCES activity_types(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_activity_type_id
  ON projects(activity_type_id);
CREATE INDEX IF NOT EXISTS idx_achievements_activity_type_id
  ON achievements(activity_type_id);
CREATE INDEX IF NOT EXISTS idx_activity_coordinators_activity_type_id
  ON activity_coordinators(activity_type_id);

-- Replace old uniqueness with FK-based uniqueness
DROP INDEX IF EXISTS activity_coordinators_type_staff_unique;
ALTER TABLE activity_coordinators
  DROP CONSTRAINT IF EXISTS activity_coordinators_activity_type_staff_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS activity_coordinators_type_id_staff_unique
  ON activity_coordinators (activity_type_id, staff_id);

ALTER TABLE projects ALTER COLUMN activity_type_id SET NOT NULL;
ALTER TABLE achievements ALTER COLUMN activity_type_id SET NOT NULL;
ALTER TABLE activity_coordinators ALTER COLUMN activity_type_id SET NOT NULL;

-- ----------------------------------------------------------------------------
-- 5. Drop legacy free-text columns
-- ----------------------------------------------------------------------------
ALTER TABLE projects DROP COLUMN IF EXISTS activity_type;
ALTER TABLE achievements DROP COLUMN IF EXISTS activity_type;
ALTER TABLE activity_coordinators DROP COLUMN IF EXISTS activity_type;

-- ----------------------------------------------------------------------------
-- 6. Record migration
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'schema_version'
  ) THEN
    INSERT INTO schema_version (version, description)
    VALUES (8, 'Normalize activity types with lookup table and FK-based coordinator mapping')
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;
