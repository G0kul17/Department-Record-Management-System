import pool from "../config/db.js";

// ================= GET STUDENT PROFILE =================
export const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const q = `
      SELECT
        u.email,
        COALESCE(u.profile_details->>'first_name', '') AS first_name,
        COALESCE(u.profile_details->>'last_name', '') AS last_name,
        COALESCE(u.profile_details->>'department', '') AS department,
        COALESCE(u.profile_details->>'course', '') AS course,
        COALESCE(u.profile_details->>'year', '') AS year,
        COALESCE(u.profile_details->>'section', '') AS section,

        sp.register_number,
        sp.contact_number,
        sp.leetcode_url,
        sp.hackerrank_url,
        sp.codechef_url,
        sp.github_url
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.id = $1 AND u.role = 'student'
    `;

    const { rows } = await pool.query(q, [userId]);

    if (!rows.length) {
      return res.status(404).json({ message: "Profile not found" });
    }

    console.log("Student profile data:", rows[0]);
    return res.json({ profile: rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE STUDENT PROFILE =================
export const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      register_number,
      contact_number,
      leetcode_url,
      hackerrank_url,
      codechef_url,
      github_url
    } = req.body;

    // Insert or Update (UPSERT)
    const q = `
      INSERT INTO student_profiles
      (user_id, register_number, contact_number,
       leetcode_url, hackerrank_url, codechef_url, github_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (user_id)
      DO UPDATE SET
        register_number = EXCLUDED.register_number,
        contact_number = EXCLUDED.contact_number,
        leetcode_url = EXCLUDED.leetcode_url,
        hackerrank_url = EXCLUDED.hackerrank_url,
        codechef_url = EXCLUDED.codechef_url,
        github_url = EXCLUDED.github_url,
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      userId,
      register_number || null,
      contact_number || null,
      leetcode_url || null,
      hackerrank_url || null,
      codechef_url || null,
      github_url || null
    ];

    const { rows } = await pool.query(q, values);

    return res.json({
      message: "Profile updated successfully",
      profile: rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
