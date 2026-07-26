import { Types } from "mongoose";
import { CACHE_TTL, cacheGetOrSet, cacheKeys } from "../../cache";
import { EventTypes, publishEvent } from "../../events";
import { Chat, Message, type MessageType } from "../../models";
import { assertChatParticipant } from "../chat/chat.access";
import { ApiError } from "../../utils";
import { REPLY_POPULATE, SENDER_POPULATE_FIELDS } from "./message.constants";
import { getOwnedMessage, populateMessage } from "./message.access";
import { toPublicMessage } from "./message.mapper";

interface CreateMessageInput {
  content?: string;
  ciphertext?: string;
  iv?: string;
  isEncrypted?: boolean;
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
  const isEncrypted = payload.isEncrypted ?? false;
  const content = payload.content?.trim() ?? "";

  if (isEncrypted) {
    if (!payload.ciphertext || !payload.iv) {
      throw new ApiError(400, "Encrypted messages require ciphertext and iv");
    }
  } else if (messageType === "text" && !content && !payload.replyToMessageId) {
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
    content: isEncrypted ? "" : content,
    ciphertext: isEncrypted ? payload.ciphertext : null,
    iv: isEncrypted ? payload.iv : null,
    isEncrypted,
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
    e2eeEnabled: true,
  });

  await populateMessage(message);

  const publicMessage = toPublicMessage(message);
  await publishEvent(EventTypes.MESSAGE_CREATED, { chatId, message: publicMessage });

  return publicMessage;
};

interface ListMessagesOptions {
  limit?: number;
  before?: string;
}

const fetchMessagesByChat = async (
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

export const getMessagesByChat = async (
  chatId: string,
  userId: string,
  options: ListMessagesOptions = {}
) => {
  const limit = options.limit ?? 50;

  return cacheGetOrSet(
    cacheKeys.messages(chatId, options.before ?? null, limit),
    CACHE_TTL.MESSAGES,
    () => fetchMessagesByChat(chatId, userId, options)
  );
};

const fetchPinnedMessagesByChat = async (chatId: string, userId: string) => {
  await assertChatParticipant(chatId, userId);

  const messages = await Message.find({ chat: chatId, isPinned: true })
    .sort({ pinnedAt: -1 })
    .populate("sender", SENDER_POPULATE_FIELDS)
    .populate(REPLY_POPULATE);

  return messages.map((message) => toPublicMessage(message));
};

export const getPinnedMessagesByChat = async (chatId: string, userId: string) => {
  return cacheGetOrSet(cacheKeys.pinnedMessages(chatId), CACHE_TTL.PINNED_MESSAGES, () =>
    fetchPinnedMessagesByChat(chatId, userId)
  );
};

interface UpdateMessageInput {
  content?: string;
  ciphertext?: string;
  iv?: string;
  isEncrypted?: boolean;
}

export const updateMessage = async (
  messageId: string,
  chatId: string,
  userId: string,
  input: UpdateMessageInput | string
) => {
  const message = await getOwnedMessage(messageId, chatId, userId);
  const payload: UpdateMessageInput =
    typeof input === "string" ? { content: input } : input;

  if (payload.isEncrypted) {
    if (!payload.ciphertext || !payload.iv) {
      throw new ApiError(400, "Encrypted messages require ciphertext and iv");
    }

    message.content = "";
    message.ciphertext = payload.ciphertext;
    message.iv = payload.iv;
    message.isEncrypted = true;
  } else {
    message.content = (payload.content ?? "").trim();
    message.ciphertext = null;
    message.iv = null;
    message.isEncrypted = false;
  }

  message.isEdited = true;
  await message.save();
  await populateMessage(message);

  const publicMessage = toPublicMessage(message);
  await publishEvent(EventTypes.MESSAGE_UPDATED, { chatId, message: publicMessage });

  return publicMessage;
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

  await publishEvent(EventTypes.MESSAGE_DELETED, { chatId, messageId });

  return { messageId, chatId };
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchMessagesByChat = async (
  chatId: string,
  userId: string,
  query: string,
  limit = 30
) => {
  await assertChatParticipant(chatId, userId);

  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const pattern = new RegExp(escapeRegex(trimmed), "i");
  const cappedLimit = Math.min(Math.max(limit, 1), 50);

  const messages = await Message.find({
    chat: chatId,
    $or: [
      { content: pattern },
      { attachmentName: pattern },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(cappedLimit)
    .populate("sender", SENDER_POPULATE_FIELDS)
    .populate(REPLY_POPULATE);

  return messages.map((message) => toPublicMessage(message));
};
