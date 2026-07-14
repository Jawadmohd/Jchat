import { Types } from "mongoose";
import { EventTypes, publishEvent } from "../../events";
import { Chat, Message } from "../../models";
import type { PopulatedUser } from "../../types/populated.types";
import { assertChatParticipant } from "../chat/chat.access";
import { ApiError } from "../../utils";
import { normalizeReadReceipts } from "./message.mapper";

export const getUnreadCountsByChat = async (userId: string, chatIds: string[]) => {
  if (chatIds.length === 0) {
    return new Map<string, number>();
  }

  const objectIds = chatIds.map((id) => new Types.ObjectId(id));
  const userObjectId = new Types.ObjectId(userId);

  const results = await Message.aggregate<{ _id: Types.ObjectId; count: number }>([
    {
      $match: {
        chat: { $in: objectIds },
        sender: { $ne: userObjectId },
        readReceipts: { $not: { $elemMatch: { userId: userObjectId } } },
      },
    },
    {
      $group: {
        _id: "$chat",
        count: { $sum: 1 },
      },
    },
  ]);

  return new Map(results.map((item) => [item._id.toString(), item.count]));
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
  await assertChatParticipant(chatId, userId);

  const userObjectId = new Types.ObjectId(userId);
  const readAt = new Date();

  const updateResult = await Message.updateMany(
    {
      chat: chatId,
      sender: { $ne: userObjectId },
      readReceipts: { $not: { $elemMatch: { userId: userObjectId } } },
    },
    {
      $push: {
        readReceipts: { userId: userObjectId, readAt },
      },
    }
  );

  const updatedMessages = await Message.find({
    chat: chatId,
    readReceipts: { $elemMatch: { userId: userObjectId } },
    sender: { $ne: userObjectId },
  })
    .select("_id")
    .lean();

  const readResult = {
    chatId,
    userId,
    readAt: readAt.toISOString(),
    updatedCount: updateResult.modifiedCount,
    messageIds: updatedMessages.map((message) => message._id.toString()),
  };

  await publishEvent(EventTypes.MESSAGES_READ, readResult);

  return readResult;
};

export const getMessageReadReceipts = async (
  messageId: string,
  chatId: string,
  userId: string
) => {
  await assertChatParticipant(chatId, userId);

  const chat = await Chat.findOne({ _id: chatId, participants: userId })
    .populate("participants", "username name emailId avatarUrl identityPublicKey")
    .lean();

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  const message = await Message.findOne({ _id: messageId, chat: chatId });

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (chat.type !== "group") {
    throw new ApiError(400, "Read receipt breakdown is only available for group chats");
  }

  if (message.sender.toString() !== userId) {
    throw new ApiError(403, "You can only view read receipts for your own messages");
  }

  const readReceipts = normalizeReadReceipts(message);
  const readMap = new Map(readReceipts.map((receipt) => [receipt.userId, receipt.readAt]));

  const participants = chat.participants as unknown as PopulatedUser[];
  const senderId = message.sender.toString();

  const readBy = participants
    .filter((participant) => {
      const participantId = participant._id.toString();
      return participantId !== senderId && readMap.has(participantId);
    })
    .map((participant) => ({
      user: {
        id: participant._id.toString(),
        username: participant.username,
        name: participant.name?.trim() || participant.username,
        emailId: participant.emailId,
        avatarUrl: participant.avatarUrl ?? null,
      },
      readAt: readMap.get(participant._id.toString())!,
    }))
    .sort((a, b) => new Date(a.readAt).getTime() - new Date(b.readAt).getTime());

  const deliveredTo = participants
    .filter((participant) => {
      const participantId = participant._id.toString();
      return participantId !== senderId && !readMap.has(participantId);
    })
    .map((participant) => ({
      id: participant._id.toString(),
      username: participant.username,
      name: participant.name?.trim() || participant.username,
      emailId: participant.emailId,
      avatarUrl: participant.avatarUrl ?? null,
    }));

  return {
    messageId,
    chatId,
    readBy,
    deliveredTo,
    readCount: readBy.length,
    deliveredCount: deliveredTo.length,
  };
};
