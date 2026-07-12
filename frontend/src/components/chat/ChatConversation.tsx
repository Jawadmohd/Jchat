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
  useUnpinMessageMutation,
  useUpdateMessageMutation,
  chatApi,
} from "../../features/chat/chatApi";
import { useAppDispatch } from "../../app/hooks";
import { useChatRoom } from "../../hooks/useChatRoom";
import { useAuth } from "../../hooks/useAuth";
import { usePresence } from "../../hooks/usePresence";
import { getSocket } from "../../lib/socket";
import type { Chat, Message } from "../../types/api";
import { getErrorMessage } from "../../utils/getErrorMessage";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";
import PinnedMessagesBar from "./PinnedMessagesBar";

interface ChatConversationProps {
  chat: Chat;
  chatId: string;
  onBack: () => void;
}

export default function ChatConversation({ chatId, chat, onBack }: ChatConversationProps) {
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
  const [markChatRead] = useMarkChatReadMutation();
  const { typingUsername, sendMessage, emitTypingStart, emitTypingStop, markAsRead } =
    useChatRoom(chatId);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatHeader
        chat={chatWithPresence}
        onBack={onBack}
        showBackButton
        typingUsername={typingUsername}
      />
      <PinnedMessagesBar messages={pinnedMessages} currentUserId={user?.id} />
      <div className="min-h-0 flex-1 overflow-hidden bg-primary">
        <MessageList
          chat={chatWithPresence}
          messages={messages}
          isLoading={isLoading}
          hasMore={hasMore}
          isLoadingOlder={isLoadingOlder}
          onLoadOlder={() => void handleLoadOlder()}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onReplyMessage={setReplyingTo}
          onPinMessage={handlePinMessage}
          onUnpinMessage={handleUnpinMessage}
        />
      </div>
      <ChatInput
        onSend={handleSend}
        onSendFile={handleSendFile}
        onTypingStart={emitTypingStart}
        onTypingStop={emitTypingStop}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        disabled={isSending}
      />
    </div>
  );
}
