import Joi from "joi";

export const registerUserSchema = Joi.object({
  emailId: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  username: Joi.string().trim().min(3).max(30).required().messages({
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username cannot exceed 30 characters",
    "any.required": "Username is required",
  }),
  name: Joi.string().trim().min(1).max(60).required().messages({
    "string.min": "Name is required",
    "string.max": "Name cannot exceed 60 characters",
    "any.required": "Name is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
});

export const loginUserSchema = Joi.object({
  emailId: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

export const updateUserSchema = Joi.object({
  emailId: Joi.string().email().messages({
    "string.email": "Please provide a valid email address",
  }),
  username: Joi.string().trim().min(3).max(30).messages({
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username cannot exceed 30 characters",
  }),
  name: Joi.string().trim().min(1).max(60).messages({
    "string.min": "Name is required",
    "string.max": "Name cannot exceed 60 characters",
  }),
  currentPassword: Joi.string().messages({
    "string.empty": "Current password is required",
  }),
  password: Joi.string().min(6).messages({
    "string.min": "New password must be at least 6 characters",
  }),
})
  .and("password", "currentPassword")
  .min(1)
  .messages({
    "object.min": "At least one field is required to update",
    "object.and": "Current password is required to set a new password",
  });
