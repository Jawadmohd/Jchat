import type { Message, MessageReply } from "../types/api";
import { getUserDisplayName } from "./getUserDisplayName";

export const getReplyPreviewText = (reply: MessageReply): string => {
  if (reply.messageType === "image") {
    return reply.content.trim() || "Photo";
  }

  if (reply.messageType === "file") {
    return reply.content.trim() || `File: ${reply.attachmentName ?? "attachment"}`;
  }

  return reply.content;
};

export const getReplyLabel = (reply: MessageReply, currentUserId?: string): string => {
  const senderName =
    reply.sender.id === currentUserId ? "You" : getUserDisplayName(reply.sender);

  return `${senderName}: ${getReplyPreviewText(reply)}`;
};

export const getMessagePreviewText = (message: Message): string => {
  if (message.isEncrypted) {
    return "Encrypted message";
  }

  if (message.messageType === "image") {
    return message.content.trim() || "Photo";
  }

  if (message.messageType === "file") {
    return message.content.trim() || `File: ${message.attachmentName ?? "attachment"}`;
  }

  return message.content;
};
