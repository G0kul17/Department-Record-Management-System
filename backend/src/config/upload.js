// src/config/upload.js
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();

const STORAGE_PATH = process.env.FILE_STORAGE_PATH || "./uploads";
const MAX_MB = Number(process.env.FILE_SIZE_LIMIT_MB || 50);
const MAX_BYTES = MAX_MB * 1024 * 1024;
const allowedTypes = (process.env.ALLOWED_FILE_TYPES || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const proofAllowedMimes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  // Common aliases on Windows/legacy browsers
  "image/x-png",
  "image/pjpeg",
]);

// ensure directory exists
if (!fs.existsSync(STORAGE_PATH))
  fs.mkdirSync(STORAGE_PATH, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // optionally use role/year to create subfolders
    cb(null, STORAGE_PATH);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, name);
  },
});

function fileFilter(req, file, cb) {
  // Allow all file types for faculty participation proof field
  if (file.fieldname === "proof") {
    // Check if this is a faculty participation request
    // If the route starts with /faculty-participations, allow all file types
    if (req.baseUrl && req.baseUrl.includes("faculty-participations")) {
      return cb(null, true); // Allow all file types for faculty participation
    }

    // Allow all file types for achievements
    if (req.baseUrl && req.baseUrl.includes("achievements")) {
      return cb(null, true); // Allow all file types for achievements
    }

    // Otherwise, for other proof fields, restrict to PDFs and images only
    const name = file.originalname || "";
    const ext = name.toLowerCase().split(".").pop();
    const extOk = ["pdf", "png", "jpg", "jpeg"].includes(ext);
    if (proofAllowedMimes.has(file.mimetype) || extOk) return cb(null, true);
    return cb(new Error("Invalid proof file type"), false);
  }

  // Allow all file types for certificate field in achievements
  if (file.fieldname === "certificate") {
    if (req.baseUrl && req.baseUrl.includes("achievements")) {
      return cb(null, true); // Allow all file types for achievements
    }
    return cb(new Error("Invalid certificate file type"), false);
  }

  // Allow all file types for event_photos field in achievements
  if (file.fieldname === "event_photos") {
    if (req.baseUrl && req.baseUrl.includes("achievements")) {
      return cb(null, true); // Allow all file types for achievements
    }
    return cb(new Error("Invalid event photo file type"), false);
  }

  // 'files' is used by projects to upload ZIPs; scope ZIP-only rule to project routes
  if (file.fieldname === "files") {
    const isProjectRoute = (req.baseUrl || "").includes("projects");
    if (isProjectRoute) {
      const name = file.originalname || "";
      const ext = path.extname(name).toLowerCase();
      const isZipMime =
        file.mimetype === "application/zip" ||
        file.mimetype === "application/x-zip-compressed";
      if (isZipMime || ext === ".zip") return cb(null, true);
      return cb(
        new Error("Only .zip files are allowed for attachments"),
        false
      );
    }
    // For non-project routes (e.g., events), allow by default; rely on component accept
    return cb(null, true);
  }

  // Allow standard image types for 'thumbnail' field (event thumbnails)
  if (file.fieldname === "thumbnail") {
    const name = file.originalname || "";
    const ext = name.toLowerCase().split(".").pop();
    const allowedExts = new Set(["png", "jpg", "jpeg", "gif"]);
    const allowedMimes = new Set([
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/x-png",
      "image/pjpeg",
    ]);
    if (allowedMimes.has(file.mimetype) || allowedExts.has(ext)) {
      return cb(null, true);
    }
    return cb(new Error("Invalid image type for thumbnail"), false);
  }

  // Allow CSV/Excel specifically for 'document' field (data uploads)
  if (file.fieldname === "document") {
    const name = file.originalname || "";
    const ext = path.extname(name).toLowerCase();
    const allowedMimes = new Set([
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]);
    const allowedExts = new Set([".csv", ".xlsx", ".xls"]);
    if (allowedMimes.has(file.mimetype) || allowedExts.has(ext))
      return cb(null, true);
    return cb(
      new Error("Invalid data file type. Please upload CSV or Excel."),
      false
    );
  }

  // Allow CSV/Excel for 'students_file' field (student batch uploads)
  if (file.fieldname === "students_file") {
    const name = file.originalname || "";
    const ext = path.extname(name).toLowerCase();
    const allowedMimes = new Set([
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]);
    const allowedExts = new Set([".csv", ".xlsx", ".xls"]);
    if (allowedMimes.has(file.mimetype) || allowedExts.has(ext))
      return cb(null, true);
    return cb(
      new Error("Only CSV or Excel files are allowed for student uploads."),
      false
    );
  }

  // Allow standard image types for 'avatar' field (profile photos)
  if (file.fieldname === "avatar" || file.fieldname === "profile_photo") {
    const name = file.originalname || "";
    const ext = name.toLowerCase().split(".").pop();
    const allowedExts = new Set(["png", "jpg", "jpeg"]);
    const allowedMimes = new Set([
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/x-png",
      "image/pjpeg",
    ]);
    if (allowedMimes.has(file.mimetype) || allowedExts.has(ext)) {
      return cb(null, true);
    }
    return cb(new Error("Invalid image type for avatar"), false);
  }

  // Otherwise respect global allowedTypes if provided; allow all if empty
  if (!allowedTypes.length) return cb(null, true);
  if (allowedTypes.includes(file.mimetype)) return cb(null, true);
  return cb(new Error("File type not allowed"), false);
}

export const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter,
});

// Special upload for faculty participation with 15MB limit and all file types
export const uploadFacultyProof = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "proof") {
      return cb(null, true); // Allow all file types
    }
    return cb(null, true); // Allow all other fields as well for flexibility
  },
});
