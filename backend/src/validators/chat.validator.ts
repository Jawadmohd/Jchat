import Joi from "joi";

export const createDirectChatSchema = Joi.object({
  participantId: Joi.string().required().messages({
    "any.required": "Participant id is required",
  }),
});

export const createGroupChatSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Group name is required",
    "any.required": "Group name is required",
  }),
  participantIds: Joi.array().items(Joi.string()).min(1).required().messages({
    "array.min": "Select at least one member",
    "any.required": "Select at least one member",
  }),
});
