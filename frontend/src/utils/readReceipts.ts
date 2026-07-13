import type { Chat, Message, ReadReceiptBreakdown } from "../types/api";

export const buildReadReceiptBreakdown = (
  message: Message,
  chat: Chat
): ReadReceiptBreakdown => {
  const senderId = message.sender.id;
  const readMap = new Map(
    (message.readReceipts ?? []).map((receipt) => [receipt.userId, receipt.readAt])
  );

  const readBy = chat.participants
    .filter((participant) => participant.id !== senderId && readMap.has(participant.id))
    .map((participant) => ({
      user: participant,
      readAt: readMap.get(participant.id)!,
    }))
    .sort((a, b) => new Date(a.readAt).getTime() - new Date(b.readAt).getTime());

  const deliveredTo = chat.participants.filter(
    (participant) => participant.id !== senderId && !readMap.has(participant.id)
  );

  return {
    messageId: message.id,
    chatId: chat.id,
    readBy,
    deliveredTo,
    readCount: readBy.length,
    deliveredCount: deliveredTo.length,
  };
};

export const getGroupReadReceiptSummary = (message: Message, chat: Chat) => {
  const breakdown = buildReadReceiptBreakdown(message, chat);
  const totalRecipients = breakdown.readCount + breakdown.deliveredCount;

  if (totalRecipients === 0) {
    return { label: "Sent", allRead: false, readCount: 0, totalRecipients: 0 };
  }

  if (breakdown.readCount === 0) {
    return {
      label: "Delivered",
      allRead: false,
      readCount: 0,
      totalRecipients,
    };
  }

  if (breakdown.readCount === totalRecipients) {
    return {
      label: "Read by all",
      allRead: true,
      readCount: breakdown.readCount,
      totalRecipients,
    };
  }

  return {
    label: `Read by ${breakdown.readCount}`,
    allRead: false,
    readCount: breakdown.readCount,
    totalRecipients,
  };
};
