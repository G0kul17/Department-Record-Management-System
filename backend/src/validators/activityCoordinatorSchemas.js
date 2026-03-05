// src/validators/activityCoordinatorSchemas.js
import Joi from "joi";

export const createActivityCoordinatorSchema = Joi.object({
  activityType: Joi.string().max(200).trim().required(),
  staffId: Joi.alternatives()
    .try(Joi.number().integer(), Joi.string().max(20))
    .required(),
});
