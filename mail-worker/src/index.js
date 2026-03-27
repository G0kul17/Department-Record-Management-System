// mail-worker/src/index.js
// Standalone HTTP mail microservice.
// The main backend POSTs { to, subject, text, html } here; this service
// delivers the email via SMTP (nodemailer) and returns immediately.
// No database, no queue — just a thin HTTP wrapper around nodemailer.

import dotenv from "dotenv";
dotenv.config();

import express      from "express";
import logger       from "./utils/logger.js";
import { sendMail } from "./config/mailer.js";

const PORT   = Number(process.env.MAIL_WORKER_PORT || 3001);
const SECRET = process.env.MAIL_WORKER_SECRET || "";

const app = express();
app.use(express.json());

// ── Bearer-token auth ────────────────────────────────────────────────────────
function requireSecret(req, res, next) {
  if (!SECRET) {
    // No secret configured — only allow in development
    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({ message: "MAIL_WORKER_SECRET must be set in production" });
    }
    return next();
  }
  const header = req.headers.authorization || "";
  if (header !== `Bearer ${SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// ── POST /api/send ───────────────────────────────────────────────────────────
app.post("/api/send", requireSecret, async (req, res) => {
  const { to, subject, text, html } = req.body ?? {};

  if (!to || !subject) {
    return res.status(400).json({ message: "'to' and 'subject' are required" });
  }

  try {
    await sendMail({ to, subject, text, html });
    return res.json({ message: "sent" });
  } catch (err) {
    logger.error("mail.send.failed", { err, "email.to": to, "email.subject": subject });
    return res.status(500).json({ message: "Failed to send email", detail: err.message });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  logger.info("mail-worker.started", { "server.port": PORT });
});

process.on("SIGTERM", () => { logger.info("mail-worker.shutdown"); process.exit(0); });
process.on("SIGINT",  () => { logger.info("mail-worker.shutdown"); process.exit(0); });
