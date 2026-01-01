import ExcelJS from "exceljs";
import pool from "../config/db.js";
import path from "path";
import fs from "fs";

/* =====================================================
   Bulk Data Export Controller
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
      { header: "Profile Details (JSON)", key: "profile_details" }
    ];

    users.rows.forEach(u =>
      usersSheet.addRow({
        ...u,
        profile_details: JSON.stringify(u.profile_details)
      })
    );

    /* ================= PROJECTS ================= */
    const projectsSheet = workbook.addWorksheet("Projects");
    const projects = await pool.query(`SELECT * FROM projects`);

    projectsSheet.columns = Object.keys(projects.rows[0] || {}).map(k => ({
      header: k,
      key: k
    }));

    projects.rows.forEach(p => projectsSheet.addRow(p));

    /* ================= ACHIEVEMENTS ================= */
    const achievementsSheet = workbook.addWorksheet("Achievements");
    const achievements = await pool.query(`SELECT * FROM achievements`);

    achievementsSheet.columns = Object.keys(achievements.rows[0] || {}).map(k => ({
      header: k,
      key: k
    }));

    achievements.rows.forEach(a => achievementsSheet.addRow(a));

    /* ================= FACULTY PARTICIPATION ================= */
    const participationSheet = workbook.addWorksheet("Faculty_Participation");
    const participation = await pool.query(`SELECT * FROM faculty_participations`);

    participationSheet.columns = Object.keys(participation.rows[0] || {}).map(k => ({
      header: k,
      key: k
    }));

    participation.rows.forEach(p => participationSheet.addRow(p));

    /* ================= FACULTY RESEARCH ================= */
    const researchSheet = workbook.addWorksheet("Faculty_Research");
    const research = await pool.query(`SELECT * FROM faculty_research`);

    researchSheet.columns = Object.keys(research.rows[0] || {}).map(k => ({
      header: k,
      key: k
    }));

    research.rows.forEach(r => researchSheet.addRow(r));

    /* ================= FACULTY CONSULTANCY ================= */
    const consultancySheet = workbook.addWorksheet("Faculty_Consultancy");
    const consultancy = await pool.query(`SELECT * FROM faculty_consultancy`);

    consultancySheet.columns = Object.keys(consultancy.rows[0] || {}).map(k => ({
      header: k,
      key: k
    }));

    consultancy.rows.forEach(c => consultancySheet.addRow(c));

    /* ================= EVENTS ================= */
    const eventsSheet = workbook.addWorksheet("Events");
    const events = await pool.query(`SELECT * FROM events`);

    eventsSheet.columns = Object.keys(events.rows[0] || {}).map(k => ({
      header: k,
      key: k
    }));

    events.rows.forEach(e => eventsSheet.addRow(e));

    /* ================= STAFF UPLOADS (Optional) ================= */
    try {
      const staffUploadsSheet = workbook.addWorksheet("Staff_Uploads");
      const staffUploads = await pool.query(`SELECT * FROM staff_uploads`);

      if (staffUploads.rows.length > 0) {
        staffUploadsSheet.columns = Object.keys(staffUploads.rows[0]).map(k => ({
          header: k,
          key: k
        }));

        staffUploads.rows.forEach(s =>
          staffUploadsSheet.addRow({
            ...s,
            documents: JSON.stringify(s.documents)
          })
        );
      } else {
        staffUploadsSheet.addRow({ message: "No staff uploads data" });
      }
    } catch (err) {
      console.log("staff_uploads table not found, skipping...");
      // Table doesn't exist, skip it
    }

    /* ================= SAVE FILE ================= */
    const fileName = `department_backup_${Date.now()}.xlsx`;
    const filePath = path.join("exports", fileName);

    if (!fs.existsSync("exports")) {
      fs.mkdirSync("exports");
    }

    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, fileName);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Bulk export failed" });
  }
};
