import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import {
  approveProject,
  rejectProject,
  approveAchievement,
  rejectAchievement,
  staffDashboard,
} from "../controllers/staffController.js";
import { createAnnouncement } from "../controllers/announcementController.js";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  listEvents,
} from "../controllers/eventController.js";
import { upload } from "../config/upload.js";
import { validate } from "../middleware/validate.js";
import { reviewSchema, createAnnouncementSchema } from "../validators/staffSchemas.js";
import { createEventSchema, updateEventSchema } from "../validators/eventSchemas.js";

const router = express.Router();

// Staff-only routes
router.use(requireAuth, requireRole(["staff", "admin"]));

// Dashboard
router.get("/dashboard", staffDashboard);

// Projects approval (staff only — admins may not approve/reject)
router.post("/projects/:id/approve", requireRole(["staff"]), validate(reviewSchema), approveProject);
router.post("/projects/:id/reject", requireRole(["staff"]), validate(reviewSchema), rejectProject);

// Achievements approval (staff only — admins may not approve/reject)
router.post("/achievements/:id/approve", requireRole(["staff"]), validate(reviewSchema), approveAchievement);
router.post("/achievements/:id/reject", requireRole(["staff"]), validate(reviewSchema), rejectAchievement);

// Targeted announcements — multer first, then validate
router.post(
  "/announcements",
  upload.fields([{ name: "brochure", maxCount: 1 }]),
  validate(createAnnouncementSchema),
  createAnnouncement,
);

// Events management — multer first for create, then validate
router.post(
  "/events",
  upload.fields([
    { name: "attachments", maxCount: 6 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  validate(createEventSchema),
  createEvent,
);
router.put("/events/:id", validate(updateEventSchema), updateEvent);
router.delete("/events/:id", deleteEvent);

router.get("/events", listEvents);

export default router;
