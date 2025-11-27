import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleAuth.js';
import {
  approveProject,
  rejectProject,
  approveAchievement,
  rejectAchievement,
  staffDashboard
} from '../controllers/staffController.js';
import {
  createEvent,
  updateEvent,
  deleteEvent,
  listEvents
} from '../controllers/eventController.js';
import { upload } from '../config/upload.js';

const router = express.Router();

// Staff-only routes
router.use(requireAuth, requireRole(['staff','admin']));

// Dashboard (single page needs)
router.get('/dashboard', staffDashboard);

// Projects approval
router.post('/projects/:id/approve', approveProject);
router.post('/projects/:id/reject', rejectProject);

// Achievements approval
router.post('/achievements/:id/approve', approveAchievement);
router.post('/achievements/:id/reject', rejectAchievement);

// Events management (staff can create events)
router.post('/events', upload.array('attachments', 6), createEvent);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);

// listing events (also available to students via /api/events)
router.get('/events', listEvents);

export default router;
