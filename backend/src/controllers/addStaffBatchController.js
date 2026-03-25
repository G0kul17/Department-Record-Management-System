import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import crypto from "crypto";
import xlsx from "xlsx";
import csvParser from "csv-parser";
import { sendMail } from "../config/mailer.js";
import logger, { reqContext } from "../utils/logger.js";
import { tracedExternalCall, tracedQuery } from "../utils/tracing.js";

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

const normalizeKey = (key) =>
  String(key || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[_\-]/g, " ");

const extractFieldsFromRow = (row) => {
  const keyMap = {};
  Object.keys(row).forEach((key) => {
    keyMap[normalizeKey(key)] = key;
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
    employee_id: getValue([
      "Employee ID",
      "employee id",
      "employeeid",
      "staff id",
      "staff_id",
      "employee code",
    ]),
    contact_number: getValue([
      "Contact number",
      "contact number",
      "phone",
      "contact",
      "mobile",
      "phone number",
    ]),
    department: getValue(["Dept", "dept", "department"]),
    designation: getValue(["Designation", "designation", "role title", "title"]),
  };
};

const generateTemporaryPassword = () => crypto.randomBytes(5).toString("hex");

/* ================= CONTROLLER ================= */

export const uploadStaffBatch = async (req, res) => {
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

    logger.debug("Staff batch upload: first row headers", {
      ...reqContext(req),
      headers: Object.keys(rows[0] || {}),
    });

    const errors = [];
    const validStaff = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const fields = extractFieldsFromRow(row);
      const {
        full_name,
        first_name,
        last_name,
        email,
        employee_id,
        contact_number,
        department,
        designation,
      } = fields;

      const missingFields = [];
      if (!full_name) missingFields.push("Full name");
      if (!first_name) missingFields.push("First name");
      if (!last_name) missingFields.push("Last name");
      if (!email) missingFields.push("College mail");
      if (!employee_id) missingFields.push("Employee ID");
      if (!contact_number) missingFields.push("Contact number");
      if (!department) missingFields.push("Dept");
      if (!designation) missingFields.push("Designation");

      if (missingFields.length) {
        errors.push({
          row: rowNumber,
          message: "Fill all sections",
          missingFields,
        });
        return;
      }

      const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!basicEmailRegex.test(email)) {
        errors.push({
          row: rowNumber,
          message: "Invalid email format",
        });
        return;
      }

      const cleanedContact = contact_number.replace(/\D/g, "");
      if (cleanedContact.length !== 10) {
        errors.push({
          row: rowNumber,
          message: "Contact number must be 10 digits",
        });
        return;
      }

      validStaff.push({
        ...fields,
        contact_number: cleanedContact,
      });
    });

    if (errors.length) {
      return res.status(400).json({
        message: `Validation failed for ${errors.length} row(s). Check the details.`,
        errors,
      });
    }

    let created = 0;
    const skipped = [];

    for (const staff of validStaff) {
      const exists = await tracedQuery(
        pool,
        "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
        [staff.email],
      );

      if (exists.rows.length) {
        skipped.push({ email: staff.email, reason: "Already exists" });
        continue;
      }

      const defaultPassword = generateTemporaryPassword();
      const hash = await bcrypt.hash(defaultPassword, 10);

      await tracedQuery(
        pool,
        `
        INSERT INTO users
        (email, password_hash, role, is_verified, profile_details, full_name)
        VALUES ($1, $2, 'staff', true, $3, $4)
        `,
        [
          staff.email,
          hash,
          JSON.stringify({
            full_name: staff.full_name,
            first_name: staff.first_name,
            last_name: staff.last_name,
            employee_id: staff.employee_id,
            contact_number: staff.contact_number,
            department: staff.department,
            designation: staff.designation,
          }),
          staff.full_name || `${staff.first_name} ${staff.last_name}`.trim(),
        ],
      );

      await tracedExternalCall(
        "mail.send",
        {
          "email.to": staff.email,
          "email.subject": "Staff Account Created",
        },
        () =>
          sendMail({
            to: staff.email,
            subject: "Staff Account Created",
            text: `
Hello ${staff.full_name || staff.first_name},

Your DRMS staff account has been created.

Email: ${staff.email}
Temporary Password: ${defaultPassword}

Please log in and change your password using the "Forgot Password" option.

Regards,
Department Admin
            `,
          }),
      );

      created++;
    }

    return res.json({
      message: "Staff upload completed successfully",
      created,
      skipped,
    });
  } catch (err) {
    logger.error("Staff batch upload failed", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Upload failed" });
  } finally {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
  }
};
