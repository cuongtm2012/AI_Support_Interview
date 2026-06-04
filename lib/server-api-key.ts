import { NextRequest } from "next/server";

const HEADER = "x-api-key";

/** Read API key from client request header, with optional server env fallback for dev. */
export function getClientApiKey(
  req: NextRequest,
  envFallback?: string
): string | null {
  const fromHeader = req.headers.get(HEADER)?.trim();
  if (fromHeader) return fromHeader;
  const fromEnv = envFallback?.trim();
  return fromEnv || null;
}
