import pool, { getPoolHealth } from "../config/db.js";
import { getAccessToken, isMailConfigured } from "../config/mailer.js";
import { STORAGE_PATH } from "../config/upload.js";
import fs from "fs";
import path from "path";
import logger from "./logger.js";

const firingAlerts = new Map();

// Core tables the app cannot function without
const CORE_TABLES = [
  "users",
  "otp_verifications",
  "user_sessions",
  "projects",
  "achievements",
  "events",
  "faculty_participations",
  "faculty_research",
  "faculty_consultancy",
  "student_profiles",
];

async function checkDatabase() {
  // Verify pool is not in critical state
  const ph = getPoolHealth();
  if (ph.health.status === "critical") {
    throw new Error("Pool critical — utilization high or error rate elevated");
  }
  // Verify DB is writable (not a read-only replica or disk-full standby)
  const { rows } = await pool.query("SELECT pg_is_in_recovery() AS is_replica");
  if (rows[0].is_replica)
    throw new Error("Database is in read-only / recovery mode");
}

async function checkCoreTables() {
  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1)`,
    [CORE_TABLES],
  );
  const found = new Set(rows.map((r) => r.table_name));
  const missing = CORE_TABLES.filter((t) => !found.has(t));
  if (missing.length > 0)
    throw new Error(`Missing tables: ${missing.join(", ")}`);
}

async function checkEmail() {
  if (!isMailConfigured()) {
    throw new Error(
      "Email service not configured (Microsoft Graph credentials missing)",
    );
  }
  await getAccessToken();
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
  if (usedPct >= 90)
    throw new Error(`Disk usage at ${usedPct}% — uploads may fail`);
}

const RUNBOOKS = {
  db: {
    impact:
      "All API requests will fail — users cannot log in, load data, or submit anything.",
    causes: [
      "PostgreSQL connection pool exhausted (too many concurrent requests)",
      "Database server entered read-only / recovery mode (disk full or replica failover)",
      "PostgreSQL process crashed or was OOM-killed",
    ],
    steps: [
      "1. SSH into VPS: check PostgreSQL status → `systemctl status postgresql`",
      "2. Check DB logs → `journalctl -u postgresql -n 50`",
      "3. Check disk space → `df -h` (full disk forces PG read-only)",
      "4. Check pool stats → GET /pool-stats (requires admin JWT)",
      "5. If pool exhausted: restart app → `pm2 restart drms`",
      "6. If PG down: restart → `systemctl restart postgresql`",
    ],
  },
  tables: {
    impact:
      "API endpoints that touch missing tables will return 500 errors to users.",
    causes: [
      "Migration was partially applied or rolled back mid-way",
      "Table was accidentally dropped (DROP TABLE)",
      "Database was restored from an older backup missing recent migrations",
      "Schema was recreated without running all migration scripts",
    ],
    steps: [
      "1. Connect to DB → `psql -U $DB_USER -d $DB_NAME`",
      "2. List tables → `\\dt` — identify which are missing",
      "3. Check migration history → `SELECT * FROM schema_version ORDER BY version DESC;`",
      "4. Re-run missing migrations → `psql -U $DB_USER -d $DB_NAME -f backend/migrations/001_initial_schema.sql`",
      "5. Verify tables exist → `\\dt` again",
      "6. Restart app → `pm2 restart drms`",
    ],
  },
  email: {
    impact:
      "OTP delivery will fail — users cannot register, log in (without active session), or reset passwords.",
    causes: [
      "Microsoft Graph app credentials were rotated or deleted",
      "CLIENT_ID / TENANT_ID / CLIENT_SECRET env vars missing or wrong",
      "OUTLOOK_SENDER_EMAIL is missing or invalid",
      "Azure app registration lacks Mail.Send application permission",
      "Outbound access to login.microsoftonline.com or graph.microsoft.com is blocked",
    ],
    steps: [
      "1. Check env vars → `pm2 env drms | grep -E 'CLIENT_ID|TENANT_ID|CLIENT_SECRET|OUTLOOK_SENDER_EMAIL'`",
      "2. Verify the Azure app registration still has the correct client secret and Mail.Send permission",
      "3. Confirm the sender mailbox exists and can send mail through Microsoft Graph",
      "4. If credentials changed: update /opt/drms/backend/.env → `pm2 reload drms --update-env`",
      "5. Check outbound access to Microsoft login and Graph endpoints from the VPS",
    ],
  },
  storage: {
    impact:
      "File uploads (project proofs, certificates, photos) will fail. Existing files are unaffected.",
    causes: [
      "Disk usage reached 90%+ — no space left for new uploads",
      "Upload directory permissions changed (chmod/chown)",
      "Mount point unmounted or NFS/remote storage disconnected",
      "Disk failure or filesystem error (read-only remount)",
    ],
    steps: [
      "1. Check disk usage → `df -h` and `du -sh /opt/drms/uploads/*`",
      "2. If disk full: clean old logs → `journalctl --vacuum-size=500M`, remove temp files",
      "3. Check upload dir permissions → `ls -la /opt/drms/uploads`",
      "4. Fix permissions if needed → `chmod 755 /opt/drms/uploads && chown drms:drms /opt/drms/uploads`",
      "5. Check mount → `mount | grep uploads` (if using external storage)",
      "6. After fix: app recovers automatically within 60s — no restart needed",
    ],
  },
};

function buildSummary(checkName, errorMessage) {
  const r = RUNBOOKS[checkName];
  if (!r) return errorMessage;
  return [
    `ERROR: ${errorMessage}`,
    ``,
    `IMPACT: ${r.impact}`,
    ``,
    `POSSIBLE CAUSES:`,
    ...r.causes.map((c) => `  • ${c}`),
    ``,
    `RECOVERY STEPS:`,
    ...r.steps,
  ].join("\n");
}

const CHECKS = [
  { name: "db", fn: checkDatabase },
  { name: "tables", fn: checkCoreTables },
  { name: "email", fn: checkEmail },
  { name: "storage", fn: checkStorage },
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
    logger.debug("health.zenduty.post", {
      entity_id: entityId,
      alert_type: alertType,
      "http.status": res.status,
    });
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
        await postZenduty(
          `DRMS [${name}] recovered`,
          "info",
          `drms-${name}`,
          `${name} check recovered`,
        );
      }
    } catch (err) {
      // Only log + alert on first failure — firingAlerts prevents duplicates
      if (!firingAlerts.get(name)) {
        firingAlerts.set(name, true);
        logger.error("health.check.failed", { "health.check": name, err });
        await postZenduty(
          `DRMS [${name}] failed: ${err.message}`,
          "critical",
          `drms-${name}`,
          buildSummary(name, err.message),
        );
      }
    }
  }
}

export function getHealthStatus() {
  const status = {};
  for (const { name } of CHECKS) {
    status[name] = firingAlerts.get(name) ? "failing" : "ok";
  }
  return status;
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
    runHealthChecks().catch((err) =>
      logger.error("health.monitor.error", { err }),
    );
  }, interval);
  setTimeout(() => {
    runHealthChecks().catch((err) =>
      logger.error("health.monitor.initial.error", { err }),
    );
  }, 5_000);
  logger.info("Health monitor started", { "health.interval_ms": interval });
}
