// src/validators/projectSchemas.js
import Joi from "joi";

export const createProjectSchema = Joi.object({
  title: Joi.string().max(200).trim().required(),
  description: Joi.string().max(5000).trim().allow("", null),
  mentor_name: Joi.string().max(200).trim().required(),
  academic_year: Joi.string().max(20).trim().allow("", null),
  status: Joi.string().valid("ongoing", "completed", "submitted").trim().allow("", null),
  team_members_count: Joi.number().integer().min(1).max(100).allow("", null),
  team_member_names: Joi.string().max(1000).trim().allow("", null),
  github_url: Joi.string().max(500).trim().required(),
  activity_type: Joi.string().max(100).trim().allow("", null),
});
