// src/validators/studentProfileSchemas.js
import Joi from "joi";

export const updateStudentProfileSchema = Joi.object({
  register_number: Joi.string().max(50).trim(),
  contact_number: Joi.string().max(20).trim(),
  leetcode_url: Joi.string().uri().max(300).trim(),
  hackerrank_url: Joi.string().uri().max(300).trim(),
  codechef_url: Joi.string().uri().max(300).trim(),
  github_url: Joi.string().uri().max(300).trim(),
});
