// src/utils/mailClient.js
//
// Sends outbound email by posting to the mail-worker HTTP microservice.
// The backend never touches SMTP directly — all delivery config lives in
// the mail-worker process.
//
// OTP callers use fire-and-forget (.catch()) so auth endpoints are not
// blocked by mail delivery latency.

import logger from "./logger.js";
import { getTraceCtx } from "./traceStore.js";
import dotenv from "dotenv";
dotenv.config();

const MAIL_WORKER_URL    = process.env.MAIL_WORKER_URL;
const MAIL_WORKER_SECRET = process.env.MAIL_WORKER_SECRET || "";

/**
 * Dispatch an outbound email via the mail-worker service.
 *
 * @param {{ to: string, subject: string, text?: string, html?: string }} opts
 * @returns {Promise<void>}
 */
export async function enqueueMail({ to, subject, text, html }) {
  const ctx = getTraceCtx();

  if (!MAIL_WORKER_URL) {
    throw new Error("MAIL_WORKER_URL is not configured — set it in backend .env");
  }

  const res = await fetch(`${MAIL_WORKER_URL}/api/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(MAIL_WORKER_SECRET ? { Authorization: `Bearer ${MAIL_WORKER_SECRET}` } : {}),
    },
    body: JSON.stringify({ to, subject, text: text ?? null, html: html ?? null }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`mail-worker responded ${res.status}: ${body}`);
  }

  logger.debug("mail.dispatched", {
    "email.to":      to,
    "email.subject": subject,
    ...ctx,
  });
}
