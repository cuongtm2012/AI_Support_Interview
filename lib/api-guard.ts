import { NextResponse } from "next/server";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export function rateLimitResponse(req: Request): NextResponse | null {
  const { ok, retryAfterSec } = checkRateLimit(getRateLimitKey(req));
  if (ok) return null;

  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec ?? 60),
      },
    }
  );
}
