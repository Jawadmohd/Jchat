import type { Request, Response } from "express";
import {
  getChatById,
  getOrCreateDirectChat,
  getUserChats,
} from "../../services/chat/chat.service";
import { asyncHandler } from "../../utils";

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

export const getChat = asyncHandler(async (req: Request, res: Response) => {
  const chat = await getChatById(String(req.params.id), req.user!.id);

  res.status(200).json({
    success: true,
    data: chat,
  });
});
