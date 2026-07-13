import { Chat } from "../models";
import { getIO } from "./emitter";
import { getUserRoom } from "./rooms";

export const broadcastPresence = async (
  userId: string,
  isOnline: boolean,
  lastSeen: string | null
) => {
  const io = getIO();

  if (!io) {
    return;
  }

  const chats = await Chat.find({ participants: userId }).select("participants").lean();
  const recipientIds = new Set<string>();

  for (const chat of chats) {
    for (const participantId of chat.participants) {
      const participant = participantId.toString();
      if (participant !== userId) {
        recipientIds.add(participant);
      }
    }
  }

  const payload = { userId, isOnline, lastSeen };

  for (const recipientId of recipientIds) {
    io.to(getUserRoom(recipientId)).emit("presence:update", payload);
  }
};
