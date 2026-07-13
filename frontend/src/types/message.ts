import type { User } from "./user";

export interface MessageReply {
  id: string;
  content: string;
  messageType: "text" | "image" | "file";
  attachmentName: string | null;
  sender: User;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
}

export interface MessageReadReceipt {
  userId: string;
  readAt: string;
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
  readReceipts: MessageReadReceipt[];
  readBy: string[];
  reactions: MessageReaction[];
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

export interface ReadReceiptEntry {
  user: User;
  readAt: string;
}

export interface ReadReceiptBreakdown {
  messageId: string;
  chatId: string;
  readBy: ReadReceiptEntry[];
  deliveredTo: User[];
  readCount: number;
  deliveredCount: number;
}
