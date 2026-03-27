// mail-worker/src/worker/dispatcher.js
//
// Polls mail_queue for pending/retryable jobs and delivers them via the
// Postfix relay.  Uses SELECT … FOR UPDATE SKIP LOCKED so multiple worker
// instances can run safely without double-sending.
//
// Status lifecycle:
//   pending  → processing → sent
//                         → failed  (retryable, next_attempt_at set to future)
//                         → failed  (permanent, attempts >= max_attempts)

import pool              from "../config/db.js";
import { transporter, FROM_ADDRESS } from "../config/mailer.js";
import logger            from "../utils/logger.js";
import dotenv            from "dotenv";
dotenv.config();

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 5_000);
const MAX_ATTEMPTS     = Number(process.env.MAX_ATTEMPTS     || 3);
const BATCH_SIZE       = 10; // rows processed per tick

/**
 * Exponential back-off delay in seconds for a given attempt number (1-based).
 *   attempt 1 → 10 s
 *   attempt 2 → 60 s
 *   attempt 3 → permanent failure
 */
function backoffSeconds(attempt) {
  const schedule = [10, 60];
  return schedule[attempt - 1] ?? 90;
}

async function dispatchBatch() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Claim up to BATCH_SIZE rows atomically.
    const { rows: jobs } = await client.query(
      `SELECT id, to_email, subject, text_body, html_body, attempts
         FROM mail_queue
        WHERE status IN ('pending', 'failed')
          AND next_attempt_at <= NOW()
        ORDER BY next_attempt_at
        LIMIT $1
          FOR UPDATE SKIP LOCKED`,
      [BATCH_SIZE],
    );

    for (const job of jobs) {
      const newAttempts = job.attempts + 1;

      // Mark as processing so a concurrent worker won't pick it up.
      await client.query(
        `UPDATE mail_queue SET status = 'processing', attempts = $1 WHERE id = $2`,
        [newAttempts, job.id],
      );

      try {
        await transporter.sendMail({
          from:    `"No Reply" <${FROM_ADDRESS}>`,
          to:      job.to_email,
          subject: job.subject,
          text:    job.text_body  ?? undefined,
          html:    job.html_body  ?? undefined,
        });

        await client.query(
          `UPDATE mail_queue SET status = 'sent', sent_at = NOW() WHERE id = $1`,
          [job.id],
        );

        logger.info("mail.sent", {
          "mail_queue.id":  job.id,
          "email.to":       job.to_email,
          "email.subject":  job.subject,
          "mail.attempts":  newAttempts,
        });
      } catch (err) {
        const permanent = newAttempts >= MAX_ATTEMPTS;
        const delaySec  = backoffSeconds(newAttempts);
        const errorMsg  = permanent
          ? `max retries exceeded: ${err.message}`
          : err.message;

        await client.query(
          `UPDATE mail_queue
              SET status          = 'failed',
                  error_message   = $1,
                  next_attempt_at = NOW() + ($2 || ' seconds')::INTERVAL
            WHERE id = $3`,
          [errorMsg, delaySec, job.id],
        );

        const level = permanent ? "error" : "warn";
        logger[level]("mail.send.failed", {
          "mail_queue.id": job.id,
          "email.to":      job.to_email,
          "mail.attempts": newAttempts,
          "mail.permanent": permanent,
          err,
        });
      }
    }

    await client.query("COMMIT");
    return jobs.length;
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error("mail.dispatcher.error", { err });
    return 0;
  } finally {
    client.release();
  }
}

export function runDispatcher() {
  logger.info("mail.dispatcher.started", {
    "config.poll_interval_ms": POLL_INTERVAL_MS,
    "config.max_attempts":     MAX_ATTEMPTS,
  });

  const tick = async () => {
    try {
      const processed = await dispatchBatch();
      if (processed > 0) {
        logger.debug("mail.dispatcher.tick", { "mail.processed": processed });
      }
    } catch (err) {
      logger.error("mail.dispatcher.tick.error", { err });
    }
  };

  // Run once immediately, then on a fixed interval.
  tick();
  setInterval(tick, POLL_INTERVAL_MS);
}
