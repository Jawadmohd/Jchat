import { useEffect, useRef } from "react";
import type { Message } from "../../types/api";
import MessageBubble from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onEditMessage: (messageId: string, content: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
}

export default function MessageList({
  messages,
  isLoading,
  onEditMessage,
  onDeleteMessage,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted">Loading messages...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <p className="text-sm text-muted">No messages yet. Say hello!</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-3 py-4 md:px-4">
      <div className="flex flex-col gap-2">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
