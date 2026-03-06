// src/services/reviewService.js
//
// Single source of truth for project/achievement approve-or-reject logic.
// Both staffController (staff/* routes) and projectController / achievementController
// delegate here so DB update + email notification are always in sync.

import pool from "../config/db.js";
import { sendMail } from "../config/mailer.js";
import logger from "../utils/logger.js";

export class ReviewError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Approve or reject a project.
 *
 * @param {number} projectId
 * @param {number} staffId
 * @param {'approve'|'reject'} action
 * @param {string|null} comment
 * @param {string} [correlationId]
 * @throws {ReviewError} with .status 403 or 404 for expected failures
 */
export async function reviewProject(projectId, staffId, action, comment, correlationId) {
  const approved = action === "approve";

  // Staff must coordinate the project's activity_type
  const { rows: authRows } = await pool.query(
    `SELECT 1
       FROM projects p
       JOIN activity_coordinators ac
         ON LOWER(TRIM(ac.activity_type)) = LOWER(TRIM(p.activity_type)) AND ac.staff_id = $1
      WHERE p.id = $2`,
    [staffId, projectId],
  );
  if (!authRows.length) {
    throw new ReviewError(403, `Not authorized to ${action} this project`);
  }

  const { rows } = await pool.query(
    `UPDATE projects
        SET verification_status = $1,
            verification_comment = $2,
            verified_by          = $3,
            verified_at          = NOW(),
            verified             = $4
      WHERE id = $5
  RETURNING id, title, created_by`,
    [approved ? "approved" : "rejected", comment || null, staffId, approved, projectId],
  );
  if (!rows.length) {
    throw new ReviewError(404, "Project not found");
  }

  const creatorId = rows[0].created_by;
  if (creatorId) {
    const { rows: userRows } = await pool.query(
      "SELECT email FROM users WHERE id = $1",
      [creatorId],
    );
    if (userRows[0]) {
      try {
        await sendMail({
          to: userRows[0].email,
          subject: `Your project "${rows[0].title}" has been ${approved ? "approved" : "rejected"}`,
          text: `Your project has been ${approved ? "approved" : "rejected"} by staff. Comment: ${comment || "No comment"}`,
        });
      } catch (err) {
        logger.error("Failed to send project review email", { err, "trace.id": correlationId });
      }
    }
  }

  return { message: `Project ${approved ? "approved" : "rejected"}` };
}

/**
 * Approve or reject an achievement.
 *
 * @param {number} achievementId
 * @param {number} staffId
 * @param {'approve'|'reject'} action
 * @param {string|null} comment
 * @param {string} [correlationId]
 * @throws {ReviewError} with .status 403 or 404 for expected failures
 */
export async function reviewAchievement(achievementId, staffId, action, comment, correlationId) {
  const approved = action === "approve";

  // Staff must coordinate the achievement's activity_type
  const { rows: authRows } = await pool.query(
    `SELECT 1
       FROM achievements a
       JOIN activity_coordinators ac
         ON LOWER(TRIM(ac.activity_type)) = LOWER(TRIM(a.activity_type)) AND ac.staff_id = $1
      WHERE a.id = $2`,
    [staffId, achievementId],
  );
  if (!authRows.length) {
    throw new ReviewError(403, `Not authorized to ${action} this achievement`);
  }

  const { rows } = await pool.query(
    `UPDATE achievements
        SET verification_status = $1,
            verification_comment = $2,
            verified_by          = $3,
            verified_at          = NOW(),
            verified             = $4
      WHERE id = $5
  RETURNING id, title, user_id`,
    [approved ? "approved" : "rejected", comment || null, staffId, approved, achievementId],
  );
  if (!rows.length) {
    throw new ReviewError(404, "Achievement not found");
  }

  const userId = rows[0].user_id;
  if (!userId) {
    return { message: `Achievement ${approved ? "approved" : "rejected"}` };
  }
  const { rows: userRows } = await pool.query(
    "SELECT email FROM users WHERE id = $1",
    [userId],
  );
  if (userRows[0]) {
    try {
      await sendMail({
        to: userRows[0].email,
        subject: `Your achievement "${rows[0].title}" has been ${approved ? "approved" : "rejected"}`,
        text: `Your achievement has been ${approved ? "approved" : "rejected"} by staff. Comment: ${comment || "No comment"}`,
      });
    } catch (err) {
      logger.error("Failed to send achievement review email", { err, "trace.id": correlationId });
    }
  }

  return { message: `Achievement ${approved ? "approved" : "rejected"}` };
}
