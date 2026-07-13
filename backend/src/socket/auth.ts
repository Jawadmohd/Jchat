import type { Socket } from "socket.io";
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
    const user = await User.findById(userId).select("username name");

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      username: user.username,
      name: user.name?.trim() || user.username,
    };
  } catch {
    return null;
  }
};
