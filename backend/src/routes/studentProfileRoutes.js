import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import {
  getStudentProfile,
  updateStudentProfile,
} from "../controllers/studentProfileController.js";
import { validate } from "../middleware/validate.js";
import { updateStudentProfileSchema } from "../validators/studentProfileSchemas.js";

const router = express.Router();

// Only STUDENTS
router.use(requireAuth, requireRole(["student"]));

router.get("/", getStudentProfile);
router.put("/", validate(updateStudentProfileSchema), updateStudentProfile);

export default router;
