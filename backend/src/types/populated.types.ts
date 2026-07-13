import type { Types } from "mongoose";
import type { MessageType } from "../models";

export interface PopulatedUser {
  _id: { toString(): string };
  username: string;
  name?: string;
  emailId: string;
  avatarUrl?: string | null;
  identityPublicKey?: string | null;
}

export interface PopulatedReplyMessage {
  _id: { toString(): string };
  content: string;
  messageType: MessageType;
  attachmentName?: string | null;
  isEncrypted?: boolean;
  ciphertext?: string | null;
  iv?: string | null;
  sender: PopulatedUser | Types.ObjectId;
}

export interface PopulatedLastMessage {
  _id: { toString(): string };
  content: string;
  messageType: MessageType;
  attachmentName?: string | null;
  isEncrypted?: boolean;
  ciphertext?: string | null;
  iv?: string | null;
  sender: PopulatedUser | { toString(): string };
  createdAt: Date;
}
