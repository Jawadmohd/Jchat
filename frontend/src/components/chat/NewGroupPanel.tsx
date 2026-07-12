import { useMemo, useState } from "react";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";
import toast from "react-hot-toast";
import type { User } from "../../types/api";
import { useCreateGroupChatMutation } from "../../features/chat/chatApi";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { getUserDisplayName } from "../../utils/getUserDisplayName";
import UserAvatar from "./UserAvatar";

interface NewGroupPanelProps {
  users: User[];
  isLoading: boolean;
  onClose: () => void;
  onBack: () => void;
  onChatStarted: () => void;
  onSelectChat: (chatId: string) => void;
  variant?: "panel" | "overlay";
}

export default function NewGroupPanel({
  users,
  isLoading,
  onClose,
  onBack,
  onChatStarted,
  onSelectChat,
  variant = "panel",
}: NewGroupPanelProps) {
  const { user: currentUser } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [createGroupChat, { isLoading: isCreating }] = useCreateGroupChatMutation();

  const searchQuery = search.trim();
  const hasSearchQuery = searchQuery.length > 0;

  const filteredUsers = useMemo(() => {
    if (!hasSearchQuery) return [];

    const query = searchQuery.toLowerCase();
    return users
      .filter((user) => user.id !== currentUser?.id)
      .filter((user) => user.username.toLowerCase().includes(query));
  }, [users, currentUser?.id, searchQuery, hasSearchQuery]);

  const toggleMember = (userId: string) => {
    setSelectedIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Enter a group name");
      return;
    }

    if (selectedIds.length === 0) {
      toast.error("Select at least one member");
      return;
    }

    try {
      const chat = await createGroupChat({
        name: groupName.trim(),
        participantIds: selectedIds,
      }).unwrap();

      onSelectChat(chat.id);
      onChatStarted();
      onClose();
      toast.success("Group created");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not create group"));
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
          <h2 className="text-lg font-semibold">New group</h2>
          <p className="mt-0.5 text-sm text-muted">Add a name and select members</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-muted transition hover:bg-primary"
          aria-label="Close new group"
        >
          <HiXMark className="h-5 w-5" />
        </button>
      </header>

      <div className={`space-y-4 ${isOverlay ? "px-4 py-3" : "px-6 py-4"}`}>
        <input
          type="text"
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          placeholder="Group name"
          className="w-full rounded-2xl border border-secondary/10 bg-tertiary px-4 py-3 text-sm text-secondary outline-none placeholder:text-muted focus:border-secondary/20"
        />

        <div className="flex items-center gap-2 rounded-xl border border-secondary/10 bg-tertiary px-3 py-2.5">
          <HiMagnifyingGlass className="h-4 w-4 shrink-0 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users by usernames"
            className="w-full bg-transparent text-sm text-secondary outline-none placeholder:text-muted"
          />
        </div>

        {selectedIds.length > 0 && (
          <p className="text-sm text-muted">{selectedIds.length} member(s) selected</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 md:px-4">
        {!hasSearchQuery ? null : isLoading ? (
          <p className="px-2 py-8 text-center text-sm text-muted">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted">No users found</p>
        ) : (
          <ul>
            {filteredUsers.map((user) => {
              const isSelected = selectedIds.includes(user.id);

              return (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => toggleMember(user.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      isSelected ? "bg-primary" : "hover:bg-tertiary"
                    }`}
                  >
                    <UserAvatar name={getUserDisplayName(user)} avatarUrl={user.avatarUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-secondary">
                        {getUserDisplayName(user)}
                      </p>
                      <p className="truncate text-sm text-muted">@{user.username}</p>
                    </div>
                    <span
                      className={`h-5 w-5 rounded-full border ${
                        isSelected
                          ? "border-secondary bg-secondary"
                          : "border-secondary/20 bg-primary"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={`border-t border-secondary/10 bg-tertiary ${isOverlay ? "p-4" : "p-6"}`}>
        <button
          type="button"
          disabled={isCreating}
          onClick={() => void handleCreateGroup()}
          className="w-full rounded-full bg-secondary px-5 py-3 text-sm font-medium text-primary transition hover:opacity-90 disabled:opacity-60"
        >
          {isCreating ? "Creating group..." : "Create group"}
        </button>
      </div>
    </div>
  );
}
