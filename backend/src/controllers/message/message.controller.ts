import type { Request, Response } from "express";
import {
  createMessage,
  deleteMessage,
  getMessagesByChat,
  updateMessage,
} from "../../services/message/message.service";
import { asyncHandler } from "../../utils";
import {
  emitMessageDeleted,
  emitMessageUpdated,
  emitNewMessage,
} from "../../socket";

export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const before = req.query.before ? String(req.query.before) : undefined;

  const messages = await getMessagesByChat(chatId, req.user!.id, { limit, before });

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages,
  });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const message = await createMessage(chatId, req.user!.id, req.body.content);

  emitNewMessage(chatId, message);

  res.status(201).json({
    success: true,
    message: "Message sent",
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
    req.body.content
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
