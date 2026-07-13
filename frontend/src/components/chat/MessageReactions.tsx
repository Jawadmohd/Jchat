import { useMemo } from "react";
import type { Message, MessageReaction } from "../../types/api";

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "👏"] as const;

interface GroupedReaction {
  emoji: string;
  userIds: string[];
  includesCurrentUser: boolean;
}

export const groupReactions = (
  reactions: MessageReaction[],
  currentUserId?: string
): GroupedReaction[] => {
  const map = new Map<string, string[]>();

  for (const reaction of reactions) {
    const existing = map.get(reaction.emoji) ?? [];
    existing.push(reaction.userId);
    map.set(reaction.emoji, existing);
  }

  return [...map.entries()].map(([emoji, userIds]) => ({
    emoji,
    userIds,
    includesCurrentUser: currentUserId ? userIds.includes(currentUserId) : false,
  }));
};

interface MessageReactionsProps {
  message: Message;
  currentUserId?: string;
  onToggleReaction: (messageId: string, emoji: string) => Promise<void>;
}

export default function MessageReactions({
  message,
  currentUserId,
  onToggleReaction,
}: MessageReactionsProps) {
  const grouped = useMemo(
    () => groupReactions(message.reactions ?? [], currentUserId),
    [message.reactions, currentUserId]
  );

  const currentUserReaction = (message.reactions ?? []).find(
    (reaction) => reaction.userId === currentUserId
  );

  if (grouped.length === 0) {
    return (
      <div className="mt-1 flex flex-wrap gap-1 opacity-0 transition group-hover:opacity-100">
        {REACTION_EMOJIS.slice(0, 4).map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => void onToggleReaction(message.id, emoji)}
            className="rounded-full bg-primary px-1.5 py-0.5 text-sm shadow-sm transition hover:scale-110"
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {grouped.map((group) => (
        <button
          key={group.emoji}
          type="button"
          onClick={() => void onToggleReaction(message.id, group.emoji)}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition hover:scale-105 ${
            group.includesCurrentUser
              ? "border-secondary/30 bg-secondary/10 text-secondary"
              : "border-secondary/10 bg-primary text-secondary"
          }`}
          title={`${group.userIds.length} reaction${group.userIds.length === 1 ? "" : "s"}`}
        >
          <span>{group.emoji}</span>
          <span className="font-medium">{group.userIds.length}</span>
        </button>
      ))}

      <div className="relative flex gap-0.5 opacity-0 transition group-hover:opacity-100">
        {REACTION_EMOJIS.filter((emoji) => emoji !== currentUserReaction?.emoji)
          .slice(0, 3)
          .map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => void onToggleReaction(message.id, emoji)}
              className="rounded-full bg-primary px-1 py-0.5 text-sm shadow-sm transition hover:scale-110"
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
      </div>
    </div>
  );
}
