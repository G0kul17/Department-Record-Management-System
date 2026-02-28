import crypto from "crypto";
import pool from "../config/db.js";

const SESSION_DURATION_DAYS = 90;

/**
 * Generate a random session token
 */
export function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Calculate session expiration date (90 days from now)
 */
export function getSessionExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_DURATION_DAYS);
  return date;
}

/**
 * Create a new session for user
 * @param {number} userId - The user ID
 * @param {object} deviceInfo - Optional device information
 * @returns {Promise<object>} - The created session object
 */
export async function createSession(userId, deviceInfo = null) {
  const sessionToken = generateSessionToken();
  const expiresAt = getSessionExpiryDate();
  const createdAt = new Date();

  try {
    const { rows } = await pool.query(
      `INSERT INTO user_sessions (user_id, session_token, expires_at, created_at, last_accessed_at, device_info, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, session_token, created_at, expires_at, last_accessed_at, is_active`,
      [
        userId,
        sessionToken,
        expiresAt,
        createdAt,
        createdAt,
        deviceInfo ? JSON.stringify(deviceInfo) : null,
        true,
      ]
    );
    return rows[0];
  } catch (err) {
    console.error("Error creating session:", err);
    throw err;
  }
}

/**
 * Verify if a session token is valid
 * @param {string} sessionToken - The session token to verify
 * @returns {Promise<object|null>} - The session object if valid, null otherwise
 */
export async function verifySession(sessionToken) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM user_sessions 
       WHERE session_token = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP`,
      [sessionToken]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (err) {
    console.error("Error verifying session:", err);
    throw err;
  }
}

/**
 * Extend session expiration by updating last_accessed_at
 * This will refresh the session when user is active
 * @param {string} sessionToken - The session token
 * @returns {Promise<object|null>} - The updated session object
 */
export async function extendSession(sessionToken) {
  try {
    const newLastAccessed = new Date();
    const { rows } = await pool.query(
      `UPDATE user_sessions 
       SET last_accessed_at = $1
       WHERE session_token = $2 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
       RETURNING id, user_id, session_token, created_at, expires_at, last_accessed_at, is_active`,
      [newLastAccessed, sessionToken]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (err) {
    console.error("Error extending session:", err);
    throw err;
  }
}

/**
 * Get all active sessions for a user
 * @param {number} userId - The user ID
 * @returns {Promise<array>} - Array of active sessions
 */
export async function getUserActiveSessions(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, session_token, created_at, expires_at, last_accessed_at, device_info, is_active
       FROM user_sessions 
       WHERE user_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
       ORDER BY last_accessed_at DESC`,
      [userId]
    );

    return rows;
  } catch (err) {
    console.error("Error fetching user sessions:", err);
    throw err;
  }
}

/**
 * Check if user has any valid session
 * @param {number} userId - The user ID
 * @returns {Promise<boolean>} - True if user has at least one valid session
 */
export async function hasValidSession(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT id FROM user_sessions 
       WHERE user_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
       LIMIT 1`,
      [userId]
    );

    return rows.length > 0;
  } catch (err) {
    console.error("Error checking user session:", err);
    throw err;
  }
}

/**
 * Invalidate a specific session
 * @param {string} sessionToken - The session token to invalidate
 * @returns {Promise<boolean>} - True if session was invalidated
 */
export async function invalidateSession(sessionToken) {
  try {
    const { rowCount } = await pool.query(
      `UPDATE user_sessions 
       SET is_active = false 
       WHERE session_token = $1`,
      [sessionToken]
    );

    return rowCount > 0;
  } catch (err) {
    console.error("Error invalidating session:", err);
    throw err;
  }
}

/**
 * Invalidate all sessions for a user
 * @param {number} userId - The user ID
 * @returns {Promise<number>} - Number of sessions invalidated
 */
export async function invalidateAllUserSessions(userId) {
  try {
    const { rowCount } = await pool.query(
      `UPDATE user_sessions 
       SET is_active = false 
       WHERE user_id = $1`,
      [userId]
    );

    return rowCount;
  } catch (err) {
    console.error("Error invalidating all user sessions:", err);
    throw err;
  }
}

/**
 * Clean up expired sessions (database maintenance)
 * @returns {Promise<number>} - Number of sessions deleted
 */
export async function cleanupExpiredSessions() {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM user_sessions 
       WHERE expires_at < CURRENT_TIMESTAMP OR (is_active = false AND created_at < CURRENT_TIMESTAMP - INTERVAL '30 days')`
    );

    console.log(`Cleaned up ${rowCount} expired sessions`);
    return rowCount;
  } catch (err) {
    console.error("Error cleaning up sessions:", err);
    throw err;
  }
}
