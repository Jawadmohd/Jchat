export interface User {
  id: string;
  emailId: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface UsersListResponse {
  success: boolean;
  count: number;
  data: User[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface RegisterRequest {
  emailId: string;
  username: string;
  name: string;
  password: string;
}

export interface LoginRequest {
  emailId: string;
  password: string;
}

export interface UpdateProfileRequest {
  username?: string;
  name?: string;
  emailId?: string;
  currentPassword?: string;
  password?: string;
}

export interface ChatLastMessage {
  id: string;
  content: string;
  messageType: "text" | "image" | "file";
  senderId: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  type: "direct" | "group";
  name: string | null;
  displayName: string;
  participants: User[];
  otherParticipant: User | null;
  lastMessage: ChatLastMessage | null;
  unreadCount: number;
  isPinned: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface ChatsListResponse {
  success: boolean;
  count: number;
  data: Chat[];
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  data: Chat;
}

export interface MessageReply {
  id: string;
  content: string;
  messageType: "text" | "image" | "file";
  attachmentName: string | null;
  sender: User;
}

export interface Message {
  id: string;
  chatId: string;
  sender: User;
  content: string;
  messageType: "text" | "image" | "file";
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentMimeType: string | null;
  attachmentSize: number | null;
  readBy: string[];
  isEdited: boolean;
  replyTo: MessageReply | null;
  isPinned: boolean;
  pinnedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessagesPage {
  messages: Message[];
  hasMore: boolean;
  nextBefore: string | null;
}

export interface MessagesListResponse {
  success: boolean;
  count: number;
  hasMore: boolean;
  nextBefore: string | null;
  data: Message[];
}

export interface MessageResponse {
  success: boolean;
  message?: string;
  data: Message;
}

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
}

export interface PresenceUpdateEvent {
  userId: string;
  isOnline: boolean;
  lastSeen: string | null;
}

export type NewChatMode = "picker" | "direct" | "group";
