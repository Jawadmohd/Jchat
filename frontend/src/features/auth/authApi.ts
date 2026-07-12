import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { clearCredentials, setCredentials } from "./authSlice";
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  User,
  UsersListResponse,
} from "../../types/api";

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include",
});

const isAuthBypassEndpoint = (url: string): boolean => {
  return (
    url.includes("/users/login") ||
    url.includes("/users/register") ||
    url.includes("/users/me")
  );
};

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const requestUrl = typeof args === "string" ? args : args.url;

    if (!isAuthBypassEndpoint(requestUrl)) {
      api.dispatch(clearCredentials());
    }
  }

  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User", "Chat", "Message"],
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({
        url: "/users/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data.data));
        } catch {
          dispatch(clearCredentials());
        }
      },
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: "/users/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data.data));
        } catch {
          dispatch(clearCredentials());
        }
      },
    }),
    logout: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: "/users/logout",
        method: "POST",
      }),
      invalidatesTags: ["User"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearCredentials());
          dispatch(authApi.util.resetApiState());
        }
      },
    }),
    getMe: builder.query<User, void>({
      query: () => "/users/me",
      transformResponse: (response: ApiResponse<User>) => response.data,
      providesTags: ["User"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          dispatch(clearCredentials());
        }
      },
    }),
    getUsers: builder.query<User[], void>({
      query: () => "/users",
      transformResponse: (response: UsersListResponse) => response.data,
      providesTags: ["User"],
    }),
    uploadAvatar: builder.mutation<User, FormData>({
      query: (formData) => ({
        url: "/users/me/avatar",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: ApiResponse<User>) => response.data,
      invalidatesTags: ["User", "Chat"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          // Keep existing credentials on failure.
        }
      },
    }),
    removeAvatar: builder.mutation<User, void>({
      query: () => ({
        url: "/users/me/avatar",
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<User>) => response.data,
      invalidatesTags: ["User", "Chat"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          // Keep existing credentials on failure.
        }
      },
    }),
    updateProfile: builder.mutation<User, UpdateProfileRequest>({
      query: (body) => ({
        url: "/users/me/profile",
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiResponse<User>) => response.data,
      invalidatesTags: ["User", "Chat"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          // Keep existing credentials on failure.
        }
      },
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useGetUsersQuery,
  useUploadAvatarMutation,
  useRemoveAvatarMutation,
  useUpdateProfileMutation,
} = authApi;
