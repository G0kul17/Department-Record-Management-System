// src/config/upload.js
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileTypeFromFile } from "file-type";
import dotenv from "dotenv";
dotenv.config();

// ============================================================================
// EXPLICIT FILE STORAGE CONFIGURATION
// ============================================================================
// Problem: Relative paths cause file loss, permission errors, inconsistencies
// Solution: Explicit configuration with validation and permission checks
// ============================================================================

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

// In production: FILE_STORAGE_PATH is REQUIRED (no fallback)
// In development: Allow fallback to ./uploads for convenience
let STORAGE_PATH;

if (IS_PRODUCTION) {
  if (!process.env.FILE_STORAGE_PATH) {
    throw new Error(
      "❌ FILE_STORAGE_PATH environment variable is REQUIRED in production. " +
        "Use absolute paths for production deployments (e.g., /var/www/drms/uploads)",
    );
  }
  STORAGE_PATH = process.env.FILE_STORAGE_PATH;
  console.log(`📁 File storage (production): ${STORAGE_PATH}`);
} else {
  STORAGE_PATH = process.env.FILE_STORAGE_PATH || "./uploads";
  if (!process.env.FILE_STORAGE_PATH) {
    console.warn(
      `⚠️  FILE_STORAGE_PATH not set, using default: ${STORAGE_PATH}`,
    );
  } else {
    console.log(`📁 File storage (development): ${STORAGE_PATH}`);
  }
}

// Resolve to absolute path
STORAGE_PATH = path.resolve(STORAGE_PATH);

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

// ============================================================================
// DIRECTORY CREATION & PERMISSION VERIFICATION
// ============================================================================

/**
 * Verify file storage directory exists and has correct permissions
 * @throws {Error} If directory cannot be created or lacks permissions
 */
export function verifyFileStorage() {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(STORAGE_PATH)) {
      console.log(`📁 Creating file storage directory: ${STORAGE_PATH}`);
      fs.mkdirSync(STORAGE_PATH, { recursive: true, mode: 0o755 });
    }

    // Verify read permission
    try {
      fs.accessSync(STORAGE_PATH, fs.constants.R_OK);
    } catch (err) {
      throw new Error(
        `❌ No READ permission for file storage: ${STORAGE_PATH}\n` +
          `   Run: chmod +r ${STORAGE_PATH}`,
      );
    }

    // Verify write permission
    try {
      fs.accessSync(STORAGE_PATH, fs.constants.W_OK);
    } catch (err) {
      throw new Error(
        `❌ No WRITE permission for file storage: ${STORAGE_PATH}\n` +
          `   Run: chmod +w ${STORAGE_PATH}`,
      );
    }

    // Test write by creating a temporary file
    const testFile = path.join(STORAGE_PATH, `.write-test-${Date.now()}`);
    try {
      fs.writeFileSync(testFile, "test", "utf8");
      fs.unlinkSync(testFile);
    } catch (err) {
      throw new Error(
        `❌ Cannot write to file storage directory: ${STORAGE_PATH}\n` +
          `   Error: ${err.message}\n` +
          `   Ensure the directory exists and has write permissions.`,
      );
    }

    console.log(`✅ File storage verified: ${STORAGE_PATH}`);
    console.log(`   Read/Write: OK`);
    console.log(`   Max file size: ${MAX_MB} MB`);

    return true;
  } catch (err) {
    if (IS_PRODUCTION) {
      // In production, fail fast
      throw err;
    } else {
      // In development, warn but allow startup
      console.error(err.message);
      console.warn("⚠️  File uploads may not work correctly.");
      return false;
    }
  }
}

// Verify on module load
verifyFileStorage();

// ============================================================================
// CONTENT-BASED FILE VALIDATION (KAN-10)
// Validates actual file content via magic bytes and byte-pattern scanning.
// Runs after multer writes the file to disk so the check cannot be bypassed
// by spoofing the client-declared MIME type or file extension.
// ============================================================================

// Extensions that enable XSS or server-side execution when served statically
const BLOCKED_EXTENSIONS = new Set([
  ".html", ".htm", ".xhtml",
  ".svg", ".svgz",
  ".js", ".mjs", ".cjs", ".jsx",
  ".ts", ".tsx",
  ".php", ".php3", ".php4", ".php5", ".phtml",
  ".asp", ".aspx", ".jsp", ".jspx",
  ".sh", ".bash", ".zsh",
  ".py", ".rb", ".pl", ".cgi",
]);

// MIME types detected from magic bytes that are always rejected
const BLOCKED_DETECTED_MIMES = new Set([
  "application/x-msdownload",  // Windows PE / EXE
  "application/x-executable",
  "application/x-elf",
  "application/x-sharedlib",
  "application/x-dex",         // Android DEX bytecode
]);

// Byte-level patterns at the head of a file that indicate dangerous text content.
// file-type cannot detect text-based formats (HTML, SVG, PHP) from magic bytes,
// so we scan the first 512 bytes of every uploaded file.
const DANGEROUS_BYTE_PATTERNS = [
  /^<!doctype\s+html/i,
  /^<html[\s>]/i,
  /^<script[\s>]/i,
  /^<\?php/i,
  /^<svg[\s>]/i,
];

/**
 * Returns false if the saved file is dangerous (wrong/spoofed type, XSS risk).
 * @param {string} filePath - Absolute path to the saved file
 * @param {string} originalName - Original filename supplied by the client
 */
async function isFileSafe(filePath, originalName) {
  // 1. Reject known-dangerous extensions (text-based formats with no magic bytes)
  const ext = path.extname(originalName || "").toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) return false;

  // 2. Read the first 512 bytes and scan for dangerous markup / shebang patterns
  try {
    const buf = Buffer.alloc(512);
    const fd = fs.openSync(filePath, "r");
    const bytesRead = fs.readSync(fd, buf, 0, 512, 0);
    fs.closeSync(fd);
    const header = buf.slice(0, bytesRead).toString("latin1");
    for (const pattern of DANGEROUS_BYTE_PATTERNS) {
      if (pattern.test(header)) return false;
    }
  } catch {
    return false; // unreadable file → reject
  }

  // 3. Check detected MIME from magic bytes for known-dangerous binary formats
  const result = await fileTypeFromFile(filePath);
  if (result && BLOCKED_DETECTED_MIMES.has(result.mime)) return false;

  return true;
}

/**
 * Wraps multer DiskStorage to run isFileSafe() immediately after each file
 * is written to disk. Deletes the file and calls back with an error if the
 * content check fails, so no route handler sees the dangerous file.
 */
class SafeDiskStorage {
  constructor(opts) {
    this._inner = multer.diskStorage(opts);
  }

  _handleFile(req, file, cb) {
    this._inner._handleFile(req, file, async (err, info) => {
      if (err) return cb(err);
      const safe = await isFileSafe(info.path, file.originalname).catch(() => false);
      if (!safe) {
        fs.unlink(info.path, () => {});
        return cb(new Error("File type not allowed"));
      }
      cb(null, info);
    });
  }

  _removeFile(req, file, cb) {
    this._inner._removeFile(req, file, cb);
  }
}

const storage = new SafeDiskStorage({
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
        false,
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
      false,
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
      false,
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

  // Allow various file types for 'brochure' field (announcements)
  if (file.fieldname === "brochure") {
    const name = file.originalname || "";
    const ext = name.toLowerCase().split(".").pop();
    const allowedExts = new Set([
      "pdf",
      "png",
      "jpg",
      "jpeg",
      "doc",
      "docx",
      "ppt",
      "pptx",
    ]);
    const allowedMimes = new Set([
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/x-png",
      "image/pjpeg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ]);
    if (allowedMimes.has(file.mimetype) || allowedExts.has(ext)) {
      return cb(null, true);
    }
    return cb(
      new Error(
        "Invalid brochure file type. Please upload PDF, images, or Office documents",
      ),
      false,
    );
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
