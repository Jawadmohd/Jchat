import type { Chat, Message, ReadReceiptBreakdown, User } from "../../types/api";
import { buildReadReceiptBreakdown } from "../../utils/readReceipts";
import { getUserDisplayName } from "../../utils/getUserDisplayName";
import { formatChatTime } from "../../utils/formatChatTime";
import UserAvatar from "./UserAvatar";

interface ReadReceiptsListProps {
  title: string;
  users: Array<{ user: User; readAt?: string }>;
  emptyLabel?: string;
}

function ReadReceiptsList({ title, users, emptyLabel }: ReadReceiptsListProps) {
  if (users.length === 0 && emptyLabel) {
    return (
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
        <p className="text-sm text-muted">{emptyLabel}</p>
      </section>
    );
  }

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <ul className="space-y-2">
        {users.map(({ user, readAt }) => (
          <li key={user.id} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar
                name={getUserDisplayName(user)}
                avatarUrl={user.avatarUrl}
                size="sm"
              />
              <span className="truncate text-sm font-medium text-secondary">
                {getUserDisplayName(user)}
              </span>
            </div>
            {readAt && (
              <span className="shrink-0 text-xs text-muted">{formatChatTime(readAt)}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

interface ReadReceiptsModalProps {
  message: Message;
  chat: Chat;
  onClose: () => void;
}

export default function ReadReceiptsModal({ message, chat, onClose }: ReadReceiptsModalProps) {
  const breakdown: ReadReceiptBreakdown = buildReadReceiptBreakdown(message, chat);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close read receipts"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="read-receipts-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-primary shadow-xl"
      >
        <header className="border-b border-secondary/10 px-4 py-3">
          <h2 id="read-receipts-title" className="text-base font-semibold text-secondary">
            Read receipts
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {breakdown.readCount} read · {breakdown.deliveredCount} delivered
          </p>
        </header>

        <div className="max-h-[min(60vh,24rem)] space-y-5 overflow-y-auto p-4">
          <ReadReceiptsList
            title={`Read by (${breakdown.readCount})`}
            users={breakdown.readBy}
            emptyLabel="No one has read this message yet."
          />

          <ReadReceiptsList
            title={`Delivered to (${breakdown.deliveredCount})`}
            users={breakdown.deliveredTo.map((user) => ({ user }))}
            emptyLabel="Everyone has read this message."
          />
        </div>

        <footer className="border-t border-secondary/10 p-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-tertiary py-2.5 text-sm font-medium text-secondary transition hover:bg-secondary/10"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
