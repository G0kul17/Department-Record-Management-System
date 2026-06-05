import pool, { getPoolHealth } from "../config/db.js";
import { transporter, isMailConfigured } from "../config/mailer.js";
import { STORAGE_PATH } from "../config/upload.js";
import fs from "fs";
import path from "path";
import logger from "./logger.js";

const firingAlerts = new Map();

async function checkDatabase() {
  await pool.query("SELECT COUNT(*) FROM users");
  const ph = getPoolHealth();
  if (ph.health.status === "critical") {
    throw new Error(`Pool critical — utilization high or error rate elevated`);
  }
}

async function checkEmail() {
  if (!isMailConfigured) {
    throw new Error("Email service not configured (EMAIL_USER/EMAIL_PASS missing)");
  }
  await transporter.verify();
}

async function checkStorage() {
  fs.accessSync(STORAGE_PATH, fs.constants.R_OK | fs.constants.W_OK);
  const testFile = path.join(STORAGE_PATH, `.health-${Date.now()}`);
  fs.writeFileSync(testFile, "ok");
  fs.unlinkSync(testFile);
}

async function checkOtpTable() {
  await pool.query("SELECT 1 FROM otp_verifications LIMIT 1");
}

const CHECKS = [
  { name: "db",      fn: checkDatabase },
  { name: "email",   fn: checkEmail    },
  { name: "storage", fn: checkStorage  },
  { name: "otp",     fn: checkOtpTable },
];

async function postZenduty(message, alertType, entityId, summary) {
  const url = process.env.ZENDUTY_WEBHOOK_URL;
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        alert_type: alertType,
        status: alertType === "info" ? "resolved" : "triggered",
        entity_id: entityId,
        summary,
      }),
    });
    logger.debug("health.zenduty.post", { entity_id: entityId, alert_type: alertType, "http.status": res.status });
  } catch (err) {
    logger.warn("health.zenduty.post.failed", { err, entity_id: entityId });
  }
}

export async function runHealthChecks() {
  for (const { name, fn } of CHECKS) {
    try {
      await fn();
      logger.debug(`health.check.ok`, { "health.check": name });
      if (firingAlerts.get(name)) {
        firingAlerts.set(name, false);
        logger.info("health.check.recovered", { "health.check": name });
        await postZenduty(
          `DRMS [${name}] recovered`,
          "info",
          `drms-${name}`,
          `${name} check recovered`,
        );
      }
    } catch (err) {
      logger.error("health.check.failed", { "health.check": name, err });
      if (!firingAlerts.get(name)) {
        firingAlerts.set(name, true);
        await postZenduty(
          `DRMS [${name}] failed: ${err.message}`,
          "critical",
          `drms-${name}`,
          err.message,
        );
      }
    }
  }
}

export function startHealthMonitor() {
  const interval = Number(process.env.HEALTH_CHECK_INTERVAL_MS) || 60_000;
  setInterval(() => {
    runHealthChecks().catch((err) => logger.error("health.monitor.error", { err }));
  }, interval);
  // Initial check shortly after startup
  setTimeout(() => {
    runHealthChecks().catch((err) => logger.error("health.monitor.initial.error", { err }));
  }, 5_000);
  logger.info("Health monitor started", { "health.interval_ms": interval });
}
