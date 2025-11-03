import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
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
    ],
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// simple route
app.get("/", (req, res) => res.json({ message: "Auth RBAC OTP API" }));

app.use("/api/auth", authRoutes);

// optional: create tables if not exist on startup
async function ensureTables() {
  try {
    // Use the JS-exported SQL string to avoid editor dialect parsing issues
    await pool.query(queriesSql);
    console.log("Database tables ensured");
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
ensureTables()
  .then(() => ensureColumns())
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  });
