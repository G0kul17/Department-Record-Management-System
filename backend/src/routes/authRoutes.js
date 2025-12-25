import express from "express";
import {
  register,
  verifyOTP,
  login,
  loginVerifyOTP,
  initiateForgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Note:
 * - /register -> create user + send OTP
 * - /verify -> verify OTP (for registration) -> returns JWT
 * - /login -> validate creds and send OTP
 * - /login-verify -> verify login OTP -> returns JWT
 * - /forgot -> initiate forgot password (send OTP)
 * - /reset -> reset password using OTP
 */

router.post("/register", register);
router.post("/verify", verifyOTP);
router.post("/login", login);
router.post("/login-verify", loginVerifyOTP);
router.post("/forgot", initiateForgotPassword);
router.post("/reset", resetPassword);

// Profile endpoints for logged-in users
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);

export default router;
