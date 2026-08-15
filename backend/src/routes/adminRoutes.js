import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleAuth.js";
import {
  getAdminStats,
  listUsers,
  updateUserRole,
  deleteUser,
  getActiveLogs,
  getUserProfileById,
} from "../controllers/adminController.js";
import { validate } from "../middleware/validate.js";
import { updateRoleSchema } from "../validators/staffSchemas.js";

const router = express.Router();

// Admin-only routes
router.use(requireAuth, requireRole(["admin"]));

router.get("/stats", getAdminStats);
router.get("/active-logs", getActiveLogs);
router.get("/users", listUsers);
router.get("/users/:id/profile", getUserProfileById);
router.patch("/users/:id", validate(updateRoleSchema), updateUserRole);
router.delete("/users/:id", deleteUser);

export default router;
