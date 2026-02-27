-- ============================================================================
-- DRMS (Department Record Management System) - Initial Schema Migration
-- Version: 001
-- Description: Creates all tables, indexes, and constraints for initial setup
-- Run this migration ONCE before starting the application for the first time
-- ============================================================================

-- Schema version tracking table
CREATE TABLE IF NOT EXISTS schema_version (
  version INT PRIMARY KEY,
  description VARCHAR(500),
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CORE AUTHENTICATION TABLES
-- ============================================================================

-- Users table (students, staff, admin)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(20) CHECK (role IN ('admin', 'staff', 'student', 'alumni')),
  full_name VARCHAR(255),
  phone VARCHAR(30),
  roll_number VARCHAR(50),
  profile_details JSONB,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP verification table
CREATE TABLE IF NOT EXISTS otp_verifications (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- Session-based authentication table (90-day expiration)
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  device_info JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE (session_token)
);

-- Indexes for session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- ============================================================================
-- PROJECT FILES TABLE (referenced by multiple tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  filename VARCHAR(1024) NOT NULL,
  original_name VARCHAR(1024),
  mime_type VARCHAR(255),
  size BIGINT,
  file_type VARCHAR(50),
  uploaded_by INTEGER,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  team INTEGER[] DEFAULT '{}',
  team_members_count INTEGER,
  team_member_names TEXT,
  github_url TEXT,
  mentor_name VARCHAR(255),
  academic_year VARCHAR(10),
  activity_type VARCHAR(100) DEFAULT 'project',
  status VARCHAR(20) DEFAULT 'ongoing',
  files JSONB,
  verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(20) DEFAULT 'pending',
  verification_comment TEXT,
  verified_by INTEGER,
  verified_at TIMESTAMP,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS ux_projects_title_mentorname_year
  ON projects (title, mentor_name, academic_year);

-- Constraints for ZIP file uploads (idempotent - safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ck_project_files_zip_mime'
  ) THEN
    ALTER TABLE project_files
      ADD CONSTRAINT ck_project_files_zip_mime
      CHECK (
        file_type <> 'code_zip' OR mime_type IN ('application/zip', 'application/x-zip-compressed')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ck_project_files_zip_size'
  ) THEN
    ALTER TABLE project_files
      ADD CONSTRAINT ck_project_files_zip_size
      CHECK (
        file_type <> 'code_zip' OR size <= 15728640  -- 15MB
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_project_files_project_id'
  ) THEN
    ALTER TABLE project_files 
      ADD CONSTRAINT fk_project_files_project_id 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- One ZIP per project constraint
CREATE UNIQUE INDEX IF NOT EXISTS ux_project_files_one_zip_per_project
  ON project_files(project_id)
  WHERE file_type = 'code_zip';

-- ============================================================================
-- ACHIEVEMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  name VARCHAR(255),
  date DATE,
  date_of_award DATE,
  event_name VARCHAR(255),
  activity_type VARCHAR(100),
  issuer VARCHAR(255),
  position VARCHAR(50),
  prize_amount DECIMAL(10, 2),
  academic_year VARCHAR(10),
  proof_file_id INTEGER,
  certificate_file_id INTEGER,
  event_photos_file_id INTEGER,
  verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(20) DEFAULT 'pending',
  verification_comment TEXT,
  verified_by INTEGER,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, title, date)
);

-- Foreign key for proof files (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_achievements_proof_file_id'
  ) THEN
    ALTER TABLE achievements 
      ADD CONSTRAINT fk_achievements_proof_file_id 
      FOREIGN KEY (proof_file_id) REFERENCES project_files(id);
  END IF;
END $$;

-- ============================================================================
-- ACTIVITY COORDINATORS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_coordinators (
  id SERIAL PRIMARY KEY,
  activity_type VARCHAR(100) NOT NULL,
  staff_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(activity_type, staff_id)
);

-- Case-insensitive unique index
CREATE UNIQUE INDEX IF NOT EXISTS activity_coordinators_type_staff_unique 
  ON activity_coordinators (LOWER(activity_type), staff_id);

-- ============================================================================
-- STAFF ANNOUNCEMENTS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff_announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  message TEXT NOT NULL,
  brochure_file_id INTEGER,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_announcement_recipients (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES staff_announcements(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_announcement_recipients_user
  ON staff_announcement_recipients(user_id);

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  venue VARCHAR(255),
  event_url TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  organizer_id INTEGER REFERENCES users(id),
  attachments JSONB,
  thumbnail_filename VARCHAR(1024),
  thumbnail_original_name VARCHAR(1024),
  thumbnail_mime VARCHAR(255),
  thumbnail_size BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_date);

-- ============================================================================
-- FACULTY PARTICIPATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS faculty_participations (
  id SERIAL PRIMARY KEY,
  faculty_name VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  type_of_event VARCHAR(100) NOT NULL,
  mode_of_training VARCHAR(20) NOT NULL,
  title VARCHAR(500) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  conducted_by VARCHAR(255),
  details TEXT,
  
  -- Publications fields
  publications_type VARCHAR(50),
  claiming_faculty_name VARCHAR(255),
  publication_indexing VARCHAR(100),
  authors_list TEXT,
  paper_title VARCHAR(500),
  journal_name VARCHAR(255),
  volume_no VARCHAR(50),
  issue_no VARCHAR(50),
  page_or_doi VARCHAR(100),
  issn_or_isbn VARCHAR(100),
  pub_month_year VARCHAR(10),
  academic_year VARCHAR(10),
  citations_count INTEGER,
  paper_url TEXT,
  journal_home_url TEXT,
  publisher VARCHAR(255),
  impact_factor NUMERIC(6,2),
  indexed_in_db VARCHAR(10),
  full_paper_drive_link TEXT,
  first_page_drive_link TEXT,
  sdg_mapping VARCHAR(255),
  joint_publication_with VARCHAR(100),
  publication_domain VARCHAR(255),
  coauthors_students VARCHAR(50),
  
  proof_file_id INTEGER REFERENCES project_files(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_faculty_participations_dept
  ON faculty_participations(department);
CREATE INDEX IF NOT EXISTS idx_faculty_participations_type
  ON faculty_participations(type_of_event);
CREATE INDEX IF NOT EXISTS idx_faculty_participations_created_by
  ON faculty_participations(created_by);

-- ============================================================================
-- FACULTY RESEARCH TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS faculty_research (
  id SERIAL PRIMARY KEY,
  faculty_name VARCHAR(255),
  funded_type VARCHAR(50) NOT NULL,
  principal_investigator VARCHAR(255) NOT NULL,
  team_members TEXT,
  title VARCHAR(500) NOT NULL,
  agency VARCHAR(255),
  current_status VARCHAR(50) NOT NULL,
  duration VARCHAR(100),
  start_date DATE,
  end_date DATE,
  amount NUMERIC(15,2),
  proof_file_id INTEGER REFERENCES project_files(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_faculty_research_agency
  ON faculty_research(agency);
CREATE INDEX IF NOT EXISTS idx_faculty_research_status
  ON faculty_research(current_status);
CREATE INDEX IF NOT EXISTS idx_faculty_research_creator
  ON faculty_research(created_by);

-- ============================================================================
-- FACULTY CONSULTANCY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS faculty_consultancy (
  id SERIAL PRIMARY KEY,
  faculty_name VARCHAR(255),
  team_members TEXT,
  agency VARCHAR(255) NOT NULL,
  amount NUMERIC(15,2),
  duration VARCHAR(100),
  start_date DATE,
  end_date DATE,
  proof_file_id INTEGER REFERENCES project_files(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_faculty_consultancy_agency
  ON faculty_consultancy(agency);
CREATE INDEX IF NOT EXISTS idx_faculty_consultancy_creator
  ON faculty_consultancy(created_by);

-- ============================================================================
-- STAFF DATA UPLOADS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff_uploads_with_document (
  id SERIAL PRIMARY KEY,
  uploader_name VARCHAR(255) NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  uploader_role VARCHAR(20),
  original_filename VARCHAR(500),
  stored_filename VARCHAR(500),
  file_type VARCHAR(20),
  total_rows INTEGER,
  documents JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_uploads_uploaded_by
  ON staff_uploads_with_document(uploaded_by);

-- ============================================================================
-- STUDENT PROFILES TABLE
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

-- Indexes for student profile search
CREATE INDEX IF NOT EXISTS idx_users_student_regno
  ON users ((profile_details->>'register_number'));
CREATE INDEX IF NOT EXISTS idx_users_student_contact
  ON users ((profile_details->>'contact_number'));

-- ============================================================================
-- RECORD SCHEMA VERSION
-- ============================================================================

INSERT INTO schema_version (version, description) 
VALUES (1, 'Initial schema: All core tables, indexes, and constraints')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Database structure created successfully
-- Application can now start without runtime schema modifications
-- ============================================================================
