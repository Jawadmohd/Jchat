import type { Request, Response } from "express";
import {
  createGroupChat,
  getChatById,
  getOrCreateDirectChat,
  getUserChats,
  pinChat,
  unpinChat,
} from "../../services/chat/chat.service";
import { markMessagesAsRead } from "../../services/message/message.service";
import { asyncHandler } from "../../utils";
import { emitMessagesRead } from "../../socket";

export const listChats = asyncHandler(async (req: Request, res: Response) => {
  const chats = await getUserChats(req.user!.id);

  res.status(200).json({
    success: true,
    count: chats.length,
    data: chats,
  });
});

export const createDirectChat = asyncHandler(async (req: Request, res: Response) => {
  const chat = await getOrCreateDirectChat(req.user!.id, req.body.participantId);

  res.status(201).json({
    success: true,
    message: "Chat ready",
    data: chat,
  });
});

export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const chat = await createGroupChat(
    req.user!.id,
    req.body.name,
    req.body.participantIds
  );

  res.status(201).json({
    success: true,
    message: "Group created",
    data: chat,
  });
});

export const getChat = asyncHandler(async (req: Request, res: Response) => {
  const chat = await getChatById(String(req.params.id), req.user!.id);

  res.status(200).json({
    success: true,
    data: chat,
  });
});

export const markChatAsRead = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const result = await markMessagesAsRead(chatId, req.user!.id);

  emitMessagesRead(chatId, result);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const pinUserChat = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const result = await pinChat(chatId, req.user!.id);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const unpinUserChat = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const result = await unpinChat(chatId, req.user!.id);

  res.status(200).json({
    success: true,
    data: result,
  });
});
