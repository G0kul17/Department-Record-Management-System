import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import {
  getAllActivityCoordinators,
  createActivityCoordinator,
  deleteActivityCoordinator,
  getActivityTypes,
} from "../controllers/activityCoordinatorController.js";

const router = express.Router();

// Admin only
router.use(requireAuth, requireRole(["admin"]));

router.get("/", getAllActivityCoordinators);
router.get("/types", getActivityTypes);
router.post("/", createActivityCoordinator);
router.delete("/:mappingId", deleteActivityCoordinator);

export default router;
