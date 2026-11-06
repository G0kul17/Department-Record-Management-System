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
import os from "os";
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

// Never send real mail from the upload controller under test.
vi.mock("../utils/mailClient.js", () => ({ enqueueMail: vi.fn() }));

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

const FILE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "drms-files-"));

describe("Audit Review Regression Suite", () => {
  let app;
  let realApp;
  let memPool;

  beforeAll(async () => {
    memPool = await setupDatabaseFromMigrations();
    latestMemPool = memPool;

    // Load actual routes and controller handlers
    const { default: adminRoutes } = await import("../routes/adminRoutes.js");
    const { default: authRoutes } = await import("../routes/authRoutes.js");

    app = express();
    app.use(express.json());

    // Mount tested routes
    app.use("/api/admin", adminRoutes);
    app.use("/api/auth", authRoutes);

    // File token minting and downloads (section 1) run against the real
    // server.js app. FILE_STORAGE_PATH must be set before its first import.
    process.env.FILE_STORAGE_PATH = FILE_DIR;
    ({ default: realApp } = await import("../server.js"));
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

      // Files owned by the student, so the real ownership check passes
      for (const name of ["report.pdf", "thesis.pdf"]) {
        await memPool.query(
          "INSERT INTO project_files (filename, original_name, uploaded_by) VALUES ($1, $1, $2)",
          [name, studentUser.id]
        );
        fs.writeFileSync(path.join(FILE_DIR, name), "%PDF-1.4 test");
      }
      fs.writeFileSync(path.join(FILE_DIR, "avatar_user101.jpg"), "jpg");
    });

    it("DENY: revoked session cannot obtain a file token via POST /api/files/:filename/token", async () => {
      const revokedJwt = jwt.sign(
        { id: studentUser.id, email: studentUser.email, role: studentUser.role, sid: revokedSessionToken },
        JWT_SECRET,
        { expiresIn: "6h" }
      );

      const res = await request(realApp)
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

      const res = await request(realApp)
        .post("/api/files/report.pdf/token")
        .set("Authorization", `Bearer ${activeJwt}`);

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.expiresAt).toBeDefined();
    });

    it("DENY: file token minted before logout becomes unusable after session revocation (mint -> revoke -> GET returns 401)", async () => {
      // 1. Mint file token with an active session
      const dynamicSessionToken = "mint-revoke-session-xyz";
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await memPool.query(
        `INSERT INTO user_sessions (user_id, session_token, expires_at, created_at, last_accessed_at, is_active)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE)`,
        [studentUser.id, dynamicSessionToken, futureDate]
      );

      const activeJwt = jwt.sign(
        { id: studentUser.id, email: studentUser.email, role: studentUser.role, sid: dynamicSessionToken },
        JWT_SECRET,
        { expiresIn: "6h" }
      );

      const mintRes = await request(realApp)
        .post("/api/files/thesis.pdf/token")
        .set("Authorization", `Bearer ${activeJwt}`);

      expect(mintRes.status).toBe(200);
      const { token: mintedFileToken } = mintRes.body;
      expect(mintedFileToken).toBeDefined();

      // Verify token works while session is active
      const preRevokeGet = await request(realApp).get(`/api/files/thesis.pdf?token=${mintedFileToken}`);
      expect(preRevokeGet.status).toBe(200);

      // 2. Revoke session (e.g. user logout or admin revocation)
      await memPool.query(
        "UPDATE user_sessions SET is_active = FALSE WHERE session_token = $1",
        [dynamicSessionToken]
      );

      // 3. Attempt download with the file token minted earlier
      const postRevokeGet = await request(realApp).get(`/api/files/thesis.pdf?token=${mintedFileToken}`);
      expect(postRevokeGet.status).toBe(401);
      expect(postRevokeGet.body.message).toMatch(/session revoked|session expired/i);
    });

    it("DENY: GET /api/files/:filename with normal session JWT in ?token= returns 401 Invalid token", async () => {
      const normalJwt = jwt.sign(
        { id: studentUser.id, email: studentUser.email, role: studentUser.role, sid: validSessionToken },
        JWT_SECRET,
        { expiresIn: "6h" }
      );

      const res = await request(realApp).get(`/api/files/confidential.pdf?token=${normalJwt}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid token");
    });

    it("DENY: GET /api/files/:filename without token on non-avatar file returns 401 No token", async () => {
      const res = await request(realApp).get("/api/files/confidential.pdf");
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("No token");
    });

    it("DENY: GET /api/files/:filename with mismatched file token returns 403 Token is not valid for this file", async () => {
      const { issueFileToken } = await import("../utils/fileTokenUtils.js");
      const tokenForFileA = issueFileToken(studentUser.id, "file_a.pdf");

      // Attempt to access file_b.pdf using token minted for file_a.pdf
      const res = await request(realApp).get(`/api/files/file_b.pdf?token=${tokenForFileA}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Token is not valid for this file");
    });

    it("DENY: GET /api/files/:filename with expired file token returns 401 Token expired", async () => {
      const { issueFileToken } = await import("../utils/fileTokenUtils.js");
      // Mint token with 0 seconds expiry
      const expiredToken = issueFileToken(studentUser.id, "report.pdf", -1);

      const res = await request(realApp).get(`/api/files/report.pdf?token=${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token expired");
    });

    it("ALLOW: GET /api/files/:filename with valid file-scoped token returns 200", async () => {
      const { issueFileToken } = await import("../utils/fileTokenUtils.js");
      const validToken = issueFileToken(studentUser.id, "report.pdf");

      const res = await request(realApp).get(`/api/files/report.pdf?token=${validToken}`);
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/application\/pdf/);
    });

    it("ALLOW: unauthenticated avatar download bypasses token requirement", async () => {
      // avatar_user101.jpg was seeded in profile_details.photo_url
      const res = await request(realApp).get("/api/files/avatar_user101.jpg");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/image\/jpeg/);
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

  // ==========================================================================
  // 5. Required — Batch duplicate register number protection across all stores
  // ==========================================================================
  describe("5. Required — Batch duplicate register number protection across all stores", () => {
    beforeAll(async () => {
      // 1. User with register_number in student_profiles
      await memPool.query(
        `INSERT INTO users (id, email, role, is_verified, password_hash, profile_details)
         VALUES (501, 'sp_reg@test.edu', 'student', TRUE, 'hashed', '{}')
         ON CONFLICT (id) DO NOTHING`
      );
      await memPool.query(
        `INSERT INTO student_profiles (user_id, register_number, contact_number)
         VALUES (501, 'REG_STORE_SP', '9876543210')
         ON CONFLICT (user_id) DO NOTHING`
      );

      // 2. User with roll_number in users table column
      await memPool.query(
        `INSERT INTO users (id, email, role, is_verified, password_hash, roll_number, profile_details)
         VALUES (502, 'col_roll@test.edu', 'student', TRUE, 'hashed', 'REG_STORE_COL', '{}')
         ON CONFLICT (id) DO NOTHING`
      );

      // 3. User with roll_number in profile_details JSONB
      await memPool.query(
        `INSERT INTO users (id, email, role, is_verified, password_hash, profile_details)
         VALUES (503, 'json_roll@test.edu', 'student', TRUE, 'hashed', '{"roll_number": "REG_STORE_JSON_ROLL"}')
         ON CONFLICT (id) DO NOTHING`
      );

      // 4. User with register_number in profile_details JSONB
      await memPool.query(
        `INSERT INTO users (id, email, role, is_verified, password_hash, profile_details)
         VALUES (504, 'json_reg@test.edu', 'student', TRUE, 'hashed', '{"register_number": "REG_STORE_JSON_REG"}')
         ON CONFLICT (id) DO NOTHING`
      );
    });

    // Drives the real uploadStudents controller with a CSV on disk.
    async function uploadCsv(rows) {
      const { uploadStudents } = await import("../controllers/addStudentsController.js");
      const file = path.join(FILE_DIR, `students-${Date.now()}-${rows.length}.csv`);
      fs.writeFileSync(
        file,
        [
          "Full name,First name,Last name,College mail,Register number,Contact number,Year,Dept,Course,Section",
          ...rows,
        ].join("\n")
      );
      const res = {
        statusCode: 200,
        body: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(body) {
          this.body = body;
          return this;
        },
      };
      await uploadStudents({ file: { path: file, originalname: "students.csv" }, user: { id: 1, role: "admin" } }, res);
      return res;
    }

    const row = (reg, n) =>
      `Student ${n},Student,S${n},batch${n}@test.edu,${reg},98765432${String(n).padStart(2, "0")},2,IT,BTech,A`;

    it("uploadStudents skips register numbers already stored in any of the 4 canonical/legacy stores", async () => {
      const res = await uploadCsv([
        row("REG_STORE_SP", 1),
        row("REG_STORE_COL", 2),
        row("REG_STORE_JSON_ROLL", 3),
        row("REG_STORE_JSON_REG", 4),
      ]);

      expect(res.statusCode).toBe(200);
      expect(res.body.created).toBe(0);
      expect(res.body.skipped.map((s) => s.reason)).toEqual([
        "Register number REG_STORE_SP is already in use",
        "Register number REG_STORE_COL is already in use",
        "Register number REG_STORE_JSON_ROLL is already in use",
        "Register number REG_STORE_JSON_REG is already in use",
      ]);
    });

    it("uploadStudents matches existing register numbers case-insensitively", async () => {
      const res = await uploadCsv([row("reg_store_col", 5)]);

      expect(res.statusCode).toBe(200);
      expect(res.body.created).toBe(0);
      expect(res.body.skipped).toHaveLength(1);
    });

    it("uploadStudents writes a new student's register number to every store", async () => {
      const newReg = "REG_NEW_INVARIANT_505";
      const res = await uploadCsv([row(newReg, 6)]);

      expect(res.statusCode).toBe(200);
      expect(res.body.created).toBe(1);

      const checkRes = await memPool.query(
        `SELECT u.roll_number, u.profile_details->>'register_number' AS p_reg, u.profile_details->>'roll_number' AS p_roll, sp.register_number AS sp_reg
         FROM users u
         JOIN student_profiles sp ON sp.user_id = u.id
         WHERE u.email = $1`,
        ["batch6@test.edu"]
      );

      expect(checkRes.rows).toHaveLength(1);
      expect(checkRes.rows[0].roll_number).toBe(newReg);
      expect(checkRes.rows[0].p_reg).toBe(newReg);
      expect(checkRes.rows[0].p_roll).toBe(newReg);
      expect(checkRes.rows[0].sp_reg).toBe(newReg);

      // A second upload of the same register number is now rejected
      const again = await uploadCsv([row(newReg, 7)]);
      expect(again.body.created).toBe(0);
      expect(again.body.skipped).toHaveLength(1);
    });
  });
});
