import Joi from "joi";

export const createStatusSchema = Joi.object({
  text: Joi.string().trim().min(1).max(700).required(),
  backgroundColor: Joi.string()
    .pattern(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export const statusIdParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});
