import { Types } from "mongoose";
import { Chat, Message, type MessageType } from "../../models";
import { assertChatParticipant } from "../chat/chat.access";
import { ApiError } from "../../utils";
import { REPLY_POPULATE, SENDER_POPULATE_FIELDS } from "./message.constants";
import { getOwnedMessage, populateMessage } from "./message.access";
import { toPublicMessage } from "./message.mapper";

interface CreateMessageInput {
  content?: string;
  messageType?: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
  attachmentSize?: number;
  replyToMessageId?: string;
}

const syncChatLastMessage = async (chatId: string) => {
  const latestMessage = await Message.findOne({ chat: chatId })
    .sort({ createdAt: -1 })
    .select("_id");

  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: latestMessage?._id ?? null,
    updatedAt: new Date(),
  });
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
    readReceipts: [{ userId: new Types.ObjectId(userId), readAt: new Date() }],
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
    .populate("sender", SENDER_POPULATE_FIELDS)
    .populate(REPLY_POPULATE);

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
    .populate("sender", SENDER_POPULATE_FIELDS)
    .populate(REPLY_POPULATE);

  return messages.map((message) => toPublicMessage(message));
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
