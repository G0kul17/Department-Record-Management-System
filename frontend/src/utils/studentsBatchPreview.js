// Utility to parse CSV/XLSX/XLS student batch files and generate a preview with basic validation
// Supports: .csv, .xlsx, and .xls

import ExcelJS from "exceljs";

export const REQUIRED_HEADERS = [
  "Full name",
  "First name",
  "Last name",
  "College mail",
  "Register number",
  "Contact number",
  "Year",
  "Dept",
  "Course",
  "Section",
];

function parseCsvToRows(text) {
  const rows = [];
  let cur = "";
  let inQuotes = false;
  let row = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        // escaped quote
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      row.push(cur);
      cur = "";
    } else if ((c === "\n" || c === "\r") && !inQuotes) {
      if (cur.length > 0 || row.length > 0) {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      }
    } else {
      cur += c;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows
    .map((r) => r.map((v) => String(v ?? "").trim()))
    .filter((r) => r.some((v) => v !== ""));
}

function formatCellValue(v) {
  if (v == null) return "";
  if (typeof v === "object" && v !== null) {
    if (v.text) return String(v.text).trim();
    if (v.result !== undefined) return formatCellValue(v.result);
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text || "").join("").trim();
  }
  if (typeof v === "number") {
    if (Number.isSafeInteger(v)) {
      return BigInt(v).toString();
    }
  }
  let s = String(v).trim();
  // If scientific notation string e.g. "2.60362104001E+11"
  if (/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/i.test(s)) {
    const n = Number(s);
    if (!isNaN(n) && Number.isSafeInteger(Math.round(n))) {
      const expanded = BigInt(Math.round(n)).toString();
      // Only use expanded if it didn't completely lose precision (e.g. didn't end in many zeroes due to truncation)
      if (!s.toUpperCase().includes("E+15") || expanded.replace(/0+$/, "").length > 6) {
        return expanded;
      }
    }
  }
  return s;
}

async function parseXlsx(file) {
  const ab = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(ab);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    rows.push(values.map((v) => formatCellValue(v)));
  });

  return rows.filter((r) => r.some((v) => v !== ""));
}

function buildHeaderMap(headerRow) {
  const normalized = headerRow.map((h) => String(h || "").trim());
  const errors = [];
  const indexByHeader = new Map();
  normalized.forEach((h, idx) => indexByHeader.set(h.toLowerCase(), idx));

  const map = {};
  for (const req of REQUIRED_HEADERS) {
    const idx = indexByHeader.get(req.toLowerCase());
    if (idx === undefined) errors.push(`Missing header: ${req}`);
    else map[req] = idx;
  }
  return { map, errors };
}

function validateRow(obj) {
  const errs = {};
  const email = obj["College mail"] || "";
  const phone = (obj["Contact number"] || "").replace(/\D/g, "");
  const regNo = String(obj["Register number"] || "").trim();

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) errs["College mail"] = "Invalid email";
  if (phone.length !== 10) errs["Contact number"] = "Must be 10 digits";

  if (!regNo) {
    errs["Register number"] = "Required";
  } else if (/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/i.test(regNo) || regNo.includes("E+")) {
    errs["Register number"] = "Scientific notation detected (Excel format issue). In Excel, format this column as Text or upload as .xlsx";
  }

  for (const k of REQUIRED_HEADERS) {
    if (!String(obj[k] ?? "").trim()) {
      errs[k] = "Required";
    }
  }
  return errs;
}

export async function generateStudentsPreview(file) {
  if (!file) throw new Error("No file selected");
  const name = (file.name || "").toLowerCase();
  let rows;
  if (name.endsWith(".csv")) {
    const text = await file.text();
    rows = parseCsvToRows(text);
  } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    rows = await parseXlsx(file);
  } else {
    throw new Error("Unsupported file type. Please upload a .csv, .xlsx, or .xls file");
  }

  if (!rows.length) {
    return {
      headers: [],
      items: [],
      headerErrors: ["Empty file"],
      rowIssues: [],
    };
  }
  const [headerRow, ...dataRows] = rows;
  const { map, errors: headerErrors } = buildHeaderMap(headerRow);

  const items = dataRows.map((r) => {
    const obj = {};
    for (const h of REQUIRED_HEADERS) {
      const idx = map[h];
      obj[h] = idx !== undefined ? formatCellValue(r[idx]) : "";
    }
    return obj;
  });

  // Track duplicates within the batch
  const emailCounts = new Map();
  const regCounts = new Map();
  items.forEach((item) => {
    const em = (item["College mail"] || "").trim().toLowerCase();
    if (em) emailCounts.set(em, (emailCounts.get(em) || 0) + 1);

    const reg = (item["Register number"] || "").trim().toLowerCase();
    if (reg) regCounts.set(reg, (regCounts.get(reg) || 0) + 1);
  });

  const rowIssues = items
    .map((obj, i) => {
      const errors = validateRow(obj);
      const em = (obj["College mail"] || "").trim().toLowerCase();
      if (em && emailCounts.get(em) > 1) {
        errors["College mail"] = `Duplicate email in this file (${obj["College mail"]})`;
      }
      const reg = (obj["Register number"] || "").trim().toLowerCase();
      if (reg && regCounts.get(reg) > 1) {
        errors["Register number"] = `Duplicate register number (${obj["Register number"]}) across rows`;
      }
      return { index: i, errors };
    })
    .filter((ri) => Object.keys(ri.errors).length > 0);

  return {
    headers: REQUIRED_HEADERS,
    items,
    headerErrors,
    rowIssues,
  };
}
