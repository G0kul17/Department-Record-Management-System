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
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
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

    if (!documents) {
      return res.status(400).json({ message: "Parsed data missing" });
    }

    const totalRows = documents.rows?.length || 0;

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

    const { rows } = await pool.query(q, values);

    res.status(201).json({
      message: "Data saved successfully",
      data: rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Save failed" });
  }
};

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
