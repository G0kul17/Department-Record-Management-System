// src/validators/authSchemas.js
import Joi from "joi";

// Reusable field definitions
const email = Joi.string()
  .email({ tlds: { allow: false } }) // allow .ac.in, .edu, etc.
  .max(254)
  .lowercase()
  .trim();

// Must match the regex enforced in authController for new passwords
const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/)
  .message(
    '"password" must be at least 8 characters and contain at least one digit and one special character',
  );

const otp = Joi.string()
  .pattern(/^\d{6}$/)
  .message('"otp" must be a 6-digit number');

export const registerSchema = Joi.object({
  email: email.required(),
  password: password.required(),
  name: Joi.string().max(100).trim(),
  firstName: Joi.string().max(50).trim(),
  lastName: Joi.string().max(50).trim(),
  department: Joi.string().max(100).trim(),
  course: Joi.string().max(100).trim(),
  year: Joi.alternatives().try(Joi.string().max(10), Joi.number().integer()),
  section: Joi.string().max(10).trim(),
  rollNumber: Joi.string().max(50).trim(),
  phone: Joi.string().max(20).trim(),
});

export const verifyOtpSchema = Joi.object({
  email: email.required(),
  otp: otp.required(),
});

export const loginSchema = Joi.object({
  email: email.required(),
  // Do NOT enforce the complexity pattern on login — the stored hash was created
  // at registration time, and the pattern check would only reject valid passwords.
  password: Joi.string().min(1).max(128).required(),
});

export const forgotSchema = Joi.object({
  email: email.required(),
});

export const resetPasswordSchema = Joi.object({
  email: email.required(),
  otp: otp.required(),
  newPassword: password.required(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().max(100).trim(),
  fullName: Joi.string().max(100).trim(),
  phone: Joi.string().max(20).trim(),
  rollNumber: Joi.string().max(50).trim(),
});
