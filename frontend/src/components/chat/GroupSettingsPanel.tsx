import { useState } from "react";
import toast from "react-hot-toast";
import { HiMagnifyingGlass, HiUserMinus, HiXMark } from "react-icons/hi2";
import {
  useAddGroupMembersMutation,
  useLeaveGroupMutation,
  useRemoveGroupMemberMutation,
  useRenameGroupMutation,
} from "../../features/chat/chatApi";
import { useUserSearch } from "../../hooks/useUserSearch";
import { useAuth } from "../../hooks/useAuth";
import type { Chat } from "../../types/api";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { getUserDisplayName } from "../../utils/getUserDisplayName";
import GroupAvatar from "./GroupAvatar";
import UserAvatar from "./UserAvatar";

interface GroupSettingsPanelProps {
  chat: Chat;
  onClose: () => void;
  onLeftGroup: () => void;
}

export default function GroupSettingsPanel({
  chat,
  onClose,
  onLeftGroup,
}: GroupSettingsPanelProps) {
  const { user } = useAuth();
  const [renameGroup, { isLoading: isRenaming }] = useRenameGroupMutation();
  const [addMembers, { isLoading: isAdding }] = useAddGroupMembersMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveGroupMemberMutation();
  const [leaveGroup, { isLoading: isLeaving }] = useLeaveGroupMutation();

  const [groupName, setGroupName] = useState(chat.name ?? "");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddMembers, setShowAddMembers] = useState(false);

  const excludeIds = [
    ...(user?.id ? [user.id] : []),
    ...chat.participants.map((participant) => participant.id),
  ];

  const { users: availableUsers, isLoading: isSearchingUsers, hasSearchQuery } = useUserSearch(
    memberSearch,
    { excludeIds }
  );

  const handleRename = async () => {
    const trimmed = groupName.trim();

    if (!trimmed || trimmed === chat.name) {
      return;
    }

    try {
      await renameGroup({ chatId: chat.id, name: trimmed }).unwrap();
      toast.success("Group renamed");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to rename group"));
    }
  };

  const handleAddMembers = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    try {
      await addMembers({ chatId: chat.id, participantIds: selectedIds }).unwrap();
      toast.success("Members added");
      setSelectedIds([]);
      setShowAddMembers(false);
      setMemberSearch("");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add members"));
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const member = chat.participants.find((participant) => participant.id === memberId);
    const label = member ? getUserDisplayName(member) : "this member";
    const confirmed = window.confirm(`Remove ${label} from the group?`);

    if (!confirmed) {
      return;
    }

    try {
      await removeMember({ chatId: chat.id, memberId }).unwrap();
      toast.success("Member removed");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove member"));
    }
  };

  const handleLeave = async () => {
    const confirmed = window.confirm("Leave this group?");

    if (!confirmed) {
      return;
    }

    try {
      await leaveGroup(chat.id).unwrap();
      toast.success("You left the group");
      onLeftGroup();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to leave group"));
    }
  };

  const toggleSelected = (userId: string) => {
    setSelectedIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-primary">
      <header className="flex shrink-0 items-center justify-between border-b border-secondary/10 bg-tertiary px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <GroupAvatar name={chat.displayName} size="sm" />
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-secondary">Group info</h2>
            <p className="text-xs text-muted">{chat.participants.length} members</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-muted transition hover:bg-primary hover:text-secondary"
          aria-label="Close group settings"
        >
          <HiXMark className="h-5 w-5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <section className="space-y-3">
          <label className="block text-sm font-medium text-secondary" htmlFor="group-name">
            Group name
          </label>
          <div className="flex gap-2">
            <input
              id="group-name"
              type="text"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              disabled={!chat.isAdmin || isRenaming}
              maxLength={100}
              className="flex-1 rounded-xl border border-secondary/10 bg-tertiary px-3 py-2 text-sm text-secondary outline-none focus:border-secondary/30 disabled:opacity-60"
            />
            {chat.isAdmin && (
              <button
                type="button"
                onClick={() => void handleRename()}
                disabled={isRenaming || !groupName.trim() || groupName.trim() === chat.name}
                className="rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-primary transition hover:opacity-90 disabled:opacity-50"
              >
                Save
              </button>
            )}
          </div>
          {!chat.isAdmin && (
            <p className="text-xs text-muted">Only admins can rename the group.</p>
          )}
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-secondary">Members</h3>
            {chat.isAdmin && (
              <button
                type="button"
                onClick={() => setShowAddMembers((open) => !open)}
                className="text-sm font-medium text-secondary underline-offset-2 hover:underline"
              >
                {showAddMembers ? "Cancel" : "Add members"}
              </button>
            )}
          </div>

          {showAddMembers && chat.isAdmin && (
            <div className="mb-4 space-y-3 rounded-2xl border border-secondary/10 bg-tertiary p-3">
              <div className="relative">
                <HiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Search users"
                  className="w-full rounded-xl border border-secondary/10 bg-primary py-2 pl-9 pr-3 text-sm text-secondary outline-none"
                />
              </div>

              <div className="max-h-40 space-y-1 overflow-y-auto">
                {!hasSearchQuery ? (
                  <p className="px-1 py-2 text-xs text-muted">Start typing to search for users</p>
                ) : isSearchingUsers ? (
                  <p className="px-1 py-2 text-xs text-muted">Searching users...</p>
                ) : availableUsers.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-muted">No users to add</p>
                ) : (
                  availableUsers.map((candidate) => {
                    const isSelected = selectedIds.includes(candidate.id);

                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => toggleSelected(candidate.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${
                          isSelected ? "bg-secondary text-primary" : "hover:bg-primary"
                        }`}
                      >
                        <UserAvatar
                          name={getUserDisplayName(candidate)}
                          avatarUrl={candidate.avatarUrl}
                          size="sm"
                        />
                        <span className="truncate text-sm">{getUserDisplayName(candidate)}</span>
                      </button>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                onClick={() => void handleAddMembers()}
                disabled={isAdding || selectedIds.length === 0}
                className="w-full rounded-xl bg-secondary py-2 text-sm font-medium text-primary transition hover:opacity-90 disabled:opacity-50"
              >
                {isAdding ? "Adding..." : `Add ${selectedIds.length || ""} member${selectedIds.length === 1 ? "" : "s"}`}
              </button>
            </div>
          )}

          <ul className="space-y-1">
            {chat.participants.map((participant) => {
              const isSelf = participant.id === user?.id;
              const isAdmin = chat.adminIds.includes(participant.id);
              const canRemove =
                chat.isAdmin && !isSelf && chat.participants.length > 2;

              return (
                <li
                  key={participant.id}
                  className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-tertiary"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar
                      name={getUserDisplayName(participant)}
                      avatarUrl={participant.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-secondary">
                        {getUserDisplayName(participant)}
                        {isSelf && <span className="text-muted"> (you)</span>}
                      </p>
                      {isAdmin && <p className="text-xs text-muted">Admin</p>}
                    </div>
                  </div>

                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => void handleRemoveMember(participant.id)}
                      disabled={isRemoving}
                      className="rounded-full p-2 text-muted transition hover:bg-primary hover:text-red-600 disabled:opacity-50"
                      aria-label={`Remove ${getUserDisplayName(participant)}`}
                    >
                      <HiUserMinus className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-8">
          <button
            type="button"
            onClick={() => void handleLeave()}
            disabled={isLeaving}
            className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {isLeaving ? "Leaving..." : "Leave group"}
          </button>
        </section>
      </div>
    </div>
  );
}
