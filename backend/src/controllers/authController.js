import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { generateOTP, getExpiryDate } from "../utils/otpGenerator.js";
import { sendMail } from "../config/mailer.js";
import { detectRole } from "../utils/roleUtils.js";
import dotenv from "dotenv";
import { signToken } from "../utils/tokenUtils.js";
dotenv.config();

const OTP_EXPIRY_MIN = Number(process.env.OTP_EXPIRY_MIN || 5);
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export async function register(req, res) {
  const { email, password, name } = req.body;
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

  try {
    // check duplicate
    const { rows: existing } = await pool.query(
      "SELECT id, is_verified FROM users WHERE email=$1",
      [emailLower]
    );
    if (existing.length) {
      // If user exists but isn't verified yet, allow updating the password hash
      const userRow = existing[0];
      if (!userRow.is_verified) {
        const hashed = await bcrypt.hash(password, 10);
        // Also update role in case ADMIN_EMAILS was changed or this email should be admin
        await pool.query(
          "UPDATE users SET password_hash=$1, full_name=COALESCE($2, full_name), role=$4 WHERE email=$3",
          [hashed, fullName, emailLower, role]
        );
        // continue flow to send fresh OTP
      } else {
        return res.status(400).json({ message: "Email already registered" });
      }
    }

    // determine role
    let role = detectRole(emailLower);
    if (ADMIN_EMAILS.includes(emailLower)) role = "admin";
    if (!role)
      return res
        .status(400)
        .json({ message: "Invalid email format or unauthorized domain" });

    // If user didn't exist, create; if existed and unverified, we already updated password_hash above
    if (!existing.length) {
      const hashed = await bcrypt.hash(password, 10);
      try {
        await pool.query(
          "INSERT INTO users (email, password_hash, role, full_name) VALUES ($1, $2, $3, $4)",
          [emailLower, hashed, role, fullName]
        );
      } catch (e) {
        // unique violation
        if (e && e.code === "23505") {
          return res.status(400).json({ message: "Email already registered" });
        }
        throw e;
      }
    }

    // generate OTP and save
    const otp = generateOTP();
    const expiresAt = getExpiryDate(OTP_EXPIRY_MIN);
    await pool.query(
      "INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES ($1, $2, $3)",
      [emailLower, otp, expiresAt]
    );

    // send email
    await sendMail({
      to: emailLower,
      subject: "Your verification OTP",
      text: `Your OTP is ${otp}. It expires in ${OTP_EXPIRY_MIN} minutes.`,
    });

    const devPayload =
      process.env.RETURN_OTP === "true" || process.env.NODE_ENV !== "production"
        ? { devOtp: otp }
        : {};
    return res.json({
      message: `OTP sent to ${emailLower}`,
      role,
      ...devPayload,
    });
  } catch (err) {
    console.error("/auth/register error:", err);
    const payload =
      process.env.NODE_ENV !== "production"
        ? { message: "Server error", error: String(err.message || err) }
        : { message: "Server error" };
    return res.status(500).json(payload);
  }
}

export async function verifyOTP(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP required" });

  const emailLower = email.toLowerCase();
  try {
    const { rows } = await pool.query(
      "SELECT * FROM otp_verifications WHERE email=$1 AND otp_code=$2",
      [emailLower, otp]
    );
    if (!rows.length) return res.status(400).json({ message: "Invalid OTP" });

    const otpRow = rows[0];
    if (new Date() > otpRow.expires_at) {
      await pool.query("DELETE FROM otp_verifications WHERE id=$1", [
        otpRow.id,
      ]);
      return res.status(400).json({ message: "OTP expired" });
    }

    // mark verified and remove otp
    await pool.query("UPDATE users SET is_verified=true WHERE email=$1", [
      emailLower,
    ]);
    await pool.query("DELETE FROM otp_verifications WHERE id=$1", [otpRow.id]);

    // return jwt
    const { rows: users } = await pool.query(
      "SELECT id, email, role, full_name FROM users WHERE email=$1",
      [emailLower]
    );
    const user = users[0];
    // If this email is listed in ADMIN_EMAILS, ensure role is admin both in DB and token
    if (ADMIN_EMAILS.includes(emailLower) && user.role !== "admin") {
      await pool.query("UPDATE users SET role='admin' WHERE email=$1", [
        emailLower,
      ]);
      user.role = "admin";
    }
    const token = signToken(
      { id: user.id, email: user.email, role: user.role },
      "6h"
    );
    return res.json({
      message: "Verified",
      token,
      role: user.role,
      id: user.id,
      fullName: user.full_name || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  const emailLower = email.toLowerCase();
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [
      emailLower,
    ]);
    if (!rows.length)
      return res.status(400).json({ message: "User not found" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash || "");
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.is_verified) {
      // User hasn't verified account yet: generate a fresh verification OTP and return it
      const otp = generateOTP();
      const expiresAt = getExpiryDate(OTP_EXPIRY_MIN);
      await pool.query(
        "INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES ($1, $2, $3)",
        [emailLower, otp, expiresAt]
      );

      await sendMail({
        to: emailLower,
        subject: "Account Verification OTP",
        text: `Your verification OTP is ${otp}. It expires in ${OTP_EXPIRY_MIN} minutes.`,
      });

      const devPayload =
        process.env.RETURN_OTP === "true" ||
        process.env.NODE_ENV !== "production"
          ? { devOtp: otp }
          : {};
      return res.json({
        message: "Please verify your account via OTP",
        needsVerification: true,
        ...devPayload,
      });
    }

    // generate OTP for login (two-step)
    const otp = generateOTP();
    const expiresAt = getExpiryDate(OTP_EXPIRY_MIN);
    await pool.query(
      "INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES ($1, $2, $3)",
      [emailLower, otp, expiresAt]
    );

    await sendMail({
      to: emailLower,
      subject: "Login OTP",
      text: `Your login OTP is ${otp}. It expires in ${OTP_EXPIRY_MIN} minutes.`,
    });

    const devPayload =
      process.env.RETURN_OTP === "true" || process.env.NODE_ENV !== "production"
        ? { devOtp: otp }
        : {};
    return res.json({ message: "Login OTP sent to email", ...devPayload });
  } catch (err) {
    console.error("/auth/login error:", err);
    const payload =
      process.env.NODE_ENV !== "production"
        ? { message: "Server error", error: String(err.message || err) }
        : { message: "Server error" };
    return res.status(500).json(payload);
  }
}

export async function loginVerifyOTP(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP required" });

  const emailLower = email.toLowerCase();
  try {
    const { rows } = await pool.query(
      "SELECT * FROM otp_verifications WHERE email=$1 AND otp_code=$2",
      [emailLower, otp]
    );
    if (!rows.length) return res.status(400).json({ message: "Invalid OTP" });

    const otpRow = rows[0];
    if (new Date() > otpRow.expires_at) {
      await pool.query("DELETE FROM otp_verifications WHERE id=$1", [
        otpRow.id,
      ]);
      return res.status(400).json({ message: "OTP expired" });
    }

    await pool.query("DELETE FROM otp_verifications WHERE id=$1", [otpRow.id]);

    // issue token
    const { rows: users } = await pool.query(
      "SELECT id, email, role, full_name FROM users WHERE email=$1",
      [emailLower]
    );
    const user = users[0];
    // If this email is listed in ADMIN_EMAILS, ensure role is admin both in DB and token
    if (ADMIN_EMAILS.includes(emailLower) && user.role !== "admin") {
      await pool.query("UPDATE users SET role='admin' WHERE email=$1", [
        emailLower,
      ]);
      user.role = "admin";
    }
    const token = signToken(
      { id: user.id, email: user.email, role: user.role },
      "6h"
    );
    return res.json({
      message: "Login successful",
      token,
      role: user.role,
      id: user.id,
      fullName: user.full_name || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function initiateForgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const emailLower = email.toLowerCase();
  try {
    const { rows } = await pool.query("SELECT id FROM users WHERE email=$1", [
      emailLower,
    ]);
    if (!rows.length)
      return res.status(400).json({ message: "User not found" });

    const otp = generateOTP();
    const expiresAt = getExpiryDate(OTP_EXPIRY_MIN);
    await pool.query(
      "INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES ($1, $2, $3)",
      [emailLower, otp, expiresAt]
    );

    await sendMail({
      to: emailLower,
      subject: "Password Reset OTP",
      text: `Your password reset OTP is ${otp}. It expires in ${OTP_EXPIRY_MIN} minutes.`,
    });
    const devPayload =
      process.env.RETURN_OTP === "true" || process.env.NODE_ENV !== "production"
        ? { devOtp: otp }
        : {};
    return res.json({ message: "Password reset OTP sent", ...devPayload });
  } catch (err) {
    console.error("/auth/forgot error:", err);
    const payload =
      process.env.NODE_ENV !== "production"
        ? { message: "Server error", error: String(err.message || err) }
        : { message: "Server error" };
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

  const emailLower = email.toLowerCase();
  try {
    const { rows } = await pool.query(
      "SELECT * FROM otp_verifications WHERE email=$1 AND otp_code=$2",
      [emailLower, otp]
    );
    if (!rows.length) return res.status(400).json({ message: "Invalid OTP" });

    const otpRow = rows[0];
    if (new Date() > otpRow.expires_at) {
      await pool.query("DELETE FROM otp_verifications WHERE id=$1", [
        otpRow.id,
      ]);
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash=$1 WHERE email=$2", [
      hashed,
      emailLower,
    ]);
    await pool.query("DELETE FROM otp_verifications WHERE id=$1", [otpRow.id]);

    return res.json({ message: "Password updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Get current user's profile
export async function getProfile(req, res) {
  try {
    const emailLower = (req.user?.email || "").toLowerCase();
    if (!emailLower) return res.status(401).json({ message: "Unauthorized" });

    const { rows } = await pool.query(
      "SELECT id, email, role, full_name, phone, roll_number FROM users WHERE email=$1",
      [emailLower]
    );
    if (!rows.length)
      return res.status(404).json({ message: "User not found" });
    const u = rows[0];
    return res.json({
      id: u.id,
      email: u.email,
      role: u.role,
      fullName: u.full_name,
      phone: u.phone || null,
      rollNumber: u.roll_number || null,
    });
  } catch (err) {
    console.error("/auth/profile GET error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Update current user's profile (currently supports fullName)
export async function updateProfile(req, res) {
  try {
    const emailLower = (req.user?.email || "").toLowerCase();
    if (!emailLower) return res.status(401).json({ message: "Unauthorized" });
    const { fullName, phone, rollNumber, email } = req.body;
    const name = (fullName || "").trim();
    if (!name) return res.status(400).json({ message: "fullName required" });

    const updates = { full_name: name };
    if (typeof phone === "string") updates.phone = phone.trim();
    if (typeof rollNumber === "string") updates.roll_number = rollNumber.trim();

    let newEmailLower = emailLower;
    if (
      typeof email === "string" &&
      email.trim().toLowerCase() !== emailLower
    ) {
      newEmailLower = email.trim().toLowerCase();
      const { rows: dup } = await pool.query(
        "SELECT 1 FROM users WHERE email=$1",
        [newEmailLower]
      );
      if (dup.length)
        return res.status(400).json({ message: "Email already in use" });
      updates.email = newEmailLower;
    }

    const setClauses = Object.keys(updates)
      .map((k, i) => `${k}=$${i + 1}`)
      .join(", ");
    const values = Object.values(updates);
    values.push(emailLower);
    await pool.query(
      `UPDATE users SET ${setClauses} WHERE email=$${values.length}`,
      values
    );

    const { rows } = await pool.query(
      "SELECT id, email, role, full_name, phone, roll_number FROM users WHERE email=$1",
      [newEmailLower]
    );
    const u = rows[0];
    const token = signToken({ id: u.id, email: u.email, role: u.role }, "6h");
    return res.json({
      id: u.id,
      email: u.email,
      role: u.role,
      fullName: u.full_name,
      phone: u.phone || null,
      rollNumber: u.roll_number || null,
      token,
    });
  } catch (err) {
    console.error("/auth/profile PUT error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
