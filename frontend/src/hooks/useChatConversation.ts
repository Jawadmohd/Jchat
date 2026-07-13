import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  useDeleteMessageMutation,
  useGetMessagesQuery,
  useGetPinnedMessagesQuery,
  useLazyLoadOlderMessagesQuery,
  useMarkChatReadMutation,
  usePinMessageMutation,
  useSendAttachmentMutation,
  useSendMessageMutation,
  useToggleReactionMutation,
  useUnpinMessageMutation,
  useUpdateMessageMutation,
  useUpsertE2EEKeysMutation,
  chatApi,
} from "../features/chat/chatApi";
import { useAppDispatch } from "../app/hooks";
import {
  ChatKeyUnavailableError,
  encryptMessageContent,
  establishGroupEncryption,
  mergeWrappedKeys,
} from "../crypto/chatKey";
import { useChatRoom } from "./useChatRoom";
import { useAuth } from "./useAuth";
import { useDecryptedMessages } from "./useDecryptedMessages";
import { useE2EE } from "../contexts/E2EEContext";
import { usePresence } from "./usePresence";
import { getSocket } from "../lib/socket";
import type { Chat, Message } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";

const EMPTY_MESSAGES: Message[] = [];

export function useChatConversation(chatId: string, chat: Chat) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { isReady: isE2EEReady } = useE2EE();
  const { mergePresence } = usePresence();
  const [activeChat, setActiveChat] = useState(chat);
  const keySetupRef = useRef<string | null>(null);
  const { data: messagesPage, isLoading } = useGetMessagesQuery(chatId);
  const { data: pinnedMessagesRaw = [] } = useGetPinnedMessagesQuery(chatId);
  const [loadOlderMessages, { isFetching: isLoadingOlder }] = useLazyLoadOlderMessagesQuery();
  const [sendMessageRest] = useSendMessageMutation();
  const [sendAttachment] = useSendAttachmentMutation();
  const [updateMessage] = useUpdateMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const [pinMessage] = usePinMessageMutation();
  const [unpinMessage] = useUnpinMessageMutation();
  const [toggleReaction] = useToggleReactionMutation();
  const [markChatRead] = useMarkChatReadMutation();
  const [upsertE2EEKeys] = useUpsertE2EEKeysMutation();
  const { typingUsername, sendMessage, emitTypingStart, emitTypingStop, markAsRead } =
    useChatRoom(chatId);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  const uploadWrappedKeys = useCallback(
    async (wrappedKeys: Parameters<typeof upsertE2EEKeys>[0]["wrappedKeys"]) =>
      upsertE2EEKeys({ chatId, wrappedKeys }).unwrap(),
    [chatId, upsertE2EEKeys]
  );

  useEffect(() => {
    setActiveChat((previous) => {
      if (previous.id !== chat.id) {
        keySetupRef.current = null;
        return chat;
      }

      return {
        ...chat,
        e2eeWrappedKeys: mergeWrappedKeys(chat.e2eeWrappedKeys, previous.e2eeWrappedKeys),
      };
    });
  }, [chat]);

  const wrappedKeySignature = useMemo(
    () => activeChat.e2eeWrappedKeys?.map((entry) => entry.userId).sort().join(",") ?? "",
    [activeChat.e2eeWrappedKeys]
  );

  useEffect(() => {
    if (!user?.id || !isE2EEReady || activeChat.type !== "group" || !activeChat.e2eeEnabled) {
      return;
    }

    const setupToken = `${activeChat.id}:${wrappedKeySignature}`;
    if (keySetupRef.current === setupToken) {
      return;
    }

    keySetupRef.current = setupToken;

    let cancelled = false;

    void establishGroupEncryption(activeChat, user.id, uploadWrappedKeys)
      .then((nextChat) => {
        if (cancelled) {
          return;
        }

        const nextSignature =
          nextChat.e2eeWrappedKeys?.map((entry) => entry.userId).sort().join(",") ?? "";
        keySetupRef.current = `${nextChat.id}:${nextSignature}`;

        if (nextSignature !== wrappedKeySignature) {
          setActiveChat((previous) => ({
            ...nextChat,
            e2eeWrappedKeys: mergeWrappedKeys(nextChat.e2eeWrappedKeys, previous.e2eeWrappedKeys),
          }));
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (error instanceof ChatKeyUnavailableError) {
          toast.error(error.message, { id: `e2ee-${activeChat.id}` });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeChat.e2eeEnabled,
    activeChat.id,
    activeChat.type,
    isE2EEReady,
    uploadWrappedKeys,
    user?.id,
    wrappedKeySignature,
  ]);

  const messages = messagesPage?.messages ?? EMPTY_MESSAGES;
  const chatForCrypto = useMemo(
    () => ({
      ...activeChat,
      e2eeWrappedKeys: activeChat.e2eeWrappedKeys ?? [],
    }),
    [activeChat]
  );
  const decryptedMessages = useDecryptedMessages(messages, chatForCrypto);
  const pinnedMessages = useDecryptedMessages(pinnedMessagesRaw, chatForCrypto);
  const hasMore = messagesPage?.hasMore ?? false;
  const nextBefore = messagesPage?.nextBefore ?? null;
  const chatWithPresence = {
    ...activeChat,
    otherParticipant: mergePresence(activeChat.otherParticipant),
  };

  const markVisibleChatAsRead = useCallback(() => {
    if (document.visibilityState !== "visible") {
      return;
    }

    void markAsRead();
    void markChatRead(chatId);
  }, [chatId, markAsRead, markChatRead]);

  useEffect(() => {
    markVisibleChatAsRead();
  }, [markVisibleChatAsRead]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markVisibleChatAsRead();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [markVisibleChatAsRead]);

  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (message: Message) => {
      if (message.chatId !== chatId || message.sender.id === user?.id) {
        return;
      }

      markVisibleChatAsRead();
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [chatId, markVisibleChatAsRead, user?.id]);

  const handleLoadOlder = useCallback(async () => {
    if (!nextBefore || isLoadingOlder) {
      return;
    }

    try {
      const result = await loadOlderMessages({ chatId, before: nextBefore }).unwrap();

      dispatch(
        chatApi.util.updateQueryData("getMessages", chatId, (draft) => {
          const existingIds = new Set(draft.messages.map((item) => item.id));
          const olderMessages = result.messages.filter((item) => !existingIds.has(item.id));
          draft.messages = [...olderMessages, ...draft.messages];
          draft.hasMore = result.hasMore;
          draft.nextBefore = result.nextBefore;
        })
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load older messages"));
    }
  }, [chatId, dispatch, isLoadingOlder, loadOlderMessages, nextBefore]);

  const handleSend = async (content: string) => {
    if (activeChat.e2eeEnabled && !isE2EEReady) {
      toast.error("Encryption is still initializing. Try again in a moment.");
      throw new Error("Encryption not ready");
    }

    setIsSending(true);

    try {
      const replyToMessageId = replyingTo?.id;
      const payload = user?.id
        ? await encryptMessageContent(chatForCrypto, user.id, content)
        : { content, isEncrypted: false as const };

      if (getSocket().connected) {
        await sendMessage({ ...payload, replyToMessageId });
      } else {
        await sendMessageRest({ chatId, ...payload, replyToMessageId }).unwrap();
      }

      setReplyingTo(null);
    } catch (error) {
      if (error instanceof ChatKeyUnavailableError) {
        toast.error(error.message);
      } else {
        toast.error(getErrorMessage(error, "Failed to send message"));
      }
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const handleSendFile = async (file: File) => {
    setIsSending(true);

    try {
      await sendAttachment({
        chatId,
        file,
        replyToMessageId: replyingTo?.id,
      }).unwrap();
      setReplyingTo(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send attachment"));
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    try {
      const payload = user?.id
        ? await encryptMessageContent(chatForCrypto, user.id, content)
        : { content, isEncrypted: false as const };

      await updateMessage({ chatId, messageId, ...payload }).unwrap();
    } catch (error) {
      if (error instanceof ChatKeyUnavailableError) {
        toast.error(error.message);
      } else {
        toast.error(getErrorMessage(error, "Failed to edit message"));
      }
      throw error;
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage({ chatId, messageId }).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete message"));
      throw error;
    }
  };

  const handlePinMessage = async (messageId: string) => {
    try {
      await pinMessage({ chatId, messageId }).unwrap();
      toast.success("Message pinned");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to pin message"));
      throw error;
    }
  };

  const handleUnpinMessage = async (messageId: string) => {
    try {
      await unpinMessage({ chatId, messageId }).unwrap();
      toast.success("Message unpinned");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to unpin message"));
      throw error;
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      const updatedMessage = await toggleReaction({ chatId, messageId, emoji }).unwrap();

      dispatch(
        chatApi.util.updateQueryData("getMessages", chatId, (draft) => {
          const index = draft.messages.findIndex((item) => item.id === messageId);

          if (index !== -1) {
            draft.messages[index] = updatedMessage;
          }
        })
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update reaction"));
      throw error;
    }
  };

  return {
    user,
    chatWithPresence,
    messages: decryptedMessages,
    pinnedMessages,
    isLoading,
    hasMore,
    isLoadingOlder,
    isSending,
    replyingTo,
    showGroupSettings,
    typingUsername,
    setReplyingTo,
    setShowGroupSettings,
    handleLoadOlder,
    handleSend,
    handleSendFile,
    handleEditMessage,
    handleDeleteMessage,
    handlePinMessage,
    handleUnpinMessage,
    handleToggleReaction,
    emitTypingStart,
    emitTypingStop,
  };
}
