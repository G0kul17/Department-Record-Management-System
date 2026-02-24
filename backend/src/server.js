import express from "express";
import cors from "cors";
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
import pool from "./config/db.js";
import fs from "fs";
import path from "path";
dotenv.config();

const app = express();
app.use(express.json());
// CORS for local dev (Vite on 3000/4173)
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://localhost:4173",
      "http://127.0.0.1:4173",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-session-token"],
  }),
);

// simple route
app.get("/", (req, res) => res.json({ message: "Auth RBAC OTP API" }));

app.use("/api/student/profile", studentProfileRoutes);
app.use("/api/students", addStudentsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/data-uploads", dataUploadRoutes);
app.use("/api/announcements", announcementRoutes);

app.use(
  "/uploads",
  express.static(path.resolve(process.env.FILE_STORAGE_PATH || "./uploads")),
);

// Serve exported files statically for easy download by staff/admin
app.use("/exports", express.static(path.resolve("./exports")));

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
    console.log(`✅ Database connected: ${database}`);
    console.log(`   Server time: ${current_time}`);

    // Optional: Check if schema_version table exists to verify migrations were run
    try {
      const versionResult = await pool.query(
        "SELECT version, description, applied_at FROM schema_version ORDER BY version DESC LIMIT 1",
      );
      if (versionResult.rows.length > 0) {
        const { version, description, applied_at } = versionResult.rows[0];
        console.log(`   Schema version: ${version} (${description})`);
        console.log(`   Applied at: ${applied_at}`);
      } else {
        console.log("   ⚠️  No schema version found. Please run migrations.");
      }
    } catch (e) {
      console.warn(
        "⚠️  Schema version table not found. Please run migrations:",
      );
      console.warn(
        "   psql -U <user> -d <database> -f backend/migrations/001_initial_schema.sql",
      );
    }
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    throw err;
  }
}

const PORT = process.env.PORT || 5000;

// Clean application startup - NO schema modifications at runtime
verifyDatabaseConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`   API Base: http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error("❌ Startup failed:", err.message);
    console.error("   Ensure PostgreSQL is running and migrations are applied");
    process.exit(1);
  });

// Global error handler to always return JSON (handles multer/file-filter errors too)
// Keep this AFTER routes and server start to catch async route errors via next(err)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  // Handle multer errors specifically
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: `File too large. Maximum size is ${Math.floor(process.env.FILE_SIZE_LIMIT_MB || 50)} MB`,
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "Unexpected file field",
      });
    }
    return res
      .status(400)
      .json({ message: err.message || "File upload error" });
  }

  const status = err.status || 400; // default to 400 for validation-like issues
  const message = err.message || "Server error";
  res.status(status).json({ message });
});
