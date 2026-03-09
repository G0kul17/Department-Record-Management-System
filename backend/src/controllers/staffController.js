// staffController.js
import pool from "../config/db.js";
import logger, { reqContext } from "../utils/logger.js";
import { reviewProject, reviewAchievement, ReviewError } from "../services/reviewService.js";

// Approve project
export async function approveProject(req, res) {
  try {
    const result = await reviewProject(
      Number(req.params.id),
      req.user.id,
      "approve",
      req.body.comment,
      req.correlationId,
    );
    return res.json(result);
  } catch (err) {
    if (err instanceof ReviewError) return res.status(err.status).json({ message: err.message });
    logger.error("Staff controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// Reject project
export async function rejectProject(req, res) {
  try {
    const result = await reviewProject(
      Number(req.params.id),
      req.user.id,
      "reject",
      req.body.comment,
      req.correlationId,
    );
    return res.json(result);
  } catch (err) {
    if (err instanceof ReviewError) return res.status(err.status).json({ message: err.message });
    logger.error("Staff controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// Approve achievement
export async function approveAchievement(req, res) {
  try {
    const result = await reviewAchievement(
      Number(req.params.id),
      req.user.id,
      "approve",
      req.body.comment,
      req.correlationId,
    );
    return res.json(result);
  } catch (err) {
    if (err instanceof ReviewError) return res.status(err.status).json({ message: err.message });
    logger.error("Staff controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// Reject achievement
export async function rejectAchievement(req, res) {
  try {
    const result = await reviewAchievement(
      Number(req.params.id),
      req.user.id,
      "reject",
      req.body.comment,
      req.correlationId,
    );
    return res.json(result);
  } catch (err) {
    if (err instanceof ReviewError) return res.status(err.status).json({ message: err.message });
    logger.error("Staff controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// Staff dashboard summary (counts + lists)
export async function staffDashboard(req, res) {
  try {
    const staffId = req.user?.id;
    const requesterRole = req.user?.role;
    // pending projects & achievements and upcoming events
    const [pendingProjectsR, pendingAchievementsR, eventsR, recentUploadsR] =
      await Promise.all([
        // Admins see all pending; staff see only those for their mapped activity types
        requesterRole === "admin"
          ? pool.query(`SELECT p.id, p.title, p.academic_year, p.created_by, p.created_at, u.email as created_by_email
                      FROM projects p LEFT JOIN users u ON p.created_by = u.id
                      WHERE p.verification_status = 'pending'
                      ORDER BY p.created_at DESC LIMIT 50`)
          : pool.query(
              `SELECT p.id, p.title, p.academic_year, p.created_by, p.created_at, u.email as created_by_email
                        FROM projects p
                        LEFT JOIN users u ON p.created_by = u.id
                        JOIN activity_coordinators ac ON LOWER(TRIM(ac.activity_type)) = LOWER(TRIM(p.activity_type)) AND ac.staff_id = $1
                       WHERE p.verification_status = 'pending'
                       ORDER BY p.created_at DESC LIMIT 50`,
              [staffId]
            ),
        requesterRole === "admin"
          ? pool.query(`SELECT a.id, a.title, a.user_id, a.date_of_award, a.created_at, u.email as user_email
                      FROM achievements a LEFT JOIN users u ON a.user_id = u.id
                      WHERE a.verification_status = 'pending'
                      ORDER BY a.created_at DESC LIMIT 50`)
          : pool.query(
              `SELECT a.id, a.title, a.user_id, a.date_of_award, a.created_at, u.email as user_email
                        FROM achievements a
                        LEFT JOIN users u ON a.user_id = u.id
                        JOIN activity_coordinators ac ON LOWER(TRIM(ac.activity_type)) = LOWER(TRIM(a.activity_type)) AND ac.staff_id = $1
                       WHERE a.verification_status = 'pending'
                       ORDER BY a.created_at DESC LIMIT 50`,
              [staffId]
            ),
        pool.query(
          `SELECT id, title, start_date, end_date, venue FROM events ORDER BY start_date ASC LIMIT 50`
        ),
        // recent uploads from project_files
        pool.query(`SELECT pf.id, pf.project_id, pf.original_name, pf.file_type, pf.uploaded_by, pf.uploaded_at, u.email as uploaded_by_email
                  FROM project_files pf LEFT JOIN users u ON pf.uploaded_by = u.id
                  ORDER BY pf.uploaded_at DESC LIMIT 50`),
      ]);

    return res.json({
      pendingProjects: pendingProjectsR.rows,
      pendingAchievements: pendingAchievementsR.rows,
      upcomingEvents: eventsR.rows,
      recentFiles: recentUploadsR.rows,
    });
  } catch (err) {
    logger.error("Staff controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}
