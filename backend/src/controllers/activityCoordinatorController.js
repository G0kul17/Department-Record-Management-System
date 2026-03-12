import pool from "../config/db.js";
import logger, { reqContext } from "../utils/logger.js";
import {
  ActivityTypeValidationError,
  requireActivityTypeByName,
} from "../utils/activityTypeUtils.js";

// List all activity coordinator mappings
export async function getAllActivityCoordinators(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT ac.id, ac.activity_type_id, at.name AS activity_type, ac.staff_id,
              u.email AS staff_email,
              u.profile_details->>'full_name' AS staff_name,
              ac.created_at
         FROM activity_coordinators ac
         JOIN activity_types at ON at.id = ac.activity_type_id
         JOIN users u ON ac.staff_id = u.id
         ORDER BY LOWER(at.name), u.email`
    );
    return res.json({ mappings: rows });
  } catch (err) {
    logger.error("Activity coordinator controller error", { err,
      ...reqContext(req) });
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
  try {
    const activityTypeRow = await requireActivityTypeByName(
      pool,
      activityType,
      "activityType",
    );

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

    // Check if mapping already exists for the same FK pair
    const existingCheck = await pool.query(
      "SELECT id FROM activity_coordinators WHERE activity_type_id = $1 AND staff_id = $2",
      [activityTypeRow.id, staffId]
    );
    if (existingCheck.rows.length) {
      return res.status(409).json({ message: "Mapping already exists" });
    }

    const { rows } = await pool.query(
      `INSERT INTO activity_coordinators (activity_type_id, staff_id)
         VALUES ($1, $2)
         RETURNING id, activity_type_id, staff_id, created_at`,
      [activityTypeRow.id, staffId]
    );

    return res.status(201).json({
      mapping: {
        ...rows[0],
        activity_type: activityTypeRow.name,
      },
    });
  } catch (err) {
    if (err instanceof ActivityTypeValidationError) {
      return res.status(err.status).json({ message: err.message });
    }
    logger.error("Activity coordinator controller error", { err,
      ...reqContext(req) });
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
    logger.error("Activity coordinator controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// Distinct list of activity types from mappings and existing records (achievements/projects)
export async function getActivityTypes(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT name AS activity_type
         FROM activity_types
        WHERE LOWER(TRIM(name)) <> 'achievement'
        ORDER BY LOWER(name)`
    );
    return res.json({ activityTypes: rows.map((r) => r.activity_type) });
  } catch (err) {
    logger.error("Activity coordinator controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}
