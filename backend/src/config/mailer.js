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
    // Never silently skip — a missing email config means the OTP can never
    // reach the user, which would allow account creation with undeliverable
    // addresses. Fail loudly so the operator knows to configure EMAIL_* vars.
    throw new Error(
      "Email service is not configured (EMAIL_USER / EMAIL_PASS missing). " +
        "Set the required environment variables to enable OTP delivery."
    );
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
