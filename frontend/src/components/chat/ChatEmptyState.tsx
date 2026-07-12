import type { User } from "../../types/api";
import UserAvatar from "./UserAvatar";

interface ChatEmptyStateProps {
  user?: User;
}

export default function ChatEmptyState({ user }: ChatEmptyStateProps) {
  if (user) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-primary px-6 text-center">
        <UserAvatar name={user.username} avatarUrl={user.avatarUrl} size="lg" className="mb-5" />
        <h2 className="text-2xl font-semibold text-secondary">{user.username}</h2>
        <p className="mt-2 max-w-sm text-sm text-muted">{user.emailId}</p>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
          Send a message to start the conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-primary px-6 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-secondary/10 bg-tertiary">
        <span className="text-4xl font-bold text-secondary">j</span>
      </div>
      <h2 className="text-2xl font-light text-secondary">jChat Web</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        Send and receive messages without keeping your phone online.
        <br />
        Select a conversation from the sidebar to get started.
      </p>
      <div className="mt-10 flex items-center gap-2 text-xs text-muted">
        <span className="h-2 w-2 rounded-full bg-secondary" />
        End-to-end themed experience
      </div>
    </div>
  );
}
