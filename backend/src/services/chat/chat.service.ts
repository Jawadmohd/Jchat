import { Chat, User, type IChatDocument } from "../../models";
import { ApiError } from "../../utils";

interface PopulatedUser {
  _id: { toString(): string };
  username: string;
  emailId: string;
  avatarUrl?: string | null;
}

interface PopulatedMessage {
  _id: { toString(): string };
  content: string;
  sender: PopulatedUser | { toString(): string };
  createdAt: Date;
}

const toPublicUser = (user: PopulatedUser) => ({
  id: user._id.toString(),
  username: user.username,
  emailId: user.emailId,
  avatarUrl: user.avatarUrl ?? null,
});

const toPublicChat = (chat: IChatDocument, currentUserId: string) => {
  const participants = (chat.participants as unknown as PopulatedUser[]).map(
    toPublicUser
  );

  const otherParticipant =
    chat.type === "direct"
      ? participants.find((participant) => participant.id !== currentUserId) ?? null
      : null;

  const displayName =
    chat.type === "group"
      ? chat.name ?? "Group chat"
      : otherParticipant?.username ?? "Unknown user";

  const lastMessageDoc = chat.lastMessage as unknown as PopulatedMessage | null;
  let lastMessage = null;

  if (lastMessageDoc && typeof lastMessageDoc === "object" && "content" in lastMessageDoc) {
    const senderId =
      typeof lastMessageDoc.sender === "object" && "_id" in lastMessageDoc.sender
        ? lastMessageDoc.sender._id.toString()
        : lastMessageDoc.sender.toString();

    lastMessage = {
      id: lastMessageDoc._id.toString(),
      content: lastMessageDoc.content,
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
    updatedAt: chat.updatedAt,
    createdAt: chat.createdAt,
  };
};

export const getUserChats = async (userId: string) => {
  const chats = await Chat.find({ participants: userId })
    .sort({ updatedAt: -1 })
    .populate("participants", "username emailId avatarUrl")
    .populate({
      path: "lastMessage",
      select: "content sender createdAt",
      populate: { path: "sender", select: "username emailId avatarUrl" },
    });

  return chats.map((chat) => toPublicChat(chat, userId));
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
    .populate("participants", "username emailId avatarUrl")
    .populate({
      path: "lastMessage",
      select: "content sender createdAt",
      populate: { path: "sender", select: "username emailId avatarUrl" },
    });

  if (existingChat) {
    return toPublicChat(existingChat, userId);
  }

  const chat = await Chat.create({
    type: "direct",
    participants: [userId, participantId],
  });

  await chat.populate("participants", "username emailId");

  return toPublicChat(chat, userId);
};

export const getChatById = async (chatId: string, userId: string) => {
  const chat = await Chat.findOne({
    _id: chatId,
    participants: userId,
  })
    .populate("participants", "username emailId avatarUrl")
    .populate({
      path: "lastMessage",
      select: "content sender createdAt",
      populate: { path: "sender", select: "username emailId avatarUrl" },
    });

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  return toPublicChat(chat, userId);
};
