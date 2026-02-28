import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { listMyAnnouncements } from "../controllers/announcementController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/mine", listMyAnnouncements);

export default router;
