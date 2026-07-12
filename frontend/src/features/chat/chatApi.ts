import type {
  ApiResponse,
  Chat,
  ChatResponse,
  ChatsListResponse,
  Message,
  MessageDeletedEvent,
  MessageResponse,
  MessagesListResponse,
  MessagesPage,
  MessagesReadEvent,
} from "../../types/api";
import { authApi } from "../auth/authApi";

export const chatApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getChats: builder.query<Chat[], void>({
      query: () => "/chats",
      transformResponse: (response: ChatsListResponse) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Chat" as const, id })),
              { type: "Chat", id: "LIST" },
            ]
          : [{ type: "Chat", id: "LIST" }],
    }),
    getMessages: builder.query<MessagesPage, string>({
      query: (chatId) => `/chats/${chatId}/messages`,
      transformResponse: (response: MessagesListResponse): MessagesPage => ({
        messages: response.data,
        hasMore: response.hasMore,
        nextBefore: response.nextBefore,
      }),
      providesTags: (_result, _error, chatId) => [{ type: "Message", id: chatId }],
    }),
    loadOlderMessages: builder.query<
      MessagesPage,
      { chatId: string; before: string; limit?: number }
    >({
      query: ({ chatId, before, limit = 50 }) => ({
        url: `/chats/${chatId}/messages`,
        params: { before, limit },
      }),
      transformResponse: (response: MessagesListResponse): MessagesPage => ({
        messages: response.data,
        hasMore: response.hasMore,
        nextBefore: response.nextBefore,
      }),
    }),
    getPinnedMessages: builder.query<Message[], string>({
      query: (chatId) => `/chats/${chatId}/messages/pinned`,
      transformResponse: (response: MessagesListResponse) => response.data,
      providesTags: (_result, _error, chatId) => [{ type: "Message", id: `${chatId}-pinned` }],
    }),
    sendMessage: builder.mutation<
      Message,
      { chatId: string; content: string; replyToMessageId?: string }
    >({
      query: ({ chatId, content, replyToMessageId }) => ({
        url: `/chats/${chatId}/messages`,
        method: "POST",
        body: { content, replyToMessageId },
      }),
      transformResponse: (response: MessageResponse) => response.data,
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "Message", id: chatId },
        { type: "Chat", id: "LIST" },
        { type: "Chat", id: chatId },
      ],
    }),
    sendAttachment: builder.mutation<
      Message,
      { chatId: string; file: File; caption?: string; replyToMessageId?: string }
    >({
      query: ({ chatId, file, caption, replyToMessageId }) => {
        const formData = new FormData();
        formData.append("attachment", file);
        if (caption) {
          formData.append("caption", caption);
        }
        if (replyToMessageId) {
          formData.append("replyToMessageId", replyToMessageId);
        }

        return {
          url: `/chats/${chatId}/messages/attachment`,
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: MessageResponse) => response.data,
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "Message", id: chatId },
        { type: "Chat", id: "LIST" },
        { type: "Chat", id: chatId },
      ],
    }),
    markChatRead: builder.mutation<MessagesReadEvent, string>({
      query: (chatId) => ({
        url: `/chats/${chatId}/read`,
        method: "POST",
      }),
      transformResponse: (response: ApiResponse<MessagesReadEvent>) => response.data,
      invalidatesTags: (_result, _error, chatId) => [
        { type: "Chat", id: "LIST" },
        { type: "Chat", id: chatId },
      ],
    }),
    updateMessage: builder.mutation<
      Message,
      { chatId: string; messageId: string; content: string }
    >({
      query: ({ chatId, messageId, content }) => ({
        url: `/chats/${chatId}/messages/${messageId}`,
        method: "PATCH",
        body: { content },
      }),
      transformResponse: (response: MessageResponse) => response.data,
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "Message", id: chatId },
        { type: "Chat", id: "LIST" },
        { type: "Chat", id: chatId },
      ],
    }),
    deleteMessage: builder.mutation<
      MessageDeletedEvent,
      { chatId: string; messageId: string }
    >({
      query: ({ chatId, messageId }) => ({
        url: `/chats/${chatId}/messages/${messageId}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<MessageDeletedEvent>) => response.data,
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "Message", id: chatId },
        { type: "Chat", id: "LIST" },
        { type: "Chat", id: chatId },
      ],
    }),
    pinMessage: builder.mutation<Message, { chatId: string; messageId: string }>({
      query: ({ chatId, messageId }) => ({
        url: `/chats/${chatId}/messages/${messageId}/pin`,
        method: "POST",
      }),
      transformResponse: (response: MessageResponse) => response.data,
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "Message", id: chatId },
        { type: "Message", id: `${chatId}-pinned` },
      ],
    }),
    unpinMessage: builder.mutation<Message, { chatId: string; messageId: string }>({
      query: ({ chatId, messageId }) => ({
        url: `/chats/${chatId}/messages/${messageId}/pin`,
        method: "DELETE",
      }),
      transformResponse: (response: MessageResponse) => response.data,
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "Message", id: chatId },
        { type: "Message", id: `${chatId}-pinned` },
      ],
    }),
    pinChat: builder.mutation<{ chatId: string; isPinned: boolean }, string>({
      query: (chatId) => ({
        url: `/chats/${chatId}/pin`,
        method: "POST",
      }),
      transformResponse: (response: ApiResponse<{ chatId: string; isPinned: boolean }>) =>
        response.data,
      invalidatesTags: [{ type: "Chat", id: "LIST" }],
    }),
    unpinChat: builder.mutation<{ chatId: string; isPinned: boolean }, string>({
      query: (chatId) => ({
        url: `/chats/${chatId}/pin`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<{ chatId: string; isPinned: boolean }>) =>
        response.data,
      invalidatesTags: [{ type: "Chat", id: "LIST" }],
    }),
    createDirectChat: builder.mutation<Chat, { participantId: string }>({
      query: (body) => ({
        url: "/chats/direct",
        method: "POST",
        body,
      }),
      transformResponse: (response: ChatResponse) => response.data,
      invalidatesTags: [{ type: "Chat", id: "LIST" }],
    }),
    createGroupChat: builder.mutation<Chat, { name: string; participantIds: string[] }>({
      query: (body) => ({
        url: "/chats/group",
        method: "POST",
        body,
      }),
      transformResponse: (response: ChatResponse) => response.data,
      invalidatesTags: [{ type: "Chat", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetChatsQuery,
  useGetMessagesQuery,
  useLazyLoadOlderMessagesQuery,
  useGetPinnedMessagesQuery,
  useSendMessageMutation,
  useSendAttachmentMutation,
  useMarkChatReadMutation,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
  usePinMessageMutation,
  useUnpinMessageMutation,
  usePinChatMutation,
  useUnpinChatMutation,
  useCreateDirectChatMutation,
  useCreateGroupChatMutation,
} = chatApi;
