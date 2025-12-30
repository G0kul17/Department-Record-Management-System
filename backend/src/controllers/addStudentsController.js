import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import xlsx from "xlsx";
import csvParser from "csv-parser";
import { sendMail } from "../config/mailer.js";

/* ================= HELPERS ================= */

const parseCSV = (filePath) =>
  new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });

const parseExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
};

const studentEmailRegex = /^[a-z]+[0-9]{2}[a-z]+@sonatech\.ac\.in$/i;
const contactRegex = /^[0-9]{10}$/;

/* ================= CONTROLLER ================= */

export const uploadStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let rows = [];

    if (ext === ".csv") rows = await parseCSV(req.file.path);
    else if (ext === ".xlsx") rows = parseExcel(req.file.path);
    else {
      return res.status(400).json({ message: "Only CSV or Excel allowed" });
    }

    if (!rows.length) {
      return res.status(400).json({ message: "Uploaded file is empty" });
    }

    const errors = [];
    const validStudents = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2;

      const first_name = row["First name"]?.toString().trim();
      const last_name = row["Last name"]?.toString().trim();
      const email = row["College mail"]?.toString().trim();
      const register_number = row["Register number"]?.toString().trim();
      const contact_number = row["Contact number"]?.toString().trim();
      const year = row["Year"]?.toString().trim();
      const department = row["Dept"]?.toString().trim();
      const course = row["Course"]?.toString().trim();
      const section = row["Section"]?.toString().trim();

      const missingFields = [];

      if (!first_name) missingFields.push("First name");
      if (!last_name) missingFields.push("Last name");
      if (!email) missingFields.push("College mail");
      if (!register_number) missingFields.push("Register number");
      if (!contact_number) missingFields.push("Contact number");
      if (!year) missingFields.push("Year");
      if (!department) missingFields.push("Dept");
      if (!course) missingFields.push("Course");
      if (!section) missingFields.push("Section");

      if (missingFields.length) {
        errors.push({
          row: rowNumber,
          message: "Fill all sections",
          missingFields,
        });
        return;
      }

      if (!studentEmailRegex.test(email)) {
        errors.push({
          row: rowNumber,
          message: "Invalid student email format",
        });
        return;
      }

      if (!contactRegex.test(contact_number)) {
        errors.push({
          row: rowNumber,
          message: "Invalid contact number (10 digits required)",
        });
        return;
      }

      validStudents.push({
        first_name,
        last_name,
        email,
        register_number,
        contact_number,
        year,
        department,
        course,
        section,
      });
    });

    if (errors.length) {
      return res.status(400).json({
        message: "Validation failed. Fill all sections.",
        errors,
      });
    }

    let created = 0;
    const skipped = [];

    for (const s of validStudents) {
      const exists = await pool.query("SELECT id FROM users WHERE email = $1", [
        s.email,
      ]);

      if (exists.rows.length) {
        skipped.push({ email: s.email, reason: "Already exists" });
        continue;
      }

      const defaultPassword = Math.random().toString(36).slice(-8);
      const hash = await bcrypt.hash(defaultPassword, 10);

      await pool.query(
        `
        INSERT INTO users
        (email, password_hash, role, is_verified, profile_details)
        VALUES ($1, $2, 'student', true, $3)
        `,
        [
          s.email,
          hash,
          JSON.stringify({
            first_name: s.first_name,
            last_name: s.last_name,
            register_number: s.register_number,
            contact_number: s.contact_number,
            department: s.department,
            course: s.course,
            year: s.year,
            section: s.section,
          }),
        ]
      );

      await sendMail({
        to: s.email,
        subject: "Student Account Created",
        text: `
Hello ${s.first_name},

Your student account has been created.

Email: ${s.email}
Temporary Password: ${defaultPassword}

Please change your password using the "Forgot Password" option.

Regards,
Department Admin
        `,
      });

      created++;
    }

    res.json({
      message: "Student upload completed successfully",
      created,
      skipped,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
};
