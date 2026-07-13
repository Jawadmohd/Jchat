import { Chat } from "../../models";
import { ApiError } from "../../utils";

export const assertChatParticipant = async (chatId: string, userId: string) => {
  const chat = await Chat.findOne({ _id: chatId, participants: userId }).select("_id");

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  return chat;
};

export const isChatParticipant = async (chatId: string, userId: string) => {
  const chat = await Chat.findOne({ _id: chatId, participants: userId }).select("_id");
  return Boolean(chat);
};
