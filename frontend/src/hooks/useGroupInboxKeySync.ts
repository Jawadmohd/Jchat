import { useEffect, useRef } from "react";
import { useUpsertE2EEKeysMutation } from "../features/chat/chatApi";
import { shareMissingGroupWrappedKeys } from "../crypto/chatKey";
import { useE2EE } from "../contexts/E2EEContext";
import { useAuth } from "./useAuth";
import type { Chat } from "../types/api";

const getGroupSyncToken = (chat: Chat) => {
  const wrappedUserIds =
    chat.e2eeWrappedKeys
      ?.map((entry) => entry.userId)
      .sort()
      .join(",") ?? "";
  const participantIds = chat.participants
    .map((participant) => participant.id)
    .sort()
    .join(",");

  return `${chat.id}:${wrappedUserIds}:${participantIds}`;
};

export const useGroupInboxKeySync = (chats: Chat[]) => {
  const { user } = useAuth();
  const { isReady } = useE2EE();
  const [upsertE2EEKeys] = useUpsertE2EEKeysMutation();
  const syncedTokensRef = useRef<Set<string>>(new Set());
  const chatsRef = useRef(chats);

  chatsRef.current = chats;

  useEffect(() => {
    if (!user?.id || !isReady) {
      return;
    }

    const groupChats = chatsRef.current.filter(
      (chat) => chat.type === "group" && chat.e2eeEnabled
    );

    for (const chat of groupChats) {
      const syncToken = getGroupSyncToken(chat);

      if (syncedTokensRef.current.has(syncToken)) {
        continue;
      }

      void shareMissingGroupWrappedKeys(chat, user.id, (wrappedKeys) =>
        upsertE2EEKeys({ chatId: chat.id, wrappedKeys }).unwrap()
      )
        .then(() => {
          syncedTokensRef.current.add(syncToken);
        })
        .catch((error) => {
          syncedTokensRef.current.add(syncToken);
          console.warn(
            `Group key sync failed for chat ${chat.id}:`,
            error instanceof Error ? error.message : error
          );
        });
    }
  }, [chats, isReady, upsertE2EEKeys, user?.id]);
};
