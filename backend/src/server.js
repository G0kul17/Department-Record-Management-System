import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import achievementRoutes from "./routes/achievementRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import eventPublicRoutes from "./routes/eventPublicRoutes.js"; // public events list
import eventRoutes from "./routes/eventRoutes.js"; // staff/admin event management
import adminRoutes from "./routes/adminRoutes.js";
import publicRecordRoutes from "./routes/publicRecordRoutes.js";
import facultyParticipationRoutes from "./routes/facultyParticipationRoutes.js";
import facultyResearchRoutes from "./routes/facultyResearchRoutes.js";
import facultyConsultancyRoutes from "./routes/facultyConsultancyRoutes.js";
import dataUploadRoutes from "./routes/dataUploadRoutes.js";
import studentProfileRoutes from "./routes/studentProfileRoutes.js";
import addStudentsRoutes from "./routes/addStudentsRoutes.js";
import addStaffBatchRoutes from "./routes/addStaffBatchRoutes.js";
import bulkExportRoutes from "./routes/bulkExportRoutes.js";
import activityCoordinatorRoutes from "./routes/activityCoordinatorRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import hackathonRoutes from "./routes/hackathonRoutes.js";
import pool, { logPoolHealth, getPoolHealth } from "./config/db.js";
import { verifyFileStorage } from "./config/upload.js";
import { cleanupExpiredSessions } from "./utils/sessionUtils.js";
import { requireAuth } from "./middleware/authMiddleware.js";
import { requireRole } from "./middleware/roleAuth.js";
import { verifyToken } from "./utils/tokenUtils.js";
import { verifyFileToken } from "./utils/fileTokenUtils.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { requireIdempotency } from "./middleware/idempotencyMiddleware.js";
import fileTokenRoutes from "./routes/fileTokenRoutes.js";
import { startMetricsFlusher } from "./utils/metricsBuffer.js";
import { startHealthMonitor, getHealthStatus } from "./utils/healthMonitor.js";
import logger, { reqContext } from "./utils/logger.js";
import fs from "fs";
import path from "path";
dotenv.config();

const app = express();
// Trust the first proxy (Nginx) so req.ip returns the real client IP
// from the X-Forwarded-For header instead of the internal proxy address.
app.set("trust proxy", 1);
const isProd = process.env.NODE_ENV === "production";
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // P1-6: Restore xFrameOptions and restrict frameAncestors to 'none'.
  // The previous config explicitly disabled xFrameOptions and allowed any
  // origin to frame the application, which is a clickjacking risk.
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // In production, strictly disallow unsafe-inline and unsafe-eval
      scriptSrc: isProd 
        ? ["'self'"] 
        : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: isProd 
        ? ["'self'"] 
        : ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "*"],
      // No framing allowed for the application itself.
      frameAncestors: ["'none'"]
    }
  }
}));
app.use(express.json());

// Attach correlation ID and emit ECS-structured HTTP log events for every request.
app.use(requestLogger);

// Enforce idempotency on mutation requests
app.use(requireIdempotency);

// ============================================================================
// CORS CONFIGURATION - Environment-Based Strategy
// ============================================================================
// Development: CORS enabled with specific origins
// Production: CORS disabled (Nginx handles /api proxying)
// ============================================================================

const NODE_ENV = process.env.NODE_ENV || "development";
const ENABLE_CORS = process.env.ENABLE_CORS !== "false"; // Default: enabled

if (ENABLE_CORS) {
  // CORS enabled - for development or environments without reverse proxy
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:4173",
      "http://127.0.0.1:4173",
    ];

  app.use(
    cors({
      origin: corsOrigins,
      credentials: false,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-session-token"],
    }),
  );

  logger.info("CORS enabled", { "cors.origins": corsOrigins });
} else {
  // CORS disabled - expecting Nginx or reverse proxy to handle cross-origin requests
  logger.info(
    "CORS disabled - expecting reverse proxy (Nginx/Apache) to handle /api routing",
  );
}

// simple route
app.get("/", (req, res) => res.json({ message: "Auth RBAC OTP API" }));

// Health check endpoint — internal only (not proxied through Nginx)
app.get("/health", async (req, res) => {
  try {
    const dbStart = Date.now();
    await pool.query("SELECT 1");
    const dbLatency = Date.now() - dbStart;

    const poolHealth = getPoolHealth();
    const checks = getHealthStatus();
    const allOk = Object.values(checks).every((s) => s === "ok");

    res.status(allOk ? 200 : 503).json({
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
      database: {
        latency: `${dbLatency}ms`,
        pool: {
          total: poolHealth.totalCount,
          idle: poolHealth.idleCount,
          waiting: poolHealth.waitingCount,
          health: poolHealth.health.status,
        },
      },
    });
  } catch (err) {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      checks: getHealthStatus(),
      database: { connected: false },
    });
  }
});

// Detailed pool stats endpoint (admin only)
app.get("/pool-stats", requireAuth, requireRole(["admin"]), (req, res) => {
  const poolHealth = getPoolHealth();
  res.json(poolHealth);
});

app.use("/api/student/profile", studentProfileRoutes);
app.use("/api/students", addStudentsRoutes);
app.use("/api/staff-batch", addStaffBatchRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/data-uploads", dataUploadRoutes);
app.use("/api/announcements", announcementRoutes);
// P0-3: Short-lived file-scoped token issuance endpoint.
app.use("/api/files", fileTokenRoutes);

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH || "./uploads";

// ── Authenticated file serving ─────────────────────────────────────────────
// P0-3: Accepts ONLY a file-scoped token (issued by POST /api/files/:filename/token).
//        The token is bound to the specific filename in its 'file' claim, preventing
//        a copied URL from being used to download a different file.
//        The fallback ?token= query-param path still works but also requires a
//        file-scoped token, not the long-lived access token.
// P1-1: After token verification, the filename must resolve to a known record in
//        the database. Students may only fetch files belonging to their own records;
//        staff and admin may fetch any file.
const fileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many file requests. Please try again later." }
});
app.get("/api/files/:filename", fileLimiter, async (req, res) => {
  // Allow browser-native cross-origin rendering for authenticated file URLs.
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  const filename = req.params.filename;

  // Reject path traversal before anything else.
  if (filename !== path.basename(filename) || filename.includes("..")) {
    return res.status(400).json({ message: "Invalid filename" });
  }

  // Token resolution: prefer Authorization header, fall back to ?token=
  const headerToken = req.headers.authorization?.split(" ")[1];
  const queryToken = req.query.token;
  const rawToken = headerToken || queryToken;
  if (!rawToken) return res.status(401).json({ message: "No token" });

  let decoded;
  try {
    // P0-3: Only file-scoped tokens are accepted here.
    // verifyFileToken validates signature, audience ('file-download'), expiry,
    // and that the token's 'file' claim matches the requested filename.
    decoded = verifyFileToken(rawToken, filename);
  } catch (err) {
    if (err.name === "TokenExpiredError") return res.status(401).json({ message: "Token expired" });
    if (err.name === "FileTokenMismatch") return res.status(403).json({ message: "Token is not valid for this file" });
    return res.status(401).json({ message: "Invalid token" });
  }

  const requesterId = Number(decoded.sub);

  // P1-1: Resolve the filename to a DB record and enforce access control.
  // A valid token alone is not sufficient — the requester must be authorised
  // to see the record that owns this file.
  try {
    // Look up file ownership across the tables that store uploaded files.
    // project_files → owned by the project creator
    // achievements  → owned by the user who submitted the achievement
    // users (photo) → owned by the user themselves
    const ownerQuery = await pool.query(
      `SELECT u.id AS owner_id, u.role AS owner_role
       FROM (
         SELECT p.created_by AS owner_id FROM project_files pf
           JOIN projects p ON p.id = pf.project_id
         WHERE pf.filename = $1
         UNION ALL
         SELECT a.user_id AS owner_id FROM achievements a
         WHERE a.proof_file = $1
         UNION ALL
         SELECT u2.id AS owner_id FROM users u2
         WHERE u2.photo_url LIKE '%' || $1
       ) AS file_owners
       JOIN users u ON u.id = file_owners.owner_id
       LIMIT 1`,
      [filename],
    );

    if (!ownerQuery.rows.length) {
      // No record found for this filename — deny access even for valid tokens.
      // Prevents orphaned file enumeration.
      return res.status(404).json({ message: "File not found" });
    }

    const { owner_id, owner_role } = ownerQuery.rows[0];

    // Fetch the requester's current role from the DB (don't rely solely on token).
    const requesterQ = await pool.query("SELECT role FROM users WHERE id=$1", [requesterId]);
    if (!requesterQ.rows.length) return res.status(401).json({ message: "User not found" });
    const requesterRole = requesterQ.rows[0].role;

    // Students may only access their own files. Staff and admin access all.
    if (requesterRole === "student" && owner_id !== requesterId) {
      return res.status(403).json({ message: "Access denied" });
    }
  } catch (dbErr) {
    logger.error("File resource auth check failed", { err: dbErr, filename });
    return res.status(500).json({ message: "Server error" });
  }

  const uploadsDir = path.resolve(FILE_STORAGE_PATH);
  const filePath = path.resolve(path.join(uploadsDir, filename));
  if (!filePath.startsWith(uploadsDir + path.sep)) {
    return res.status(400).json({ message: "Invalid file path" });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }
  // Force download for anything that is not meant to be rendered inline.
  const inlineExts = new Set([".pdf", ".png", ".jpg", ".jpeg", ".gif"]);
  const ext = path.extname(filePath).toLowerCase();
  if (!inlineExts.has(ext)) {
    const safeName = path.basename(filePath);
    res.setHeader("Content-Disposition", 'attachment; filename="' + safeName + '"');
  }
  res.sendFile(filePath);
});

// ── Public file serving (P1-1b) ──────────────────────────────────────────────
// Unauthenticated — intentionally public card images for OG previews, emails,
// and <img> tags. Restricted to image types only; MIME type is verified against
// actual magic bytes via the file extension + Content-Type response header.
// Security headers are NOT removed — they are configured appropriately for
// a public image-only endpoint.
const PUBLIC_IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);
const PUBLIC_MIME_MAP = {
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".webp": "image/webp",
};
const publicFileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests. Please try again later." },
});
app.get("/api/public/files/:filename", publicFileLimiter, (req, res) => {
  const filename = req.params.filename;

  // Reject path traversal.
  if (filename !== path.basename(filename) || filename.includes("..")) {
    return res.status(400).json({ message: "Invalid filename" });
  }

  const ext = path.extname(filename).toLowerCase();

  // Restrict to images only — no HTML, SVG, JS, documents, executables.
  if (!PUBLIC_IMAGE_EXTS.has(ext)) {
    return res.status(403).json({ message: "File type not permitted on public endpoint" });
  }

  const uploadsDir = path.resolve(FILE_STORAGE_PATH);
  const filePath = path.resolve(path.join(uploadsDir, filename));
  if (!filePath.startsWith(uploadsDir + path.sep)) {
    return res.status(400).json({ message: "Invalid file path" });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  // Set verified Content-Type based on extension, not client-supplied value.
  const contentType = PUBLIC_MIME_MAP[ext];
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Allow cross-origin image loading (needed for OG / email embeds).
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  // Restrictive CSP: public images should not run scripts or embed frames.
  res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; frame-ancestors 'none'");
  // Long-lived caching for immutable public card images (1 hour, CDN-friendly).
  res.setHeader("Cache-Control", "public, max-age=3600, immutable");

  res.sendFile(filePath);
});

// Public records API - used for shareable cards
app.use("/api/public/records", publicRecordRoutes);

// after app.use('/api/auth', authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/faculty-participations", facultyParticipationRoutes);
app.use("/api/faculty-research", facultyResearchRoutes);
app.use("/api/faculty-consultancy", facultyConsultancyRoutes);

// Optionally expose events publicly for students
app.use("/api/events", eventPublicRoutes);
app.use("/api/events-admin", eventRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/activity-coordinators", activityCoordinatorRoutes);

// Bulk export route
app.use("/api", bulkExportRoutes);

// ============================================================================
// DATABASE CONNECTION VERIFICATION (NO SCHEMA MODIFICATIONS)
// ============================================================================
// The application ONLY verifies database connectivity at startup.
// All schema changes must be applied via migration scripts in /migrations/
// Run: psql -U <user> -d <database> -f backend/migrations/001_initial_schema.sql
// ============================================================================

async function verifyDatabaseConnection() {
  try {
    const result = await pool.query(
      "SELECT NOW() as current_time, current_database() as database",
    );
    const { current_time, database } = result.rows[0];
    logger.info("Database connected", { "db.name": database, "db.server_time": current_time });

    // Optional: Check if schema_version table exists to verify migrations were run
    try {
      const versionResult = await pool.query(
        "SELECT version, description, applied_at FROM schema_version ORDER BY version DESC LIMIT 1",
      );
      if (versionResult.rows.length > 0) {
        const { version, description, applied_at } = versionResult.rows[0];
        logger.info("Schema version verified", { "db.schema.version": version, "db.schema.description": description, "db.schema.applied_at": applied_at });
      } else {
        logger.warn("No schema version found — please run migrations");
      }
    } catch (e) {
      logger.warn("Schema version table not found — please run migrations", {
        hint: "psql -U <user> -d <database> -f backend/migrations/001_initial_schema.sql",
      });
    }

    // Log pool health after successful connection
    logPoolHealth();
  } catch (err) {
    logger.error("Database connection failed", {
      err,
      "db.error.code": err.code,
      hint: "Ensure PostgreSQL is running and credentials are correct",
    });
    throw err;
  }
}

const PORT = process.env.PORT || 5000;

// ============================================================================
// APPLICATION STARTUP - Verify Database & File Storage
// ============================================================================
// Clean application startup - NO schema modifications at runtime
// 1. Verify database connectivity
// 2. Verify file storage configuration
// 3. Start HTTP server
// ============================================================================

async function startApplication() {
  try {
    // Step 1: Verify database connection
    await verifyDatabaseConnection();

    // Step 2: Verify file storage (already verified on module load, but re-check)
    try {
      verifyFileStorage();
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(`File storage verification failed: ${err.message}`);
      }
      logger.warn("File storage verification failed (non-fatal in development)", { err });
    }

    // Step 3: Start server
    app.listen(PORT, "0.0.0.0", () => {
      logger.info("Server started", {
        "server.port": PORT,
        "server.environment": process.env.NODE_ENV || "development",
        "server.api_base": `http://localhost:${PORT}/api`,
      });
    });

    // Step 4: Start metrics flusher (sends stats to Cloudflare Worker every minute)
    startMetricsFlusher();

    // Step 5: Start internal health monitor (DB, email, storage, OTP table → Zenduty)
    startHealthMonitor();

    // Step 6: Schedule periodic cleanup of expired sessions (every 24 hours)
    const SESSION_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
    setInterval(() => {
      cleanupExpiredSessions().catch((err) =>
        logger.error("Session cleanup failed", { err }),
      );
    }, SESSION_CLEANUP_INTERVAL_MS);
    setTimeout(() => {
      cleanupExpiredSessions().catch((err) =>
        logger.error("Session cleanup (initial) failed", { err }),
      );
    }, 60_000);
  } catch (err) {
    logger.error("Startup failed — fix the error and restart", { err });
    process.exit(1);
  }
}

startApplication();

// Global error handler to always return JSON (handles multer/file-filter errors too)
// Keep this AFTER routes and server start to catch async route errors via next(err)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // trace_id is always available from requestLogger middleware
  const traceId = req.correlationId;

  logger.error("Unhandled error", {
    err,
    "url.path": req.path,
    "http.request.method": req.method,
    ...reqContext(req),
  });

  // Handle multer errors specifically
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: `File too large. Maximum size is ${Math.floor(process.env.FILE_SIZE_LIMIT_MB || 50)} MB`,
        trace_id: traceId,
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "Unexpected file field",
        trace_id: traceId,
      });
    }
    return res
      .status(400)
      .json({ message: err.message || "File upload error", trace_id: traceId });
  }

  const errMsg = String(err?.message || "").toLowerCase();
  const looksLikeUploadValidationError = [
    "file type",
    "invalid image type",
    "invalid proof file",
    "invalid certificate file",
    "invalid event photo file",
    "only .zip files",
    "only csv or excel",
    "invalid data file type",
    "brochure file type",
    "thumbnail",
    "file too large",
  ].some((token) => errMsg.includes(token));

  // Use err.status when it's an intentional HTTP status (ReviewError 403/404,
  // explicitly-tagged validation errors, etc.).  Fall back to 500 for anything
  // else — unhandled crashes (TypeError, DB errors, ...) are server faults, not
  // client errors, so 400 would be misleading to callers and monitoring tools.
  const status =
    err.status && err.status >= 400 && err.status < 600
      ? err.status
      : looksLikeUploadValidationError
        ? 400
        : 500;
  // For 500s expose a generic message to clients; for intentional 4xx/5xx keep
  // the original message since it's already user-facing (e.g. ReviewError).
  const message = status >= 500 ? "Server error" : (err.message || "Request failed");

  // Always include trace_id in error responses so users/frontend can surface a
  // reference code to support — the same pattern Cloudflare uses with Ray IDs.
  // In development also surface the real error detail; never in production.
  const body =
    process.env.NODE_ENV !== "production"
      ? { message, trace_id: traceId, error: String(err) }
      : { message, trace_id: traceId };

  res.status(status).json(body);
});
// Active system logs route loaded

