import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../config/db.js", () => ({
  default: { query: vi.fn() },
}));

vi.mock("../../config/mailer.js", () => ({
  sendMail: vi.fn(),
}));

vi.mock("../../utils/logger.js", () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import pool from "../../config/db.js";
import { sendMail } from "../../config/mailer.js";
import {
  ReviewError,
  reviewProject,
  reviewAchievement,
} from "../../services/reviewService.js";

beforeEach(() => {
  vi.clearAllMocks();
  sendMail.mockResolvedValue(undefined);
});

// ── ReviewError ────────────────────────────────────────────────────────────────

describe("ReviewError", () => {
  it("is an instance of Error", () => {
    const err = new ReviewError(403, "Forbidden");
    expect(err).toBeInstanceOf(Error);
  });

  it("stores the HTTP status code", () => {
    const err = new ReviewError(404, "Not Found");
    expect(err.status).toBe(404);
  });

  it("stores the message", () => {
    const err = new ReviewError(403, "Access denied");
    expect(err.message).toBe("Access denied");
  });
});

// ── reviewProject ─────────────────────────────────────────────────────────────

describe("reviewProject", () => {
  // Helper: mock a full successful approve flow
  function mockApproveFlow(opts = {}) {
    // 1st query: authorization check — returns a row
    pool.query.mockResolvedValueOnce({ rows: opts.authRows ?? [{ "?column?": 1 }] });
    // 2nd query: UPDATE projects RETURNING ...
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, title: "My Project", created_by: opts.createdBy ?? 10 }],
    });
    // 3rd query: SELECT email FROM users
    if (opts.createdBy !== null) {
      pool.query.mockResolvedValueOnce({
        rows: opts.emailRows ?? [{ email: "student@test.com" }],
      });
    }
  }

  it("returns success message on approve", async () => {
    mockApproveFlow();
    const result = await reviewProject(1, 2, "approve", "Looks good");
    expect(result).toEqual({ message: "Project approved" });
  });

  it("returns success message on reject", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{}] }); // auth ok
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, title: "X", created_by: 5 }],
    });
    pool.query.mockResolvedValueOnce({ rows: [{ email: "s@test.com" }] });

    const result = await reviewProject(1, 2, "reject", "Needs work");
    expect(result).toEqual({ message: "Project rejected" });
  });

  it("passes 'approved' status to DB on approve action", async () => {
    mockApproveFlow();
    await reviewProject(1, 2, "approve", null);
    // Second call is the UPDATE
    const [, params] = pool.query.mock.calls[1];
    expect(params[0]).toBe("approved");
    expect(params[3]).toBe(true);
  });

  it("passes 'rejected' status to DB on reject action", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{}] });
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, title: "X", created_by: 5 }],
    });
    pool.query.mockResolvedValueOnce({ rows: [{ email: "s@test.com" }] });

    await reviewProject(1, 2, "reject", null);
    const [, params] = pool.query.mock.calls[1];
    expect(params[0]).toBe("rejected");
    expect(params[3]).toBe(false);
  });

  it("sends an email notification to the project creator on approve", async () => {
    mockApproveFlow();
    await reviewProject(1, 2, "approve", "Nice work");
    expect(sendMail).toHaveBeenCalledOnce();
    const mailArgs = sendMail.mock.calls[0][0];
    expect(mailArgs.to).toBe("student@test.com");
    expect(mailArgs.subject).toContain("approved");
  });

  it("sends an email notification on reject", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{}] });
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, title: "Test", created_by: 5 }],
    });
    pool.query.mockResolvedValueOnce({ rows: [{ email: "s@test.com" }] });

    await reviewProject(1, 2, "reject", "Bad work");

    expect(sendMail).toHaveBeenCalledOnce();
    const mailArgs = sendMail.mock.calls[0][0];
    expect(mailArgs.subject).toContain("rejected");
  });

  it("throws ReviewError(403) when staff is not an activity coordinator", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // no auth row
    await expect(reviewProject(1, 2, "approve", null)).rejects.toMatchObject({
      status: 403,
    });
  });

  it("throws ReviewError(404) when project is not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{}] }); // auth ok
    pool.query.mockResolvedValueOnce({ rows: [] });   // project not found
    await expect(reviewProject(99, 2, "approve", null)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("skips email when creator has no email row in the DB", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{}] });
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, title: "X", created_by: 5 }],
    });
    pool.query.mockResolvedValueOnce({ rows: [] }); // no email row

    await reviewProject(1, 2, "approve", null);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("skips email when created_by is null/undefined", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{}] });
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, title: "X", created_by: null }],
    });

    await reviewProject(1, 2, "approve", null);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("does not throw when email sending fails (logs error instead)", async () => {
    mockApproveFlow();
    sendMail.mockRejectedValueOnce(new Error("SMTP down"));

    // Should NOT throw; email failure is caught and logged
    await expect(reviewProject(1, 2, "approve", null)).resolves.toEqual({
      message: "Project approved",
    });
  });
});

// ── reviewAchievement ──────────────────────────────────────────────────────────

describe("reviewAchievement", () => {
  function mockApproveAchievementFlow(opts = {}) {
    pool.query.mockResolvedValueOnce({ rows: opts.authRows ?? [{ "?column?": 1 }] });
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, title: "My Achievement", user_id: opts.userId ?? 20 }],
    });
    pool.query.mockResolvedValueOnce({
      rows: opts.emailRows ?? [{ email: "student@test.com" }],
    });
  }

  it("returns success message on approve", async () => {
    mockApproveAchievementFlow();
    const result = await reviewAchievement(1, 2, "approve", "Well done");
    expect(result).toEqual({ message: "Achievement approved" });
  });

  it("returns success message on reject", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{}] });
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, title: "A", user_id: 5 }],
    });
    pool.query.mockResolvedValueOnce({ rows: [{ email: "s@t.com" }] });

    const result = await reviewAchievement(1, 2, "reject", "Invalid proof");
    expect(result).toEqual({ message: "Achievement rejected" });
  });

  it("passes 'approved' status and verified=true to DB on approve", async () => {
    mockApproveAchievementFlow();
    await reviewAchievement(1, 2, "approve", null);
    const [, params] = pool.query.mock.calls[1];
    expect(params[0]).toBe("approved");
    expect(params[3]).toBe(true);
  });

  it("passes 'rejected' status and verified=false to DB on reject", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{}] });
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, title: "A", user_id: 5 }],
    });
    pool.query.mockResolvedValueOnce({ rows: [{ email: "s@t.com" }] });

    await reviewAchievement(1, 2, "reject", null);
    const [, params] = pool.query.mock.calls[1];
    expect(params[0]).toBe("rejected");
    expect(params[3]).toBe(false);
  });

  it("sends email to achievement owner on approve", async () => {
    mockApproveAchievementFlow();
    await reviewAchievement(1, 2, "approve", "Great");
    expect(sendMail).toHaveBeenCalledOnce();
    expect(sendMail.mock.calls[0][0].to).toBe("student@test.com");
    expect(sendMail.mock.calls[0][0].subject).toContain("approved");
  });

  it("throws ReviewError(403) when staff is not an activity coordinator", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(reviewAchievement(1, 2, "approve", null)).rejects.toMatchObject({
      status: 403,
    });
  });

  it("throws ReviewError(404) when achievement is not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{}] });
    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(reviewAchievement(99, 2, "approve", null)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("does not throw when email sending fails (logs error instead)", async () => {
    mockApproveAchievementFlow();
    sendMail.mockRejectedValueOnce(new Error("SMTP error"));

    await expect(reviewAchievement(1, 2, "approve", null)).resolves.toEqual({
      message: "Achievement approved",
    });
  });

  it("uses null for comment when none is provided", async () => {
    mockApproveAchievementFlow();
    await reviewAchievement(1, 2, "approve", undefined);
    const [, params] = pool.query.mock.calls[1];
    expect(params[1]).toBeNull(); // comment param
  });
});
