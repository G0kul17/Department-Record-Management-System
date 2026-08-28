-- Migration 012: Faculty Participation Event Types Table
CREATE TABLE IF NOT EXISTS faculty_event_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS faculty_event_types_name_unique_ci
  ON faculty_event_types (LOWER(TRIM(name)));

INSERT INTO faculty_event_types (name) VALUES
  ('Certification'),
  ('Conference Presentation'),
  ('Conference Publications'),
  ('FDP'),
  ('Hackathon'),
  ('Industrial Training'),
  ('Journal Publications'),
  ('NPTEL - FDP'),
  ('NPTEL Certification'),
  ('Professional Development Course'),
  ('Resource Person'),
  ('Reviewer'),
  ('Seminar'),
  ('Special Awards Received'),
  ('STTP'),
  ('Webinar'),
  ('Workshop')
ON CONFLICT DO NOTHING;
