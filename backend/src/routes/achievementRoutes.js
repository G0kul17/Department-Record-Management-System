// src/routes/achievementRoutes.js
import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleAuth.js';
import { createAchievement, listAchievements, verifyAchievement } from '../controllers/achievementController.js';
import { upload } from '../config/upload.js';

const router = express.Router();

// Student creates achievement with optional proof file (single file field 'proof')
router.post('/', requireAuth, requireRole(['student','alumni']), upload.single('proof'), createAchievement);

router.get('/', requireAuth, listAchievements);

// Admin verifies achievement
router.post('/:id/verify', requireAuth, requireRole(['admin']), verifyAchievement);

export default router;
