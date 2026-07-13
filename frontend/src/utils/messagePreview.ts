import type { Message, MessageReply } from "../types/api";
import { getUserDisplayName } from "./getUserDisplayName";

const formatPreviewBody = (
  content: string,
  messageType: Message["messageType"],
  attachmentName?: string | null
) => {
  const trimmed = content.trim();

  if (messageType === "image") {
    return trimmed || "Photo";
  }

  if (messageType === "file") {
    return trimmed || `File: ${attachmentName ?? "attachment"}`;
  }

  return content;
};

export const getReplyPreviewText = (reply: MessageReply): string => {
  const formatted = formatPreviewBody(reply.content, reply.messageType, reply.attachmentName);

  if (formatted.trim()) {
    return formatted;
  }

  if (reply.isEncrypted) {
    return "Encrypted message";
  }

  return formatted;
};

export const getReplyLabel = (reply: MessageReply, currentUserId?: string): string => {
  const senderName =
    reply.sender.id === currentUserId ? "You" : getUserDisplayName(reply.sender);

  return `${senderName}: ${getReplyPreviewText(reply)}`;
};

export const getMessagePreviewText = (message: Message): string => {
  const formatted = formatPreviewBody(
    message.content,
    message.messageType,
    message.attachmentName
  );

  if (formatted.trim()) {
    return formatted;
  }

  if (message.isEncrypted) {
    return "Encrypted message";
  }

  return formatted;
};

