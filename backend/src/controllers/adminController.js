import pool from "../config/db.js";

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
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /api/admin/users
// Returns list of users for management
export async function listUsers(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, email, role, full_name, is_verified, created_at FROM users ORDER BY created_at DESC LIMIT 500"
    );
    return res.json({ users: rows });
  } catch (err) {
    console.error(err);
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
      "UPDATE users SET role=$1 WHERE id=$2 RETURNING id, email, role, full_name, is_verified, created_at",
      [role, id]
    );
    if (!rows.length)
      return res.status(404).json({ message: "User not found" });
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
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
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
