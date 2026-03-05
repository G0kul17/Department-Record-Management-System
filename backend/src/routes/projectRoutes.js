// src/routes/projectRoutes.js
import express from "express";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import {
  createProject,
  uploadFilesToProject,
  listProjects,
  getProjectDetails,
  verifyProject,
  rejectProject,
  getProjectsCount,
} from "../controllers/projectController.js";
import { upload } from "../config/upload.js";
import { validate } from "../middleware/validate.js";
import { createProjectSchema } from "../validators/projectSchemas.js";
import { reviewSchema } from "../validators/staffSchemas.js";

const router = express.Router();

// Create project — multer first (populates req.body from form fields), then validate
router.post(
  "/",
  requireAuth,
  requireRole(["student", "staff", "admin"]),
  upload.fields([
    { name: "srs_document", maxCount: 1 },
    { name: "files", maxCount: 1 },
  ]),
  validate(createProjectSchema),
  createProject,
);

// Upload files to existing project — no body fields requiring validation
router.post(
  "/:id/files",
  requireAuth,
  requireRole(["student", "staff", "admin"]),
  upload.fields([
    { name: "srs_document", maxCount: 1 },
    { name: "files", maxCount: 1 },
  ]),
  uploadFilesToProject,
);

// Public count endpoint (must be BEFORE any ":id" route)
router.get("/count", getProjectsCount);

router.get("/", optionalAuth, listProjects);
router.get("/:id", optionalAuth, getProjectDetails);

router.post(
  "/:id/verify",
  requireAuth,
  requireRole(["staff"]),
  validate(reviewSchema),
  verifyProject,
);

router.post(
  "/:id/reject",
  requireAuth,
  requireRole(["staff"]),
  validate(reviewSchema),
  rejectProject,
);

export default router;
