import { HiDocument } from "react-icons/hi2";
import type { Message } from "../../../types/api";

interface MessageAttachmentProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function MessageAttachment({ message, isOwnMessage }: MessageAttachmentProps) {
  if (message.messageType === "image" && message.attachmentUrl) {
    return (
      <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer">
        <img
          src={message.attachmentUrl}
          alt={message.attachmentName ?? "Shared image"}
          className="max-h-64 max-w-full rounded-xl object-cover"
        />
      </a>
    );
  }

  if (message.messageType === "file" && message.attachmentUrl) {
    return (
      <a
        href={message.attachmentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
          isOwnMessage
            ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
            : "border-secondary/10 bg-primary text-secondary hover:bg-primary/80"
        }`}
      >
        <HiDocument className="h-5 w-5 shrink-0" />
        <span className="truncate">{message.attachmentName ?? "Download file"}</span>
      </a>
    );
  }

  return null;
}
