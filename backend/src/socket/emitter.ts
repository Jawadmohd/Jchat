import type { Server } from "socket.io";
import { Chat } from "../models";
import { getChatRoom, getUserRoom } from "./rooms";

let io: Server | null = null;

export const setIO = (server: Server) => {
  io = server;
};

export const getIO = () => io;

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

export const emitMessageReaction = (chatId: string, message: unknown) => {
  void emitToChatParticipants(chatId, "message:reaction", message);
};

export const emitChatUpdated = (chatId: string, payload: unknown) => {
  void emitToChatParticipants(chatId, "chat:updated", payload);
};

export { emitToChatParticipants };
