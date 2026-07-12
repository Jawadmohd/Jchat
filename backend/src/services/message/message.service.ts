import { Types } from "mongoose";
import { Chat, Message, type IMessageDocument, type MessageType } from "../../models";
import { ApiError } from "../../utils";

interface PopulatedUser {
  _id: { toString(): string };
  username: string;
  name?: string;
  emailId: string;
  avatarUrl?: string | null;
}

interface PopulatedReplyMessage {
  _id: { toString(): string };
  content: string;
  messageType: MessageType;
  attachmentName?: string | null;
  sender: PopulatedUser | Types.ObjectId;
}

const senderPopulateFields = "username name emailId avatarUrl";
const replyPopulate = {
  path: "replyTo",
  select: "content messageType attachmentName sender",
  populate: { path: "sender", select: senderPopulateFields },
};

const toPublicReply = (replyMessage: PopulatedReplyMessage | null | undefined) => {
  if (!replyMessage || typeof replyMessage !== "object" || !("_id" in replyMessage)) {
    return null;
  }

  const sender = replyMessage.sender as PopulatedUser;

  return {
    id: replyMessage._id.toString(),
    content: replyMessage.content,
    messageType: replyMessage.messageType,
    attachmentName: replyMessage.attachmentName ?? null,
    sender: {
      id: sender._id.toString(),
      username: sender.username,
      name: sender.name?.trim() || sender.username,
      emailId: sender.emailId,
      avatarUrl: sender.avatarUrl ?? null,
    },
  };
};

export const toPublicMessage = (message: IMessageDocument) => {
  const sender = message.sender as unknown as PopulatedUser;
  const replyTo = message.replyTo as unknown as PopulatedReplyMessage | null | undefined;

  return {
    id: message._id.toString(),
    chatId: message.chat.toString(),
    sender: {
      id: sender._id.toString(),
      username: sender.username,
      name: sender.name?.trim() || sender.username,
      emailId: sender.emailId,
      avatarUrl: sender.avatarUrl ?? null,
    },
    content: message.content,
    messageType: message.messageType,
    attachmentUrl: message.attachmentUrl ?? null,
    attachmentName: message.attachmentName ?? null,
    attachmentMimeType: message.attachmentMimeType ?? null,
    attachmentSize: message.attachmentSize ?? null,
    readBy: message.readBy.map((id) => id.toString()),
    isEdited: message.isEdited ?? false,
    replyTo: toPublicReply(replyTo),
    isPinned: message.isPinned ?? false,
    pinnedAt: message.pinnedAt ? message.pinnedAt.toISOString() : null,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
};

export const getMessagePreview = (message: {
  content: string;
  messageType: MessageType;
  attachmentName?: string | null;
}) => {
  if (message.messageType === "image") {
    return message.content.trim() || "Photo";
  }

  if (message.messageType === "file") {
    return message.content.trim() || `File: ${message.attachmentName ?? "attachment"}`;
  }

  return message.content;
};

const assertChatParticipant = async (chatId: string, userId: string) => {
  const chat = await Chat.findOne({ _id: chatId, participants: userId }).select("_id");

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  return chat;
};

interface CreateMessageInput {
  content?: string;
  messageType?: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
  attachmentSize?: number;
  replyToMessageId?: string;
}

const populateMessage = async (message: IMessageDocument) => {
  await message.populate("sender", senderPopulateFields);
  await message.populate(replyPopulate);
  return message;
};

export const createMessage = async (
  chatId: string,
  userId: string,
  input: CreateMessageInput | string
) => {
  await assertChatParticipant(chatId, userId);

  const payload: CreateMessageInput =
    typeof input === "string" ? { content: input, messageType: "text" } : input;

  const messageType = payload.messageType ?? "text";
  const content = payload.content?.trim() ?? "";

  if (messageType === "text" && !content && !payload.replyToMessageId) {
    throw new ApiError(400, "Message content is required");
  }

  if (messageType !== "text" && !payload.attachmentUrl) {
    throw new ApiError(400, "Attachment is required");
  }

  if (payload.replyToMessageId) {
    const replyTarget = await Message.findOne({
      _id: payload.replyToMessageId,
      chat: chatId,
    }).select("_id");

    if (!replyTarget) {
      throw new ApiError(404, "Reply target message not found");
    }
  }

  const message = await Message.create({
    chat: chatId,
    sender: userId,
    content,
    messageType,
    attachmentUrl: payload.attachmentUrl ?? null,
    attachmentName: payload.attachmentName ?? null,
    attachmentMimeType: payload.attachmentMimeType ?? null,
    attachmentSize: payload.attachmentSize ?? null,
    readBy: [userId],
    replyTo: payload.replyToMessageId ?? null,
  });

  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: message._id,
    updatedAt: new Date(),
  });

  await populateMessage(message);

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
    .limit(limit + 1)
    .populate("sender", senderPopulateFields)
    .populate(replyPopulate);

  const hasMore = messages.length > limit;
  const page = hasMore ? messages.slice(0, limit) : messages;

  return {
    messages: page.reverse().map((message) => toPublicMessage(message)),
    hasMore,
    nextBefore: hasMore ? page[0].createdAt.toISOString() : null,
  };
};

export const getPinnedMessagesByChat = async (chatId: string, userId: string) => {
  await assertChatParticipant(chatId, userId);

  const messages = await Message.find({ chat: chatId, isPinned: true })
    .sort({ pinnedAt: -1 })
    .populate("sender", senderPopulateFields)
    .populate(replyPopulate);

  return messages.map((message) => toPublicMessage(message));
};

export const getUnreadCountsByChat = async (userId: string, chatIds: string[]) => {
  if (chatIds.length === 0) {
    return new Map<string, number>();
  }

  const objectIds = chatIds.map((id) => new Types.ObjectId(id));
  const userObjectId = new Types.ObjectId(userId);

  const results = await Message.aggregate<{ _id: Types.ObjectId; count: number }>([
    {
      $match: {
        chat: { $in: objectIds },
        sender: { $ne: userObjectId },
        readBy: { $ne: userObjectId },
      },
    },
    {
      $group: {
        _id: "$chat",
        count: { $sum: 1 },
      },
    },
  ]);

  return new Map(results.map((item) => [item._id.toString(), item.count]));
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
  await assertChatParticipant(chatId, userId);

  const result = await Message.updateMany(
    {
      chat: chatId,
      sender: { $ne: userId },
      readBy: { $ne: userId },
    },
    { $addToSet: { readBy: userId } }
  );

  const updatedMessages = await Message.find({
    chat: chatId,
    readBy: userId,
    sender: { $ne: userId },
  })
    .select("_id readBy")
    .lean();

  return {
    chatId,
    userId,
    updatedCount: result.modifiedCount,
    messageIds: updatedMessages.map((message) => message._id.toString()),
  };
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

  if (message.messageType !== "text") {
    throw new ApiError(400, "Only text messages can be edited");
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
  await populateMessage(message);

  return toPublicMessage(message);
};

export const deleteMessage = async (
  messageId: string,
  chatId: string,
  userId: string
) => {
  const message = await Message.findOne({ _id: messageId, chat: chatId });

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.sender.toString() !== userId) {
    throw new ApiError(403, "You can only delete your own messages");
  }

  const chat = await Chat.findById(chatId).select("lastMessage");

  await message.deleteOne();

  if (chat?.lastMessage?.toString() === messageId) {
    await syncChatLastMessage(chatId);
  }

  return { messageId, chatId };
};

export const pinMessage = async (messageId: string, chatId: string, userId: string) => {
  await assertChatParticipant(chatId, userId);

  const message = await Message.findOne({ _id: messageId, chat: chatId });

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  message.isPinned = true;
  message.pinnedAt = new Date();
  message.pinnedBy = new Types.ObjectId(userId);
  await message.save();
  await populateMessage(message);

  return toPublicMessage(message);
};

export const unpinMessage = async (messageId: string, chatId: string, userId: string) => {
  await assertChatParticipant(chatId, userId);

  const message = await Message.findOne({ _id: messageId, chat: chatId });

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  message.isPinned = false;
  message.pinnedAt = null;
  message.pinnedBy = null;
  await message.save();
  await populateMessage(message);

  return toPublicMessage(message);
};
