// src/validators/projectSchemas.js
import Joi from "joi";

export const createProjectSchema = Joi.object({
  title: Joi.string().max(200).trim().required(),
  description: Joi.string().max(5000).trim(),
  mentor_name: Joi.string().max(200).trim().required(),
  academic_year: Joi.string().max(20).trim(),
  status: Joi.string().valid("ongoing", "completed", "submitted").trim(),
  team_members_count: Joi.number().integer().min(1).max(100),
  team_member_names: Joi.string().max(1000).trim(),
  // URI validation; the controller additionally enforces the github.com domain
  github_url: Joi.string().uri().max(500).trim().required(),
});
