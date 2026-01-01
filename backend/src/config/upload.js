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
  // Always allow standard proof types for the 'proof' field (achievements)
  if (file.fieldname === "proof") {
    const name = file.originalname || "";
    const ext = name.toLowerCase().split(".").pop();
    const extOk = ["pdf", "png", "jpg", "jpeg"].includes(ext);
    if (proofAllowedMimes.has(file.mimetype) || extOk) return cb(null, true);
    return cb(new Error("Invalid proof file type"), false);
  }

  // Restrict project attachments to ZIP only for field 'files'
  if (file.fieldname === "files") {
    const name = file.originalname || "";
    const ext = path.extname(name).toLowerCase();
    const isZipMime =
      file.mimetype === "application/zip" ||
      file.mimetype === "application/x-zip-compressed";
    if (isZipMime || ext === ".zip") return cb(null, true);
    return cb(new Error("Only .zip files are allowed for attachments"), false);
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
