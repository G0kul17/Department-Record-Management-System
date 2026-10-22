import express from "express";
import { listEvents, deleteEvent } from "../controllers/eventController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";

const router = express.Router();

router.get("/", listEvents);
router.delete("/:id", requireAuth, requireRole(["admin"]), deleteEvent);

export default router;

    