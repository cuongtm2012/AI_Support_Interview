import { NextRequest } from "next/server";

export const API_KEY_HEADER = "x-api-key";

/** Read API key from header, Authorization Bearer, body, or env fallback. */
export function getClientApiKey(
  req: NextRequest,
  envFallback?: string,
  body?: { apiKey?: string }
): string | null {
  const fromHeader = req.headers.get(API_KEY_HEADER)?.trim();
  if (fromHeader) return fromHeader;

  const auth = req.headers.get("authorization")?.trim();
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  const fromBody = body?.apiKey?.trim();
  if (fromBody) return fromBody;

  const fromEnv = envFallback?.trim();
  return fromEnv || null;
}
