// src/controllers/achievementController.js
import pool from "../config/db.js";
import path from "path";
import fs from "fs";
import logger, { reqContext } from "../utils/logger.js";
import { QueryBuilder } from "../utils/queryBuilder.js";
import { reviewAchievement, ReviewError } from "../services/reviewService.js";

// create achievement (students)
export async function createAchievement(req, res) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      title,
      issuer,
      date_of_award,
      post_to_community,
      date,
      event_id, // deprecated
      event_name, // new free-text field
      activity_type,
      name,
      prize_amount,
      position,
    } = req.body;
    if (!title) return res.status(400).json({ message: "title required" });
    // Mandatory fields per UI: issuer, date, name, proof file (event_id optional)
    if (!(date_of_award || date))
      return res.status(400).json({ message: "date required" });
    if (!issuer || !issuer.trim())
      return res.status(400).json({ message: "issuer required" });
    // event_id is optional
    if (!name || !name.trim())
      return res.status(400).json({ message: "name required" });

    // Handle file uploads with req.files (from upload.fields)
    const files = req.files || {};
    const proofFile = files.proof ? files.proof[0] : null;
    const certificateFile = files.certificate ? files.certificate[0] : null;
    const eventPhotosFile = files.event_photos ? files.event_photos[0] : null;

    // Require proof file upload
    if (!proofFile) {
      return res.status(400).json({ message: "proof file required" });
    }

    // Accept all file types - no validation

    // duplicate check for same user — must run before any file writes
    const dup = await pool.query(
      "SELECT id FROM achievements WHERE user_id=$1 AND title=$2 AND date_of_award=$3",
      [userId, title.trim(), date_of_award || null],
    );
    if (dup.rows.length) {
      for (const uploadedFile of [proofFile, certificateFile, eventPhotosFile].filter(Boolean)) {
        try { fs.unlinkSync(path.resolve(process.env.FILE_STORAGE_PATH || "./uploads", uploadedFile.filename)); } catch {}
      }
      return res.status(409).json({ message: "Duplicate achievement" });
    }

    const activityType = (activity_type || title || "").trim() || null;
    const eventNameVal = (event_name || "").trim() || null;

    // Parse prize_amount safely
    let prizeAmount = null;
    if (prize_amount) {
      const parsed = parseFloat(prize_amount);
      if (!isNaN(parsed)) {
        prizeAmount = parsed;
      }
    }

    // Position validation - only allow 1st, 2nd, 3rd
    let pos = null;
    if (position) {
      const posVal = (position || "").trim().toLowerCase();
      if (["1st", "2nd", "3rd"].includes(posVal)) {
        pos = posVal;
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertFileRecord = async (file, fileType) => {
        const ins = await client.query(
          "INSERT INTO project_files (filename, original_name, mime_type, size, file_type, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
          [file.filename, file.originalname, file.mimetype, file.size, fileType, userId],
        );
        return ins.rows[0].id;
      };

      const proofFileId = await insertFileRecord(proofFile, "proof");
      let certificateFileId = null;
      if (certificateFile) {
        certificateFileId = await insertFileRecord(certificateFile, "certificate");
      }
      let eventPhotosFileId = null;
      if (eventPhotosFile) {
        eventPhotosFileId = await insertFileRecord(eventPhotosFile, "event_photos");
      }

      let insertSql =
        "INSERT INTO achievements (user_id, title, issuer, date_of_award, proof_file_id, certificate_file_id, event_photos_file_id, date, event_id, event_name, activity_type, name, prize_amount, position) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *";
      let params = [
        userId,
        title.trim(),
        issuer.trim(),
        date_of_award || null,
        proofFileId,
        certificateFileId,
        eventPhotosFileId,
        date || null,
        event_id ? Number(event_id) : null,
        eventNameVal,
        activityType,
        name.trim(),
        prizeAmount,
        pos,
      ];

      // If staff/admin, auto-approve (verified=true)
      if (userRole === "staff" || userRole === "admin") {
        insertSql =
          "INSERT INTO achievements (user_id, title, issuer, date_of_award, proof_file_id, certificate_file_id, event_photos_file_id, date, event_id, event_name, activity_type, name, prize_amount, position, verified, verification_status, verified_by, verified_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, true, 'approved', $15, NOW()) RETURNING *";
        params = [
          userId,
          title.trim(),
          issuer.trim(),
          date_of_award || null,
          proofFileId,
          certificateFileId,
          eventPhotosFileId,
          date || null,
          event_id ? Number(event_id) : null,
          eventNameVal,
          activityType,
          name.trim(),
          prizeAmount,
          pos,
          userId,
        ];
      }

      const result = await client.query(insertSql, params);

      // optional: auto-post to community if requested (left as TODO; integrate with posts endpoint)
      if (post_to_community === "true") {
        // TODO: insert into posts table referencing achievement id
      }

      await client.query("COMMIT");
      return res
        .status(201)
        .json({ message: "Achievement created", achievement: result.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error("Achievement controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listAchievements(req, res) {
  const {
    user_id,
    verified,
    q,
    year,
    mine,
    limit = 20,
    offset = 0,
  } = req.query;
  try {
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;

    // Fixed JOINs live in the base string; the conditional staff JOIN is added
    // via qb.addJoin() so QueryBuilder can always emit all JOINs before WHERE.
    const qb = new QueryBuilder(
      `SELECT a.*, COALESCE(u.email, u2.email, ux.email)        AS user_email,
          COALESCE(u.full_name, u2.full_name, ux.full_name) AS user_fullname,
            pf.original_name                    AS proof_name,
            pf.filename                         AS proof_filename,
            pf.mime_type                        AS proof_mime,
            pfc.original_name                   AS certificate_name,
            pfc.filename                        AS certificate_filename,
            pfc.mime_type                       AS certificate_mime,
            pfe.original_name                   AS event_photos_name,
            pfe.filename                        AS event_photos_filename,
            pfe.mime_type                       AS event_photos_mime,
            v.full_name                         AS verified_by_fullname,
            v.email                             AS verified_by_email
            FROM achievements a
            LEFT JOIN users u ON a.user_id=u.id
            LEFT JOIN project_files pf ON a.proof_file_id = pf.id
            LEFT JOIN project_files pfc ON a.certificate_file_id = pfc.id
            LEFT JOIN project_files pfe ON a.event_photos_file_id = pfe.id
          LEFT JOIN users u2 ON u2.id = pf.uploaded_by
          LEFT JOIN users ux ON LOWER(ux.full_name) = LOWER(a.name)
          LEFT JOIN users v ON v.id = a.verified_by`,
    );

    // Check if viewing verified/approved achievements (not in management mode)
    const isViewingVerified =
      verified === "true" ||
      req.query.status === "approved" ||
      req.query.status === "verified";

    // If not authenticated, only show verified achievements
    if (!requesterId && !req.query.status) {
      qb.addWhere(`a.verified = true`);
    } else if (verified === "true") {
      qb.addWhere(`a.verified = true`);
    }

    // If mine=true, require auth and only return requester's achievements
    const isMine = mine !== undefined && mine !== "false";
    if (isMine) {
      if (!requesterId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      qb.addWhere(`a.user_id = ${qb.addParam(requesterId)}`);
    }

    // Staff can only see achievements for activity types they coordinate (only
    // in management/verification mode — not when browsing verified or own records).
    // addParam is called first so the placeholder is known before addJoin uses it.
    if (requesterRole === "staff" && requesterId && !isViewingVerified && !isMine) {
      const staffRef = qb.addParam(requesterId);
      qb.addJoin(
        `LEFT JOIN activity_coordinators ac ON LOWER(TRIM(ac.activity_type)) = LOWER(TRIM(a.activity_type)) AND ac.staff_id = ${staffRef}`,
      );
      qb.addWhere(`ac.id IS NOT NULL`);
    }

    if (user_id) {
      const requestedUserId = Number(user_id);
      if (!Number.isInteger(requestedUserId)) {
        return res.status(400).json({ message: "Invalid user_id" });
      }
      if (requesterId && requesterRole !== "admin" && requesterRole !== "staff") {
        if (requestedUserId !== requesterId) {
          return res.status(403).json({ message: "Not authorized" });
        }
      }
      qb.addWhere(`a.user_id = ${qb.addParam(requestedUserId)}`);
    }
    if (verified !== undefined) {
      qb.addWhere(`a.verified = ${qb.addParam(verified === "true")}`);
    }
    if (req.query.status) {
      qb.addWhere(`a.verification_status = ${qb.addParam(req.query.status)}`);
    }
    if (q) {
      // addParam once; the returned placeholder is reused in both ILIKE arms.
      const qRef = qb.addParam(`%${q}%`);
      qb.addWhere(`(a.title ILIKE ${qRef} OR a.issuer ILIKE ${qRef})`);
    }
    if (year) {
      const yearRaw = String(year).trim();
      const startYear4 = yearRaw.match(/\d{4}/)?.[0];
      const startYear2 = startYear4 ? startYear4.slice(-2) : null;
      const endYear2 = startYear4
        ? String(parseInt(startYear4) + 1).slice(-2)
        : null;

      const yearClauses = [];

      // Exact match variations for academic_year field
      yearClauses.push(`a.academic_year = ${qb.addParam(yearRaw)}`);

      if (startYear4) {
        // Match patterns like "2025-2026" or "2025-26"
        const nextYear = String(parseInt(startYear4) + 1);
        yearClauses.push(`a.academic_year = ${qb.addParam(`${startYear4}-${nextYear}`)}`);

        if (startYear2 && endYear2) {
          yearClauses.push(`a.academic_year = ${qb.addParam(`${startYear2}-${endYear2}`)}`);
        }

        // Fallback to date fields only if academic_year is NULL/empty
        yearClauses.push(
          `(a.academic_year IS NULL AND to_char(a.date_of_award, 'YYYY') = ${qb.addParam(startYear4)})`,
        );
        yearClauses.push(
          `(a.academic_year IS NULL AND to_char(a.date, 'YYYY') = ${qb.addParam(startYear4)})`,
        );
        yearClauses.push(
          `(a.academic_year IS NULL AND to_char(a.created_at, 'YYYY') = ${qb.addParam(startYear4)})`,
        );
      }

      qb.addWhere(`(${yearClauses.join(" OR ")})`);
    }

    const limitRef = qb.addParam(Number(limit));
    const offsetRef = qb.addParam(Number(offset));
    const { text, values } = qb.build(
      `ORDER BY a.created_at DESC LIMIT ${limitRef} OFFSET ${offsetRef}`,
    );

    const { rows } = await pool.query(text, values);
    return res.json({ achievements: rows });
  } catch (err) {
    logger.error("Achievement controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getAchievementDetails(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || Number.isNaN(id))
      return res.status(400).json({ message: "Invalid achievement id" });

    // Staff should only access achievements for activity types they coordinate
    const requesterRole = req.user?.role;
    const requesterId = req.user?.id;

    // If not authenticated, only show verified achievements
    let whereClause = "WHERE a.id = $1";
    const params = [id];
    if (!requesterId) {
      whereClause += " AND a.verified = true";
    } else if (requesterRole === "staff" && requesterId) {
      const { rows: statusRows } = await pool.query(
        "SELECT verified, verification_status FROM achievements WHERE id = $1",
        [id],
      );
      if (!statusRows.length) {
        return res.status(404).json({ message: "Not found" });
      }
      const isApproved =
        statusRows[0].verified === true ||
        statusRows[0].verification_status === "approved";
      if (!isApproved) {
        const { rows: auth } = await pool.query(
          `SELECT 1 FROM achievements a
             JOIN activity_coordinators ac
               ON LOWER(TRIM(ac.activity_type)) = LOWER(TRIM(a.activity_type)) AND ac.staff_id = $1
            WHERE a.id = $2`,
          [requesterId, id],
        );
        if (!auth.length) {
          return res
            .status(403)
            .json({ message: "Not authorized to view this achievement" });
        }
      }
    }

    const { rows } = await pool.query(
      `SELECT a.*,
              COALESCE(u.email, u2.email, ux.email)        AS user_email,
              COALESCE(u.full_name, u2.full_name, ux.full_name) AS user_fullname,
              pf.filename                         AS proof_filename,
              pf.original_name                    AS proof_name,
              pf.mime_type                        AS proof_mime,
              pfc.filename                        AS certificate_filename,
              pfc.original_name                   AS certificate_name,
              pfc.mime_type                       AS certificate_mime,
              pfe.filename                        AS event_photos_filename,
              pfe.original_name                   AS event_photos_name,
              pfe.mime_type                       AS event_photos_mime
       FROM achievements a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN project_files pf ON a.proof_file_id = pf.id
       LEFT JOIN project_files pfc ON a.certificate_file_id = pfc.id
       LEFT JOIN project_files pfe ON a.event_photos_file_id = pfe.id
       LEFT JOIN users u2 ON u2.id = pf.uploaded_by
       LEFT JOIN users ux ON LOWER(ux.full_name) = LOWER(a.name)
       ${whereClause}`,
      params,
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    return res.json({ achievement: rows[0] });
  } catch (err) {
    logger.error("Achievement controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function verifyAchievement(req, res) {
  try {
    const result = await reviewAchievement(
      Number(req.params.id),
      req.user?.id,
      "approve",
      req.body?.comment,
      req.correlationId,
    );
    return res.json(result);
  } catch (err) {
    if (err instanceof ReviewError) return res.status(err.status).json({ message: err.message });
    logger.error("Achievement controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function rejectAchievement(req, res) {
  try {
    const result = await reviewAchievement(
      Number(req.params.id),
      req.user?.id,
      "reject",
      req.body?.comment,
      req.correlationId,
    );
    return res.json(result);
  } catch (err) {
    if (err instanceof ReviewError) return res.status(err.status).json({ message: err.message });
    logger.error("Achievement controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getAchievementsCount(req, res) {
  try {
    const { verified } = req.query;
    let sql = "SELECT COUNT(*)::int AS count FROM achievements";
    const params = [];

    if (verified !== undefined) {
      params.push(verified === "true");
      sql += ` WHERE verified = $1`;
    }

    const { rows } = await pool.query(sql, params);
    return res.json({ count: rows[0]?.count ?? 0 });
  } catch (err) {
    logger.error("Achievement controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getAchievementsLeaderboard(req, res) {
  try {
    const limit = Number(req.query.limit) || 10;
    const type = (req.query.type || "achievements").toLowerCase();
    const role = (req.query.role || "student").toLowerCase();

    // Map of supported leaderboard queries keyed by type
    const queries = {
      achievements: {
        sql: `SELECT 
                u.id,
                u.email,
                COALESCE(u.full_name, u.email) AS name,
                COUNT(a.id)::int AS item_count
              FROM achievements a
              JOIN users u ON a.user_id = u.id
              WHERE (a.verified = true OR a.verification_status = 'approved')
                AND u.role = $2
              GROUP BY u.id, u.email, u.full_name
              ORDER BY item_count DESC, u.full_name ASC
              LIMIT $1`,
        params: [limit, role],
      },
      projects: {
        sql: `SELECT
                u.id,
                u.email,
                COALESCE(u.full_name, u.email) AS name,
                COUNT(DISTINCT p.id)::int AS item_count
              FROM users u
              LEFT JOIN projects p ON (
                (p.created_by = u.id OR u.full_name = ANY(
                  SELECT TRIM(elem)
                  FROM unnest(string_to_array(p.team_member_names, ',')) AS elem
                ))
                AND (p.verified = true OR p.verification_status = 'approved')
              )
              WHERE u.role = $2 AND p.id IS NOT NULL
              GROUP BY u.id, u.email, u.full_name
              ORDER BY item_count DESC, u.full_name ASC
              LIMIT $1`,
        params: [limit, role],
      },
      faculty_research: {
        sql: `SELECT
                u.id,
                u.email,
                COALESCE(u.full_name, u.email) AS name,
                COUNT(fr.id)::int AS item_count
              FROM faculty_research fr
              JOIN users u ON fr.created_by = u.id
              WHERE u.role = $2
              GROUP BY u.id, u.email, u.full_name
              ORDER BY item_count DESC, u.full_name ASC
              LIMIT $1`,
        params: [limit, role],
      },
      faculty_consultancy: {
        sql: `SELECT
                u.id,
                u.email,
                COALESCE(u.full_name, u.email) AS name,
                COUNT(fc.id)::int AS item_count
              FROM faculty_consultancy fc
              JOIN users u ON fc.created_by = u.id
              WHERE u.role = $2
              GROUP BY u.id, u.email, u.full_name
              ORDER BY item_count DESC, u.full_name ASC
              LIMIT $1`,
        params: [limit, role],
      },
      faculty_participation: {
        sql: `SELECT
                u.id,
                u.email,
                COALESCE(u.full_name, u.email) AS name,
                COUNT(fp.id)::int AS item_count
              FROM faculty_participations fp
              JOIN users u ON fp.created_by = u.id
              WHERE u.role = $2
              GROUP BY u.id, u.email, u.full_name
              ORDER BY item_count DESC, u.full_name ASC
              LIMIT $1`,
        params: [limit, role],
      },
    };

    const key = queries[type] ? type : "achievements";
    const { sql, params } = queries[key];
    const { rows } = await pool.query(sql, params);

    // Normalize field name for the frontend
    const leaderboard = rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      achievement_count: row.item_count,
    }));

    return res.json({ leaderboard });
  } catch (err) {
    logger.error("Achievement controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}
