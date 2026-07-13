import { HiCheck } from "react-icons/hi2";
import type { Chat, Message } from "../../../types/api";
import { formatChatTime } from "../../../utils/formatChatTime";
import { getGroupReadReceiptSummary } from "../../../utils/readReceipts";

interface MessageReadStatusProps {
  message: Message;
  chat: Chat;
  isOwnMessage: boolean;
  onShowReadReceipts: () => void;
}

export default function MessageReadStatus({
  message,
  chat,
  isOwnMessage,
  onShowReadReceipts,
}: MessageReadStatusProps) {
  const isGroup = chat.type === "group";
  const otherParticipantId = chat.otherParticipant?.id;
  const isReadByOther =
    !isGroup &&
    isOwnMessage &&
    otherParticipantId &&
    message.readBy.includes(otherParticipantId);

  const groupReadSummary =
    isGroup && isOwnMessage ? getGroupReadReceiptSummary(message, chat) : null;

  const showGroupReadReceipts =
    groupReadSummary &&
    (groupReadSummary.readCount > 0 || groupReadSummary.totalRecipients > 0);

  return (
    <div
      className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${
        isOwnMessage ? "text-primary/80" : "text-muted"
      }`}
    >
      <span>
        {formatChatTime(message.createdAt)}
        {message.isEdited && <span className="ml-1 italic">edited</span>}
      </span>
      {isOwnMessage && !isGroup && (
        <span
          className={`inline-flex items-center ${
            isReadByOther ? "text-sky-400" : "text-primary"
          }`}
          title={isReadByOther ? "Read" : "Sent"}
        >
          <HiCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
          {isReadByOther && <HiCheck className="-ml-2 h-3.5 w-3.5" strokeWidth={2.5} />}
        </span>
      )}
      {showGroupReadReceipts && groupReadSummary && (
        <button
          type="button"
          onClick={onShowReadReceipts}
          className={`inline-flex items-center gap-1 underline-offset-2 transition hover:underline ${
            groupReadSummary.allRead ? "text-sky-300" : "text-primary/80"
          }`}
          title="View read receipts"
        >
          <HiCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
          {groupReadSummary.allRead && (
            <HiCheck className="-ml-2 h-3.5 w-3.5" strokeWidth={2.5} />
          )}
          <span>{groupReadSummary.label}</span>
        </button>
      )}
    </div>
  );
}
