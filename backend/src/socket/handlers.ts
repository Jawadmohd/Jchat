import type { Server } from "socket.io";
import { isChatParticipant } from "../services/chat/chat.access";
import {
  createMessage,
  markMessagesAsRead,
} from "../services/message/message.service";
import {
  isUserOnline,
  setUserOffline,
  setUserOnline,
} from "../services/presence/presence.service";
import type { AuthenticatedSocket } from "./auth";
import { broadcastPresence } from "./presence";
import { getChatRoom, getUserRoom } from "./rooms";

export const registerSocketHandlers = (io: Server) => {
  io.on("connection", (socket: AuthenticatedSocket) => {
    const { user } = socket.data;

    void socket.join(getUserRoom(user.id));
    void setUserOnline(user.id);
    void broadcastPresence(user.id, true, null);

    socket.on("disconnect", () => {
      void (async () => {
        const lastSeenDate = await setUserOffline(user.id);
        const lastSeen = lastSeenDate ? lastSeenDate.toISOString() : null;
        await broadcastPresence(user.id, await isUserOnline(user.id), lastSeen);
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
          ciphertext,
          iv,
          isEncrypted,
          messageType,
          attachmentUrl,
          attachmentName,
          attachmentMimeType,
          attachmentSize,
          replyToMessageId,
        }: {
          chatId: string;
          content?: string;
          ciphertext?: string;
          iv?: string;
          isEncrypted?: boolean;
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
            ciphertext,
            iv,
            isEncrypted,
            messageType: messageType ?? "text",
            attachmentUrl,
            attachmentName,
            attachmentMimeType,
            attachmentSize,
            replyToMessageId,
          });
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

      await markMessagesAsRead(chatId, user.id);
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
};
