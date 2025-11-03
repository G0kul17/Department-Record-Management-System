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

const PORT = process.env.PORT || 5000;
ensureTables().then(() => {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
});
