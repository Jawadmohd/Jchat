import { HiChevronLeft, HiEllipsisVertical, HiMagnifyingGlass } from "react-icons/hi2";
import type { User } from "../../types/api";
import UserAvatar from "./UserAvatar";

interface ChatHeaderProps {
  user: User;
  onBack?: () => void;
  showBackButton?: boolean;
  typingUsername?: string | null;
}

export default function ChatHeader({
  user,
  onBack,
  showBackButton = false,
  typingUsername = null,
}: ChatHeaderProps) {
  const statusText = typingUsername ? `${typingUsername} is typing...` : "online";

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
            <HiChevronLeft className="h-5 w-5" />
          </button>
        )}
        <UserAvatar name={user.username} avatarUrl={user.avatarUrl} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium text-secondary">{user.username}</p>
          <p
            className={`truncate text-xs ${
              typingUsername ? "font-medium text-secondary" : "text-muted"
            }`}
          >
            {statusText}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="rounded-full p-2 text-muted transition hover:bg-primary"
          aria-label="Search in chat"
        >
          <HiMagnifyingGlass className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="rounded-full p-2 text-muted transition hover:bg-primary"
          aria-label="Chat menu"
        >
          <HiEllipsisVertical className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
