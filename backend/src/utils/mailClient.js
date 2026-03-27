// src/utils/mailClient.js
//
// Drop-in replacement for sendMail() from config/mailer.js.
// Instead of calling SMTP directly, inserts a row into the mail_queue table.
// The mail-worker process polls that table and handles delivery, retries, and
// back-off — completely decoupled from the main HTTP request cycle.

import pool from "../config/db.js";
import logger from "./logger.js";
import { getTraceCtx } from "./traceStore.js";

/**
 * Enqueue an outbound email for asynchronous delivery by the mail-worker.
 *
 * @param {{ to: string, subject: string, text?: string, html?: string }} opts
 * @returns {Promise<void>} Resolves once the row is written to mail_queue.
 *   Callers that want fire-and-forget should wrap with .catch().
 */
export async function enqueueMail({ to, subject, text, html }) {
  const ctx = getTraceCtx();
  await pool.query(
    `INSERT INTO mail_queue (to_email, subject, text_body, html_body)
     VALUES ($1, $2, $3, $4)`,
    [to, subject, text ?? null, html ?? null],
  );
  logger.debug("mail.enqueued", {
    "email.to": to,
    "email.subject": subject,
    ...ctx,
  });
}
