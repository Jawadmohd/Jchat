import Joi from "joi";

export const createMessageSchema = Joi.object({
  content: Joi.string().trim().max(5000).allow("").default(""),
  replyToMessageId: Joi.string().hex().length(24).optional(),
});

export const updateMessageSchema = Joi.object({
  content: Joi.string().trim().min(1).max(5000).required().messages({
    "string.empty": "Message cannot be empty",
    "any.required": "Message content is required",
  }),
});

export const listMessagesSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  before: Joi.date().iso().optional(),
});

export const toggleReactionSchema = Joi.object({
  emoji: Joi.string().trim().min(1).max(8).required().messages({
    "any.required": "Emoji is required",
  }),
});
