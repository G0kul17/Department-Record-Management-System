// Utility to parse CSV/XLSX student batch files and generate a preview with basic validation
// Supports: .csv and .xlsx

export const REQUIRED_HEADERS = [
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

async function parseXlsx(file) {
  const { default: XLSX } = await import("xlsx");
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: "array" });
  const wsName = wb.SheetNames[0];
  const ws = wb.Sheets[wsName];
  // Use raw headers from the first row
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  return rows
    .map((r) => r.map((v) => String(v ?? "").trim()))
    .filter((r) => r.some((v) => v !== ""));
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
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) errs["College mail"] = "Invalid email";
  if (phone.length !== 10) errs["Contact number"] = "Must be 10 digits";
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
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    rows = await parseXlsx(file);
  } else if (name.endsWith(".csv")) {
    const text = await file.text();
    rows = parseCsvToRows(text);
  } else {
    throw new Error("Unsupported file type. Please upload .csv or .xlsx");
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
      obj[h] = idx !== undefined ? (r[idx] ?? "").toString().trim() : "";
    }
    return obj;
  });

  const rowIssues = items
    .map((obj, i) => ({ index: i, errors: validateRow(obj) }))
    .filter((ri) => Object.keys(ri.errors).length > 0);

  return {
    headers: REQUIRED_HEADERS,
    items,
    headerErrors,
    rowIssues,
  };
}
