import { Schema, model, type Document, type Model, type Types } from "mongoose";

export type ChatType = "direct" | "group";

export interface IE2EEWrappedKey {
  userId: Types.ObjectId;
  wrappedKey: string;
  iv: string;
  ephemeralPublicKey: string;
}

export interface IChat {
  name?: string;
  type: ChatType;
  participants: Types.ObjectId[];
  createdBy?: Types.ObjectId | null;
  adminIds: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  e2eeEnabled?: boolean;
  e2eeWrappedKeys?: IE2EEWrappedKey[];
}

export interface IChatDocument extends IChat, Document {
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChatDocument>(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Chat name cannot exceed 100 characters"],
    },
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
      required: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adminIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    e2eeEnabled: {
      type: Boolean,
      default: true,
    },
    e2eeWrappedKeys: {
      type: [
        {
          userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          wrappedKey: {
            type: String,
            required: true,
          },
          iv: {
            type: String,
            required: true,
          },
          ephemeralPublicKey: {
            type: String,
            required: true,
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

export const Chat: Model<IChatDocument> = model<IChatDocument>("Chat", chatSchema);
