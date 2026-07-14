import type { Request, Response } from "express";
import {
  addGroupMembers,
  createGroupChat,
  getChatById,
  getOrCreateDirectChat,
  getUserChats,
  leaveGroup,
  pinChat,
  removeGroupMember,
  unpinChat,
  updateGroupName,
  upsertChatWrappedKeys,
} from "../../services/chat/chat.service";
import { markMessagesAsRead } from "../../services/message/message.service";
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

export const renameGroup = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const chat = await updateGroupName(chatId, req.user!.id, req.body.name);

  res.status(200).json({
    success: true,
    message: "Group renamed",
    data: chat,
  });
});

export const addMembers = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const chat = await addGroupMembers(chatId, req.user!.id, req.body.participantIds);

  res.status(200).json({
    success: true,
    message: "Members added",
    data: chat,
  });
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const memberId = String(req.params.memberId);
  const result = await removeGroupMember(chatId, req.user!.id, memberId);

  if ("left" in result && result.left) {
    res.status(200).json({
      success: true,
      message: "Left group",
      data: result,
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Member removed",
    data: result,
  });
});

export const leaveGroupChat = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const result = await leaveGroup(chatId, req.user!.id);

  res.status(200).json({
    success: true,
    message: "Left group",
    data: result,
  });
});

export const upsertE2EEKeys = asyncHandler(async (req: Request, res: Response) => {
  const chatId = String(req.params.chatId);
  const chat = await upsertChatWrappedKeys(chatId, req.user!.id, req.body.wrappedKeys);

  res.status(200).json({
    success: true,
    message: "E2EE keys updated",
    data: chat,
  });
});
