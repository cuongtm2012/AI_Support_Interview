import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const buckets = new Map<string, { count: number; resetAt: number }>();

let upstashLimiter: Ratelimit | null = null;

function getUpstashLimiter(): Ratelimit | null {
  if (upstashLimiter !== null) return upstashLimiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    upstashLimiter = null;
    return null;
  }

  upstashLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(120, "1 m"),
    prefix: "ic:rl",
  });
  return upstashLimiter;
}

function checkRateLimitMemory(
  key: string,
  limit = 120,
  windowMs = 60_000
): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { ok: true };
}

export async function checkRateLimit(
  key: string,
  limit = 120
): Promise<{ ok: boolean; retryAfterSec?: number }> {
  const upstash = getUpstashLimiter();
  if (upstash) {
    const result = await upstash.limit(key);
    if (result.success) return { ok: true };
    return {
      ok: false,
      retryAfterSec: Math.ceil((result.reset - Date.now()) / 1000),
    };
  }
  return checkRateLimitMemory(key, limit);
}

export function getRateLimitKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "anonymous";
  const path = new URL(req.url).pathname;
  return `${ip}:${path}`;
}
