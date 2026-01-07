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
import pool from "./config/db.js";
import fs from "fs";
import path from "path";
import queriesSql from "./models/queries.js";
dotenv.config();

const app = express();
app.use(express.json());
// CORS for local dev (Vite on 3000/4173)
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:4173",
      "http://127.0.0.1:4173",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// simple route
app.get("/", (req, res) => res.json({ message: "Auth RBAC OTP API" }));

app.use("/api/student/profile", studentProfileRoutes);
app.use("/api/students", addStudentsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/data-uploads", dataUploadRoutes);

app.use(
  "/uploads",
  express.static(path.resolve(process.env.FILE_STORAGE_PATH || "./uploads"))
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

// optional: create tables if not exist on startup
async function ensureTables() {
  try {
    // Execute the whole SQL file in one call. Splitting by semicolons
    // can break dollar-quoted blocks (DO $$ ... $$) or semicolons inside
    // quoted strings. Let Postgres parse the full script instead.
    const sql = (queriesSql || "").trim();
    if (!sql) {
      console.log("No SQL migration script found; skipping ensureTables");
      return;
    }

    try {
      await pool.query(sql);
      console.log("Database tables ensured");
    } catch (e) {
      console.error("Error executing SQL migration script:", e.message || e);
      // Re-throw so the caller can see the failure
      throw e;
    }
  } catch (err) {
    console.error("Error ensuring tables", err);
  }
}

// Minimal, non-destructive migrations to align existing DB with code expectations
// Adds missing columns if the tables were created previously without them.
async function ensureColumns() {
  try {
    // Add id to users if missing
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS id BIGSERIAL");
    // Backfill any NULL ids (from rows that existed before the column was added)
    await pool.query("UPDATE users SET id = DEFAULT WHERE id IS NULL");

    // Ensure users.id is part of a primary key or unique constraint
    try {
      // Add primary key constraint if one does not exist. If a PK already
      // exists this will fail; swallow that error.
      await pool.query(
        "ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id)"
      );
    } catch (e) {
      // ignore errors (constraint exists or other benign issues)
    }

    // If users.id still lacks a PK/unique constraint (common on legacy DBs
    // where email was the PK), add a UNIQUE constraint so foreign keys can
    // reference users(id).
    const { rows: hasIdKey } = await pool.query(
      `SELECT 1
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
          AND tc.table_name = kcu.table_name
        WHERE tc.table_name = 'users'
          AND kcu.column_name = 'id'
          AND tc.constraint_type IN ('PRIMARY KEY','UNIQUE')
        LIMIT 1`
    );
    if (!hasIdKey.length) {
      try {
        await pool.query(
          "ALTER TABLE users ADD CONSTRAINT users_id_unique UNIQUE (id)"
        );
      } catch (e) {
        // ignore if another process added it concurrently
      }
    }

    // Ensure critical user columns exist
    await pool.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE"
    );
    // Normalize nulls to false where applicable
    await pool.query(
      "UPDATE users SET is_verified = COALESCE(is_verified, FALSE) WHERE is_verified IS NULL"
    );

    await pool.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)"
    );
    await pool.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20)"
    );
    await pool.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    );

    // Add optional profile fields if missing
    await pool.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)"
    );

    // Backfill full_name from profile_details where missing
    await pool.query(
      "UPDATE users SET full_name = COALESCE(NULLIF(full_name, ''), NULLIF(profile_details->>'full_name', ''), NULLIF(TRIM((profile_details->>'first_name') || ' ' || (profile_details->>'last_name')), '')) WHERE (full_name IS NULL OR full_name = '')"
    );

    // Optional profile fields
    await pool.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30)"
    );
    await pool.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50)"
    );

    // Add profile_details JSONB column for storing student registration info
    await pool.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_details JSONB"
    );

    // For existing users without profile_details, initialize with empty object
    await pool.query(
      "UPDATE users SET profile_details = '{}' WHERE profile_details IS NULL AND role = 'student'"
    );

    // If legacy schemas enforced NOT NULL on full_name, relax it so minimal inserts work
    const { rows: hasFullName } = await pool.query(
      "SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='full_name'"
    );
    if (hasFullName.length) {
      try {
        await pool.query(
          "ALTER TABLE users ALTER COLUMN full_name DROP NOT NULL"
        );
      } catch (e) {
        // ignore if already nullable or other benign errors
      }
    }

    // Add id to otp_verifications if missing
    await pool.query(
      "ALTER TABLE otp_verifications ADD COLUMN IF NOT EXISTS id BIGSERIAL"
    );
    await pool.query(
      "UPDATE otp_verifications SET id = DEFAULT WHERE id IS NULL"
    );

    console.log(
      "Database columns ensured (users: id/is_verified/password_hash/role/created_at; otp_verifications: id)"
    );
  } catch (err) {
    console.error("Error ensuring columns", err);
  }
}

const PORT = process.env.PORT || 5000;
// Ensure critical columns (and primary key on users.id) before running full migrations
ensureColumns()
  .then(() => ensureTables())
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Startup migration error:", err);
    // still attempt to start server so humans can inspect logs, but warn
    app.listen(PORT, () =>
      console.log(`Server listening on port ${PORT} (with migration warnings)`)
    );
  });

// Global error handler to always return JSON (handles multer/file-filter errors too)
// Keep this AFTER routes and server start to catch async route errors via next(err)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const status = err.status || 400; // default to 400 for validation-like issues
  const message = err.message || "Server error";
  res.status(status).json({ message });
});
