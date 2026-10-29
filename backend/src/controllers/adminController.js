import pool from "../config/db.js";
import logger, { reqContext } from "../utils/logger.js";
import { tracedQuery } from "../utils/tracing.js";
import { invalidateAllUserSessions } from "../utils/sessionUtils.js";
import { ensureAuditTable } from "../utils/auditLogger.js";

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

// GET /api/admin/users?role=student&page=1&limit=20&search=...
// Returns a paginated list of users, matching role/search, and the total count.
export async function listUsers(req, res) {
  const role = req.query.role ? String(req.query.role).trim().toLowerCase() : null;
  const department = req.query.department ? String(req.query.department).trim() : null;
  const search = (req.query.search || req.query.q || "").trim();
  const all = req.query.all === "true" || req.query.all === true;

  const conditions = [];
  const params = [];

  if (role) {
    params.push(role);
    conditions.push(`u.role = $${params.length}`);
  }

  if (department && department.toLowerCase() !== "all") {
    const deptUpper = department.toUpperCase();
    if (deptUpper === "ADS") {
      conditions.push(
        `(u.profile_details->>'department' ILIKE '%ads%' OR u.profile_details->>'department' ILIKE '%artificial intelligence%' OR u.profile_details->>'dept' ILIKE '%ads%' OR u.email ILIKE '%ads@%')`
      );
    } else if (deptUpper === "IT") {
      conditions.push(
        `(u.profile_details->>'department' ILIKE '%it%' OR u.profile_details->>'department' ILIKE '%information technology%' OR u.profile_details->>'dept' ILIKE '%it%' OR u.email ILIKE '%it@%')`
      );
    } else {
      params.push(`%${department}%`);
      const p = `$${params.length}`;
      conditions.push(
        `(u.profile_details->>'department' ILIKE ${p} OR u.profile_details->>'dept' ILIKE ${p})`
      );
    }
  }

  if (search) {
    params.push(`%${search}%`);
    const p = `$${params.length}`;
    conditions.push(
      `(u.email ILIKE ${p} OR u.full_name ILIKE ${p} OR u.profile_details->>'full_name' ILIKE ${p} OR sp.register_number ILIKE ${p} OR u.roll_number ILIKE ${p} OR u.profile_details->>'register_number' ILIKE ${p})`
    );
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const USER_COLS =
    "u.id, u.email, u.role, " +
    "COALESCE(NULLIF(u.full_name, ''), NULLIF(u.profile_details->>'full_name', ''), NULLIF(TRIM((u.profile_details->>'first_name') || ' ' || (u.profile_details->>'last_name')), '')) AS full_name, " +
    "COALESCE(sp.register_number, u.roll_number, u.profile_details->>'register_number') AS register_number, " +
    "COALESCE(" +
    "  CASE " +
    "    WHEN u.profile_details->>'department' ILIKE '%ads%' OR u.profile_details->>'department' ILIKE '%artificial intelligence%' OR u.profile_details->>'dept' ILIKE '%ads%' OR u.email ILIKE '%ads@%' THEN 'ADS' " +
    "    WHEN u.profile_details->>'department' ILIKE '%it%' OR u.profile_details->>'department' ILIKE '%information technology%' OR u.profile_details->>'dept' ILIKE '%it%' OR u.email ILIKE '%it@%' THEN 'IT' " +
    "    ELSE NULL " +
    "  END, " +
    "  NULLIF(UPPER(u.profile_details->>'department'), ''), " +
    "  NULLIF(UPPER(u.profile_details->>'dept'), ''), " +
    "  '—'" +
    ") AS department, " +
    "u.is_verified, u.created_at";

  try {
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      ${whereClause}
    `;

    if (all) {
      const [countResult, pageResult] = await Promise.all([
        tracedQuery(pool, countSql, params),
        tracedQuery(
          pool,
          `SELECT ${USER_COLS} FROM users u LEFT JOIN student_profiles sp ON sp.user_id = u.id ${whereClause} ORDER BY u.created_at DESC`,
          params,
        ),
      ]);

      const total = countResult.rows[0]?.total || 0;
      return res.json({
        users: pageResult.rows,
        total,
        limit: total,
        offset: 0,
        page: 1,
        totalPages: 1,
      });
    }

    const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), 500);
    const page = Math.max(
      1,
      Number(req.query.page) ||
        (req.query.offset ? Math.floor(Number(req.query.offset) / limit) + 1 : 1)
    );
    const offset = req.query.page
      ? (page - 1) * limit
      : Math.max(0, Number(req.query.offset) || 0);

    const dataParams = [...params, limit, offset];
    const dataSql = `
      SELECT ${USER_COLS}
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
    `;

    const [countResult, pageResult] = await Promise.all([
      tracedQuery(pool, countSql, params),
      tracedQuery(pool, dataSql, dataParams),
    ]);

    const total = countResult.rows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return res.json({
      users: pageResult.rows,
      total,
      limit,
      offset,
      page,
      totalPages,
    });
  } catch (err) {
    logger.error("Admin controller error", { err, ...reqContext(req) });
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
// Returns aggregated real-time upload, approval, rejection, deletion, and coordinator logs across all modules
export async function getActiveLogs(req, res) {
  try {
    const { period, type } = req.query;

    await ensureAuditTable();

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

        -- 3. Project Rejections
        SELECT 
          'proj_rej_' || p.id AS log_id,
          'rejection' AS action_type,
          'Project Rejection' AS category,
          p.title AS item_title,
          p.verified_by AS user_id,
          COALESCE(NULLIF(u.full_name, ''), NULLIF(u.profile_details->>'full_name', ''), u.email) AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          COALESCE(p.verified_at, p.created_at) AS timestamp
        FROM projects p
        JOIN users u ON p.verified_by = u.id
        WHERE p.verification_status = 'rejected'

        UNION ALL

        -- 4. Achievement Submissions
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

        -- 5. Achievement Approvals
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

        -- 6. Achievement Rejections
        SELECT 
          'ach_rej_' || a.id AS log_id,
          'rejection' AS action_type,
          'Achievement Rejection' AS category,
          a.title AS item_title,
          a.verified_by AS user_id,
          COALESCE(NULLIF(u.full_name, ''), NULLIF(u.profile_details->>'full_name', ''), u.email) AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          COALESCE(a.verified_at, a.created_at) AS timestamp
        FROM achievements a
        JOIN users u ON a.verified_by = u.id
        WHERE a.verification_status = 'rejected'

        UNION ALL

        -- 7. Hackathon Submissions
        SELECT 
          'hack_up_' || h.id AS log_id,
          'upload' AS action_type,
          'Hackathon' AS category,
          h.hackathon_name AS item_title,
          h.user_id AS user_id,
          COALESCE(NULLIF(u.full_name, ''), NULLIF(u.profile_details->>'full_name', ''), u.email) AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          h.created_at AS timestamp
        FROM hackathons h
        JOIN users u ON h.user_id = u.id

        UNION ALL

        -- 8. Hackathon Approvals
        SELECT 
          'hack_app_' || h.id AS log_id,
          'approval' AS action_type,
          'Hackathon Approval' AS category,
          h.hackathon_name AS item_title,
          h.verified_by AS user_id,
          COALESCE(NULLIF(u.full_name, ''), NULLIF(u.profile_details->>'full_name', ''), u.email) AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          COALESCE(h.verified_at, h.created_at) AS timestamp
        FROM hackathons h
        JOIN users u ON h.verified_by = u.id
        WHERE h.verification_status = 'approved'

        UNION ALL

        -- 9. Hackathon Rejections
        SELECT 
          'hack_rej_' || h.id AS log_id,
          'rejection' AS action_type,
          'Hackathon Rejection' AS category,
          h.hackathon_name AS item_title,
          h.verified_by AS user_id,
          COALESCE(NULLIF(u.full_name, ''), NULLIF(u.profile_details->>'full_name', ''), u.email) AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          COALESCE(h.verified_at, h.created_at) AS timestamp
        FROM hackathons h
        JOIN users u ON h.verified_by = u.id
        WHERE h.verification_status = 'rejected'

        UNION ALL

        -- 10. Faculty Research Submissions
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

        -- 11. Faculty Consultancy Submissions
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

        -- 12. Faculty Participation Submissions
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

        -- 13. Department Event Submissions
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

        UNION ALL

        -- 14. Activity Coordinator Mappings
        SELECT 
          'coord_' || ac.id AS log_id,
          'coordinator' AS action_type,
          'Coordinator Mapping' AS category,
          ('Assigned as ' || COALESCE(at.name, 'Activity') || ' Coordinator') AS item_title,
          ac.staff_id AS user_id,
          COALESCE(NULLIF(u.full_name, ''), NULLIF(u.profile_details->>'full_name', ''), u.email) AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          ac.created_at AS timestamp
        FROM activity_coordinators ac
        JOIN users u ON ac.staff_id = u.id
        LEFT JOIN activity_types at ON ac.activity_type_id = at.id

        UNION ALL

        -- 15. Audit Logs (Deletions, Batch Uploads, Governance)
        SELECT 
          'audit_' || al.id AS log_id,
          al.action_type,
          al.category,
          al.item_title,
          al.user_id,
          COALESCE(al.user_name, NULLIF(u.full_name, ''), NULLIF(u.profile_details->>'full_name', ''), u.email, 'Admin') AS user_name,
          COALESCE(al.user_email, u.email, 'admin@sonatech.ac.in') AS user_email,
          COALESCE(al.user_role, u.role, 'admin') AS user_role,
          al.created_at AS timestamp
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
      ) logs
      ORDER BY timestamp DESC
      LIMIT 500
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
