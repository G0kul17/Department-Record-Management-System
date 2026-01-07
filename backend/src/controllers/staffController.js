// staffController.js
import pool from "../config/db.js";
import { sendMail } from "../config/mailer.js";
import { getExpiryDate } from "../utils/otpGenerator.js"; // not required but available

// Approve project
export async function approveProject(req, res) {
  try {
    const staffId = req.user.id;
    const requesterRole = req.user?.role;
    const projectId = Number(req.params.id);
    const { comment } = req.body;

    // Only admins can approve any project; staff must be mapped to the project's activity_type
    if (requesterRole !== "admin") {
      const { rows: authRows } = await pool.query(
        `SELECT 1
           FROM projects p
           JOIN activity_coordinators ac
             ON ac.activity_type = p.activity_type AND ac.staff_id = $1
          WHERE p.id = $2`,
        [staffId, projectId]
      );
      if (!authRows.length) {
        return res
          .status(403)
          .json({ message: "Not authorized to approve this project" });
      }
    }

    const q = `UPDATE projects
               SET verification_status='approved',
                   verification_comment=$1,
                   verified_by=$2,
                   verified_at=NOW(),
                   verified=true
               WHERE id=$3
               RETURNING id, title, created_by`;
    const { rows } = await pool.query(q, [comment || null, staffId, projectId]);

    if (!rows.length)
      return res.status(404).json({ message: "Project not found" });

    // Optionally notify creator by email
    const creatorId = rows[0].created_by;
    if (creatorId) {
      const { rows: userRows } = await pool.query(
        "SELECT email FROM users WHERE id=$1",
        [creatorId]
      );
      if (userRows[0]) {
        try {
          await sendMail({
            to: userRows[0].email,
            subject: `Your project "${rows[0].title}" has been approved`,
            text: `Your project has been approved by staff. Comment: ${
              comment || "No comment"
            }`,
          });
        } catch (err) {
          console.error("Failed to send approval email", err);
        }
      }
    }

    return res.json({ message: "Project approved" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Reject project
export async function rejectProject(req, res) {
  try {
    const staffId = req.user.id;
    const requesterRole = req.user?.role;
    const projectId = Number(req.params.id);
    const { comment } = req.body;

    // Only admins can reject any project; staff must be mapped to the project's activity_type
    if (requesterRole !== "admin") {
      const { rows: authRows } = await pool.query(
        `SELECT 1
           FROM projects p
           JOIN activity_coordinators ac
             ON ac.activity_type = p.activity_type AND ac.staff_id = $1
          WHERE p.id = $2`,
        [staffId, projectId]
      );
      if (!authRows.length) {
        return res
          .status(403)
          .json({ message: "Not authorized to reject this project" });
      }
    }

    const q = `UPDATE projects
               SET verification_status='rejected',
                   verification_comment=$1,
                   verified_by=$2,
                   verified_at=NOW(),
                   verified=false
               WHERE id=$3
               RETURNING id, title, created_by`;
    const { rows } = await pool.query(q, [comment || null, staffId, projectId]);

    if (!rows.length)
      return res.status(404).json({ message: "Project not found" });

    // Notify creator
    const creatorId = rows[0].created_by;
    if (creatorId) {
      const { rows: userRows } = await pool.query(
        "SELECT email FROM users WHERE id=$1",
        [creatorId]
      );
      if (userRows[0]) {
        try {
          await sendMail({
            to: userRows[0].email,
            subject: `Your project "${rows[0].title}" has been rejected`,
            text: `Your project was rejected by staff. Comment: ${
              comment || "No comment"
            }`,
          });
        } catch (err) {
          console.error("Failed to send rejection email", err);
        }
      }
    }

    return res.json({ message: "Project rejected" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Approve achievement
export async function approveAchievement(req, res) {
  try {
    const staffId = req.user.id;
    const requesterRole = req.user?.role;
    const achievementId = Number(req.params.id);
    const { comment } = req.body;

    // Only admins can approve any achievement; staff must be mapped to the achievement's activity_type
    if (requesterRole !== "admin") {
      const { rows: authRows } = await pool.query(
        `SELECT 1
           FROM achievements a
           JOIN activity_coordinators ac
             ON ac.activity_type = a.activity_type AND ac.staff_id = $1
          WHERE a.id = $2`,
        [staffId, achievementId]
      );
      if (!authRows.length) {
        return res
          .status(403)
          .json({ message: "Not authorized to approve this achievement" });
      }
    }

    const q = `UPDATE achievements
               SET verification_status='approved',
                   verification_comment=$1,
                   verified_by=$2,
                   verified_at=NOW()
               WHERE id=$3
               RETURNING id, title, user_id`;
    const { rows } = await pool.query(q, [
      comment || null,
      staffId,
      achievementId,
    ]);
    if (!rows.length)
      return res.status(404).json({ message: "Achievement not found" });

    // notify user
    const { rows: userRows } = await pool.query(
      "SELECT email FROM users WHERE id=$1",
      [rows[0].user_id]
    );
    if (userRows[0]) {
      try {
        await sendMail({
          to: userRows[0].email,
          subject: `Your achievement "${rows[0].title}" has been approved`,
          text: `Your achievement has been approved by staff. Comment: ${
            comment || "No comment"
          }`,
        });
      } catch (err) {
        console.error("email failed", err);
      }
    }

    return res.json({ message: "Achievement approved" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Reject achievement
export async function rejectAchievement(req, res) {
  try {
    const staffId = req.user.id;
    const requesterRole = req.user?.role;
    const achievementId = Number(req.params.id);
    const { comment } = req.body;

    // Only admins can reject any achievement; staff must be mapped to the achievement's activity_type
    if (requesterRole !== "admin") {
      const { rows: authRows } = await pool.query(
        `SELECT 1
           FROM achievements a
           JOIN activity_coordinators ac
             ON ac.activity_type = a.activity_type AND ac.staff_id = $1
          WHERE a.id = $2`,
        [staffId, achievementId]
      );
      if (!authRows.length) {
        return res
          .status(403)
          .json({ message: "Not authorized to reject this achievement" });
      }
    }

    const q = `UPDATE achievements
               SET verification_status='rejected',
                   verification_comment=$1,
                   verified_by=$2,
                   verified_at=NOW()
               WHERE id=$3
               RETURNING id, title, user_id`;
    const { rows } = await pool.query(q, [
      comment || null,
      staffId,
      achievementId,
    ]);
    if (!rows.length)
      return res.status(404).json({ message: "Achievement not found" });

    const { rows: userRows } = await pool.query(
      "SELECT email FROM users WHERE id=$1",
      [rows[0].user_id]
    );
    if (userRows[0]) {
      try {
        await sendMail({
          to: userRows[0].email,
          subject: `Your achievement "${rows[0].title}" has been rejected`,
          text: `Your achievement was rejected by staff. Comment: ${
            comment || "No comment"
          }`,
        });
      } catch (err) {
        console.error("email failed", err);
      }
    }

    return res.json({ message: "Achievement rejected" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Staff dashboard summary (counts + lists)
export async function staffDashboard(req, res) {
  try {
    const staffId = req.user?.id;
    const requesterRole = req.user?.role;
    // pending projects & achievements and upcoming events
    const [pendingProjectsR, pendingAchievementsR, eventsR, recentUploadsR] =
      await Promise.all([
        // Admins see all pending; staff see only those for their mapped activity types
        requesterRole === "admin"
          ? pool.query(`SELECT p.id, p.title, p.academic_year, p.created_by, p.created_at, u.email as created_by_email
                      FROM projects p LEFT JOIN users u ON p.created_by = u.id
                      WHERE p.verification_status = 'pending'
                      ORDER BY p.created_at DESC LIMIT 50`)
          : pool.query(
              `SELECT p.id, p.title, p.academic_year, p.created_by, p.created_at, u.email as created_by_email
                        FROM projects p
                        LEFT JOIN users u ON p.created_by = u.id
                        JOIN activity_coordinators ac ON ac.activity_type = p.activity_type AND ac.staff_id = $1
                       WHERE p.verification_status = 'pending'
                       ORDER BY p.created_at DESC LIMIT 50`,
              [staffId]
            ),
        requesterRole === "admin"
          ? pool.query(`SELECT a.id, a.title, a.user_id, a.date_of_award, a.created_at, u.email as user_email
                      FROM achievements a LEFT JOIN users u ON a.user_id = u.id
                      WHERE a.verification_status = 'pending'
                      ORDER BY a.created_at DESC LIMIT 50`)
          : pool.query(
              `SELECT a.id, a.title, a.user_id, a.date_of_award, a.created_at, u.email as user_email
                        FROM achievements a
                        LEFT JOIN users u ON a.user_id = u.id
                        JOIN activity_coordinators ac ON ac.activity_type = a.activity_type AND ac.staff_id = $1
                       WHERE a.verification_status = 'pending'
                       ORDER BY a.created_at DESC LIMIT 50`,
              [staffId]
            ),
        pool.query(
          `SELECT id, title, start_date, end_date, venue FROM events ORDER BY start_date ASC LIMIT 50`
        ),
        // recent uploads from project_files
        pool.query(`SELECT pf.id, pf.project_id, pf.original_name, pf.file_type, pf.uploaded_by, pf.uploaded_at, u.email as uploaded_by_email
                  FROM project_files pf LEFT JOIN users u ON pf.uploaded_by = u.id
                  ORDER BY pf.uploaded_at DESC LIMIT 50`),
      ]);

    return res.json({
      pendingProjects: pendingProjectsR.rows,
      pendingAchievements: pendingAchievementsR.rows,
      upcomingEvents: eventsR.rows,
      recentFiles: recentUploadsR.rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
