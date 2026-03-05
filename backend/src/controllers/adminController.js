import pool from "../config/db.js";
import logger from "../utils/logger.js";

// GET /api/admin/stats
// Returns total counts for admin dashboard usages
export async function getAdminStats(req, res) {
  try {
    const [studentsR, staffR, eventsR] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS c FROM users WHERE role = 'student'"),
      pool.query("SELECT COUNT(*)::int AS c FROM users WHERE role = 'staff'"),
      pool.query("SELECT COUNT(*)::int AS c FROM events"),
    ]);

    return res.json({
      students: studentsR.rows[0]?.c ?? 0,
      staff: staffR.rows[0]?.c ?? 0,
      events: eventsR.rows[0]?.c ?? 0,
    });
  } catch (err) {
    logger.error("Admin controller error", { err, "trace.id": req.correlationId, "user.id": req.user?.id });
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
      pool.query("SELECT COUNT(*)::int AS total FROM users"),
      pool.query(
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
    logger.error("Admin controller error", { err, "trace.id": req.correlationId, "user.id": req.user?.id });
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
    const { rows } = await pool.query(
      "UPDATE users SET role=$1 WHERE id=$2 RETURNING id, email, role, COALESCE(NULLIF(full_name, ''), NULLIF(profile_details->>'full_name', ''), NULLIF(TRIM((profile_details->>'first_name') || ' ' || (profile_details->>'last_name')), '')) AS full_name, is_verified, created_at",
      [role, id]
    );
    if (!rows.length)
      return res.status(404).json({ message: "User not found" });
    return res.json({ user: rows[0] });
  } catch (err) {
    logger.error("Admin controller error", { err, "trace.id": req.correlationId, "user.id": req.user?.id });
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
    const { rows } = await pool.query(
      "DELETE FROM users WHERE id=$1 RETURNING id",
      [id]
    );
    if (!rows.length)
      return res.status(404).json({ message: "User not found" });
    return res.json({ message: "Deleted", id });
  } catch (err) {
    logger.error("Admin controller error", { err, "trace.id": req.correlationId, "user.id": req.user?.id });
    return res.status(500).json({ message: "Server error" });
  }
}
