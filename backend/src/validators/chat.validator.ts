import Joi from "joi";

export const createDirectChatSchema = Joi.object({
  participantId: Joi.string().required().messages({
    "any.required": "Participant id is required",
  }),
});
