import express from "express";
import {
  bulkDataExport,
  listBulkExports,
} from "../controllers/bulkExportController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";

const router = express.Router();

router.get(
  "/bulk-export",
  requireAuth,
  requireRole(["staff", "admin"]),
  bulkDataExport
);

// List available exported files for download
router.get(
  "/bulk-export/list",
  requireAuth,
  requireRole(["staff", "admin"]),
  listBulkExports
);

export default router;
