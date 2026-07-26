import { Schema, model, type Document, type Types } from "mongoose";

export type StatusType = "text" | "image";

export interface IStatusViewer {
  userId: Types.ObjectId;
  viewedAt: Date;
}

export interface IStatus {
  author: Types.ObjectId;
  type: StatusType;
  text: string;
  mediaUrl?: string | null;
  mediaPublicId?: string | null;
  backgroundColor?: string | null;
  expiresAt: Date;
  viewers: IStatusViewer[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IStatusDocument extends IStatus, Document {}

const statusViewerSchema = new Schema<IStatusViewer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    viewedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const statusSchema = new Schema<IStatusDocument>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["text", "image"], required: true },
    text: { type: String, default: "", trim: true, maxlength: 700 },
    mediaUrl: { type: String, default: null },
    mediaPublicId: { type: String, default: null, select: false },
    backgroundColor: { type: String, default: "#111827" },
    expiresAt: { type: Date, required: true, index: true },
    viewers: { type: [statusViewerSchema], default: [] },
  },
  { timestamps: true }
);

statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
statusSchema.index({ author: 1, expiresAt: 1 });

export const Status = model<IStatusDocument>("Status", statusSchema);
