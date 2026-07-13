const PREFIX = "jchat";

export const CACHE_TTL = {
  AUTH_USER: 300,
  USER_PROFILE: 300,
  INBOX: 60,
  CHAT: 60,
  MESSAGES: 45,
  PINNED_MESSAGES: 120,
  PARTICIPANT: 300,
  SEARCH: 120,
} as const;

export const cacheKeys = {
  authUser: (userId: string) => `${PREFIX}:auth:user:${userId}`,
  userProfile: (userId: string) => `${PREFIX}:user:${userId}`,
  inbox: (userId: string) => `${PREFIX}:inbox:${userId}`,
  chatForUser: (chatId: string, userId: string) => `${PREFIX}:chat:${chatId}:user:${userId}`,
  messages: (chatId: string, before: string | null, limit: number) =>
    `${PREFIX}:messages:${chatId}:before:${before ?? "root"}:limit:${limit}`,
  messagesPattern: (chatId: string) => `${PREFIX}:messages:${chatId}:*`,
  pinnedMessages: (chatId: string) => `${PREFIX}:messages:${chatId}:pinned`,
  participant: (chatId: string, userId: string) => `${PREFIX}:participant:${chatId}:${userId}`,
  chatParticipants: (chatId: string) => `${PREFIX}:chat:${chatId}:participants`,
  searchUsers: (userId: string, query: string) => `${PREFIX}:search:${userId}:${query}`,
  presenceOnline: () => `${PREFIX}:presence:online`,
  presenceConnections: (userId: string) => `${PREFIX}:presence:conn:${userId}`,
};
