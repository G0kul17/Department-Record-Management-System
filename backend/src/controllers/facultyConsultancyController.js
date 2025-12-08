// facultyConsultancyController.js
import pool from "../config/db.js";

// ========== CREATE CONSULTANCY ==========
export const createConsultancy = async (req, res) => {
  try {
    const staffId = req.user.id;

    const {
      faculty_name,
      team_members,
      agency,
      amount,
      duration,
      start_date,
      end_date,
    } = req.body;

    if (!agency) {
      return res.status(400).json({ message: "Agency is required" });
    }

    let proofFileId = null;

    // Save file into project_files
    if (req.file) {
      const file = req.file;

      const qFile = `
        INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by)
        VALUES (NULL, $1, $2, $3, $4, 'faculty_consultancy_proof', $5)
        RETURNING id`;

      const fileR = await pool.query(qFile, [
        file.filename,
        file.originalname,
        file.mimetype,
        file.size,
        staffId,
      ]);

      proofFileId = fileR.rows[0].id;
    }

    const q = `
      INSERT INTO faculty_consultancy
      (faculty_name, team_members, agency, amount, duration, start_date, end_date, proof_file_id, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`;

    const values = [
      faculty_name || null,
      team_members || null,
      agency,
      amount || null,
      duration || null,
      start_date || null,
      end_date || null,
      proofFileId,
      staffId,
    ];

    const { rows } = await pool.query(q, values);

    return res
      .status(201)
      .json({ message: "Faculty consultancy added", data: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ========== UPDATE CONSULTANCY ==========
export const updateConsultancy = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      faculty_name,
      team_members,
      agency,
      amount,
      duration,
      start_date,
      end_date,
    } = req.body;

    let proofFileId = null;

    if (req.file) {
      const file = req.file;

      const qFile = `
        INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by)
        VALUES (NULL, $1, $2, $3, $4, 'faculty_consultancy_proof', $5)
        RETURNING id`;

      const fileR = await pool.query(qFile, [
        file.filename,
        file.originalname,
        file.mimetype,
        file.size,
        req.user.id,
      ]);

      proofFileId = fileR.rows[0].id;
    }

    const q = `
      UPDATE faculty_consultancy
      SET faculty_name = COALESCE($1, faculty_name),
          team_members = COALESCE($2, team_members),
          agency = COALESCE($3, agency),
          amount = COALESCE($4, amount),
          duration = COALESCE($5, duration),
          start_date = COALESCE($6, start_date),
          end_date = COALESCE($7, end_date),
          proof_file_id = COALESCE($8, proof_file_id),
          updated_at = NOW()
      WHERE id=$9
      RETURNING *`;

    const { rows } = await pool.query(q, [
      faculty_name,
      team_members,
      agency,
      amount,
      duration,
      start_date,
      end_date,
      proofFileId,
      id,
    ]);

    if (!rows.length)
      return res.status(404).json({ message: "Consultancy record not found" });

    return res.json({ message: "Updated successfully", data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ========== DELETE CONSULTANCY ==========
export const deleteConsultancy = async (req, res) => {
  try {
    const id = Number(req.params.id);

    await pool.query("DELETE FROM faculty_consultancy WHERE id=$1", [id]);

    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ========== LIST CONSULTANCY ==========
export const listConsultancy = async (req, res) => {
  try {
    const q = `
      SELECT fc.*, pf.filename AS proof_filename, pf.original_name AS proof_original_name
      FROM faculty_consultancy fc
      LEFT JOIN project_files pf ON fc.proof_file_id = pf.id
      ORDER BY fc.created_at DESC`;

    const { rows } = await pool.query(q);

    return res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
