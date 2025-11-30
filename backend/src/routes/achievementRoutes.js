// src/routes/achievementRoutes.js
import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import {
  createAchievement,
  listAchievements,
  verifyAchievement,
  rejectAchievement,
  getAchievementsCount,
  getAchievementDetails,
} from "../controllers/achievementController.js";
import { upload } from "../config/upload.js";

const router = express.Router();

// Student creates achievement with optional proof file (single file field 'proof')
router.post(
  "/",
  requireAuth,
  // Allow admin to create achievements too (auto-approves in controller)
  requireRole(["student", "alumni", "staff", "admin"]),
  upload.single("proof"),
  createAchievement
);

router.get("/", requireAuth, listAchievements);
// Public count endpoint for homepage stats
router.get("/count", getAchievementsCount);

// Single achievement details
router.get("/:id", requireAuth, getAchievementDetails);

// Admin verifies achievement
router.post(
  "/:id/verify",
  requireAuth,
  requireRole(["admin", "staff"]),
  verifyAchievement
);

// Staff/Admin rejects achievement
router.post(
  "/:id/reject",
  requireAuth,
  requireRole(["admin", "staff"]),
  rejectAchievement
);

export default router;
