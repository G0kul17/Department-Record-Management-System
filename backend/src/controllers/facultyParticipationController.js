// facultyParticipationController.js
import pool from "../config/db.js";
import path from "path";
import fs from "fs";

// ========== CREATE PARTICIPATION ==========
export const createFacultyParticipation = async (req, res) => {
  try {
    const staffId = req.user.id;
    const {
      faculty_name,
      department,
      type_of_event,
      mode_of_training,
      title,
      start_date,
      end_date,
      conducted_by,
      details
    } = req.body;

    if (!faculty_name || !department || !type_of_event || !mode_of_training || !title || !start_date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Save proof file via project_files table
    let proofFileId = null;

    if (req.file) {
      const file = req.file;
      const insertFileQ = `
        INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by)
        VALUES (NULL, $1, $2, $3, $4, 'faculty_proof', $5)
        RETURNING id`;
      const fileR = await pool.query(insertFileQ, [
        file.filename,
        file.originalname,
        file.mimetype,
        file.size,
        staffId
      ]);
      proofFileId = fileR.rows[0].id;
    }

    const q = `
      INSERT INTO faculty_participations
      (faculty_name, department, type_of_event, mode_of_training,
       title, start_date, end_date, conducted_by, details,
       proof_file_id, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`;

    const values = [
      faculty_name,
      department,
      type_of_event,
      mode_of_training,
      title,
      start_date,
      end_date || null,
      conducted_by || null,
      details || null,
      proofFileId,
      staffId
    ];

    const { rows } = await pool.query(q, values);
    return res.status(201).json({ message: "Faculty participation added", data: rows[0] });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};


// ========== UPDATE PARTICIPATION ==========
export const updateFacultyParticipation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      faculty_name,
      department,
      type_of_event,
      mode_of_training,
      title,
      start_date,
      end_date,
      conducted_by,
      details
    } = req.body;

    let proofFileId = null;

    if (req.file) {
      const file = req.file;

      const qFile = `
        INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by)
        VALUES (NULL, $1, $2, $3, $4, 'faculty_proof', $5)
        RETURNING id`;
      const { rows: fileRows } = await pool.query(qFile, [
        file.filename,
        file.originalname,
        file.mimetype,
        file.size,
        req.user.id
      ]);

      proofFileId = fileRows[0].id;
    }

    const q = `
      UPDATE faculty_participations
      SET faculty_name = COALESCE($1, faculty_name),
          department = COALESCE($2, department),
          type_of_event = COALESCE($3, type_of_event),
          mode_of_training = COALESCE($4, mode_of_training),
          title = COALESCE($5, title),
          start_date = COALESCE($6, start_date),
          end_date = COALESCE($7, end_date),
          conducted_by = COALESCE($8, conducted_by),
          details = COALESCE($9, details),
          proof_file_id = COALESCE($10, proof_file_id),
          updated_at = NOW()
      WHERE id=$11
      RETURNING *`;

    const { rows } = await pool.query(q, [
      faculty_name,
      department,
      type_of_event,
      mode_of_training,
      title,
      start_date,
      end_date,
      conducted_by,
      details,
      proofFileId,
      id
    ]);

    if (!rows.length) return res.status(404).json({ message: "Participation not found" });

    return res.json({ message: "Updated successfully", data: rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// ========== DELETE PARTICIPATION ==========
export const deleteFacultyParticipation = async (req, res) => {
  try {
    const id = Number(req.params.id);

    await pool.query("DELETE FROM faculty_participations WHERE id=$1", [id]);
    return res.json({ message: "Deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// ========== LIST PARTICIPATIONS ==========
export const listFacultyParticipations = async (req, res) => {
  try {
    const q = `
      SELECT fp.*, pf.filename AS proof_filename, pf.original_name AS proof_original_name
      FROM faculty_participations fp
      LEFT JOIN project_files pf ON fp.proof_file_id = pf.id
      ORDER BY fp.created_at DESC`;

    const { rows } = await pool.query(q);
    return res.json({ data: rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
