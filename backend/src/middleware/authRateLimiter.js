/**
 * authRateLimiter.js
 *
 * Per-IP rate limiters for sensitive authentication endpoints.
 *
 * NOTE: These limiters use in-process memory (MemoryStore) which is suitable
 * for single-instance deployments. For multi-instance / horizontally-scaled
 * deployments, swap MemoryStore for a shared Redis store via `rate-limit-redis`
 * so counters are consistent across processes.
 *
 * P0-2 fix: credential stuffing, OTP brute-force, registration flooding,
 * and password-reset abuse are now bounded at the API boundary.
 */

import { rateLimit } from "express-rate-limit";

// ── Registration ─────────────────────────────────────────────────────────────
// 5 registration attempts per IP per 15-minute window.
// Prevents mass account creation / email flooding.
export const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,  // Return RateLimit-* headers (RFC 6585)
  legacyHeaders: false,
  message: { message: "Too many registration attempts. Please try again later." },
  skipSuccessfulRequests: false,
});

// ── Login ─────────────────────────────────────────────────────────────────────
// 10 login attempts per IP per 15-minute window.
// Prevents credential stuffing.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
  skipSuccessfulRequests: false,
});

// ── OTP & Password Reset ──────────────────────────────────────────────────────
// 5 OTP/reset attempts per IP per 10-minute window.
// Covers /verify, /login-verify, /forgot-verify, /forgot, /reset.
// The OTP attempt counter in the DB handles per-account lockout; this handles
// per-IP admission to prevent distributed enumeration.
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many verification attempts. Please try again later." },
  skipSuccessfulRequests: false,
});
