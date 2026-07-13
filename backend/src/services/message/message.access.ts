import { Message, type IMessageDocument } from "../../models";
import { assertChatParticipant } from "../chat/chat.access";
import { ApiError } from "../../utils";
import { REPLY_POPULATE, SENDER_POPULATE_FIELDS } from "./message.constants";

export const populateMessage = async (message: IMessageDocument) => {
  await message.populate("sender", SENDER_POPULATE_FIELDS);
  await message.populate(REPLY_POPULATE);
  return message;
};

export const getOwnedMessage = async (
  messageId: string,
  chatId: string,
  userId: string
) => {
  await assertChatParticipant(chatId, userId);

  const message = await Message.findOne({ _id: messageId, chat: chatId });

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.sender.toString() !== userId) {
    throw new ApiError(403, "You can only modify your own messages");
  }

  if (message.messageType !== "text") {
    throw new ApiError(400, "Only text messages can be edited");
  }

  return message;
};
