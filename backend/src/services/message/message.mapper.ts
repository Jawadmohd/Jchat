import { Types } from "mongoose";
import type { IMessageDocument, MessageType } from "../../models";
import type { PopulatedReplyMessage, PopulatedUser } from "../../types/populated.types";

type LegacyReadByEntry = Types.ObjectId | { userId?: Types.ObjectId; readAt?: Date };

export const normalizeReadReceipts = (message: IMessageDocument) => {
  const receipts = message.readReceipts ?? [];

  if (receipts.length > 0) {
    return receipts.map((receipt) => ({
      userId: receipt.userId.toString(),
      readAt: receipt.readAt.toISOString(),
    }));
  }

  const legacyReadBy = (message as IMessageDocument & { readBy?: LegacyReadByEntry[] }).readBy;

  if (!legacyReadBy?.length) {
    return [];
  }

  const fallbackReadAt = message.updatedAt.toISOString();

  return legacyReadBy
    .map((entry) => {
      if (entry instanceof Types.ObjectId) {
        return { userId: entry.toString(), readAt: fallbackReadAt };
      }

      return {
        userId: entry.userId?.toString() ?? "",
        readAt: entry.readAt?.toISOString() ?? fallbackReadAt,
      };
    })
    .filter((receipt) => receipt.userId);
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
  const readReceipts = normalizeReadReceipts(message);

  const reactions = (message.reactions ?? []).map((reaction) => ({
    emoji: reaction.emoji,
    userId: reaction.userId.toString(),
  }));

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
    readReceipts,
    readBy: readReceipts.map((receipt) => receipt.userId),
    reactions,
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
