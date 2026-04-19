// src/services/reviewService.js
//
// Single source of truth for project/achievement approve-or-reject logic.
// Both staffController (staff/* routes) and projectController / achievementController
// delegate here so DB update + email notification are always in sync.

import pool from "../config/db.js";
import { enqueueMail } from "../utils/mailClient.js";
import { projectReviewEmail, achievementReviewEmail } from "../utils/emailTemplates.js";
import logger from "../utils/logger.js";
import { tracedQuery } from "../utils/tracing.js";
import { getTraceCtx } from "../utils/traceStore.js";

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
  const ctx = getTraceCtx();
  const startNs = process.hrtime.bigint();

  logger.info("project.review.start", {
    "project.id": projectId,
    "review.action": action,
    "review.staff_id": staffId,
    ...ctx,
  });

  // Staff must coordinate the project's activity type
  const { rows: authRows } = await tracedQuery(
    pool,
    `SELECT 1
       FROM projects p
       JOIN activity_coordinators ac
         ON ac.activity_type_id = p.activity_type_id AND ac.staff_id = $1
      WHERE p.id = $2`,
    [staffId, projectId],
  );
  if (!authRows.length) {
    throw new ReviewError(403, `Not authorized to ${action} this project`);
  }

  const { rows } = await tracedQuery(
    pool,
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
    const { rows: userRows } = await tracedQuery(
      pool,
      "SELECT email FROM users WHERE id = $1",
      [creatorId],
    );
    if (userRows[0]) {
      try {
        await enqueueMail({
          to: userRows[0].email,
          subject: `Your project "${rows[0].title}" has been ${approved ? "approved" : "rejected"}`,
          ...projectReviewEmail({
            title: rows[0].title,
            status: approved ? "approved" : "rejected",
            staffComment: comment || null,
          }),
        });
      } catch (err) {
        logger.error("Failed to enqueue project review email", { err, trace: { id: correlationId }, ...ctx });
      }
    }
  }

  const durationMs = Math.round(Number(process.hrtime.bigint() - startNs) / 1_000_000 * 100) / 100;
  logger.info("project.review.complete", {
    "project.id": projectId,
    "project.title": rows[0].title,
    "review.action": action,
    "review.approved": approved,
    "event.duration_ms": durationMs,
    ...ctx,
  });

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
  const ctx = getTraceCtx();
  const startNs = process.hrtime.bigint();

  logger.info("achievement.review.start", {
    "achievement.id": achievementId,
    "review.action": action,
    "review.staff_id": staffId,
    ...ctx,
  });

  // Staff must coordinate the achievement's activity type
  const { rows: authRows } = await tracedQuery(
    pool,
    `SELECT 1
       FROM achievements a
       JOIN activity_coordinators ac
         ON ac.activity_type_id = a.activity_type_id AND ac.staff_id = $1
      WHERE a.id = $2`,
    [staffId, achievementId],
  );
  if (!authRows.length) {
    throw new ReviewError(403, `Not authorized to ${action} this achievement`);
  }

  const { rows } = await tracedQuery(
    pool,
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
  const { rows: userRows } = await tracedQuery(
    pool,
    "SELECT email FROM users WHERE id = $1",
    [userId],
  );
  if (userRows[0]) {
    try {
      await enqueueMail({
        to: userRows[0].email,
        subject: `Your achievement "${rows[0].title}" has been ${approved ? "approved" : "rejected"}`,
        ...achievementReviewEmail({
          title: rows[0].title,
          status: approved ? "approved" : "rejected",
          staffComment: comment || null,
        }),
      });
    } catch (err) {
      logger.error("Failed to enqueue achievement review email", { err, trace: { id: correlationId }, ...ctx });
    }
  }

  const durationMs = Math.round(Number(process.hrtime.bigint() - startNs) / 1_000_000 * 100) / 100;
  logger.info("achievement.review.complete", {
    "achievement.id": achievementId,
    "achievement.title": rows[0].title,
    "review.action": action,
    "review.approved": approved,
    "event.duration_ms": durationMs,
    ...ctx,
  });

  return { message: `Achievement ${approved ? "approved" : "rejected"}` };
}
