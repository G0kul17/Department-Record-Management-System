import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { generateOTP, getExpiryDate } from "../utils/otpGenerator.js";
import { enqueueMail } from "../utils/mailClient.js";
import { detectRole } from "../utils/roleUtils.js";
import dotenv from "dotenv";
import { signToken } from "../utils/tokenUtils.js";
import {
  createSession,
  getUserActiveSessions,
  invalidateAllUserSessions,
} from "../utils/sessionUtils.js";
import logger, { reqContext } from "../utils/logger.js";
import { tracedQuery } from "../utils/tracing.js";
dotenv.config();

const OTP_EXPIRY_MIN = Number(process.env.OTP_EXPIRY_MIN || 5);
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export async function register(req, res) {
  const {
    email,
    password,
    name,
    firstName,
    lastName,
    department,
    course,
    year,
    section,
    rollNumber,
    phone,
  } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  // Password policy: min 8 chars, at least one digit, at least one special char
  const passwordPolicy =
    /^(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  if (!passwordPolicy.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters and include at least one number and one special character",
    });
  }

  const emailLower = email.toLowerCase();
  const fullName = (name || "").trim() || null;

  // Build profile_details JSONB object for students
  const profileDetails = {
    full_name: fullName,
    first_name: firstName || "",
    last_name: lastName || "",
    department: department || "",
    course: course || "",
    year: year || "",
    section: section || "",
    phone: phone || "",
    roll_number: rollNumber || "",
  };

  try {
    // determine role before any DB writes
    let role = detectRole(emailLower);
    if (ADMIN_EMAILS.includes(emailLower)) role = "admin";
    if (!role)
      return res
        .status(400)
        .json({ message: "Invalid email format or unauthorized domain" });

    // check duplicate
    const { rows: existing } = await tracedQuery(
      pool,
      "SELECT id, is_verified FROM users WHERE email=$1",
      [emailLower],
    );
    if (existing.length) {
      // If user exists but isn't verified yet, allow updating the password hash
      const userRow = existing[0];
      if (!userRow.is_verified) {
        const hashed = await bcrypt.hash(password, 10);
        // Also update role in case ADMIN_EMAILS was changed or this email should be admin
        await tracedQuery(pool, 
          "UPDATE users SET password_hash=$1, role=$2, profile_details=$3, full_name=$4 WHERE email=$5",
          [hashed, role, JSON.stringify(profileDetails), fullName, emailLower],
        );
        // continue flow to send fresh OTP
      } else {
        return res.status(400).json({ message: "Email already registered" });
      }
    }

    // If user didn't exist, create; if existed and unverified, we already updated password_hash above
    if (!existing.length) {
      const hashed = await bcrypt.hash(password, 10);
      try {
        await tracedQuery(pool, 
          "INSERT INTO users (email, password_hash, role, profile_details, full_name) VALUES ($1, $2, $3, $4, $5)",
          [emailLower, hashed, role, JSON.stringify(profileDetails), fullName],
        );
      } catch (e) {
        // unique violation
        if (e && e.code === "23505") {
          return res.status(400).json({ message: "Email already registered" });
        }
        throw e;
      }
    }

    // generate OTP and save (clear any existing OTPs for this email first)
    const otp = generateOTP();
    const expiresAt = getExpiryDate(OTP_EXPIRY_MIN);
    await tracedQuery(pool, "DELETE FROM otp_verifications WHERE email=$1", [
      emailLower,
    ]);
    await tracedQuery(pool, 
      "INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES ($1, $2, $3)",
      [emailLower, otp, expiresAt],
    );

    // send email
    enqueueMail({
      to: emailLower,
      subject: "Your verification OTP",
      text: `Your OTP is ${otp}. It expires in ${OTP_EXPIRY_MIN} minutes.`,
    }).catch(err => logger.error("mail.enqueue.error", { err, ...reqContext(req) }));

    return res.json({
      message: `OTP sent to ${emailLower}`,
      role,
    });
  } catch (err) {
    logger.error("Auth register error", { err, ...reqContext(req) });
    const payload =
      process.env.NODE_ENV !== "production"
        ? { message: "Server error", trace_id: req.correlationId, error: String(err.message || err) }
        : { message: "Server error", trace_id: req.correlationId };
    return res.status(500).json(payload);
  }
}

export async function verifyOTP(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP required" });

  const emailLower = String(email).trim().toLowerCase();
  const otpClean = String(otp).trim();
  try {
    const { rows } = await tracedQuery(pool, 
      "SELECT * FROM otp_verifications WHERE email=$1",
      [emailLower],
    );
    if (!rows.length) return res.status(401).json({ message: "Invalid OTP" });

    const otpRow = rows[0];

    if (otpRow.attempts >= 5) {
      await tracedQuery(pool, "DELETE FROM otp_verifications WHERE id=$1", [otpRow.id]);
      return res.status(429).json({ message: "Too many failed attempts. Please request a new OTP." });
    }

    // Check expiry BEFORE checking the code so expired rows can never be
    // brute-forced: a wrong code would otherwise leave the row alive past
    // its expiry window with unlimited retry time.
    if (new Date() > otpRow.expires_at) {
      await tracedQuery(pool, "DELETE FROM otp_verifications WHERE id=$1", [otpRow.id]);
      return res.status(401).json({ message: "OTP expired" });
    }

    if (otpRow.otp_code.trim() !== otpClean) {
      await tracedQuery(pool, "UPDATE otp_verifications SET attempts = attempts + 1 WHERE id=$1", [otpRow.id]);
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // mark verified and remove otp
    await tracedQuery(pool, "UPDATE users SET is_verified=true WHERE email=$1", [
      emailLower,
    ]);
    await tracedQuery(pool, "DELETE FROM otp_verifications WHERE id=$1", [otpRow.id]);

    // return jwt
    const { rows: users } = await tracedQuery(pool, 
      "SELECT id, email, role, profile_details FROM users WHERE email=$1",
      [emailLower],
    );
    const user = users[0];
    // If this email is listed in ADMIN_EMAILS, ensure role is admin both in DB and token
    if (ADMIN_EMAILS.includes(emailLower) && user.role !== "admin") {
      await tracedQuery(pool, "UPDATE users SET role='admin' WHERE email=$1", [
        emailLower,
      ]);
      user.role = "admin";
    }
    const regSession = await createSession(user.id, {
      userAgent: req.get("user-agent"),
      ipAddress: req.ip,
    });
    const token = signToken(
      { id: user.id, email: user.email, role: user.role, sid: regSession.session_token },
      "6h",
    );
    const profile = user.profile_details || {};
    const photoUrl =
      profile.photo_url ||
      profile.avatar_url ||
      profile.image_url ||
      profile.profile_pic ||
      null;
    return res.json({
      message: "Verified",
      token,
      role: user.role,
      id: user.id,
      fullName: profile.full_name || null,
      photoUrl,
    });
  } catch (err) {
    logger.error("Auth verifyOTP error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error", trace_id: req.correlationId });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  const emailLower = email.toLowerCase();
  try {
    const { rows } = await tracedQuery(pool, "SELECT * FROM users WHERE email=$1", [
      emailLower,
    ]);
    if (!rows.length)
      return res.status(401).json({ message: "User not found" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash || "");
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.is_verified) {
      // User hasn't verified account yet: generate a fresh verification OTP and return it
      const otp = generateOTP();
      const expiresAt = getExpiryDate(OTP_EXPIRY_MIN);
      await tracedQuery(pool, "DELETE FROM otp_verifications WHERE email=$1", [
        emailLower,
      ]);
      await tracedQuery(pool, 
        "INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES ($1, $2, $3)",
        [emailLower, otp, expiresAt],
      );

      enqueueMail({
        to: emailLower,
        subject: "Account Verification OTP",
        text: `Your verification OTP is ${otp}. It expires in ${OTP_EXPIRY_MIN} minutes.`,
      }).catch(err => logger.error("mail.enqueue.error", { err, ...reqContext(req) }));

      return res.json({
        message: "Please verify your account via OTP",
        needsVerification: true,
      });
    }

    // Check if user has a valid session (90-day session-based login)
    const activeSessions = await getUserActiveSessions(user.id);
    if (activeSessions.length > 0) {
      // User has valid session, skip OTP and return token directly
      const latestSession = activeSessions[0]; // ordered by last_accessed_at DESC
      // If this email is listed in ADMIN_EMAILS, ensure role is admin both in DB and token
      if (ADMIN_EMAILS.includes(emailLower) && user.role !== "admin") {
        await tracedQuery(pool, "UPDATE users SET role='admin' WHERE email=$1", [
          emailLower,
        ]);
        user.role = "admin";
      }
      const token = signToken(
        { id: user.id, email: user.email, role: user.role, sid: latestSession.session_token },
        "6h",
      );
      const profile = user.profile_details || {};
      const photoUrl =
        profile.photo_url ||
        profile.avatar_url ||
        profile.image_url ||
        profile.profile_pic ||
        null;

      // Fetch student profile data if role is student
      let studentProfile = {};
      if (user.role === "student") {
        const { rows: profileRows } = await tracedQuery(pool, 
          "SELECT register_number, contact_number, leetcode_url, hackerrank_url, codechef_url, github_url FROM student_profiles WHERE user_id=$1",
          [user.id],
        );
        if (profileRows.length) {
          studentProfile = profileRows[0];
        }
      }

      return res.json({
        message: "Login successful (session active)",
        token,
        role: user.role,
        id: user.id,
        fullName: profile.full_name || null,
        photoUrl,
        sessionActive: true,
        ...studentProfile,
      });
    }

    // No valid session, generate OTP for login (two-step)
    const otp = generateOTP();
    const expiresAt = getExpiryDate(OTP_EXPIRY_MIN);
    await tracedQuery(pool, "DELETE FROM otp_verifications WHERE email=$1", [
      emailLower,
    ]);
    await tracedQuery(pool, 
      "INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES ($1, $2, $3)",
      [emailLower, otp, expiresAt],
    );

    enqueueMail({
      to: emailLower,
      subject: "Login OTP",
      text: `Your login OTP is ${otp}. It expires in ${OTP_EXPIRY_MIN} minutes.`,
    }).catch(err => logger.error("mail.enqueue.error", { err, ...reqContext(req) }));

    return res.json({ message: "Login OTP sent to email" });
  } catch (err) {
    logger.error("Auth login error", { err, ...reqContext(req) });
    const payload =
      process.env.NODE_ENV !== "production"
        ? { message: "Server error", trace_id: req.correlationId, error: String(err.message || err) }
        : { message: "Server error", trace_id: req.correlationId };
    return res.status(500).json(payload);
  }
}

export async function loginVerifyOTP(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP required" });

  const emailLower = String(email).trim().toLowerCase();
  const otpClean = String(otp).trim();
  try {
    const { rows } = await tracedQuery(pool, 
      "SELECT * FROM otp_verifications WHERE email=$1",
      [emailLower],
    );
    if (!rows.length) return res.status(401).json({ message: "Invalid OTP" });

    const otpRow = rows[0];

    if (otpRow.attempts >= 5) {
      await tracedQuery(pool, "DELETE FROM otp_verifications WHERE id=$1", [otpRow.id]);
      return res.status(429).json({ message: "Too many failed attempts. Please request a new OTP." });
    }

    if (new Date() > otpRow.expires_at) {
      await tracedQuery(pool, "DELETE FROM otp_verifications WHERE id=$1", [otpRow.id]);
      return res.status(401).json({ message: "OTP expired" });
    }

    if (otpRow.otp_code.trim() !== otpClean) {
      await tracedQuery(pool, "UPDATE otp_verifications SET attempts = attempts + 1 WHERE id=$1", [otpRow.id]);
      return res.status(401).json({ message: "Invalid OTP" });
    }

    await tracedQuery(pool, "DELETE FROM otp_verifications WHERE id=$1", [otpRow.id]);

    // issue token
    const { rows: users } = await tracedQuery(pool, 
      "SELECT id, email, role, profile_details FROM users WHERE email=$1",
      [emailLower],
    );
    const user = users[0];
    // If this email is listed in ADMIN_EMAILS, ensure role is admin both in DB and token
    if (ADMIN_EMAILS.includes(emailLower) && user.role !== "admin") {
      await tracedQuery(pool, "UPDATE users SET role='admin' WHERE email=$1", [
        emailLower,
      ]);
      user.role = "admin";
    }

    // Create session for this login (90-day expiration)
    const deviceInfo = {
      userAgent: req.get("user-agent"),
      ipAddress: req.ip,
    };
    const session = await createSession(user.id, deviceInfo);

    // Fetch student profile data if role is student
    let studentProfile = {};
    if (user.role === "student") {
      const { rows: profileRows } = await tracedQuery(pool, 
        "SELECT register_number, contact_number, leetcode_url, hackerrank_url, codechef_url, github_url FROM student_profiles WHERE user_id=$1",
        [user.id],
      );
      if (profileRows.length) {
        studentProfile = profileRows[0];
      }
    }

    const token = signToken(
      { id: user.id, email: user.email, role: user.role, sid: session.session_token },
      "6h",
    );
    const profile = user.profile_details || {};
    const photoUrl =
      profile.photo_url ||
      profile.avatar_url ||
      profile.image_url ||
      profile.profile_pic ||
      null;
    return res.json({
      message: "Login successful",
      token,
      role: user.role,
      id: user.id,
      fullName: profile.full_name || null,
      photoUrl,
      ...studentProfile,
    });
  } catch (err) {
    logger.error("Auth loginVerifyOTP error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error", trace_id: req.correlationId });
  }
}

/**
 * Validate a password-reset OTP without consuming it.
 * Called by the frontend VerifyOtp step so that errors surface there
 * (clear "Invalid OTP" / "OTP expired") instead of on the final reset screen.
 * The OTP row is intentionally left in the DB so /auth/reset can consume it.
 */
export async function forgotVerifyOTP(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP required" });

  const emailLower = String(email).trim().toLowerCase();
  const otpClean = String(otp).trim();
  try {
    const { rows } = await tracedQuery(pool, 
      "SELECT * FROM otp_verifications WHERE email=$1",
      [emailLower]
    );
    if (!rows.length) return res.status(401).json({ message: "Invalid OTP" });

    const otpRow = rows[0];

    if (otpRow.attempts >= 5) {
      await tracedQuery(pool, "DELETE FROM otp_verifications WHERE id=$1", [otpRow.id]);
      return res.status(429).json({ message: "Too many failed attempts. Please request a new OTP." });
    }

    // Expiry before code — expired rows must not be brute-forced
    if (new Date() > otpRow.expires_at) {
      await tracedQuery(pool, "DELETE FROM otp_verifications WHERE id=$1", [otpRow.id]);
      return res.status(401).json({ message: "OTP expired" });
    }

    if (otpRow.otp_code.trim() !== otpClean) {
      await tracedQuery(pool, 
        "UPDATE otp_verifications SET attempts = attempts + 1 WHERE id=$1",
        [otpRow.id]
      );
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // OTP is valid — leave the row in DB so /auth/reset can consume it
    return res.json({ message: "OTP verified" });
  } catch (err) {
    logger.error("Auth forgot-verify error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error", trace_id: req.correlationId });
  }
}

export async function initiateForgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const emailLower = email.toLowerCase();
  try {
    // Only allow verified accounts to reset their password.
    // Unverified accounts were never proven to own the email address, so
    // issuing a reset OTP for them would be a bypass of email verification.
    const { rows } = await tracedQuery(pool, 
      "SELECT id FROM users WHERE email=$1 AND is_verified=true",
      [emailLower],
    );

    const genericResponse = {
      message: "If this email is registered, you will receive an OTP.",
    };

    if (rows.length) {
      const otp = generateOTP();
      const expiresAt = getExpiryDate(OTP_EXPIRY_MIN);
      await tracedQuery(pool, "DELETE FROM otp_verifications WHERE email=$1", [
        emailLower,
      ]);
      await tracedQuery(pool, 
        "INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES ($1, $2, $3)",
        [emailLower, otp, expiresAt]
      );

      enqueueMail({
        to: emailLower,
        subject: "Password Reset OTP",
        text: `Your password reset OTP is ${otp}. It expires in ${OTP_EXPIRY_MIN} minutes.`,
      }).catch(err => logger.error("mail.enqueue.error", { err, ...reqContext(req) }));

    }

    return res.json(genericResponse);
  } catch (err) {
    logger.error("Auth forgot-password error", { err, ...reqContext(req) });
    const payload =
      process.env.NODE_ENV !== "production"
        ? { message: "Server error", trace_id: req.correlationId, error: String(err.message || err) }
        : { message: "Server error", trace_id: req.correlationId };
    return res.status(500).json(payload);
  }
}

export async function resetPassword(req, res) {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return res
      .status(400)
      .json({ message: "Email, OTP and newPassword required" });

  const passwordPolicy =
    /^(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  if (!passwordPolicy.test(newPassword)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters and include at least one number and one special character",
    });
  }

  const emailLower = String(email).trim().toLowerCase();
  const otpClean = String(otp).trim();
  try {
    const { rows } = await tracedQuery(pool, 
      "SELECT * FROM otp_verifications WHERE email=$1",
      [emailLower],
    );
    if (!rows.length) return res.status(401).json({ message: "Invalid OTP" });

    const otpRow = rows[0];

    if (otpRow.attempts >= 5) {
      await tracedQuery(pool, "DELETE FROM otp_verifications WHERE id=$1", [otpRow.id]);
      return res.status(429).json({ message: "Too many failed attempts. Please request a new OTP." });
    }

    if (new Date() > otpRow.expires_at) {
      await tracedQuery(pool, "DELETE FROM otp_verifications WHERE id=$1", [otpRow.id]);
      return res.status(401).json({ message: "OTP expired" });
    }

    if (otpRow.otp_code.trim() !== otpClean) {
      await tracedQuery(pool, "UPDATE otp_verifications SET attempts = attempts + 1 WHERE id=$1", [otpRow.id]);
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    // Only reset password for verified accounts — unverified users must go
    // through the registration + email-verification flow instead.
    const { rows: updated } = await tracedQuery(pool, 
      "UPDATE users SET password_hash=$1 WHERE email=$2 AND is_verified=true RETURNING id",
      [hashed, emailLower],
    );

    // Consume the OTP regardless of outcome to prevent replay
    await tracedQuery(pool, "DELETE FROM otp_verifications WHERE id=$1", [otpRow.id]);

    if (!updated.length) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    await invalidateAllUserSessions(updated[0].id);
    return res.json({ message: "Password updated" });
  } catch (err) {
    logger.error("Auth resetPassword error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error", trace_id: req.correlationId });
  }
}

// Get current user's profile
export async function getProfile(req, res) {
  try {
    const emailLower = (req.user?.email || "").toLowerCase();
    if (!emailLower) return res.status(401).json({ message: "Unauthorized" });

    const { rows } = await tracedQuery(pool, 
      "SELECT id, email, role, profile_details FROM users WHERE email=$1",
      [emailLower],
    );
    if (!rows.length)
      return res.status(404).json({ message: "User not found" });
    const u = rows[0];
    const profile = u.profile_details || {};
    const photoUrl =
      profile.photo_url ||
      profile.avatar_url ||
      profile.image_url ||
      profile.profile_pic ||
      null;
    return res.json({
      id: u.id,
      email: u.email,
      role: u.role,
      fullName: profile.full_name || null,
      phone: profile.phone || null,
      rollNumber: profile.roll_number || null,
      profileDetails: profile,
      photoUrl,
    });
  } catch (err) {
    logger.error("Auth getProfile error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error", trace_id: req.correlationId });
  }
}

// Update current user's profile (currently supports fullName)
export async function updateProfile(req, res) {
  try {
    const emailLower = (req.user?.email || "").toLowerCase();
    if (!emailLower) return res.status(401).json({ message: "Unauthorized" });

    const { name, fullName, phone, rollNumber } = req.body || {};
    const nameValue = name || fullName;

    // Get current profile_details
    const { rows: current } = await tracedQuery(pool, 
      "SELECT profile_details FROM users WHERE email=$1",
      [emailLower],
    );

    if (!current.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // Merge with existing profile_details
    const existingProfile = current[0].profile_details || {};
    const updates = {};
    if (nameValue !== undefined) updates.full_name = nameValue;
    if (phone !== undefined) updates.phone = phone;
    if (rollNumber !== undefined) updates.roll_number = rollNumber;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const updatedProfile = { ...existingProfile, ...updates };

    if (nameValue !== undefined) {
      await tracedQuery(pool, 
        "UPDATE users SET profile_details=$1, full_name=$2 WHERE email=$3",
        [JSON.stringify(updatedProfile), nameValue || null, emailLower],
      );
    } else {
      await tracedQuery(pool, "UPDATE users SET profile_details=$1 WHERE email=$2", [
        JSON.stringify(updatedProfile),
        emailLower,
      ]);
    }

    return res.json({
      message: "Profile updated",
      profile: updatedProfile,
    });
  } catch (err) {
    logger.error("Auth updateProfile error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error", trace_id: req.correlationId });
  }
}

// Upload and set current user's profile photo
export async function updateProfilePhoto(req, res) {
  try {
    const emailLower = (req.user?.email || "").toLowerCase();
    if (!emailLower) return res.status(401).json({ message: "Unauthorized" });

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filename = req.file.filename;
    const absBase = `${req.protocol}://${req.get("host")}`;
    const photoUrl = `${absBase}/uploads/${filename}`;

    // Get current profile_details
    const { rows: current } = await tracedQuery(pool, 
      "SELECT profile_details FROM users WHERE email=$1",
      [emailLower],
    );
    if (!current.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingProfile = current[0].profile_details || {};
    const updatedProfile = {
      ...existingProfile,
      photo_url: photoUrl,
      avatar_url: photoUrl,
      image_url: photoUrl,
      profile_pic: photoUrl,
    };

    await tracedQuery(pool, "UPDATE users SET profile_details=$1 WHERE email=$2", [
      JSON.stringify(updatedProfile),
      emailLower,
    ]);

    return res.json({ message: "Photo updated", photoUrl });
  } catch (err) {
    logger.error("Auth updateProfilePhoto error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error", trace_id: req.correlationId });
  }
}

/**
 * Logout endpoint - invalidates user session
 */
export async function logout(req, res) {
  try {
    await invalidateAllUserSessions(req.user.id);
    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    logger.error("Auth logout error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error", trace_id: req.correlationId });
  }
}
