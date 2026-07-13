import { useEffect } from "react";
import { store } from "../app/store";
import { useAppDispatch } from "../app/hooks";
import { chatApi } from "../features/chat/chatApi";
import { getSocket } from "../lib/socket";
import type {
  Message,
  MessageDeletedEvent,
  MessagesReadEvent,
  PresenceUpdateEvent,
  ChatUpdatedEvent,
  Chat,
} from "../types/api";
import { useAuth } from "./useAuth";
import { getMessagePreviewText } from "../utils/messagePreview";

export const useChatInboxSync = (selectedChatId: string | null) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    const socket = getSocket();

    const handleNewMessage = (message: Message) => {
      const isOwnMessage = message.sender.id === user.id;
      const isActiveChat = message.chatId === selectedChatId;

      dispatch(
        chatApi.util.updateQueryData("getChats", undefined, (draft) => {
          const index = draft.findIndex((chat) => chat.id === message.chatId);

          if (index === -1) {
            dispatch(chatApi.util.invalidateTags([{ type: "Chat", id: "LIST" }]));
            return;
          }

          const chat = draft[index];

          chat.lastMessage = {
            id: message.id,
            content: getMessagePreviewText(message),
            messageType: message.messageType,
            senderId: message.sender.id,
            createdAt: message.createdAt,
          };
          chat.updatedAt = message.createdAt;

          if (!isOwnMessage && !isActiveChat) {
            chat.unreadCount += 1;
          }

          if (!chat.isPinned) {
            draft.splice(index, 1);
            const pinnedCount = draft.filter((item) => item.isPinned).length;
            draft.splice(pinnedCount, 0, chat);
          }
        })
      );

      const hasMessagesCache = Boolean(
        chatApi.endpoints.getMessages.select(message.chatId)(store.getState()).data
      );

      if (hasMessagesCache) {
        dispatch(
          chatApi.util.updateQueryData("getMessages", message.chatId, (draft) => {
            if (draft.messages.some((item) => item.id === message.id)) {
              return;
            }

            draft.messages.push(message);
          })
        );
      }
    };

    const handleUpdatedMessage = (message: Message) => {
      dispatch(
        chatApi.util.updateQueryData("getChats", undefined, (draft) => {
          const chat = draft.find((item) => item.id === message.chatId);

          if (chat?.lastMessage?.id === message.id) {
            chat.lastMessage = {
              id: message.id,
              content: getMessagePreviewText(message),
              messageType: message.messageType,
              senderId: message.sender.id,
              createdAt: message.createdAt,
            };
          }
        })
      );

      const hasMessagesCache = Boolean(
        chatApi.endpoints.getMessages.select(message.chatId)(store.getState()).data
      );

      if (hasMessagesCache) {
        dispatch(
          chatApi.util.updateQueryData("getMessages", message.chatId, (draft) => {
            const index = draft.messages.findIndex((item) => item.id === message.id);

            if (index !== -1) {
              draft.messages[index] = message;
            }
          })
        );
      }
    };

    const handlePinnedMessage = (message: Message) => {
      handleUpdatedMessage(message);
      dispatch(chatApi.util.invalidateTags([{ type: "Message", id: `${message.chatId}-pinned` }]));
    };

    const handleDeletedMessage = (event: MessageDeletedEvent) => {
      const hasMessagesCache = Boolean(
        chatApi.endpoints.getMessages.select(event.chatId)(store.getState()).data
      );

      if (hasMessagesCache) {
        dispatch(
          chatApi.util.updateQueryData("getMessages", event.chatId, (draft) => {
            draft.messages = draft.messages.filter((item) => item.id !== event.messageId);
          })
        );
      }

      dispatch(chatApi.util.invalidateTags([{ type: "Chat", id: "LIST" }]));
    };

    const handleMessagesRead = (event: MessagesReadEvent) => {
      if (event.userId === user.id) {
        dispatch(
          chatApi.util.updateQueryData("getChats", undefined, (draft) => {
            const chat = draft.find((item) => item.id === event.chatId);

            if (chat) {
              chat.unreadCount = 0;
            }
          })
        );
        return;
      }

      const hasMessagesCache = Boolean(
        chatApi.endpoints.getMessages.select(event.chatId)(store.getState()).data
      );

      if (hasMessagesCache) {
        dispatch(
          chatApi.util.updateQueryData("getMessages", event.chatId, (draft) => {
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
      }
    };

    const handleReactionMessage = (message: Message) => {
      const hasMessagesCache = Boolean(
        chatApi.endpoints.getMessages.select(message.chatId)(store.getState()).data
      );

      if (hasMessagesCache) {
        dispatch(
          chatApi.util.updateQueryData("getMessages", message.chatId, (draft) => {
            const index = draft.messages.findIndex((item) => item.id === message.id);

            if (index !== -1) {
              draft.messages[index] = message;
            }
          })
        );
      }
    };

    const handleChatUpdated = (event: ChatUpdatedEvent) => {
      if (event.leftBy) {
        dispatch(chatApi.util.invalidateTags([{ type: "Chat", id: "LIST" }]));

        if (event.leftBy === user.id && event.chatId === selectedChatId) {
          dispatch(chatApi.util.invalidateTags([{ type: "Chat", id: event.chatId }]));
        }
        return;
      }

      if (!event.id) {
        dispatch(chatApi.util.invalidateTags([{ type: "Chat", id: "LIST" }]));
        return;
      }

      dispatch(
        chatApi.util.updateQueryData("getChats", undefined, (draft) => {
          const index = draft.findIndex((chat) => chat.id === event.id);

          if (index === -1) {
            return;
          }

          draft[index] = {
            ...draft[index],
            ...event,
            id: event.id,
          } as Chat;
        })
      );
    };

    const handlePresenceUpdate = (event: PresenceUpdateEvent) => {
      dispatch(
        chatApi.util.updateQueryData("getChats", undefined, (draft) => {
          for (const chat of draft) {
            if (chat.otherParticipant?.id === event.userId) {
              chat.otherParticipant = {
                ...chat.otherParticipant,
                isOnline: event.isOnline,
                lastSeen: event.lastSeen,
              };
            }

            chat.participants = chat.participants.map((participant) =>
              participant.id === event.userId
                ? { ...participant, isOnline: event.isOnline, lastSeen: event.lastSeen }
                : participant
            );
          }
        })
      );
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:updated", handleUpdatedMessage);
    socket.on("message:pinned", handlePinnedMessage);
    socket.on("message:reaction", handleReactionMessage);
    socket.on("message:deleted", handleDeletedMessage);
    socket.on("messages:read", handleMessagesRead);
    socket.on("chat:updated", handleChatUpdated);
    socket.on("presence:update", handlePresenceUpdate);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:updated", handleUpdatedMessage);
      socket.off("message:pinned", handlePinnedMessage);
      socket.off("message:reaction", handleReactionMessage);
      socket.off("message:deleted", handleDeletedMessage);
      socket.off("messages:read", handleMessagesRead);
      socket.off("chat:updated", handleChatUpdated);
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, [dispatch, selectedChatId, user]);
};
