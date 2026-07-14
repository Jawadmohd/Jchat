export const EventTypes = {
  MESSAGE_CREATED: "message.created",
  MESSAGE_UPDATED: "message.updated",
  MESSAGE_DELETED: "message.deleted",
  MESSAGES_READ: "messages.read",
  MESSAGE_PINNED: "message.pinned",
  MESSAGE_REACTION_TOGGLED: "message.reaction.toggled",
  CHAT_UPDATED: "chat.updated",
  INBOX_INVALIDATED: "inbox.invalidated",
  USER_AUTH_INVALIDATED: "user.auth.invalidated",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

export interface DomainEvent<T extends EventType = EventType> {
  id: string;
  type: T;
  timestamp: string;
  payload: EventPayloadMap[T];
}

export interface EventPayloadMap {
  [EventTypes.MESSAGE_CREATED]: {
    chatId: string;
    message: unknown;
  };
  [EventTypes.MESSAGE_UPDATED]: {
    chatId: string;
    message: unknown;
  };
  [EventTypes.MESSAGE_DELETED]: {
    chatId: string;
    messageId: string;
  };
  [EventTypes.MESSAGES_READ]: {
    chatId: string;
    userId: string;
    readAt: string;
    updatedCount: number;
    messageIds: string[];
  };
  [EventTypes.MESSAGE_PINNED]: {
    chatId: string;
    message: unknown;
  };
  [EventTypes.MESSAGE_REACTION_TOGGLED]: {
    chatId: string;
    message: unknown;
  };
  [EventTypes.CHAT_UPDATED]: {
    chatId: string;
    chat: unknown;
  };
  [EventTypes.INBOX_INVALIDATED]: {
    userIds: string[];
    chatId?: string;
  };
  [EventTypes.USER_AUTH_INVALIDATED]: {
    userId: string;
  };
}

export type EventHandler<T extends EventType = EventType> = (
  event: DomainEvent<T>
) => void | Promise<void>;
