import Joi from "joi";

export const identityKeySchema = Joi.object({
  identityPublicKey: Joi.string().trim().min(20).max(4096).required().messages({
    "any.required": "Identity public key is required",
  }),
});
