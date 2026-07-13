import { HiMapPin } from "react-icons/hi2";
import type { Message } from "../../types/api";
import { getReplyPreviewText } from "../../utils/messagePreview";
import { getUserDisplayName } from "../../utils/getUserDisplayName";

interface PinnedMessagesBarProps {
  messages: Message[];
  currentUserId?: string;
}

export default function PinnedMessagesBar({ messages, currentUserId }: PinnedMessagesBarProps) {
  if (messages.length === 0) {
    return null;
  }

  const latest = messages[0];

  return (
    <div className="border-b border-secondary/10 bg-tertiary px-4 py-2">
      <div className="flex items-start gap-2">
        <HiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-secondary">
            {messages.length === 1 ? "Pinned message" : `${messages.length} pinned messages`}
          </p>
          <p className="truncate text-xs text-muted">
            <span className="font-medium">
              {latest.sender.id === currentUserId
                ? "You"
                : getUserDisplayName(latest.sender)}
              :
            </span>{" "}
            {getReplyPreviewText({
              id: latest.id,
              content: latest.content,
              messageType: latest.messageType,
              attachmentName: latest.attachmentName,
              isEncrypted: latest.isEncrypted,
              sender: latest.sender,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
