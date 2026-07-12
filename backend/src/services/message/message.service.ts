import { Chat, Message, type IMessageDocument } from "../../models";
import { ApiError } from "../../utils";

interface PopulatedUser {
  _id: { toString(): string };
  username: string;
  emailId: string;
  avatarUrl?: string | null;
}

const toPublicUser = (user: PopulatedUser) => ({
  id: user._id.toString(),
  username: user.username,
  emailId: user.emailId,
  avatarUrl: user.avatarUrl ?? null,
});

export const toPublicMessage = (message: IMessageDocument) => {
  const sender = message.sender as unknown as PopulatedUser;

  return {
    id: message._id.toString(),
    chatId: message.chat.toString(),
    sender: toPublicUser(sender),
    content: message.content,
    readBy: message.readBy.map((id) => id.toString()),
    isEdited: message.isEdited ?? false,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
};

const assertChatParticipant = async (chatId: string, userId: string) => {
  const chat = await Chat.findOne({ _id: chatId, participants: userId }).select("_id");

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  return chat;
};

export const createMessage = async (
  chatId: string,
  userId: string,
  content: string
) => {
  await assertChatParticipant(chatId, userId);

  const message = await Message.create({
    chat: chatId,
    sender: userId,
    content: content.trim(),
    readBy: [userId],
  });

  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: message._id,
    updatedAt: new Date(),
  });

  await message.populate("sender", "username emailId avatarUrl");

  return toPublicMessage(message);
};

interface ListMessagesOptions {
  limit?: number;
  before?: string;
}

export const getMessagesByChat = async (
  chatId: string,
  userId: string,
  options: ListMessagesOptions = {}
) => {
  await assertChatParticipant(chatId, userId);

  const limit = options.limit ?? 50;
  const filter: Record<string, unknown> = { chat: chatId };

  if (options.before) {
    filter.createdAt = { $lt: new Date(options.before) };
  }

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", "username emailId avatarUrl");

  return messages.reverse().map((message) => toPublicMessage(message));
};

const getOwnedMessage = async (
  messageId: string,
  chatId: string,
  userId: string
) => {
  await assertChatParticipant(chatId, userId);

  const message = await Message.findOne({ _id: messageId, chat: chatId });

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.sender.toString() !== userId) {
    throw new ApiError(403, "You can only modify your own messages");
  }

  return message;
};

const syncChatLastMessage = async (chatId: string) => {
  const latestMessage = await Message.findOne({ chat: chatId })
    .sort({ createdAt: -1 })
    .select("_id");

  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: latestMessage?._id ?? null,
    updatedAt: new Date(),
  });
};

export const updateMessage = async (
  messageId: string,
  chatId: string,
  userId: string,
  content: string
) => {
  const message = await getOwnedMessage(messageId, chatId, userId);

  message.content = content.trim();
  message.isEdited = true;
  await message.save();
  await message.populate("sender", "username emailId avatarUrl");

  return toPublicMessage(message);
};

export const deleteMessage = async (
  messageId: string,
  chatId: string,
  userId: string
) => {
  const message = await getOwnedMessage(messageId, chatId, userId);
  const chat = await Chat.findById(chatId).select("lastMessage");

  await message.deleteOne();

  if (chat?.lastMessage?.toString() === messageId) {
    await syncChatLastMessage(chatId);
  }

  return { messageId, chatId };
};
