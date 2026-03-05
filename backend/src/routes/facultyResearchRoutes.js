import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import { uploadFacultyProof } from "../config/upload.js";
import {
  createResearch,
  updateResearch,
  deleteResearch,
  listResearch,
  getFacultyResearchCount,
} from "../controllers/facultyResearchController.js";
import { validate } from "../middleware/validate.js";
import { createResearchSchema, updateResearchSchema } from "../validators/facultySchemas.js";

const router = express.Router();

// Staff & admin only
router.use(requireAuth, requireRole(["staff", "admin"]));

router.post("/", uploadFacultyProof.single("proof"), validate(createResearchSchema), createResearch);
router.put("/:id", uploadFacultyProof.single("proof"), validate(updateResearchSchema), updateResearch);
router.delete("/:id", deleteResearch);
router.get("/count", getFacultyResearchCount);
router.get("/", listResearch);

export default router;
