-- ============================================================================
-- DRMS - Hackathon Entry and Progress Migration
-- Version: 006
-- Description: Creates hackathons table for tracking student hackathon participation
-- ============================================================================

-- Hackathons table
CREATE TABLE IF NOT EXISTS hackathons (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(30) NOT NULL,
  team_leader_name VARCHAR(255) NOT NULL,
  team_members_count INTEGER DEFAULT 1,
  team_member_names TEXT NOT NULL,
  hackathon_name VARCHAR(500) NOT NULL,
  mentor VARCHAR(255),
  hosted_by VARCHAR(255) NOT NULL,
  location VARCHAR(500) NOT NULL,
  duration_start_date DATE NOT NULL,
  duration_end_date DATE,
  no_of_rounds INTEGER CHECK (no_of_rounds >= 1 AND no_of_rounds <= 5),
  progress VARCHAR(50) CHECK (progress IN ('Registered', 'Shortlisted', 'Not shortlisted')) NOT NULL,
  prize VARCHAR(255),
  proof_file_id INTEGER REFERENCES project_files(id),
  verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(20) DEFAULT 'pending',
  verification_comment TEXT,
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hackathons_user_id ON hackathons(user_id);
CREATE INDEX IF NOT EXISTS idx_hackathons_verified ON hackathons(verified);
CREATE INDEX IF NOT EXISTS idx_hackathons_verification_status ON hackathons(verification_status);
CREATE INDEX IF NOT EXISTS idx_hackathons_progress ON hackathons(progress);
CREATE INDEX IF NOT EXISTS idx_hackathons_created_at ON hackathons(created_at);

-- Update schema version (commented out - table may not exist yet)
-- INSERT INTO schema_version (version, description) 
-- VALUES (6, 'Hackathon Entry and Progress table')
-- ON CONFLICT (version) DO NOTHING;
