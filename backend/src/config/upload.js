// src/config/upload.js
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileTypeFromFile } from "file-type";
import NodeClam from "clamscan";
import dotenv from "dotenv";
import logger from "../utils/logger.js";
import { getTraceCtx } from "../utils/traceStore.js";
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
      "FILE_STORAGE_PATH environment variable is REQUIRED in production. " +
        "Use absolute paths for production deployments (e.g., /var/www/drms/uploads)",
    );
  }
  STORAGE_PATH = process.env.FILE_STORAGE_PATH;
  logger.info("File storage configured (production)", { "file.storage.path": STORAGE_PATH });
} else {
  STORAGE_PATH = process.env.FILE_STORAGE_PATH || "./uploads";
  if (!process.env.FILE_STORAGE_PATH) {
    logger.warn("FILE_STORAGE_PATH not set, using default", { "file.storage.path": STORAGE_PATH });
  } else {
    logger.info("File storage configured (development)", { "file.storage.path": STORAGE_PATH });
  }
}

// Resolve to absolute path
STORAGE_PATH = path.resolve(STORAGE_PATH);

const MAX_MB = Number(process.env.FILE_SIZE_LIMIT_MB || 50);
const MAX_BYTES = MAX_MB * 1024 * 1024;
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
      logger.info("Creating file storage directory", { "file.storage.path": STORAGE_PATH });
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

    logger.info("File storage verified", {
      "file.storage.path": STORAGE_PATH,
      "file.storage.permissions": "read/write OK",
      "file.storage.max_size_mb": MAX_MB,
    });

    return true;
  } catch (err) {
    if (IS_PRODUCTION) {
      // In production, fail fast
      throw err;
    } else {
      // In development, warn but allow startup
      logger.error("File storage verification failed — uploads may not work correctly", { err });
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

// Extensions that enable XSS or server-side execution when served statically,
// plus scripts and installers with no reliable magic-byte signature (many of
// these are plain text, so BLOCKED_DETECTED_MIMES below can't catch them —
// extension is the only signal available).
const BLOCKED_EXTENSIONS = new Set([
  ".html", ".htm", ".xhtml",
  ".svg", ".svgz",
  ".js", ".mjs", ".cjs", ".jsx",
  ".ts", ".tsx",
  ".php", ".php3", ".php4", ".php5", ".phtml",
  ".asp", ".aspx", ".jsp", ".jspx",
  ".sh", ".bash", ".zsh",
  ".py", ".rb", ".pl", ".cgi",
  // Windows scripts
  ".bat", ".cmd", ".vbs", ".vbe", ".jse", ".wsf", ".wsh",
  ".ps1", ".ps1xml", ".psc1", ".psm1", ".psd1",
  ".hta", ".msc", ".reg",
  // Executables and installers (also covered by magic bytes below where
  // file-type can detect them; kept here too for formats it can't, and as a
  // second layer against a mismatched/renamed extension)
  ".exe", ".dll", ".sys", ".drv", ".ocx", ".cpl", ".scr", ".com", ".pif",
  ".msi", ".msp", ".mst", ".msu", ".msix", ".appx",
  ".jar", ".apk",
  ".deb", ".rpm", ".dmg", ".pkg", ".run", ".bin",
  // Shortcuts and disk images (used to smuggle payloads past extension/AV checks)
  ".lnk", ".url", ".iso", ".img", ".vhd", ".vhdx",
]);

// MIME types detected from magic bytes that are always rejected.
// Verified against the installed file-type@21.3.0's supportedMimeTypes —
// that library's detected strings change between major versions, and three
// entries here (x-executable, x-sharedlib, x-dex) were stale leftovers from
// an older version that this version never actually emits, so those checks
// were silently doing nothing. Re-verify this list after any file-type bump.
const BLOCKED_DETECTED_MIMES = new Set([
  "application/x-msdownload",              // Windows PE / EXE, DLL
  "application/x-elf",                     // Linux ELF binaries/shared libs
  "application/x-mach-binary",             // macOS Mach-O binaries
  "application/vnd.android.package-archive", // APK
  "application/java-archive",              // JAR
  "application/x-rpm",                     // RPM package
  "application/x-deb",                     // Debian package
  "application/x-apple-diskimage",         // DMG
  "application/x.ms.shortcut",             // Windows .lnk
  // Macro-enabled Office documents — macros are executable code
  "application/vnd.ms-word.document.macroenabled.12",
  "application/vnd.ms-word.template.macroenabled.12",
  "application/vnd.ms-excel.sheet.macroenabled.12",
  "application/vnd.ms-excel.template.macroenabled.12",
  "application/vnd.ms-powerpoint.presentation.macroenabled.12",
  "application/vnd.ms-powerpoint.template.macroenabled.12",
]);

// Byte-level patterns at the head of a file that indicate dangerous text content.
// file-type cannot detect text-based formats (HTML, SVG, PHP) from magic bytes,
// so we scan the first 512 bytes of every uploaded file.
// Deliberately unanchored: these test the already-bounded 512-byte header
// (see isFileSafe below), not the exact start of it — a `^`-anchored version
// is defeated by a single leading blank line, space, or BOM before the tag.
const DANGEROUS_BYTE_PATTERNS = [
  /<!doctype\s+html/i,
  /<html[\s>]/i,
  /<script[\s>]/i,
  /<\?php/i,
  /<svg[\s>]/i,
];

// ============================================================================
// ANTIVIRUS SCANNING (ClamAV via clamd)
// ============================================================================
// Lazily initialized on first use, NOT at module load -- a top-level await
// here would mean the entire app fails to boot if clamd isn't accepting
// connections at the exact moment this module loads (e.g. on a host reboot,
// where systemd gives no guarantee the app starts after clamd). Scans go
// through the clamd daemon over its local unix socket, not the clamscan
// binary directly -- the daemon keeps virus signatures loaded in memory, so
// a scan is milliseconds instead of the multi-second startup cost of
// spawning clamscan per file. localFallback lets the clamscan binary pick
// up the scan if the daemon is ever unreachable.
//
// Requires ClamAV installed at the OS level on whatever host this runs on
// (clamd + clamav-freshclam packages, EPEL on RHEL/Rocky), with clamd
// configured to listen on /run/clamd.scan/clamd.sock and the app's runtime
// user in the socket's group. See deployment docs for setup steps.
// ============================================================================
// ANTIVIRUS (ClamAV) - opt-in via ENABLE_CLAMSCAN=true
// ============================================================================
// ClamAV clamd is a Linux-only daemon. On Windows / dev environments it is
// typically not installed. Setting ENABLE_CLAMSCAN=true requires clamd to be
// running at /run/clamd.scan/clamd.sock.  When disabled (the default) the
// other three content-safety checks (extension blocklist, byte-pattern scan,
// MIME detection from magic bytes) still run and cover the most common threats.
// ============================================================================
export const CLAMSCAN_ENABLED = process.env.ENABLE_CLAMSCAN === "true";

let clamscanPromise = null;
export function getClamscan() {
  if (!clamscanPromise) {
    clamscanPromise = new NodeClam().init({
      clamdscan: {
        socket: "/run/clamd.scan/clamd.sock",
        timeout: 60000,
        localFallback: true,
      },
    });
  }
  return clamscanPromise;
}

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

  // 4. Antivirus scan via ClamAV (clamd) — only when explicitly enabled.
  //    Disabled by default so development environments without clamd installed
  //    don't reject every upload with a 400.  Enable in production by setting
  //    ENABLE_CLAMSCAN=true in the environment after installing ClamAV.
  if (CLAMSCAN_ENABLED) {
    try {
      const clamscan = await getClamscan();
      const { isInfected, viruses } = await clamscan.isInfected(filePath);
      if (isInfected !== false) {
        logger.warn("file.upload.virus_scan_rejected", {
          "file.name": originalName,
          "file.viruses": viruses,
        });
        return false;
      }
    } catch (err) {
      // Reset so the next upload gets a fresh init attempt instead of
      // being stuck reusing this same rejected promise forever.
      clamscanPromise = null;
      logger.error("file.upload.virus_scan_error", { err });
      // In production (ENABLE_CLAMSCAN=true) a scan failure is treated as
      // a rejection (fail-closed).  The operator should fix clamd.
      return false;
    }
  } else {
    logger.debug("file.upload.virus_scan_skipped", {
      "file.name": originalName,
      reason: "ENABLE_CLAMSCAN not set",
    });
  }

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
    const ctx = getTraceCtx();
    const uploadMeta = {
      "file.name": file.originalname,
      "file.field": file.fieldname,
      "file.mime_type": file.mimetype,
    };
    const startNs = process.hrtime.bigint();

    logger.debug("file.upload.start", { ...uploadMeta, ...ctx });

    this._inner._handleFile(req, file, async (err, info) => {
      if (err) {
        const durationMs = Math.round(Number(process.hrtime.bigint() - startNs) / 1_000_000 * 100) / 100;
        logger.error("file.upload.error", {
          err,
          ...uploadMeta,
          "event.duration_ms": durationMs,
          ...ctx,
        });
        return cb(err);
      }

      const safe = await isFileSafe(info.path, file.originalname).catch(() => false);
      if (!safe) {
        const durationMs = Math.round(Number(process.hrtime.bigint() - startNs) / 1_000_000 * 100) / 100;
        fs.unlink(info.path, () => {});
        logger.warn("file.upload.rejected", {
          ...uploadMeta,
          "event.duration_ms": durationMs,
          "file.rejection_reason": "unsafe_content",
          ...ctx,
        });
        return cb(new Error("File type not allowed"));
      }

      const durationMs = Math.round(Number(process.hrtime.bigint() - startNs) / 1_000_000 * 100) / 100;
      logger.info("file.upload.complete", {
        ...uploadMeta,
        "event.duration_ms": durationMs,
        "file.size": info.size,
        "file.stored_name": info.filename,
        ...ctx,
      });

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
  // 'proof' is used for faculty-participation and achievement proof documents,
  // as well as generic proof fields elsewhere — restrict all of them to PDFs
  // and images only.
  if (file.fieldname === "proof") {
    const name = file.originalname || "";
    const ext = name.toLowerCase().split(".").pop();
    const extOk = ["pdf", "png", "jpg", "jpeg"].includes(ext);
    if (proofAllowedMimes.has(file.mimetype) || extOk) return cb(null, true);
    return cb(new Error("Invalid proof file type"), false);
  }

  // 'certificate' (achievements) — restrict to PDFs and images only.
  if (file.fieldname === "certificate") {
    const name = file.originalname || "";
    const ext = name.toLowerCase().split(".").pop();
    const extOk = ["pdf", "png", "jpg", "jpeg"].includes(ext);
    if (proofAllowedMimes.has(file.mimetype) || extOk) return cb(null, true);
    return cb(new Error("Invalid certificate file type"), false);
  }

  // 'event_photos' (achievements) — images only.
  if (file.fieldname === "event_photos") {
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
    // 'files' is only mounted on project routes today. Fail closed rather
    // than allow-all for any future route that reuses this field name.
    return cb(new Error("'files' uploads are only supported for projects"), false);
  }

  // Allow PDFs and all images for 'attachments' (events)
  if (file.fieldname === "attachments") {
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      return cb(null, true);
    }
    return cb(new Error("File type not allowed"), false);
  }

  // Allow all image types for 'thumbnail' field (event thumbnails)
  if (file.fieldname === "thumbnail") {
    if (file.mimetype.startsWith("image/")) {
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

  // Allow CSV/Excel for 'staff_file' field (staff batch uploads)
  if (file.fieldname === "staff_file") {
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
      new Error("Only CSV or Excel files are allowed for staff uploads."),
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

  // No rule above matched this field. Every field actually wired up in the
  // routes has an explicit rule, so reaching here means a new upload field
  // was added without one — fail closed instead of silently accepting
  // anything, and log so it's visible immediately.
  logger.warn("file.upload.unrecognized_field", { "file.fieldname": file.fieldname });
  return cb(new Error(`Uploads are not configured for field "${file.fieldname}"`), false);
}

export { STORAGE_PATH };

export const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter,
});

// Special upload for faculty participation/research proof documents, with a
// 15MB limit. Restricted to PDFs and images, same as the 'proof' rule in the
// main fileFilter above — this is a separate multer instance for a higher
// size limit, not a separate file-type policy.
export const uploadFacultyProof = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const name = file.originalname || "";
    const ext = name.toLowerCase().split(".").pop();
    const extOk = ["pdf", "png", "jpg", "jpeg"].includes(ext);
    if (proofAllowedMimes.has(file.mimetype) || extOk) return cb(null, true);
    return cb(new Error("Invalid proof file type"), false);
  },
});
