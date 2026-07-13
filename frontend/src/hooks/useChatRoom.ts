import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch } from "../app/hooks";
import { chatApi } from "../features/chat/chatApi";
import { getSocket } from "../lib/socket";
import type { Message, MessageDeletedEvent, MessagesReadEvent, TypingEvent } from "../types/api";
import { useAuth } from "./useAuth";

const TYPING_STOP_DELAY_MS = 2000;

export const useChatRoom = (chatId: string | null) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [typingUsername, setTypingUsername] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const typingStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const appendMessageToCache = useCallback(
    (message: Message) => {
      if (!chatId || message.chatId !== chatId) {
        return;
      }

      dispatch(
        chatApi.util.updateQueryData("getMessages", chatId, (draft) => {
          if (draft.messages.some((item) => item.id === message.id)) {
            return;
          }

          draft.messages.push(message);
        })
      );

      dispatch(
        chatApi.util.invalidateTags([
          { type: "Chat", id: "LIST" },
          { type: "Chat", id: chatId },
        ])
      );
    },
    [chatId, dispatch]
  );

  const updateMessageInCache = useCallback(
    (message: Message) => {
      if (!chatId || message.chatId !== chatId) {
        return;
      }

      dispatch(
        chatApi.util.updateQueryData("getMessages", chatId, (draft) => {
          const index = draft.messages.findIndex((item) => item.id === message.id);

          if (index !== -1) {
            draft.messages[index] = message;
          }
        })
      );

      dispatch(
        chatApi.util.invalidateTags([
          { type: "Chat", id: "LIST" },
          { type: "Chat", id: chatId },
          { type: "Message", id: `${chatId}-pinned` },
        ])
      );
    },
    [chatId, dispatch]
  );

  const applyMessagesRead = useCallback(
    (event: MessagesReadEvent) => {
      if (!chatId || event.chatId !== chatId) {
        return;
      }

      dispatch(
        chatApi.util.updateQueryData("getMessages", chatId, (draft) => {
          const readAt = event.readAt ?? new Date().toISOString();

          for (const message of draft.messages) {
            if (!event.messageIds.includes(message.id)) {
              continue;
            }

            if (!message.readReceipts) {
              message.readReceipts = [];
            }

            const hasReceipt = message.readReceipts.some(
              (receipt) => receipt.userId === event.userId
            );

            if (!hasReceipt) {
              message.readReceipts.push({ userId: event.userId, readAt });
            }

            if (!message.readBy.includes(event.userId)) {
              message.readBy.push(event.userId);
            }
          }
        })
      );

      dispatch(
        chatApi.util.invalidateTags([
          { type: "Chat", id: "LIST" },
          { type: "Chat", id: chatId },
        ])
      );
    },
    [chatId, dispatch]
  );

  const markAsRead = useCallback(() => {
    if (!chatId) {
      return Promise.resolve();
    }

    getSocket().emit("messages:read", { chatId });
    return Promise.resolve();
  }, [chatId]);

  const removeMessageFromCache = useCallback(
    (event: MessageDeletedEvent) => {
      if (!chatId || event.chatId !== chatId) {
        return;
      }

      dispatch(
        chatApi.util.updateQueryData("getMessages", chatId, (draft) => {
          draft.messages = draft.messages.filter((item) => item.id !== event.messageId);
        })
      );

      dispatch(
        chatApi.util.invalidateTags([
          { type: "Chat", id: "LIST" },
          { type: "Chat", id: chatId },
          { type: "Message", id: `${chatId}-pinned` },
        ])
      );
    },
    [chatId, dispatch]
  );

  useEffect(() => {
    if (!chatId) {
      return;
    }

    const socket = getSocket();

    const joinChat = () => {
      socket.emit("chat:join", { chatId });
    };

    if (socket.connected) {
      joinChat();
    } else {
      socket.connect();
      socket.once("connect", joinChat);
    }

    const handleNewMessage = (message: Message) => {
      if (message.chatId !== chatId) {
        return;
      }

      appendMessageToCache(message);
    };

    const handleUpdatedMessage = (message: Message) => {
      if (message.chatId !== chatId) {
        return;
      }

      updateMessageInCache(message);
    };

    const handlePinnedMessage = (message: Message) => {
      if (message.chatId !== chatId) {
        return;
      }

      updateMessageInCache(message);
    };

    const handleReactionMessage = (message: Message) => {
      if (message.chatId !== chatId) {
        return;
      }

      updateMessageInCache(message);
    };

    const handleDeletedMessage = (event: MessageDeletedEvent) => {
      if (event.chatId !== chatId) {
        return;
      }

      removeMessageFromCache(event);
    };

    const handleTypingStart = (event: TypingEvent) => {
      if (event.chatId !== chatId || event.userId === user?.id) {
        return;
      }

      setTypingUsername(event.name ?? event.username ?? "Someone");

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setTypingUsername(null);
      }, TYPING_STOP_DELAY_MS + 500);
    };

    const handleTypingStop = (event: TypingEvent) => {
      if (event.chatId !== chatId || event.userId === user?.id) {
        return;
      }

      setTypingUsername(null);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };

    const handleMessagesRead = (event: MessagesReadEvent) => {
      if (event.chatId !== chatId) {
        return;
      }

      applyMessagesRead(event);
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:updated", handleUpdatedMessage);
    socket.on("message:pinned", handlePinnedMessage);
    socket.on("message:reaction", handleReactionMessage);
    socket.on("message:deleted", handleDeletedMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("messages:read", handleMessagesRead);

    return () => {
      socket.emit("chat:leave", { chatId });
      socket.off("connect", joinChat);
      socket.off("message:new", handleNewMessage);
      socket.off("message:updated", handleUpdatedMessage);
      socket.off("message:pinned", handlePinnedMessage);
      socket.off("message:reaction", handleReactionMessage);
      socket.off("message:deleted", handleDeletedMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("messages:read", handleMessagesRead);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [
    appendMessageToCache,
    applyMessagesRead,
    chatId,
    removeMessageFromCache,
    updateMessageInCache,
    user?.id,
  ]);

  const emitTypingStart = useCallback(() => {
    if (!chatId) {
      return;
    }

    const socket = getSocket();

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing:start", { chatId });
    }

    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
    }

    typingStopTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("typing:stop", { chatId });
    }, TYPING_STOP_DELAY_MS);
  }, [chatId]);

  const emitTypingStop = useCallback(() => {
    if (!chatId || !isTypingRef.current) {
      return;
    }

    isTypingRef.current = false;
    getSocket().emit("typing:stop", { chatId });

    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
      typingStopTimeoutRef.current = null;
    }
  }, [chatId]);

  const sendMessage = useCallback(
    (content: string, replyToMessageId?: string) =>
      new Promise<Message>((resolve, reject) => {
        if (!chatId) {
          reject(new Error("No chat selected"));
          return;
        }

        const socket = getSocket();

        socket.emit(
          "message:send",
          { chatId, content, replyToMessageId },
          (response: { success: boolean; data?: Message; error?: string }) => {
            if (response?.success && response.data) {
              appendMessageToCache(response.data);
              resolve(response.data);
              return;
            }

            reject(new Error(response?.error ?? "Failed to send message"));
          }
        );
      }),
    [appendMessageToCache, chatId]
  );

  return {
    typingUsername,
    sendMessage,
    emitTypingStart,
    emitTypingStop,
    markAsRead,
  };
};
