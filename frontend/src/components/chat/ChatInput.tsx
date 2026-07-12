import { useState, type FormEvent, type KeyboardEvent } from "react";
import { HiPaperAirplane } from "react-icons/hi2";

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
}

export default function ChatInput({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled = false,
}: ChatInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

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

  return (
    <footer className="shrink-0 border-t border-secondary/10 bg-tertiary px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex min-h-[44px] flex-1 items-center rounded-2xl bg-primary px-4 py-2.5">
          <input
            type="text"
            value={content}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onTypingStop}
            placeholder="Type a message"
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
    </footer>
  );
}
