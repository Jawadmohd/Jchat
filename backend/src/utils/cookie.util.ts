import type { Response } from "express";

const TOKEN_COOKIE_NAME = "token";
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    // secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_MS,
  });
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    // secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};

export const getTokenCookieName = (): string => TOKEN_COOKIE_NAME;
