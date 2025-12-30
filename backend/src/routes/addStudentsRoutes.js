import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import { upload } from "../config/upload.js";
import { uploadStudents } from "../controllers/addStudentsController.js";

const router = express.Router();

// Staff & Admin only
router.use(requireAuth, requireRole(["staff", "admin"]));

router.post("/upload", upload.single("students_file"), uploadStudents);

export default router;
