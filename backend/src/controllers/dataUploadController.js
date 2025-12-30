import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import csvParser from "csv-parser";

// Utility: Parse CSV
const parseCSV = (filePath) =>
  new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => rows.push(data))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });

// Utility: Parse Excel
const parseExcel = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false, defval: "" });
};

// Normalize column names for matching
const normalizeKey = (key) => {
  return String(key || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[_\-]+/g, "_");
};

// Detect data type based on columns
const detectDataType = (columns) => {
  const normalized = columns.map(normalizeKey);
  const colSet = new Set(normalized);

  // Check for achievements (user_email/email + title)
  if ((colSet.has("user_email") || colSet.has("email")) && colSet.has("title") && !colSet.has("mentor_name")) {
    return "achievements";
  }

  // Check for projects (title + mentor/academic_year/description)
  if (colSet.has("title") && (colSet.has("mentor_name") || colSet.has("mentor") || colSet.has("academic_year") || colSet.has("description"))) {
    return "projects";
  }

  // Check for faculty consultancy (agency + amount/team_members)
  if (colSet.has("agency") && (colSet.has("amount") || colSet.has("team_members")) && !colSet.has("funded_type") && !colSet.has("principal_investigator")) {
    return "faculty_consultancy";
  }

  // Check for faculty research (funded_type + principal_investigator)
  if (colSet.has("funded_type") && colSet.has("principal_investigator")) {
    return "faculty_research";
  }

  // Check for faculty participation (faculty_name + department + type_of_event + mode_of_training)
  if (colSet.has("faculty_name") && colSet.has("department") && colSet.has("type_of_event") && colSet.has("mode_of_training")) {
    return "faculty_participations";
  }

  return null;
};

// ================= UPLOAD & PREVIEW =================
export const uploadDataFile = async (req, res) => {
  try {
    const user = req.user;
    const uploaderName = req.body.uploader_name;

    if (!req.file || !uploaderName) {
      return res
        .status(400)
        .json({ message: "File and uploader name required" });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    let parsedRows = [];

    if (ext === ".csv") {
      parsedRows = await parseCSV(filePath);
    } else if (ext === ".xlsx") {
      parsedRows = parseExcel(filePath);
    } else {
      return res.status(400).json({ message: "Only CSV and Excel allowed" });
    }

    if (!parsedRows.length) {
      return res.status(400).json({ message: "No data found in file" });
    }

    const columns = Object.keys(parsedRows[0]);

    return res.json({
      preview: {
        columns,
        rows: parsedRows, // include all rows in preview
        totalRows: parsedRows.length,
      },
      meta: {
        uploader_name: uploaderName,
        original_filename: req.file.originalname,
        stored_filename: req.file.filename,
        mime_type: req.file.mimetype,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Preview failed" });
  }
};

// ================= SAVE TO DATABASE =================
export const saveUploadedData = async (req, res) => {
  try {
    const user = req.user;
    const { uploader_name, original_filename, stored_filename, documents } =
      req.body;

    if (!documents || !documents.rows || !documents.rows.length) {
      return res.status(400).json({ message: "No data to save" });
    }

    const columns = documents.columns || [];
    const rows = documents.rows || [];
    
    // Detect data type
    const dataType = detectDataType(columns);

    if (!dataType) {
      // If no specific type detected, save to generic table
      const totalRows = rows.length;
      const q = `
        INSERT INTO staff_uploads_with_document
        (uploader_name, uploaded_by, uploader_role,
         original_filename, stored_filename, file_type,
         total_rows, documents)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *`;

      const values = [
        uploader_name,
        user.id,
        user.role,
        original_filename,
        stored_filename,
        path.extname(original_filename).replace(".", ""),
        totalRows,
        documents,
      ];

      const { rows: result } = await pool.query(q, values);
      return res.status(201).json({
        message: "Data saved to general storage",
        data: result[0],
      });
    }

    // Save to specific table based on detected type
    let created = 0;
    const skipped = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const normalized = {};
      
      Object.keys(row).forEach((key) => {
        normalized[normalizeKey(key)] = row[key];
      });

      try {
        if (dataType === "achievements") {
          await saveAchievement(normalized, user, i + 2);
          created++;
        } else if (dataType === "projects") {
          await saveProject(normalized, user, i + 2);
          created++;
        } else if (dataType === "faculty_consultancy") {
          await saveFacultyConsultancy(normalized, user, i + 2);
          created++;
        } else if (dataType === "faculty_research") {
          await saveFacultyResearch(normalized, user, i + 2);
          created++;
        } else if (dataType === "faculty_participations") {
          await saveFacultyParticipation(normalized, user, i + 2);
          created++;
        }
      } catch (err) {
        if (err.code === "23505") {
          skipped.push({ row: i + 2, reason: "Duplicate entry" });
        } else {
          errors.push({ row: i + 2, error: err.message });
        }
      }
    }

    res.status(201).json({
      message: `Data saved to ${dataType} table`,
      dataType,
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Save failed", error: err.message });
  }
};

// Helper functions to save to specific tables
async function saveAchievement(normalized, user, rowNum) {
  const user_email = (normalized.user_email || normalized.email || "").trim();
  const title = (normalized.title || normalized.achievement_title || "").trim();
  const date = (normalized.date || normalized.achievement_date || "").trim();
  const issuer = (normalized.issuer || normalized.issued_by || "").trim();
  const name = (normalized.name || normalized.achievement_name || "").trim();

  if (!user_email || !title) {
    throw new Error("Required fields missing: user_email, title");
  }

  const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [user_email]);
  if (!userResult.rows.length) {
    throw new Error("User not found");
  }

  const user_id = userResult.rows[0].id;
  await pool.query(
    `INSERT INTO achievements (user_id, title, date, issuer, name, verified, verification_status)
     VALUES ($1, $2, $3, $4, $5, false, 'pending')`,
    [user_id, title, date || null, issuer || null, name || null]
  );
}

async function saveProject(normalized, user, rowNum) {
  const title = (normalized.title || normalized.project_title || "").trim();
  const description = (normalized.description || "").trim();
  const mentor_name = (normalized.mentor_name || normalized.mentor || "").trim();
  const academic_year = (normalized.academic_year || normalized.year || "").trim();
  const status = (normalized.status || "ongoing").trim();
  const github_url = (normalized.github_url || normalized.repo_url || "").trim();
  const team_member_names = (normalized.team_member_names || normalized.team_members || "").trim();

  if (!title) {
    throw new Error("Required fields missing: title");
  }

  await pool.query(
    `INSERT INTO projects (title, description, mentor_name, academic_year, status, github_url, team_member_names, created_by, verification_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')`,
    [title, description, mentor_name, academic_year, status, github_url, team_member_names, user.id]
  );
}

async function saveFacultyConsultancy(normalized, user, rowNum) {
  const faculty_name = (normalized.faculty_name || "").trim();
  const team_members = (normalized.team_members || "").trim();
  const agency = (normalized.agency || "").trim();
  const amount = (normalized.amount || "").trim();
  const duration = (normalized.duration || "").trim();
  const start_date = (normalized.start_date || "").trim();
  const end_date = (normalized.end_date || "").trim();

  if (!agency) {
    throw new Error("Required fields missing: agency");
  }

  await pool.query(
    `INSERT INTO faculty_consultancy (faculty_name, team_members, agency, amount, duration, start_date, end_date, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [faculty_name, team_members, agency, amount ? parseFloat(amount) : null, duration, start_date || null, end_date || null, user.id]
  );
}

async function saveFacultyResearch(normalized, user, rowNum) {
  const faculty_name = (normalized.faculty_name || "").trim();
  const funded_type = (normalized.funded_type || "").trim();
  const principal_investigator = (normalized.principal_investigator || normalized.pi || "").trim();
  const team_members = (normalized.team_members || "").trim();
  const title = (normalized.title || normalized.project_title || "").trim();
  const agency = (normalized.agency || "").trim();
  const current_status = (normalized.current_status || normalized.status || "").trim();
  const duration = (normalized.duration || "").trim();
  const start_date = (normalized.start_date || "").trim();
  const end_date = (normalized.end_date || "").trim();
  const amount = (normalized.amount || "").trim();

  if (!funded_type || !principal_investigator || !title || !current_status) {
    throw new Error("Required fields missing: funded_type, principal_investigator, title, current_status");
  }

  await pool.query(
    `INSERT INTO faculty_research (faculty_name, funded_type, principal_investigator, team_members, title, agency, current_status, duration, start_date, end_date, amount, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [faculty_name, funded_type, principal_investigator, team_members, title, agency, current_status, duration, start_date || null, end_date || null, amount ? parseFloat(amount) : null, user.id]
  );
}

async function saveFacultyParticipation(normalized, user, rowNum) {
  const faculty_name = (normalized.faculty_name || "").trim();
  const department = (normalized.department || normalized.dept || "").trim();
  const type_of_event = (normalized.type_of_event || normalized.event_type || "").trim();
  const mode_of_training = (normalized.mode_of_training || normalized.mode || "").trim();
  const title = (normalized.title || normalized.event_title || "").trim();
  const start_date = (normalized.start_date || "").trim();
  const end_date = (normalized.end_date || "").trim();
  const conducted_by = (normalized.conducted_by || normalized.organizer || "").trim();
  const details = (normalized.details || normalized.description || "").trim();

  if (!faculty_name || !department || !type_of_event || !mode_of_training || !title || !start_date) {
    throw new Error("Required fields missing: faculty_name, department, type_of_event, mode_of_training, title, start_date");
  }

  await pool.query(
    `INSERT INTO faculty_participations (faculty_name, department, type_of_event, mode_of_training, title, start_date, end_date, conducted_by, details, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [faculty_name, department, type_of_event, mode_of_training, title, start_date, end_date || null, conducted_by, details, user.id]
  );
}

// ================= LIST UPLOADS =================
export const listUploadedData = async (req, res) => {
  try {
    const q = `
      SELECT id, uploader_name, uploader_role,
             original_filename, total_rows, created_at
      FROM staff_uploads_with_document
      ORDER BY created_at DESC`;

    const { rows } = await pool.query(q);
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fetch failed" });
  }
};

// ================= VIEW SINGLE UPLOAD =================
export const viewUploadedData = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { rows } = await pool.query(
      "SELECT * FROM staff_uploads_with_document WHERE id=$1",
      [id]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Record not found" });

    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fetch failed" });
  }
};
