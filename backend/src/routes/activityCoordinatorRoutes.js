import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import {
  getAllActivityCoordinators,
  createActivityCoordinator,
  deleteActivityCoordinator,
  getActivityTypes,
  getAchievementTypes,
  createAchievementType,
  deleteAchievementType,
} from "../controllers/activityCoordinatorController.js";
import { validate } from "../middleware/validate.js";
import {
  createActivityCoordinatorSchema,
  createAchievementTypeSchema,
} from "../validators/activityCoordinatorSchemas.js";

const router = express.Router();

// Get activity types - allow authenticated users (for frontend form loading)
router.get("/types", requireAuth, getActivityTypes);
router.get("/achievement-types", requireAuth, getAchievementTypes);

// All other endpoints - Admin only
router.use(requireAuth, requireRole(["admin"]));

router.get("/", getAllActivityCoordinators);
router.post(
  "/",
  validate(createActivityCoordinatorSchema),
  createActivityCoordinator,
);
router.post(
  "/achievement-types",
  validate(createAchievementTypeSchema),
  createAchievementType,
);
router.delete("/achievement-types/:name", deleteAchievementType);
router.delete("/:mappingId", deleteActivityCoordinator);

export default router;
