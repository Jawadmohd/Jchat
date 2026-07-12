import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import { Chat, User } from "../models";
import {
  createMessage,
  markMessagesAsRead,
} from "../services/message/message.service";
import {
  isUserOnline,
  setUserOffline,
  setUserOnline,
} from "../services/presence/presence.service";
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
  name: string;
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

const isChatParticipant = async (chatId: string, userId: string) => {
  const chat = await Chat.findOne({ _id: chatId, participants: userId }).select("_id");
  return Boolean(chat);
};

const getChatRoom = (chatId: string) => `chat:${chatId}`;
const getUserRoom = (userId: string) => `user:${userId}`;

const emitToChatParticipants = async (
  chatId: string,
  event: string,
  payload: unknown
) => {
  if (!io) {
    return;
  }

  const chat = await Chat.findById(chatId).select("participants").lean();

  if (!chat) {
    return;
  }

  for (const participantId of chat.participants) {
    io.to(getUserRoom(participantId.toString())).emit(event, payload);
  }
};

export const emitNewMessage = (chatId: string, message: unknown) => {
  void emitToChatParticipants(chatId, "message:new", message);
};

export const emitMessageUpdated = (chatId: string, message: unknown) => {
  void emitToChatParticipants(chatId, "message:updated", message);
};

export const emitMessageDeleted = (
  chatId: string,
  payload: { messageId: string; chatId: string }
) => {
  void emitToChatParticipants(chatId, "message:deleted", payload);
};

export const emitMessagesRead = (
  chatId: string,
  payload: { chatId: string; userId: string; messageIds: string[] }
) => {
  io?.to(getChatRoom(chatId)).emit("messages:read", payload);
  void emitToChatParticipants(chatId, "messages:read", payload);
};

export const emitMessagePinned = (chatId: string, message: unknown) => {
  void emitToChatParticipants(chatId, "message:pinned", message);
};

const broadcastPresence = async (userId: string, isOnline: boolean, lastSeen: string | null) => {
  if (!io) {
    return;
  }

  const chats = await Chat.find({ participants: userId }).select("participants").lean();
  const recipientIds = new Set<string>();

  for (const chat of chats) {
    for (const participantId of chat.participants) {
      const participant = participantId.toString();
      if (participant !== userId) {
        recipientIds.add(participant);
      }
    }
  }

  const payload = { userId, isOnline, lastSeen };

  for (const recipientId of recipientIds) {
    io.to(getUserRoom(recipientId)).emit("presence:update", payload);
  }
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

    void socket.join(getUserRoom(user.id));
    setUserOnline(user.id);
    void broadcastPresence(user.id, true, null);

    socket.on("disconnect", () => {
      void (async () => {
        const lastSeenDate = await setUserOffline(user.id);
        const lastSeen = lastSeenDate ? lastSeenDate.toISOString() : null;
        await broadcastPresence(user.id, isUserOnline(user.id), lastSeen);
      })();
    });

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
        {
          chatId,
          content,
          messageType,
          attachmentUrl,
          attachmentName,
          attachmentMimeType,
          attachmentSize,
          replyToMessageId,
        }: {
          chatId: string;
          content?: string;
          messageType?: "text" | "image" | "file";
          attachmentUrl?: string;
          attachmentName?: string;
          attachmentMimeType?: string;
          attachmentSize?: number;
          replyToMessageId?: string;
        },
        callback?: (response: { success: boolean; data?: unknown; error?: string }) => void
      ) => {
        try {
          if (!chatId) {
            callback?.({ success: false, error: "Invalid message payload" });
            return;
          }

          const message = await createMessage(chatId, user.id, {
            content,
            messageType: messageType ?? "text",
            attachmentUrl,
            attachmentName,
            attachmentMimeType,
            attachmentSize,
            replyToMessageId,
          });
          void emitToChatParticipants(chatId, "message:new", message);
          callback?.({ success: true, data: message });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to send message";
          callback?.({ success: false, error: message });
        }
      }
    );

    socket.on("messages:read", async ({ chatId }: { chatId: string }) => {
      if (!chatId || !(await isChatParticipant(chatId, user.id))) {
        return;
      }

      const result = await markMessagesAsRead(chatId, user.id);
      emitMessagesRead(chatId, result);
    });

    socket.on("typing:start", async ({ chatId }: { chatId: string }) => {
      if (!chatId || !(await isChatParticipant(chatId, user.id))) {
        return;
      }

      socket.to(getChatRoom(chatId)).emit("typing:start", {
        chatId,
        userId: user.id,
        username: user.username,
        name: user.name,
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
