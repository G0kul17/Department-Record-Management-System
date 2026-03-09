-- ============================================================================
-- Migration 002: Add attempt counter to otp_verifications
-- Supports brute-force lockout after 5 failed OTP attempts (KAN-5)
-- ============================================================================

ALTER TABLE otp_verifications
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;

INSERT INTO schema_version (version, description)
VALUES (2, 'Add attempts column to otp_verifications for brute-force lockout')
ON CONFLICT (version) DO NOTHING;
