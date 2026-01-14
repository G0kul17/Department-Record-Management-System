// src/controllers/achievementController.js
import pool from "../config/db.js";

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

    // Helper function to insert file and return id
    const insertFileRecord = async (file, fileType) => {
      const ins = await pool.query(
        "INSERT INTO project_files (filename, original_name, mime_type, size, file_type, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
        [file.filename, file.originalname, file.mimetype, file.size, fileType, userId]
      );
      return ins.rows[0].id;
    };

    // Insert all files
    const proofFileId = await insertFileRecord(proofFile, "proof");
    let certificateFileId = null;
    if (certificateFile) {
      certificateFileId = await insertFileRecord(certificateFile, "certificate");
    }
    let eventPhotosFileId = null;
    if (eventPhotosFile) {
      eventPhotosFileId = await insertFileRecord(eventPhotosFile, "event_photos");
    }

    // duplicate check for same user
    const dup = await pool.query(
      "SELECT id FROM achievements WHERE user_id=$1 AND title=$2 AND date_of_award=$3",
      [userId, title.trim(), date_of_award || null]
    );
    if (dup.rows.length)
      return res.status(409).json({ message: "Duplicate achievement" });

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
    const result = await pool.query(insertSql, params);

    // optional: auto-post to community if requested (left as TODO; integrate with posts endpoint)
    if (post_to_community === "true") {
      // TODO: insert into posts table referencing achievement id
    }

    return res
      .status(201)
      .json({ message: "Achievement created", achievement: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listAchievements(req, res) {
  const { user_id, verified, q, limit = 20, offset = 0 } = req.query;
  try {
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;

    // Include uploader identity (prefer achievement owner, fallback to proof file uploader)
    // Also include certificate and event_photos file details
    let base = `SELECT a.*, COALESCE(u.email, u2.email, ux.email)        AS user_email,
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
          LEFT JOIN users v ON v.id = a.verified_by`;
    const cond = [];
    const params = [];

    // Staff can only see achievements for activity types they coordinate
    if (requesterRole === "staff" && requesterId) {
      base += ` LEFT JOIN activity_coordinators ac ON ac.activity_type = a.activity_type AND ac.staff_id = $${
        params.length + 1
      }`;
      params.push(requesterId);
      cond.push(`ac.id IS NOT NULL`);
    }

    if (user_id) {
      params.push(user_id);
      cond.push(`a.user_id=$${params.length}`);
    }
    if (verified !== undefined) {
      params.push(verified === "true");
      cond.push(`a.verified=$${params.length}`);
    }
    if (req.query.status) {
      params.push(req.query.status);
      cond.push(`a.verification_status=$${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      cond.push(
        `(a.title ILIKE $${params.length} OR a.issuer ILIKE $${params.length})`
      );
    }

    if (cond.length) base += " WHERE " + cond.join(" AND ");
    params.push(Number(limit));
    params.push(Number(offset));
    base += ` ORDER BY a.created_at DESC LIMIT $${params.length - 1} OFFSET $${
      params.length
    }`;

    const { rows } = await pool.query(base, params);
    return res.json({ achievements: rows });
  } catch (err) {
    console.error(err);
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
    if (requesterRole === "staff" && requesterId) {
      const { rows: auth } = await pool.query(
        `SELECT 1 FROM achievements a
           JOIN activity_coordinators ac
             ON ac.activity_type = a.activity_type AND ac.staff_id = $1
          WHERE a.id = $2`,
        [requesterId, id]
      );
      if (!auth.length) {
        return res
          .status(403)
          .json({ message: "Not authorized to view this achievement" });
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
       WHERE a.id = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    return res.json({ achievement: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function verifyAchievement(req, res) {
  try {
    const id = Number(req.params.id);
    const requesterRole = req.user?.role;
    const requesterId = req.user?.id;
    // Staff can only verify achievements for activity types they coordinate
    if (requesterRole === "staff" && requesterId) {
      const { rows: auth } = await pool.query(
        `SELECT 1 FROM achievements a
          JOIN activity_coordinators ac
            ON ac.activity_type = a.activity_type AND ac.staff_id = $1
         WHERE a.id = $2`,
        [requesterId, id]
      );
      if (!auth.length) {
        return res
          .status(403)
          .json({ message: "Not authorized to approve this achievement" });
      }
    }
    await pool.query(
      "UPDATE achievements SET verified = true, verification_status='approved', verified_by=$2, verified_at=NOW() WHERE id=$1",
      [id, req.user?.id || null]
    );
    return res.json({ message: "Achievement approved" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function rejectAchievement(req, res) {
  try {
    const id = Number(req.params.id);
    const requesterRole = req.user?.role;
    const requesterId = req.user?.id;
    // Staff can only reject achievements for activity types they coordinate
    if (requesterRole === "staff" && requesterId) {
      const { rows: auth } = await pool.query(
        `SELECT 1 FROM achievements a
          JOIN activity_coordinators ac
            ON ac.activity_type = a.activity_type AND ac.staff_id = $1
         WHERE a.id = $2`,
        [requesterId, id]
      );
      if (!auth.length) {
        return res
          .status(403)
          .json({ message: "Not authorized to reject this achievement" });
      }
    }
    await pool.query(
      "UPDATE achievements SET verified = false, verification_status='rejected', verified_by=$2, verified_at=NOW() WHERE id=$1",
      [id, req.user?.id || null]
    );
    return res.json({ message: "Achievement rejected" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getAchievementsCount(req, res) {
  try {
    const { verified } = req.query;
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM achievements WHERE verified = true OR verification_status = 'approved'"
    );
    return res.json({ count: rows[0]?.count ?? 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getAchievementsLeaderboard(req, res) {
  try {
    const limit = Number(req.query.limit) || 10;
    
    const { rows } = await pool.query(
      `SELECT 
        u.id,
        u.email,
        COALESCE(u.full_name, a.name) AS name,
        COUNT(a.id)::int AS achievement_count
       FROM achievements a
       JOIN users u ON a.user_id = u.id
       WHERE (a.verified = true OR a.verification_status = 'approved')
       GROUP BY u.id, u.email, u.full_name, a.name
       ORDER BY achievement_count DESC, u.full_name ASC
       LIMIT $1`,
      [limit]
    );
    
    return res.json({ leaderboard: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
