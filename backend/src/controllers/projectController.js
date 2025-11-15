// src/controllers/projectController.js
import pool from '../config/db.js';
import { upload } from '../config/upload.js';
import path from 'path';
import fs from 'fs';

// Note: 'upload' is multer instance exported above
// We'll expose middleware usage in routes.

export async function createProject(req, res) {
  // route expects multipart/form-data with possible files
  // fields: title, description, mentor_id, academic_year, status, team_members (comma separated user ids)
  try {
    const { title, description, mentor_id, academic_year, status } = req.body;
    const created_by = req.user?.id;

    if (!title || !mentor_id) return res.status(400).json({ message: 'title and mentor_id required' });

    // duplicate check (title + mentor + year)
    const { rows: dup } = await pool.query(
      'SELECT id FROM projects WHERE title=$1 AND mentor_id=$2 AND academic_year=$3',
      [title.trim(), mentor_id, academic_year || null]
    );
    if (dup.length) return res.status(409).json({ message: 'Project with same title, mentor and year already exists' });

    const { rows } = await pool.query(
      `INSERT INTO projects (title, description, mentor_id, academic_year, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title.trim(), description || null, mentor_id, academic_year || null, status || 'ongoing', created_by || null]
    );
    const project = rows[0];

    // handle uploaded files (if any)
    const files = req.files || []; // multer populates req.files
    for (const f of files) {
      const fileType = detectFileTypeByField(f.fieldname);
      await pool.query(
        `INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [project.id, f.filename, f.originalname, f.mimetype, f.size, fileType, created_by || null]
      );
    }

    return res.status(201).json({ message: 'Project created', project });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function uploadFilesToProject(req, res) {
  // route: POST /projects/:id/files
  try {
    const projectId = Number(req.params.id);
    const projectQ = await pool.query('SELECT id FROM projects WHERE id=$1', [projectId]);
    if (!projectQ.rows.length) return res.status(404).json({ message: 'Project not found' });

    const files = req.files || [];
    for (const f of files) {
      const fileType = detectFileTypeByField(f.fieldname);
      await pool.query(
        `INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [projectId, f.filename, f.originalname, f.mimetype, f.size, fileType, req.user?.id || null]
      );
    }

    return res.json({ message: 'Files uploaded', count: files.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function listProjects(req, res) {
  // optional query filters: year, mentor_id, status, verified
  const { year, mentor_id, status, verified, q, limit = 20, offset = 0 } = req.query;
  try {
    let base = 'SELECT p.*, u.email as mentor_email FROM projects p LEFT JOIN users u ON p.mentor_id = u.id';
    const conditions = [];
    const params = [];

    if (year) { params.push(year); conditions.push(`p.academic_year = $${params.length}`); }
    if (mentor_id) { params.push(mentor_id); conditions.push(`p.mentor_id = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`p.status = $${params.length}`); }
    if (verified !== undefined) { params.push(verified === 'true'); conditions.push(`p.verified = $${params.length}`); }
    if (q) { params.push(`%${q}%`); conditions.push(`(p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`); }

    if (conditions.length) base += ' WHERE ' + conditions.join(' AND ');
    params.push(Number(limit)); params.push(Number(offset));
    base += ` ORDER BY p.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`;

    const { rows } = await pool.query(base, params);
    return res.json({ projects: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function getProjectDetails(req, res) {
  const id = Number(req.params.id);
  try {
    const { rows } = await pool.query(
      `SELECT p.*, u.email as mentor_email, creator.email as created_by_email
       FROM projects p 
       LEFT JOIN users u ON p.mentor_id = u.id
       LEFT JOIN users creator ON p.created_by = creator.id
       WHERE p.id = $1`, [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    const project = rows[0];
    const { rows: files } = await pool.query('SELECT * FROM project_files WHERE project_id=$1', [id]);

    project.files = files;
    return res.json({ project });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function verifyProject(req, res) {
  // Admin verifies a project
  try {
    const id = Number(req.params.id);
    await pool.query('UPDATE projects SET verified = true WHERE id=$1', [id]);
    return res.json({ message: 'Project verified' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

function detectFileTypeByField(fieldname) {
  // fieldnames expected like: srs, ppt, paper, code, portal, other
  if (!fieldname) return 'other';
  if (fieldname.toLowerCase().includes('srs')) return 'srs';
  if (fieldname.toLowerCase().includes('ppt')) return 'ppt';
  if (fieldname.toLowerCase().includes('paper')) return 'paper';
  if (fieldname.toLowerCase().includes('code') || fieldname.toLowerCase().includes('zip')) return 'code_zip';
  if (fieldname.toLowerCase().includes('portal')) return 'portal';
  return 'other';
}
