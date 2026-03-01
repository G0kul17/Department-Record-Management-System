-- ============================================================================
-- Migration 003: Schema correctness fixes
-- Addresses issues found in 001_initial_schema.sql for existing databases:
--   1. achievements.event_id FK was never created (forward-reference bug in 001)
--   2. activity_coordinators has conflicting case-sensitive + case-insensitive
--      unique constraints; drop the redundant case-sensitive one
--   3. Missing index on otp_verifications(email) — every OTP lookup was a seq scan
--   4. achievements UNIQUE was on (user_id, title, date) but the application
--      duplicate-checks using date_of_award — align constraint with app logic
--   5. Missing FK constraints on achievements.user_id, achievements.verified_by,
--      and project_files.uploaded_by (NOT VALID skips validation of existing rows)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add achievements.event_id FK (safe for DBs where 001 ran without it)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'achievements_event_id_fkey'
      AND conrelid = 'achievements'::regclass
  ) THEN
    ALTER TABLE achievements
      ADD CONSTRAINT achievements_event_id_fkey
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Remove the case-sensitive UNIQUE(activity_type, staff_id) constraint from
--    activity_coordinators. The LOWER()-based unique index
--    (activity_coordinators_type_staff_unique) is stricter and sufficient.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_conname text;
BEGIN
  -- Find any plain unique constraint on the table that is NOT the LOWER()-based
  -- index (which is an index, not a pg_constraint row).
  SELECT c.conname INTO v_conname
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'activity_coordinators'
    AND c.contype = 'u';   -- 'u' = unique constraint (not an index)

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE activity_coordinators DROP CONSTRAINT %I', v_conname);
    RAISE NOTICE 'Dropped redundant case-sensitive constraint: %', v_conname;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Index on otp_verifications(email) — needed for OTP lookups and attempt
--    counter updates added by KAN-5
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email
  ON otp_verifications(email);

-- ----------------------------------------------------------------------------
-- 4. Fix achievements UNIQUE constraint: replace (user_id, title, date) with
--    (user_id, title, date_of_award) to match what the application queries.
--    Wrapped in an exception block so existing duplicate data doesn't hard-fail.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Drop the old constraint (may not exist on DBs where 001 failed partially)
  ALTER TABLE achievements
    DROP CONSTRAINT IF EXISTS achievements_user_id_title_date_key;

  -- Add the corrected constraint if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ux_achievements_user_title_date_of_award'
      AND conrelid = 'achievements'::regclass
  ) THEN
    ALTER TABLE achievements
      ADD CONSTRAINT ux_achievements_user_title_date_of_award
      UNIQUE (user_id, title, date_of_award);
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not replace achievements unique constraint (duplicate data may exist): %', SQLERRM;
END $$;

-- ----------------------------------------------------------------------------
-- 5. Add missing FK constraints
--    NOT VALID defers validation of pre-existing rows so the migration never
--    fails on an established database with orphaned records.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- achievements.user_id → users(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_achievements_user_id'
      AND conrelid = 'achievements'::regclass
  ) THEN
    ALTER TABLE achievements
      ADD CONSTRAINT fk_achievements_user_id
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID;
  END IF;

  -- achievements.verified_by → users(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_achievements_verified_by'
      AND conrelid = 'achievements'::regclass
  ) THEN
    ALTER TABLE achievements
      ADD CONSTRAINT fk_achievements_verified_by
      FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL NOT VALID;
  END IF;

  -- project_files.uploaded_by → users(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_project_files_uploaded_by'
      AND conrelid = 'project_files'::regclass
  ) THEN
    ALTER TABLE project_files
      ADD CONSTRAINT fk_project_files_uploaded_by
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL NOT VALID;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Record migration
-- ----------------------------------------------------------------------------
INSERT INTO schema_version (version, description)
VALUES (3, 'Schema fixes: event FK ordering, duplicate constraints, otp index, achievements unique, missing FKs')
ON CONFLICT (version) DO NOTHING;
