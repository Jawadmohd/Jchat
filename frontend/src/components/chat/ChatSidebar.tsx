import { useMemo, useState } from "react";
import {
  HiArrowLeftOnRectangle,
  HiEllipsisVertical,
  HiMagnifyingGlass,
  HiPlus,
} from "react-icons/hi2";
import type { Chat } from "../../types/api";
import { useAuth } from "../../hooks/useAuth";
import { formatChatTime } from "../../utils/formatChatTime";
import UserAvatar from "./UserAvatar";

interface ChatSidebarProps {
  chats: Chat[];
  isLoadingChats: boolean;
  selectedChatId: string | null;
  onSelectChat: (chat: Chat) => void;
  onOpenNewChat: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}

export default function ChatSidebar({
  chats,
  isLoadingChats,
  selectedChatId,
  onSelectChat,
  onOpenNewChat,
  onLogout,
  isLoggingOut,
}: ChatSidebarProps) {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return chats;

    return chats.filter(
      (chat) =>
        chat.displayName.toLowerCase().includes(query) ||
        chat.lastMessage?.content.toLowerCase().includes(query)
    );
  }, [chats, search]);

  const getPreviewText = (chat: Chat): string => {
    if (!chat.lastMessage) {
      return "No messages yet";
    }

    const isOwnMessage = chat.lastMessage.senderId === currentUser?.id;
    const prefix = isOwnMessage ? "You: " : "";

    return `${prefix}${chat.lastMessage.content}`;
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-secondary/10 bg-tertiary lg:h-full lg:w-[380px] lg:min-w-[340px] lg:max-w-[420px]">
      <header className="flex items-center justify-between bg-tertiary px-4 py-3">
        <div className="flex items-center gap-3">
          {currentUser && (
            <UserAvatar
              name={currentUser.username}
              avatarUrl={currentUser.avatarUrl}
              size="sm"
            />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-secondary">
              {currentUser?.username}
            </p>
            <p className="truncate text-xs text-muted">Chats</p>
          </div>
        </div>

        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenNewChat}
            className="rounded-full p-2 text-muted transition hover:bg-primary"
            aria-label="New chat"
          >
            <HiPlus className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-full p-2 text-muted transition hover:bg-primary"
            aria-label="Menu"
          >
            <HiEllipsisVertical className="h-5 w-5" />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              />
              <div className="absolute right-0 top-11 z-20 min-w-[160px] overflow-hidden rounded-xl border border-secondary/10 bg-primary py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-secondary transition hover:bg-tertiary disabled:opacity-60"
                >
                  <HiArrowLeftOnRectangle className="h-4 w-4" />
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2.5">
          <HiMagnifyingGlass className="h-4 w-4 shrink-0 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search chats"
            className="w-full bg-transparent text-sm text-secondary outline-none placeholder:text-muted"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoadingChats ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted">
            Loading chats...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted">
            {search
              ? "No chats found"
              : "No chats yet. Tap + to start a conversation."}
          </div>
        ) : (
          <ul>
            {filteredChats.map((chat) => {
              const isSelected = selectedChatId === chat.id;
              const avatarName = chat.displayName;

              return (
                <li key={chat.id}>
                  <button
                    type="button"
                    onClick={() => onSelectChat(chat)}
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left transition ${
                      isSelected ? "bg-primary" : "hover:bg-primary/70"
                    }`}
                  >
                  <UserAvatar
                    name={avatarName}
                    avatarUrl={chat.otherParticipant?.avatarUrl}
                    size="sm"
                  />
                    <div className="min-w-0 flex-1 border-b border-secondary/5 py-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium text-secondary">
                          {chat.displayName}
                        </p>
                        {chat.lastMessage && (
                          <span className="shrink-0 text-[11px] text-muted">
                            {formatChatTime(chat.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm text-muted">
                        {getPreviewText(chat)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
