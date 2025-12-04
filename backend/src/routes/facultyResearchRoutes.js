import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import { upload } from "../config/upload.js";

import {
  createResearch,
  updateResearch,
  deleteResearch,
  listResearch
} from "../controllers/facultyResearchController.js";

const router = express.Router();

// Staff & admin only
router.use(requireAuth, requireRole(["staff", "admin"]));

router.post("/", upload.single("proof"), createResearch);
router.put("/:id", upload.single("proof"), updateResearch);
router.delete("/:id", deleteResearch);
router.get("/", listResearch);

export default router;
