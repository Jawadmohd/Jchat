import type { Chat, E2EEWrappedKey } from "../types/chat";
import type { Message } from "../types/message";
import { decryptText, encryptText } from "./aes";
import {
  deriveDirectChatKey,
  generateRawChatKey,
  loadIdentityPrivateCryptoKey,
  unwrapChatKey,
  wrapChatKeyForUser,
} from "./identity";
import {
  clearChatKeyRaw,
  exportRawAesKey,
  importAesKeyFromRaw,
  loadChatKeyRaw,
  saveChatKeyRaw,
} from "./keyStore";

const chatKeyCache = new Map<string, CryptoKey>();
const pendingGroupKeys = new Map<string, CryptoKey>();
const unwrappedKeySignature = new Map<string, string>();

export class ChatKeyUnavailableError extends Error {
  constructor(message = "Unable to unlock chat encryption key") {
    super(message);
    this.name = "ChatKeyUnavailableError";
  }
}

export const mergeWrappedKeys = (
  incoming: E2EEWrappedKey[] = [],
  existing: E2EEWrappedKey[] = []
) => {
  const merged = new Map<string, E2EEWrappedKey>();

  for (const entry of existing) {
    merged.set(entry.userId, entry);
  }

  for (const entry of incoming) {
    merged.set(entry.userId, entry);
  }

  return [...merged.values()];
};

const findOwnWrappedKey = (chat: Chat, userId: string) =>
  chat.e2eeWrappedKeys?.find((entry) => entry.userId === userId);

const getWrappedKeySignature = (wrapped: E2EEWrappedKey) =>
  `${wrapped.wrappedKey}:${wrapped.iv}:${wrapped.ephemeralPublicKey}`;

const cacheChatKey = async (chatId: string, key: CryptoKey, persist = true) => {
  chatKeyCache.set(chatId, key);

  if (persist) {
    const rawKey = await exportRawAesKey(key);
    await saveChatKeyRaw(chatId, rawKey);
  }

  return key;
};

const getCachedChatKey = async (chatId: string) => {
  const cached = chatKeyCache.get(chatId);
  if (cached) {
    return cached;
  }

  const rawKey = await loadChatKeyRaw(chatId);
  if (!rawKey) {
    return null;
  }

  const key = await importAesKeyFromRaw(rawKey);
  chatKeyCache.set(chatId, key);
  return key;
};

const getDirectChatKey = async (chat: Chat, userId: string) => {
  const otherParticipant = chat.otherParticipant;

  if (!otherParticipant?.identityPublicKey) {
    throw new ChatKeyUnavailableError("Other participant has not uploaded an encryption key yet");
  }

  const privateKey = await loadIdentityPrivateCryptoKey(userId);

  if (!privateKey) {
    throw new ChatKeyUnavailableError("Local encryption key not found");
  }

  const key = await deriveDirectChatKey(chat.id, privateKey, otherParticipant.identityPublicKey);
  return cacheChatKey(chat.id, key, false);
};

const getGroupChatKey = async (chat: Chat, userId: string) => {
  const wrappedForUser = findOwnWrappedKey(chat, userId);

  if (wrappedForUser) {
    const privateKey = await loadIdentityPrivateCryptoKey(userId);

    if (!privateKey) {
      throw new ChatKeyUnavailableError("Local encryption key not found");
    }

    const nextSignature = getWrappedKeySignature(wrappedForUser);
    const cachedSignature = unwrappedKeySignature.get(chat.id);

    if (cachedSignature !== nextSignature) {
      chatKeyCache.delete(chat.id);
    }

    try {
      const rawKey = await unwrapChatKey(wrappedForUser, privateKey);
      const key = await importAesKeyFromRaw(rawKey);
      chatKeyCache.set(chat.id, key);
      unwrappedKeySignature.set(chat.id, nextSignature);
      pendingGroupKeys.delete(chat.id);
      return key;
    } catch {
      chatKeyCache.delete(chat.id);
      pendingGroupKeys.delete(chat.id);
      unwrappedKeySignature.delete(chat.id);
      await clearChatKeyRaw(chat.id);
      throw new ChatKeyUnavailableError("Failed to unlock the group encryption key");
    }
  }

  const pending = pendingGroupKeys.get(chat.id);
  if (pending) {
    return pending;
  }

  throw new ChatKeyUnavailableError(
    "Waiting for another group member to share the encryption key"
  );
};

export const getChatEncryptionKey = async (chat: Chat, userId: string) => {
  if (!chat.e2eeEnabled) {
    return null;
  }

  if (chat.type === "direct") {
    const cached = await getCachedChatKey(chat.id);
    if (cached) {
      return cached;
    }

    return getDirectChatKey(chat, userId);
  }

  return getGroupChatKey(chat, userId);
};

export const createGroupWrappedKeys = async (
  chat: Chat,
  userId: string
): Promise<E2EEWrappedKey[]> => {
  const rawKey = generateRawChatKey();
  const participantsWithKeys = chat.participants.filter(
    (participant) => participant.identityPublicKey
  );

  if (participantsWithKeys.length === 0) {
    throw new ChatKeyUnavailableError("No participants have encryption keys yet");
  }

  const wrappedKeys = await Promise.all(
    participantsWithKeys.map(async (participant) => {
      const wrapped = await wrapChatKeyForUser(rawKey, participant.identityPublicKey!);
      return {
        userId: participant.id,
        ...wrapped,
      };
    })
  );

  const key = await importAesKeyFromRaw(rawKey);
  pendingGroupKeys.set(chat.id, key);

  const missingCurrentUser = !wrappedKeys.some((entry) => entry.userId === userId);
  if (missingCurrentUser && chat.participants.find((p) => p.id === userId)?.identityPublicKey) {
    const self = chat.participants.find((p) => p.id === userId)!;
    const wrapped = await wrapChatKeyForUser(rawKey, self.identityPublicKey!);
    wrappedKeys.push({ userId, ...wrapped });
  }

  return wrappedKeys;
};

const filterNewWrappedKeys = (chat: Chat, wrappedKeys: E2EEWrappedKey[]) => {
  const existingUserIds = new Set(chat.e2eeWrappedKeys?.map((entry) => entry.userId) ?? []);
  return wrappedKeys.filter((entry) => !existingUserIds.has(entry.userId));
};

export const shareMissingGroupWrappedKeys = async (
  chat: Chat,
  userId: string,
  uploadWrappedKeys: (wrappedKeys: E2EEWrappedKey[]) => Promise<Chat>
) => {
  if (chat.type !== "group" || !chat.e2eeEnabled) {
    return chat;
  }

  const wrappedKeys = chat.e2eeWrappedKeys ?? [];
  const hasOwnKey = wrappedKeys.some((entry) => entry.userId === userId);

  if (!hasOwnKey) {
    return chat;
  }

  const missingParticipantIds = chat.participants
    .filter(
      (participant) =>
        participant.identityPublicKey &&
        !wrappedKeys.some((entry) => entry.userId === participant.id)
    )
    .map((participant) => participant.id);

  if (missingParticipantIds.length === 0) {
    return chat;
  }

  try {
    const newWrappedKeys = await wrapGroupKeysForParticipants(
      chat,
      userId,
      missingParticipantIds
    );
    const keysToUpload = filterNewWrappedKeys(chat, newWrappedKeys);

    if (keysToUpload.length > 0) {
      return uploadWrappedKeys(keysToUpload);
    }
  } catch {
    // Another member may need to share keys later.
  }

  return chat;
};

export const establishGroupEncryption = async (
  chat: Chat,
  userId: string,
  uploadWrappedKeys: (wrappedKeys: E2EEWrappedKey[]) => Promise<Chat>
) => {
  if (chat.type !== "group" || !chat.e2eeEnabled) {
    return chat;
  }

  const wrappedKeys = chat.e2eeWrappedKeys ?? [];

  if (wrappedKeys.length > 0) {
    return shareMissingGroupWrappedKeys(chat, userId, uploadWrappedKeys);
  }

  const newWrappedKeys = await createGroupWrappedKeys(chat, userId);
  const keysToUpload = filterNewWrappedKeys(chat, newWrappedKeys);

  if (keysToUpload.length === 0) {
    return chat;
  }

  const nextChat = await uploadWrappedKeys(keysToUpload);
  pendingGroupKeys.delete(chat.id);
  return nextChat;
};

/** @deprecated Use establishGroupEncryption */
export const ensureGroupChatKeys = establishGroupEncryption;

export const encryptMessageContent = async (
  chat: Chat,
  userId: string,
  plaintext: string
) => {
  const key = await getChatEncryptionKey(chat, userId);

  if (!key) {
    return { content: plaintext, isEncrypted: false as const };
  }

  const encrypted = await encryptText(plaintext, key);
  return {
    content: "",
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    isEncrypted: true as const,
  };
};

export const decryptMessageContent = async (
  message: Message,
  chat: Chat,
  userId: string
) => {
  if (!message.isEncrypted) {
    return message.content;
  }

  if (!message.ciphertext || !message.iv) {
    return "[Unable to decrypt message]";
  }

  try {
    const key = await getChatEncryptionKey(chat, userId);
    if (!key) {
      return "[Waiting for encryption key]";
    }

    return await decryptText(message.ciphertext, message.iv, key);
  } catch (error) {
    if (error instanceof ChatKeyUnavailableError) {
      return "[Waiting for encryption key]";
    }

    return "[Unable to decrypt message]";
  }
};

export const decryptMessages = async (messages: Message[], chat: Chat, userId: string) =>
  Promise.all(
    messages.map(async (message) => {
      const content = message.isEncrypted
        ? await decryptMessageContent(message, chat, userId)
        : message.content;

      let replyTo = message.replyTo;

      if (
        message.replyTo?.isEncrypted &&
        message.replyTo.ciphertext &&
        message.replyTo.iv
      ) {
        let replyContent = message.replyTo.content;

        if (!replyContent.trim()) {
          try {
            const key = await getChatEncryptionKey(chat, userId);

            if (key) {
              replyContent = await decryptText(
                message.replyTo.ciphertext,
                message.replyTo.iv,
                key
              );
            } else {
              replyContent = "Encrypted message";
            }
          } catch {
            replyContent = "[Unable to decrypt message]";
          }
        }

        replyTo = {
          ...message.replyTo,
          content: replyContent,
        };
      }

      return {
        ...message,
        content,
        replyTo,
      };
    })
  );

export const wrapGroupKeysForParticipants = async (
  chat: Chat,
  userId: string,
  participantIds: string[]
) => {
  const key = await getChatEncryptionKey(chat, userId);

  if (!key) {
    throw new ChatKeyUnavailableError("Unable to access the group encryption key");
  }

  const rawKey = await exportRawAesKey(key);
  const wrappedKeys: E2EEWrappedKey[] = [];

  for (const participantId of participantIds) {
    const participant = chat.participants.find((entry) => entry.id === participantId);

    if (!participant?.identityPublicKey) {
      continue;
    }

    const wrapped = await wrapChatKeyForUser(rawKey, participant.identityPublicKey);
    wrappedKeys.push({
      userId: participantId,
      ...wrapped,
    });
  }

  return wrappedKeys;
};

export const clearChatKeyCache = (chatId?: string) => {
  if (chatId) {
    chatKeyCache.delete(chatId);
    pendingGroupKeys.delete(chatId);
    unwrappedKeySignature.delete(chatId);
    void clearChatKeyRaw(chatId);
    return;
  }

  chatKeyCache.clear();
  pendingGroupKeys.clear();
  unwrappedKeySignature.clear();
};

export const hasOwnGroupWrappedKey = (chat: Chat, userId: string) =>
  Boolean(findOwnWrappedKey(chat, userId));
