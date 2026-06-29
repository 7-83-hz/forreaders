import { Redis } from '@upstash/redis';

let redis = null;

export function getRedis() {
  if (redis) return redis;

  // Vercel's Upstash marketplace integration sets KV_REST_API_URL /
  // KV_REST_API_TOKEN. Some setups instead use the Upstash-native names
  // UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. Check both so this
  // works regardless of which integration path was used.
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}
