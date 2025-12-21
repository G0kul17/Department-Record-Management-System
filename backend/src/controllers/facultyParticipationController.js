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
      publications_type,
      mode_of_training,
      title,
      start_date,
      end_date,
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
        staffId,
      ]);
      proofFileId = fileR.rows[0].id;
    }

    const q = `
      INSERT INTO faculty_participations
      (faculty_name, department, type_of_event, publications_type, mode_of_training,
       title, start_date, end_date, conducted_by, details,
       claiming_faculty_name, publication_indexing, authors_list, paper_title, journal_name,
       volume_no, issue_no, page_or_doi, issn_or_isbn, pub_month_year,
       citations_count, paper_url, journal_home_url, publisher, impact_factor,
       indexed_in_db, full_paper_drive_link, first_page_drive_link, sdg_mapping, joint_publication_with,
       publication_domain, coauthors_students,
       proof_file_id, created_by)
      VALUES ($1,$2,$3,$4,$5,
              $6,$7,$8,$9,$10,
              $11,$12,$13,$14,$15,
              $16,$17,$18,$19,$20,
              $21,$22,$23,$24,$25,
              $26,$27,$28,$29,$30,
              $31,$32,
              $33,$34)
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

    const { rows } = await pool.query(q, values);
    return res
      .status(201)
      .json({ message: "Faculty participation added", data: rows[0] });
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
      publications_type,
      mode_of_training,
      title,
      start_date,
      end_date,
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
        req.user.id,
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
          conducted_by = COALESCE($9, conducted_by),
          details = COALESCE($10, details),
          claiming_faculty_name = COALESCE($11, claiming_faculty_name),
          publication_indexing = COALESCE($12, publication_indexing),
          authors_list = COALESCE($13, authors_list),
          paper_title = COALESCE($14, paper_title),
          journal_name = COALESCE($15, journal_name),
          volume_no = COALESCE($16, volume_no),
          issue_no = COALESCE($17, issue_no),
          page_or_doi = COALESCE($18, page_or_doi),
          issn_or_isbn = COALESCE($19, issn_or_isbn),
          pub_month_year = COALESCE($20, pub_month_year),
          citations_count = COALESCE($21, citations_count),
          paper_url = COALESCE($22, paper_url),
          journal_home_url = COALESCE($23, journal_home_url),
          publisher = COALESCE($24, publisher),
          impact_factor = COALESCE($25, impact_factor),
          indexed_in_db = COALESCE($26, indexed_in_db),
          full_paper_drive_link = COALESCE($27, full_paper_drive_link),
          first_page_drive_link = COALESCE($28, first_page_drive_link),
          sdg_mapping = COALESCE($29, sdg_mapping),
          joint_publication_with = COALESCE($30, joint_publication_with),
          publication_domain = COALESCE($31, publication_domain),
          coauthors_students = COALESCE($32, coauthors_students),
          proof_file_id = COALESCE($33, proof_file_id),
          updated_at = NOW()
      WHERE id=$34
      RETURNING *`;

    const { rows } = await pool.query(q, [
      faculty_name,
      department,
      type_of_event,
      publications_type,
      mode_of_training,
      title,
      start_date,
      end_date,
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

    if (!rows.length)
      return res.status(404).json({ message: "Participation not found" });

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
