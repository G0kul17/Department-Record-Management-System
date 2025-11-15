// src/controllers/achievementController.js
import pool from '../config/db.js';

// create achievement (students)
export async function createAchievement(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { title, issuer, date_of_award, post_to_community } = req.body;
    if (!title) return res.status(400).json({ message: 'title required' });

    // optional file proof (expect single file field 'proof')
    let proofFileId = null;
    if (req.file) {
      const f = req.file;
      const q = `INSERT INTO project_files (filename, original_name, mime_type, size, file_type, uploaded_by)
                 VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`;
      const fileType = 'proof';
      const { rows } = await pool.query(q, [f.filename, f.originalname, f.mimetype, f.size, fileType, userId]);
      proofFileId = rows[0].id;
    }

    // duplicate check for same user
    const { rows: dup } = await pool.query(
      'SELECT id FROM achievements WHERE user_id=$1 AND title=$2 AND date_of_award=$3',
      [userId, title.trim(), date_of_award || null]
    );
    if (dup.length) return res.status(409).json({ message: 'Duplicate achievement' });

    const { rows } = await pool.query(
      `INSERT INTO achievements (user_id, title, issuer, date_of_award, proof_file_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, title.trim(), issuer || null, date_of_award || null, proofFileId]
    );

    // optional: auto-post to community if requested (left as TODO; integrate with posts endpoint)
    if (post_to_community === 'true') {
      // TODO: insert into posts table referencing achievement id
    }

    return res.status(201).json({ message: 'Achievement created', achievement: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function listAchievements(req, res) {
  const { user_id, verified, q, limit = 20, offset = 0 } = req.query;
  try {
    let base = `SELECT a.*, u.email as user_email, pf.original_name as proof_name
                FROM achievements a LEFT JOIN users u ON a.user_id=u.id
                LEFT JOIN project_files pf ON a.proof_file_id = pf.id`;
    const cond = [];
    const params = [];

    if (user_id) { params.push(user_id); cond.push(`a.user_id=$${params.length}`); }
    if (verified !== undefined) { params.push(verified === 'true'); cond.push(`a.verified=$${params.length}`); }
    if (q) { params.push(`%${q}%`); cond.push(`(a.title ILIKE $${params.length} OR a.issuer ILIKE $${params.length})`); }

    if (cond.length) base += ' WHERE ' + cond.join(' AND ');
    params.push(Number(limit)); params.push(Number(offset));
    base += ` ORDER BY a.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`;

    const { rows } = await pool.query(base, params);
    return res.json({ achievements: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function verifyAchievement(req, res) {
  try {
    const id = Number(req.params.id);
    await pool.query('UPDATE achievements SET verified = true WHERE id=$1', [id]);
    return res.json({ message: 'Achievement verified' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}
