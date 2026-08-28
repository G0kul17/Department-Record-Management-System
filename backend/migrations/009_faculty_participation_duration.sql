-- Migration 009: Add duration column to faculty_participations table
ALTER TABLE faculty_participations ADD COLUMN IF NOT EXISTS duration VARCHAR(100);
