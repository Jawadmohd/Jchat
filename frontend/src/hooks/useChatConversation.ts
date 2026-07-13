import { useCallback, useEffect, useState } from "react";
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
  chatApi,
} from "../features/chat/chatApi";
import { useAppDispatch } from "../app/hooks";
import { useChatRoom } from "./useChatRoom";
import { useAuth } from "./useAuth";
import { usePresence } from "./usePresence";
import { getSocket } from "../lib/socket";
import type { Chat, Message } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";

export function useChatConversation(chatId: string, chat: Chat) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { mergePresence } = usePresence();
  const { data: messagesPage, isLoading } = useGetMessagesQuery(chatId);
  const { data: pinnedMessages = [] } = useGetPinnedMessagesQuery(chatId);
  const [loadOlderMessages, { isFetching: isLoadingOlder }] = useLazyLoadOlderMessagesQuery();
  const [sendMessageRest] = useSendMessageMutation();
  const [sendAttachment] = useSendAttachmentMutation();
  const [updateMessage] = useUpdateMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const [pinMessage] = usePinMessageMutation();
  const [unpinMessage] = useUnpinMessageMutation();
  const [toggleReaction] = useToggleReactionMutation();
  const [markChatRead] = useMarkChatReadMutation();
  const { typingUsername, sendMessage, emitTypingStart, emitTypingStop, markAsRead } =
    useChatRoom(chatId);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  const messages = messagesPage?.messages ?? [];
  const hasMore = messagesPage?.hasMore ?? false;
  const nextBefore = messagesPage?.nextBefore ?? null;
  const chatWithPresence = {
    ...chat,
    otherParticipant: mergePresence(chat.otherParticipant),
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
    setIsSending(true);

    try {
      const replyToMessageId = replyingTo?.id;

      if (getSocket().connected) {
        await sendMessage(content, replyToMessageId);
      } else {
        await sendMessageRest({ chatId, content, replyToMessageId }).unwrap();
      }

      setReplyingTo(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send message"));
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
      await updateMessage({ chatId, messageId, content }).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to edit message"));
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
      await toggleReaction({ chatId, messageId, emoji }).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update reaction"));
      throw error;
    }
  };

  return {
    user,
    chatWithPresence,
    messages,
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
