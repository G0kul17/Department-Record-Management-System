-- ============================================================================
-- Migration: 013_audit_logs.sql
-- Description: Creates audit_logs table for system audit trail & active logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  action_type VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  item_title VARCHAR(500) NOT NULL,
  user_id INTEGER,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  details JSONB,
  created_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
