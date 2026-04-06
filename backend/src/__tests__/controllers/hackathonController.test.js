import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks must be declared before the imports that depend on them.

vi.mock("../../config/db.js", () => ({
  default: { connect: vi.fn(), query: vi.fn() },
}));

vi.mock("../../utils/logger.js", () => ({
  default: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() },
  reqContext: vi.fn(() => ({})),
}));

import pool from "../../config/db.js";
import { listHackathons } from "../../controllers/hackathonController.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeRes() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

/**
 * Build a minimal request for listHackathons.
 * By omitting req.user the sendDurationOverWarnings branch is not entered,
 * so pool.query is called only once (main SELECT).
 */
function makeReq(query = {}) {
  return { user: undefined, query };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── listHackathons — limit / offset clamping (bug fix) ───────────────────────

describe("listHackathons — limit / offset clamping", () => {
  it("defaults limit to 20 when no limit param is provided", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = makeReq();
    const res = makeRes();

    await listHackathons(req, res);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/LIMIT 20\b/);
  });

  it("defaults offset to 0 when no offset param is provided", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = makeReq();
    const res = makeRes();

    await listHackathons(req, res);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/OFFSET 0\b/);
  });

  it("uses a valid limit within 1–200 as-is", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = makeReq({ limit: "50" });
    const res = makeRes();

    await listHackathons(req, res);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/LIMIT 50\b/);
  });

  it("clamps limit to 200 when a value above 200 is supplied (bug fix)", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = makeReq({ limit: "99999" });
    const res = makeRes();

    await listHackathons(req, res);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/LIMIT 200\b/);
    expect(sql).not.toMatch(/LIMIT 99999/);
  });

  it("falls back to default limit of 20 when limit=0 is supplied (0 is falsy)", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = makeReq({ limit: "0" });
    const res = makeRes();

    await listHackathons(req, res);

    const [sql] = pool.query.mock.calls[0];
    // parseInt("0") || 20  →  0 || 20  →  20  (default wins over 0)
    expect(sql).toMatch(/LIMIT 20\b/);
  });

  it("enforces a minimum limit of 1 for truthy negative values (e.g. limit=-5)", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    // parseInt("-5") = -5 which is truthy → -5 || 20 = -5
    // Math.max(1, Math.min(200, -5))  →  Math.max(1, -5)  →  1
    const req = makeReq({ limit: "-5" });
    const res = makeRes();

    await listHackathons(req, res);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/LIMIT 1\b/);
  });

  it("clamps negative offset to 0 (bug fix)", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = makeReq({ offset: "-100" });
    const res = makeRes();

    await listHackathons(req, res);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/OFFSET 0\b/);
  });

  it("uses a positive offset as-is", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = makeReq({ offset: "40" });
    const res = makeRes();

    await listHackathons(req, res);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/OFFSET 40\b/);
  });

  it("falls back to limit=20 when limit is non-numeric", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = makeReq({ limit: "abc" });
    const res = makeRes();

    await listHackathons(req, res);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/LIMIT 20\b/);
  });
});

// ── listHackathons — response shape ──────────────────────────────────────────

describe("listHackathons — response shape", () => {
  it("returns an object with a hackathons array", async () => {
    const fakeRows = [{ id: 1, hackathon_name: "Hack the Planet" }];
    pool.query.mockResolvedValueOnce({ rows: fakeRows });

    const req = makeReq();
    const res = makeRes();

    await listHackathons(req, res);

    expect(res.json).toHaveBeenCalledWith({ hackathons: fakeRows });
  });

  it("returns 500 on a DB error", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB failure"));

    const req = makeReq();
    const res = makeRes();

    await listHackathons(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});
