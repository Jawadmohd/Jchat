import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { HiCamera, HiPencilSquare, HiPlus, HiSignal } from "react-icons/hi2";
import {
  useCreateMediaStatusMutation,
  useCreateTextStatusMutation,
  useGetStatusFeedQuery,
} from "../../features/status/statusApi";
import { useAuth } from "../../hooks/useAuth";
import { getSocket } from "../../lib/socket";
import type { StatusItem } from "../../types/api";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { getUserDisplayName } from "../../utils/getUserDisplayName";
import { useAppDispatch } from "../../app/hooks";
import { statusApi } from "../../features/status/statusApi";
import StatusViewer from "./StatusViewer";
import UserAvatar from "./UserAvatar";

const COLORS = ["#111827", "#1e3a5f", "#14532d", "#7c2d12", "#4c1d95", "#831843", "#0f766e"];

export default function StatusPanel() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { data: feed, isLoading } = useGetStatusFeedQuery();
  const [createTextStatus, { isLoading: isCreatingText }] = useCreateTextStatusMutation();
  const [createMediaStatus, { isLoading: isCreatingMedia }] = useCreateMediaStatusMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [viewerStatuses, setViewerStatuses] = useState<StatusItem[] | null>(null);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);

  useEffect(() => {
    const socket = getSocket();

    const invalidate = () => {
      dispatch(statusApi.util.invalidateTags([{ type: "Status", id: "FEED" }]));
    };

    socket.on("status:new", invalidate);
    socket.on("status:deleted", invalidate);

    return () => {
      socket.off("status:new", invalidate);
      socket.off("status:deleted", invalidate);
    };
  }, [dispatch]);

  const myStatuses = feed?.myStatuses ?? [];
  const contacts = feed?.contacts ?? [];
  const hasOwn = myStatuses.length > 0;

  const ringClass = (hasUnviewed: boolean, hasAny: boolean) => {
    if (!hasAny) {
      return "border-secondary/20";
    }

    return hasUnviewed ? "border-secondary" : "border-muted";
  };

  const handleCreateText = async () => {
    try {
      await createTextStatus({ text, backgroundColor: color }).unwrap();
      setText("");
      setComposerOpen(false);
      toast.success("Status posted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to post status"));
    }
  };

  const handleMediaChange = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    try {
      await createMediaStatus({ file }).unwrap();
      toast.success("Status posted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to post status"));
    }
  };

  const empty = !isLoading && !hasOwn && contacts.length === 0;

  const headerHint = useMemo(
    () => (empty ? "Share updates with your contacts" : "Updates disappear after 24 hours"),
    [empty]
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-primary">
      <header className="shrink-0 border-b border-secondary/10 bg-tertiary px-4 py-4 md:px-6">
        <h1 className="text-xl font-semibold text-secondary">Status</h1>
        <p className="mt-1 text-sm text-muted">{headerHint}</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="border-b border-secondary/10 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (hasOwn) {
                  setViewerStatuses(myStatuses);
                  setViewerStartIndex(0);
                } else {
                  setComposerOpen(true);
                }
              }}
              className={`relative rounded-full border-2 p-0.5 ${ringClass(false, hasOwn)}`}
            >
              <UserAvatar
                name={user ? getUserDisplayName(user) : "You"}
                avatarUrl={user?.avatarUrl}
                size="md"
              />
              {!hasOwn && (
                <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-primary">
                  <HiPlus className="h-3.5 w-3.5" />
                </span>
              )}
            </button>

            <div className="min-w-0 flex-1">
              <p className="font-medium text-secondary">My status</p>
              <p className="text-sm text-muted">
                {hasOwn
                  ? `${myStatuses.length} update${myStatuses.length === 1 ? "" : "s"}`
                  : "Tap to add a status update"}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setComposerOpen(true)}
                className="rounded-full p-2 text-muted transition hover:bg-tertiary hover:text-secondary"
                aria-label="Add text status"
              >
                <HiPencilSquare className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCreatingMedia}
                className="rounded-full p-2 text-muted transition hover:bg-tertiary hover:text-secondary disabled:opacity-50"
                aria-label="Add photo status"
              >
                <HiCamera className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="px-4 py-10 text-center text-sm text-muted">Loading statuses...</div>
        ) : empty ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-secondary/10 bg-tertiary">
              <HiSignal className="h-9 w-9 text-muted" />
            </div>
            <h2 className="text-lg font-medium text-secondary">No status updates</h2>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Share a photo or text update. Contacts from your chats will see it for 24 hours.
            </p>
          </div>
        ) : (
          <section className="px-4 py-4 md:px-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Recent updates
            </h2>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted">No updates from contacts yet.</p>
            ) : (
              <ul className="space-y-1">
                {contacts.map((group) => (
                  <li key={group.user.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setViewerStatuses(group.statuses);
                        setViewerStartIndex(0);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-tertiary"
                    >
                      <div
                        className={`rounded-full border-2 p-0.5 ${ringClass(
                          group.hasUnviewed,
                          true
                        )}`}
                      >
                        <UserAvatar
                          name={getUserDisplayName(group.user)}
                          avatarUrl={group.user.avatarUrl}
                          size="md"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-secondary">
                          {getUserDisplayName(group.user)}
                        </p>
                        <p className="truncate text-sm text-muted">
                          {group.statuses.length} update
                          {group.statuses.length === 1 ? "" : "s"} ·{" "}
                          {new Date(
                            group.statuses[group.statuses.length - 1].createdAt
                          ).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {composerOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 md:items-center">
          <div className="w-full max-w-md rounded-2xl bg-primary p-4 shadow-xl">
            <h3 className="text-lg font-semibold text-secondary">New status</h3>
            <div
              className="mt-3 flex min-h-40 items-center justify-center rounded-xl px-4 py-6 text-center"
              style={{ backgroundColor: color }}
            >
              <p className="text-lg text-white">
                {text.trim() || "Type your update..."}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setColor(item)}
                  className={`h-7 w-7 rounded-full border-2 ${
                    color === item ? "border-secondary" : "border-transparent"
                  }`}
                  style={{ backgroundColor: item }}
                  aria-label={`Color ${item}`}
                />
              ))}
            </div>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={700}
              rows={3}
              placeholder="What's on your mind?"
              className="mt-3 w-full rounded-xl border border-secondary/10 bg-tertiary px-3 py-2 text-sm text-secondary outline-none placeholder:text-muted"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="rounded-xl px-4 py-2 text-sm text-muted hover:bg-tertiary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!text.trim() || isCreatingText}
                onClick={() => void handleCreateText()}
                className="rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-primary disabled:opacity-50"
              >
                {isCreatingText ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          void handleMediaChange(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {viewerStatuses && (
        <StatusViewer
          statuses={viewerStatuses}
          startIndex={viewerStartIndex}
          canDelete={viewerStatuses[0]?.author.id === user?.id}
          onClose={() => setViewerStatuses(null)}
        />
      )}
    </div>
  );
}
