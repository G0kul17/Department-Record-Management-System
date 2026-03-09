-- ============================================================================
-- Migration 005: Ensure faculty, activity coordinator and announcement tables exist
-- Databases set up before these features were added to 001_initial_schema.sql
-- are missing these tables, causing ERR 42P01 at runtime.
-- All statements use IF NOT EXISTS so the migration is safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- activity_coordinators
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_coordinators (
  id SERIAL PRIMARY KEY,
  activity_type VARCHAR(100) NOT NULL,
  staff_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(activity_type, staff_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS activity_coordinators_type_staff_unique
  ON activity_coordinators (LOWER(activity_type), staff_id);

-- ----------------------------------------------------------------------------
-- staff_announcements
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  message TEXT NOT NULL,
  brochure_file_id INTEGER,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- staff_announcement_recipients
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_announcement_recipients (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES staff_announcements(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_announcement_recipients_user
  ON staff_announcement_recipients(user_id);

-- ----------------------------------------------------------------------------
-- faculty_participations
-- ----------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_faculty_participations_dept
  ON faculty_participations(department);
CREATE INDEX IF NOT EXISTS idx_faculty_participations_type
  ON faculty_participations(type_of_event);
CREATE INDEX IF NOT EXISTS idx_faculty_participations_created_by
  ON faculty_participations(created_by);

-- ----------------------------------------------------------------------------
-- faculty_research
-- ----------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_faculty_research_agency
  ON faculty_research(agency);
CREATE INDEX IF NOT EXISTS idx_faculty_research_status
  ON faculty_research(current_status);
CREATE INDEX IF NOT EXISTS idx_faculty_research_creator
  ON faculty_research(created_by);

-- ----------------------------------------------------------------------------
-- faculty_consultancy
-- ----------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_faculty_consultancy_agency
  ON faculty_consultancy(agency);
CREATE INDEX IF NOT EXISTS idx_faculty_consultancy_creator
  ON faculty_consultancy(created_by);

-- ----------------------------------------------------------------------------
-- Record migration
-- ----------------------------------------------------------------------------
INSERT INTO schema_version (version, description)
VALUES (5, 'Ensure activity_coordinators, staff_announcements, faculty_participations, faculty_research, faculty_consultancy tables exist')
ON CONFLICT (version) DO NOTHING;
