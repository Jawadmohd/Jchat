import { CACHE_TTL, cacheGetOrSet, cacheKeys } from "../../cache";
import { Chat, User } from "../../models";
import { getUnreadCountsByChat } from "../message/message.read.service";
import { getPresenceForUsers } from "../presence/presence.service";
import { ApiError } from "../../utils";
import { CHAT_POPULATE_OPTIONS, toPublicChat } from "./chat.mapper";

type PublicChat = ReturnType<typeof toPublicChat>;

const attachLivePresence = async (chats: PublicChat[]): Promise<PublicChat[]> => {
  const otherUserIds = chats
    .filter((chat) => chat.type === "direct" && chat.otherParticipant)
    .map((chat) => chat.otherParticipant!.id);

  const presenceMap = await getPresenceForUsers(otherUserIds);

  return chats.map((chat) => {
    if (chat.type !== "direct" || !chat.otherParticipant) {
      return chat;
    }

    const presence = presenceMap.get(chat.otherParticipant.id) ?? {
      isOnline: false,
      lastSeen: chat.otherParticipant.lastSeen ?? null,
    };

    return {
      ...chat,
      otherParticipant: {
        ...chat.otherParticipant,
        isOnline: presence.isOnline,
        lastSeen: presence.lastSeen,
      },
      participants: chat.participants.map((participant) =>
        participant.id === chat.otherParticipant!.id
          ? {
              ...participant,
              isOnline: presence.isOnline,
              lastSeen: presence.lastSeen,
            }
          : participant
      ),
    };
  });
};

const fetchChatByIdWithoutPresence = async (chatId: string, userId: string) => {
  const chat = await Chat.findOne({
    _id: chatId,
    participants: userId,
  })
    .populate(CHAT_POPULATE_OPTIONS[0])
    .populate(CHAT_POPULATE_OPTIONS[1]);

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  const currentUser = await User.findById(userId).select("pinnedChatIds");
  const pinnedChatIds = currentUser?.pinnedChatIds.map((id) => id.toString()) ?? [];
  const unreadMap = await getUnreadCountsByChat(userId, [chatId]);

  return toPublicChat(
    chat,
    userId,
    unreadMap.get(chatId) ?? 0,
    pinnedChatIds.includes(chatId)
  );
};

export const getChatById = async (chatId: string, userId: string) => {
  const cached = await cacheGetOrSet(
    cacheKeys.chatForUser(chatId, userId),
    CACHE_TTL.CHAT,
    () => fetchChatByIdWithoutPresence(chatId, userId)
  );

  const [withPresence] = await attachLivePresence([cached]);
  return withPresence;
};

const fetchUserChatsWithoutPresence = async (userId: string) => {
  const currentUser = await User.findById(userId).select("pinnedChatIds");

  if (!currentUser) {
    throw new ApiError(404, "User not found");
  }

  const pinnedChatIds = currentUser.pinnedChatIds.map((id) => id.toString());
  const pinnedOrder = new Map(pinnedChatIds.map((id, index) => [id, index]));

  const chats = await Chat.find({ participants: userId })
    .populate(CHAT_POPULATE_OPTIONS[0])
    .populate(CHAT_POPULATE_OPTIONS[1]);

  const unreadMap = await getUnreadCountsByChat(
    userId,
    chats.map((chat) => chat._id.toString())
  );

  const publicChats = chats.map((chat) => {
    const chatId = chat._id.toString();
    return toPublicChat(
      chat,
      userId,
      unreadMap.get(chatId) ?? 0,
      pinnedOrder.has(chatId)
    );
  });

  return publicChats.sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }

    if (a.isPinned && b.isPinned) {
      return (pinnedOrder.get(a.id) ?? 0) - (pinnedOrder.get(b.id) ?? 0);
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
};

export const getUserChats = async (userId: string) => {
  const cached = await cacheGetOrSet(cacheKeys.inbox(userId), CACHE_TTL.INBOX, () =>
    fetchUserChatsWithoutPresence(userId)
  );

  return attachLivePresence(cached);
};
