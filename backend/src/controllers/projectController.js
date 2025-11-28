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

    // Files are optional now
    const files = req.files || [];

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

    const files = req.files || [];
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
    let base = "SELECT p.* FROM projects p";
    const conditions = [];
    const params = [];

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
    if (req.query.status) {
      params.push(req.query.status);
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
    const { rows } = await pool.query(
      `SELECT p.* FROM projects p WHERE p.id = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    const project = rows[0];
    const { rows: files } = await pool.query(
      "SELECT * FROM project_files WHERE project_id=$1",
      [id]
    );

    project.files = files;
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
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM projects"
    );
    return res.json({ count: rows[0]?.count ?? 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
