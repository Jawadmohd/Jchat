export interface TypingEvent {
  chatId: string;
  userId: string;
  username?: string;
  name?: string;
}

export interface MessageDeletedEvent {
  messageId: string;
  chatId: string;
}

export interface MessagesReadEvent {
  chatId: string;
  userId: string;
  messageIds: string[];
  readAt?: string;
}

export interface PresenceUpdateEvent {
  userId: string;
  isOnline: boolean;
  lastSeen: string | null;
}
