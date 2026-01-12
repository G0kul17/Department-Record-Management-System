import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import { uploadFacultyProof } from "../config/upload.js";

import {
  createFacultyParticipation,
  updateFacultyParticipation,
  deleteFacultyParticipation,
  listFacultyParticipations
} from "../controllers/facultyParticipationController.js";

const router = express.Router();

// Only staff & admin can access
router.use(requireAuth, requireRole(["staff", "admin"]));

router.post("/", uploadFacultyProof.single("proof"), createFacultyParticipation);
router.put("/:id", uploadFacultyProof.single("proof"), updateFacultyParticipation);
router.delete("/:id", deleteFacultyParticipation);
router.get("/", listFacultyParticipations);

export default router;
