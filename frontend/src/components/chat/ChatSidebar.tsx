import { useMemo, useState } from "react";
import type { MouseEvent } from "react";
import toast from "react-hot-toast";
import {
  HiArrowLeftOnRectangle,
  HiEllipsisVertical,
  HiMagnifyingGlass,
  HiMapPin,
  HiPlus,
} from "react-icons/hi2";
import type { Chat } from "../../types/api";
import { usePinChatMutation, useUnpinChatMutation } from "../../features/chat/chatApi";
import { useAuth } from "../../hooks/useAuth";
import { usePresence } from "../../hooks/usePresence";
import { formatChatTime } from "../../utils/formatChatTime";
import { getUserDisplayName } from "../../utils/getUserDisplayName";
import { useChatPreviewMap } from "../../hooks/useChatPreviewMap";
import { buildChatPreviewText } from "../../utils/chatPreview";
import { getErrorMessage } from "../../utils/getErrorMessage";
import UserAvatar from "./UserAvatar";
import GroupAvatar from "./GroupAvatar";

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
  const { mergePresence } = usePresence();
  const [pinChat] = usePinChatMutation();
  const [unpinChat] = useUnpinChatMutation();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const chatsWithPresence = useMemo(
    () =>
      chats.map((chat) => ({
        ...chat,
        otherParticipant: mergePresence(chat.otherParticipant),
      })),
    [chats, mergePresence]
  );

  const previewByChatId = useChatPreviewMap(chatsWithPresence, currentUser?.id);

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return chatsWithPresence;

    return chatsWithPresence.filter((chat) => {
      const preview = previewByChatId[chat.id] ?? chat.lastMessage?.content ?? "";
      return (
        chat.displayName.toLowerCase().includes(query) ||
        preview.toLowerCase().includes(query)
      );
    });
  }, [chatsWithPresence, previewByChatId, search]);

  const getPreviewText = (chat: Chat): string => {
    if (previewByChatId[chat.id]) {
      return previewByChatId[chat.id];
    }

    if (!chat.lastMessage) {
      return "No messages yet";
    }

    if (!currentUser?.id) {
      return chat.lastMessage.isEncrypted ? "Encrypted message" : chat.lastMessage.content;
    }

    const body = chat.lastMessage.isEncrypted
      ? "Encrypted message"
      : chat.lastMessage.content;

    return buildChatPreviewText(
      chat,
      currentUser.id,
      body,
      chat.lastMessage.messageType,
      chat.lastMessage.attachmentName,
      chat.lastMessage.senderId,
      chat.lastMessage.isEncrypted
    );
  };

  const handleTogglePin = async (event: MouseEvent, chat: Chat) => {
    event.stopPropagation();

    try {
      if (chat.isPinned) {
        await unpinChat(chat.id).unwrap();
        toast.success("Chat unpinned");
      } else {
        await pinChat(chat.id).unwrap();
        toast.success("Chat pinned");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update pin"));
    }
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-secondary/10 bg-tertiary lg:h-full lg:w-[380px] lg:min-w-[340px] lg:max-w-[420px]">
      <header className="flex items-center justify-between bg-tertiary px-4 py-3">
        <div className="flex items-center gap-3">
          {currentUser && (
            <UserAvatar
              name={getUserDisplayName(currentUser)}
              avatarUrl={currentUser.avatarUrl}
              size="sm"
            />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-secondary">
              {currentUser ? getUserDisplayName(currentUser) : ""}
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
              const hasUnread = chat.unreadCount > 0;
              const isGroup = chat.type === "group";

              return (
                <li key={chat.id} className="group">
                  <div
                    className={`flex w-full items-center gap-3 px-3 py-3 transition ${
                      isSelected ? "bg-primary" : "hover:bg-primary/70"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectChat(chat)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      {isGroup ? (
                        <GroupAvatar name={chat.displayName} size="sm" />
                      ) : (
                        <UserAvatar
                          name={chat.displayName}
                          avatarUrl={chat.otherParticipant?.avatarUrl}
                          size="sm"
                          showOnline={chat.otherParticipant?.isOnline}
                        />
                      )}
                      <div className="min-w-0 flex-1 border-b border-secondary/5 py-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            {chat.isPinned && (
                              <HiMapPin className="h-3.5 w-3.5 shrink-0 text-muted" />
                            )}
                            <p
                              className={`truncate ${
                                hasUnread
                                  ? "font-semibold text-secondary"
                                  : "font-medium text-secondary"
                              }`}
                            >
                              {chat.displayName}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {chat.lastMessage && (
                              <span className="text-[11px] text-muted">
                                {formatChatTime(chat.lastMessage.createdAt)}
                              </span>
                            )}
                            {hasUnread && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-semibold text-primary">
                                {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <p
                          className={`truncate text-sm ${
                            hasUnread ? "font-medium text-secondary" : "text-muted"
                          }`}
                        >
                          {getPreviewText(chat)}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(event) => void handleTogglePin(event, chat)}
                      className="shrink-0 rounded-full p-1 text-muted opacity-0 transition hover:bg-tertiary hover:text-secondary group-hover:opacity-100"
                      aria-label={chat.isPinned ? "Unpin chat" : "Pin chat"}
                    >
                      <HiMapPin className={`h-4 w-4 ${chat.isPinned ? "text-secondary" : ""}`} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
