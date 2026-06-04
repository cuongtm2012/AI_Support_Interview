import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/api-guard";
import { getClientApiKey } from "@/lib/server-api-key";

export async function GET(req: NextRequest) {
  const limited = rateLimitResponse(req);
  if (limited) return limited;

  const apiKey = getClientApiKey(req, process.env.DEEPGRAM_API_KEY);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Deepgram API key required (Settings → API Keys)" },
      { status: 401 }
    );
  }

  try {
    const res = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl_seconds: 3600 }),
    });

    if (res.ok) {
      const data = (await res.json()) as { access_token?: string };
      if (data.access_token) {
        return NextResponse.json({ token: data.access_token });
      }
    }
  } catch {
    // fall through — use key directly for WebSocket subprotocol
  }

  return NextResponse.json({ token: apiKey });
}
