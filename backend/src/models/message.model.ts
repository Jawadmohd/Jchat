import { Schema, model, type Document, type Model, type Types } from "mongoose";

export type MessageType = "text" | "image" | "file";

export interface IMessageReadReceipt {
  userId: Types.ObjectId;
  readAt: Date;
}

export interface IMessageReaction {
  emoji: string;
  userId: Types.ObjectId;
}

export interface IMessage {
  chat: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  messageType: MessageType;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
  readReceipts: IMessageReadReceipt[];
  reactions: IMessageReaction[];
  isEdited: boolean;
  replyTo?: Types.ObjectId | null;
  isPinned: boolean;
  pinnedAt?: Date | null;
  pinnedBy?: Types.ObjectId | null;
}

export interface IMessageDocument extends IMessage, Document {
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessageDocument>(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: [true, "Chat reference is required"],
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },
    content: {
      type: String,
      default: "",
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    attachmentName: {
      type: String,
      default: null,
    },
    attachmentMimeType: {
      type: String,
      default: null,
    },
    attachmentSize: {
      type: Number,
      default: null,
    },
    readReceipts: {
      type: [
        {
          userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          readAt: {
            type: Date,
            required: true,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    reactions: {
      type: [
        {
          emoji: {
            type: String,
            required: true,
            trim: true,
            maxlength: 8,
          },
          userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
        },
      ],
      default: [],
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedAt: {
      type: Date,
      default: null,
    },
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ chat: 1, isPinned: 1, pinnedAt: -1 });

export const Message: Model<IMessageDocument> = model<IMessageDocument>(
  "Message",
  messageSchema
);
