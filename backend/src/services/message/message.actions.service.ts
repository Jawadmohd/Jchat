import { Types } from "mongoose";
import { EventTypes, publishEvent } from "../../events";
import { Message } from "../../models";
import { assertChatParticipant } from "../chat/chat.access";
import { ApiError } from "../../utils";
import { ALLOWED_REACTIONS } from "./message.constants";
import { populateMessage } from "./message.access";
import { toPublicMessage } from "./message.mapper";

export const pinMessage = async (messageId: string, chatId: string, userId: string) => {
  await assertChatParticipant(chatId, userId);

  const message = await Message.findOne({ _id: messageId, chat: chatId });

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  message.isPinned = true;
  message.pinnedAt = new Date();
  message.pinnedBy = new Types.ObjectId(userId);
  await message.save();
  await populateMessage(message);

  const publicMessage = toPublicMessage(message);
  await publishEvent(EventTypes.MESSAGE_PINNED, { chatId, message: publicMessage });

  return publicMessage;
};

export const unpinMessage = async (messageId: string, chatId: string, userId: string) => {
  await assertChatParticipant(chatId, userId);

  const message = await Message.findOne({ _id: messageId, chat: chatId });

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  message.isPinned = false;
  message.pinnedAt = null;
  message.pinnedBy = null;
  await message.save();
  await populateMessage(message);

  const publicMessage = toPublicMessage(message);
  await publishEvent(EventTypes.MESSAGE_PINNED, { chatId, message: publicMessage });

  return publicMessage;
};

export const toggleMessageReaction = async (
  messageId: string,
  chatId: string,
  userId: string,
  emoji: string
) => {
  await assertChatParticipant(chatId, userId);

  if (!ALLOWED_REACTIONS.has(emoji)) {
    throw new ApiError(400, "Reaction not allowed");
  }

  const message = await Message.findOne({ _id: messageId, chat: chatId });

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  const userObjectId = new Types.ObjectId(userId);
  const existingIndex = message.reactions.findIndex(
    (reaction) => reaction.userId.toString() === userId && reaction.emoji === emoji
  );

  if (existingIndex !== -1) {
    message.reactions.splice(existingIndex, 1);
  } else {
    const sameUserIndex = message.reactions.findIndex(
      (reaction) => reaction.userId.toString() === userId
    );

    if (sameUserIndex !== -1) {
      message.reactions[sameUserIndex].emoji = emoji;
    } else {
      message.reactions.push({ emoji, userId: userObjectId });
    }
  }

  await message.save();
  await populateMessage(message);

  const publicMessage = toPublicMessage(message);
  await publishEvent(EventTypes.MESSAGE_REACTION_TOGGLED, { chatId, message: publicMessage });

  return publicMessage;
};
