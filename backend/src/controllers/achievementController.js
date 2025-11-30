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
      event_id,
      name,
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

    // Require proof file upload (expect single file field 'proof')
    let proofFileId = null;
    if (!req.file) {
      return res.status(400).json({ message: "proof file required" });
    }
    // Enforce allowed proof types: PDF or JPG/JPEG/PNG
    const allowedProofTypes = new Set([
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      // Common aliases
      "image/x-png",
      "image/pjpeg",
    ]);
    const f = req.file;
    const fileName = f.originalname || "";
    const ext = fileName.toLowerCase().split(".").pop();
    const extOk = ["pdf", "png", "jpg", "jpeg"].includes(ext);
    if (!(allowedProofTypes.has(f.mimetype) || extOk)) {
      return res
        .status(400)
        .json({ message: "Invalid proof type. Upload PDF or JPG/PNG image." });
    }
    const fileType = "proof";
    const ins = await pool.query(
      "INSERT INTO project_files (filename, original_name, mime_type, size, file_type, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
      [f.filename, f.originalname, f.mimetype, f.size, fileType, userId]
    );
    proofFileId = ins.rows[0].id;

    // duplicate check for same user
    const dup = await pool.query(
      "SELECT id FROM achievements WHERE user_id=$1 AND title=$2 AND date_of_award=$3",
      [userId, title.trim(), date_of_award || null]
    );
    if (dup.rows.length)
      return res.status(409).json({ message: "Duplicate achievement" });

    let insertSql =
      "INSERT INTO achievements (user_id, title, issuer, date_of_award, proof_file_id, date, event_id, name) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *";
    let params = [
      userId,
      title.trim(),
      issuer.trim(),
      date_of_award || null,
      proofFileId,
      date || null,
      event_id ? Number(event_id) : null,
      name.trim(),
    ];
    // If staff/admin, auto-approve (verified=true)
    if (userRole === "staff" || userRole === "admin") {
      insertSql =
        "INSERT INTO achievements (user_id, title, issuer, date_of_award, proof_file_id, date, event_id, name, verified, verification_status, verified_by, verified_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8, true, 'approved', $9, NOW()) RETURNING *";
      params = [
        userId,
        title.trim(),
        issuer.trim(),
        date_of_award || null,
        proofFileId,
        date || null,
        event_id ? Number(event_id) : null,
        name.trim(),
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
    let base = `SELECT a.*, u.email as user_email,
                pf.original_name as proof_name, pf.filename as proof_filename, pf.mime_type as proof_mime
                FROM achievements a LEFT JOIN users u ON a.user_id=u.id
                LEFT JOIN project_files pf ON a.proof_file_id = pf.id`;
    const cond = [];
    const params = [];

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

    const { rows } = await pool.query(
      `SELECT a.*, u.email as user_email, u.fullname as user_fullname, pf.filename as proof_filename, pf.original_name as proof_name, pf.mime_type as proof_mime
       FROM achievements a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN project_files pf ON a.proof_file_id = pf.id
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
    if (verified !== undefined) {
      const val = verified === "true";
      const { rows } = await pool.query(
        "SELECT COUNT(*)::int AS count FROM achievements WHERE verified = $1",
        [val]
      );
      return res.json({ count: rows[0]?.count ?? 0 });
    }
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM achievements"
    );
    return res.json({ count: rows[0]?.count ?? 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
