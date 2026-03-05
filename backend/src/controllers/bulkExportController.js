import ExcelJS from "exceljs";
import pool from "../config/db.js";
import logger from "../utils/logger.js";

/* =====================================================
   Bulk Data Export Controller
   KAN-25: export files are streamed directly to the
   authenticated response and never written to disk.
   KAN-9:  streaming ExcelJS writer + paginated DB
   fetches keep memory bounded on large datasets.
   password_hash is never selected.
===================================================== */

const BATCH = 1000;

/**
 * Fetches rows from `sql` in pages of BATCH and calls `onRow` for each.
 * `sql` must not already contain LIMIT/OFFSET.
 * `params` are the bind parameters already present in `sql`.
 */
async function streamRows(sql, params, onRow) {
  let offset = 0;
  while (true) {
    const { rows } = await pool.query(
      `${sql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, BATCH, offset],
    );
    for (const row of rows) await onRow(row);
    if (rows.length < BATCH) break;
    offset += BATCH;
  }
}

export const bulkDataExport = async (req, res) => {
  const fileName = `department_backup_${Date.now()}.xlsx`;
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  // Streaming writer — rows are flushed to the HTTP response as they are
  // committed; the entire workbook is never held in memory at once.
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });

  try {
    /* ================= USERS ================= */
    // password_hash is intentionally omitted.
    const usersSheet = workbook.addWorksheet("Users");
    usersSheet.columns = [
      { header: "ID",                    key: "id" },
      { header: "Email",                 key: "email" },
      { header: "Role",                  key: "role" },
      { header: "Verified",              key: "is_verified" },
      { header: "Created At",            key: "created_at" },
      { header: "Profile Details (JSON)", key: "profile_details" },
    ];
    await streamRows(
      `SELECT id, email, role, is_verified, created_at, profile_details
         FROM users
        ORDER BY id`,
      [],
      (row) => usersSheet.addRow({ ...row, profile_details: JSON.stringify(row.profile_details) }).commit(),
    );
    await usersSheet.commit();

    /* ================= PROJECTS ================= */
    const projectsSheet = workbook.addWorksheet("Projects");
    projectsSheet.columns = [
      "id","title","description","team","team_members_count","team_member_names",
      "github_url","mentor_name","academic_year","activity_type","status",
      "verified","verification_status","verification_comment","verified_by",
      "verified_at","created_by","created_at",
    ].map((k) => ({ header: k, key: k }));
    await streamRows(
      `SELECT id, title, description, team, team_members_count, team_member_names,
              github_url, mentor_name, academic_year, activity_type, status,
              verified, verification_status, verification_comment, verified_by,
              verified_at, created_by, created_at
         FROM projects
        ORDER BY id`,
      [],
      (row) => projectsSheet.addRow(row).commit(),
    );
    await projectsSheet.commit();

    /* ================= ACHIEVEMENTS ================= */
    const achievementsSheet = workbook.addWorksheet("Achievements");
    achievementsSheet.columns = [
      "id","user_id","event_id","title","name","date","date_of_award","event_name",
      "activity_type","issuer","position","prize_amount","academic_year",
      "proof_file_id","certificate_file_id","event_photos_file_id","verified",
      "verification_status","verification_comment","verified_by","verified_at","created_at",
    ].map((k) => ({ header: k, key: k }));
    await streamRows(
      `SELECT id, user_id, event_id, title, name, date, date_of_award, event_name,
              activity_type, issuer, position, prize_amount, academic_year,
              proof_file_id, certificate_file_id, event_photos_file_id, verified,
              verification_status, verification_comment, verified_by, verified_at, created_at
         FROM achievements
        ORDER BY id`,
      [],
      (row) => achievementsSheet.addRow(row).commit(),
    );
    await achievementsSheet.commit();

    /* ================= FACULTY PARTICIPATION ================= */
    const participationSheet = workbook.addWorksheet("Faculty_Participation");
    participationSheet.columns = [
      "id","faculty_name","department","type_of_event","mode_of_training","title",
      "start_date","end_date","conducted_by","details","publications_type",
      "claiming_faculty_name","publication_indexing","authors_list","paper_title",
      "journal_name","volume_no","issue_no","page_or_doi","issn_or_isbn",
      "pub_month_year","academic_year","citations_count","paper_url","journal_home_url",
      "publisher","impact_factor","indexed_in_db","full_paper_drive_link",
      "first_page_drive_link","sdg_mapping","joint_publication_with",
      "publication_domain","coauthors_students","proof_file_id","created_by",
      "created_at","updated_at",
    ].map((k) => ({ header: k, key: k }));
    await streamRows(
      `SELECT id, faculty_name, department, type_of_event, mode_of_training, title,
              start_date, end_date, conducted_by, details, publications_type,
              claiming_faculty_name, publication_indexing, authors_list, paper_title,
              journal_name, volume_no, issue_no, page_or_doi, issn_or_isbn,
              pub_month_year, academic_year, citations_count, paper_url, journal_home_url,
              publisher, impact_factor, indexed_in_db, full_paper_drive_link,
              first_page_drive_link, sdg_mapping, joint_publication_with,
              publication_domain, coauthors_students, proof_file_id, created_by,
              created_at, updated_at
         FROM faculty_participations
        ORDER BY id`,
      [],
      (row) => participationSheet.addRow(row).commit(),
    );
    await participationSheet.commit();

    /* ================= FACULTY RESEARCH ================= */
    const researchSheet = workbook.addWorksheet("Faculty_Research");
    researchSheet.columns = [
      "id","faculty_name","funded_type","principal_investigator","team_members",
      "title","agency","current_status","duration","start_date","end_date","amount",
      "proof_file_id","created_by","created_at","updated_at",
    ].map((k) => ({ header: k, key: k }));
    await streamRows(
      `SELECT id, faculty_name, funded_type, principal_investigator, team_members,
              title, agency, current_status, duration, start_date, end_date, amount,
              proof_file_id, created_by, created_at, updated_at
         FROM faculty_research
        ORDER BY id`,
      [],
      (row) => researchSheet.addRow(row).commit(),
    );
    await researchSheet.commit();

    /* ================= FACULTY CONSULTANCY ================= */
    const consultancySheet = workbook.addWorksheet("Faculty_Consultancy");
    consultancySheet.columns = [
      "id","faculty_name","team_members","agency","amount","duration",
      "start_date","end_date","proof_file_id","created_by","created_at","updated_at",
    ].map((k) => ({ header: k, key: k }));
    await streamRows(
      `SELECT id, faculty_name, team_members, agency, amount, duration,
              start_date, end_date, proof_file_id, created_by, created_at, updated_at
         FROM faculty_consultancy
        ORDER BY id`,
      [],
      (row) => consultancySheet.addRow(row).commit(),
    );
    await consultancySheet.commit();

    /* ================= EVENTS ================= */
    const eventsSheet = workbook.addWorksheet("Events");
    eventsSheet.columns = [
      "id","title","description","venue","event_url","start_date","end_date",
      "organizer_id","thumbnail_filename","thumbnail_original_name",
      "thumbnail_mime","thumbnail_size","created_at","updated_at",
    ].map((k) => ({ header: k, key: k }));
    await streamRows(
      `SELECT id, title, description, venue, event_url, start_date, end_date,
              organizer_id, thumbnail_filename, thumbnail_original_name,
              thumbnail_mime, thumbnail_size, created_at, updated_at
         FROM events
        ORDER BY id`,
      [],
      (row) => eventsSheet.addRow(row).commit(),
    );
    await eventsSheet.commit();

    /* ================= STAFF UPLOADS (optional table) ================= */
    try {
      const staffUploadsSheet = workbook.addWorksheet("Staff_Uploads");
      // Fetch one row to discover the column list; avoids SELECT * in the hot path
      const { rows: sample } = await pool.query(
        `SELECT * FROM staff_uploads LIMIT 1`,
      );
      if (sample.length > 0) {
        staffUploadsSheet.columns = Object.keys(sample[0]).map((k) => ({
          header: k,
          key: k,
        }));
        // Re-stream with ORDER BY id (assumes an id column is present)
        await streamRows(
          `SELECT * FROM staff_uploads ORDER BY id`,
          [],
          (row) => {
            staffUploadsSheet.addRow({
              ...row,
              documents: row.documents != null ? JSON.stringify(row.documents) : null,
            }).commit();
          },
        );
      } else {
        staffUploadsSheet.columns = [{ header: "message", key: "message" }];
        staffUploadsSheet.addRow({ message: "No staff uploads data" }).commit();
      }
      await staffUploadsSheet.commit();
    } catch {
      logger.debug("staff_uploads table not found, skipping", { "trace.id": req.correlationId });
    }

    await workbook.commit();
  } catch (error) {
    logger.error("Bulk export failed", { err: error, "trace.id": req.correlationId, "user.id": req.user?.id });
    // Headers already sent via stream — can't send a JSON error response
    if (!res.headersSent) {
      res.status(500).json({ message: "Bulk export failed" });
    } else {
      res.destroy();
    }
  }
};

/* =====================================================
   List Exported Files
   KAN-25: exports are no longer persisted to disk, so
   there are no files to list. Returns an empty array
   for backward compatibility with existing clients.
===================================================== */
export const listBulkExports = async (req, res) => {
  res.json({ files: [] });
};
