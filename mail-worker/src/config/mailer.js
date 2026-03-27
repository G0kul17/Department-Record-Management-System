// mail-worker/src/config/mailer.js
// Nodemailer transporter pointing at the Postfix SMTP relay.
// The relay runs on a separate trusted server; TLS and auth are optional.

import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const auth =
  process.env.SMTP_RELAY_USER
    ? { user: process.env.SMTP_RELAY_USER, pass: process.env.SMTP_RELAY_PASS }
    : undefined;

export const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_RELAY_HOST,
  port:   Number(process.env.SMTP_RELAY_PORT || 25),
  // Internal Postfix relay — plain SMTP, no forced TLS.
  // Set SMTP_RELAY_PORT=587 and add tls: { rejectUnauthorized: false } if needed.
  secure: false,
  ...(auth ? { auth } : {}),
});

export const FROM_ADDRESS =
  process.env.SMTP_RELAY_FROM || "noreply@example.com";
