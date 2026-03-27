-- Migration 010: mail_queue table
-- Stores outbound email jobs for the mail-worker process.
-- The main backend inserts rows here instead of calling SMTP directly,
-- decoupling mail delivery from the HTTP request cycle.

CREATE TABLE IF NOT EXISTS mail_queue (
  id               BIGSERIAL    PRIMARY KEY,
  to_email         TEXT         NOT NULL,
  subject          TEXT         NOT NULL,
  text_body        TEXT,
  html_body        TEXT,
  -- pending → processing → sent | failed
  status           TEXT         NOT NULL DEFAULT 'pending',
  attempts         INTEGER      NOT NULL DEFAULT 0,
  max_attempts     INTEGER      NOT NULL DEFAULT 3,
  -- When the dispatcher should next attempt delivery (supports exp back-off)
  next_attempt_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  error_message    TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  sent_at          TIMESTAMPTZ
);

-- Partial index: only index rows the dispatcher needs to process.
CREATE INDEX IF NOT EXISTS idx_mail_queue_dispatch
  ON mail_queue (status, next_attempt_at)
  WHERE status IN ('pending', 'failed');
