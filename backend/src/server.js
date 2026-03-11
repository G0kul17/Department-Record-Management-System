import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import achievementRoutes from "./routes/achievementRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import eventPublicRoutes from "./routes/eventPublicRoutes.js"; // public events list
import eventRoutes from "./routes/eventRoutes.js"; // staff/admin event management
import adminRoutes from "./routes/adminRoutes.js";
import facultyParticipationRoutes from "./routes/facultyParticipationRoutes.js";
import facultyResearchRoutes from "./routes/facultyResearchRoutes.js";
import facultyConsultancyRoutes from "./routes/facultyConsultancyRoutes.js";
import dataUploadRoutes from "./routes/dataUploadRoutes.js";
import studentProfileRoutes from "./routes/studentProfileRoutes.js";
import addStudentsRoutes from "./routes/addStudentsRoutes.js";
import bulkExportRoutes from "./routes/bulkExportRoutes.js";
import activityCoordinatorRoutes from "./routes/activityCoordinatorRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import pool, { logPoolHealth, getPoolHealth } from "./config/db.js";
import { verifyFileStorage } from "./config/upload.js";
import { requireAuth } from "./middleware/authMiddleware.js";
import { requireRole } from "./middleware/roleAuth.js";
import { verifyToken } from "./utils/tokenUtils.js";
import { requestLogger } from "./middleware/requestLogger.js";
import logger, { reqContext } from "./utils/logger.js";
import fs from "fs";
import path from "path";
dotenv.config();

const app = express();
// Trust the first proxy (Nginx) so req.ip returns the real client IP
// from the X-Forwarded-For header instead of the internal proxy address.
app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json());

// Attach correlation ID and emit ECS-structured HTTP log events for every request.
app.use(requestLogger);

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

// Health check endpoint with database pool stats
app.get("/health", async (req, res) => {
  try {
    // Quick database ping
    const dbStart = Date.now();
    await pool.query("SELECT 1");
    const dbLatency = Date.now() - dbStart;

    const poolHealth = getPoolHealth();

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: {
        connected: true,
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
      database: {
        connected: false,
        error: err.message,
      },
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
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/data-uploads", dataUploadRoutes);
app.use("/api/announcements", announcementRoutes);

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH || "./uploads";

// Authenticated file serving — replaces the public /uploads static route.
// Accepts Bearer token in Authorization header OR ?token= query param
// (query param is needed for <img src> / <a href> browser-native requests).
app.get("/api/files/:filename", (req, res) => {
  const headerToken = req.headers.authorization?.split(" ")[1];
  const queryToken = req.query.token;
  const rawToken = headerToken || queryToken;
  if (!rawToken) return res.status(401).json({ message: "No token" });
  try {
    verifyToken(rawToken);
  } catch (err) {
    const msg = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    return res.status(401).json({ message: msg });
  }
  const uploadsDir = path.resolve(FILE_STORAGE_PATH);
  const filePath = path.resolve(path.join(uploadsDir, req.params.filename));
  if (!filePath.startsWith(uploadsDir + path.sep)) {
    return res.status(400).json({ message: "Invalid file path" });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }
  res.sendFile(filePath);
});

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

  // Use err.status when it's an intentional HTTP status (ReviewError 403/404,
  // explicitly-tagged validation errors, etc.).  Fall back to 500 for anything
  // else — unhandled crashes (TypeError, DB errors, ...) are server faults, not
  // client errors, so 400 would be misleading to callers and monitoring tools.
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
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
