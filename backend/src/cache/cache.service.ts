import { getRedis, isRedisReady } from "../utils/redis.util";

const logCacheError = (operation: string, error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`Redis cache ${operation} failed:`, message);
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!isRedisReady()) {
    return null;
  }

  try {
    const raw = await getRedis()!.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    logCacheError(`get(${key})`, error);
    return null;
  }
};

export const cacheSet = async (key: string, value: unknown, ttlSeconds: number) => {
  if (!isRedisReady()) {
    return;
  }

  try {
    await getRedis()!.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    logCacheError(`set(${key})`, error);
  }
};

export const cacheDelete = async (key: string) => {
  if (!isRedisReady()) {
    return;
  }

  try {
    await getRedis()!.del(key);
  } catch (error) {
    logCacheError(`del(${key})`, error);
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
  } catch (error) {
    logCacheError(`scan/del(${pattern})`, error);
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
