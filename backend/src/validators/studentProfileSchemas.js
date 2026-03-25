// src/validators/studentProfileSchemas.js
import Joi from "joi";

export const updateStudentProfileSchema = Joi.object({
  register_number: Joi.string().max(50).trim().allow("", null),
  contact_number: Joi.string().max(20).trim().allow("", null),
  leetcode_url: Joi.string().uri().max(300).trim().allow("", null),
  hackerrank_url: Joi.string().uri().max(300).trim().allow("", null),
  codechef_url: Joi.string().uri().max(300).trim().allow("", null),
  github_url: Joi.string().uri().max(300).trim().allow("", null),
});
