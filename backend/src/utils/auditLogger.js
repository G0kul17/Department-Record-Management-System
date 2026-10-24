import pool from "../config/db.js";
import logger from "./logger.js";

let tableEnsured = false;

export async function ensureAuditTable() {
  if (tableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action_type VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        item_title VARCHAR(500) NOT NULL,
        user_id INTEGER,
        user_name VARCHAR(255),
        user_email VARCHAR(255),
        user_role VARCHAR(50),
        details JSONB,
        created_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    `);
    tableEnsured = true;
  } catch (err) {
    logger.warn("Could not auto-ensure audit_logs table", { err: err.message });
  }
}

/**
 * Record an audit log entry for admin/staff operations
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
    await ensureAuditTable();
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
    logger.error("Failed to write audit log", { err: err.message, actionType, category, itemTitle });
  }
}
