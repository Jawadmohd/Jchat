import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export const formatPresenceStatus = (user: {
  isOnline?: boolean;
  lastSeen?: string | null;
}): string => {
  if (user.isOnline) {
    return "online";
  }

  if (!user.lastSeen) {
    return "offline";
  }

  const lastSeen = dayjs(user.lastSeen);
  const now = dayjs();

  if (now.diff(lastSeen, "minute") < 1) {
    return "last seen just now";
  }

  if (lastSeen.isSame(now, "day")) {
    return `last seen today at ${lastSeen.format("h:mm A")}`;
  }

  if (lastSeen.isSame(now.subtract(1, "day"), "day")) {
    return `last seen yesterday at ${lastSeen.format("h:mm A")}`;
  }

  return `last seen ${lastSeen.format("D MMM, h:mm A")}`;
};
