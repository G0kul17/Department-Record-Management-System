// eventController.js
import pool from "../config/db.js";
import { upload } from "../config/upload.js";

// Create event (staff/admin)
export async function createEvent(req, res) {
  try {
    const staffId = req.user.id;
    const { title, description, venue } = req.body;
    let { start_date, end_date, event_url } = req.body;

    if (!title || !start_date || !venue || !description)
      return res.status(400).json({
        message: "title, description, venue and start_date are required",
      });

    // Normalize date inputs from HTML datetime-local or dd-mm-yyyy formats
    const normalizeDate = (val) => {
      if (!val) return null;
      // Accept ISO-like: 2025-11-28T10:00 or 2025-11-28 10:00
      if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(val))
        return val.replace(" ", "T");
      // Accept dd-mm-yyyy HH:MM and convert
      const m = val.match(/^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2})/);
      if (m) {
        const [_, d, mo, y, h, min] = m;
        return `${y}-${mo}-${d}T${h}:${min}`;
      }
      // Fallback: return as-is
      return val;
    };

    start_date = normalizeDate(start_date);
    end_date = normalizeDate(end_date);

    // Basic sanity: if both present, ensure end >= start
    if (start_date && end_date) {
      const sd = new Date(start_date);
      const ed = new Date(end_date);
      if (isNaN(sd.getTime()) || isNaN(ed.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      if (ed < sd) {
        return res
          .status(400)
          .json({ message: "end_date must be after start_date" });
      }
    }

    // Validate event_url if provided
    if (event_url && !/^https?:\/\//i.test(event_url)) {
      return res
        .status(400)
        .json({ message: "event_url must start with http or https" });
    }

    // attachments are optional; if files uploaded, save metadata
    const attachments = (req.files || []).map((f) => ({
      filename: f.filename,
      original_name: f.originalname,
      mime_type: f.mimetype,
      size: f.size,
    }));

    const q = `INSERT INTO events (title, description, venue, start_date, end_date, organizer_id, attachments, event_url)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
    const values = [
      title,
      description || null,
      venue || null,
      start_date,
      end_date || null,
      staffId,
      attachments.length ? JSON.stringify(attachments) : null,
      event_url || null,
    ];
    const { rows } = await pool.query(q, values);

    return res.status(201).json({ message: "Event created", event: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Update event
export async function updateEvent(req, res) {
  try {
    const id = Number(req.params.id);
    const { title, description, venue, start_date, end_date, event_url } =
      req.body;
    const q = `UPDATE events
               SET title = COALESCE($1, title),
                   description = COALESCE($2, description),
                   venue = COALESCE($3, venue),
                   start_date = COALESCE($4, start_date),
                   end_date = COALESCE($5, end_date),
                   event_url = COALESCE($6, event_url),
                   updated_at = NOW()
               WHERE id=$7 RETURNING *`;
    const { rows } = await pool.query(q, [
      title,
      description,
      venue,
      start_date,
      end_date,
      event_url,
      id,
    ]);
    if (!rows.length)
      return res.status(404).json({ message: "Event not found" });
    return res.json({ message: "Event updated", event: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Delete event
export async function deleteEvent(req, res) {
  try {
    const id = Number(req.params.id);
    await pool.query("DELETE FROM events WHERE id=$1", [id]);
    return res.json({ message: "Event deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// List events (public to students and staff)
export async function listEvents(req, res) {
  try {
    const { upcomingOnly, order, limit } = req.query;
    // select created_at so caller can order by creation time
    const cols = "id, title, description, venue, start_date, end_date, attachments, event_url, created_at";
    let q = `SELECT ${cols} FROM events`;
    const parts = [];
    if (upcomingOnly === "true") {
      parts.push("COALESCE(end_date, start_date) >= NOW()");
    }
    if (parts.length) q += " WHERE " + parts.join(" AND ");

    if (order === "latest") q += " ORDER BY created_at DESC";
    else q += " ORDER BY start_date ASC";

    if (limit) {
      const n = Math.max(1, Math.min(200, parseInt(limit, 10) || 0));
      q += ` LIMIT ${n}`;
    }

    const { rows } = await pool.query(q);
    return res.json({ events: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
