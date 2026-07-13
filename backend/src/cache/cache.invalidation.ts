import { Chat } from "../models";
import { cacheDelete, cacheDeletePattern } from "./cache.service";
import { cacheKeys } from "./cache.keys";

const getParticipantIds = async (chatId: string) => {
  const chat = await Chat.findById(chatId).select("participants").lean();
  return chat?.participants.map((participant) => participant.toString()) ?? [];
};

export const invalidateAuthUser = async (userId: string) => {
  await cacheDelete(cacheKeys.authUser(userId));
  await cacheDelete(cacheKeys.userProfile(userId));
};

export const invalidateInbox = async (userId: string) => {
  await cacheDelete(cacheKeys.inbox(userId));
};

export const invalidateInboxForParticipants = async (
  participantIds: string[],
  chatId?: string
) => {
  await Promise.all(
    participantIds.map(async (userId) => {
      await invalidateInbox(userId);

      if (chatId) {
        await cacheDelete(cacheKeys.chatForUser(chatId, userId));
        await cacheDelete(cacheKeys.participant(chatId, userId));
      }
    })
  );
};

export const invalidateChatCaches = async (chatId: string, participantIds?: string[]) => {
  const ids = participantIds ?? (await getParticipantIds(chatId));

  await Promise.all([
    cacheDeletePattern(cacheKeys.messagesPattern(chatId)),
    cacheDelete(cacheKeys.pinnedMessages(chatId)),
    cacheDelete(cacheKeys.chatParticipants(chatId)),
    invalidateInboxForParticipants(ids, chatId),
  ]);
};
