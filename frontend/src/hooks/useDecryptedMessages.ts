import { useEffect, useMemo, useState } from "react";
import type { Chat } from "../types/chat";
import type { Message } from "../types/message";
import { decryptMessages } from "../crypto/chatKey";
import { useAuth } from "./useAuth";
import { useE2EE } from "../contexts/E2EEContext";

const getChatCryptoVersion = (chat: Chat | null, userId?: string) => {
  if (!chat) {
    return "";
  }

  const hasOwnWrappedKey = chat.e2eeWrappedKeys?.some((entry) => entry.userId === userId);
  return `${chat.id}:${chat.e2eeWrappedKeys?.length ?? 0}:${hasOwnWrappedKey ? 1 : 0}`;
};

const getMessagesSignature = (messages: Message[]) =>
  messages
    .map((message) => {
      const payload = message.isEncrypted
        ? `${message.ciphertext ?? ""}:${message.iv ?? ""}`
        : message.content;
      return `${message.id}:${message.isEncrypted ? 1 : 0}:${payload}`;
    })
    .join("|");

const mergeDecryptedContent = (source: Message[], decrypted: Message[]) => {
  const decryptedById = new Map(decrypted.map((message) => [message.id, message]));

  return source.map((message) => {
    const decryptedMessage = decryptedById.get(message.id);

    if (!decryptedMessage) {
      return message;
    }

    let next = message;

    if (message.isEncrypted && decryptedMessage.content !== message.content) {
      next = { ...next, content: decryptedMessage.content };
    }

    const decryptedReplyContent = decryptedMessage.replyTo?.content?.trim();
    const currentReplyContent = message.replyTo?.content?.trim();

    if (
      message.replyTo &&
      decryptedMessage.replyTo &&
      decryptedReplyContent &&
      decryptedReplyContent !== currentReplyContent
    ) {
      next = {
        ...next,
        replyTo: {
          ...message.replyTo,
          content: decryptedMessage.replyTo.content,
        },
      };
    }

    return next;
  });
};

export function useDecryptedMessages(messages: Message[], chat: Chat | null) {
  const { user } = useAuth();
  const { isReady } = useE2EE();
  const [decryptedMessages, setDecryptedMessages] = useState<Message[] | null>(null);

  const messagesSignature = useMemo(() => getMessagesSignature(messages), [messages]);
  const chatCryptoVersion = useMemo(
    () => getChatCryptoVersion(chat, user?.id),
    [chat?.id, chat?.e2eeWrappedKeys, user?.id]
  );

  const canDecrypt = Boolean(chat && user?.id && isReady);

  useEffect(() => {
    if (!canDecrypt) {
      setDecryptedMessages(null);
      return;
    }

    let cancelled = false;

    void decryptMessages(messages, chat!, user!.id)
      .then((result) => {
        if (!cancelled) {
          setDecryptedMessages(result);
        }
      })
      .catch((error) => {
        console.warn(
          "Failed to decrypt messages:",
          error instanceof Error ? error.message : error
        );
      });

    return () => {
      cancelled = true;
    };
  }, [canDecrypt, chat, chatCryptoVersion, messagesSignature, user?.id]);

  if (!canDecrypt) {
    return messages;
  }

  if (!decryptedMessages) {
    return messages;
  }

  return mergeDecryptedContent(messages, decryptedMessages);
}
