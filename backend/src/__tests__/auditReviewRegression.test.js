/**
 * auditReviewRegression.test.js
 *
 * Regression test suite covering the 4 audit review requirements:
 * 1. Critical: Revoked session file download security & file-token-only access on /api/files/:filename
 * 2. Required: Admin user directory schema compatibility with checked-in migrations (no u.department column)
 * 3. Required: Staff/admin enumeration prevention on /auth/staff-names and admin role guard on /admin/users
 * 4. Required: Deploy-safe audit logging migration & runtime logging
 */

import { describe, it, expect, beforeAll, vi } from "vitest";
import { newDb, DataType } from "pg-mem";
import express from "express";
import request from "supertest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");
const JWT_SECRET = process.env.JWT_SECRET || "test-secret-for-unit-tests-32chars!";

let latestMemPool = null;

vi.mock("../config/db.js", () => {
  return {
    default: new Proxy(
      {},
      {
        get(_, prop) {
          if (!latestMemPool) throw new Error("memPool not ready");
          const target = latestMemPool;
          const value = target[prop];
          return typeof value === "function" ? value.bind(target) : value;
        },
      }
    ),
    getPoolHealth: () => ({ totalCount: 1, idleCount: 1, waitingCount: 0, health: { status: "healthy" } }),
    logPoolHealth: () => {},
    closePool: async () => {},
  };
});

// Setup in-memory PostgreSQL instance from checked-in migrations
async function setupDatabaseFromMigrations() {
  const db = newDb();

  db.public.registerFunction({
    name: "nullif",
    args: [DataType.text, DataType.text],
    returns: DataType.text,
    implementation: (a, b) => (a === b ? null : a),
  });
  db.public.registerFunction({
    name: "least",
    args: [DataType.timestamp, DataType.timestamp],
    returns: DataType.timestamp,
    implementation: (a, b) => (new Date(a) < new Date(b) ? a : b),
  });
  db.public.registerFunction({
    name: "trim",
    args: [DataType.text],
    returns: DataType.text,
    implementation: (x) => (x ? x.trim() : x),
  });
  db.public.registerFunction({
    name: "pg_get_serial_sequence",
    args: [DataType.text, DataType.text],
    returns: DataType.text,
    implementation: () => "seq",
  });
  db.public.registerFunction({
    name: "setval",
    args: [DataType.text, DataType.integer, DataType.bool],
    returns: DataType.integer,
    implementation: () => 1,
  });
  db.registerLanguage("plpgsql", () => () => {});

  const adapter = db.adapters.createPg();
  const { Pool } = adapter;
  const memPool = new Pool();

  const migrationFiles = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    let sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    sql = sql.replace(/decimal\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, "decimal");
    sql = sql.replace(/numeric\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, "numeric");

    try {
      await memPool.query(sql);
    } catch {
      // Allow pg-mem unsupported dialect constructs
    }
  }

  return memPool;
}

describe("Audit Review Regression Suite", () => {
  let app;
  let memPool;

  beforeAll(async () => {
    memPool = await setupDatabaseFromMigrations();
    latestMemPool = memPool;

    // Load actual routes and controller handlers
    const { default: fileTokenRoutes } = await import("../routes/fileTokenRoutes.js");
    const { default: adminRoutes } = await import("../routes/adminRoutes.js");
    const { default: authRoutes } = await import("../routes/authRoutes.js");
    const { verifyFileToken } = await import("../utils/fileTokenUtils.js");

    app = express();
    app.use(express.json());

    // Mount tested routes
    app.use("/api/files", fileTokenRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/auth", authRoutes);

    // Mount /api/files/:filename using the exact implementation in server.js
    app.get("/api/files/:filename", async (req, res) => {
      const filename = req.params.filename;

      if (filename !== path.basename(filename) || filename.includes("..")) {
        return res.status(400).json({ message: "Invalid filename" });
      }

      let isAvatar = false;
      try {
        const avatarCheck = await memPool.query(
          `SELECT u.id FROM users u
           WHERE (
             u.profile_details->>'photo_url' LIKE '%' || $1
             OR u.profile_details->>'avatar_url' LIKE '%' || $1
             OR u.profile_details->>'image_url' LIKE '%' || $1
             OR u.profile_details->>'profile_pic' LIKE '%' || $1
           ) LIMIT 1`,
          [filename]
        );
        isAvatar = avatarCheck.rows.length > 0;
      } catch {
        // ignore
      }

      const headerToken = req.headers.authorization?.split(" ")[1];
      const queryToken = req.query.token;
      const rawToken = headerToken || queryToken;

      if (!rawToken && !isAvatar) {
        return res.status(401).json({ message: "No token" });
      }

      if (!isAvatar) {
        try {
          verifyFileToken(rawToken, filename);
        } catch (err) {
          if (err.name === "TokenExpiredError") return res.status(401).json({ message: "Token expired" });
          if (err.name === "FileTokenMismatch") return res.status(403).json({ message: "Token is not valid for this file" });
          return res.status(401).json({ message: "Invalid token" });
        }
      }

      return res.status(200).json({ success: true, filename, isAvatar });
    });
  });

  // ==========================================================================
  // 1. Critical — Revoked sessions and file download security
  // ==========================================================================
  describe("1. Critical — File token enforcement & revoked session security", () => {
    const studentUser = { id: 101, email: "student101@test.edu", role: "student" };
    const validSessionToken = "valid-session-token-xyz";
    const revokedSessionToken = "revoked-session-token-abc";

    beforeAll(async () => {
      // Seed student user
      await memPool.query(
        `INSERT INTO users (id, email, role, is_verified, password_hash, profile_details)
         VALUES ($1, $2, $3, TRUE, 'hashed', $4)
         ON CONFLICT (id) DO NOTHING`,
        [studentUser.id, studentUser.email, studentUser.role, JSON.stringify({ full_name: "Test Student", photo_url: "/api/files/avatar_user101.jpg" })]
      );

      // Seed active session in user_sessions
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await memPool.query(
        `INSERT INTO user_sessions (user_id, session_token, expires_at, created_at, last_accessed_at, is_active)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE)`,
        [studentUser.id, validSessionToken, futureDate]
      );

      // Seed revoked session
      await memPool.query(
        `INSERT INTO user_sessions (user_id, session_token, expires_at, created_at, last_accessed_at, is_active)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE)`,
        [studentUser.id, revokedSessionToken, futureDate]
      );
    });

    it("DENY: revoked session cannot obtain a file token via POST /api/files/:filename/token", async () => {
      const revokedJwt = jwt.sign(
        { id: studentUser.id, email: studentUser.email, role: studentUser.role, sid: revokedSessionToken },
        JWT_SECRET,
        { expiresIn: "6h" }
      );

      const res = await request(app)
        .post("/api/files/report.pdf/token")
        .set("Authorization", `Bearer ${revokedJwt}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/session revoked|session expired/i);
    });

    it("ALLOW: valid active session can obtain a file-scoped token", async () => {
      const activeJwt = jwt.sign(
        { id: studentUser.id, email: studentUser.email, role: studentUser.role, sid: validSessionToken },
        JWT_SECRET,
        { expiresIn: "6h" }
      );

      const res = await request(app)
        .post("/api/files/report.pdf/token")
        .set("Authorization", `Bearer ${activeJwt}`);

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.expiresAt).toBeDefined();
    });

    it("DENY: GET /api/files/:filename with normal session JWT in ?token= returns 401 Invalid token", async () => {
      const normalJwt = jwt.sign(
        { id: studentUser.id, email: studentUser.email, role: studentUser.role, sid: validSessionToken },
        JWT_SECRET,
        { expiresIn: "6h" }
      );

      const res = await request(app).get(`/api/files/confidential.pdf?token=${normalJwt}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid token");
    });

    it("DENY: GET /api/files/:filename without token on non-avatar file returns 401 No token", async () => {
      const res = await request(app).get("/api/files/confidential.pdf");
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("No token");
    });

    it("DENY: GET /api/files/:filename with mismatched file token returns 403 Token is not valid for this file", async () => {
      const { issueFileToken } = await import("../utils/fileTokenUtils.js");
      const tokenForFileA = issueFileToken(studentUser.id, "file_a.pdf");

      // Attempt to access file_b.pdf using token minted for file_a.pdf
      const res = await request(app).get(`/api/files/file_b.pdf?token=${tokenForFileA}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Token is not valid for this file");
    });

    it("DENY: GET /api/files/:filename with expired file token returns 401 Token expired", async () => {
      const { issueFileToken } = await import("../utils/fileTokenUtils.js");
      // Mint token with 0 seconds expiry
      const expiredToken = issueFileToken(studentUser.id, "report.pdf", -1);

      const res = await request(app).get(`/api/files/report.pdf?token=${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token expired");
    });

    it("ALLOW: GET /api/files/:filename with valid file-scoped token returns 200", async () => {
      const { issueFileToken } = await import("../utils/fileTokenUtils.js");
      const validToken = issueFileToken(studentUser.id, "report.pdf");

      const res = await request(app).get(`/api/files/report.pdf?token=${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("ALLOW: unauthenticated avatar download bypasses token requirement", async () => {
      // avatar_user101.jpg was seeded in profile_details.photo_url
      const res = await request(app).get("/api/files/avatar_user101.jpg");
      expect(res.status).toBe(200);
      expect(res.body.isAvatar).toBe(true);
    });
  });

  // ==========================================================================
  // 2. Required — Admin user directory checked-in schema compatibility
  // ==========================================================================
  describe("2. Required — Admin user directory checked-in schema compatibility", () => {
    let adminToken;

    beforeAll(async () => {
      // Verify users table DOES NOT have a department column (checked-in schema)
      const colCheck = await memPool.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = 'users' AND column_name = 'department'`
      );
      expect(colCheck.rows.length).toBe(0);

      // Seed admin user
      await memPool.query(
        `INSERT INTO users (id, email, role, is_verified, password_hash, profile_details)
         VALUES (201, 'admin@test.edu', 'admin', TRUE, 'hashed', '{"full_name": "Admin User"}')
         ON CONFLICT (id) DO NOTHING`
      );

      // Seed users across departments
      await memPool.query(
        `INSERT INTO users (id, email, role, is_verified, password_hash, profile_details)
         VALUES 
          (202, 'stu_ads@test.edu', 'student', TRUE, 'hashed', '{"full_name": "ADS Student", "department": "ADS"}'),
          (203, 'stu_it@test.edu', 'student', TRUE, 'hashed', '{"full_name": "IT Student", "department": "IT"}'),
          (204, 'staff_ads@test.edu', 'staff', TRUE, 'hashed', '{"full_name": "ADS Staff", "dept": "ADS"}')
         ON CONFLICT (id) DO NOTHING`
      );

      adminToken = jwt.sign(
        { id: 201, email: "admin@test.edu", role: "admin" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
    });

    it("SUCCESS: GET /api/admin/users runs without 500 on checked-in schema", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);

      if (res.status !== 200) {
        console.log("admin/users error:", res.status, res.body);
      }
      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(res.body.users.length).toBeGreaterThanOrEqual(4);
    });

    it("SUCCESS: filters by department=ADS correctly from JSONB", async () => {
      const res = await request(app)
        .get("/api/admin/users?department=ADS")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const emails = res.body.users.map((u) => u.email);
      expect(emails).toContain("stu_ads@test.edu");
      expect(emails).not.toContain("stu_it@test.edu");
    });

    it("SUCCESS: filters by department=IT correctly from JSONB", async () => {
      const res = await request(app)
        .get("/api/admin/users?department=IT")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const emails = res.body.users.map((u) => u.email);
      expect(emails).toContain("stu_it@test.edu");
      expect(emails).not.toContain("stu_ads@test.edu");
    });
  });

  // ==========================================================================
  // 3. Required — Staff/admin enumeration restriction & role guards
  // ==========================================================================
  describe("3. Required — Privilege separation & data minimization", () => {
    let studentToken;
    let alumniToken;
    let adminToken;

    beforeAll(async () => {
      // Seed student, alumni, staff, admin
      await memPool.query(
        `INSERT INTO users (id, email, role, is_verified, password_hash, full_name, profile_details)
         VALUES 
          (301, 'student301@test.edu', 'student', TRUE, 'hashed', 'Student Three', '{}'),
          (302, 'alumni302@test.edu', 'alumni', TRUE, 'hashed', 'Alumni Three', '{}'),
          (303, 'staff303@test.edu', 'staff', TRUE, 'hashed', 'Prof. Smith', '{"designation": "AP"}'),
          (304, 'admin304@test.edu', 'admin', TRUE, 'hashed', 'Super Admin', '{}')
         ON CONFLICT (id) DO NOTHING`
      );

      studentToken = jwt.sign({ id: 301, email: "student301@test.edu", role: "student" }, JWT_SECRET, { expiresIn: "1h" });
      alumniToken = jwt.sign({ id: 302, email: "alumni302@test.edu", role: "alumni" }, JWT_SECRET, { expiresIn: "1h" });
      adminToken = jwt.sign({ id: 304, email: "admin304@test.edu", role: "admin" }, JWT_SECRET, { expiresIn: "1h" });
    });

    it("GET /auth/staff-names returns minimum non-sensitive data (id, full_name) without email or role", async () => {
      const res = await request(app)
        .get("/api/auth/staff-names")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const profSmith = res.body.find((s) => s.id === 303);
      expect(profSmith).toBeDefined();
      expect(profSmith.full_name).toBe("Prof. Smith");
      // Security assertion: must NOT leak email or role
      expect(profSmith.email).toBeUndefined();
      expect(profSmith.role).toBeUndefined();
    });

    it("GET /auth/staff-names does NOT return admin accounts", async () => {
      const res = await request(app)
        .get("/api/auth/staff-names")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      const adminEntry = res.body.find((s) => s.id === 304);
      expect(adminEntry).toBeUndefined();
    });

    it("DENY: Student calling /api/admin/users receives 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it("DENY: Alumni calling /api/admin/users receives 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${alumniToken}`);

      expect(res.status).toBe(403);
    });

    it("ALLOW: Admin calling /api/admin/users receives 200 OK", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ==========================================================================
  // 4. Required — Deploy-safe audit logging
  // ==========================================================================
  describe("4. Required — Deploy-safe audit logging", () => {
    it("013_audit_logs.sql records version 13 in schema_version idempotently", async () => {
      // Check version 13 is recorded in schema_version
      const res = await memPool.query("SELECT version, description FROM schema_version WHERE version = 13");
      expect(res.rows.length).toBe(1);
      expect(res.rows[0].version).toBe(13);

      // Reapply version 13 insert to test deploy loop idempotency
      const insertSql = `
        INSERT INTO schema_version (version, description)
        VALUES (13, 'Audit logs infrastructure')
        ON CONFLICT (version) DO NOTHING;
      `;
      await expect(memPool.query(insertSql)).resolves.not.toThrow();

      // Ensure still exactly one row for version 13
      const checkAgain = await memPool.query("SELECT COUNT(*) AS count FROM schema_version WHERE version = 13");
      expect(Number(checkAgain.rows[0].count)).toBe(1);
    });

    it("logAudit writes directly to audit_logs without runtime DDL and handles failures fail-safely", async () => {
      const { logAudit } = await import("../utils/auditLogger.js");
      const loggerMod = await import("../utils/logger.js");
      const loggerErrorSpy = vi.spyOn(loggerMod.default, "error");

      // 1. Successful log write
      await logAudit({
        actionType: "USER_DELETED",
        category: "Users",
        itemTitle: "Deleted User Test",
        user: { id: 201, name: "Admin", email: "admin@test.edu", role: "admin" },
        details: { targetUserId: 999 },
      });

      const auditRows = await memPool.query("SELECT * FROM audit_logs WHERE action_type = 'USER_DELETED'");
      expect(auditRows.rows.length).toBeGreaterThanOrEqual(1);
      expect(auditRows.rows[0].item_title).toBe("Deleted User Test");

      // 2. Fail-safe write: even if DB fails or query rejects, logAudit handles it and does not throw
      const originalQuery = memPool.query;
      memPool.query = vi.fn().mockRejectedValueOnce(new Error("Connection lost during audit"));

      await expect(
        logAudit({
          actionType: "FAILED_OP",
          category: "System",
          itemTitle: "Failed action",
        })
      ).resolves.not.toThrow();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        "Failed to write audit log entry",
        expect.objectContaining({ actionType: "FAILED_OP" })
      );

      memPool.query = originalQuery;
    });
  });
});
