import type { Socket } from "socket.io";
import { CACHE_TTL, cacheGet, cacheKeys, cacheSet } from "../cache";
import { User } from "../models";
import { getTokenCookieName } from "../utils/cookie.util";
import { verifyToken } from "../utils/jwt.util";

export interface SocketUser {
  id: string;
  username: string;
  name: string;
}

export interface AuthenticatedSocket extends Socket {
  data: {
    user: SocketUser;
  };
}

const parseCookies = (cookieHeader: string): Record<string, string> => {
  return Object.fromEntries(
    cookieHeader.split(";").map((part) => {
      const [key, ...valueParts] = part.trim().split("=");
      return [key, decodeURIComponent(valueParts.join("="))];
    })
  );
};

export const parseAuthUser = async (socket: Socket): Promise<SocketUser | null> => {
  const cookieHeader = socket.handshake.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookies = parseCookies(cookieHeader);
  const token = cookies[getTokenCookieName()];

  if (!token) {
    return null;
  }

  try {
    const { userId } = verifyToken(token);
    const cacheKey = cacheKeys.authUser(userId);
    const cachedUser = await cacheGet<{ id: string; username: string; name: string }>(cacheKey);

    if (cachedUser) {
      return {
        id: cachedUser.id,
        username: cachedUser.username,
        name: cachedUser.name,
      };
    }

    const user = await User.findById(userId).select("username name emailId");

    if (!user) {
      return null;
    }

    const socketUser: SocketUser = {
      id: user._id.toString(),
      username: user.username,
      name: user.name?.trim() || user.username,
    };

    await cacheSet(
      cacheKey,
      {
        id: socketUser.id,
        emailId: user.emailId,
        username: socketUser.username,
        name: socketUser.name,
      },
      CACHE_TTL.AUTH_USER
    );

    return socketUser;
  } catch {
    return null;
  }
};
