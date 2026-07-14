import { Types } from "mongoose";
import { EventTypes, publishEvent } from "../../events";
import { User } from "../../models";
import { ApiError } from "../../utils";
import { getChatById } from "./chat.inbox.service";

export const pinChat = async (chatId: string, userId: string) => {
  await getChatById(chatId, userId);

  const user = await User.findById(userId).select("pinnedChatIds");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const alreadyPinned = user.pinnedChatIds.some((id) => id.toString() === chatId);

  if (!alreadyPinned) {
    user.pinnedChatIds.push(new Types.ObjectId(chatId));
    await user.save();
    await publishEvent(EventTypes.INBOX_INVALIDATED, { userIds: [userId], chatId });
  }

  return { chatId, isPinned: true };
};

export const unpinChat = async (chatId: string, userId: string) => {
  await getChatById(chatId, userId);

  await User.findByIdAndUpdate(userId, {
    $pull: { pinnedChatIds: chatId },
  });

  await publishEvent(EventTypes.INBOX_INVALIDATED, { userIds: [userId], chatId });

  return { chatId, isPinned: false };
};
