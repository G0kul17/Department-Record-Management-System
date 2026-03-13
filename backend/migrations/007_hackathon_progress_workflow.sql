-- ============================================================================
-- DRMS - Hackathon Progress Workflow Migration
-- Version: 007
-- Description:
--   1) Adds coordinator update metadata and deadline warning tracking fields
--   2) Expands hackathon progress values for multi-round updates
--   3) Increases allowed no_of_rounds upper bound from 5 to 10
-- ============================================================================

ALTER TABLE hackathons
  ADD COLUMN IF NOT EXISTS coordinator_updated_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS coordinator_updated_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deadline_warning_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deadline_warning_sent_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_hackathons_deadline_warning_sent
  ON hackathons(deadline_warning_sent);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'hackathons_no_of_rounds_check'
       AND conrelid = 'hackathons'::regclass
  ) THEN
    ALTER TABLE hackathons DROP CONSTRAINT hackathons_no_of_rounds_check;
  END IF;

  ALTER TABLE hackathons
    ADD CONSTRAINT hackathons_no_of_rounds_check
    CHECK (no_of_rounds >= 1 AND no_of_rounds <= 10);
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'hackathons_progress_check'
       AND conrelid = 'hackathons'::regclass
  ) THEN
    ALTER TABLE hackathons DROP CONSTRAINT hackathons_progress_check;
  END IF;

  ALTER TABLE hackathons
    ADD CONSTRAINT hackathons_progress_check
    CHECK (
      progress IN (
        'Registered',
        'Round 1 Qualified',
        'Round 2 Qualified',
        'Round 3 Qualified',
        'Finalist',
        'Winner',
        'Runner-up',
        'Shortlisted',
        'Completed',
        'Not shortlisted'
      )
    );
END $$;

-- Mark schema version when schema_version table exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'schema_version'
  ) THEN
    INSERT INTO schema_version (version, description)
    VALUES (7, 'Hackathon progress workflow and warning tracking')
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;
