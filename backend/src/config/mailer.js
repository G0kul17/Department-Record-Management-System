import nodemailer from "nodemailer";
import dotenv from "dotenv";
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
    console.warn(
      "[mailer] Email environment not configured. Skipping sendMail. Subject:",
      subject,
      "to:",
      to
    );
    return { skipped: true };
  }
  try {
    const info = await transporter.sendMail({
      from: `"No Reply" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    return info;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[mailer] sendMail failed in dev; continuing without email:",
        err?.message || err
      );
      return { skipped: true, error: err?.message || String(err) };
    }
    throw err;
  }
}
