// src/controllers/projectController.js
import pool from "../config/db.js";
import { upload } from "../config/upload.js";
import path from "path";
import fs from "fs";
import logger, { reqContext } from "../utils/logger.js";
import { QueryBuilder } from "../utils/queryBuilder.js";
import { reviewProject, ReviewError } from "../services/reviewService.js";
import { tracedQuery } from "../utils/tracing.js";
import {
  ActivityTypeValidationError,
  requireActivityTypeByName,
} from "../utils/activityTypeUtils.js";

// Note: 'upload' is multer instance exported above
// We'll expose middleware usage in routes.

export async function createProject(req, res) {
  // route expects multipart/form-data with possible files
  // fields: title, description, mentor_name, academic_year, status, team_members (comma separated names)
  try {
    const {
      title,
      description,
      mentor_name,
      academic_year,
      status,
      team_members_count,
      team_member_names,
      github_url,
      activity_type,
    } = req.body;
    const created_by = req.user?.id;

    if (!title || !mentor_name || !mentor_name.trim())
      return res
        .status(400)
        .json({ message: "title and mentor_name required" });

    // Collect uploaded files from multiple fields
    const fieldFiles = req.files || {};
    const srsFiles = Array.isArray(fieldFiles.srs_document)
      ? fieldFiles.srs_document
      : [];
    const otherFiles = Array.isArray(fieldFiles.files) ? fieldFiles.files : [];
    // Enforce: optional single ZIP in 'files' with size <= 15MB
    if (otherFiles.length > 1) {
      // Clean up uploaded extras just in case
      for (let i = 1; i < otherFiles.length; i++) {
        try {
          fs.unlinkSync(
            path.resolve(
              process.env.FILE_STORAGE_PATH || "./uploads",
              otherFiles[i].filename,
            ),
          );
        } catch {}
      }
      return res
        .status(400)
        .json({ message: "Only one ZIP attachment is allowed." });
    }
    if (otherFiles.length === 1) {
      const zip = otherFiles[0];
      const ext = path.extname(zip.originalname || "").toLowerCase();
      const isZipMime =
        zip.mimetype === "application/zip" ||
        zip.mimetype === "application/x-zip-compressed";
      const sizeLimit = 15 * 1024 * 1024;
      if (!(isZipMime || ext === ".zip")) {
        // delete invalid file
        try {
          fs.unlinkSync(
            path.resolve(
              process.env.FILE_STORAGE_PATH || "./uploads",
              zip.filename,
            ),
          );
        } catch {}
        return res
          .status(400)
          .json({ message: "Attach files must be a .zip archive." });
      }
      if (zip.size > sizeLimit) {
        try {
          fs.unlinkSync(
            path.resolve(
              process.env.FILE_STORAGE_PATH || "./uploads",
              zip.filename,
            ),
          );
        } catch {}
        return res
          .status(400)
          .json({ message: "Zip file must be 15MB or smaller." });
      }
    }
    const files = [...srsFiles, ...otherFiles];

    // Enforce mandatory SRS on creation
    if (srsFiles.length === 0) {
      for (const f of otherFiles) {
        try { fs.unlinkSync(path.resolve(process.env.FILE_STORAGE_PATH || "./uploads", f.filename)); } catch {}
      }
      return res
        .status(400)
        .json({ message: "SRS document (PDF) is required." });
    }

    // Require GitHub URL and perform a basic validation (must be a GitHub link)
    if (!github_url || typeof github_url !== "string" || !github_url.trim()) {
      for (const f of files) {
        try { fs.unlinkSync(path.resolve(process.env.FILE_STORAGE_PATH || "./uploads", f.filename)); } catch {}
      }
      return res.status(400).json({ message: "github_url is required" });
    }
    const gh = github_url.trim();
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/.+/i;
    if (!githubPattern.test(gh)) {
      for (const f of files) {
        try { fs.unlinkSync(path.resolve(process.env.FILE_STORAGE_PATH || "./uploads", f.filename)); } catch {}
      }
      return res
        .status(400)
        .json({ message: "github_url must be a valid GitHub link" });
    }

    // Check if GitHub URL already exists (prevent duplicate team submissions) — before any DB writes
    if (gh) {
      const { rows: githubDup } = await tracedQuery(
        pool,
        "SELECT id, title, team_member_names, created_by FROM projects WHERE LOWER(TRIM(github_url)) = LOWER(TRIM($1))",
        [gh],
      );
      if (githubDup.length) {
        for (const f of files) {
          try { fs.unlinkSync(path.resolve(process.env.FILE_STORAGE_PATH || "./uploads", f.filename)); } catch {}
        }
        const existingProject = githubDup[0];
        return res.status(409).json({
          message:
            "Your team has already uploaded this project. GitHub URL must be unique.",
          existingProject: {
            id: existingProject.id,
            title: existingProject.title,
            team_members: existingProject.team_member_names,
          },
        });
      }
    }

    // duplicate check (title + mentor_name + year) — before any DB writes
    const { rows: dup } = await tracedQuery(
      pool,
      "SELECT id FROM projects WHERE title=$1 AND mentor_name=$2 AND academic_year=$3",
      [title.trim(), mentor_name.trim(), academic_year || null],
    );
    if (dup.length) {
      for (const f of files) {
        try { fs.unlinkSync(path.resolve(process.env.FILE_STORAGE_PATH || "./uploads", f.filename)); } catch {}
      }
      return res.status(409).json({
        message: "Project with same title, mentor and year already exists",
      });
    }

    const activityTypeRow = await requireActivityTypeByName(
      pool,
      (activity_type || "project").trim(),
      "activity_type",
    );

    // If staff/admin creator, auto-approve the project
    const isStaff = req.user?.role === "staff" || req.user?.role === "admin";
    let insertSql = `INSERT INTO projects (title, description, mentor_name, academic_year, status, created_by, team_members_count, team_member_names, github_url, activity_type_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`;
    let insertParams = [
      title.trim(),
      description || null,
      mentor_name.trim(),
      academic_year || null,
      status || "ongoing",
      created_by || null,
      team_members_count ? Number(team_members_count) : null,
      team_member_names || null,
      gh,
      activityTypeRow.id,
    ];
    if (isStaff) {
      insertSql = `INSERT INTO projects (title, description, mentor_name, academic_year, status, created_by, team_members_count, team_member_names, github_url, activity_type_id, verified, verification_status, verified_by, verified_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, true, 'approved', $11, NOW()) RETURNING *`;
      insertParams = [
        title.trim(),
        description || null,
        mentor_name.trim(),
        academic_year || null,
        status || "ongoing",
        created_by || null,
        team_members_count ? Number(team_members_count) : null,
        team_member_names || null,
        gh,
        activityTypeRow.id,
        created_by || null,
      ];
    }
    const client = await pool.connect();
    const txStartNs = process.hrtime.bigint();
    logger.info("project.create.start", {
      "project.title": title.trim(),
      "project.file_count": files.length,
      ...reqContext(req),
    });
    try {
      await client.query("BEGIN");

      const { rows } = await tracedQuery(client, insertSql, insertParams);
      const project = rows[0];

      // handle uploaded files if any
      for (const f of files) {
        const fileType = detectFileTypeByField(f.fieldname);
        await tracedQuery(
          client,
          `INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [project.id, f.filename, f.originalname, f.mimetype, f.size, fileType, created_by || null],
        );
      }

      // Persist a summary of files into projects.files JSONB for easy viewing
      const { rows: pf } = await tracedQuery(
        client,
        "SELECT id, filename, original_name, mime_type, size, file_type, uploaded_at FROM project_files WHERE project_id=$1 ORDER BY id ASC",
        [project.id],
      );
      await tracedQuery(client, "UPDATE projects SET files = $2 WHERE id = $1", [
        project.id,
        JSON.stringify(pf),
      ]);

      await client.query("COMMIT");
      const durationMs = Math.round(Number(process.hrtime.bigint() - txStartNs) / 1_000_000 * 100) / 100;
      logger.info("project.create.complete", {
        "project.id": project.id,
        "project.title": project.title,
        "project.file_count": pf.length,
        "event.duration_ms": durationMs,
        ...reqContext(req),
      });
      return res
        .status(201)
        .json({
          message: "Project created",
          project: { ...project, files: pf, activity_type: activityTypeRow.name },
        });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (err instanceof ActivityTypeValidationError) {
      const fieldFiles = req.files || {};
      const srsFiles = Array.isArray(fieldFiles.srs_document)
        ? fieldFiles.srs_document
        : [];
      const otherFiles = Array.isArray(fieldFiles.files) ? fieldFiles.files : [];
      for (const f of [...srsFiles, ...otherFiles]) {
        try {
          fs.unlinkSync(
            path.resolve(
              process.env.FILE_STORAGE_PATH || "./uploads",
              f.filename,
            ),
          );
        } catch {
          // Ignore cleanup failures.
        }
      }
      return res.status(err.status).json({ message: err.message });
    }
    logger.error("Project controller error", { err,
      ...reqContext(req) });
    return res
      .status(500)
      .json({ message: "Server error", ...(process.env.NODE_ENV !== "production" && { error: err.message }) });
  }
}

export async function uploadFilesToProject(req, res) {
  // route: POST /projects/:id/files
  try {
    const projectId = Number(req.params.id);
    if (!Number.isInteger(projectId) || Number.isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project id" });
    }
    const projectQ = await tracedQuery(pool, "SELECT id FROM projects WHERE id=$1", [
      projectId,
    ]);
    if (!projectQ.rows.length)
      return res.status(404).json({ message: "Project not found" });

    const fieldFiles = req.files || {};
    const srsFiles = Array.isArray(fieldFiles.srs_document)
      ? fieldFiles.srs_document
      : [];
    const otherFiles = Array.isArray(fieldFiles.files) ? fieldFiles.files : [];
    // Enforce ZIP-only and 15MB limit for attachments
    if (otherFiles.length > 1) {
      for (let i = 1; i < otherFiles.length; i++) {
        try {
          fs.unlinkSync(
            path.resolve(
              process.env.FILE_STORAGE_PATH || "./uploads",
              otherFiles[i].filename,
            ),
          );
        } catch {}
      }
      return res
        .status(400)
        .json({ message: "Only one ZIP attachment is allowed." });
    }
    if (otherFiles.length === 1) {
      const zip = otherFiles[0];
      const ext = path.extname(zip.originalname || "").toLowerCase();
      const isZipMime =
        zip.mimetype === "application/zip" ||
        zip.mimetype === "application/x-zip-compressed";
      const sizeLimit = 15 * 1024 * 1024;
      if (!(isZipMime || ext === ".zip")) {
        try {
          fs.unlinkSync(
            path.resolve(
              process.env.FILE_STORAGE_PATH || "./uploads",
              zip.filename,
            ),
          );
        } catch {}
        return res
          .status(400)
          .json({ message: "Attach files must be a .zip archive." });
      }
      if (zip.size > sizeLimit) {
        try {
          fs.unlinkSync(
            path.resolve(
              process.env.FILE_STORAGE_PATH || "./uploads",
              zip.filename,
            ),
          );
        } catch {}
        return res
          .status(400)
          .json({ message: "Zip file must be 15MB or smaller." });
      }
    }
    const files = [...srsFiles, ...otherFiles];

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const f of files) {
        const fileType = detectFileTypeByField(f.fieldname);
        await tracedQuery(client, 
          `INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [projectId, f.filename, f.originalname, f.mimetype, f.size, fileType, req.user?.id || null],
        );
      }

      // Update projects.files JSONB summary
      const { rows: pf } = await tracedQuery(client, 
        "SELECT id, filename, original_name, mime_type, size, file_type, uploaded_at FROM project_files WHERE project_id=$1 ORDER BY id ASC",
        [projectId],
      );
      await tracedQuery(client, "UPDATE projects SET files = $2 WHERE id = $1", [
        projectId,
        JSON.stringify(pf),
      ]);

      await client.query("COMMIT");
      return res.json({
        message: "Files uploaded",
        count: files.length,
        files: pf,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error("Project controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listProjects(req, res) {
  // optional query filters: year, mentor_id, status, verified
  const {
    year,
    mentor_name,
    status,
    verified,
    q,
    limit = 20,
    offset = 0,
    mine,
  } = req.query;
  try {
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;

    // Fixed JOINs live in the base string; the conditional staff JOIN is added
    // via qb.addJoin() so QueryBuilder can always emit all JOINs before WHERE.
    const qb = new QueryBuilder(
      "SELECT p.*, at.name AS activity_type, " +
      "COALESCE(u.full_name, up.full_name) AS uploader_full_name, " +
      "COALESCE(u.email, up.email) AS uploader_email, " +
      "COALESCE(u.role, up.role) AS uploader_role, " +
      "v.full_name AS verified_by_fullname, v.email AS verified_by_email " +
      "FROM projects p " +
      "LEFT JOIN activity_types at ON at.id = p.activity_type_id " +
      "LEFT JOIN users u ON u.id = p.created_by " +
      "LEFT JOIN LATERAL (" +
      "  SELECT u2.full_name, u2.email, u2.role FROM project_files pf " +
      "  LEFT JOIN users u2 ON u2.id = pf.uploaded_by " +
      "  WHERE pf.project_id = p.id AND pf.uploaded_by IS NOT NULL " +
      "  ORDER BY pf.id ASC LIMIT 1" +
      ") up ON true " +
      "LEFT JOIN users v ON v.id = p.verified_by",
    );

    // Check if viewing verified/approved projects (not in management mode)
    const isViewingVerified =
      verified === "true" ||
      req.query.verification_status === "approved" ||
      req.query.verification_status === "verified";

    // If not authenticated, only show verified projects
    if (!requesterId && !req.query.verification_status) {
      qb.addWhere(`p.verified = true`);
    } else if (verified === "true") {
      qb.addWhere(`p.verified = true`);
    }

    // Staff can only see projects for activity types they coordinate (only in
    // management/verification mode — not when browsing verified records).
    // addParam is called first so the placeholder is known before addJoin uses it.
    if (requesterRole === "staff" && requesterId && !isViewingVerified) {
      const staffRef = qb.addParam(requesterId);
      qb.addJoin(
        `LEFT JOIN activity_coordinators ac ON ac.activity_type_id = p.activity_type_id AND ac.staff_id = ${staffRef}`,
      );
      qb.addWhere(`ac.id IS NOT NULL`);
    }

    if (year) {
      const yearRaw = String(year).trim();
      const startYear4 = yearRaw.match(/\d{4}/)?.[0];
      const startYear2 = startYear4 ? startYear4.slice(-2) : null;
      const endYear2 = startYear4
        ? String(parseInt(startYear4) + 1).slice(-2)
        : null;

      const yearClauses = [];

      // Exact match variations for academic_year field
      yearClauses.push(`p.academic_year = ${qb.addParam(yearRaw)}`);

      if (startYear4) {
        // Match patterns like "2025-2026" or "2025-26"
        const nextYear = String(parseInt(startYear4) + 1);
        yearClauses.push(`p.academic_year = ${qb.addParam(`${startYear4}-${nextYear}`)}`);

        if (startYear2 && endYear2) {
          yearClauses.push(`p.academic_year = ${qb.addParam(`${startYear2}-${endYear2}`)}`);
        }

        // Only fallback to created_at if academic_year is NULL/empty
        yearClauses.push(
          `(p.academic_year IS NULL AND to_char(p.created_at, 'YYYY') = ${qb.addParam(startYear4)})`,
        );
      }

      qb.addWhere(`(${yearClauses.join(" OR ")})`);
    }
    if (mentor_name) {
      qb.addWhere(`p.mentor_name = ${qb.addParam(mentor_name)}`);
    }
    if (status) {
      qb.addWhere(`p.status = ${qb.addParam(status)}`);
    }
    if (verified !== undefined) {
      qb.addWhere(`p.verified = ${qb.addParam(verified === "true")}`);
    }
    // allow filtering by verification_status via query param `verification_status`
    if (req.query.verification_status) {
      qb.addWhere(`p.verification_status = ${qb.addParam(req.query.verification_status)}`);
    }
    if (q) {
      // addParam once; the returned placeholder is reused in both ILIKE arms.
      const qRef = qb.addParam(`%${q}%`);
      qb.addWhere(`(p.title ILIKE ${qRef} OR p.description ILIKE ${qRef})`);
    }
    if (mine !== undefined && mine !== "false") {
      if (!requesterId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      // Get user's full name for matching in team_member_names
      const { rows: userRows } = await tracedQuery(pool, 
        "SELECT full_name FROM users WHERE id = $1",
        [requesterId],
      );
      if (userRows.length && userRows[0].full_name) {
        const createdByRef = qb.addParam(requesterId);
        const nameRef = qb.addParam(userRows[0].full_name);
        qb.addWhere(
          `(p.created_by = ${createdByRef} OR LOWER(p.team_member_names) LIKE LOWER('%' || ${nameRef} || '%'))`,
        );
      } else {
        qb.addWhere(`p.created_by = ${qb.addParam(requesterId)}`);
      }
    }

    const limitRef = qb.addParam(Number(limit));
    const offsetRef = qb.addParam(Number(offset));
    const { text, values } = qb.build(
      `ORDER BY p.created_at DESC LIMIT ${limitRef} OFFSET ${offsetRef}`,
    );

    const { rows } = await tracedQuery(pool, text, values);
    return res.json({ projects: rows });
  } catch (err) {
    logger.error("Project controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getProjectDetails(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || Number.isNaN(id))
    return res.status(400).json({ message: "Invalid project id" });
  try {
    // Staff should only access projects for activity types they coordinate
    const requesterRole = req.user?.role;
    const requesterId = req.user?.id;

    // If not authenticated, only show verified projects
    let whereClause = "WHERE p.id = $1";
    const params = [id];
    if (!requesterId) {
      whereClause += " AND p.verified = true";
    } else if (requesterRole === "staff" && requesterId) {
      // Staff can view:
      // 1. Projects they coordinate (activity type match)
      // 2. Any verified projects (for public viewing)
      // 3. Projects they created
      const { rows: auth } = await tracedQuery(pool, 
        `SELECT 1 FROM projects p
         WHERE p.id = $1 AND (
           p.verified = true 
           OR p.created_by = $2
           OR EXISTS (
             SELECT 1 FROM activity_coordinators ac
             WHERE ac.activity_type_id = p.activity_type_id
               AND ac.staff_id = $2
           )
         )`,
        [id, requesterId],
      );
      if (!auth.length) {
        return res
          .status(403)
          .json({ message: "Not authorized to view this project" });
      }
    }

    const { rows } = await pool.query(
      `SELECT p.*, at.name AS activity_type, u.email AS uploader_email, u.full_name AS uploader_full_name
         FROM projects p
        LEFT JOIN activity_types at ON at.id = p.activity_type_id
         LEFT JOIN users u ON u.id = p.created_by
        ${whereClause}`,
      params,
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    const project = rows[0];
    const { rows: files } = await tracedQuery(pool, 
      "SELECT * FROM project_files WHERE project_id=$1 ORDER BY id ASC",
      [id],
    );

    project.files = files;
    // Fallback uploader from first file if project.created_by is null
    if (!project.uploader_email || !project.uploader_full_name) {
      const { rows: up } = await tracedQuery(pool, 
        `SELECT u.email AS uploader_email, u.full_name AS uploader_full_name
           FROM project_files pf
           LEFT JOIN users u ON u.id = pf.uploaded_by
          WHERE pf.project_id = $1 AND pf.uploaded_by IS NOT NULL
          ORDER BY pf.id ASC LIMIT 1`,
        [id],
      );
      if (up.length) {
        project.uploader_email = project.uploader_email || up[0].uploader_email;
        project.uploader_full_name =
          project.uploader_full_name || up[0].uploader_full_name;
      }
    }
    // Compatibility fields for frontend
    project.user_email = project.uploader_email || null;
    project.user_fullname = project.uploader_full_name || null;
    return res.json({ project });
  } catch (err) {
    logger.error("Project controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function verifyProject(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || Number.isNaN(id))
    return res.status(400).json({ message: "Invalid project id" });
  try {
    const result = await reviewProject(id, req.user?.id, "approve", req.body?.comment, req.correlationId);
    return res.json(result);
  } catch (err) {
    if (err instanceof ReviewError) return res.status(err.status).json({ message: err.message });
    logger.error("Project controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function rejectProject(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || Number.isNaN(id))
    return res.status(400).json({ message: "Invalid project id" });
  try {
    const result = await reviewProject(id, req.user?.id, "reject", req.body?.comment, req.correlationId);
    return res.json(result);
  } catch (err) {
    if (err instanceof ReviewError) return res.status(err.status).json({ message: err.message });
    logger.error("Project controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}

function detectFileTypeByField(fieldname) {
  // fieldnames expected like: srs, ppt, paper, code, portal, other
  if (!fieldname) return "other";
  if (fieldname.toLowerCase().includes("srs")) return "srs";
  if (fieldname.toLowerCase().includes("ppt")) return "ppt";
  if (fieldname.toLowerCase().includes("paper")) return "paper";
  if (
    fieldname.toLowerCase().includes("code") ||
    fieldname.toLowerCase().includes("zip")
  )
    return "code_zip";
  if (fieldname.toLowerCase().includes("portal")) return "portal";
  return "other";
}

export async function getProjectsCount(req, res) {
  try {
    const { verified } = req.query;
    if (verified !== undefined) {
      const val = verified === "true";
      const { rows } = await tracedQuery(pool, 
        "SELECT COUNT(*)::int AS count FROM projects WHERE verified = $1",
        [val],
      );
      return res.json({ count: rows[0]?.count ?? 0 });
    }
    const { rows } = await tracedQuery(pool, 
      "SELECT COUNT(*)::int AS count FROM projects WHERE verified = true OR verification_status = 'approved'",
    );
    return res.json({ count: rows[0]?.count ?? 0 });
  } catch (err) {
    logger.error("Project controller error", { err,
      ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
}
