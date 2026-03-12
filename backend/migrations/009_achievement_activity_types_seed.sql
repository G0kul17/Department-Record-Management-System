-- ============================================================================
-- Migration 009: Seed concrete achievement activity types
-- Description:
--   1) Inserts the same achievement type values used in student achievement UI
--   2) Expands any generic 'achievement' coordinator mappings to concrete types
--   3) Backfills achievements.activity_type_id from title when currently generic
-- ============================================================================

-- Canonical achievement type values used by frontend dropdowns.
INSERT INTO activity_types (name) VALUES ('Hackathon') ON CONFLICT DO NOTHING;
INSERT INTO activity_types (name) VALUES ('Paper presentation') ON CONFLICT DO NOTHING;
INSERT INTO activity_types (name) VALUES ('Coding competition') ON CONFLICT DO NOTHING;
INSERT INTO activity_types (name) VALUES ('Conference presentation') ON CONFLICT DO NOTHING;
INSERT INTO activity_types (name) VALUES ('Journal publications') ON CONFLICT DO NOTHING;
INSERT INTO activity_types (name) VALUES ('NPTEL certificate') ON CONFLICT DO NOTHING;
INSERT INTO activity_types (name) VALUES ('Internship certificate') ON CONFLICT DO NOTHING;
INSERT INTO activity_types (name) VALUES ('Other MOOC courses') ON CONFLICT DO NOTHING;

DO $$
DECLARE
  v_generic_achievement_type_id INTEGER;
BEGIN
  SELECT id INTO v_generic_achievement_type_id
    FROM activity_types
   WHERE LOWER(TRIM(name)) = 'achievement'
   LIMIT 1;

  -- If generic mapping exists, expand it to all concrete achievement types.
  IF v_generic_achievement_type_id IS NOT NULL THEN
    INSERT INTO activity_coordinators (activity_type_id, staff_id)
    SELECT at.id, ac.staff_id
      FROM activity_coordinators ac
      JOIN activity_types at
        ON LOWER(TRIM(at.name)) IN (
             'hackathon',
             'paper presentation',
             'coding competition',
             'conference presentation',
             'journal publications',
             'nptel certificate',
             'internship certificate',
             'other mooc courses'
           )
     WHERE ac.activity_type_id = v_generic_achievement_type_id
    ON CONFLICT DO NOTHING;

    -- Backfill old achievements that still point to generic 'achievement'.
    UPDATE achievements a
       SET activity_type_id = at.id
      FROM activity_types at
     WHERE a.activity_type_id = v_generic_achievement_type_id
       AND LOWER(TRIM(at.name)) = LOWER(TRIM(a.title));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'schema_version'
  ) THEN
    INSERT INTO schema_version (version, description)
    VALUES (9, 'Seed concrete achievement activity types and expand coordinator mappings')
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;
