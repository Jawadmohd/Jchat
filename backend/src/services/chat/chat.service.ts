import { Types } from "mongoose";
import { Chat, User, type IChatDocument } from "../../models";
import { getMessagePreview, getUnreadCountsByChat } from "../message/message.service";
import { getPresenceForUsers } from "../presence/presence.service";
import { ApiError } from "../../utils";

interface PopulatedUser {
  _id: { toString(): string };
  username: string;
  name?: string;
  emailId: string;
  avatarUrl?: string | null;
}

interface PopulatedMessage {
  _id: { toString(): string };
  content: string;
  messageType: "text" | "image" | "file";
  attachmentName?: string | null;
  sender: PopulatedUser | { toString(): string };
  createdAt: Date;
}

const toPublicUser = (
  user: PopulatedUser,
  presence?: { isOnline: boolean; lastSeen: string | null }
) => ({
  id: user._id.toString(),
  username: user.username,
  name: user.name?.trim() || user.username,
  emailId: user.emailId,
  avatarUrl: user.avatarUrl ?? null,
  isOnline: presence?.isOnline ?? false,
  lastSeen: presence?.lastSeen ?? null,
});

const toPublicChat = (
  chat: IChatDocument,
  currentUserId: string,
  unreadCount = 0,
  isPinned = false,
  presenceMap = new Map<string, { isOnline: boolean; lastSeen: string | null }>()
) => {
  const participants = (chat.participants as unknown as PopulatedUser[]).map((user) =>
    toPublicUser(user, presenceMap.get(user._id.toString()))
  );

  const otherParticipant =
    chat.type === "direct"
      ? participants.find((participant) => participant.id !== currentUserId) ?? null
      : null;

  const displayName =
    chat.type === "group"
      ? chat.name ?? "Group chat"
      : otherParticipant?.name ?? "Unknown user";

  const lastMessageDoc = chat.lastMessage as unknown as PopulatedMessage | null;
  let lastMessage = null;

  if (lastMessageDoc && typeof lastMessageDoc === "object" && "content" in lastMessageDoc) {
    const senderId =
      typeof lastMessageDoc.sender === "object" && "_id" in lastMessageDoc.sender
        ? lastMessageDoc.sender._id.toString()
        : lastMessageDoc.sender.toString();

    lastMessage = {
      id: lastMessageDoc._id.toString(),
      content: getMessagePreview(lastMessageDoc),
      messageType: lastMessageDoc.messageType ?? "text",
      senderId,
      createdAt: lastMessageDoc.createdAt,
    };
  }

  return {
    id: chat._id.toString(),
    type: chat.type,
    name: chat.name ?? null,
    displayName,
    participants,
    otherParticipant,
    lastMessage,
    unreadCount,
    isPinned,
    updatedAt: chat.updatedAt,
    createdAt: chat.createdAt,
  };
};

const populateOptions = [
  { path: "participants", select: "username name emailId avatarUrl" },
  {
    path: "lastMessage",
    select: "content messageType attachmentName sender createdAt",
    populate: { path: "sender", select: "username name emailId avatarUrl" },
  },
] as const;

export const getUserChats = async (userId: string) => {
  const currentUser = await User.findById(userId).select("pinnedChatIds");

  if (!currentUser) {
    throw new ApiError(404, "User not found");
  }

  const pinnedChatIds = currentUser.pinnedChatIds.map((id) => id.toString());
  const pinnedOrder = new Map(pinnedChatIds.map((id, index) => [id, index]));

  const chats = await Chat.find({ participants: userId })
    .populate(populateOptions[0])
    .populate(populateOptions[1]);

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

export const getOrCreateDirectChat = async (
  userId: string,
  participantId: string
) => {
  if (userId === participantId) {
    throw new ApiError(400, "You cannot create a chat with yourself");
  }

  const otherUser = await User.findById(participantId).select("username emailId");

  if (!otherUser) {
    throw new ApiError(404, "User not found");
  }

  const existingChat = await Chat.findOne({
    type: "direct",
    participants: { $all: [userId, participantId], $size: 2 },
  })
    .populate(populateOptions[0])
    .populate(populateOptions[1]);

  if (existingChat) {
    const currentUser = await User.findById(userId).select("pinnedChatIds");
    const pinnedChatIds = currentUser?.pinnedChatIds.map((id) => id.toString()) ?? [];
    const unreadMap = await getUnreadCountsByChat(userId, [existingChat._id.toString()]);
    const presenceMap = await getPresenceForUsers([participantId]);
    return toPublicChat(
      existingChat,
      userId,
      unreadMap.get(existingChat._id.toString()) ?? 0,
      pinnedChatIds.includes(existingChat._id.toString()),
      presenceMap
    );
  }

  const chat = await Chat.create({
    type: "direct",
    participants: [userId, participantId],
  });

  await chat.populate("participants", "username name emailId avatarUrl");

  return toPublicChat(chat, userId, 0);
};

export const createGroupChat = async (
  userId: string,
  name: string,
  participantIds: string[]
) => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new ApiError(400, "Group name is required");
  }

  const uniqueParticipantIds = [...new Set(participantIds.filter((id) => id !== userId))];

  if (uniqueParticipantIds.length < 1) {
    throw new ApiError(400, "Select at least one member for the group");
  }

  const participants = [userId, ...uniqueParticipantIds];
  const existingUsers = await User.find({ _id: { $in: participants } }).select("_id");

  if (existingUsers.length !== participants.length) {
    throw new ApiError(404, "One or more selected users were not found");
  }

  const chat = await Chat.create({
    type: "group",
    name: trimmedName,
    participants,
  });

  await chat.populate("participants", "username name emailId avatarUrl");

  return toPublicChat(chat, userId, 0);
};

export const getChatById = async (chatId: string, userId: string) => {
  const chat = await Chat.findOne({
    _id: chatId,
    participants: userId,
  })
    .populate(populateOptions[0])
    .populate(populateOptions[1]);

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

export const pinChat = async (chatId: string, userId: string) => {
  await getChatById(chatId, userId);

  const user = await User.findById(userId).select("pinnedChatIds");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const chatObjectId = chatId;
  const alreadyPinned = user.pinnedChatIds.some((id) => id.toString() === chatObjectId);

  if (!alreadyPinned) {
    user.pinnedChatIds.push(new Types.ObjectId(chatId));
    await user.save();
  }

  return { chatId, isPinned: true };
};

export const unpinChat = async (chatId: string, userId: string) => {
  await getChatById(chatId, userId);

  await User.findByIdAndUpdate(userId, {
    $pull: { pinnedChatIds: chatId },
  });

  return { chatId, isPinned: false };
};
