import { Types } from "mongoose";
import { Chat, User, type IChatDocument } from "../../models";
import { ApiError } from "../../utils";
import { getAdminIds, toPublicChat } from "./chat.mapper";
import { getChatById } from "./chat.inbox.service";

const getGroupChat = async (chatId: string, userId: string) => {
  const chat = await Chat.findOne({
    _id: chatId,
    type: "group",
    participants: userId,
  });

  if (!chat) {
    throw new ApiError(404, "Group chat not found");
  }

  return chat;
};

const assertGroupAdmin = (chat: IChatDocument, userId: string) => {
  const isAdmin = getAdminIds(chat).includes(userId);

  if (!isAdmin) {
    throw new ApiError(403, "Only group admins can perform this action");
  }
};

export const createGroupChat = async (
  userId: string,
  name: string,
  participantIds: string[]
) => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new ApiError(400, "Group name is required");
  }

  const uniqueParticipantIds = [...new Set(participantIds.filter((id) => id !== userId))];

  if (uniqueParticipantIds.length < 1) {
    throw new ApiError(400, "Select at least one member for the group");
  }

  const participants = [userId, ...uniqueParticipantIds];
  const existingUsers = await User.find({ _id: { $in: participants } }).select("_id");

  if (existingUsers.length !== participants.length) {
    throw new ApiError(404, "One or more selected users were not found");
  }

  const chat = await Chat.create({
    type: "group",
    name: trimmedName,
    participants,
    createdBy: userId,
    adminIds: [userId],
  });

  await chat.populate("participants", "username name emailId avatarUrl identityPublicKey");

  return toPublicChat(chat, userId, 0);
};

export const updateGroupName = async (chatId: string, userId: string, name: string) => {
  const chat = await getGroupChat(chatId, userId);
  assertGroupAdmin(chat, userId);

  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new ApiError(400, "Group name is required");
  }

  chat.name = trimmedName;
  await chat.save();

  return getChatById(chatId, userId);
};

export const addGroupMembers = async (
  chatId: string,
  userId: string,
  participantIds: string[]
) => {
  const chat = await getGroupChat(chatId, userId);
  assertGroupAdmin(chat, userId);

  const uniqueIds = [...new Set(participantIds.filter((id) => id !== userId))];

  if (uniqueIds.length === 0) {
    throw new ApiError(400, "Select at least one member to add");
  }

  const existingParticipantIds = new Set(chat.participants.map((id) => id.toString()));
  const newIds = uniqueIds.filter((id) => !existingParticipantIds.has(id));

  if (newIds.length === 0) {
    throw new ApiError(400, "Selected users are already in the group");
  }

  const existingUsers = await User.find({ _id: { $in: newIds } }).select("_id");

  if (existingUsers.length !== newIds.length) {
    throw new ApiError(404, "One or more selected users were not found");
  }

  chat.participants.push(...newIds.map((id) => new Types.ObjectId(id)));
  await chat.save();

  return getChatById(chatId, userId);
};

export const removeGroupMember = async (
  chatId: string,
  userId: string,
  memberId: string
) => {
  const chat = await getGroupChat(chatId, userId);
  const isSelf = userId === memberId;
  const isAdmin = getAdminIds(chat).includes(userId);

  if (!isSelf && !isAdmin) {
    throw new ApiError(403, "Only admins can remove other members");
  }

  if (!chat.participants.some((id) => id.toString() === memberId)) {
    throw new ApiError(404, "Member not found in this group");
  }

  if (chat.participants.length <= 2) {
    throw new ApiError(400, "A group must have at least 2 members");
  }

  chat.participants = chat.participants.filter((id) => id.toString() !== memberId);
  chat.adminIds = (chat.adminIds ?? []).filter((id) => id.toString() !== memberId);

  if ((chat.adminIds ?? []).length === 0 && chat.participants.length > 0) {
    chat.adminIds = [chat.participants[0]];
  }

  await chat.save();

  if (isSelf) {
    return { chatId, left: true };
  }

  return getChatById(chatId, userId);
};

export const leaveGroup = async (chatId: string, userId: string) => {
  return removeGroupMember(chatId, userId, userId);
};
