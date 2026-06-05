import pool, { getPoolHealth } from "../config/db.js";
import { transporter, isMailConfigured } from "../config/mailer.js";
import { STORAGE_PATH } from "../config/upload.js";
import fs from "fs";
import path from "path";
import logger from "./logger.js";

const firingAlerts = new Map();

// Core tables the app cannot function without
const CORE_TABLES = [
  "users", "otp_verifications", "user_sessions", "projects",
  "achievements", "events", "faculty_participations",
  "faculty_research", "faculty_consultancy", "student_profiles",
];

async function checkDatabase() {
  // Verify pool is not in critical state
  const ph = getPoolHealth();
  if (ph.health.status === "critical") {
    throw new Error("Pool critical — utilization high or error rate elevated");
  }
  // Verify DB is writable (not a read-only replica or disk-full standby)
  const { rows } = await pool.query("SELECT pg_is_in_recovery() AS is_replica");
  if (rows[0].is_replica) throw new Error("Database is in read-only / recovery mode");
}

async function checkCoreTables() {
  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1)`,
    [CORE_TABLES],
  );
  const found = new Set(rows.map((r) => r.table_name));
  const missing = CORE_TABLES.filter((t) => !found.has(t));
  if (missing.length > 0) throw new Error(`Missing tables: ${missing.join(", ")}`);
}

async function checkEmail() {
  if (!isMailConfigured) {
    throw new Error("Email service not configured (EMAIL_USER/EMAIL_PASS missing)");
  }
  await transporter.verify();
}

async function checkStorage() {
  fs.accessSync(STORAGE_PATH, fs.constants.R_OK | fs.constants.W_OK);
  // Test actual write
  const testFile = path.join(STORAGE_PATH, `.health-${Date.now()}`);
  fs.writeFileSync(testFile, "ok");
  fs.unlinkSync(testFile);
  // Check disk usage — alert at 90%
  const stats = await fs.promises.statfs(STORAGE_PATH);
  const usedPct = Math.round((1 - stats.bavail / stats.blocks) * 100);
  if (usedPct >= 90) throw new Error(`Disk usage at ${usedPct}% — uploads may fail`);
}

const CHECKS = [
  { name: "db",     fn: checkDatabase   },
  { name: "tables", fn: checkCoreTables },
  { name: "email",  fn: checkEmail      },
  { name: "storage",fn: checkStorage    },
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
      logger.debug("health.check.ok", { "health.check": name });
      if (firingAlerts.get(name)) {
        firingAlerts.set(name, false);
        logger.info("health.check.recovered", { "health.check": name });
        await postZenduty(`DRMS [${name}] recovered`, "info", `drms-${name}`, `${name} check recovered`);
      }
    } catch (err) {
      // Only log + alert on first failure — firingAlerts prevents duplicates
      if (!firingAlerts.get(name)) {
        firingAlerts.set(name, true);
        logger.error("health.check.failed", { "health.check": name, err });
        await postZenduty(`DRMS [${name}] failed: ${err.message}`, "critical", `drms-${name}`, err.message);
      }
    }
  }
}

export function startHealthMonitor() {
  // One-time startup check: JWT_SECRET must be set or auth silently breaks
  if (!process.env.JWT_SECRET) {
    logger.error("health.startup.jwt_secret_missing", {
      message: "JWT_SECRET is not set — token signing will fail",
    });
  }

  const interval = Number(process.env.HEALTH_CHECK_INTERVAL_MS) || 60_000;
  setInterval(() => {
    runHealthChecks().catch((err) => logger.error("health.monitor.error", { err }));
  }, interval);
  setTimeout(() => {
    runHealthChecks().catch((err) => logger.error("health.monitor.initial.error", { err }));
  }, 5_000);
  logger.info("Health monitor started", { "health.interval_ms": interval });
}
