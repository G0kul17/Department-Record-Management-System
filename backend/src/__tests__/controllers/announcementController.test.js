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
import {
  createAnnouncement,
  listMyAnnouncements,
} from "../../controllers/announcementController.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeRes() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

/** Build a mock pg client returned by pool.connect(). */
function makeMockClient() {
  const client = { query: vi.fn(), release: vi.fn() };
  return client;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── createAnnouncement ────────────────────────────────────────────────────────

describe("createAnnouncement", () => {
  it("returns 401 when req.user is missing", async () => {
    const req = { user: null, body: {}, files: {} };
    const res = makeRes();

    await createAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
  });

  it("returns 400 when title is missing", async () => {
    const req = {
      user: { id: 1 },
      body: { message: "Hello", recipients: "[2]" },
      files: {},
    };
    const res = makeRes();

    await createAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "title required" });
  });

  it("returns 400 when announcement message is missing", async () => {
    const req = {
      user: { id: 1 },
      body: { title: "News", recipients: "[2]" },
      files: {},
    };
    const res = makeRes();

    await createAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "announcement message required",
    });
  });

  it("returns 400 when recipients list is empty", async () => {
    const req = {
      user: { id: 1 },
      body: { title: "News", message: "Hello", recipients: "[]" },
      files: {},
    };
    const res = makeRes();

    await createAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "At least one recipient is required",
    });
  });

  it("returns 201 and commits on a successful announcement", async () => {
    const client = makeMockClient();
    pool.connect.mockResolvedValue(client);

    // BEGIN
    client.query.mockResolvedValueOnce({});
    // INSERT staff_announcements → returns new id
    client.query.mockResolvedValueOnce({ rows: [{ id: 42 }] });
    // INSERT staff_announcement_recipients
    client.query.mockResolvedValueOnce({ rows: [] });
    // COMMIT
    client.query.mockResolvedValueOnce({});

    const req = {
      user: { id: 5 },
      body: { title: "Update", message: "Details here", recipients: "[10,11]" },
      files: {},
    };
    const res = makeRes();

    await createAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Announcement sent", id: 42 }),
    );
    // COMMIT was called
    const commitCall = client.query.mock.calls.find(([sql]) => sql === "COMMIT");
    expect(commitCall).toBeTruthy();
    // client is always released
    expect(client.release).toHaveBeenCalledOnce();
  });

  it("returns 500 and calls ROLLBACK when INSERT returns no id", async () => {
    const client = makeMockClient();
    pool.connect.mockResolvedValue(client);

    // BEGIN
    client.query.mockResolvedValueOnce({});
    // INSERT staff_announcements → empty rows (no id)
    client.query.mockResolvedValueOnce({ rows: [] });
    // ROLLBACK
    client.query.mockResolvedValueOnce({});

    const req = {
      user: { id: 5 },
      body: { title: "Update", message: "Details", recipients: "[10]" },
      files: {},
    };
    const res = makeRes();

    await createAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to create announcement",
    });
    const rollbackCall = client.query.mock.calls.find(
      ([sql]) => sql === "ROLLBACK",
    );
    expect(rollbackCall).toBeTruthy();
    expect(client.release).toHaveBeenCalledOnce();
  });

  it("calls ROLLBACK and rethrows when a DB error occurs mid-transaction", async () => {
    const client = makeMockClient();
    pool.connect.mockResolvedValue(client);

    // BEGIN
    client.query.mockResolvedValueOnce({});
    // INSERT staff_announcements → throws
    client.query.mockRejectedValueOnce(new Error("DB failure"));
    // ROLLBACK (from catch)
    client.query.mockResolvedValueOnce({});

    const req = {
      user: { id: 5 },
      body: { title: "Update", message: "Details", recipients: "[10]" },
      files: {},
    };
    const res = makeRes();

    await createAnnouncement(req, res);

    const rollbackCall = client.query.mock.calls.find(
      ([sql]) => sql === "ROLLBACK",
    );
    expect(rollbackCall).toBeTruthy();
    // Outer catch returns 500
    expect(res.status).toHaveBeenCalledWith(500);
    // client is always released even on error
    expect(client.release).toHaveBeenCalledOnce();
  });

  it("inserts a brochure file row when a brochure is uploaded", async () => {
    const client = makeMockClient();
    pool.connect.mockResolvedValue(client);

    // BEGIN
    client.query.mockResolvedValueOnce({});
    // INSERT project_files (brochure)
    client.query.mockResolvedValueOnce({ rows: [{ id: 99 }] });
    // INSERT staff_announcements
    client.query.mockResolvedValueOnce({ rows: [{ id: 55 }] });
    // INSERT recipients
    client.query.mockResolvedValueOnce({ rows: [] });
    // COMMIT
    client.query.mockResolvedValueOnce({});

    const req = {
      user: { id: 5 },
      body: { title: "With File", message: "See attachment", recipients: "[7]" },
      files: {
        brochure: [
          {
            filename: "file.pdf",
            originalname: "brochure.pdf",
            mimetype: "application/pdf",
            size: 1024,
          },
        ],
      },
    };
    const res = makeRes();

    await createAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    // First real query after BEGIN should be the project_files INSERT
    const fileInsertCall = client.query.mock.calls.find(([sql]) =>
      sql.includes("project_files"),
    );
    expect(fileInsertCall).toBeTruthy();
    expect(fileInsertCall[1]).toContain("announcement_brochure");
  });

  it("de-duplicates recipient ids before inserting", async () => {
    const client = makeMockClient();
    pool.connect.mockResolvedValue(client);

    client.query.mockResolvedValueOnce({});                    // BEGIN
    client.query.mockResolvedValueOnce({ rows: [{ id: 77 }] }); // INSERT announcements
    client.query.mockResolvedValueOnce({ rows: [] });           // INSERT recipients
    client.query.mockResolvedValueOnce({});                    // COMMIT

    const req = {
      user: { id: 5 },
      body: {
        title: "Dupe Test",
        message: "msg",
        // Duplicate ids: 10 appears twice
        recipients: "[10, 10, 11]",
      },
      files: {},
    };
    const res = makeRes();

    await createAnnouncement(req, res);

    // The recipients INSERT should only have 2 placeholders ($2,$3)
    const recipientCall = client.query.mock.calls.find(([sql]) =>
      sql.includes("staff_announcement_recipients"),
    );
    expect(recipientCall).toBeTruthy();
    // params: [announcementId, 10, 11] → length 3
    expect(recipientCall[1]).toHaveLength(3);
  });
});

// ── listMyAnnouncements ───────────────────────────────────────────────────────

describe("listMyAnnouncements", () => {
  it("returns 401 when req.user is missing", async () => {
    const req = { user: null, query: {} };
    const res = makeRes();

    await listMyAnnouncements(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
  });

  it("returns the announcements list for the authenticated user", async () => {
    const fakeRows = [
      { id: 1, title: "Test", message: "Hello", created_at: new Date() },
    ];
    pool.query.mockResolvedValueOnce({ rows: fakeRows });

    const req = { user: { id: 42 }, query: {} };
    const res = makeRes();

    await listMyAnnouncements(req, res);

    expect(res.json).toHaveBeenCalledWith({ announcements: fakeRows });
  });

  it("uses default limit of 50 when no limit param is supplied", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = { user: { id: 1 }, query: {} };
    const res = makeRes();

    await listMyAnnouncements(req, res);

    const [, params] = pool.query.mock.calls[0];
    expect(params[1]).toBe(50);
  });

  it("clamps limit to a maximum of 200 (bug fix)", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = { user: { id: 1 }, query: { limit: "999999" } };
    const res = makeRes();

    await listMyAnnouncements(req, res);

    const [, params] = pool.query.mock.calls[0];
    expect(params[1]).toBeLessThanOrEqual(200);
  });

  it("enforces a minimum limit of 1", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = { user: { id: 1 }, query: { limit: "0" } };
    const res = makeRes();

    await listMyAnnouncements(req, res);

    const [, params] = pool.query.mock.calls[0];
    expect(params[1]).toBeGreaterThanOrEqual(1);
  });

  it("honours a valid limit within the allowed range", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = { user: { id: 1 }, query: { limit: "25" } };
    const res = makeRes();

    await listMyAnnouncements(req, res);

    const [, params] = pool.query.mock.calls[0];
    expect(params[1]).toBe(25);
  });

  it("returns 500 on DB error", async () => {
    pool.query.mockRejectedValueOnce(new Error("connection lost"));

    const req = { user: { id: 1 }, query: {} };
    const res = makeRes();

    await listMyAnnouncements(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});
