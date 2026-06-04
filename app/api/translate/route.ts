import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/api-guard";
import { getClientApiKey } from "@/lib/server-api-key";

const LANG_MAP: Record<string, string> = {
  en: "en",
  vi: "vi",
};

export async function POST(req: NextRequest) {
  const limited = rateLimitResponse(req);
  if (limited) return limited;

  const apiKey = getClientApiKey(
    req,
    process.env.GOOGLE_TRANSLATE_API_KEY
  );
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Translate API key required (Settings → API Keys)" },
      { status: 401 }
    );
  }

  let body: { text?: string; source?: string; target?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { text, source, target } = body;
  if (!text?.trim()) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const sourceLang = LANG_MAP[source || "en"] || "en";
  const targetLang = LANG_MAP[target || "vi"] || "vi";

  try {
    const url = new URL(
      "https://translation.googleapis.com/language/translate/v2"
    );
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: "text",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Google Translate error: ${errText}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      data?: { translations?: Array<{ translatedText?: string }> };
    };
    const translated =
      data.data?.translations?.[0]?.translatedText || text;

    return NextResponse.json({ translated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
