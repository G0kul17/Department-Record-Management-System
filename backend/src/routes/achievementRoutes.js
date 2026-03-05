// src/routes/achievementRoutes.js
import express from "express";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import {
  createAchievement,
  listAchievements,
  verifyAchievement,
  rejectAchievement,
  getAchievementsCount,
  getAchievementDetails,
  getAchievementsLeaderboard,
} from "../controllers/achievementController.js";
import { upload } from "../config/upload.js";
import { validate } from "../middleware/validate.js";
import { createAchievementSchema } from "../validators/achievementSchemas.js";
import { reviewSchema } from "../validators/staffSchemas.js";

const router = express.Router();

// Student creates achievement — multer first (populates req.body), then validate
router.post(
  "/",
  requireAuth,
  requireRole(["student", "alumni", "staff", "admin"]),
  upload.fields([
    { name: "proof", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
    { name: "event_photos", maxCount: 1 },
  ]),
  validate(createAchievementSchema),
  createAchievement,
);

router.get("/", optionalAuth, listAchievements);
router.get("/count", getAchievementsCount);
router.get("/leaderboard", getAchievementsLeaderboard);
router.get("/:id", optionalAuth, getAchievementDetails);

router.post(
  "/:id/verify",
  requireAuth,
  requireRole(["staff"]),
  validate(reviewSchema),
  verifyAchievement,
);

router.post(
  "/:id/reject",
  requireAuth,
  requireRole(["staff"]),
  validate(reviewSchema),
  rejectAchievement,
);

export default router;
