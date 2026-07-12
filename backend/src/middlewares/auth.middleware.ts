import type { NextFunction, Request, Response } from "express";
import { User } from "../models";
import { ApiError, getTokenCookieName, verifyToken } from "../utils";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies[getTokenCookieName()];

    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    const { userId } = verifyToken(token);
    const user = await User.findById(userId).select("emailId username");

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    req.user = {
      id: user._id.toString(),
      emailId: user.emailId,
      username: user.username,
    };

    next();
  } catch (error) {
    next(error);
  }
};
