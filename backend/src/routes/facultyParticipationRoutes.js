import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import { uploadFacultyProof } from "../config/upload.js";
import {
  createFacultyParticipation,
  updateFacultyParticipation,
  deleteFacultyParticipation,
  listFacultyParticipations,
  getFacultyParticipationsCount,
} from "../controllers/facultyParticipationController.js";
import { validate } from "../middleware/validate.js";
import {
  createFacultyParticipationSchema,
  updateFacultyParticipationSchema,
} from "../validators/facultySchemas.js";

const router = express.Router();

// Only staff & admin can access
router.use(requireAuth, requireRole(["staff", "admin"]));

// multer first (populates req.body from form fields), then validate
router.post("/", uploadFacultyProof.single("proof"), validate(createFacultyParticipationSchema), createFacultyParticipation);
router.put("/:id", uploadFacultyProof.single("proof"), validate(updateFacultyParticipationSchema), updateFacultyParticipation);
router.delete("/:id", deleteFacultyParticipation);
router.get("/count", getFacultyParticipationsCount);
router.get("/", listFacultyParticipations);

export default router;
