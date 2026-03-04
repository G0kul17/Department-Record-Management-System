import ExcelJS from "exceljs";
import pool from "../config/db.js";

/* =====================================================
   Bulk Data Export Controller
   KAN-25: export files are streamed directly to the
   authenticated response and never written to disk,
   eliminating the unauthenticated /exports static route.
===================================================== */

export const bulkDataExport = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();

    /* ================= USERS ================= */
    const usersSheet = workbook.addWorksheet("Users");
    const users = await pool.query(`
      SELECT id, email, role, is_verified, created_at, profile_details
      FROM users
      ORDER BY id
    `);

    usersSheet.columns = [
      { header: "ID", key: "id" },
      { header: "Email", key: "email" },
      { header: "Role", key: "role" },
      { header: "Verified", key: "is_verified" },
      { header: "Created At", key: "created_at" },
      { header: "Profile Details (JSON)", key: "profile_details" },
    ];

    users.rows.forEach((u) =>
      usersSheet.addRow({
        ...u,
        profile_details: JSON.stringify(u.profile_details),
      })
    );

    /* ================= PROJECTS ================= */
    const projectsSheet = workbook.addWorksheet("Projects");
    const projects = await pool.query(`SELECT * FROM projects`);

    projectsSheet.columns = [
      "id","title","description","team","team_members_count","team_member_names",
      "github_url","mentor_name","academic_year","activity_type","status","files",
      "verified","verification_status","verification_comment","verified_by",
      "verified_at","created_by","created_at",
    ].map((k) => ({ header: k, key: k }));

    projects.rows.forEach((p) => projectsSheet.addRow(p));

    /* ================= ACHIEVEMENTS ================= */
    const achievementsSheet = workbook.addWorksheet("Achievements");
    const achievements = await pool.query(`SELECT * FROM achievements`);

    achievementsSheet.columns = [
      "id","user_id","event_id","title","name","date","date_of_award","event_name",
      "activity_type","issuer","position","prize_amount","academic_year",
      "proof_file_id","certificate_file_id","event_photos_file_id","verified",
      "verification_status","verification_comment","verified_by","verified_at","created_at",
    ].map((k) => ({ header: k, key: k }));

    achievements.rows.forEach((a) => achievementsSheet.addRow(a));

    /* ================= FACULTY PARTICIPATION ================= */
    const participationSheet = workbook.addWorksheet("Faculty_Participation");
    const participation = await pool.query(
      `SELECT * FROM faculty_participations`
    );

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

    participation.rows.forEach((p) => participationSheet.addRow(p));

    /* ================= FACULTY RESEARCH ================= */
    const researchSheet = workbook.addWorksheet("Faculty_Research");
    const research = await pool.query(`SELECT * FROM faculty_research`);

    researchSheet.columns = [
      "id","faculty_name","funded_type","principal_investigator","team_members",
      "title","agency","current_status","duration","start_date","end_date","amount",
      "proof_file_id","created_by","created_at","updated_at",
    ].map((k) => ({ header: k, key: k }));

    research.rows.forEach((r) => researchSheet.addRow(r));

    /* ================= FACULTY CONSULTANCY ================= */
    const consultancySheet = workbook.addWorksheet("Faculty_Consultancy");
    const consultancy = await pool.query(`SELECT * FROM faculty_consultancy`);

    consultancySheet.columns = [
      "id","faculty_name","team_members","agency","amount","duration",
      "start_date","end_date","proof_file_id","created_by","created_at","updated_at",
    ].map((k) => ({ header: k, key: k }));

    consultancy.rows.forEach((c) => consultancySheet.addRow(c));

    /* ================= EVENTS ================= */
    const eventsSheet = workbook.addWorksheet("Events");
    const events = await pool.query(`SELECT * FROM events`);

    eventsSheet.columns = [
      "id","title","description","venue","event_url","start_date","end_date",
      "organizer_id","attachments","thumbnail_filename","thumbnail_original_name",
      "thumbnail_mime","thumbnail_size","created_at","updated_at",
    ].map((k) => ({ header: k, key: k }));

    events.rows.forEach((e) => eventsSheet.addRow(e));

    /* ================= STAFF UPLOADS (Optional) ================= */
    try {
      const staffUploadsSheet = workbook.addWorksheet("Staff_Uploads");
      const staffUploads = await pool.query(`SELECT * FROM staff_uploads`);

      if (staffUploads.rows.length > 0) {
        staffUploadsSheet.columns = Object.keys(staffUploads.rows[0]).map(
          (k) => ({
            header: k,
            key: k,
          })
        );

        staffUploads.rows.forEach((s) =>
          staffUploadsSheet.addRow({
            ...s,
            documents: JSON.stringify(s.documents),
          })
        );
      } else {
        staffUploadsSheet.addRow({ message: "No staff uploads data" });
      }
    } catch (err) {
      console.log("staff_uploads table not found, skipping...");
    }

    /* ================= STREAM DIRECTLY TO RESPONSE ================= */
    // The workbook is written straight into the HTTP response stream.
    // No file is ever saved to disk, so there is no persistent URL to
    // guess and no cleanup step required.
    const fileName = `department_backup_${Date.now()}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Bulk export failed" });
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
