import nodemailer from "nodemailer";
import dotenv from "dotenv";
import logger from "../utils/logger.js";
import { getTraceCtx } from "../utils/traceStore.js";
dotenv.config();

// If mail env is not configured, fall back to a no-op sender for local dev
const isGmailService = !!process.env.EMAIL_SERVICE;
const isMailConfigured =
  (isGmailService && !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS) ||
  (!!process.env.EMAIL_HOST &&
    !!process.env.EMAIL_USER &&
    !!process.env.EMAIL_PASS);

let transporter = null;
if (isMailConfigured) {
  if (isGmailService) {
    // e.g., EMAIL_SERVICE=gmail with App Password
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: String(process.env.EMAIL_PORT) === "465",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
}

export async function sendMail({ to, subject, text, html }) {
  if (!isMailConfigured) {
    // Never silently skip — a missing email config means the OTP can never
    // reach the user, which would allow account creation with undeliverable
    // addresses. Fail loudly so the operator knows to configure EMAIL_* vars.
    throw new Error(
      "Email service is not configured (EMAIL_USER / EMAIL_PASS missing). " +
        "Set the required environment variables to enable OTP delivery."
    );
  }

  const ctx = getTraceCtx();
  const meta = { "email.to": to, "email.subject": subject };
  const startNs = process.hrtime.bigint();

  logger.debug("mail.send.start", { ...meta, ...ctx });

  try {
    const info = await transporter.sendMail({
      from: `"DRMS Notifications" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    const durationMs = Math.round(Number(process.hrtime.bigint() - startNs) / 1_000_000 * 100) / 100;
    logger.info("mail.send.complete", {
      ...meta,
      "event.duration_ms": durationMs,
      "email.message_id": info.messageId,
      ...ctx,
    });

    return info;
  } catch (err) {
    const durationMs = Math.round(Number(process.hrtime.bigint() - startNs) / 1_000_000 * 100) / 100;
    logger.error("mail.send.error", {
      err,
      ...meta,
      "event.duration_ms": durationMs,
      ...ctx,
    });
    throw err;
  }
}
