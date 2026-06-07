import { NextResponse } from "next/server";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function rateLimitResponse(
  req: Request
): Promise<NextResponse | null> {
  const { ok, retryAfterSec } = await checkRateLimit(getRateLimitKey(req));
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
