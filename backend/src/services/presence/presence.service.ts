import { User } from "../../models";

const onlineUsers = new Map<string, number>();

export const setUserOnline = (userId: string) => {
  onlineUsers.set(userId, (onlineUsers.get(userId) ?? 0) + 1);
};

export const setUserOffline = async (userId: string) => {
  const count = onlineUsers.get(userId) ?? 0;

  if (count <= 1) {
    onlineUsers.delete(userId);
    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    return new Date();
  }

  onlineUsers.set(userId, count - 1);
  return null;
};

export const isUserOnline = (userId: string) => onlineUsers.has(userId);

export const getOnlineUserIds = () => new Set(onlineUsers.keys());

export const getPresenceForUsers = async (userIds: string[]) => {
  const uniqueIds = [...new Set(userIds)];

  if (uniqueIds.length === 0) {
    return new Map<string, { isOnline: boolean; lastSeen: string | null }>();
  }

  const users = await User.find({ _id: { $in: uniqueIds } }).select("lastSeen").lean();

  return new Map(
    users.map((user) => [
      user._id.toString(),
      {
        isOnline: isUserOnline(user._id.toString()),
        lastSeen: user.lastSeen ? new Date(user.lastSeen).toISOString() : null,
      },
    ])
  );
};
