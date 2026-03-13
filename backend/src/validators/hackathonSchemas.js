// src/validators/hackathonSchemas.js
import Joi from "joi";

export const hackathonProgressValues = [
  "Registered",
  "Round 1 Qualified",
  "Round 2 Qualified",
  "Round 3 Qualified",
  "Finalist",
  "Winner",
  "Runner-up",
  "Shortlisted",
  "Completed",
  "Not shortlisted",
];

export const createHackathonSchema = Joi.object({
  student_name: Joi.string().trim().min(1).max(255).required()
    .messages({
      "string.empty": "Student name is required",
      "any.required": "Student name is required",
    }),
  mobile_number: Joi.string().trim().min(10).max(30).required()
    .messages({
      "string.empty": "Mobile number is required",
      "any.required": "Mobile number is required",
    }),
  team_leader_name: Joi.string().trim().min(1).max(255).required()
    .messages({
      "string.empty": "Team leader name is required",
      "any.required": "Team leader name is required",
    }),
  team_members_count: Joi.number().integer().min(1).optional()
    .messages({
      "number.min": "Team must have at least 1 member",
    }),
  team_member_names: Joi.string().trim().min(1).required()
    .messages({
      "string.empty": "Team member names are required",
      "any.required": "Team member names are required",
    }),
  hackathon_name: Joi.string().trim().min(1).max(500).required()
    .messages({
      "string.empty": "Hackathon name is required",
      "any.required": "Hackathon name is required",
    }),
  mentor: Joi.string().trim().max(255).optional().allow(""),
  hosted_by: Joi.string().trim().min(1).max(255).required()
    .messages({
      "string.empty": "Hosted by is required",
      "any.required": "Hosted by is required",
    }),
  location: Joi.string().trim().min(1).max(500).required()
    .messages({
      "string.empty": "Location is required",
      "any.required": "Location is required",
    }),
  duration_start_date: Joi.date().iso().required()
    .messages({
      "date.base": "Valid start date is required",
      "any.required": "Duration start date is required",
    }),
  duration_end_date: Joi.date().iso().min(Joi.ref("duration_start_date")).optional().allow(null),
  no_of_rounds: Joi.number().integer().min(1).max(10).optional().allow(null, "")
    .messages({
      "number.min": "Number of rounds must be at least 1",
      "number.max": "Number of rounds cannot exceed 10",
    }),
  progress: Joi.string()
    .valid(...hackathonProgressValues)
    .required()
    .messages({
      "any.only": "Invalid progress value",
      "any.required": "Progress is required",
    }),
  prize: Joi.string().trim().max(255).optional().allow(""),
});

export const updateHackathonCoordinatorSchema = Joi.object({
  duration_end_date: Joi.date()
    .iso()
    .optional()
    .allow(null, ""),
  no_of_rounds: Joi.number().integer().min(1).max(10).optional().allow(null, ""),
  progress: Joi.string()
    .valid(...hackathonProgressValues)
    .optional(),
  prize: Joi.string().trim().max(255).optional().allow(""),
  verification_comment: Joi.string().trim().max(1500).optional().allow(""),
}).min(1);

export const updateHackathonStudentSchema = Joi.object({
  duration_end_date: Joi.date()
    .iso()
    .optional()
    .allow(null, ""),
  no_of_rounds: Joi.number().integer().min(1).max(10).optional().allow(null, ""),
  progress: Joi.string()
    .valid(...hackathonProgressValues)
    .optional(),
  prize: Joi.string().trim().max(255).optional().allow(""),
}).min(1);
