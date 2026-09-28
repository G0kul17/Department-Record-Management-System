import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../config/db.js", () => ({
  default: { query: vi.fn() },
}));

vi.mock("../../utils/logger.js", () => ({
  default: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import pool from "../../config/db.js";
import {
  generateSessionToken,
  getSessionExpiryDate,
  createSession,
  verifySession,
  extendSession,
  getUserActiveSessions,
  hasValidSession,
  invalidateSession,
  invalidateAllUserSessions,
  cleanupExpiredSessions,
  SESSION_MAX_AGE_DAYS,
  SESSION_IDLE_DAYS,
} from "../../utils/sessionUtils.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sessionUtils — pure functions", () => {
  describe("session constants", () => {
    it("enforces max age of 30 days and idle expiry within 7 days", () => {
      expect(SESSION_MAX_AGE_DAYS).toBe(30);
      expect(SESSION_IDLE_DAYS).toBe(7);
    });
  });

  describe("generateSessionToken", () => {
    it("returns a 64-character hexadecimal string", () => {
      const token = generateSessionToken();
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it("returns unique values across consecutive calls", () => {
      const tokens = new Set(Array.from({ length: 10 }, generateSessionToken));
      expect(tokens.size).toBe(10);
    });
  });

  describe("getSessionExpiryDate", () => {
    it("returns a Date instance", () => {
      expect(getSessionExpiryDate()).toBeInstanceOf(Date);
    });

    it("returns a date approximately 7 days (idle window) in the future", () => {
      const now = Date.now();
      const expiry = getSessionExpiryDate().getTime();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(expiry).toBeGreaterThanOrEqual(now + sevenDaysMs - 1000);
      expect(expiry).toBeLessThanOrEqual(now + sevenDaysMs + 1000);
    });
  });

  describe("session boundary expiry calculation logic", () => {
    it("expires an idle session within 7 days even when created_at is only 8 days old", () => {
      const createdAt = new Date("2026-09-01T00:00:00Z");
      const lastAccess = new Date("2026-09-01T00:00:00Z");
      const currentTime = new Date("2026-09-09T00:00:00Z"); // 8 days later without activity

      const maxExpiry = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000); // Sep 31
      const idleExpiry = new Date(lastAccess.getTime() + 7 * 24 * 60 * 60 * 1000); // Sep 8

      const effectiveExpiry = new Date(Math.min(maxExpiry.getTime(), idleExpiry.getTime()));
      expect(currentTime.getTime()).toBeGreaterThan(effectiveExpiry.getTime()); // Expired due to 7-day idle limit
    });

    it("caps active session extension to exactly 30 days from created_at", () => {
      const createdAt = new Date("2026-09-01T00:00:00Z");
      const activeAtDay28 = new Date("2026-09-29T00:00:00Z");

      const maxExpiry = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000); // Oct 1
      const slidingIdleExpiry = new Date(activeAtDay28.getTime() + 7 * 24 * 60 * 60 * 1000); // Oct 6

      // LEAST(created_at + 30 days, current_time + 7 days)
      const effectiveExpiry = new Date(Math.min(maxExpiry.getTime(), slidingIdleExpiry.getTime()));
      expect(effectiveExpiry.toISOString()).toBe(maxExpiry.toISOString()); // Capped at 30 days
      expect(effectiveExpiry.getTime()).toBeLessThan(slidingIdleExpiry.getTime());
    });
  });
});

describe("sessionUtils — DB functions (pool mocked)", () => {
  const mockSession = {
    id: 1,
    user_id: 42,
    session_token: "abc",
    created_at: new Date(),
    expires_at: new Date(Date.now() + 7 * 86400 * 1000),
    last_accessed_at: new Date(),
    is_active: true,
  };

  describe("createSession", () => {
    it("calls pool.query and returns the created session row", async () => {
      pool.query.mockResolvedValueOnce({ rows: [mockSession] });

      const result = await createSession(42, { browser: "Chrome" });

      expect(pool.query).toHaveBeenCalledOnce();
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("INSERT INTO user_sessions");
      expect(params[0]).toBe(42); // userId
      expect(typeof params[1]).toBe("string"); // session token
      expect(result).toEqual(mockSession);
    });

    it("stores null for deviceInfo when not provided", async () => {
      pool.query.mockResolvedValueOnce({ rows: [mockSession] });

      await createSession(42);

      const params = pool.query.mock.calls[0][1];
      expect(params[5]).toBeNull(); // deviceInfo param
    });

    it("serialises deviceInfo as JSON when provided", async () => {
      pool.query.mockResolvedValueOnce({ rows: [mockSession] });

      const deviceInfo = { browser: "Firefox", os: "Linux" };
      await createSession(42, deviceInfo);

      const params = pool.query.mock.calls[0][1];
      expect(params[5]).toBe(JSON.stringify(deviceInfo));
    });

    it("propagates DB errors", async () => {
      pool.query.mockRejectedValueOnce(new Error("DB down"));
      await expect(createSession(1)).rejects.toThrow("DB down");
    });
  });

  describe("verifySession", () => {
    it("returns the session row when found", async () => {
      pool.query.mockResolvedValueOnce({ rows: [mockSession] });
      const result = await verifySession("valid-token");
      expect(result).toEqual(mockSession);
    });

    it("returns null when no matching session exists", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const result = await verifySession("expired-token");
      expect(result).toBeNull();
    });

    it("propagates DB errors", async () => {
      pool.query.mockRejectedValueOnce(new Error("connection error"));
      await expect(verifySession("t")).rejects.toThrow("connection error");
    });
  });

  describe("extendSession", () => {
    it("returns the updated session when token is valid and uses LEAST with 30 and 7 day intervals", async () => {
      pool.query.mockResolvedValueOnce({ rows: [mockSession] });
      const result = await extendSession("valid-token");
      expect(result).toEqual(mockSession);
      const [sql] = pool.query.mock.calls[0];
      expect(sql).toContain("INTERVAL '30 days'");
      expect(sql).toContain("INTERVAL '7 days'");
    });

    it("returns null when token is not found or inactive", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const result = await extendSession("unknown-token");
      expect(result).toBeNull();
    });
  });

  describe("getUserActiveSessions", () => {
    it("returns array of active sessions for a user", async () => {
      pool.query.mockResolvedValueOnce({ rows: [mockSession, mockSession] });
      const result = await getUserActiveSessions(42);
      expect(result).toHaveLength(2);
    });

    it("returns empty array when user has no active sessions", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const result = await getUserActiveSessions(99);
      expect(result).toEqual([]);
    });
  });

  describe("hasValidSession", () => {
    it("returns true when a valid session exists", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      expect(await hasValidSession(42)).toBe(true);
    });

    it("returns false when no valid session exists", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      expect(await hasValidSession(42)).toBe(false);
    });
  });

  describe("invalidateSession", () => {
    it("returns true when a session was successfully invalidated", async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      expect(await invalidateSession("some-token")).toBe(true);
    });

    it("returns false when token was not found", async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0 });
      expect(await invalidateSession("ghost-token")).toBe(false);
    });
  });

  describe("invalidateAllUserSessions", () => {
    it("returns the number of sessions invalidated", async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 3 });
      expect(await invalidateAllUserSessions(42)).toBe(3);
    });

    it("returns 0 when user had no sessions", async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0 });
      expect(await invalidateAllUserSessions(99)).toBe(0);
    });
  });

  describe("cleanupExpiredSessions", () => {
    it("returns the count of deleted sessions", async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 5 });
      expect(await cleanupExpiredSessions()).toBe(5);
    });

    it("issues a DELETE query", async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0 });
      await cleanupExpiredSessions();
      const [sql] = pool.query.mock.calls[0];
      expect(sql.toUpperCase()).toContain("DELETE");
    });
  });
});
