import { useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { HiPaperAirplane, HiPaperClip, HiXMark } from "react-icons/hi2";
import type { Message } from "../../types/api";
import { useAuth } from "../../hooks/useAuth";
import { getMessagePreviewText } from "../../utils/messagePreview";
import { getUserDisplayName } from "../../utils/getUserDisplayName";

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

export default function ChatInput({
  onSend,
  onSendFile,
  onTypingStart,
  onTypingStop,
  replyingTo = null,
  onCancelReply,
  disabled = false,
}: ChatInputProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = content.trim().length > 0 && !disabled && !isSending;

  const handleSend = async () => {
    const trimmed = content.trim();

    if (!trimmed || disabled || isSending) {
      return;
    }

    setIsSending(true);
    onTypingStop();

    try {
      await onSend(trimmed);
      setContent("");
      onCancelReply?.();
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void handleSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleChange = (value: string) => {
    setContent(value);

    if (value.trim()) {
      onTypingStart();
    } else {
      onTypingStop();
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || disabled || isSending) {
      return;
    }

    setIsSending(true);

    try {
      await onSendFile(file);
      onCancelReply?.();
    } finally {
      setIsSending(false);
      event.target.value = "";
    }
  };

  return (
    <footer className="shrink-0 border-t border-secondary/10 bg-tertiary px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-4">
      {replyingTo && (
        <div className="mb-2 flex items-start gap-2 rounded-xl bg-primary px-3 py-2">
          <div className="min-w-0 flex-1 border-l-2 border-secondary/30 pl-2.5">
            <p className="text-xs font-semibold text-secondary">Replying</p>
            <p className="truncate text-xs text-muted">
              {replyingTo.sender.id === user?.id ? "You" : getUserDisplayName(replyingTo.sender)}
              {": "}
              {getMessagePreviewText(replyingTo)}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="rounded-full p-1 text-muted transition hover:bg-tertiary hover:text-secondary"
            aria-label="Cancel reply"
          >
            <HiXMark className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-primary hover:text-secondary disabled:opacity-50"
          aria-label="Attach file"
        >
          <HiPaperClip className="h-5 w-5" />
        </button>

        <div className="flex min-h-[44px] flex-1 items-center rounded-2xl bg-primary px-4 py-2.5">
          <input
            type="text"
            value={content}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onTypingStop}
            placeholder={replyingTo ? "Reply..." : "Type a message"}
            disabled={disabled || isSending}
            className="w-full bg-transparent text-sm text-secondary outline-none placeholder:text-muted disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={!canSend}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          <HiPaperAirplane className="h-5 w-5" />
        </button>
      </form>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
        onChange={(event) => void handleFileChange(event)}
        className="hidden"
      />
    </footer>
  );
}
