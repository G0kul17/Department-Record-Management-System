// src/utils/mailClient.js
//
// Non-blocking mail dispatch. Starts the SMTP send in the background and
// returns immediately so the HTTP request cycle is never held up by mail
// delivery latency or a slow/unavailable SMTP server.
//
// Delivery errors are logged but never propagate to the caller.

import { sendMail } from "../config/mailer.js";
import logger from "./logger.js";
import { getTraceCtx } from "./traceStore.js";

/**
 * Send an email in the background — returns immediately, does not block.
 *
 * @param {{ to: string, subject: string, text?: string, html?: string }} opts
 */
export function enqueueMail({ to, subject, text, html }) {
  const ctx = getTraceCtx();
  // Intentionally not awaited. The promise is detached from the request cycle;
  // any SMTP error is caught here and logged rather than surfaced to the caller.
  sendMail({ to, subject, text, html }).catch((err) =>
    logger.error("mail.send.error", {
      err,
      "email.to": to,
      "email.subject": subject,
      ...ctx,
    }),
  );
}
