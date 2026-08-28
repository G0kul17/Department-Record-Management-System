// facultyParticipationController.js
import pool from "../config/db.js";
import path from "path";
import fs from "fs";
import logger, { reqContext } from "../utils/logger.js";
import { tracedQuery } from "../utils/tracing.js";

// ========== CREATE PARTICIPATION ==========
export const createFacultyParticipation = async (req, res) => {
  try {
    const staffId = req.user.id;
    const {
      faculty_name,
      department,
      type_of_event,
      publications_type,
      mode_of_training,
      title,
      start_date,
      end_date,
      duration,
      conducted_by,
      details,
      // Publications fields (optional unless type_of_event === 'Others')
      claiming_faculty_name,
      publication_indexing,
      authors_list,
      paper_title,
      journal_name,
      volume_no,
      issue_no,
      page_or_doi,
      issn_or_isbn,
      pub_month_year,
      citations_count,
      paper_url,
      journal_home_url,
      publisher,
      impact_factor,
      indexed_in_db,
      full_paper_drive_link,
      first_page_drive_link,
      sdg_mapping,
      joint_publication_with,
      publication_domain,
      coauthors_students,
    } = req.body;

    if (
      !faculty_name ||
      !department ||
      !type_of_event ||
      !mode_of_training ||
      !title ||
      !start_date
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // If Publications entry, ensure publications_type is provided
    if (type_of_event === "Others" && !publications_type) {
      return res
        .status(400)
        .json({
          message: "publications_type is required for Publications entries",
        });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let proofFileId = null;
      if (req.file) {
        const file = req.file;
        const insertFileQ = `
          INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by)
          VALUES (NULL, $1, $2, $3, $4, 'faculty_proof', $5)
          RETURNING id`;
        const fileR = await tracedQuery(client, insertFileQ, [
          file.filename, file.originalname, file.mimetype, file.size, staffId,
        ]);
        proofFileId = fileR.rows[0].id;
      }

      const q = `
        INSERT INTO faculty_participations
      (faculty_name, department, type_of_event, publications_type, mode_of_training,
       title, start_date, end_date, duration, conducted_by, details,
       claiming_faculty_name, publication_indexing, authors_list, paper_title, journal_name,
       volume_no, issue_no, page_or_doi, issn_or_isbn, pub_month_year,
       citations_count, paper_url, journal_home_url, publisher, impact_factor,
       indexed_in_db, full_paper_drive_link, first_page_drive_link, sdg_mapping, joint_publication_with,
       publication_domain, coauthors_students,
       proof_file_id, created_by)
      VALUES ($1,$2,$3,$4,$5,
              $6,$7,$8,$9,$10,$11,
              $12,$13,$14,$15,$16,
              $17,$18,$19,$20,$21,
              $22,$23,$24,$25,$26,
              $27,$28,$29,$30,$31,
              $32,$33,
              $34,$35)
      RETURNING *`;

    const values = [
      faculty_name,
      department,
      type_of_event,
      publications_type || null,
      mode_of_training,
      title,
      start_date,
      end_date || null,
      duration || null,
      conducted_by || null,
      details || null,
      claiming_faculty_name || null,
      publication_indexing || null,
      authors_list || null,
      paper_title || null,
      journal_name || null,
      volume_no || null,
      issue_no || null,
      page_or_doi || null,
      issn_or_isbn || null,
      pub_month_year || null,
      citations_count !== undefined &&
      citations_count !== null &&
      citations_count !== ""
        ? Number(citations_count)
        : null,
      paper_url || null,
      journal_home_url || null,
      publisher || null,
      impact_factor !== undefined &&
      impact_factor !== null &&
      impact_factor !== ""
        ? Number(impact_factor)
        : null,
      indexed_in_db || null,
      full_paper_drive_link || null,
      first_page_drive_link || null,
      sdg_mapping || null,
      joint_publication_with || null,
      publication_domain || null,
      coauthors_students || null,
      proofFileId,
      staffId,
    ];

      const { rows } = await tracedQuery(client, q, values);

      await client.query("COMMIT");
      return res
        .status(201)
        .json({ message: "Faculty participation added", data: rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) logger.error("Failed to delete orphaned file", { unlinkErr, file: req.file.path });
        });
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error("Faculty participation controller error", { err,
      ...reqContext(req) });
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
      publications_type,
      mode_of_training,
      title,
      start_date,
      end_date,
      duration,
      conducted_by,
      details,
      // Publications fields
      claiming_faculty_name,
      publication_indexing,
      authors_list,
      paper_title,
      journal_name,
      volume_no,
      issue_no,
      page_or_doi,
      issn_or_isbn,
      pub_month_year,
      citations_count,
      paper_url,
      journal_home_url,
      publisher,
      impact_factor,
      indexed_in_db,
      full_paper_drive_link,
      first_page_drive_link,
      sdg_mapping,
      joint_publication_with,
      publication_domain,
      coauthors_students,
    } = req.body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let proofFileId = null;
      if (req.file) {
        const file = req.file;
        const qFile = `
          INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by)
          VALUES (NULL, $1, $2, $3, $4, 'faculty_proof', $5)
          RETURNING id`;
        const { rows: fileRows } = await tracedQuery(client, qFile, [
          file.filename, file.originalname, file.mimetype, file.size, req.user.id,
        ]);
        proofFileId = fileRows[0].id;
      }

      const q = `
        UPDATE faculty_participations
      SET faculty_name = COALESCE($1, faculty_name),
          department = COALESCE($2, department),
          type_of_event = COALESCE($3, type_of_event),
          publications_type = COALESCE($4, publications_type),
          mode_of_training = COALESCE($5, mode_of_training),
          title = COALESCE($6, title),
          start_date = COALESCE($7, start_date),
          end_date = COALESCE($8, end_date),
          duration = COALESCE($9, duration),
          conducted_by = COALESCE($10, conducted_by),
          details = COALESCE($11, details),
          claiming_faculty_name = COALESCE($12, claiming_faculty_name),
          publication_indexing = COALESCE($13, publication_indexing),
          authors_list = COALESCE($14, authors_list),
          paper_title = COALESCE($15, paper_title),
          journal_name = COALESCE($16, journal_name),
          volume_no = COALESCE($17, volume_no),
          issue_no = COALESCE($18, issue_no),
          page_or_doi = COALESCE($19, page_or_doi),
          issn_or_isbn = COALESCE($20, issn_or_isbn),
          pub_month_year = COALESCE($21, pub_month_year),
          citations_count = COALESCE($22, citations_count),
          paper_url = COALESCE($23, paper_url),
          journal_home_url = COALESCE($24, journal_home_url),
          publisher = COALESCE($25, publisher),
          impact_factor = COALESCE($26, impact_factor),
          indexed_in_db = COALESCE($27, indexed_in_db),
          full_paper_drive_link = COALESCE($28, full_paper_drive_link),
          first_page_drive_link = COALESCE($29, first_page_drive_link),
          sdg_mapping = COALESCE($30, sdg_mapping),
          joint_publication_with = COALESCE($31, joint_publication_with),
          publication_domain = COALESCE($32, publication_domain),
          coauthors_students = COALESCE($33, coauthors_students),
          proof_file_id = COALESCE($34, proof_file_id),
          updated_at = NOW()
      WHERE id=$35
      RETURNING *`;

      const { rows } = await tracedQuery(client, q, [
        faculty_name,
        department,
        type_of_event,
        publications_type,
        mode_of_training,
        title,
        start_date,
        end_date,
        duration,
        conducted_by,
        details,
        claiming_faculty_name,
        publication_indexing,
        authors_list,
        paper_title,
        journal_name,
        volume_no,
        issue_no,
        page_or_doi,
        issn_or_isbn,
        pub_month_year,
        citations_count !== undefined &&
        citations_count !== null &&
        citations_count !== ""
          ? Number(citations_count)
          : null,
        paper_url,
        journal_home_url,
        publisher,
        impact_factor !== undefined &&
        impact_factor !== null &&
        impact_factor !== ""
          ? Number(impact_factor)
          : null,
        indexed_in_db,
        full_paper_drive_link,
        first_page_drive_link,
        sdg_mapping,
        joint_publication_with,
        publication_domain,
        coauthors_students,
        proofFileId,
        id,
      ]);

      if (!rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Participation not found" });
      }

      await client.query("COMMIT");
      return res.json({ message: "Updated successfully", data: rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error("Faculty participation controller error", { err,
      ...reqContext(req) });
    res.status(500).json({ message: "Server error" });
  }
};

// ========== DELETE PARTICIPATION ==========
export const deleteFacultyParticipation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const { rowCount } = await tracedQuery(pool, 
      "DELETE FROM faculty_participations WHERE id=$1 AND (created_by=$2 OR $3='admin')",
      [id, userId, userRole],
    );

    if (rowCount === 0) {
      const { rows } = await tracedQuery(pool, "SELECT id FROM faculty_participations WHERE id=$1", [id]);
      if (!rows.length) return res.status(404).json({ message: "Participation not found" });
      return res.status(403).json({ message: "Forbidden: you do not own this record" });
    }

    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    logger.error("Faculty participation controller error", { err,
      ...reqContext(req) });
    res.status(500).json({ message: "Server error" });
  }
};

// ========== LIST PARTICIPATIONS ==========
export const listFacultyParticipations = async (req, res) => {
  try {
     const { limit = 10, offset = 0, q = "", year } = req.query;
    const searchTerm = q ? `%${q}%` : null;

    let query = `
      SELECT fp.*, pf.filename AS proof_filename, pf.original_name AS proof_original_name
      FROM faculty_participations fp
      LEFT JOIN project_files pf ON fp.proof_file_id = pf.id`;
    
    let countQuery = `SELECT COUNT(*) FROM faculty_participations fp`;
    let params = [];
    let countParams = [];
      let conditions = [];

    if (searchTerm) {
      const idx = params.length + 1;
      conditions.push(`(
        fp.faculty_name ILIKE $${idx} OR 
        fp.title ILIKE $${idx} OR 
        fp.department ILIKE $${idx} OR 
        fp.type_of_event ILIKE $${idx}
      )`);
      params.push(searchTerm);
      countParams.push(searchTerm);
    }
    
    if (year) {
      const yearRaw = String(year).trim();
      const startYear4 = yearRaw.match(/\d{4}/)?.[0];
      const startYear2 = startYear4 ? startYear4.slice(-2) : null;
      const endYear2 = startYear4 ? String(parseInt(startYear4) + 1).slice(-2) : null;
      
      const clauses = [];

      // Exact match variations for academic_year field
      params.push(yearRaw);
      countParams.push(yearRaw);
      clauses.push(`fp.academic_year = $${params.length}`);

      if (startYear4) {
        // Match patterns like "2025-2026" or "2025-26"
        const nextYear = String(parseInt(startYear4) + 1);
        params.push(`${startYear4}-${nextYear}`);
        countParams.push(`${startYear4}-${nextYear}`);
        clauses.push(`fp.academic_year = $${params.length}`);
        
        if (startYear2 && endYear2) {
          params.push(`${startYear2}-${endYear2}`);
          countParams.push(`${startYear2}-${endYear2}`);
          clauses.push(`fp.academic_year = $${params.length}`);
        }
        
        // Fallback to date fields only if academic_year is NULL/empty
        params.push(startYear4);
        countParams.push(startYear4);
        clauses.push(`(fp.academic_year IS NULL AND to_char(fp.start_date, 'YYYY') = $${params.length})`);

        params.push(startYear4);
        countParams.push(startYear4);
        clauses.push(`(fp.academic_year IS NULL AND to_char(fp.end_date, 'YYYY') = $${params.length})`);

        params.push(`%${startYear4}%`);
        countParams.push(`%${startYear4}%`);
        clauses.push(`(fp.academic_year IS NULL AND fp.pub_month_year ILIKE $${params.length})`);

        params.push(startYear4);
        countParams.push(startYear4);
        clauses.push(`(fp.academic_year IS NULL AND to_char(fp.created_at, 'YYYY') = $${params.length})`);
      }

      conditions.push(`(${clauses.join(" OR ")})`);
    }

    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY fp.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));

    const [dataResult, countResult] = await Promise.all([
      tracedQuery(pool, query, params),
      tracedQuery(pool, countQuery, countParams)
    ]);

    return res.json({ 
      participation: dataResult.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (err) {
    logger.error("Faculty participation controller error", { err,
      ...reqContext(req) });
    res.status(500).json({ message: "Server error" });
  }
};

// ========== COUNT PARTICIPATIONS ==========
export const getFacultyParticipationsCount = async (req, res) => {
  try {
    const { rows } = await tracedQuery(pool, 
      "SELECT COUNT(*)::int AS count FROM faculty_participations"
    );
    return res.json({ count: rows[0]?.count ?? 0 });
  } catch (err) {
    logger.error("Faculty participation controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
};

// ========== FACULTY EVENT TYPES MANAGEMENT ==========
export const getFacultyEventTypes = async (req, res) => {
  try {
    const { rows } = await tracedQuery(
      pool,
      `SELECT name FROM faculty_event_types WHERE is_active = TRUE ORDER BY LOWER(name)`
    );
    return res.json({ eventTypes: rows.map((r) => r.name) });
  } catch (err) {
    logger.error("Faculty participation controller error", {
      err,
      ...reqContext(req),
    });
    return res.status(500).json({ message: "Server error" });
  }
};

export const createFacultyEventType = async (req, res) => {
  const { name } = req.body || {};
  const eventName = typeof name === "string" ? name.trim() : "";

  if (!eventName) {
    return res.status(400).json({ message: "name is required" });
  }

  try {
    const existing = await tracedQuery(
      pool,
      `SELECT id, name, is_active FROM faculty_event_types WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1`,
      [eventName]
    );

    if (existing.rows.length) {
      const row = existing.rows[0];
      if (row.is_active) {
        return res.status(409).json({ message: "Faculty event type already exists" });
      }

      const reactivated = await tracedQuery(
        pool,
        `UPDATE faculty_event_types SET is_active = TRUE WHERE id = $1 RETURNING id, name, created_at`,
        [row.id]
      );
      return res.status(200).json({ eventType: reactivated.rows[0] });
    }

    const { rows } = await tracedQuery(
      pool,
      `INSERT INTO faculty_event_types (name) VALUES ($1) RETURNING id, name, created_at`,
      [eventName]
    );
    return res.status(201).json({ eventType: rows[0] });
  } catch (err) {
    if (err?.code === "23505") {
      return res.status(409).json({ message: "Faculty event type already exists" });
    }
    logger.error("Faculty participation controller error", {
      err,
      ...reqContext(req),
    });
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteFacultyEventType = async (req, res) => {
  const rawName = req.params?.name || "";
  const eventName = decodeURIComponent(rawName).trim();

  if (!eventName) {
    return res.status(400).json({ message: "name is required" });
  }

  try {
    const result = await tracedQuery(
      pool,
      `UPDATE faculty_event_types SET is_active = FALSE WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) RETURNING id, name`,
      [eventName]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Faculty event type not found" });
    }

    return res.json({ message: "Faculty event type deleted", name: result.rows[0].name });
  } catch (err) {
    logger.error("Faculty participation controller error", {
      err,
      ...reqContext(req),
    });
    return res.status(500).json({ message: "Server error" });
  }
};
