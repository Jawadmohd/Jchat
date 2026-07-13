import { useEffect, useMemo, useRef, useState } from "react";
import type { Chat } from "../types/chat";
import { useE2EE } from "../contexts/E2EEContext";
import { decryptChatLastMessagePreview } from "../utils/chatPreview";

function getChatsPreviewSignature(chats: Chat[]) {
  return chats
    .map(
      (chat) =>
        `${chat.id}:${chat.lastMessage?.id ?? ""}:${chat.lastMessage?.isEncrypted ? 1 : 0}:${chat.e2eeWrappedKeys?.map((entry) => entry.userId).sort().join(",") ?? ""}`
    )
    .join("|");
}

export function useChatPreviewMap(chats: Chat[], userId?: string) {
  const { isReady } = useE2EE();
  const [previewByChatId, setPreviewByChatId] = useState<Record<string, string>>({});
  const chatsPreviewSignature = useMemo(() => getChatsPreviewSignature(chats), [chats]);
  const chatsRef = useRef(chats);

  chatsRef.current = chats;

  useEffect(() => {
    if (!userId || !isReady || chatsRef.current.length === 0) {
      return;
    }

    let cancelled = false;
    const currentChats = chatsRef.current;

    void Promise.all(
      currentChats.map(async (chat) => {
        const preview = await decryptChatLastMessagePreview(chat, userId);
        return [chat.id, preview] as const;
      })
    ).then((entries) => {
      if (!cancelled) {
        setPreviewByChatId(Object.fromEntries(entries));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [chatsPreviewSignature, isReady, userId]);

  return previewByChatId;
}
