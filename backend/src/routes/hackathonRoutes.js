// src/routes/hackathonRoutes.js
import express from "express";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import {
  createHackathon,
  listHackathons,
  listCoordinatorHackathons,
  getHackathonDetails,
  verifyHackathon,
  rejectHackathon,
  updateHackathonProgressByCoordinator,
  updateHackathonProgressByStudent,
  getHackathonsCount,
} from "../controllers/hackathonController.js";
import { upload } from "../config/upload.js";
import { validate } from "../middleware/validate.js";
import {
  createHackathonSchema,
  updateHackathonCoordinatorSchema,
  updateHackathonStudentSchema,
} from "../validators/hackathonSchemas.js";
import { reviewSchema } from "../validators/staffSchemas.js";

const router = express.Router();

// Create hackathon entry - multer first, then validate
router.post(
  "/",
  requireAuth,
  requireRole(["student", "alumni", "staff", "admin"]),
  upload.fields([{ name: "proof", maxCount: 1 }]),
  validate(createHackathonSchema),
  createHackathon
);

// List hackathons
router.get("/", optionalAuth, listHackathons);

// Coordinator queue (staff/admin)
router.get(
  "/coordinator/queue",
  requireAuth,
  requireRole(["staff", "admin"]),
  listCoordinatorHackathons,
);

// Get count
router.get("/count", optionalAuth, getHackathonsCount);

// Get details
router.get("/:id", optionalAuth, getHackathonDetails);

// Verify hackathon (staff only)
router.post(
  "/:id/verify",
  requireAuth,
  requireRole(["staff"]),
  validate(reviewSchema),
  verifyHackathon
);

// Reject hackathon (staff only)
router.post(
  "/:id/reject",
  requireAuth,
  requireRole(["staff"]),
  validate(reviewSchema),
  rejectHackathon
);

// Coordinator updates progress fields (duration/rounds/progress/prize)
router.patch(
  "/:id/progress",
  requireAuth,
  requireRole(["staff", "admin"]),
  validate(updateHackathonCoordinatorSchema),
  updateHackathonProgressByCoordinator,
);

// Student updates their own hackathon result fields
router.patch(
  "/:id/student-update",
  requireAuth,
  requireRole(["student", "alumni"]),
  validate(updateHackathonStudentSchema),
  updateHackathonProgressByStudent,
);

export default router;
