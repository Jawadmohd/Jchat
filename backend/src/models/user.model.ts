import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface IUser {
  emailId: string;
  username: string;
  name: string;
  password: string;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  lastSeen?: Date | null;
  pinnedChatIds: Types.ObjectId[];
}

export interface IUserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    emailId: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    name: {
      type: String,
      trim: true,
      maxlength: [60, "Name cannot exceed 60 characters"],
      default: "",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    avatarPublicId: {
      type: String,
      default: null,
      select: false,
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    pinnedChatIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Chat",
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const User: Model<IUserDocument> = model<IUserDocument>("User", userSchema);
