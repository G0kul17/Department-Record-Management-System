// src/validators/staffSchemas.js
import Joi from "joi";

// Shared schema for staff verify / reject actions (optional free-text comment)
export const reviewSchema = Joi.object({
  comment: Joi.string().max(1000).trim(),
});

// Admin: change a user's role
export const updateRoleSchema = Joi.object({
  role: Joi.string().valid("student", "staff", "admin").required(),
});

// Staff: send a targeted announcement
export const createAnnouncementSchema = Joi.object({
  title: Joi.string().max(200).trim().required(),
  message: Joi.string().max(5000).trim().required(),
  description: Joi.string().max(5000).trim(),
  // recipients may arrive as a JSON string, comma-separated IDs, or an array
  // (form fields serialise arrays as repeated keys; the controller handles parsing)
  recipients: Joi.alternatives()
    .try(
      Joi.string().max(10_000),
      Joi.array().items(
        Joi.alternatives().try(Joi.number().integer(), Joi.string().max(50)),
      ),
    )
    .required(),
});
