import type { NextFunction, Request, Response } from "express";
import { CACHE_TTL, cacheGet, cacheKeys, cacheSet } from "../cache";
import { User } from "../models";
import type { AuthUser } from "../types/express";
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
    const cacheKey = cacheKeys.authUser(userId);
    const cachedUser = await cacheGet<AuthUser>(cacheKey);

    if (cachedUser) {
      req.user = cachedUser;
      next();
      return;
    }

    const user = await User.findById(userId).select("emailId username name");

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    const authUser: AuthUser = {
      id: user._id.toString(),
      emailId: user.emailId,
      username: user.username,
      name: user.name?.trim() || user.username,
    };

    await cacheSet(cacheKey, authUser, CACHE_TTL.AUTH_USER);
    req.user = authUser;

    next();
  } catch (error) {
    next(error);
  }
};
