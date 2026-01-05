import pool from "../config/db.js";

// List all activity coordinator mappings
export async function getAllActivityCoordinators(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT ac.id, ac.activity_type, ac.staff_id,
              u.email AS staff_email,
              u.profile_details->>'full_name' AS staff_name,
              ac.created_at
         FROM activity_coordinators ac
         JOIN users u ON ac.staff_id = u.id
         ORDER BY ac.activity_type, u.email`
    );
    return res.json({ mappings: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Create a new mapping
export async function createActivityCoordinator(req, res) {
  const { activityType, staffId } = req.body || {};
  if (!activityType || !activityType.trim()) {
    return res.status(400).json({ message: "activityType is required" });
  }
  if (!staffId) {
    return res.status(400).json({ message: "staffId is required" });
  }

  const type = activityType.trim();

  try {
    const staffCheck = await pool.query(
      "SELECT id, role FROM users WHERE id = $1",
      [staffId]
    );
    if (!staffCheck.rows.length) {
      return res.status(404).json({ message: "Staff user not found" });
    }
    const role = staffCheck.rows[0].role;
    if (role !== "staff" && role !== "admin") {
      return res.status(400).json({ message: "User must be staff or admin" });
    }

    const { rows } = await pool.query(
      `INSERT INTO activity_coordinators (activity_type, staff_id)
         VALUES ($1, $2)
         ON CONFLICT (activity_type, staff_id) DO NOTHING
         RETURNING id, activity_type, staff_id, created_at`,
      [type, staffId]
    );

    if (!rows.length) {
      return res.status(409).json({ message: "Mapping already exists" });
    }

    return res.status(201).json({ mapping: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Delete mapping
export async function deleteActivityCoordinator(req, res) {
  const { mappingId } = req.params;
  try {
    const { rows } = await pool.query(
      "DELETE FROM activity_coordinators WHERE id = $1 RETURNING id",
      [mappingId]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Mapping not found" });
    }
    return res.json({ message: "Mapping deleted", id: mappingId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Distinct list of activity types from mappings and existing records (achievements/projects)
export async function getActivityTypes(req, res) {
  try {
    const { rows } = await pool.query(
      `WITH candidates AS (
         -- Explicit activity types already stored
         SELECT TRIM(activity_type) AS label FROM activity_coordinators WHERE activity_type IS NOT NULL AND activity_type <> ''
         UNION
         SELECT TRIM(activity_type) AS label FROM achievements WHERE activity_type IS NOT NULL AND activity_type <> ''
         -- Use actual achievement fields as activity labels (titles, issuer, name)
         UNION
         SELECT TRIM(title) AS label FROM achievements WHERE title IS NOT NULL AND title <> ''
         -- Base fallbacks
         UNION
         SELECT 'achievement' AS label
         UNION
         SELECT 'project' AS label
       ), cleaned AS (
         SELECT DISTINCT label FROM candidates WHERE label IS NOT NULL AND label <> ''
       )
       SELECT label AS activity_type FROM cleaned ORDER BY LOWER(label)`
    );
    return res.json({ activityTypes: rows.map((r) => r.activity_type) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
