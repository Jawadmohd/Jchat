import Redis from "ioredis";

let redis: Redis | null = null;

export const connectRedis = async (): Promise<Redis | null> => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn("REDIS_URL not set — Redis caching disabled");
    return null;
  }

  if (redis) {
    return redis;
  }

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  client.on("error", (error) => {
    console.error("Redis error:", error.message);
  });

  try {
    await client.connect();
    redis = client;
    console.log("Redis connected");
    return redis;
  } catch (error) {
    console.error("Failed to connect to Redis — caching disabled:", error);
    await client.quit().catch((quitError) => {
      console.warn(
        "Failed to close Redis client after connect error:",
        quitError instanceof Error ? quitError.message : String(quitError)
      );
    });
    return null;
  }
};

export const getRedis = () => redis;

export const isRedisReady = () => redis?.status === "ready";

export const disconnectRedis = async () => {
  if (!redis) {
    return;
  }

  await redis.quit();
  redis = null;
};
