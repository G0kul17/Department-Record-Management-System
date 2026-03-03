-- ============================================================================
-- Migration 004: Ensure student_profiles table exists
-- The table was defined in 001_initial_schema.sql but databases that were
-- set up before that definition was added (or via a partial migration run)
-- are missing it, causing ERR 42P01 ("relation does not exist") on student
-- login (authController.js loginVerifyOTP).
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  register_number VARCHAR(50),
  contact_number VARCHAR(20),
  leetcode_url TEXT,
  hackerrank_url TEXT,
  codechef_url TEXT,
  github_url TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_user
  ON student_profiles(user_id);

INSERT INTO schema_version (version, description)
VALUES (4, 'Ensure student_profiles table exists for databases with partial 001 run')
ON CONFLICT (version) DO NOTHING;
