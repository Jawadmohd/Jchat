import type {
  ApiResponse,
  Chat,
  ChatResponse,
  ChatsListResponse,
  Message,
  MessageDeletedEvent,
  MessageResponse,
  MessagesListResponse,
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
    getMessages: builder.query<Message[], string>({
      query: (chatId) => `/chats/${chatId}/messages`,
      transformResponse: (response: MessagesListResponse) => response.data,
      providesTags: (_result, _error, chatId) => [{ type: "Message", id: chatId }],
    }),
    sendMessage: builder.mutation<Message, { chatId: string; content: string }>({
      query: ({ chatId, content }) => ({
        url: `/chats/${chatId}/messages`,
        method: "POST",
        body: { content },
      }),
      transformResponse: (response: MessageResponse) => response.data,
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "Message", id: chatId },
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
    createDirectChat: builder.mutation<Chat, { participantId: string }>({
      query: (body) => ({
        url: "/chats/direct",
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
  useSendMessageMutation,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
  useCreateDirectChatMutation,
} = chatApi;
