import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import { upload } from "../config/upload.js";

import {
  createConsultancy,
  updateConsultancy,
  deleteConsultancy,
  listConsultancy
} from "../controllers/facultyConsultancyController.js";

const router = express.Router();

// staff + admin
router.use(requireAuth, requireRole(["staff", "admin"]));

router.post("/", upload.single("proof"), createConsultancy);
router.put("/:id", upload.single("proof"), updateConsultancy);
router.delete("/:id", deleteConsultancy);
router.get("/", listConsultancy);

export default router;
