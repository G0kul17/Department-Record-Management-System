// src/middleware/validate.js

/**
 * Joi-based request body validation middleware factory.
 *
 * Usage in a route file:
 *   import { validate } from '../middleware/validate.js';
 *   import { createEventSchema } from '../validators/eventSchemas.js';
 *   router.post('/', requireAuth, validate(createEventSchema), createEvent);
 *
 * For multipart routes (file uploads), place validate() AFTER the multer
 * middleware so that req.body is already populated from the form fields:
 *   router.post('/', upload.single('file'), validate(schema), controller);
 *
 * Options used:
 *   abortEarly:    false  — collect every validation error, not just the first
 *   stripUnknown:  true   — drop fields that are not in the schema (sanitisation)
 *   convert:       true   — coerce types (e.g. "5" → 5, "true" → true);
 *                           essential for multipart forms where everything
 *                           arrives as a string
 *
 * On failure the middleware returns:
 *   HTTP 400  { message: "Validation failed", errors: [{ field, message }] }
 *
 * On success it writes the sanitised value back to req.body before calling next().
 *
 * @param {import('joi').Schema} schema
 * @returns {import('express').RequestHandler}
 */
export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body ?? {}, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    req.body = value;
    return next();
  };
}
