import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import {
  getStudentProfile,
  updateStudentProfile
} from "../controllers/studentProfileController.js";

const router = express.Router();

// Only STUDENTS
router.use(requireAuth, requireRole(["student"]));

router.get("/", getStudentProfile);
router.put("/", updateStudentProfile);

export default router;
