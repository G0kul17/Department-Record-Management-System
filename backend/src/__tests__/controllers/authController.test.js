import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks must be declared before the imports that depend on them.

vi.mock("../../config/db.js", () => ({
  default: { query: vi.fn() },
}));

vi.mock("../../config/mailer.js", () => ({
  sendMail: vi.fn(),
}));

vi.mock("../../utils/logger.js", () => ({
  default: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() },
  reqContext: vi.fn(() => ({})),
}));

vi.mock("../../utils/tokenUtils.js", () => ({
  signToken: vi.fn(() => "signed.jwt.token"),
  verifyToken: vi.fn(),
}));

vi.mock("../../utils/sessionUtils.js", () => ({
  createSession: vi.fn(),
  getUserActiveSessions: vi.fn(),
  invalidateAllUserSessions: vi.fn(),
}));

vi.mock("../../utils/otpGenerator.js", () => ({
  generateOTP: vi.fn(() => "123456"),
  getExpiryDate: vi.fn(() => new Date(Date.now() + 5 * 60 * 1000)),
}));

vi.mock("../../utils/roleUtils.js", () => ({
  detectRole: vi.fn(() => "student"),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(async () => "hashed"),
    compare: vi.fn(async () => true),
  },
}));

import pool from "../../config/db.js";
import { sendMail } from "../../config/mailer.js";
import { signToken } from "../../utils/tokenUtils.js";
import { createSession } from "../../utils/sessionUtils.js";
import { verifyOTP, loginVerifyOTP } from "../../controllers/authController.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeRes() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

function makeReq(overrides = {}) {
  return {
    body: {},
    headers: {},
    correlationId: "test-trace-id",
    ip: "127.0.0.1",
    get: vi.fn(() => "TestAgent/1.0"),
    ...overrides,
  };
}

/** A future date so OTP is not expired in tests. */
const FUTURE = new Date(Date.now() + 10 * 60 * 1000);

beforeEach(() => {
  vi.clearAllMocks();
  sendMail.mockResolvedValue(undefined);
  createSession.mockResolvedValue({ session_token: "sess-abc" });
  signToken.mockReturnValue("signed.jwt.token");
});

// ── verifyOTP ──────────────────────────────────────────────────────────────────

describe("verifyOTP", () => {
  it("returns 400 when email is missing", async () => {
    const req = makeReq({ body: { otp: "123456" } });
    const res = makeRes();

    await verifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Email and OTP required" });
  });

  it("returns 400 when otp is missing", async () => {
    const req = makeReq({ body: { email: "test@example.com" } });
    const res = makeRes();

    await verifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Email and OTP required" });
  });

  it("returns 401 when no OTP record exists for the email", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // no OTP row

    const req = makeReq({ body: { email: "ghost@example.com", otp: "000000" } });
    const res = makeRes();

    await verifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid OTP" });
  });

  it("returns 429 when the OTP has exceeded 5 attempts", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 1, otp_code: "123456", expires_at: FUTURE, attempts: 5 }],
      })
      .mockResolvedValueOnce({ rowCount: 1 }); // DELETE

    const req = makeReq({ body: { email: "user@example.com", otp: "123456" } });
    const res = makeRes();

    await verifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
  });

  it("returns 401 when the OTP is expired", async () => {
    const past = new Date(Date.now() - 1000);
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 1, otp_code: "123456", expires_at: past, attempts: 0 }],
      })
      .mockResolvedValueOnce({ rowCount: 1 }); // DELETE

    const req = makeReq({ body: { email: "user@example.com", otp: "123456" } });
    const res = makeRes();

    await verifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "OTP expired" });
  });

  it("returns 401 and increments attempts when OTP code is wrong", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 1, otp_code: "999999", expires_at: FUTURE, attempts: 0 }],
      })
      .mockResolvedValueOnce({ rowCount: 1 }); // UPDATE attempts

    const req = makeReq({ body: { email: "user@example.com", otp: "123456" } });
    const res = makeRes();

    await verifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid OTP" });
    // Verify an UPDATE query was called for attempts
    const updateCall = pool.query.mock.calls.find(([sql]) =>
      sql.includes("attempts"),
    );
    expect(updateCall).toBeTruthy();
  });

  it("returns 500 when user row is missing after successful OTP verification (bug fix)", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 1, otp_code: "123456", expires_at: FUTURE, attempts: 0 }],
      })                                        // SELECT otp_verifications
      .mockResolvedValueOnce({ rowCount: 1 })  // UPDATE users SET is_verified=true
      .mockResolvedValueOnce({ rowCount: 1 })  // DELETE otp_verifications
      .mockResolvedValueOnce({ rows: [] });    // SELECT users → empty (bug fix target)

    const req = makeReq({ body: { email: "vanished@example.com", otp: "123456" } });
    const res = makeRes();

    await verifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Server error" }),
    );
    // Session must NOT be created if the user was not found
    expect(createSession).not.toHaveBeenCalled();
  });

  it("returns 200 with a JWT and session token on successful verification", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 1, otp_code: "123456", expires_at: FUTURE, attempts: 0 }],
      })
      .mockResolvedValueOnce({ rowCount: 1 })  // UPDATE is_verified
      .mockResolvedValueOnce({ rowCount: 1 })  // DELETE otp
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            email: "user@example.com",
            role: "student",
            profile_details: {},
          },
        ],
      });                                       // SELECT users

    const req = makeReq({ body: { email: "user@example.com", otp: "123456" } });
    const res = makeRes();

    await verifyOTP(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Verified", token: "signed.jwt.token" }),
    );
    expect(createSession).toHaveBeenCalledOnce();
  });
});

// ── loginVerifyOTP ────────────────────────────────────────────────────────────

describe("loginVerifyOTP", () => {
  it("returns 400 when email is missing", async () => {
    const req = makeReq({ body: { otp: "123456" } });
    const res = makeRes();

    await loginVerifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Email and OTP required" });
  });

  it("returns 400 when otp is missing", async () => {
    const req = makeReq({ body: { email: "test@example.com" } });
    const res = makeRes();

    await loginVerifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 401 when no OTP record exists", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = makeReq({ body: { email: "nobody@example.com", otp: "111111" } });
    const res = makeRes();

    await loginVerifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid OTP" });
  });

  it("returns 429 when too many failed OTP attempts", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 2, otp_code: "123456", expires_at: FUTURE, attempts: 5 }],
      })
      .mockResolvedValueOnce({ rowCount: 1 }); // DELETE

    const req = makeReq({ body: { email: "user@example.com", otp: "123456" } });
    const res = makeRes();

    await loginVerifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
  });

  it("returns 401 when OTP is expired", async () => {
    const past = new Date(Date.now() - 1000);
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 2, otp_code: "123456", expires_at: past, attempts: 0 }],
      })
      .mockResolvedValueOnce({ rowCount: 1 }); // DELETE

    const req = makeReq({ body: { email: "user@example.com", otp: "123456" } });
    const res = makeRes();

    await loginVerifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "OTP expired" });
  });

  it("returns 401 for a wrong OTP code", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 2, otp_code: "999999", expires_at: FUTURE, attempts: 1 }],
      })
      .mockResolvedValueOnce({ rowCount: 1 }); // UPDATE attempts

    const req = makeReq({ body: { email: "user@example.com", otp: "123456" } });
    const res = makeRes();

    await loginVerifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid OTP" });
  });

  it("returns 500 when user row is missing after OTP deletion (bug fix)", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 2, otp_code: "123456", expires_at: FUTURE, attempts: 0 }],
      })                                        // SELECT otp_verifications
      .mockResolvedValueOnce({ rowCount: 1 })  // DELETE otp_verifications
      .mockResolvedValueOnce({ rows: [] });    // SELECT users → empty (bug fix target)

    const req = makeReq({ body: { email: "ghost@example.com", otp: "123456" } });
    const res = makeRes();

    await loginVerifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Server error" }),
    );
    // A token must NOT have been issued
    expect(signToken).not.toHaveBeenCalled();
  });

  it("returns 200 with JWT on successful login OTP verification", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 2, otp_code: "123456", expires_at: FUTURE, attempts: 0 }],
      })
      .mockResolvedValueOnce({ rowCount: 1 })  // DELETE otp
      .mockResolvedValueOnce({
        rows: [
          {
            id: 20,
            email: "user@example.com",
            role: "student",
            profile_details: {},
          },
        ],
      })                                       // SELECT users
      .mockResolvedValueOnce({ rows: [] });   // SELECT student_profiles

    const req = makeReq({ body: { email: "user@example.com", otp: "123456" } });
    const res = makeRes();

    await loginVerifyOTP(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: "signed.jwt.token" }),
    );
    expect(createSession).toHaveBeenCalledOnce();
  });
});
