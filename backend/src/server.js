import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from './routes/projectRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
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
app.use('/api/projects', projectRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/uploads', express.static(path.resolve(process.env.FILE_STORAGE_PATH || './uploads')));


// optional: create tables if not exist on startup
async function ensureTables() {
  try {
    // Execute SQL statements one-by-one so we can identify failing statement
    const sql = queriesSql || "";
    const statements = sql
      .split(/;\s*\r?\n/) // split on semicolon + newline (simple splitter)
      .map((s) => s.trim())
      .filter(Boolean);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ";";
      try {
        await pool.query(stmt);
      } catch (e) {
        console.error(
          `Error executing SQL statement #${i + 1}: ${statements[i].slice(0, 200)}`
        );
        throw e;
      }
    }
    console.log("Database tables ensured");
  } catch (err) {
    console.error("Error ensuring tables", err);
  }
}

const PORT = process.env.PORT || 5000;
ensureTables().then(() => {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
});

