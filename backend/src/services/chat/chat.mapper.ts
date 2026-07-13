import type { IChatDocument } from "../../models";
import type { PopulatedLastMessage, PopulatedUser } from "../../types/populated.types";
import { getMessagePreview } from "../message/message.mapper";

export const CHAT_POPULATE_OPTIONS = [
  { path: "participants", select: "username name emailId avatarUrl" },
  {
    path: "lastMessage",
    select: "content messageType attachmentName sender createdAt",
    populate: { path: "sender", select: "username name emailId avatarUrl" },
  },
] as const;

export const toPublicUser = (
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

export const getAdminIds = (chat: IChatDocument) => {
  if ((chat.adminIds ?? []).length > 0) {
    return chat.adminIds.map((id) => id.toString());
  }

  if (chat.participants.length > 0) {
    return [chat.participants[0].toString()];
  }

  return [];
};

export const toPublicChat = (
  chat: IChatDocument,
  currentUserId: string,
  unreadCount = 0,
  isPinned = false,
  presenceMap = new Map<string, { isOnline: boolean; lastSeen: string | null }>()
) => {
  const participants = (chat.participants as unknown as PopulatedUser[]).map((user) =>
    toPublicUser(user, presenceMap.get(user._id.toString()))
  );

  const adminIds = getAdminIds(chat);

  const otherParticipant =
    chat.type === "direct"
      ? participants.find((participant) => participant.id !== currentUserId) ?? null
      : null;

  const displayName =
    chat.type === "group"
      ? chat.name ?? "Group chat"
      : otherParticipant?.name ?? "Unknown user";

  const lastMessageDoc = chat.lastMessage as unknown as PopulatedLastMessage | null;
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
    createdBy: chat.createdBy?.toString() ?? null,
    adminIds,
    isAdmin: chat.type === "group" ? adminIds.includes(currentUserId) : false,
    lastMessage,
    unreadCount,
    isPinned,
    updatedAt: chat.updatedAt,
    createdAt: chat.createdAt,
  };
};
