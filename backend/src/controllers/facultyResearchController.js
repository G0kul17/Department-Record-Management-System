// facultyResearchController.js
import pool from "../config/db.js";

// ========== CREATE RESEARCH ==========
export const createResearch = async (req, res) => {
  try {
    const staffId = req.user.id;

    const {
      faculty_name,
      funded_type,
      principal_investigator,
      team_members,
      title,
      agency,
      current_status,
      duration,
      start_date,
      end_date,
      amount,
    } = req.body;

    if (!funded_type || !principal_investigator || !title || !current_status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let proofFileId = null;

    // Save proof file metadata in project_files
    if (req.file) {
      const file = req.file;

      const qFile = `
        INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by)
        VALUES (NULL, $1, $2, $3, $4, 'faculty_research_proof', $5)
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
      INSERT INTO faculty_research
      (faculty_name, funded_type, principal_investigator, team_members, title,
       agency, current_status, duration, start_date, end_date, amount,
       proof_file_id, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`;

    const values = [
      faculty_name || null,
      funded_type,
      principal_investigator,
      team_members || null,
      title,
      agency || null,
      current_status,
      duration || null,
      start_date || null,
      end_date || null,
      amount || null,
      proofFileId,
      staffId,
    ];

    const { rows } = await pool.query(q, values);

    return res
      .status(201)
      .json({ message: "Faculty research added", data: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ========== UPDATE RESEARCH ==========
export const updateResearch = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      faculty_name,
      funded_type,
      principal_investigator,
      team_members,
      title,
      agency,
      current_status,
      duration,
      start_date,
      end_date,
      amount,
    } = req.body;

    let proofFileId = null;

    if (req.file) {
      const file = req.file;

      const qFile = `
        INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by)
        VALUES (NULL, $1, $2, $3, $4, 'faculty_research_proof', $5)
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
      UPDATE faculty_research
      SET faculty_name = COALESCE($1, faculty_name),
          funded_type = COALESCE($2, funded_type),
          principal_investigator = COALESCE($3, principal_investigator),
          team_members = COALESCE($4, team_members),
          title = COALESCE($5, title),
          agency = COALESCE($6, agency),
          current_status = COALESCE($7, current_status),
          duration = COALESCE($8, duration),
          start_date = COALESCE($9, start_date),
          end_date = COALESCE($10, end_date),
          amount = COALESCE($11, amount),
          proof_file_id = COALESCE($12, proof_file_id),
          updated_at = NOW()
      WHERE id=$13
      RETURNING *`;

    const { rows } = await pool.query(q, [
      faculty_name,
      funded_type,
      principal_investigator,
      team_members,
      title,
      agency,
      current_status,
      duration,
      start_date,
      end_date,
      amount,
      proofFileId,
      id,
    ]);

    if (!rows.length)
      return res.status(404).json({ message: "Research record not found" });

    return res.json({ message: "Updated successfully", data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ========== DELETE RESEARCH ==========
export const deleteResearch = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await pool.query("DELETE FROM faculty_research WHERE id=$1", [id]);
    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ========== LIST RESEARCH ==========
export const listResearch = async (req, res) => {
  try {
    const q = `
      SELECT fr.*, pf.filename AS proof_filename, pf.original_name AS proof_original_name
      FROM faculty_research fr
      LEFT JOIN project_files pf ON fr.proof_file_id = pf.id
      ORDER BY fr.created_at DESC`;

    const { rows } = await pool.query(q);

    return res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
