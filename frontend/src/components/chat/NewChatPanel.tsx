import { useMemo, useState } from "react";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";
import toast from "react-hot-toast";
import type { User } from "../../types/api";
import { useCreateDirectChatMutation } from "../../features/chat/chatApi";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { getUserDisplayName } from "../../utils/getUserDisplayName";
import UserAvatar from "./UserAvatar";

interface NewChatPanelProps {
  users: User[];
  isLoading: boolean;
  onClose: () => void;
  onBack: () => void;
  onChatStarted: () => void;
  onSelectChat: (chatId: string) => void;
  variant?: "panel" | "overlay";
}

export default function NewChatPanel({
  users,
  isLoading,
  onClose,
  onBack,
  onChatStarted,
  onSelectChat,
  variant = "panel",
}: NewChatPanelProps) {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [createDirectChat, { isLoading: isCreatingChat }] =
    useCreateDirectChatMutation();

  const searchQuery = search.trim();
  const hasSearchQuery = searchQuery.length > 0;

  const filteredUsers = useMemo(() => {
    if (!hasSearchQuery) return [];

    const query = searchQuery.toLowerCase();
    const otherUsers = users.filter((user) => user.id !== currentUser?.id);

    return otherUsers.filter((user) =>
      user.username.toLowerCase().includes(query)
    );
  }, [users, currentUser?.id, searchQuery, hasSearchQuery]);

  const handleStartChat = async (participantId: string) => {
    try {
      const chat = await createDirectChat({ participantId }).unwrap();
      onSelectChat(chat.id);
      onChatStarted();
      onClose();
      toast.success("Chat ready");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not start chat"));
    }
  };

  const isOverlay = variant === "overlay";

  return (
    <div
      className={`flex h-full flex-col bg-primary text-secondary ${
        isOverlay ? "min-h-0" : ""
      }`}
    >
      <header
        className={`flex items-center justify-between border-b border-secondary/10 bg-tertiary ${
          isOverlay ? "px-4 py-4" : "px-6 py-5"
        }`}
      >
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 text-sm text-muted transition hover:text-secondary"
          >
            ← Back
          </button>
          <h2 className="text-lg font-semibold">New chat</h2>
          <p className="mt-0.5 text-sm text-muted">Search users by usernames</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-muted transition hover:bg-primary"
          aria-label="Close new chat"
        >
          <HiXMark className="h-5 w-5" />
        </button>
      </header>

      <div className={`${isOverlay ? "px-4 py-3" : "px-6 py-4"}`}>
        <div className="flex items-center gap-2 rounded-xl border border-secondary/10 bg-tertiary px-3 py-2.5">
          <HiMagnifyingGlass className="h-4 w-4 shrink-0 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users by usernames"
            autoFocus
            className="w-full bg-transparent text-sm text-secondary outline-none placeholder:text-muted"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 md:px-4">
        {!hasSearchQuery ? null : isLoading ? (
          <p className="px-2 py-8 text-center text-sm text-muted">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted">No users found</p>
        ) : (
          <ul>
            {filteredUsers.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  disabled={isCreatingChat}
                  onClick={() => handleStartChat(user.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-tertiary disabled:opacity-60"
                >
                  <UserAvatar name={getUserDisplayName(user)} avatarUrl={user.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-secondary">
                      {getUserDisplayName(user)}
                    </p>
                    <p className="truncate text-sm text-muted">@{user.username}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
