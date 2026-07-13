import type { User } from "./user";

export interface ChatLastMessage {
  id: string;
  content: string;
  messageType: "text" | "image" | "file";
  senderId: string;
  senderName?: string | null;
  createdAt: string;
  isEncrypted?: boolean;
  ciphertext?: string | null;
  iv?: string | null;
  attachmentName?: string | null;
}

export interface E2EEWrappedKey {
  userId: string;
  wrappedKey: string;
  iv: string;
  ephemeralPublicKey: string;
}

export interface Chat {
  id: string;
  type: "direct" | "group";
  name: string | null;
  displayName: string;
  participants: User[];
  otherParticipant: User | null;
  createdBy: string | null;
  adminIds: string[];
  isAdmin: boolean;
  e2eeEnabled: boolean;
  e2eeWrappedKeys: E2EEWrappedKey[];
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

export type NewChatMode = "picker" | "direct" | "group";

export interface ChatUpdatedEvent {
  chatId: string;
  leftBy?: string;
  id?: string;
  type?: "direct" | "group";
  name?: string | null;
  displayName?: string;
  participants?: User[];
  createdBy?: string | null;
  adminIds?: string[];
  isAdmin?: boolean;
  e2eeWrappedKeys?: E2EEWrappedKey[];
}
