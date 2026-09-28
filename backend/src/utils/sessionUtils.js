import crypto from "crypto";
import pool from "../config/db.js";
import logger from "./logger.js";
import { tracedQuery } from "./tracing.js";

export const SESSION_MAX_AGE_DAYS = 30;
export const SESSION_IDLE_DAYS = 7;

/**
 * Generate a random session token
 */
export function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Calculate initial session expiration date (7 days idle window from now)
 */
export function getSessionExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_IDLE_DAYS);
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
    const { rows } = await tracedQuery(pool, 
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
    logger.error("Error creating session", { err, user: { id: userId } });
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
    const { rows } = await tracedQuery(pool, 
      `SELECT * FROM user_sessions 
       WHERE session_token = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP`,
      [sessionToken]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (err) {
    logger.error("Error verifying session", { err });
    throw err;
  }
}

/**
 * Extend session expiration using a sliding idle window capped by maximum session age.
 *
 * Every authenticated request resets the idle clock:
 *   expires_at = LEAST(created_at + 30 days, NOW() + 7 days)
 *
 * Behaviour:
 *   - If you use the app regularly, the session stays alive up to 30 days
 *     from initial creation.
 *   - If you stop using the app for 7 days straight, expires_at drops
 *     below CURRENT_TIMESTAMP and the next login requires OTP again.
 *   - Once created_at + 30 days is reached, the session hard-expires.
 *
 * @param {string} sessionToken - The session token
 * @returns {Promise<object|null>} - The updated session object
 */
export async function extendSession(sessionToken) {
  try {
    const { rows } = await tracedQuery(pool, 
      `UPDATE user_sessions
       SET last_accessed_at = CURRENT_TIMESTAMP,
           expires_at = LEAST(
             created_at + INTERVAL '${SESSION_MAX_AGE_DAYS} days',
             CURRENT_TIMESTAMP + INTERVAL '${SESSION_IDLE_DAYS} days'
           )
       WHERE session_token = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
       RETURNING id, user_id, session_token, created_at, expires_at, last_accessed_at, is_active`,
      [sessionToken]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (err) {
    logger.error("Error extending session", { err });
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
    const { rows } = await tracedQuery(pool, 
      `SELECT id, user_id, session_token, created_at, expires_at, last_accessed_at, device_info, is_active
       FROM user_sessions 
       WHERE user_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
       ORDER BY last_accessed_at DESC`,
      [userId]
    );

    return rows;
  } catch (err) {
    logger.error("Error fetching user sessions", { err, user: { id: userId } });
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
    const { rows } = await tracedQuery(pool, 
      `SELECT id FROM user_sessions 
       WHERE user_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
       LIMIT 1`,
      [userId]
    );

    return rows.length > 0;
  } catch (err) {
    logger.error("Error checking user session", { err, user: { id: userId } });
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
    const { rowCount } = await tracedQuery(pool, 
      `UPDATE user_sessions 
       SET is_active = false 
       WHERE session_token = $1`,
      [sessionToken]
    );

    return rowCount > 0;
  } catch (err) {
    logger.error("Error invalidating session", { err });
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
    const { rowCount } = await tracedQuery(pool, 
      `UPDATE user_sessions 
       SET is_active = false 
       WHERE user_id = $1`,
      [userId]
    );

    return rowCount;
  } catch (err) {
    logger.error("Error invalidating all user sessions", { err, user: { id: userId } });
    throw err;
  }
}

/**
 * Clean up expired sessions (database maintenance)
 * @returns {Promise<number>} - Number of sessions deleted
 */
export async function cleanupExpiredSessions() {
  try {
    const { rowCount } = await tracedQuery(pool, 
      `DELETE FROM user_sessions 
       WHERE expires_at < CURRENT_TIMESTAMP OR (is_active = false AND created_at < CURRENT_TIMESTAMP - INTERVAL '30 days')`
    );

    logger.info("Expired sessions cleaned up", { "sessions.deleted": rowCount });
    return rowCount;
  } catch (err) {
    logger.error("Error cleaning up sessions", { err });
    throw err;
  }
}
