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
  return xlsx.utils.sheet_to_json(sheet, { raw: false, defval: "" });
};

const studentEmailRegex = /^[a-z]+[0-9]{2}[a-z]+@sonatech\.ac\.in$/i;
const contactRegex = /^[0-9]{10}$/;

// Helper to normalize header keys
const normalizeKey = (key) => {
  return String(key || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[_\-]/g, " ");
};

// Map normalized headers to actual row keys
const extractFieldsFromRow = (row) => {
  const keyMap = {};
  Object.keys(row).forEach((key) => {
    const normalized = normalizeKey(key);
    keyMap[normalized] = key;
  });

  const getValue = (possibleNames) => {
    for (const name of possibleNames) {
      const normalized = normalizeKey(name);
      if (keyMap[normalized]) {
        const val = row[keyMap[normalized]];
        if (val !== null && val !== undefined) {
          return String(val).trim();
        }
      }
    }
    return "";
  };

  return {
    full_name: getValue(["Full name", "full name", "fullname", "name"]),
    first_name: getValue(["First name", "first name", "firstname", "first"]),
    last_name: getValue(["Last name", "last name", "lastname", "last"]),
    email: getValue(["College mail", "college mail", "email", "mail"]),
    register_number: getValue([
      "Register number",
      "register number",
      "regno",
      "register no",
      "registration number",
      "reg no",
    ]),
    contact_number: getValue([
      "Contact number",
      "contact number",
      "phone",
      "contact",
      "mobile",
      "phone number",
    ]),
    year: getValue(["Year", "year"]),
    department: getValue(["Dept", "dept", "department"]),
    course: getValue(["Course", "course"]),
    section: getValue(["Section", "section"]),
  };
};

/* ================= CONTROLLER ================= */

export const uploadStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let rows = [];

    if (ext === ".csv") rows = await parseCSV(req.file.path);
    else if (ext === ".xlsx" || ext === ".xls") rows = parseExcel(req.file.path);
    else {
      return res.status(400).json({ message: "Only CSV or Excel allowed" });
    }

    if (!rows.length) {
      return res.status(400).json({ message: "Uploaded file is empty" });
    }

    // Debug: log first row to check headers
    console.log("First row headers:", Object.keys(rows[0] || {}));

    const errors = [];
    const validStudents = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2;

      const fields = extractFieldsFromRow(row);
      const {
        full_name,
        first_name,
        last_name,
        email,
        register_number,
        contact_number,
        year,
        department,
        course,
        section,
      } = fields;

      const missingFields = [];

      if (!full_name) missingFields.push("Full name");
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
        console.log(`Row ${rowNumber} missing fields:`, missingFields);
        console.log("Extracted fields:", fields);
        errors.push({
          row: rowNumber,
          message: "Fill all sections",
          missingFields,
        });
        return;
      }

      // Relaxed email validation - just check basic format
      const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!basicEmailRegex.test(email)) {
        errors.push({
          row: rowNumber,
          message: "Invalid email format",
        });
        return;
      }

      // Clean and validate contact number
      const cleanedContact = contact_number.replace(/\D/g, "");
      if (cleanedContact.length !== 10) {
        errors.push({
          row: rowNumber,
          message: "Contact number must be 10 digits",
        });
        return;
      }

      validStudents.push({
        ...fields,
        contact_number: cleanedContact, // Use cleaned version
      });
    });

    if (errors.length) {
      console.log("Validation errors:", errors);
      return res.status(400).json({
        message: `Validation failed for ${errors.length} row(s). Check the details.`,
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
            full_name: s.full_name,
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
Hello ${s.full_name || s.first_name},

Your student account has been created. And you are added in the Community of DRMS.

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
