import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/api-guard";
import { getClientApiKey } from "@/lib/server-api-key";
import type { TranslationProvider } from "@/types";

const LANG_MAP: Record<string, string> = { en: "en", vi: "vi" };
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

const LANG_NAME: Record<string, string> = {
  en: "English",
  vi: "Vietnamese",
};

async function translateGoogle(
  apiKey: string,
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const url = new URL("https://translation.googleapis.com/language/translate/v2");
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
    throw new Error(`Google Translate: ${errText}`);
  }

  const data = (await res.json()) as {
    data?: { translations?: Array<{ translatedText?: string }> };
  };
  return data.data?.translations?.[0]?.translatedText || text;
}

async function translateDeepseek(
  apiKey: string,
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const sourceName = LANG_NAME[sourceLang] || sourceLang;
  const targetName = LANG_NAME[targetLang] || targetLang;

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      temperature: 0.1,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content:
            "You translate interview questions accurately. Reply with ONLY the translated text—no quotes, labels, or explanation.",
        },
        {
          role: "user",
          content: `Translate from ${sourceName} to ${targetName}:\n\n${text}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek translate: ${errText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const out = data.choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error("DeepSeek returned empty translation");
  return out;
}

export async function POST(req: NextRequest) {
  const limited = rateLimitResponse(req);
  if (limited) return limited;

  let body: {
    text?: string;
    source?: string;
    target?: string;
    provider?: TranslationProvider;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { text, source, target, provider = "deepseek" } = body;
  if (!text?.trim()) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  if (provider === "none") {
    return NextResponse.json({ translated: text });
  }

  const sourceLang = LANG_MAP[source || "en"] || "en";
  const targetLang = LANG_MAP[target || "vi"] || "vi";

  if (sourceLang === targetLang) {
    return NextResponse.json({ translated: text });
  }

  const envFallback =
    provider === "google"
      ? process.env.GOOGLE_TRANSLATE_API_KEY
      : process.env.DEEPSEEK_API_KEY;

  const apiKey = getClientApiKey(req, envFallback);
  if (!apiKey) {
    const label =
      provider === "google" ? "Google Translate" : "DeepSeek";
    return NextResponse.json(
      { error: `${label} API key required (Settings → API Keys)` },
      { status: 401 }
    );
  }

  try {
    const translated =
      provider === "google"
        ? await translateGoogle(apiKey, text, sourceLang, targetLang)
        : await translateDeepseek(apiKey, text, sourceLang, targetLang);

    return NextResponse.json({ translated, provider });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
