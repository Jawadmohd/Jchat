import Joi from "joi";

export const createMessageSchema = Joi.object({
  content: Joi.string().trim().max(5000).allow("").default(""),
  replyToMessageId: Joi.string().hex().length(24).optional(),
  isEncrypted: Joi.boolean().optional(),
  ciphertext: Joi.string().trim().max(20000).optional(),
  iv: Joi.string().trim().max(64).optional(),
});

export const updateMessageSchema = Joi.object({
  content: Joi.string().trim().max(5000).allow(""),
  isEncrypted: Joi.boolean().optional(),
  ciphertext: Joi.string().trim().max(20000).optional(),
  iv: Joi.string().trim().max(64).optional(),
}).or("content", "ciphertext");

export const listMessagesSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  before: Joi.date().iso().optional(),
});

export const searchMessagesSchema = Joi.object({
  q: Joi.string().trim().min(1).max(100).required(),
  limit: Joi.number().integer().min(1).max(50).default(30),
});

export const toggleReactionSchema = Joi.object({
  emoji: Joi.string().trim().min(1).max(8).required().messages({
    "any.required": "Emoji is required",
  }),
});

export const upsertWrappedKeysSchema = Joi.object({
  wrappedKeys: Joi.array()
    .items(
      Joi.object({
        userId: Joi.string().hex().length(24).required(),
        wrappedKey: Joi.string().trim().min(1).max(4096).required(),
        iv: Joi.string().trim().min(1).max(64).required(),
        ephemeralPublicKey: Joi.string().trim().min(1).max(4096).required(),
      })
    )
    .min(1)
    .required(),
});
