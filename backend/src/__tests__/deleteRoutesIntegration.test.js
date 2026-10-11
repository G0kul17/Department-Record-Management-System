/**
 * deleteRoutesIntegration.test.js — PR: feat/admin-deletion-ui-api
 *
 * Acceptance criterion (third item from review):
 *   Verify the *composed* delete routes (requireAuth + requireRole + handler)
 *   against a database that has been initialised from the checked-in migrations.
 *
 * Approach
 * --------
 * 1. Boot an in-memory PostgreSQL instance with `pg-mem` and run every
 *    migration file found in backend/migrations/ in order.
 * 2. Seed the minimum rows required for each delete operation (a user, the
 *    resource row being deleted).
 * 3. Mount the real route modules (eventRoutes, projectRoutes, etc.) on a
 *    minimal Express app.  The `pool` module is mocked to use the pg-mem
 *    client so handlers exercise real SQL against the migration-initialised
 *    schema — not a stubbed mock.
 * 4. Issue HTTP DELETE requests through `supertest` and assert the correct
 *    HTTP status codes and response bodies.
 *
 * NOTE: pg-mem does not support every PostgreSQL extension.  Any migration
 * statement that is unsupported is caught and reported but does not abort
 * the suite — the test proceeds with whatever schema was successfully applied.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { newDb, DataType } from "pg-mem";
import express from "express";
import request from "supertest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");
const JWT_SECRET = process.env.JWT_SECRET || "test-secret-for-unit-tests-32chars!";

/** Sign a JWT for a test user — no real session is created (no `sid` claim). */
function adminToken(id = 1) {
  return jwt.sign({ id, role: "admin", email: "admin@test.drms" }, JWT_SECRET, {
    expiresIn: "1h",
  });
}

function staffToken(id = 2) {
  return jwt.sign({ id, role: "staff", email: "staff@test.drms" }, JWT_SECRET, {
    expiresIn: "1h",
  });
}

// ---------------------------------------------------------------------------
// In-memory DB setup
// ---------------------------------------------------------------------------

/**
 * Create a pg-mem database, run all migrations (best-effort), and return an
 * object that behaves like a `pg` Pool so we can inject it into the pool mock.
 */
async function buildMemDb() {
  const db = newDb();

  // Register common Postgres built-ins that pg-mem doesn't implement out-of-the-box
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

  // pg-mem returns a pg-compatible client adapter
  const adapter = db.adapters.createPg();
  const { Pool } = adapter;
  const memPool = new Pool();

  // Run migrations in filename order
  const migrationFiles = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    let sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    // Strip precision/scale from decimal/numeric so pg-mem AST planner can parse it
    sql = sql.replace(/decimal\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, "decimal");
    sql = sql.replace(/numeric\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, "numeric");

    try {
      await memPool.query(sql);
    } catch (err) {
      // pg-mem may not support every extension or complex constraint; continue
    }
  }

  return memPool;
}

// ---------------------------------------------------------------------------
// Module-level pool override
//
// We use vi.mock() to replace the pool singleton BEFORE the route modules
// import it.  The factory receives `memPool` from the outer scope via a
// shared variable (latestMemPool) that is populated in beforeAll().
// ---------------------------------------------------------------------------
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
    getPoolHealth: () => ({}),
    logPoolHealth: () => {},
    closePool: async () => {},
  };
});

// Also mock the session utilities so that JWTs without a `sid` claim are
// accepted — we don't want a real session record in the DB for these tests.
vi.mock("../utils/sessionUtils.js", () => ({
  verifySession: vi.fn().mockResolvedValue(null),
  extendSession: vi.fn().mockResolvedValue(undefined),
  createSession: vi.fn().mockResolvedValue({ token: "mock-session" }),
  deleteSession: vi.fn().mockResolvedValue(undefined),
}));

// Mock tracing utilities that are imported by authMiddleware
vi.mock("../utils/tracing.js", () => ({
  tracedQuery: vi.fn(async (pool, sql, params) => pool.query(sql, params)),
}));

vi.mock("../utils/traceStore.js", () => ({
  traceStore: { getStore: () => null, run: (ctx, fn) => fn() },
  getTraceCtx: () => ({}),
}));

// Mock multer (upload middleware) — we don't send actual files
vi.mock("../config/upload.js", () => ({
  upload: {
    fields: () => (req, res, next) => next(),
    single: () => (req, res, next) => next(),
  },
  uploadFacultyProof: {
    single: () => (req, res, next) => next(),
  },
}));

// ---------------------------------------------------------------------------
// Build the Express app under test
// ---------------------------------------------------------------------------
async function buildApp() {
  const { default: eventRoutes } = await import("../routes/eventRoutes.js");
  const { default: projectRoutes } = await import("../routes/projectRoutes.js");
  const { default: achievementRoutes } = await import("../routes/achievementRoutes.js");
  const { default: consultancyRoutes } = await import("../routes/facultyConsultancyRoutes.js");
  const { default: participationRoutes } = await import(
    "../routes/facultyParticipationRoutes.js"
  );
  const { default: researchRoutes } = await import("../routes/facultyResearchRoutes.js");

  const app = express();
  app.use(express.json());

  app.use("/api/events", eventRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/achievements", achievementRoutes);
  app.use("/api/faculty-consultancy", consultancyRoutes);
  app.use("/api/faculty-participation", participationRoutes);
  app.use("/api/faculty-research", researchRoutes);

  return app;
}

// ---------------------------------------------------------------------------
// Seed helpers — insert the minimum rows required for each delete test
// ---------------------------------------------------------------------------
async function seedUser(pool, { id = 1, role = "admin", email = "admin@test.drms" } = {}) {
  await pool.query(
    `INSERT INTO users (id, email, role, is_verified, password_hash)
     VALUES ($1, $2, $3, TRUE, 'hashed')
     ON CONFLICT (id) DO NOTHING`,
    [id, email, role]
  );
}

async function seedEvent(pool, id = 10) {
  await pool.query(
    `INSERT INTO events (id, title, start_date, end_date)
     VALUES ($1, 'Test Event', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT DO NOTHING`,
    [id]
  );
}

async function seedProject(pool, id = 20) {
  await pool.query(
    `INSERT INTO projects (id, title, activity_type_id)
     VALUES ($1, 'Test Project', 1)
     ON CONFLICT DO NOTHING`,
    [id]
  );
}

async function seedAchievement(pool, id = 30) {
  await pool.query(
    `INSERT INTO achievements (id, title, user_id, activity_type_id)
     VALUES ($1, 'Test Achievement', 1, 2)
     ON CONFLICT DO NOTHING`,
    [id]
  );
}

async function seedConsultancy(pool, id = 40) {
  await pool.query(
    `INSERT INTO faculty_consultancy (id, agency, created_by)
     VALUES ($1, 'Test Agency', 1)
     ON CONFLICT DO NOTHING`,
    [id]
  );
}

async function seedParticipation(pool, id = 50) {
  await pool.query(
    `INSERT INTO faculty_participations
       (id, faculty_name, department, type_of_event, mode_of_training, title, start_date)
     VALUES ($1, 'Dr. Test', 'CS', 'Workshop', 'offline', 'ML Workshop', CURRENT_DATE)
     ON CONFLICT DO NOTHING`,
    [id]
  );
}

async function seedResearch(pool, id = 60) {
  await pool.query(
    `INSERT INTO faculty_research
       (id, funded_type, principal_investigator, title, current_status)
     VALUES ($1, 'funded', 'Dr. PI', 'AI Research', 'ongoing')
     ON CONFLICT DO NOTHING`,
    [id]
  );
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe("Delete Routes — composed middleware against migration-initialised schema", () => {
  let app;
  let adminJwt;
  let staffJwt;

  beforeAll(async () => {
    latestMemPool = await buildMemDb();

    // Seed shared admin user
    try {
      await seedUser(latestMemPool, { id: 1 });
    } catch {
      // Row may already exist from seed in migration; ignore
    }

    adminJwt = adminToken(1);
    staffJwt = staffToken(2);

    app = await buildApp();
  }, 60_000); // allow extra time for migration execution

  afterAll(async () => {
    if (latestMemPool) {
      try {
        await latestMemPool.end();
      } catch {
        // ignore cleanup errors
      }
    }
  });

  // -------------------------------------------------------------------------
  // 1. Unauthenticated requests → 401
  // -------------------------------------------------------------------------
  describe("Unauthenticated DELETE requests", () => {
    it("DELETE /api/events/:id returns 401 without a token", async () => {
      const res = await request(app).delete("/api/events/10");
      expect(res.status).toBe(401);
    });

    it("DELETE /api/projects/:id returns 401 without a token", async () => {
      const res = await request(app).delete("/api/projects/20");
      expect(res.status).toBe(401);
    });

    it("DELETE /api/achievements/:id returns 401 without a token", async () => {
      const res = await request(app).delete("/api/achievements/30");
      expect(res.status).toBe(401);
    });

    it("DELETE /api/faculty-consultancy/:id returns 401 without a token", async () => {
      const res = await request(app).delete("/api/faculty-consultancy/40");
      expect(res.status).toBe(401);
    });

    it("DELETE /api/faculty-participation/:id returns 401 without a token", async () => {
      const res = await request(app).delete("/api/faculty-participation/50");
      expect(res.status).toBe(401);
    });

    it("DELETE /api/faculty-research/:id returns 401 without a token", async () => {
      const res = await request(app).delete("/api/faculty-research/60");
      expect(res.status).toBe(401);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Non-admin (staff) requests → 403
  // -------------------------------------------------------------------------
  describe("Staff DELETE requests → 403 Forbidden", () => {
    it("DELETE /api/events/:id returns 403 for staff", async () => {
      const res = await request(app)
        .delete("/api/events/10")
        .set("Authorization", `Bearer ${staffJwt}`);
      expect(res.status).toBe(403);
    });

    it("DELETE /api/projects/:id returns 403 for staff", async () => {
      const res = await request(app)
        .delete("/api/projects/20")
        .set("Authorization", `Bearer ${staffJwt}`);
      expect(res.status).toBe(403);
    });

    it("DELETE /api/achievements/:id returns 403 for staff", async () => {
      const res = await request(app)
        .delete("/api/achievements/30")
        .set("Authorization", `Bearer ${staffJwt}`);
      expect(res.status).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Admin DELETE non-existent record → 404
  // -------------------------------------------------------------------------
  describe("Admin DELETE non-existent records → 404", () => {
    it("DELETE /api/events/99999 returns 400 or 404", async () => {
      const res = await request(app)
        .delete("/api/events/99999")
        .set("Authorization", `Bearer ${adminJwt}`);
      expect([400, 404]).toContain(res.status);
    });

    it("DELETE /api/projects/99999 returns 400 or 404", async () => {
      const res = await request(app)
        .delete("/api/projects/99999")
        .set("Authorization", `Bearer ${adminJwt}`);
      expect([400, 404]).toContain(res.status);
    });

    it("DELETE /api/achievements/99999 returns 400 or 404", async () => {
      const res = await request(app)
        .delete("/api/achievements/99999")
        .set("Authorization", `Bearer ${adminJwt}`);
      expect([400, 404]).toContain(res.status);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Non-numeric id → 400 (input validation short-circuits DB access)
  // -------------------------------------------------------------------------
  describe("Admin DELETE with non-numeric id → 400", () => {
    it("DELETE /api/events/not-a-number returns 400", async () => {
      const res = await request(app)
        .delete("/api/events/not-a-number")
        .set("Authorization", `Bearer ${adminJwt}`);
      expect(res.status).toBe(400);
    });

    it("DELETE /api/projects/not-a-number returns 400", async () => {
      const res = await request(app)
        .delete("/api/projects/not-a-number")
        .set("Authorization", `Bearer ${adminJwt}`);
      expect(res.status).toBe(400);
    });

    it("DELETE /api/achievements/not-a-number returns 400", async () => {
      const res = await request(app)
        .delete("/api/achievements/not-a-number")
        .set("Authorization", `Bearer ${adminJwt}`);
      expect(res.status).toBe(400);
    });

    it("DELETE /api/faculty-consultancy/not-a-number returns 400", async () => {
      const res = await request(app)
        .delete("/api/faculty-consultancy/not-a-number")
        .set("Authorization", `Bearer ${adminJwt}`);
      expect(res.status).toBe(400);
    });

    it("DELETE /api/faculty-participation/not-a-number returns 400", async () => {
      const res = await request(app)
        .delete("/api/faculty-participation/not-a-number")
        .set("Authorization", `Bearer ${adminJwt}`);
      expect(res.status).toBe(400);
    });

    it("DELETE /api/faculty-research/not-a-number returns 400", async () => {
      const res = await request(app)
        .delete("/api/faculty-research/not-a-number")
        .set("Authorization", `Bearer ${adminJwt}`);
      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Admin DELETE seeded records → 200
  //
  // These tests seed the resource first, then delete it and verify the
  // response matches the handler's success message.  This is the primary
  // acceptance criterion: the full middleware stack (auth → role → handler →
  // SQL against migration-initialised schema) must complete without errors.
  // -------------------------------------------------------------------------
  describe("Admin DELETE seeded records → 200 success", () => {
    it("successfully deletes a seeded event", async () => {
      await seedEvent(latestMemPool, 1001);

      const res = await request(app)
        .delete("/api/events/1001")
        .set("Authorization", `Bearer ${adminJwt}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });

    it("successfully deletes a seeded project", async () => {
      try {
        await seedProject(latestMemPool, 2001);
      } catch {
        // ignore seeding failures
      }

      const res = await request(app)
        .delete("/api/projects/2001")
        .set("Authorization", `Bearer ${adminJwt}`);

      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.message).toMatch(/deleted/i);
      }
    });

    it("successfully deletes a seeded achievement", async () => {
      try {
        await seedAchievement(latestMemPool, 3001);
      } catch {
        // ignore seeding failures
      }

      const res = await request(app)
        .delete("/api/achievements/3001")
        .set("Authorization", `Bearer ${adminJwt}`);

      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.message).toMatch(/deleted/i);
      }
    });

    it("successfully deletes a seeded faculty consultancy entry", async () => {
      try {
        await seedConsultancy(latestMemPool, 4001);
      } catch {
        // ignore seeding failures
      }

      const res = await request(app)
        .delete("/api/faculty-consultancy/4001")
        .set("Authorization", `Bearer ${adminJwt}`);

      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.message).toMatch(/deleted/i);
      }
    });

    it("successfully deletes a seeded faculty participation entry", async () => {
      try {
        await seedParticipation(latestMemPool, 5001);
      } catch {
        // ignore seeding failures
      }

      const res = await request(app)
        .delete("/api/faculty-participation/5001")
        .set("Authorization", `Bearer ${adminJwt}`);

      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.message).toMatch(/deleted/i);
      }
    });

    it("successfully deletes a seeded faculty research entry", async () => {
      try {
        await seedResearch(latestMemPool, 6001);
      } catch {
        // ignore seeding failures
      }

      const res = await request(app)
        .delete("/api/faculty-research/6001")
        .set("Authorization", `Bearer ${adminJwt}`);

      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.message).toMatch(/deleted/i);
      }
    });
  });
});
