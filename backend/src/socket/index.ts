import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import { Chat, User } from "../models";
import { createMessage } from "../services/message/message.service";
import { getTokenCookieName } from "../utils/cookie.util";
import { verifyToken } from "../utils/jwt.util";

const parseCookies = (cookieHeader: string): Record<string, string> => {
  return Object.fromEntries(
    cookieHeader.split(";").map((part) => {
      const [key, ...valueParts] = part.trim().split("=");
      return [key, decodeURIComponent(valueParts.join("="))];
    })
  );
};

interface SocketUser {
  id: string;
  username: string;
}

interface AuthenticatedSocket extends Socket {
  data: {
    user: SocketUser;
  };
}

let io: Server | null = null;

const parseAuthUser = async (socket: Socket): Promise<SocketUser | null> => {
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
    const user = await User.findById(userId).select("username");

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      username: user.username,
    };
  } catch {
    return null;
  }
};

const isChatParticipant = async (chatId: string, userId: string) => {
  const chat = await Chat.findOne({ _id: chatId, participants: userId }).select("_id");
  return Boolean(chat);
};

const getChatRoom = (chatId: string) => `chat:${chatId}`;

export const emitNewMessage = (chatId: string, message: unknown) => {
  io?.to(getChatRoom(chatId)).emit("message:new", message);
};

export const emitMessageUpdated = (chatId: string, message: unknown) => {
  io?.to(getChatRoom(chatId)).emit("message:updated", message);
};

export const emitMessageDeleted = (
  chatId: string,
  payload: { messageId: string; chatId: string }
) => {
  io?.to(getChatRoom(chatId)).emit("message:deleted", payload);
};

export const initSocket = (httpServer: HttpServer) => {
  const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";

  io = new Server(httpServer, {
    cors: {
      origin: CLIENT_URL,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const user = await parseAuthUser(socket);

    if (!user) {
      next(new Error("Authentication required"));
      return;
    }

    (socket as AuthenticatedSocket).data.user = user;
    next();
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const { user } = socket.data;

    socket.on("chat:join", async ({ chatId }: { chatId: string }) => {
      if (!chatId || !(await isChatParticipant(chatId, user.id))) {
        return;
      }

      await socket.join(getChatRoom(chatId));
    });

    socket.on("chat:leave", ({ chatId }: { chatId: string }) => {
      if (!chatId) {
        return;
      }

      socket.leave(getChatRoom(chatId));
    });

    socket.on(
      "message:send",
      async (
        { chatId, content }: { chatId: string; content: string },
        callback?: (response: { success: boolean; data?: unknown; error?: string }) => void
      ) => {
        try {
          if (!chatId || !content?.trim()) {
            callback?.({ success: false, error: "Invalid message payload" });
            return;
          }

          const message = await createMessage(chatId, user.id, content);
          io?.to(getChatRoom(chatId)).emit("message:new", message);
          callback?.({ success: true, data: message });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to send message";
          callback?.({ success: false, error: message });
        }
      }
    );

    socket.on("typing:start", async ({ chatId }: { chatId: string }) => {
      if (!chatId || !(await isChatParticipant(chatId, user.id))) {
        return;
      }

      socket.to(getChatRoom(chatId)).emit("typing:start", {
        chatId,
        userId: user.id,
        username: user.username,
      });
    });

    socket.on("typing:stop", async ({ chatId }: { chatId: string }) => {
      if (!chatId || !(await isChatParticipant(chatId, user.id))) {
        return;
      }

      socket.to(getChatRoom(chatId)).emit("typing:stop", {
        chatId,
        userId: user.id,
      });
    });
  });

  return io;
};

export const getIO = () => io;
