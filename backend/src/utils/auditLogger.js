import pool from "../config/db.js";
import logger from "./logger.js";

/**
 * Record an audit log entry for admin/staff operations.
 * Table audit_logs must be provisioned via migration 013_audit_logs.sql.
 */
export async function logAudit({
  actionType,
  category,
  itemTitle,
  userId,
  userName,
  userEmail,
  userRole,
  details = {},
}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (action_type, category, item_title, user_id, user_name, user_email, user_role, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        actionType,
        category,
        itemTitle,
        userId || null,
        userName || null,
        userEmail || null,
        userRole || null,
        JSON.stringify(details || {}),
      ]
    );
  } catch (err) {
    logger.error("Failed to write audit log entry", {
      err: err.message,
      actionType,
      category,
      itemTitle,
      userId,
    });
  }
}
