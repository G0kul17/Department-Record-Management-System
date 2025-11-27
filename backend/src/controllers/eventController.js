// eventController.js
import pool from '../config/db.js';
import { upload } from '../config/upload.js';

// Create event (staff/admin)
export async function createEvent(req, res) {
  try {
    const staffId = req.user.id;
    const { title, description, venue, start_date, end_date } = req.body;

    if (!title || !start_date) return res.status(400).json({ message: 'title and start_date required' });

    // attachments are optional; if files uploaded, save metadata
    const attachments = (req.files || []).map(f => ({
      filename: f.filename,
      original_name: f.originalname,
      mime_type: f.mimetype,
      size: f.size
    }));

    const q = `INSERT INTO events (title, description, venue, start_date, end_date, organizer_id, attachments)
               VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
    const values = [title, description || null, venue || null, start_date, end_date || null, staffId, attachments.length ? JSON.stringify(attachments) : null];
    const { rows } = await pool.query(q, values);

    return res.status(201).json({ message: 'Event created', event: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Update event
export async function updateEvent(req, res) {
  try {
    const id = Number(req.params.id);
    const { title, description, venue, start_date, end_date } = req.body;
    const q = `UPDATE events
               SET title = COALESCE($1, title),
                   description = COALESCE($2, description),
                   venue = COALESCE($3, venue),
                   start_date = COALESCE($4, start_date),
                   end_date = COALESCE($5, end_date),
                   updated_at = NOW()
               WHERE id=$6 RETURNING *`;
    const { rows } = await pool.query(q, [title, description, venue, start_date, end_date, id]);
    if (!rows.length) return res.status(404).json({ message: 'Event not found' });
    return res.json({ message: 'Event updated', event: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Delete event
export async function deleteEvent(req, res) {
  try {
    const id = Number(req.params.id);
    await pool.query('DELETE FROM events WHERE id=$1', [id]);
    return res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// List events (public to students and staff)
export async function listEvents(req, res) {
  try {
    const { upcomingOnly } = req.query;
    let q = 'SELECT id, title, description, venue, start_date, end_date, attachments FROM events';
    if (upcomingOnly === 'true') {
      q += ' WHERE start_date >= NOW()';
    }
    q += ' ORDER BY start_date ASC';
    const { rows } = await pool.query(q);
    return res.json({ events: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}
