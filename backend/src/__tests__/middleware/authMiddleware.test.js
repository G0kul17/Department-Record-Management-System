import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks must be declared before imports that depend on them ---

vi.mock("../../utils/tokenUtils.js", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("../../utils/sessionUtils.js", () => ({
  verifySession: vi.fn(),
  extendSession: vi.fn(),
}));

vi.mock("../../config/db.js", () => ({
  default: { query: vi.fn() },
}));

import { verifyToken } from "../../utils/tokenUtils.js";
import { verifySession, extendSession } from "../../utils/sessionUtils.js";
import pool from "../../config/db.js";
import { requireAuth, optionalAuth } from "../../middleware/authMiddleware.js";

function makeRes() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
  extendSession.mockResolvedValue({});
});

// ── requireAuth ────────────────────────────────────────────────────────────────

describe("requireAuth", () => {
  describe("no auth headers", () => {
    it("returns 401 'No token' when both Authorization and x-session-token are absent", async () => {
      const req = { headers: {} };
      const res = makeRes();
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "No token" });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("session-token path", () => {
    it("returns 401 'Invalid session' when verifySession returns null", async () => {
      verifySession.mockResolvedValueOnce(null);
      const req = { headers: { "x-session-token": "bad-token" } };
      const res = makeRes();
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid session" });
    });

    it("returns 401 'User not found' when session is valid but user not in DB", async () => {
      verifySession.mockResolvedValueOnce({ user_id: 99 });
      pool.query.mockResolvedValueOnce({ rows: [] });
      const req = { headers: { "x-session-token": "good-token" } };
      const res = makeRes();
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("sets req.user, calls next() and extends session on valid session token", async () => {
      const mockSession = { user_id: 42 };
      verifySession.mockResolvedValueOnce(mockSession);
      pool.query.mockResolvedValueOnce({ rows: [{ id: 42, role: "student" }] });

      const req = { headers: { "x-session-token": "valid-token" } };
      const res = makeRes();
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(req.user).toEqual({ id: 42, role: "student" });
      expect(extendSession).toHaveBeenCalledWith("valid-token");
      expect(next).toHaveBeenCalledOnce();
    });

    it("returns 401 when session verification throws", async () => {
      verifySession.mockRejectedValueOnce(new Error("DB error"));
      const req = { headers: { "x-session-token": "some-token" } };
      const res = makeRes();
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Bearer token path", () => {
    it("returns 401 'Invalid token format' when Authorization header has no token after 'Bearer '", async () => {
      const req = { headers: { authorization: "Bearer " } };
      const res = makeRes();
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid token format" });
    });

    it("calls next() and sets req.user for a valid Bearer JWT without sid", async () => {
      verifyToken.mockReturnValueOnce({ id: 7, role: "staff" });
      const req = { headers: { authorization: "Bearer valid.jwt.token" } };
      const res = makeRes();
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(req.user).toEqual({ id: 7, role: "staff" });
      expect(next).toHaveBeenCalledOnce();
    });

    it("returns 401 'Token expired' for an expired JWT", async () => {
      const expiredErr = new Error("jwt expired");
      expiredErr.name = "TokenExpiredError";
      verifyToken.mockImplementationOnce(() => { throw expiredErr; });

      const req = { headers: { authorization: "Bearer expired.jwt.token" } };
      const res = makeRes();
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Token expired" });
    });

    it("returns 401 'Invalid token' for a malformed JWT", async () => {
      verifyToken.mockImplementationOnce(() => { throw new Error("invalid"); });

      const req = { headers: { authorization: "Bearer bad.token" } };
      const res = makeRes();
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    });

    it("returns 401 'Session revoked' when JWT has sid but session is no longer active", async () => {
      verifyToken.mockReturnValueOnce({ id: 5, role: "admin", sid: "session-abc" });
      verifySession.mockResolvedValueOnce(null); // session revoked

      const req = { headers: { authorization: "Bearer sid.jwt.token" } };
      const res = makeRes();
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Session revoked" });
    });

    it("calls next() when JWT has sid and session is still active", async () => {
      const mockSession = { id: "session-abc", user_id: 5 };
      verifyToken.mockReturnValueOnce({ id: 5, role: "admin", sid: "session-abc" });
      verifySession.mockResolvedValueOnce(mockSession);

      const req = { headers: { authorization: "Bearer sid.jwt.token" } };
      const res = makeRes();
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(extendSession).toHaveBeenCalledWith("session-abc");
      expect(req.session).toEqual(mockSession);
      expect(next).toHaveBeenCalledOnce();
    });
  });
});

// ── optionalAuth ───────────────────────────────────────────────────────────────

describe("optionalAuth", () => {
  it("calls next() without setting req.user when no auth headers are present", async () => {
    const req = { headers: {} };
    const res = makeRes();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("sets req.user and calls next() for a valid session token", async () => {
    verifySession.mockResolvedValueOnce({ user_id: 8 });
    pool.query.mockResolvedValueOnce({ rows: [{ id: 8, role: "student" }] });

    const req = { headers: { "x-session-token": "valid-session" } };
    const res = makeRes();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(req.user).toEqual({ id: 8, role: "student" });
    expect(next).toHaveBeenCalledOnce();
  });

  it("sets req.user and calls next() for a valid Bearer JWT", async () => {
    verifyToken.mockReturnValueOnce({ id: 3, role: "staff" });

    const req = { headers: { authorization: "Bearer valid.jwt.token" } };
    const res = makeRes();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(req.user).toEqual({ id: 3, role: "staff" });
    expect(next).toHaveBeenCalledOnce();
  });

  it("returns 401 'Token expired' for expired JWT in optionalAuth", async () => {
    const expiredErr = new Error("jwt expired");
    expiredErr.name = "TokenExpiredError";
    verifyToken.mockImplementationOnce(() => { throw expiredErr; });

    const req = { headers: { authorization: "Bearer expired.jwt" } };
    const res = makeRes();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token expired" });
  });
});
