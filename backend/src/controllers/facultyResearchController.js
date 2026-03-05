// facultyResearchController.js
import fs from "fs";
import path from "path";
import pool from "../config/db.js";
import { STORAGE_PATH } from "../config/upload.js";
import logger from "../utils/logger.js";

// ========== CREATE RESEARCH ==========
export const createResearch = async (req, res) => {
  try {
    const staffId = req.user.id;

    const {
      faculty_name,
      funded_type,
      principal_investigator,
      team_members,
      team_member_names,
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

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let proofFileId = null;
      if (req.file) {
        const file = req.file;
        const qFile = `
          INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by)
          VALUES (NULL, $1, $2, $3, $4, 'faculty_research_proof', $5)
          RETURNING id`;
        const fileR = await client.query(qFile, [
          file.filename, file.originalname, file.mimetype, file.size, staffId,
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
        (team_members && String(team_members).trim()) ||
          (team_member_names && String(team_member_names).trim()) ||
          null,
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

      const { rows } = await client.query(q, values);

      await client.query("COMMIT");
      return res
        .status(201)
        .json({ message: "Faculty research added", data: rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error("Faculty research controller error", { err, "trace.id": req.correlationId, "user.id": req.user?.id });
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
      team_member_names,
      title,
      agency,
      current_status,
      duration,
      start_date,
      end_date,
      amount,
    } = req.body;

    const client = await pool.connect();
    let oldFileFilename = null;
    let oldFileId = null;
    try {
      await client.query("BEGIN");

      // Fetch the existing proof file before any changes
      if (req.file) {
        const { rows: existing } = await client.query(
          `SELECT fr.proof_file_id, pf.filename
             FROM faculty_research fr
             LEFT JOIN project_files pf ON pf.id = fr.proof_file_id
            WHERE fr.id = $1`,
          [id]
        );
        if (existing.length) {
          oldFileId = existing[0].proof_file_id;
          oldFileFilename = existing[0].filename;
        }
      }

      let proofFileId = null;
      if (req.file) {
        const file = req.file;
        const qFile = `
          INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by)
          VALUES (NULL, $1, $2, $3, $4, 'faculty_research_proof', $5)
          RETURNING id`;
        const fileR = await client.query(qFile, [
          file.filename, file.originalname, file.mimetype, file.size, req.user.id,
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

      const { rows } = await client.query(q, [
        faculty_name,
        funded_type,
        principal_investigator,
        (team_members && String(team_members).trim()) ||
          (team_member_names && String(team_member_names).trim()) ||
          null,
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

      if (!rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Research record not found" });
      }

      // Delete the old project_files row inside the transaction while we still can roll back
      if (oldFileId) {
        await client.query("DELETE FROM project_files WHERE id = $1", [oldFileId]);
      }

      await client.query("COMMIT");

      // Remove old file from disk after the transaction is committed
      if (oldFileFilename) {
        fs.unlink(path.join(STORAGE_PATH, oldFileFilename), (err) => {
          if (err) logger.error("Failed to delete old research proof file", { err });
        });
      }

      return res.json({ message: "Updated successfully", data: rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error("Faculty research controller error", { err, "trace.id": req.correlationId, "user.id": req.user?.id });
    res.status(500).json({ message: "Server error" });
  }
};

// ========== DELETE RESEARCH ==========
export const deleteResearch = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const { rowCount } = await pool.query(
      "DELETE FROM faculty_research WHERE id=$1 AND (created_by=$2 OR $3='admin')",
      [id, userId, userRole],
    );

    if (rowCount === 0) {
      const { rows } = await pool.query("SELECT id FROM faculty_research WHERE id=$1", [id]);
      if (!rows.length) return res.status(404).json({ message: "Research record not found" });
      return res.status(403).json({ message: "Forbidden: you do not own this record" });
    }

    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    logger.error("Faculty research controller error", { err, "trace.id": req.correlationId, "user.id": req.user?.id });
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
    logger.error("Faculty research controller error", { err, "trace.id": req.correlationId, "user.id": req.user?.id });
    res.status(500).json({ message: "Server error" });
  }
};

// ========== COUNT RESEARCH ==========
export const getFacultyResearchCount = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM faculty_research"
    );
    return res.json({ count: rows[0]?.count ?? 0 });
  } catch (err) {
    logger.error("Faculty research controller error", { err, "trace.id": req.correlationId, "user.id": req.user?.id });
    return res.status(500).json({ message: "Server error" });
  }
};
