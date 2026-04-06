// src/controllers/hackathonController.js
import pool from "../config/db.js";
import path from "path";
import fs from "fs";
import logger, { reqContext } from "../utils/logger.js";
import { QueryBuilder } from "../utils/queryBuilder.js";

const COORDINATOR_ACTIVITY_TYPES = [
  "hackathon entry progress",
  "hackathon",
  "hackathons",
];
const VALID_PROGRESS = [
  "Registered",
  "Round 1 Qualified",
  "Round 2 Qualified",
  "Round 3 Qualified",
  "Finalist",
  "Winner",
  "Runner-up",
  "Shortlisted",
  "Completed",
  "Not shortlisted",
];

function isWarningSchemaMissingError(err) {
  const message = String(err?.message || "").toLowerCase();
  if (
    err?.code === "42703" &&
    (message.includes("deadline_warning_sent") ||
      message.includes("deadline_warning_sent_at"))
  ) {
    return true;
  }
  if (
    err?.code === "42p01" &&
    (message.includes("staff_announcements") ||
      message.includes("staff_announcement_recipients"))
  ) {
    return true;
  }
  return false;
}

async function hasHackathonCoordinatorMapping(staffId, db = pool) {
  if (!staffId) return false;
  const { rows } = await db.query(
    `SELECT 1
       FROM activity_coordinators ac
       JOIN activity_types at ON at.id = ac.activity_type_id
      WHERE ac.staff_id = $1
        AND (
          LOWER(TRIM(at.name)) = ANY($2::text[])
          OR LOWER(TRIM(at.name)) LIKE '%hackathon%'
        )
      LIMIT 1`,
    [staffId, COORDINATOR_ACTIVITY_TYPES],
  );
  return rows.length > 0;
}

async function sendDurationOverWarnings({ requesterId, requesterRole }) {
  if (!requesterId || !requesterRole) {
    return 0;
  }

  let whereClause = `duration_end_date IS NOT NULL
          AND duration_end_date < CURRENT_DATE
          AND COALESCE(deadline_warning_sent, FALSE) = FALSE`;
  const whereValues = [];

  if (requesterRole === "staff") {
    const mapped = await hasHackathonCoordinatorMapping(requesterId);
    if (!mapped) return 0;
  } else if (requesterRole === "student" || requesterRole === "alumni") {
    whereValues.push(requesterId);
    whereClause += ` AND user_id = $${whereValues.length}`;
  } else if (requesterRole !== "admin") {
    return 0;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: expiredRows } = await client.query(
      `SELECT id, user_id, hackathon_name, duration_end_date
         FROM hackathons
        WHERE ${whereClause}`,
      whereValues,
    );

    for (const item of expiredRows) {
      const { rows: annRows } = await client.query(
        `INSERT INTO staff_announcements (title, description, message, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          "Hackathon Deadline Over - Update Required",
          `Hackathon: ${item.hackathon_name}`,
          `Your hackathon \"${item.hackathon_name}\" has crossed the duration end date (${item.duration_end_date}). Please update your latest rounds/progress/prize details.`,
          requesterRole === "staff" || requesterRole === "admin" ? requesterId : null,
        ],
      );

      const announcementId = annRows[0]?.id;
      if (announcementId && item.user_id) {
        await client.query(
          `INSERT INTO staff_announcement_recipients (announcement_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (announcement_id, user_id) DO NOTHING`,
          [announcementId, item.user_id],
        );
      }

      await client.query(
        `UPDATE hackathons
            SET deadline_warning_sent = TRUE,
                deadline_warning_sent_at = NOW(),
                updated_at = NOW()
          WHERE id = $1`,
        [item.id],
      );
    }

    await client.query("COMMIT");
    return expiredRows.length;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback errors.
    }

    if (isWarningSchemaMissingError(err)) {
      logger.warn("Skipping deadline warnings because warning schema is not available", {
        "db.error.code": err?.code,
        "db.error.message": err?.message,
      });
      return 0;
    }

    throw err;
  } finally {
    client.release();
  }
}

async function canStaffManageHackathon(staffId) {
  return hasHackathonCoordinatorMapping(staffId);
}

function parseRounds(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 10) return null;
  return parsed;
}

// Create hackathon entry (students)
export async function createHackathon(req, res) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      student_name,
      mobile_number,
      team_leader_name,
      team_members_count,
      team_member_names,
      hackathon_name,
      mentor,
      hosted_by,
      location,
      duration_start_date,
      duration_end_date,
      no_of_rounds,
      progress,
      prize,
    } = req.body;

    // Validate required fields
    if (!student_name?.trim())
      return res.status(400).json({ message: "Student name is required" });
    if (!mobile_number?.trim())
      return res.status(400).json({ message: "Mobile number is required" });
    if (!team_leader_name?.trim())
      return res.status(400).json({ message: "Team leader name is required" });
    if (!team_member_names?.trim())
      return res.status(400).json({ message: "Team member names are required" });
    if (!hackathon_name?.trim())
      return res.status(400).json({ message: "Hackathon name is required" });
    if (!hosted_by?.trim())
      return res.status(400).json({ message: "Hosted by is required" });
    if (!location?.trim())
      return res.status(400).json({ message: "Location is required" });
    if (!duration_start_date)
      return res.status(400).json({ message: "Duration start date is required" });
    if (!progress)
      return res.status(400).json({ message: "Progress is required" });

    // Handle file upload (proof is required)
    const files = req.files || {};
    const proofFile = files.proof ? files.proof[0] : null;

    if (!proofFile) {
      return res.status(400).json({ message: "Proof file is required" });
    }

    // Validate file type
    const allowedTypes = ['.jpeg', '.jpg', '.pdf', '.docx', '.png', '.pptx'];
    const fileExt = path.extname(proofFile.originalname).toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      // Delete uploaded file
      try {
        fs.unlinkSync(path.resolve(process.env.FILE_STORAGE_PATH || "./uploads", proofFile.filename));
      } catch {}
      return res.status(400).json({ 
        message: "Invalid file type. Allowed types: JPEG, JPG, PDF, DOCX, PNG, PPTX" 
      });
    }

    // Parse team_members_count
    let teamCount = 1;
    if (team_members_count) {
      const parsed = parseInt(team_members_count, 10);
      if (!isNaN(parsed) && parsed > 0) {
        teamCount = parsed;
      }
    }

    // Parse no_of_rounds
    const rounds = parseRounds(no_of_rounds);

    // Validate progress value
    if (!VALID_PROGRESS.includes(progress)) {
      // Delete uploaded file
      try {
        fs.unlinkSync(path.resolve(process.env.FILE_STORAGE_PATH || "./uploads", proofFile.filename));
      } catch {}
      return res.status(400).json({ 
        message: "Invalid progress value" 
      });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert file record
      const fileResult = await client.query(
        "INSERT INTO project_files (filename, original_name, mime_type, size, file_type, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
        [proofFile.filename, proofFile.originalname, proofFile.mimetype, proofFile.size, "hackathon_proof", userId]
      );
      const proofFileId = fileResult.rows[0].id;

      let insertSql = `
        INSERT INTO hackathons (
          user_id, student_name, mobile_number, team_leader_name, 
          team_members_count, team_member_names, hackathon_name, 
          mentor, hosted_by, location, duration_start_date, 
          duration_end_date, no_of_rounds, progress, prize, proof_file_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) 
        RETURNING *
      `;
      
      let params = [
        userId,
        student_name.trim(),
        mobile_number.trim(),
        team_leader_name.trim(),
        teamCount,
        team_member_names.trim(),
        hackathon_name.trim(),
        mentor?.trim() || null,
        hosted_by.trim(),
        location.trim(),
        duration_start_date,
        duration_end_date || null,
        rounds,
        progress,
        prize?.trim() || null,
        proofFileId,
      ];

      // If staff/admin, auto-approve
      if (userRole === "staff" || userRole === "admin") {
        insertSql = `
          INSERT INTO hackathons (
            user_id, student_name, mobile_number, team_leader_name, 
            team_members_count, team_member_names, hackathon_name, 
            mentor, hosted_by, location, duration_start_date, 
            duration_end_date, no_of_rounds, progress, prize, proof_file_id,
            verified, verification_status, verified_by, verified_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true,'approved',$17,NOW()) 
          RETURNING *
        `;
        params = [
          userId,
          student_name.trim(),
          mobile_number.trim(),
          team_leader_name.trim(),
          teamCount,
          team_member_names.trim(),
          hackathon_name.trim(),
          mentor?.trim() || null,
          hosted_by.trim(),
          location.trim(),
          duration_start_date,
          duration_end_date || null,
          rounds,
          progress,
          prize?.trim() || null,
          proofFileId,
          userId,
        ];
      }

      const result = await client.query(insertSql, params);

      await client.query("COMMIT");
      return res.status(201).json({ 
        message: "Hackathon entry created successfully", 
        hackathon: result.rows[0] 
      });
    } catch (err) {
      await client.query("ROLLBACK");
      // Delete uploaded file on error
      try {
        fs.unlinkSync(path.resolve(process.env.FILE_STORAGE_PATH || "./uploads", proofFile.filename));
      } catch {}
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error("Hackathon controller error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// List hackathons
export async function listHackathons(req, res) {
  const {
    user_id,
    verified,
    verification_status,
    mine,
    limit = 20,
    offset = 0,
  } = req.query;
  
  try {
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;

    if (
      requesterId &&
      ((mine === "true" && (requesterRole === "student" || requesterRole === "alumni")) ||
        requesterRole === "staff" ||
        requesterRole === "admin")
    ) {
      try {
        await sendDurationOverWarnings({ requesterId, requesterRole });
      } catch (warningErr) {
        logger.warn("Failed to send duration-over warnings in listHackathons; continuing", {
          err: warningErr,
          ...reqContext(req),
        });
      }
    }

    const qb = new QueryBuilder(
      `SELECT h.*, 
        u.email AS user_email,
        u.full_name AS user_fullname,
        pf.original_name AS proof_name,
        pf.filename AS proof_filename,
        pf.mime_type AS proof_mime
      FROM hackathons h
      LEFT JOIN users u ON h.user_id = u.id
      LEFT JOIN project_files pf ON h.proof_file_id = pf.id`
    );

    // Mine filter
    if (mine === "true" && requesterId) {
      qb.addWhere(`h.user_id = ${qb.addParam(requesterId)}`);
    } else if (user_id) {
      qb.addWhere(`h.user_id = ${qb.addParam(parseInt(user_id, 10))}`);
    }

    // Verified filter
    if (verified === "true") {
      qb.addWhere("h.verified = TRUE");
    } else if (verified === "false") {
      qb.addWhere("h.verified = FALSE");
    }

    if (verification_status?.trim()) {
      qb.addWhere(`LOWER(h.verification_status) = LOWER(${qb.addParam(verification_status.trim())})`);
    }

    // Staff can see all, students can only see their own and verified ones
    if (requesterRole !== "staff" && requesterRole !== "admin") {
      if (!mine || mine !== "true") {
        if (requesterId) {
          qb.addWhere(`(h.verified = TRUE OR h.user_id = ${qb.addParam(requesterId)})`);
        } else {
          qb.addWhere("h.verified = TRUE");
        }
      }
    }

    // Build query with ORDER BY, LIMIT, OFFSET in suffix
    const suffix = `ORDER BY h.created_at DESC LIMIT ${Math.max(1, Math.min(200, parseInt(limit, 10) || 20))} OFFSET ${Math.max(0, parseInt(offset, 10) || 0)}`;
    const { text, values } = qb.build(suffix);
    const result = await pool.query(text, values);
    return res.json({ hackathons: result.rows });
  } catch (err) {
    logger.error("List hackathons error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// Coordinator queue (staff/admin) with automatic deadline warning dispatch
export async function listCoordinatorHackathons(req, res) {
  try {
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;
    const { status = "all", limit = 50, offset = 0 } = req.query;

    if (!requesterId || (requesterRole !== "staff" && requesterRole !== "admin")) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (requesterRole === "staff") {
      const mapped = await canStaffManageHackathon(requesterId);
      if (!mapped) {
        return res.json({ hackathons: [], warningsSent: 0 });
      }
    }

    let warningsSent = 0;
    try {
      warningsSent = await sendDurationOverWarnings({ requesterId, requesterRole });
    } catch (warningErr) {
      logger.warn("Failed to send duration-over warnings in coordinator queue; continuing", {
        err: warningErr,
        ...reqContext(req),
      });
    }

    const values = [];
    const where = [];
    if (status && status !== "all") {
      values.push(status);
      where.push(`LOWER(h.verification_status) = LOWER($${values.length})`);
    }

    values.push(parseInt(limit, 10) || 50);
    values.push(parseInt(offset, 10) || 0);

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT h.*,
              u.email AS user_email,
              u.full_name AS user_fullname,
              pf.original_name AS proof_name,
              pf.filename AS proof_filename,
              pf.mime_type AS proof_mime,
              vu.full_name AS verified_by_name
         FROM hackathons h
         LEFT JOIN users u ON h.user_id = u.id
         LEFT JOIN project_files pf ON h.proof_file_id = pf.id
         LEFT JOIN users vu ON h.verified_by = vu.id
         ${whereSql}
         ORDER BY h.created_at DESC
         LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );

    return res.json({ hackathons: rows, warningsSent });
  } catch (err) {
    logger.error("List coordinator hackathons error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// Get hackathon details
export async function getHackathonDetails(req, res) {
  try {
    const { id } = req.params;
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;

    const result = await pool.query(
      `SELECT h.*, 
        u.email AS user_email,
        u.full_name AS user_fullname,
        pf.original_name AS proof_name,
        pf.filename AS proof_filename,
        pf.mime_type AS proof_mime,
        vu.full_name AS verified_by_name
      FROM hackathons h
      LEFT JOIN users u ON h.user_id = u.id
      LEFT JOIN project_files pf ON h.proof_file_id = pf.id
      LEFT JOIN users vu ON h.verified_by = vu.id
      WHERE h.id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Hackathon not found" });
    }

    const hackathon = result.rows[0];

    // Authorization: students can only see their own or verified
    if (requesterRole !== "staff" && requesterRole !== "admin") {
      if (hackathon.user_id !== requesterId && !hackathon.verified) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (requesterRole === "staff") {
      const mapped = await canStaffManageHackathon(requesterId);
      if (!mapped) return res.status(403).json({ message: "Access denied for this coordinator" });
    }

    return res.json({ hackathon });
  } catch (err) {
    logger.error("Get hackathon details error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// Verify hackathon (staff only)
export async function verifyHackathon(req, res) {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const staffId = req.user?.id;

    const mapped = await canStaffManageHackathon(staffId);
    if (!mapped) {
      return res.status(403).json({ message: "Not authorized to verify hackathons" });
    }

    const result = await pool.query(
      `UPDATE hackathons 
       SET verified = TRUE, 
           verification_status = 'approved', 
           verification_comment = $1, 
           verified_by = $2, 
           verified_at = NOW(),
           updated_at = NOW()
       WHERE id = $3 
       RETURNING *`,
      [comment || null, staffId, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Hackathon not found" });
    }

    return res.json({ message: "Hackathon verified", hackathon: result.rows[0] });
  } catch (err) {
    logger.error("Verify hackathon error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// Reject hackathon (staff only)
export async function rejectHackathon(req, res) {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const staffId = req.user?.id;

    const mapped = await canStaffManageHackathon(staffId);
    if (!mapped) {
      return res.status(403).json({ message: "Not authorized to reject hackathons" });
    }

    if (!comment?.trim()) {
      return res.status(400).json({ message: "Rejection comment is required" });
    }

    const result = await pool.query(
      `UPDATE hackathons 
       SET verified = FALSE, 
           verification_status = 'rejected', 
           verification_comment = $1, 
           verified_by = $2, 
           verified_at = NOW(),
           updated_at = NOW()
       WHERE id = $3 
       RETURNING *`,
      [comment.trim(), staffId, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Hackathon not found" });
    }

    return res.json({ message: "Hackathon rejected", hackathon: result.rows[0] });
  } catch (err) {
    logger.error("Reject hackathon error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// Coordinator updates progress-related fields
export async function updateHackathonProgressByCoordinator(req, res) {
  try {
    const { id } = req.params;
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;

    if (!requesterId || (requesterRole !== "staff" && requesterRole !== "admin")) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (requesterRole === "staff") {
      const mapped = await canStaffManageHackathon(requesterId);
      if (!mapped) return res.status(403).json({ message: "Not authorized for hackathon progress updates" });
    }

    const { rows: existingRows } = await pool.query(
      "SELECT id, duration_start_date, duration_end_date FROM hackathons WHERE id = $1",
      [id],
    );
    if (!existingRows.length) {
      return res.status(404).json({ message: "Hackathon not found" });
    }

    const existing = existingRows[0];
    const updates = [];
    const values = [];

    if (Object.prototype.hasOwnProperty.call(req.body, "duration_end_date")) {
      const nextEndDate = req.body.duration_end_date || null;
      if (nextEndDate && existing.duration_start_date && new Date(nextEndDate) < new Date(existing.duration_start_date)) {
        return res.status(400).json({ message: "End date cannot be before start date" });
      }
      values.push(nextEndDate);
      updates.push(`duration_end_date = $${values.length}`);

      // If coordinator extends/adjusts date, allow warnings to be sent again when new date expires.
      updates.push("deadline_warning_sent = FALSE");
      updates.push("deadline_warning_sent_at = NULL");
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "no_of_rounds")) {
      values.push(parseRounds(req.body.no_of_rounds));
      updates.push(`no_of_rounds = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "progress")) {
      values.push(req.body.progress);
      updates.push(`progress = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "prize")) {
      values.push(req.body.prize?.trim() || null);
      updates.push(`prize = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "verification_comment")) {
      values.push(req.body.verification_comment?.trim() || null);
      updates.push(`verification_comment = $${values.length}`);
    }

    if (!updates.length) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    updates.push("coordinator_updated_by = $" + (values.push(requesterId)));
    updates.push("coordinator_updated_at = NOW()");
    updates.push("updated_at = NOW()");

    values.push(id);
    const updateSql = `
      UPDATE hackathons
         SET ${updates.join(", ")}
       WHERE id = $${values.length}
       RETURNING *
    `;
    const { rows } = await pool.query(updateSql, values);

    return res.json({ message: "Hackathon progress updated", hackathon: rows[0] });
  } catch (err) {
    logger.error("Coordinator hackathon update error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// Student updates result fields after deadline reminders
export async function updateHackathonProgressByStudent(req, res) {
  try {
    const { id } = req.params;
    const requesterId = req.user?.id;

    if (!requesterId) return res.status(401).json({ message: "Unauthorized" });

    const { rows: existingRows } = await pool.query(
      "SELECT id, user_id, duration_start_date FROM hackathons WHERE id = $1",
      [id],
    );
    if (!existingRows.length) {
      return res.status(404).json({ message: "Hackathon not found" });
    }

    const existing = existingRows[0];
    if (existing.user_id !== requesterId) {
      return res.status(403).json({ message: "You can only update your own hackathon entries" });
    }

    const updates = [];
    const values = [];

    if (Object.prototype.hasOwnProperty.call(req.body, "duration_end_date")) {
      const nextEndDate = req.body.duration_end_date || null;
      if (nextEndDate && existing.duration_start_date && new Date(nextEndDate) < new Date(existing.duration_start_date)) {
        return res.status(400).json({ message: "End date cannot be before start date" });
      }
      values.push(nextEndDate);
      updates.push(`duration_end_date = $${values.length}`);
      updates.push("deadline_warning_sent = FALSE");
      updates.push("deadline_warning_sent_at = NULL");
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "no_of_rounds")) {
      values.push(parseRounds(req.body.no_of_rounds));
      updates.push(`no_of_rounds = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "progress")) {
      values.push(req.body.progress);
      updates.push(`progress = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "prize")) {
      values.push(req.body.prize?.trim() || null);
      updates.push(`prize = $${values.length}`);
    }

    if (!updates.length) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    updates.push("verification_status = 'pending'");
    updates.push("verified = FALSE");
    updates.push("verified_by = NULL");
    updates.push("verified_at = NULL");
    updates.push("updated_at = NOW()");

    values.push(id);
    const updateSql = `
      UPDATE hackathons
         SET ${updates.join(", ")}
       WHERE id = $${values.length}
       RETURNING *
    `;

    const { rows } = await pool.query(updateSql, values);
    return res.json({ message: "Hackathon result updated", hackathon: rows[0] });
  } catch (err) {
    logger.error("Student hackathon update error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

// Get hackathons count
export async function getHackathonsCount(req, res) {
  try {
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;

    let query = "SELECT COUNT(*) FROM hackathons";
    let params = [];

    // Students can only count their own or verified
    if (requesterRole !== "staff" && requesterRole !== "admin" && requesterId) {
      query += " WHERE user_id = $1 OR verified = TRUE";
      params = [requesterId];
    }

    const result = await pool.query(query, params);
    return res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    logger.error("Get hackathons count error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}
