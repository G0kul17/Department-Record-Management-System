import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import { upload } from "../config/upload.js";
import {
  createConsultancy,
  updateConsultancy,
  deleteConsultancy,
  listConsultancy,
  getFacultyConsultancyCount,
} from "../controllers/facultyConsultancyController.js";
import { validate } from "../middleware/validate.js";
import { createConsultancySchema, updateConsultancySchema } from "../validators/facultySchemas.js";

const router = express.Router();

// staff + admin
router.use(requireAuth, requireRole(["staff", "admin"]));

router.post("/", upload.single("proof"), validate(createConsultancySchema), createConsultancy);
router.put("/:id", upload.single("proof"), validate(updateConsultancySchema), updateConsultancy);
router.delete("/:id", deleteConsultancy);
router.get("/count", getFacultyConsultancyCount);
router.get("/", listConsultancy);

export default router;
