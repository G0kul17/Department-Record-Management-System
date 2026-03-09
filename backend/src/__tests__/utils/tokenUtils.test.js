import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "../../utils/tokenUtils.js";

describe("tokenUtils", () => {
  describe("signToken", () => {
    it("produces a non-empty JWT string", () => {
      const token = signToken({ userId: 1 });
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // header.payload.signature
    });

    it("encodes the payload in the token", () => {
      const payload = { userId: 42, role: "admin" };
      const token = signToken(payload);
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(42);
      expect(decoded.role).toBe("admin");
    });

    it("respects a custom expiresIn value", () => {
      const token = signToken({ userId: 1 }, "2h");
      const decoded = verifyToken(token);
      const expectedExp = Math.floor(Date.now() / 1000) + 2 * 3600;
      // Allow 5 seconds of slack
      expect(decoded.exp).toBeGreaterThanOrEqual(expectedExp - 5);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5);
    });

    it("defaults expiry to 1 hour", () => {
      const before = Math.floor(Date.now() / 1000);
      const token = signToken({ userId: 1 });
      const decoded = verifyToken(token);
      const expectedExp = before + 3600;
      expect(decoded.exp).toBeGreaterThanOrEqual(expectedExp - 5);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5);
    });
  });

  describe("verifyToken", () => {
    it("returns the decoded payload for a valid token", () => {
      const token = signToken({ userId: 7, role: "student" });
      const result = verifyToken(token);
      expect(result.userId).toBe(7);
      expect(result.role).toBe("student");
    });

    it("throws TokenExpiredError for an expired token", () => {
      const token = signToken({ userId: 1 }, "0s");
      expect(() => verifyToken(token)).toThrow();
      try {
        verifyToken(token);
      } catch (err) {
        expect(err.name).toBe("TokenExpiredError");
      }
    });

    it("throws JsonWebTokenError for a tampered token", () => {
      const token = signToken({ userId: 1 });
      const tampered = token.slice(0, -3) + "xxx";
      expect(() => verifyToken(tampered)).toThrow();
    });

    it("throws for a completely invalid string", () => {
      expect(() => verifyToken("not.a.jwt")).toThrow();
    });
  });
});
