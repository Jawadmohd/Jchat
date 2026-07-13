import type { NextFunction, Request, Response } from "express";
import { User } from "../models";
import { getTokenCookieName, verifyToken } from "../utils";

export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies[getTokenCookieName()];

    if (!token) {
      next();
      return;
    }

    const { userId } = verifyToken(token);
    const user = await User.findById(userId).select("emailId username name");

    if (!user) {
      next();
      return;
    }

    req.user = {
      id: user._id.toString(),
      emailId: user.emailId,
      username: user.username,
      name: user.name?.trim() || user.username,
    };

    next();
  } catch {
    next();
  }
};
