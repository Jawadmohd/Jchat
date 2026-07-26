import { useEffect, useMemo, useState } from "react";
import { HiChevronDown, HiChevronUp, HiMagnifyingGlass, HiXMark } from "react-icons/hi2";
import type { Message } from "../../types/api";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useLazySearchMessagesQuery } from "../../features/chat/chatApi";
import { getMessagePreviewText } from "../../utils/messagePreview";
import { getUserDisplayName } from "../../utils/getUserDisplayName";
import { useAuth } from "../../hooks/useAuth";

interface ChatSearchBarProps {
  chatId: string;
  messages: Message[];
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
  onLoadOlder?: () => Promise<void>;
  hasMore?: boolean;
  isLoadingOlder?: boolean;
}

const messageMatchesQuery = (message: Message, query: string) => {
  const normalized = query.toLowerCase();
  const preview = getMessagePreviewText(message).toLowerCase();
  const content = message.content.toLowerCase();
  const attachment = (message.attachmentName ?? "").toLowerCase();

  return (
    content.includes(normalized) ||
    preview.includes(normalized) ||
    attachment.includes(normalized)
  );
};

export default function ChatSearchBar({
  chatId,
  messages,
  onClose,
  onJumpToMessage,
  onLoadOlder,
  hasMore = false,
  isLoadingOlder = false,
}: ChatSearchBarProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchServer, { data: serverResults = [], isFetching }] =
    useLazySearchMessagesQuery();

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      return;
    }

    void searchServer({ chatId, q: debouncedQuery.trim() });
  }, [chatId, debouncedQuery, searchServer]);

  const localMatches = useMemo(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      return [];
    }

    return messages.filter((message) => messageMatchesQuery(message, trimmed));
  }, [debouncedQuery, messages]);

  const matches = useMemo(() => {
    const byId = new Map<string, Message>();

    for (const message of [...serverResults, ...localMatches]) {
      byId.set(message.id, message);
    }

    return [...byId.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [localMatches, serverResults]);

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery, matches.length]);

  useEffect(() => {
    if (matches[activeIndex]) {
      onJumpToMessage(matches[activeIndex].id);
    }
  }, [activeIndex, matches, onJumpToMessage]);

  const goNext = () => {
    if (matches.length === 0) {
      return;
    }

    setActiveIndex((value) => (value + 1) % matches.length);
  };

  const goPrev = () => {
    if (matches.length === 0) {
      return;
    }

    setActiveIndex((value) => (value - 1 + matches.length) % matches.length);
  };

  return (
    <div className="shrink-0 border-b border-secondary/10 bg-tertiary px-3 py-2 md:px-4">
      <div className="flex items-center gap-2">
        <div className="flex min-h-10 flex-1 items-center gap-2 rounded-xl bg-primary px-3">
          <HiMagnifyingGlass className="h-4 w-4 shrink-0 text-muted" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search in conversation"
            className="w-full bg-transparent py-2 text-sm text-secondary outline-none placeholder:text-muted"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-full p-1 text-muted hover:bg-tertiary"
              aria-label="Clear search"
            >
              <HiXMark className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={goPrev}
            disabled={matches.length === 0}
            className="rounded-full p-2 text-muted transition hover:bg-primary disabled:opacity-40"
            aria-label="Previous match"
          >
            <HiChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={matches.length === 0}
            className="rounded-full p-2 text-muted transition hover:bg-primary disabled:opacity-40"
            aria-label="Next match"
          >
            <HiChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted transition hover:bg-primary"
            aria-label="Close search"
          >
            <HiXMark className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted">
        <p>
          {!debouncedQuery.trim()
            ? "Type to search messages"
            : isFetching
              ? "Searching..."
              : matches.length === 0
                ? "No matches"
                : `${activeIndex + 1} of ${matches.length}`}
        </p>
        {hasMore && onLoadOlder && (
          <button
            type="button"
            onClick={() => void onLoadOlder()}
            disabled={isLoadingOlder}
            className="font-medium text-secondary hover:underline disabled:opacity-50"
          >
            {isLoadingOlder ? "Loading..." : "Search older messages"}
          </button>
        )}
      </div>

      {matches.length > 0 && (
        <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto">
          {matches.slice(0, 12).map((message, index) => {
            const isActive = index === activeIndex;

            return (
              <li key={message.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveIndex(index);
                    onJumpToMessage(message.id);
                  }}
                  className={`flex w-full flex-col rounded-lg px-2.5 py-1.5 text-left transition ${
                    isActive ? "bg-primary" : "hover:bg-primary/70"
                  }`}
                >
                  <span className="text-[11px] font-medium text-secondary">
                    {message.sender.id === user?.id
                      ? "You"
                      : getUserDisplayName(message.sender)}
                  </span>
                  <span className="truncate text-xs text-muted">
                    {getMessagePreviewText(message)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
