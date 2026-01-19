// src/controllers/projectController.js
import pool from "../config/db.js";
import { upload } from "../config/upload.js";
import path from "path";
import fs from "fs";

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
              otherFiles[i].filename
            )
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
              zip.filename
            )
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
              zip.filename
            )
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
      return res
        .status(400)
        .json({ message: "SRS document (PDF) is required." });
    }

    // Require GitHub URL and perform a basic validation (must be a GitHub link)
    if (!github_url || typeof github_url !== "string" || !github_url.trim()) {
      return res.status(400).json({ message: "github_url is required" });
    }
    const gh = github_url.trim();
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/.+/i;
    if (!githubPattern.test(gh)) {
      return res
        .status(400)
        .json({ message: "github_url must be a valid GitHub link" });
    }

    // duplicate check (title + mentor_name + year)
    const { rows: dup } = await pool.query(
      "SELECT id FROM projects WHERE title=$1 AND mentor_name=$2 AND academic_year=$3",
      [title.trim(), mentor_name.trim(), academic_year || null]
    );
    if (dup.length)
      return res.status(409).json({
        message: "Project with same title, mentor and year already exists",
      });

    // If staff/admin creator, auto-approve the project
    const isStaff = req.user?.role === "staff" || req.user?.role === "admin";
    let insertSql = `INSERT INTO projects (title, description, mentor_name, academic_year, status, created_by, team_members_count, team_member_names, github_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`;
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
    ];
    if (isStaff) {
      insertSql = `INSERT INTO projects (title, description, mentor_name, academic_year, status, created_by, team_members_count, team_member_names, github_url, verified, verification_status, verified_by, verified_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, true, 'approved', $10, NOW()) RETURNING *`;
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
        created_by || null,
      ];
    }
    const { rows } = await pool.query(insertSql, insertParams);
    const project = rows[0];

    // handle uploaded files if any
    const insertedFiles = [];
    for (const f of files) {
      const fileType = detectFileTypeByField(f.fieldname);
      const { rows: ins } = await pool.query(
        `INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          project.id,
          f.filename,
          f.originalname,
          f.mimetype,
          f.size,
          fileType,
          created_by || null,
        ]
      );
      if (ins && ins[0]) insertedFiles.push(ins[0]);
    }

    // Persist a summary of files into projects.files JSONB for easy viewing
    const { rows: pf } = await pool.query(
      "SELECT id, filename, original_name, mime_type, size, file_type, uploaded_at FROM project_files WHERE project_id=$1 ORDER BY id ASC",
      [project.id]
    );
    await pool.query("UPDATE projects SET files = $2 WHERE id = $1", [
      project.id,
      JSON.stringify(pf),
    ]);

    return res
      .status(201)
      .json({ message: "Project created", project: { ...project, files: pf } });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
}

export async function uploadFilesToProject(req, res) {
  // route: POST /projects/:id/files
  try {
    const projectId = Number(req.params.id);
    if (!Number.isInteger(projectId) || Number.isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project id" });
    }
    const projectQ = await pool.query("SELECT id FROM projects WHERE id=$1", [
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
              otherFiles[i].filename
            )
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
              zip.filename
            )
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
              zip.filename
            )
          );
        } catch {}
        return res
          .status(400)
          .json({ message: "Zip file must be 15MB or smaller." });
      }
    }
    const files = [...srsFiles, ...otherFiles];
    for (const f of files) {
      const fileType = detectFileTypeByField(f.fieldname);
      await pool.query(
        `INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          projectId,
          f.filename,
          f.originalname,
          f.mimetype,
          f.size,
          fileType,
          req.user?.id || null,
        ]
      );
    }

    // Update projects.files JSONB summary
    const { rows: pf } = await pool.query(
      "SELECT id, filename, original_name, mime_type, size, file_type, uploaded_at FROM project_files WHERE project_id=$1 ORDER BY id ASC",
      [projectId]
    );
    await pool.query("UPDATE projects SET files = $2 WHERE id = $1", [
      projectId,
      JSON.stringify(pf),
    ]);

    return res.json({
      message: "Files uploaded",
      count: files.length,
      files: pf,
    });
  } catch (err) {
    console.error(err);
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

    // Include uploader info for list items (created_by or first file's uploaded_by)
    let base =
      "SELECT p.*, " +
      "COALESCE(u.full_name, up.full_name) AS uploader_full_name, " +
      "COALESCE(u.email, up.email) AS uploader_email, " +
      "COALESCE(u.role, up.role) AS uploader_role, " +
      "v.full_name AS verified_by_fullname, v.email AS verified_by_email " +
      "FROM projects p " +
      "LEFT JOIN users u ON u.id = p.created_by " +
      "LEFT JOIN LATERAL (" +
      "  SELECT u2.full_name, u2.email, u2.role FROM project_files pf " +
      "  LEFT JOIN users u2 ON u2.id = pf.uploaded_by " +
      "  WHERE pf.project_id = p.id AND pf.uploaded_by IS NOT NULL " +
      "  ORDER BY pf.id ASC LIMIT 1" +
      ") up ON true " +
      "LEFT JOIN users v ON v.id = p.verified_by";
    const conditions = [];
    const params = [];

    // If not authenticated, only show verified projects
    if (!requesterId) {
      conditions.push(`p.verified = true`);
    }

    if (requesterRole === "staff" && requesterId) {
      base += ` LEFT JOIN activity_coordinators ac ON ac.activity_type = p.activity_type AND ac.staff_id = $${
        params.length + 1
      }`;
      params.push(requesterId);
      conditions.push(`ac.id IS NOT NULL`);
    }

    if (year) {
      params.push(year);
      conditions.push(`p.academic_year = $${params.length}`);
    }
    if (mentor_name) {
      params.push(mentor_name);
      conditions.push(`p.mentor_name = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`p.status = $${params.length}`);
    }
    if (verified !== undefined) {
      params.push(verified === "true");
      conditions.push(`p.verified = $${params.length}`);
    }
    // allow filtering by verification_status via query param `verification_status`
    if (req.query.verification_status) {
      params.push(req.query.verification_status);
      conditions.push(`p.verification_status = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(
        `(p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`
      );
    }
    if (mine !== undefined && mine !== "false" && req.user?.id) {
      params.push(req.user.id);
      conditions.push(`p.created_by = $${params.length}`);
    }

    if (conditions.length) base += " WHERE " + conditions.join(" AND ");
    params.push(Number(limit));
    params.push(Number(offset));
    base += ` ORDER BY p.created_at DESC LIMIT $${params.length - 1} OFFSET $${
      params.length
    }`;

    const { rows } = await pool.query(base, params);
    return res.json({ projects: rows });
  } catch (err) {
    console.error(err);
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
      // Staff should only access projects for activity types they coordinate
      const { rows: auth } = await pool.query(
        `SELECT 1 FROM projects p
           JOIN activity_coordinators ac
             ON ac.activity_type = p.activity_type AND ac.staff_id = $1
          WHERE p.id = $2`,
        [requesterId, id]
      );
      if (!auth.length) {
        return res
          .status(403)
          .json({ message: "Not authorized to view this project" });
      }
    }

    const { rows } = await pool.query(
      `SELECT p.*, u.email AS uploader_email, u.full_name AS uploader_full_name
         FROM projects p
         LEFT JOIN users u ON u.id = p.created_by
        ${whereClause}`,
      params
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    const project = rows[0];
    const { rows: files } = await pool.query(
      "SELECT * FROM project_files WHERE project_id=$1 ORDER BY id ASC",
      [id]
    );

    project.files = files;
    // Fallback uploader from first file if project.created_by is null
    if (!project.uploader_email || !project.uploader_full_name) {
      const { rows: up } = await pool.query(
        `SELECT u.email AS uploader_email, u.full_name AS uploader_full_name
           FROM project_files pf
           LEFT JOIN users u ON u.id = pf.uploaded_by
          WHERE pf.project_id = $1 AND pf.uploaded_by IS NOT NULL
          ORDER BY pf.id ASC LIMIT 1`,
        [id]
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
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function verifyProject(req, res) {
  // Staff/Admin approves a project
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || Number.isNaN(id))
      return res.status(400).json({ message: "Invalid project id" });
    const requesterRole = req.user?.role;
    const requesterId = req.user?.id;
    if (requesterRole === "staff" && requesterId) {
      const { rows: auth } = await pool.query(
        `SELECT 1 FROM projects p
          JOIN activity_coordinators ac
            ON ac.activity_type = p.activity_type AND ac.staff_id = $1
         WHERE p.id = $2`,
        [requesterId, id]
      );
      if (!auth.length) {
        return res
          .status(403)
          .json({ message: "Not authorized to approve this project" });
      }
    }
    await pool.query(
      "UPDATE projects SET verified = true, verification_status='approved', verified_by=$2, verified_at=NOW() WHERE id=$1",
      [id, req.user?.id || null]
    );
    return res.json({ message: "Project approved" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function rejectProject(req, res) {
  // Staff/Admin rejects a project
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || Number.isNaN(id))
      return res.status(400).json({ message: "Invalid project id" });
    const requesterRole = req.user?.role;
    const requesterId = req.user?.id;
    if (requesterRole === "staff" && requesterId) {
      const { rows: auth } = await pool.query(
        `SELECT 1 FROM projects p
          JOIN activity_coordinators ac
            ON ac.activity_type = p.activity_type AND ac.staff_id = $1
         WHERE p.id = $2`,
        [requesterId, id]
      );
      if (!auth.length) {
        return res
          .status(403)
          .json({ message: "Not authorized to reject this project" });
      }
    }
    await pool.query(
      "UPDATE projects SET verified = false, verification_status='rejected', verified_by=$2, verified_at=NOW() WHERE id=$1",
      [id, req.user?.id || null]
    );
    return res.json({ message: "Project rejected" });
  } catch (err) {
    console.error(err);
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
      const { rows } = await pool.query(
        "SELECT COUNT(*)::int AS count FROM projects WHERE verified = $1",
        [val]
      );
      return res.json({ count: rows[0]?.count ?? 0 });
    }
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM projects WHERE verified = true OR verification_status = 'approved'"
    );
    return res.json({ count: rows[0]?.count ?? 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
