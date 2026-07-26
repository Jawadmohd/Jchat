import jwt, { type SignOptions } from "jsonwebtoken";
import { ApiError } from "./apiError";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret-change-me";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];

export interface JwtPayload {
  userId: string;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    // jwt.verify throws for expired/invalid tokens — normalize to ApiError.
    throw new ApiError(401, "Invalid or expired token");
  }
};
