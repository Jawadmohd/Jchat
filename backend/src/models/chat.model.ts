import { Schema, model, type Document, type Model, type Types } from "mongoose";

export type ChatType = "direct" | "group";

export interface IChat {
  name?: string;
  type: ChatType;
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
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
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

export const Chat: Model<IChatDocument> = model<IChatDocument>("Chat", chatSchema);
