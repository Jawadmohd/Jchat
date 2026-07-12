import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err.name === "ValidationError") {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err.name === "CastError") {
    res.status(400).json({
      success: false,
      message: "Invalid resource id",
    });
    return;
  }

  if ("code" in err && err.code === 11000) {
    const field = Object.keys(
      (err as { keyPattern?: Record<string, number> }).keyPattern ?? {}
    )[0];

    res.status(409).json({
      success: false,
      message: `${field ?? "Field"} already exists`,
    });
    return;
  }

  if (err.name === "MulterError") {
    const multerError = err as { code?: string };

    if (multerError.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        success: false,
        message: "Image must be 5MB or smaller",
      });
      return;
    }
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
