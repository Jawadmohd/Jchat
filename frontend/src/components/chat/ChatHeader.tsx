import type { Chat } from "../../types/api";
import { HiMapPin, HiUsers } from "react-icons/hi2";
import { formatPresenceStatus } from "../../utils/formatPresenceStatus";
import { getUserDisplayName } from "../../utils/getUserDisplayName";
import UserAvatar from "./UserAvatar";
import GroupAvatar from "./GroupAvatar";

interface ChatHeaderProps {
  chat: Chat;
  onBack?: () => void;
  showBackButton?: boolean;
  typingUsername?: string | null;
}

export default function ChatHeader({
  chat,
  onBack,
  showBackButton = false,
  typingUsername = null,
}: ChatHeaderProps) {
  const isGroup = chat.type === "group";
  const displayUser = chat.otherParticipant;

  const statusText = typingUsername
    ? `${typingUsername} is typing...`
    : isGroup
      ? `${chat.participants.length} participants`
      : displayUser
        ? formatPresenceStatus(displayUser)
        : "offline";

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-secondary/10 bg-tertiary px-3 py-2.5 lg:px-4">
      <div className="flex min-w-0 items-center gap-3">
        {showBackButton && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-full p-2 text-muted transition hover:bg-primary lg:hidden"
            aria-label="Back to chats"
          >
            ←
          </button>
        )}

        {isGroup ? (
          <GroupAvatar name={chat.displayName} size="sm" />
        ) : (
          displayUser && (
            <UserAvatar
              name={getUserDisplayName(displayUser)}
              avatarUrl={displayUser.avatarUrl}
              size="sm"
              showOnline={displayUser.isOnline}
            />
          )
        )}

        <div className="min-w-0">
          <p className="truncate font-medium text-secondary">{chat.displayName}</p>
          <p
            className={`truncate text-xs ${
              typingUsername || displayUser?.isOnline
                ? "font-medium text-secondary"
                : "text-muted"
            }`}
          >
            {statusText}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 text-muted">
        {chat.isPinned && <HiMapPin className="h-5 w-5" title="Pinned chat" />}
        {isGroup && <HiUsers className="h-5 w-5" title="Group chat" />}
      </div>
    </header>
  );
}
