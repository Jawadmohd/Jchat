import { Types } from "mongoose";
import { Chat } from "../../models";
import { assertChatParticipant } from "./chat.access";
import { getChatById } from "./chat.inbox.service";
import { ApiError } from "../../utils";

interface WrappedKeyInput {
  userId: string;
  wrappedKey: string;
  iv: string;
  ephemeralPublicKey: string;
}

export const upsertChatWrappedKeys = async (
  chatId: string,
  userId: string,
  wrappedKeys: WrappedKeyInput[]
) => {
  await assertChatParticipant(chatId, userId);

  const chat = await Chat.findOne({ _id: chatId, participants: userId });

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  if (chat.type !== "group") {
    throw new ApiError(400, "Wrapped keys are only used for group chats");
  }

  const participantIds = new Set(chat.participants.map((id) => id.toString()));
  const existingByUser = new Map(
    (chat.e2eeWrappedKeys ?? []).map((entry) => [entry.userId.toString(), entry])
  );

  for (const wrappedKey of wrappedKeys) {
    if (!participantIds.has(wrappedKey.userId)) {
      throw new ApiError(400, "Wrapped key user must be a chat participant");
    }

    if (existingByUser.has(wrappedKey.userId)) {
      continue;
    }

    existingByUser.set(wrappedKey.userId, {
      userId: new Types.ObjectId(wrappedKey.userId),
      wrappedKey: wrappedKey.wrappedKey,
      iv: wrappedKey.iv,
      ephemeralPublicKey: wrappedKey.ephemeralPublicKey,
    });
  }

  chat.e2eeEnabled = true;
  chat.e2eeWrappedKeys = [...existingByUser.values()];
  await chat.save();

  return getChatById(chatId, userId);
};
