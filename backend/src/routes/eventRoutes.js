import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import {
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { upload } from "../config/upload.js";

const router = express.Router();

// Create event (staff/admin), optional attachments under field name 'files'
router.post(
  "/",
  requireAuth,
  requireRole(["staff", "admin"]),
  upload.array("files", 10),
  createEvent
);

router.put("/:id", requireAuth, requireRole(["staff", "admin"]), updateEvent);

router.delete(
  "/:id",
  requireAuth,
  requireRole(["staff", "admin"]),
  deleteEvent
);

export default router;
