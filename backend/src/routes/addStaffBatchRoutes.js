import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import { upload } from "../config/upload.js";
import { uploadStaffBatch } from "../controllers/addStaffBatchController.js";

const router = express.Router();

// Admin only
router.use(requireAuth, requireRole(["admin"]));

router.post("/upload", upload.single("staff_file"), uploadStaffBatch);

export default router;
