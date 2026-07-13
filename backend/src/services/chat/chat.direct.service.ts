import { Chat, User } from "../../models";
import { getUnreadCountsByChat } from "../message/message.read.service";
import { getPresenceForUsers } from "../presence/presence.service";
import { ApiError } from "../../utils";
import { CHAT_POPULATE_OPTIONS, toPublicChat } from "./chat.mapper";

export const getOrCreateDirectChat = async (
  userId: string,
  participantId: string
) => {
  if (userId === participantId) {
    throw new ApiError(400, "You cannot create a chat with yourself");
  }

  const otherUser = await User.findById(participantId).select("username emailId");

  if (!otherUser) {
    throw new ApiError(404, "User not found");
  }

  const existingChat = await Chat.findOne({
    type: "direct",
    participants: { $all: [userId, participantId], $size: 2 },
  })
    .populate(CHAT_POPULATE_OPTIONS[0])
    .populate(CHAT_POPULATE_OPTIONS[1]);

  if (existingChat) {
    const currentUser = await User.findById(userId).select("pinnedChatIds");
    const pinnedChatIds = currentUser?.pinnedChatIds.map((id) => id.toString()) ?? [];
    const unreadMap = await getUnreadCountsByChat(userId, [existingChat._id.toString()]);
    const presenceMap = await getPresenceForUsers([participantId]);
    return toPublicChat(
      existingChat,
      userId,
      unreadMap.get(existingChat._id.toString()) ?? 0,
      pinnedChatIds.includes(existingChat._id.toString()),
      presenceMap
    );
  }

  const chat = await Chat.create({
    type: "direct",
    participants: [userId, participantId],
  });

  await chat.populate("participants", "username name emailId avatarUrl identityPublicKey");

  return toPublicChat(chat, userId, 0);
};
