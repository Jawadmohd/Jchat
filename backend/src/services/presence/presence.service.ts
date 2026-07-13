import { cacheKeys } from "../../cache";
import { User } from "../../models";
import { getRedis, isRedisReady } from "../../utils/redis.util";

const localOnlineUsers = new Map<string, number>();

export const setUserOnline = async (userId: string) => {
  if (isRedisReady()) {
    const redis = getRedis()!;
    const connectionKey = cacheKeys.presenceConnections(userId);
    const connectionCount = await redis.incr(connectionKey);

    if (connectionCount === 1) {
      await redis.sadd(cacheKeys.presenceOnline(), userId);
    }

    return;
  }

  localOnlineUsers.set(userId, (localOnlineUsers.get(userId) ?? 0) + 1);
};

export const setUserOffline = async (userId: string) => {
  if (isRedisReady()) {
    const redis = getRedis()!;
    const connectionKey = cacheKeys.presenceConnections(userId);
    const connectionCount = await redis.decr(connectionKey);

    if (connectionCount <= 0) {
      await redis.del(connectionKey);
      await redis.srem(cacheKeys.presenceOnline(), userId);
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      return new Date();
    }

    return null;
  }

  const count = localOnlineUsers.get(userId) ?? 0;

  if (count <= 1) {
    localOnlineUsers.delete(userId);
    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    return new Date();
  }

  localOnlineUsers.set(userId, count - 1);
  return null;
};

export const isUserOnline = async (userId: string) => {
  if (isRedisReady()) {
    const redis = getRedis()!;
    const connectionCount = await redis.get(cacheKeys.presenceConnections(userId));
    return Number(connectionCount ?? 0) > 0;
  }

  return localOnlineUsers.has(userId);
};

export const getOnlineUserIds = async () => {
  if (isRedisReady()) {
    const redis = getRedis()!;
    const userIds = await redis.smembers(cacheKeys.presenceOnline());
    return new Set(userIds);
  }

  return new Set(localOnlineUsers.keys());
};

export const getPresenceForUsers = async (userIds: string[]) => {
  const uniqueIds = [...new Set(userIds)];

  if (uniqueIds.length === 0) {
    return new Map<string, { isOnline: boolean; lastSeen: string | null }>();
  }

  const users = await User.find({ _id: { $in: uniqueIds } }).select("lastSeen").lean();
  const onlineChecks = await Promise.all(uniqueIds.map((userId) => isUserOnline(userId)));
  const onlineSet = new Set(uniqueIds.filter((_, index) => onlineChecks[index]));

  return new Map(
    users.map((user) => [
      user._id.toString(),
      {
        isOnline: onlineSet.has(user._id.toString()),
        lastSeen: user.lastSeen ? new Date(user.lastSeen).toISOString() : null,
      },
    ])
  );
};
