import type { NextFunction, Request, Response } from "express";
import type { ObjectSchema } from "joi";
import { ApiError } from "../utils/apiError";

export const validate =
  (schema: ObjectSchema, property: "body" | "params" | "query" = "body") =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(", ");
      next(new ApiError(400, message));
      return;
    }

    req[property] = value;
    next();
  };
