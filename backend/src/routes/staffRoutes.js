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

const router = express.Router();

// Staff-only routes
router.use(requireAuth, requireRole(["staff", "admin"]));

// Dashboard (single page needs)
router.get("/dashboard", staffDashboard);

// Projects approval (staff only — admins may not approve/reject)
router.post("/projects/:id/approve", requireRole(["staff"]), approveProject);
router.post("/projects/:id/reject", requireRole(["staff"]), rejectProject);

// Achievements approval (staff only — admins may not approve/reject)
router.post("/achievements/:id/approve", requireRole(["staff"]), approveAchievement);
router.post("/achievements/:id/reject", requireRole(["staff"]), rejectAchievement);

// Targeted announcements to selected users
router.post(
  "/announcements",
  upload.fields([{ name: "brochure", maxCount: 1 }]),
  createAnnouncement
);

// Events management (staff can create events)
router.post(
  "/events",
  upload.fields([
    { name: "attachments", maxCount: 6 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  createEvent
);
router.put("/events/:id", updateEvent);
router.delete("/events/:id", deleteEvent);

// listing events (also available to students via /api/events)
router.get("/events", listEvents);

export default router;
