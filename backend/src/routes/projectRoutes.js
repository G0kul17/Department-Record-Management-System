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
  getProjectsCount,
} from "../controllers/projectController.js";
import { upload } from "../config/upload.js";

const router = express.Router();

// Create project (students or staff) — accepts multiple files under fields: srs, ppt, paper, code, portal
router.post(
  "/",
  requireAuth,
  // either student or staff can create a project
  requireRole(["student", "staff", "admin"]),
  upload.array("files", 10), // accept up to 10 files; client should name fields appropriately
  createProject
);

// upload files to existing project (staff/student who belongs to project or admin)
router.post(
  "/:id/files",
  requireAuth,
  requireRole(["student", "staff", "admin"]),
  upload.array("files", 10),
  uploadFilesToProject
);

router.get("/", requireAuth, listProjects);
router.get("/:id", requireAuth, getProjectDetails);
// Public count endpoint for homepage stats
router.get("/count", getProjectsCount);

// Admin verifies project
router.post("/:id/verify", requireAuth, requireRole(["admin"]), verifyProject);

export default router;
