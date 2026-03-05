import pool from "../config/db.js";
import logger from "../utils/logger.js";

function parseRecipientIds(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((val) => Number(val))
      .filter((val) => Number.isInteger(val) && !Number.isNaN(val));
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((val) => Number(val))
          .filter((val) => Number.isInteger(val) && !Number.isNaN(val));
      }
    } catch {
      // fall back to comma-separated parsing
    }
    return trimmed
      .split(",")
      .map((val) => Number(String(val).trim()))
      .filter((val) => Number.isInteger(val) && !Number.isNaN(val));
  }
  return [];
}

export async function createAnnouncement(req, res) {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ message: "Unauthorized" });

    const { title, description, message, recipients } = req.body || {};
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "title required" });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "announcement message required" });
    }

    const recipientIds = parseRecipientIds(recipients);
    if (!recipientIds.length) {
      return res
        .status(400)
        .json({ message: "At least one recipient is required" });
    }

    let brochureFileId = null;
    const brochureFile = req.files?.brochure?.[0];
    if (brochureFile) {
      const { rows: fileRows } = await pool.query(
        "INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
        [
          null,
          brochureFile.filename,
          brochureFile.originalname,
          brochureFile.mimetype,
          brochureFile.size,
          "announcement_brochure",
          staffId,
        ],
      );
      brochureFileId = fileRows[0]?.id || null;
    }

    const { rows } = await pool.query(
      "INSERT INTO staff_announcements (title, description, message, brochure_file_id, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id",
      [
        title.trim(),
        description && description.trim() ? description.trim() : null,
        message.trim(),
        brochureFileId,
        staffId,
      ],
    );

    const announcementId = rows[0]?.id;
    if (!announcementId) {
      return res.status(500).json({ message: "Failed to create announcement" });
    }

    const uniqueIds = Array.from(new Set(recipientIds));
    const valuesSql = uniqueIds.map((_, idx) => `($1,$${idx + 2})`).join(",");
    await pool.query(
      `INSERT INTO staff_announcement_recipients (announcement_id, user_id)
       VALUES ${valuesSql}
       ON CONFLICT (announcement_id, user_id) DO NOTHING`,
      [announcementId, ...uniqueIds],
    );

    return res
      .status(201)
      .json({ message: "Announcement sent", id: announcementId });
  } catch (err) {
    logger.error("Announcement controller error", { err, "trace.id": req.correlationId, "user.id": req.user?.id });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listMyAnnouncements(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const limit = Number(req.query.limit) || 50;

    const { rows } = await pool.query(
      `SELECT a.id,
              a.title,
              a.description,
              a.message,
              a.created_at,
              a.created_by,
              u.full_name AS created_by_name,
              u.email AS created_by_email,
              pf.filename AS brochure_filename,
              pf.original_name AS brochure_name,
              pf.mime_type AS brochure_mime,
              ar.created_at AS delivered_at
         FROM staff_announcements a
         JOIN staff_announcement_recipients ar ON ar.announcement_id = a.id
         LEFT JOIN users u ON u.id = a.created_by
         LEFT JOIN project_files pf ON pf.id = a.brochure_file_id
        WHERE ar.user_id = $1
        ORDER BY ar.created_at DESC
        LIMIT $2`,
      [userId, limit],
    );

    return res.json({ announcements: rows });
  } catch (err) {
    logger.error("Announcement controller error", { err, "trace.id": req.correlationId, "user.id": req.user?.id });
    return res.status(500).json({ message: "Server error" });
  }
}
