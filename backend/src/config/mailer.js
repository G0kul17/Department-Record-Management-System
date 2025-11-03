import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// If mail env is not configured, fall back to a no-op sender for local dev
const isMailConfigured =
  !!process.env.EMAIL_HOST &&
  !!process.env.EMAIL_USER &&
  !!process.env.EMAIL_PASS;

let transporter = null;
if (isMailConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: String(process.env.EMAIL_PORT) === "465", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
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

  const info = await transporter.sendMail({
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
  return info;
}
