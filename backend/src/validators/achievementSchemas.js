// src/validators/achievementSchemas.js
import Joi from "joi";

export const createAchievementSchema = Joi.object({
  title: Joi.string().max(200).trim().required(),
  issuer: Joi.string().max(200).trim().required(),
  name: Joi.string().max(200).trim().required(),
  // Either date field is acceptable; the controller handles both
  date_of_award: Joi.string().max(50).trim(),
  date: Joi.string().max(50).trim(),
  post_to_community: Joi.string().valid("true", "false").trim(),
  event_id: Joi.alternatives().try(Joi.number().integer(), Joi.string().max(50)),
  event_name: Joi.string().max(200).trim(),
  activity_type: Joi.string().max(100).trim(),
  prize_amount: Joi.number().min(0).max(10_000_000),
  position: Joi.string().valid("1st", "2nd", "3rd"),
  academic_year: Joi.string().max(20).trim(),
});
