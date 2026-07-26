import type {
  ApiResponse,
  StatusFeed,
  StatusFeedResponse,
  StatusItem,
  StatusResponse,
  StatusViewerEntry,
} from "../../types/api";
import { authApi } from "../auth/authApi";

export const statusApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getStatusFeed: builder.query<StatusFeed, void>({
      query: () => "/status",
      transformResponse: (response: StatusFeedResponse) => response.data,
      providesTags: [{ type: "Status", id: "FEED" }],
    }),
    createTextStatus: builder.mutation<
      StatusItem,
      { text: string; backgroundColor?: string }
    >({
      query: (body) => ({
        url: "/status",
        method: "POST",
        body,
      }),
      transformResponse: (response: StatusResponse) => response.data,
      invalidatesTags: [{ type: "Status", id: "FEED" }],
    }),
    createMediaStatus: builder.mutation<StatusItem, { file: File; caption?: string }>({
      query: ({ file, caption }) => {
        const formData = new FormData();
        formData.append("media", file);
        if (caption) {
          formData.append("caption", caption);
        }

        return {
          url: "/status/media",
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: StatusResponse) => response.data,
      invalidatesTags: [{ type: "Status", id: "FEED" }],
    }),
    viewStatus: builder.mutation<StatusItem, string>({
      query: (statusId) => ({
        url: `/status/${statusId}/view`,
        method: "POST",
      }),
      transformResponse: (response: StatusResponse) => response.data,
      invalidatesTags: [{ type: "Status", id: "FEED" }],
    }),
    deleteStatus: builder.mutation<{ statusId: string }, string>({
      query: (statusId) => ({
        url: `/status/${statusId}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<{ statusId: string }>) => response.data,
      invalidatesTags: [{ type: "Status", id: "FEED" }],
    }),
    getStatusViewers: builder.query<StatusViewerEntry[], string>({
      query: (statusId) => `/status/${statusId}/viewers`,
      transformResponse: (response: ApiResponse<StatusViewerEntry[]>) => response.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetStatusFeedQuery,
  useCreateTextStatusMutation,
  useCreateMediaStatusMutation,
  useViewStatusMutation,
  useDeleteStatusMutation,
  useLazyGetStatusViewersQuery,
} = statusApi;
