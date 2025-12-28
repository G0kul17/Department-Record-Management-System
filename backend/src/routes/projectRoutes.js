// src/routes/projectRoutes.js
import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
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

const router = express.Router();

// Create project (students or staff) — accepts multiple files under fields: srs, ppt, paper, code, portal
// Require SRS document on creation: accept 'srs_document' plus optional 'files'
router.post(
  "/",
  requireAuth,
  // either student or staff can create a project
  requireRole(["student", "staff", "admin"]),
  upload.fields([
    { name: "srs_document", maxCount: 1 },
    { name: "files", maxCount: 1 },
  ]),
  createProject
);

// upload files to existing project (staff/student who belongs to project or admin)
router.post(
  "/:id/files",
  requireAuth,
  requireRole(["student", "staff", "admin"]),
  upload.fields([
    { name: "srs_document", maxCount: 1 },
    { name: "files", maxCount: 1 },
  ]),
  uploadFilesToProject
);

// Public count endpoint for homepage stats (must be BEFORE any ":id" route)
router.get("/count", getProjectsCount);

router.get("/", requireAuth, listProjects);
router.get("/:id", requireAuth, getProjectDetails);

// Admin verifies project
router.post(
  "/:id/verify",
  requireAuth,
  requireRole(["admin", "staff"]),
  verifyProject
);

// Staff/Admin rejects project
router.post(
  "/:id/reject",
  requireAuth,
  requireRole(["admin", "staff"]),
  rejectProject
);

export default router;
