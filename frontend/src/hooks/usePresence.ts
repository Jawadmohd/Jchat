import { useEffect, useState } from "react";
import { getSocket } from "../lib/socket";
import type { PresenceUpdateEvent } from "../types/api";

export const usePresence = () => {
  const [presenceMap, setPresenceMap] = useState<
    Record<string, { isOnline: boolean; lastSeen: string | null }>
  >({});

  useEffect(() => {
    const socket = getSocket();

    const handlePresenceUpdate = (event: PresenceUpdateEvent) => {
      setPresenceMap((current) => ({
        ...current,
        [event.userId]: {
          isOnline: event.isOnline,
          lastSeen: event.lastSeen,
        },
      }));
    };

    socket.on("presence:update", handlePresenceUpdate);

    return () => {
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, []);

  const getPresence = (userId: string | undefined) => {
    if (!userId) {
      return { isOnline: false, lastSeen: null as string | null };
    }

    return presenceMap[userId] ?? { isOnline: false, lastSeen: null };
  };

  const mergePresence = <T extends { id: string; isOnline?: boolean; lastSeen?: string | null }>(
    user: T | null | undefined
  ): T | null => {
    if (!user) {
      return null;
    }

    const live = presenceMap[user.id];

    if (!live) {
      // No live socket update yet — keep API presence as-is (now live from server).
      return user;
    }

    return {
      ...user,
      isOnline: live.isOnline,
      lastSeen: live.lastSeen,
    };
  };

  return { getPresence, mergePresence, presenceMap };
};
