// src/validators/studentProfileSchemas.js
import Joi from "joi";

// Scheme restricted to http/https on every profile link field — plain
// .uri() accepts javascript:/data: URIs, which is the same class of stored
// XSS risk fixed for github_url/event_url elsewhere (VULN-0001).
const httpUrl = Joi.string().uri({ scheme: ["http", "https"] }).max(300).trim().allow("", null);

export const updateStudentProfileSchema = Joi.object({
  register_number: Joi.string().max(50).trim().allow("", null),
  contact_number: Joi.string().max(20).trim().allow("", null),
  leetcode_url: httpUrl,
  hackerrank_url: httpUrl,
  codechef_url: httpUrl,
  github_url: httpUrl,
});
