import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import { upload } from "../config/upload.js";

import {
  uploadDataFile,
  saveUploadedData,
  listUploadedData,
  viewUploadedData
} from "../controllers/dataUploadController.js";

const router = express.Router();

router.use(requireAuth, requireRole(["staff", "admin"]));

// Upload + Preview
router.post(
  "/preview",
  upload.single("document"),
  uploadDataFile
);

// Save parsed data
router.post("/save", saveUploadedData);

// List uploads (Export Records view)
router.get("/", listUploadedData);

// View full table data
router.get("/:id", viewUploadedData);

export default router;
