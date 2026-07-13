import { CACHE_TTL, cacheGet, cacheKeys, cacheSet } from "../../cache";
import { Chat } from "../../models";
import { ApiError } from "../../utils";

export const assertChatParticipant = async (chatId: string, userId: string) => {
  const cacheKey = cacheKeys.participant(chatId, userId);
  const cached = await cacheGet<"1">(cacheKey);

  if (cached === "1") {
    return { _id: chatId };
  }

  const chat = await Chat.findOne({ _id: chatId, participants: userId }).select("_id");

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  await cacheSet(cacheKey, "1", CACHE_TTL.PARTICIPANT);

  return chat;
};

export const isChatParticipant = async (chatId: string, userId: string) => {
  const cacheKey = cacheKeys.participant(chatId, userId);
  const cached = await cacheGet<"1">(cacheKey);

  if (cached === "1") {
    return true;
  }

  const chat = await Chat.findOne({ _id: chatId, participants: userId }).select("_id");

  if (!chat) {
    return false;
  }

  await cacheSet(cacheKey, "1", CACHE_TTL.PARTICIPANT);
  return true;
};
