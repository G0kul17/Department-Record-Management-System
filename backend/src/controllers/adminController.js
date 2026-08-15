import pool from "../config/db.js";
import logger, { reqContext } from "../utils/logger.js";
import { tracedQuery } from "../utils/tracing.js";
import { invalidateAllUserSessions } from "../utils/sessionUtils.js";

// GET /api/admin/stats
// Returns total counts for admin dashboard usages
export async function getAdminStats(req, res) {
  try {
    const [studentsR, staffR, eventsR] = await Promise.all([
      tracedQuery(pool, "SELECT COUNT(*)::int AS c FROM users WHERE role = 'student'"),
      tracedQuery(pool, "SELECT COUNT(*)::int AS c FROM users WHERE role = 'staff'"),
      tracedQuery(pool, "SELECT COUNT(*)::int AS c FROM events"),
    ]);

    return res.json({
      students: studentsR.rows[0]?.c ?? 0,
      staff: staffR.rows[0]?.c ?? 0,
      events: eventsR.rows[0]?.c ?? 0,
    });
  } catch (err) {
    logger.error("Admin controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /api/admin/users?limit=50&offset=0
// Returns a page of users and the total count for pagination controls.
// limit is capped at 100 to prevent accidental full-table fetches.
export async function listUsers(req, res) {
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 50), 100);
  const offset = Math.max(0, Number(req.query.offset) || 0);

  const USER_COLS =
    "id, email, role, " +
    "COALESCE(NULLIF(full_name, ''), NULLIF(profile_details->>'full_name', ''), NULLIF(TRIM((profile_details->>'first_name') || ' ' || (profile_details->>'last_name')), '')) AS full_name, " +
    "is_verified, created_at";

  try {
    const [countResult, pageResult] = await Promise.all([
      tracedQuery(pool, "SELECT COUNT(*)::int AS total FROM users"),
      tracedQuery(pool, 
        `SELECT ${USER_COLS} FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
    ]);

    return res.json({
      users: pageResult.rows,
      total: countResult.rows[0].total,
      limit,
      offset,
    });
  } catch (err) {
    logger.error("Admin controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// PATCH /api/admin/users/:id  { role }
export async function updateUserRole(req, res) {
  const { id } = req.params;
  const { role } = req.body || {};
  const allowed = new Set(["student", "staff", "admin"]);
  if (!role || !allowed.has(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  try {
    // Prevent demoting self from admin accidentally (optional safeguard)
    if (
      String(req.user?.id) === String(id) &&
      req.user.role === "admin" &&
      role !== "admin"
    ) {
      return res
        .status(400)
        .json({ message: "Cannot change your own admin role" });
    }
    const { rows } = await tracedQuery(pool,
      "UPDATE users SET role=$1 WHERE id=$2 RETURNING id, email, role, COALESCE(NULLIF(full_name, ''), NULLIF(profile_details->>'full_name', ''), NULLIF(TRIM((profile_details->>'first_name') || ' ' || (profile_details->>'last_name')), '')) AS full_name, is_verified, created_at",
      [role, id]
    );
    if (!rows.length)
      return res.status(404).json({ message: "User not found" });

    // The old role is baked into any JWT this user already holds
    // (authController.js signs { role, ... } at login) and requireRole()
    // trusts that claim directly without re-checking the DB. Without this,
    // a demoted user keeps their old privileges via their still-valid
    // token/session for up to its remaining TTL. Force them to
    // re-authenticate so the new role takes effect immediately.
    await invalidateAllUserSessions(id);

    return res.json({ user: rows[0] });
  } catch (err) {
    logger.error("Admin controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// DELETE /api/admin/users/:id
export async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    if (String(req.user?.id) === String(id)) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }
    const { rows } = await tracedQuery(pool, 
      "DELETE FROM users WHERE id=$1 RETURNING id",
      [id]
    );
    if (!rows.length)
      return res.status(404).json({ message: "User not found" });
    return res.json({ message: "Deleted", id });
  } catch (err) {
    logger.error("Admin controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /api/admin/active-logs
// Returns aggregated real-time upload and approval logs across all modules
export async function getActiveLogs(req, res) {
  try {
    const { period, type } = req.query;

    const query = `
      SELECT * FROM (
        -- 1. Project Submissions
        SELECT 
          'proj_up_' || p.id AS log_id,
          'upload' AS action_type,
          'Project' AS category,
          p.title AS item_title,
          p.created_by AS user_id,
          COALESCE(NULLIF(u.full_name, ''), NULLIF(u.profile_details->>'full_name', ''), u.email) AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          p.created_at AS timestamp
        FROM projects p
        JOIN users u ON p.created_by = u.id

        UNION ALL

        -- 2. Project Approvals
        SELECT 
          'proj_app_' || p.id AS log_id,
          'approval' AS action_type,
          'Project Approval' AS category,
          p.title AS item_title,
          p.verified_by AS user_id,
          COALESCE(NULLIF(u.full_name, ''), NULLIF(u.profile_details->>'full_name', ''), u.email) AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          COALESCE(p.verified_at, p.created_at) AS timestamp
        FROM projects p
        JOIN users u ON p.verified_by = u.id
        WHERE p.verification_status = 'approved'

        UNION ALL

        -- 3. Achievement Submissions
        SELECT 
          'ach_up_' || a.id AS log_id,
          'upload' AS action_type,
          'Achievement' AS category,
          a.title AS item_title,
          a.user_id AS user_id,
          COALESCE(NULLIF(u.full_name, ''), NULLIF(u.profile_details->>'full_name', ''), u.email) AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          a.created_at AS timestamp
        FROM achievements a
        JOIN users u ON a.user_id = u.id

        UNION ALL

        -- 4. Achievement Approvals
        SELECT 
          'ach_app_' || a.id AS log_id,
          'approval' AS action_type,
          'Achievement Approval' AS category,
          a.title AS item_title,
          a.verified_by AS user_id,
          COALESCE(NULLIF(u.full_name, ''), NULLIF(u.profile_details->>'full_name', ''), u.email) AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          COALESCE(a.verified_at, a.created_at) AS timestamp
        FROM achievements a
        JOIN users u ON a.verified_by = u.id
        WHERE a.verification_status = 'approved'

        UNION ALL

        -- 5. Faculty Research Submissions
        SELECT 
          'res_up_' || fr.id AS log_id,
          'upload' AS action_type,
          'Faculty Research' AS category,
          fr.title AS item_title,
          fr.created_by AS user_id,
          COALESCE(NULLIF(u.full_name, ''), NULLIF(u.profile_details->>'full_name', ''), u.email) AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          fr.created_at AS timestamp
        FROM faculty_research fr
        JOIN users u ON fr.created_by = u.id

        UNION ALL

        -- 6. Faculty Consultancy Submissions
        SELECT 
          'cons_up_' || fc.id AS log_id,
          'upload' AS action_type,
          'Faculty Consultancy' AS category,
          fc.agency AS item_title,
          fc.created_by AS user_id,
          COALESCE(NULLIF(u.full_name, ''), NULLIF(u.profile_details->>'full_name', ''), u.email) AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          fc.created_at AS timestamp
        FROM faculty_consultancy fc
        JOIN users u ON fc.created_by = u.id

        UNION ALL

        -- 7. Faculty Participation Submissions
        SELECT 
          'part_up_' || fp.id AS log_id,
          'upload' AS action_type,
          'Faculty Participation' AS category,
          fp.title AS item_title,
          fp.created_by AS user_id,
          COALESCE(NULLIF(u.full_name, ''), NULLIF(u.profile_details->>'full_name', ''), u.email) AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          fp.created_at AS timestamp
        FROM faculty_participations fp
        JOIN users u ON fp.created_by = u.id

        UNION ALL

        -- 8. Department Event Submissions
        SELECT 
          'ev_up_' || e.id AS log_id,
          'upload' AS action_type,
          'Event' AS category,
          e.title AS item_title,
          e.organizer_id AS user_id,
          COALESCE(NULLIF(u.full_name, ''), NULLIF(u.profile_details->>'full_name', ''), u.email) AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          e.created_at AS timestamp
        FROM events e
        JOIN users u ON e.organizer_id = u.id
      ) logs
      ORDER BY timestamp DESC
      LIMIT 300
    `;

    const { rows } = await tracedQuery(pool, query);

    let logs = rows;
    if (period && period !== "all") {
      const now = new Date();
      logs = logs.filter((log) => {
        const logDate = new Date(log.timestamp);
        if (isNaN(logDate.getTime())) return true;
        if (period === "day") {
          return logDate.toDateString() === now.toDateString();
        }
        if (period === "week") {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return logDate >= oneWeekAgo;
        }
        if (period === "month") {
          return (
            logDate.getMonth() === now.getMonth() &&
            logDate.getFullYear() === now.getFullYear()
          );
        }
        if (period === "year") {
          return logDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    if (type && type !== "all") {
      logs = logs.filter((l) => l.action_type === type);
    }

    return res.json({ logs });
  } catch (err) {
    logger.error("Active logs query error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error fetching active logs" });
  }
}

// GET /api/admin/users/:id/profile
export async function getUserProfileById(req, res) {
  const { id } = req.params;
  try {
    const userRes = await tracedQuery(
      pool,
      `SELECT id, email, role, 
        COALESCE(NULLIF(full_name, ''), NULLIF(profile_details->>'full_name', ''), NULLIF(TRIM((profile_details->>'first_name') || ' ' || (profile_details->>'last_name')), '')) AS full_name,
        profile_details, is_verified, created_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (!userRes.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userRes.rows[0];

    let studentProfile = null;
    if (userData.role === "student") {
      const spRes = await tracedQuery(
        pool,
        `SELECT * FROM student_profiles WHERE user_id = $1`,
        [id]
      );
      if (spRes.rows.length) {
        studentProfile = spRes.rows[0];
      }
    }

    return res.json({
      user: userData,
      studentProfile,
    });
  } catch (err) {
    logger.error("Get user profile error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}
