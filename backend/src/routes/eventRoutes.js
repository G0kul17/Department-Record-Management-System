import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import {
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { upload } from "../config/upload.js";
import { validate } from "../middleware/validate.js";
import { createEventSchema, updateEventSchema } from "../validators/eventSchemas.js";

const router = express.Router();

// Create event — multer first (populates req.body from form fields), then validate
router.post(
  "/",
  requireAuth,
  requireRole(["staff", "admin"]),
  upload.fields([
    { name: "attachments", maxCount: 10 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  validate(createEventSchema),
  createEvent,
);

router.put(
  "/:id",
  requireAuth,
  requireRole(["staff", "admin"]),
  validate(updateEventSchema),
  updateEvent,
);

router.delete(
  "/:id",
  requireAuth,
  requireRole(["staff", "admin"]),
  deleteEvent,
);

export default router;
