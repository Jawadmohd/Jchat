import type { Chat, ChatLastMessage } from "../types/chat";
import { decryptText } from "../crypto/aes";
import { ChatKeyUnavailableError, getChatEncryptionKey } from "../crypto/chatKey";
import { getUserDisplayName } from "./getUserDisplayName";

const formatPreviewBody = (
  content: string,
  messageType: ChatLastMessage["messageType"],
  attachmentName?: string | null
) => {
  if (messageType === "image") {
    return content.trim() || "Photo";
  }

  if (messageType === "file") {
    return content.trim() || `File: ${attachmentName ?? "attachment"}`;
  }

  return content;
};

export const getPreviewSenderPrefix = (chat: Chat, userId: string, senderId: string) => {
  if (senderId === userId) {
    return "You: ";
  }

  const sender =
    chat.type === "direct" && chat.otherParticipant?.id === senderId
      ? chat.otherParticipant
      : chat.participants.find((participant) => participant.id === senderId);

  const senderName = sender
    ? getUserDisplayName(sender)
    : chat.lastMessage?.senderName?.trim();

  return senderName ? `${senderName}: ` : "";
};

const resolvePreviewBody = (
  body: string,
  messageType: ChatLastMessage["messageType"],
  attachmentName?: string | null,
  isEncrypted?: boolean
) => {
  const formatted = formatPreviewBody(body, messageType, attachmentName);

  if (formatted.trim()) {
    return formatted;
  }

  if (isEncrypted) {
    return "Encrypted message";
  }

  if (messageType === "image") {
    return "Photo";
  }

  if (messageType === "file") {
    return `File: ${attachmentName ?? "attachment"}`;
  }

  return formatted;
};

export const buildChatPreviewText = (
  chat: Chat,
  userId: string,
  body: string,
  messageType: ChatLastMessage["messageType"],
  attachmentName?: string | null,
  senderId?: string,
  isEncrypted?: boolean
) => {
  const resolvedSenderId = senderId ?? chat.lastMessage?.senderId;
  const displayBody = resolvePreviewBody(
    body,
    messageType,
    attachmentName,
    isEncrypted ?? chat.lastMessage?.isEncrypted
  );

  if (!resolvedSenderId) {
    return displayBody;
  }

  const prefix = getPreviewSenderPrefix(chat, userId, resolvedSenderId);
  return `${prefix}${displayBody}`;
};

export const decryptChatLastMessagePreview = async (
  chat: Chat,
  userId: string
): Promise<string> => {
  const lastMessage = chat.lastMessage;

  if (!lastMessage) {
    return "No messages yet";
  }

  let body = lastMessage.content;

  if (lastMessage.isEncrypted && lastMessage.ciphertext && lastMessage.iv) {
    try {
      const key = await getChatEncryptionKey(chat, userId);

      if (key) {
        body = await decryptText(lastMessage.ciphertext, lastMessage.iv, key);
      } else {
        body = "Encrypted message";
      }
    } catch (error) {
      body =
        error instanceof ChatKeyUnavailableError
          ? "Encrypted message"
          : "Encrypted message";

      if (!(error instanceof ChatKeyUnavailableError)) {
        console.warn(
          `Failed to decrypt chat preview for ${chat.id}:`,
          error instanceof Error ? error.message : error
        );
      }
    }
  }

  return buildChatPreviewText(
    chat,
    userId,
    body,
    lastMessage.messageType,
    lastMessage.attachmentName,
    lastMessage.senderId,
    lastMessage.isEncrypted
  );
};

export const toChatLastMessageFromSocket = (message: {
  id: string;
  content: string;
  ciphertext: string | null;
  iv: string | null;
  isEncrypted: boolean;
  messageType: ChatLastMessage["messageType"];
  attachmentName: string | null;
  sender: { id: string; name?: string; username: string };
  createdAt: string;
}): ChatLastMessage => ({
  id: message.id,
  content: message.isEncrypted ? "" : message.content,
  ciphertext: message.ciphertext,
  iv: message.iv,
  isEncrypted: message.isEncrypted,
  messageType: message.messageType,
  attachmentName: message.attachmentName,
  senderId: message.sender.id,
  senderName: message.sender.name?.trim() || message.sender.username,
  createdAt: message.createdAt,
});
