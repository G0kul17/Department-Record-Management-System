import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import {
  getAllActivityCoordinators,
  createActivityCoordinator,
  deleteActivityCoordinator,
  getActivityTypes,
} from "../controllers/activityCoordinatorController.js";
import { validate } from "../middleware/validate.js";
import { createActivityCoordinatorSchema } from "../validators/activityCoordinatorSchemas.js";

const router = express.Router();

// Get activity types - allow authenticated users (for frontend form loading)
router.get("/types", requireAuth, getActivityTypes);

// All other endpoints - Admin only
router.use(requireAuth, requireRole(["admin"]));

router.get("/", getAllActivityCoordinators);
router.post("/", validate(createActivityCoordinatorSchema), createActivityCoordinator);
router.delete("/:mappingId", deleteActivityCoordinator);

export default router;
