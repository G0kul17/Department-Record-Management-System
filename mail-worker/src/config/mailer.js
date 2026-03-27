// mail-worker/src/config/mailer.js
// Nodemailer transporter — same Gmail / custom-SMTP dual-mode logic as the
// original backend mailer, just living here in the mail-worker instead.

import nodemailer from "nodemailer";
import dotenv from "dotenv";
import logger from "../utils/logger.js";
dotenv.config();

const isGmailService = !!process.env.EMAIL_SERVICE;
const isMailConfigured =
  (isGmailService && !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS) ||
  (!isGmailService && !!process.env.EMAIL_HOST && !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS);

if (!isMailConfigured) {
  logger.warn("mail-worker: EMAIL_* vars not fully set — sendMail will throw until configured");
}

let transporter = null;
if (isMailConfigured) {
  if (isGmailService) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  } else {
    transporter = nodemailer.createTransport({
      host:   process.env.EMAIL_HOST,
      port:   Number(process.env.EMAIL_PORT || 587),
      secure: String(process.env.EMAIL_PORT) === "465",
      auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
}

export async function sendMail({ to, subject, text, html }) {
  if (!isMailConfigured || !transporter) {
    throw new Error(
      "Email service is not configured (EMAIL_USER / EMAIL_PASS missing in mail-worker).",
    );
  }

  const startNs = process.hrtime.bigint();
  const info = await transporter.sendMail({
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });

  const durationMs = Math.round(Number(process.hrtime.bigint() - startNs) / 1_000_000 * 100) / 100;
  logger.info("mail.sent", {
    "email.to":         to,
    "email.subject":    subject,
    "email.message_id": info.messageId,
    "event.duration_ms": durationMs,
  });

  return info;
}
