import express from "express";
import {
  register,
  verifyOTP,
  login,
  loginVerifyOTP,
  initiateForgotPassword,
  forgotVerifyOTP,
  resetPassword,
  getProfile,
  updateProfile,
  logout,
  updateProfilePhoto,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { upload } from "../config/upload.js";
import { validate } from "../middleware/validate.js";
import {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  forgotSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../validators/authSchemas.js";

const router = express.Router();

/**
 * Note:
 * - /register -> create user + send OTP
 * - /verify -> verify OTP (for registration) -> returns JWT
 * - /login -> validate creds and send OTP (or return token if session active)
 * - /login-verify -> verify login OTP -> returns JWT + creates session
 * - /forgot -> initiate forgot password (send OTP)
 * - /reset -> reset password using OTP
 * - /logout -> invalidate session
 */

router.post("/register", validate(registerSchema), register);
router.post("/verify", validate(verifyOtpSchema), verifyOTP);
router.post("/login", validate(loginSchema), login);
router.post("/login-verify", validate(verifyOtpSchema), loginVerifyOTP);
router.post("/forgot", validate(forgotSchema), initiateForgotPassword);
router.post("/forgot-verify", validate(verifyOtpSchema), forgotVerifyOTP);
router.post("/reset", validate(resetPasswordSchema), resetPassword);
router.post("/logout", requireAuth, logout);

// Profile endpoints for logged-in users
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, validate(updateProfileSchema), updateProfile);

// Upload profile photo (avatar) — multer runs first, no body fields to validate
router.post(
  "/profile/photo",
  requireAuth,
  upload.single("avatar"),
  updateProfilePhoto,
);

export default router;
