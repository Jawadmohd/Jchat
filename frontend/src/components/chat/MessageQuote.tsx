import type { MessageReply } from "../../types/api";
import { getUserDisplayName } from "../../utils/getUserDisplayName";
import { getReplyPreviewText } from "../../utils/messagePreview";

interface MessageQuoteProps {
  reply: MessageReply;
  currentUserId?: string;
  variant?: "bubble" | "input";
}

export default function MessageQuote({
  reply,
  currentUserId,
  variant = "bubble",
}: MessageQuoteProps) {
  const isInput = variant === "input";
  const senderName =
    reply.sender.id === currentUserId ? "You" : getUserDisplayName(reply.sender);

  return (
    <div
      className={`border-l-2 pl-2.5 ${
        isInput
          ? "border-secondary/30 text-secondary"
          : "border-current/40 opacity-90"
      }`}
    >
      <p className={`truncate text-xs font-semibold ${isInput ? "text-secondary" : ""}`}>
        {senderName}
      </p>
      <p className={`truncate text-xs ${isInput ? "text-muted" : "opacity-80"}`}>
        {getReplyPreviewText(reply)}
      </p>
    </div>
  );
}
