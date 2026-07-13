import { Chat, User } from "../../models";
import type { PopulatedUser } from "../../types/populated.types";
import { getUnreadCountsByChat } from "../message/message.read.service";
import { getPresenceForUsers } from "../presence/presence.service";
import { ApiError } from "../../utils";
import { CHAT_POPULATE_OPTIONS, toPublicChat } from "./chat.mapper";

export const getChatById = async (chatId: string, userId: string) => {
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

  const otherUserId =
    chat.type === "direct"
      ? (chat.participants as unknown as PopulatedUser[])
          .find((user) => user._id.toString() !== userId)
          ?._id.toString()
      : undefined;

  const presenceMap = await getPresenceForUsers(otherUserId ? [otherUserId] : []);

  return toPublicChat(
    chat,
    userId,
    unreadMap.get(chatId) ?? 0,
    pinnedChatIds.includes(chatId),
    presenceMap
  );
};

export const getUserChats = async (userId: string) => {
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

  const otherUserIds = chats
    .filter((chat) => chat.type === "direct")
    .map((chat) => {
      const participant = (chat.participants as unknown as PopulatedUser[]).find(
        (user) => user._id.toString() !== userId
      );
      return participant?._id.toString();
    })
    .filter((id): id is string => Boolean(id));

  const presenceMap = await getPresenceForUsers(otherUserIds);

  const publicChats = chats.map((chat) => {
    const chatId = chat._id.toString();
    return toPublicChat(
      chat,
      userId,
      unreadMap.get(chatId) ?? 0,
      pinnedOrder.has(chatId),
      presenceMap
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
