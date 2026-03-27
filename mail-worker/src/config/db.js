// mail-worker/src/config/db.js
// Small pg.Pool for the mail worker.
// Uses the same DB_* env vars as the main backend so a single .env is sufficient.

import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port:     Number(process.env.DB_PORT || 5432),
  // The dispatcher processes at most 10 rows per tick — a small pool is enough.
  max: 3,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  console.error("[mail-worker] Unexpected DB pool error:", err.message);
});

export default pool;
