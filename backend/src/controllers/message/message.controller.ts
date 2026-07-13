import type { Request, Response } from "express";
import {
  createMessage,
  deleteMessage,
  getMessagesByChat,
  getPinnedMessagesByChat,
  getMessageReadReceipts,
  pinMessage,
  toggleMessageReaction,
  unpinMessage,
  updateMessage,
} from "../../services/message/message.service";
import { asyncHandler } from "../../utils";
import { uploadMessageAttachmentToCloudinary } from "../../utils/cloudinary.util";
import {
  emitMessageDeleted,
  emitMessagePinned,
  emitMessageReaction,
  emitMessageUpdated,
  emitNewMessage,
} from "../../socket";

export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const before = req.query.before ? String(req.query.before) : undefined;

  const result = await getMessagesByChat(chatId, req.user!.id, { limit, before });

  res.status(200).json({
    success: true,
    count: result.messages.length,
    hasMore: result.hasMore,
    nextBefore: result.nextBefore,
    data: result.messages,
  });
});

export const listPinnedMessages = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const messages = await getPinnedMessagesByChat(chatId, req.user!.id);

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages,
  });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const message = await createMessage(chatId, req.user!.id, {
    content: req.body.content,
    ciphertext: req.body.ciphertext,
    iv: req.body.iv,
    isEncrypted: req.body.isEncrypted,
    replyToMessageId: req.body.replyToMessageId,
  });

  emitNewMessage(chatId, message);

  res.status(201).json({
    success: true,
    message: "Message sent",
    data: message,
  });
});

export const sendAttachment = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);

  if (!req.file) {
    res.status(400).json({ success: false, message: "Attachment is required" });
    return;
  }

  const upload = await uploadMessageAttachmentToCloudinary(req.file, req.user!.id);
  const messageType = upload.messageType;
  const caption = typeof req.body.caption === "string" ? req.body.caption.trim() : "";
  const replyToMessageId =
    typeof req.body.replyToMessageId === "string" ? req.body.replyToMessageId : undefined;

  const message = await createMessage(chatId, req.user!.id, {
    content: caption,
    messageType,
    attachmentUrl: upload.url,
    attachmentName: upload.name,
    attachmentMimeType: upload.mimeType,
    attachmentSize: upload.size,
    replyToMessageId,
    isEncrypted: req.body.isEncrypted === true || req.body.isEncrypted === "true",
    ciphertext: typeof req.body.ciphertext === "string" ? req.body.ciphertext : undefined,
    iv: typeof req.body.iv === "string" ? req.body.iv : undefined,
  });

  emitNewMessage(chatId, message);

  res.status(201).json({
    success: true,
    message: "Attachment sent",
    data: message,
  });
});

export const editMessage = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const messageId = String(req.params.messageId);
  const message = await updateMessage(
    messageId,
    chatId,
    req.user!.id,
    req.body.isEncrypted
      ? {
          isEncrypted: true,
          ciphertext: req.body.ciphertext,
          iv: req.body.iv,
          content: req.body.content,
        }
      : req.body.content
  );

  emitMessageUpdated(chatId, message);

  res.status(200).json({
    success: true,
    message: "Message updated",
    data: message,
  });
});

export const removeMessage = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const messageId = String(req.params.messageId);
  const result = await deleteMessage(messageId, chatId, req.user!.id);

  emitMessageDeleted(chatId, result);

  res.status(200).json({
    success: true,
    message: "Message deleted",
    data: result,
  });
});

export const pinChatMessage = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const messageId = String(req.params.messageId);
  const message = await pinMessage(messageId, chatId, req.user!.id);

  emitMessagePinned(chatId, message);

  res.status(200).json({
    success: true,
    message: "Message pinned",
    data: message,
  });
});

export const unpinChatMessage = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const messageId = String(req.params.messageId);
  const message = await unpinMessage(messageId, chatId, req.user!.id);

  emitMessagePinned(chatId, message);

  res.status(200).json({
    success: true,
    message: "Message unpinned",
    data: message,
  });
});

export const toggleReaction = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const messageId = String(req.params.messageId);
  const message = await toggleMessageReaction(
    messageId,
    chatId,
    req.user!.id,
    req.body.emoji
  );

  emitMessageReaction(chatId, message);

  res.status(200).json({
    success: true,
    data: message,
  });
});

export const getReadReceipts = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const messageId = String(req.params.messageId);
  const result = await getMessageReadReceipts(messageId, chatId, req.user!.id);

  res.status(200).json({
    success: true,
    data: result,
  });
});
