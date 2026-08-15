import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../utils/logger.js", () => ({
  default: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() },
  reqContext: vi.fn(() => ({})),
}));

describe("mailService", () => {
  const originalEnv = {
    NODE_ENV: process.env.NODE_ENV,
    ENABLE_FAKE_MAIL: process.env.ENABLE_FAKE_MAIL,
  };

  beforeEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = "development";
    delete process.env.ENABLE_FAKE_MAIL;
  });

  afterEach(() => {
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });

  it("skips OTP email delivery only when fake-mail mode is enabled", async () => {
    process.env.ENABLE_FAKE_MAIL = "true";

    const { sendOTPEmail } = await import("../../services/mailService.js");

    const result = await sendOTPEmail("user@example.com", "123456");

    expect(result).toEqual({ success: false, skipped: true });
  });
});