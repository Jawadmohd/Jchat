export interface User {
  id: string;
  emailId: string;
  username: string;
  avatarUrl: string | null;
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
  password: string;
}

export interface LoginRequest {
  emailId: string;
  password: string;
}

export interface UpdateProfileRequest {
  username?: string;
  emailId?: string;
  currentPassword?: string;
  password?: string;
}

export interface ChatLastMessage {
  id: string;
  content: string;
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

export interface Message {
  id: string;
  chatId: string;
  sender: User;
  content: string;
  readBy: string[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessagesListResponse {
  success: boolean;
  count: number;
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
}

export interface MessageDeletedEvent {
  messageId: string;
  chatId: string;
}
