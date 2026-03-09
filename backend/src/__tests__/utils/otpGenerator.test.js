import { describe, it, expect } from "vitest";
import { generateOTP, getExpiryDate } from "../../utils/otpGenerator.js";

describe("otpGenerator", () => {
  describe("generateOTP", () => {
    it("returns a string", () => {
      expect(typeof generateOTP()).toBe("string");
    });

    it("returns exactly 6 characters", () => {
      expect(generateOTP()).toHaveLength(6);
    });

    it("contains only digit characters", () => {
      const otp = generateOTP();
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    it("is in the range 100000–999999", () => {
      const value = Number(generateOTP());
      expect(value).toBeGreaterThanOrEqual(100000);
      expect(value).toBeLessThanOrEqual(999999);
    });

    it("produces different values on repeated calls (probabilistic)", () => {
      const otps = new Set(Array.from({ length: 20 }, generateOTP));
      // With 900000 possible values, 20 calls should almost never all collide
      expect(otps.size).toBeGreaterThan(1);
    });
  });

  describe("getExpiryDate", () => {
    it("returns a Date object", () => {
      expect(getExpiryDate()).toBeInstanceOf(Date);
    });

    it("defaults to 5 minutes from now", () => {
      const before = Date.now();
      const expiry = getExpiryDate();
      const after = Date.now();
      const expectedMs = 5 * 60 * 1000;
      expect(expiry.getTime()).toBeGreaterThanOrEqual(before + expectedMs - 100);
      expect(expiry.getTime()).toBeLessThanOrEqual(after + expectedMs + 100);
    });

    it("accepts a custom minutes value", () => {
      const before = Date.now();
      const expiry = getExpiryDate(10);
      const after = Date.now();
      const expectedMs = 10 * 60 * 1000;
      expect(expiry.getTime()).toBeGreaterThanOrEqual(before + expectedMs - 100);
      expect(expiry.getTime()).toBeLessThanOrEqual(after + expectedMs + 100);
    });

    it("returns a date in the future", () => {
      expect(getExpiryDate().getTime()).toBeGreaterThan(Date.now());
    });
  });
});
