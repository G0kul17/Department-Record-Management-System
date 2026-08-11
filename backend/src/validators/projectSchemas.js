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
  // Scheme restricted to http/https — plain .uri() accepts javascript:/data:
  // URIs (VULN-0001). The controller additionally enforces the github.com
  // domain specifically for this field.
  github_url: Joi.string().uri({ scheme: ["http", "https"] }).max(500).trim().required(),
  activity_type: Joi.string().max(100).trim(),
});
