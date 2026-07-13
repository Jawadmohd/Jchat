import { getRedis, isRedisReady } from "../utils/redis.util";

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!isRedisReady()) {
    return null;
  }

  try {
    const raw = await getRedis()!.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key: string, value: unknown, ttlSeconds: number) => {
  if (!isRedisReady()) {
    return;
  }

  try {
    await getRedis()!.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Cache write failures should not break requests.
  }
};

export const cacheDelete = async (key: string) => {
  if (!isRedisReady()) {
    return;
  }

  try {
    await getRedis()!.del(key);
  } catch {
    // Ignore cache delete failures.
  }
};

export const cacheDeletePattern = async (pattern: string) => {
  if (!isRedisReady()) {
    return;
  }

  const client = getRedis()!;
  let cursor = "0";

  try {
    do {
      const [nextCursor, keys] = await client.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        await client.del(...keys);
      }
    } while (cursor !== "0");
  } catch {
    // Ignore scan/delete failures.
  }
};

export const cacheGetOrSet = async <T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> => {
  const cached = await cacheGet<T>(key);

  if (cached !== null) {
    return cached;
  }

  const value = await fetcher();
  await cacheSet(key, value, ttlSeconds);
  return value;
};
