// src/validators/eventSchemas.js
import Joi from "joi";

// Date strings are kept as strings because the controller accepts multiple
// formats (ISO 8601, dd-mm-yyyy HH:MM) and handles the parsing itself.
// We only cap the length to prevent absurd inputs.
const dateStr = Joi.string().max(50).trim();

export const createEventSchema = Joi.object({
  title: Joi.string().max(200).trim().required(),
  description: Joi.string().max(5000).trim().required(),
  venue: Joi.string().max(300).trim().required(),
  start_date: dateStr.required(),
  end_date: dateStr,
  event_url: Joi.string().uri().max(500).trim(),
  capacity: Joi.number().integer().min(1).max(100_000),
});

// All fields become optional for updates (PATCH semantics on a PUT route)
export const updateEventSchema = createEventSchema.fork(
  ["title", "description", "venue", "start_date"],
  (f) => f.optional(),
);
