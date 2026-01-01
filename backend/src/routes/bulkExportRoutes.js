import express from "express";
import { bulkDataExport } from "../controllers/bulkExportController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";

const router = express.Router();

router.get(
  "/bulk-export",
  requireAuth,
  requireRole(["staff", "admin"]),
  bulkDataExport
);

export default router;
