import { useEffect, useRef } from "react";
import type { Chat, Message } from "../../types/api";
import {
  formatMessageDateLabel,
  getMessageDateKey,
} from "../../utils/formatMessageDateLabel";
import MessageBubble from "./MessageBubble";
import MessageDateDivider from "./MessageDateDivider";

interface MessageListProps {
  chat: Chat;
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingOlder: boolean;
  highlightedMessageId?: string | null;
  onLoadOlder: () => void;
  onEditMessage: (messageId: string, content: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onReplyMessage: (message: Message) => void;
  onPinMessage: (messageId: string) => Promise<void>;
  onUnpinMessage: (messageId: string) => Promise<void>;
  onToggleReaction: (messageId: string, emoji: string) => Promise<void>;
}

export default function MessageList({
  chat,
  messages,
  isLoading,
  hasMore,
  isLoadingOlder,
  highlightedMessageId = null,
  onLoadOlder,
  onEditMessage,
  onDeleteMessage,
  onReplyMessage,
  onPinMessage,
  onUnpinMessage,
  onToggleReaction,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const previousScrollHeightRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      shouldStickToBottomRef.current = distanceFromBottom < 80;

      if (container.scrollTop < 80 && hasMore && !isLoadingOlder) {
        onLoadOlder();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoadingOlder, onLoadOlder]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const previousCount = previousMessageCountRef.current;
    const currentCount = messages.length;
    const isPrepend = currentCount > previousCount && previousCount > 0;

    if (highlightedMessageId) {
      previousMessageCountRef.current = currentCount;
      previousScrollHeightRef.current = container.scrollHeight;
      return;
    }

    if (isPrepend && !shouldStickToBottomRef.current) {
      const heightDiff = container.scrollHeight - previousScrollHeightRef.current;
      container.scrollTop += heightDiff;
    } else if (shouldStickToBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    previousMessageCountRef.current = currentCount;
    previousScrollHeightRef.current = container.scrollHeight;
  }, [highlightedMessageId, messages]);

  useEffect(() => {
    if (!highlightedMessageId) {
      return;
    }

    const element = document.getElementById(`message-${highlightedMessageId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedMessageId]);

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
    <div ref={containerRef} className="h-full overflow-y-auto px-3 py-4 md:px-4">
      <div className="flex flex-col gap-2">
        {isLoadingOlder && (
          <div className="flex justify-center py-2">
            <p className="text-xs text-muted">Loading older messages...</p>
          </div>
        )}

        {hasMore && !isLoadingOlder && (
          <div className="flex justify-center py-1">
            <button
              type="button"
              onClick={onLoadOlder}
              className="rounded-full bg-tertiary px-3 py-1 text-xs text-muted transition hover:bg-primary hover:text-secondary"
            >
              Load older messages
            </button>
          </div>
        )}

        {messages.map((message, index) => {
          const currentDateKey = getMessageDateKey(message.createdAt);
          const previousDateKey =
            index > 0 ? getMessageDateKey(messages[index - 1].createdAt) : null;
          const showDateDivider = currentDateKey !== previousDateKey;
          const isHighlighted = highlightedMessageId === message.id;

          return (
            <div
              key={message.id}
              id={`message-${message.id}`}
              className={`rounded-xl transition ${
                isHighlighted ? "bg-secondary/5 ring-1 ring-secondary/20" : ""
              }`}
            >
              {showDateDivider && (
                <MessageDateDivider label={formatMessageDateLabel(message.createdAt)} />
              )}
              <MessageBubble
                message={message}
                chat={chat}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
                onReply={onReplyMessage}
                onPin={onPinMessage}
                onUnpin={onUnpinMessage}
                onToggleReaction={onToggleReaction}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
