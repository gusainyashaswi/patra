import IORedis, { type RedisOptions } from "ioredis";
import { env } from "../config/env.js";

let redisClient: IORedis | null = null;

export function getRedisConnection(options?: RedisOptions): IORedis {
  if (!redisClient || redisClient.status === "end") {
    redisClient = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      ...options,
    });
  }
  return redisClient;
}

export function createRedisClient(options?: RedisOptions): IORedis {
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...options,
  });
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    } finally {
      redisClient = null;
    }
  }
}
